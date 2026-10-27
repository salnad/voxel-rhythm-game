import * as THREE from 'three';
import type { Action } from '../chart/types';
import { ACTION_SPECS } from '../config/actions';
import { HERO_ANIM, HIT_REACT, MOVE_CLIPS, READY } from '../config/heroAnimation';
import { PALETTE, SWORD_FX, TRAIL } from '../config/visuals';
import { TABLE_SHAPES, type AttackModifiers } from '../synth/modifiers';
import { RIG, type CharacterRig } from './character';
import { Trail } from './effects';
import {
  CHANNELS,
  clamp01,
  clipTime,
  copyPose,
  groupOf,
  lerpPose,
  makePose,
  sampleClip,
  smoothstep,
  type HeroPose,
  type MoveClip,
} from './heroPose';

const READY_POSE = makePose(READY);
const ZERO_POSE = makePose();
const HIT_REACT_CLIP: MoveClip = {
  keys: HIT_REACT,
  coil: 0,
  anticipation: 0,
  hold: 0,
  hitStop: 0,
  end: HIT_REACT[HIT_REACT.length - 1]!.t,
  cut: [0, 0],
};
const FOLLOW_RATE: Record<(typeof TABLE_SHAPES)[number], number> = {
  sine: 0.9,
  triangle: 1,
  saw: 1.15,
  square: 1,
};

const AX = new THREE.Vector3(1, 0, 0);
const AY = new THREE.Vector3(0, 1, 0);
const AZ = new THREE.Vector3(0, 0, 1);
const NEG_Z = new THREE.Vector3(0, 0, -1);
const TAU = Math.PI * 2;
const HURT_COLOR = new THREE.Color(0.9, 0, 0.15);
const wrapAngle = (a: number) => a - TAU * Math.round(a / TAU);

/** The cue the hero is reading on the highway: the move it will most likely play next. */
export interface Anticipation {
  action: Action;
  /** Seconds until the cue (negative once it has passed unpressed). */
  timeTo: number;
  /** Seconds between the previous cue (or key press) and this one. */
  gap: number;
}

interface Play {
  action: Action;
  clip: MoveClip;
  start: number;
  hit: boolean;
  holding: boolean;
  releasedAt: number | null;
  /** Displayed pose when the move started; the body blends out of it. */
  from: HeroPose;
  /** The clip's contact frame (fast chains shrink the move toward it). */
  contact: HeroPose;
  /** 0 = pressed right after the previous move (fast chain), 1 = relaxed tempo. */
  pace: number;
}

interface Echo {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
}

/**
 * Plays the hero's moves from the clips in config/heroAnimation.ts. A key press starts its
 * move on the contact frame, so the strike lands on input; the swing that led there is drawn
 * as a smear. While a cue approaches the hero coils into that move's anticipation. Hits add a
 * hit-stop. A new move interrupts the current one: the blade snaps to the new contact frame
 * and the body blends. Synth modifiers shape the moves a little (see SWORD_FX).
 */
export class HeroAnimator {
  private play: Play | null = null;
  private slashCount = 0;
  private lastPress = -Infinity;
  private hurtAt = -Infinity;
  private hitGlowAt = -Infinity;
  private hitGlowColor = new THREE.Color();
  private lastSample = -Infinity;
  private readonly trail: Trail;
  private readonly echoes: Echo[] = [];
  private readonly history: Array<{ t: number; m: THREE.Matrix4 }> = [];
  private readonly pose = makePose();
  private readonly tmpPose = makePose();
  private readonly tmpPose2 = makePose();
  private readonly v1 = new THREE.Vector3();
  private readonly v2 = new THREE.Vector3();
  private readonly v4 = new THREE.Vector3();
  private readonly q1 = new THREE.Quaternion();
  private readonly q2 = new THREE.Quaternion();
  private readonly m1 = new THREE.Matrix4();
  private readonly m2 = new THREE.Matrix4();
  private readonly swordQ = new THREE.Quaternion();
  private readonly materia: THREE.MeshStandardMaterial;
  private readonly baseEmissive = new Map<THREE.MeshStandardMaterial, THREE.Color>();
  /** Dev aid: freeze the hero on one frame of a clip. */
  debugPose: { action: Action; variant?: number; u: number } | null = null;

  constructor(
    scene: THREE.Scene,
    private readonly hero: CharacterRig,
  ) {
    this.trail = new Trail(scene);
    this.materia = hero.materiaMaterial;
    for (const m of hero.materials) {
      if (m !== hero.bladeMaterial && m !== hero.materiaMaterial)
        this.baseEmissive.set(m, m.emissive.clone());
    }
    for (let i = 0; i < SWORD_FX.echoMax; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: PALETTE.green,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(hero.bladeGeometry, mat);
      mesh.matrixAutoUpdate = false;
      mesh.visible = false;
      scene.add(mesh);
      this.echoes.push({ mesh, mat });
    }
    this.applyPose(READY_POSE);
  }

  get current(): Action | null {
    return this.play?.action ?? null;
  }

  get holding(): boolean {
    return this.play?.holding ?? false;
  }

  /** Which clip the next press of `action` plays (slash alternates). */
  private clipFor(action: Action, advance: boolean): MoveClip {
    const clips = MOVE_CLIPS[action];
    if (action !== 'slash') return clips[0]!;
    const i = this.slashCount % clips.length;
    if (advance) this.slashCount++;
    return clips[i]!;
  }

  /** Start a move at time `t` (the key press). */
  start(action: Action, t: number, mods: AttackModifiers): void {
    const clip = this.clipFor(action, true);
    const from = copyPose(this.pose, makePose());
    from.bodyYaw = wrapAngle(from.bodyYaw);
    const contact = sampleClip(clip, 0, READY_POSE, makePose());
    this.shape(action, contact, mods);
    const A = HERO_ANIM;
    const pace = clamp01((t - this.lastPress - A.fastInterval) / (A.slowInterval - A.fastInterval));
    this.play = {
      action,
      clip,
      start: t,
      hit: false,
      holding: false,
      releasedAt: null,
      from,
      contact,
      pace,
    };
    this.lastPress = t;
    this.lastSample = t;
    this.trail.setColor(ACTION_SPECS[action].color, 0, 0.6);
    this.trail.stepped = mods.shapeWeights[3] * TRAIL.jitter;
    if (clip.cut[1] > clip.cut[0] && clip.cut[0] <= 0) this.smear(clip, from, t, mods);
  }

  /** The move connected with a cue: hit-stop, blade flash; `hold` keeps the contact pose. */
  connect(action: Action, hold: boolean): void {
    const p = this.play;
    if (!p || p.action !== action) return;
    p.hit = true;
    if (hold) p.holding = true;
    this.hitGlowAt = p.start;
    this.hitGlowColor.set(ACTION_SPECS[action].color);
  }

  release(t: number): void {
    if (this.play?.holding) {
      this.play.holding = false;
      this.play.releasedAt = t;
    }
  }

  /** The hero took a hit. */
  hurt(t: number): void {
    this.hurtAt = t;
  }

  /** World position of the blade tip. */
  bladeTip(out = new THREE.Vector3()): THREE.Vector3 {
    return this.hero.bladeTip.getWorldPosition(out);
  }

  private followRate(mods: AttackModifiers): number {
    let r = 0;
    TABLE_SHAPES.forEach((s, i) => (r += (mods.shapeWeights[i] ?? 0) * FOLLOW_RATE[s]));
    return 1 + (r - 1) * SWORD_FX.followAmount;
  }

  private playClipTime(p: Play, t: number, mods: AttackModifiers): number {
    const fast = 1 - p.pace;
    return clipTime(p.clip, t - p.start, {
      hit: p.hit,
      holding: p.holding,
      releasedAge: p.releasedAt === null ? null : t - p.releasedAt,
      followScale: this.followRate(mods) * (1 + fast * HERO_ANIM.fastFollowBoost),
      stopScale: 1 - fast * (1 - HERO_ANIM.fastStopScale),
    });
  }

  private stopTime(p: Play): number {
    return p.clip.hitStop * (1 - (1 - p.pace) * (1 - HERO_ANIM.fastStopScale));
  }

  /** Synth shaping applied to a sampled move pose. */
  private shape(action: Action, pose: HeroPose, mods: AttackModifiers): void {
    if (action === 'slash' || action === 'flourish') {
      pose.swordYaw *= 1 + (mods.arcScale - 1) * SWORD_FX.arcAmount;
    } else if (action === 'stab') {
      const k = 1 + (mods.stabLunge - 1) * SWORD_FX.lungeAmount;
      pose.pelvisZ *= k;
      pose.footLZ *= k;
      pose.handZ = READY_POSE.handZ + (pose.handZ - READY_POSE.handZ) * (0.6 + 0.4 * k);
    }
  }

  /** Pose of the current move at time t, blended out of the pose it interrupted. */
  private movePose(p: Play, t: number, mods: AttackModifiers, out: HeroPose): HeroPose {
    const u = this.playClipTime(p, t, mods);
    sampleClip(p.clip, u, READY_POSE, out);
    this.shape(p.action, out, mods);
    // fast chains: smaller follow-through, staying near the contact frame
    const damp = (1 - p.pace) * HERO_ANIM.fastDamp * (1 - smoothstep(u / p.clip.end));
    if (damp > 0) lerpPose(out, p.contact, damp, out);
    const age = t - p.start;
    const b = HERO_ANIM.blendIn;
    for (const c of CHANNELS) {
      const span = b[groupOf(c)];
      if (span <= 0 || age >= span) continue;
      const k = smoothstep(age / span);
      out[c] = p.from[c] + (out[c] - p.from[c]) * k;
    }
    return out;
  }

  /** The full displayed pose at time t (before applying it to the rig). */
  private compose(t: number, mods: AttackModifiers, bob: number, ant: Anticipation | null): void {
    const pose = this.pose;
    const p = this.play;
    if (this.debugPose) {
      const clips = MOVE_CLIPS[this.debugPose.action];
      const clip = clips[(this.debugPose.variant ?? 0) % clips.length]!;
      sampleClip(clip, this.debugPose.u, READY_POSE, pose);
      this.shape(this.debugPose.action, pose, mods);
      return;
    }
    if (p) this.movePose(p, t, mods, pose);
    else copyPose(READY_POSE, pose);

    // anticipation: coil toward the upcoming cue's wind-up
    if (ant && !(p && (p.holding || t - p.start < this.stopTime(p)))) {
      const clip = this.clipFor(ant.action, false);
      const window = Math.min(clip.anticipation, ant.gap * HERO_ANIM.anticipationGapFraction);
      let w = 0;
      if (window > 0.02 && ant.timeTo > 0) w = smoothstep(1 - ant.timeTo / window);
      else if (ant.timeTo <= 0) w = 1 - smoothstep(-ant.timeTo / HERO_ANIM.anticipationRelease);
      if (w > 0) {
        sampleClip(clip, clip.coil, READY_POSE, this.tmpPose);
        this.shape(ant.action, this.tmpPose, mods);
        this.tmpPose.bodyYaw = pose.bodyYaw;
        lerpPose(pose, this.tmpPose, w, pose);
      }
    }

    // idle life: breathing, beat bob, sword sway (fades out during moves)
    const idle = p ? 0 : 1;
    const breath = Math.sin(t * TAU * HERO_ANIM.breathHz);
    pose.spinePitch += breath * HERO_ANIM.breathDepth;
    pose.handY += breath * HERO_ANIM.breathDepth * 0.5;
    pose.leftY += breath * HERO_ANIM.breathDepth * 0.6 * idle;
    pose.handZ += Math.sin(t * TAU * HERO_ANIM.breathHz * 0.5 + 1) * HERO_ANIM.breathDepth * idle;
    pose.pelvisY -= HERO_ANIM.beatBob * bob * idle;
    pose.swordYaw += Math.sin(t * TAU * HERO_ANIM.breathHz * 0.5) * HERO_ANIM.swordSway * idle;

    // hit react (additive)
    const hurtAge = t - this.hurtAt;
    if (hurtAge >= 0 && hurtAge < HIT_REACT_CLIP.end) {
      sampleClip(HIT_REACT_CLIP, hurtAge, ZERO_POSE, this.tmpPose2);
      for (const c of CHANNELS) pose[c] += this.tmpPose2[c];
    }

    if (p?.holding) {
      pose.swordYaw += Math.sin(t * TAU * HERO_ANIM.lockTrembleHz) * HERO_ANIM.lockTremble;
      pose.handZ += Math.sin(t * TAU * HERO_ANIM.lockTrembleHz * 0.7) * HERO_ANIM.lockTremble * 0.3;
    }
    if (p?.hit && t - p.start < this.stopTime(p)) {
      const s = HERO_ANIM.hitStopShake;
      pose.handX += Math.sin(t * 610) * s;
      pose.handY += Math.cos(t * 470) * s;
    }
    pose.headYaw -= pose.spineYaw * HERO_ANIM.headCounterTwist;
  }

  // ------------------------------------------------------------------ rig

  private readonly basis = new THREE.Matrix4();
  private readonly bx = new THREE.Vector3();
  private readonly by = new THREE.Vector3();
  private readonly bz = new THREE.Vector3();
  private readonly ikD = new THREE.Vector3();
  private readonly ikPerp = new THREE.Vector3();
  private readonly toArm = new THREE.Vector3();
  private readonly wristTarget = new THREE.Vector3();
  private readonly leftTarget = new THREE.Vector3();
  private readonly onSword = new THREE.Vector3();
  private readonly flatN = new THREE.Vector3();

  /** Aim a bone group's +Y from `a` to `b`, with its +Z toward `pole`. */
  private placeBone(o: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, pole: THREE.Vector3) {
    const y = this.by.subVectors(b, a).normalize();
    const z = this.bz.copy(pole).addScaledVector(y, -pole.dot(y)).normalize();
    const x = this.bx.crossVectors(y, z);
    this.basis.makeBasis(x, y, z);
    o.position.copy(a);
    o.quaternion.setFromRotationMatrix(this.basis);
  }

  /**
   * Two-bone IK from `root` toward `target` (lengths a, b), elbow/knee toward `pole`.
   * Writes the joint and the reached end point; returns false if the target was out of reach.
   */
  private solveIK(
    root: THREE.Vector3,
    target: THREE.Vector3,
    a: number,
    b: number,
    pole: THREE.Vector3,
    joint: THREE.Vector3,
    end: THREE.Vector3,
  ): boolean {
    const d = this.ikD.subVectors(target, root);
    let len = d.length();
    const reach = a + b - 1e-4;
    const inReach = len <= reach;
    len = Math.min(reach, Math.max(Math.abs(a - b) + 1e-4, len));
    const dir = d.normalize();
    const cosA = (a * a + len * len - b * b) / (2 * a * len);
    const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    const perp = this.ikPerp.copy(pole).addScaledVector(dir, -pole.dot(dir)).normalize();
    joint
      .copy(root)
      .addScaledVector(dir, a * cosA)
      .addScaledVector(perp, a * sinA);
    end.copy(root).addScaledVector(dir, len);
    return inReach;
  }

  private readonly ikJoint = new THREE.Vector3();
  private readonly ikEnd = new THREE.Vector3();
  private readonly shoulder = new THREE.Vector3();
  private readonly grip = new THREE.Vector3();
  private readonly hip = new THREE.Vector3();
  private readonly ankle = new THREE.Vector3();
  private readonly poleArmR = new THREE.Vector3(-0.5, -1, -0.35);
  private readonly poleArmL = new THREE.Vector3(0.5, -1, -0.35);
  private readonly poleLeg = new THREE.Vector3(0, 0, 1);

  /** Place an arm: shoulder → wrist IK, the hand `grip` pulled back by the hand length. */
  private placeArm(
    side: 1 | -1,
    segs: [THREE.Object3D, THREE.Object3D],
    shoulderAt: readonly [number, number, number],
    grip: THREE.Vector3,
    pole: THREE.Vector3,
  ): THREE.Vector3 {
    this.shoulder.set(shoulderAt[0], shoulderAt[1], shoulderAt[2]);
    const toArm = this.toArm
      .set(shoulderAt[0] + side * 0.08, shoulderAt[1] - 0.22, shoulderAt[2] - 0.05)
      .sub(grip)
      .normalize();
    const wristTarget = this.wristTarget.copy(grip).addScaledVector(toArm, RIG.hand);
    this.solveIK(
      this.shoulder,
      wristTarget,
      RIG.upperArm,
      RIG.foreArm,
      pole,
      this.ikJoint,
      this.ikEnd,
    );
    // an out-of-reach hand slides along with the clamped wrist
    grip.add(this.ikEnd).sub(wristTarget);
    this.placeBone(segs[0], this.shoulder, this.ikJoint, pole);
    this.placeBone(segs[1], this.ikJoint, this.ikEnd, pole);
    return toArm;
  }

  private placeLeg(
    side: 1 | -1,
    segs: [THREE.Object3D, THREE.Object3D, THREE.Object3D],
    pose: HeroPose,
  ): void {
    const rest = side === 1 ? RIG.footL : RIG.footR;
    const fx = side === 1 ? pose.footLX : pose.footRX;
    const fz = side === 1 ? pose.footLZ : pose.footRZ;
    const lift = side === 1 ? pose.footLLift : pose.footRLift;
    this.hip.set(pose.pelvisX + side * RIG.hipX, RIG.hipY + pose.pelvisY, pose.pelvisZ);
    this.ankle.set(rest[0] + fx, RIG.ankleY + lift, rest[1] + fz);
    this.poleLeg.set(side * 0.15, 0, 1);
    this.solveIK(this.hip, this.ankle, RIG.thigh, RIG.shin, this.poleLeg, this.ikJoint, this.ikEnd);
    this.placeBone(segs[0], this.hip, this.ikJoint, this.poleLeg);
    this.placeBone(segs[1], this.ikJoint, this.ikEnd, this.poleLeg);
    segs[2].position.copy(this.ikEnd);
  }

  private applyPose(pose: HeroPose): void {
    const h = this.hero;
    h.body.rotation.set(0, pose.bodyYaw, 0);
    h.pelvis.position.set(pose.pelvisX, RIG.hipY + pose.pelvisY, pose.pelvisZ);
    h.spine.rotation.set(pose.spinePitch, pose.spineYaw, pose.spineRoll);
    h.head.rotation.set(-pose.headPitch, pose.headYaw, 0);
    this.placeLeg(1, h.legL, pose);
    this.placeLeg(-1, h.legR, pose);

    // sword hand: orientation from the blade angles, position from IK
    this.swordQ
      .setFromAxisAngle(AY, pose.swordYaw)
      .multiply(this.q1.setFromAxisAngle(AX, -pose.swordPitch))
      .multiply(this.q1.setFromAxisAngle(AZ, pose.swordRoll));
    this.grip.set(pose.handX, pose.handY, pose.handZ);
    const toArmR = this.placeArm(-1, h.armR, RIG.shoulderR, this.grip, this.poleArmR);
    h.swordHand.position.copy(this.grip);
    h.swordHand.quaternion.copy(this.swordQ);
    h.gloveR.quaternion
      .copy(this.swordQ)
      .invert()
      .multiply(this.q2.setFromUnitVectors(NEG_Z, toArmR));

    // left hand: free target, or braced on the flat of the blade (palm on the side facing the body)
    const left = this.leftTarget.set(pose.leftX, pose.leftY, pose.leftZ);
    if (pose.leftGrip > 0) {
      const onSword = this.onSword
        .set(0, 0, pose.leftGripZ)
        .applyQuaternion(this.swordQ)
        .add(this.grip);
      const n = this.flatN.set(0, 1, 0).applyQuaternion(this.swordQ);
      if (n.z > 0) n.negate();
      onSword.addScaledVector(n, 0.07);
      left.lerp(onSword, Math.min(1, pose.leftGrip));
    }
    const toArmL = this.placeArm(1, h.armL, RIG.shoulderL, left, this.poleArmL);
    h.leftHand.position.copy(left);
    h.leftHand.quaternion.setFromUnitVectors(NEG_Z, toArmL);
  }

  // ------------------------------------------------------------------ effects

  /** Draw the swing that led into the contact frame as a short smear behind the blade. */
  private smear(clip: MoveClip, from: HeroPose, t: number, mods: AttackModifiers): void {
    const n = TRAIL.smearSamples;
    const coilPose = this.tmpPose;
    for (let i = 0; i <= n; i++) {
      const s = i / n;
      sampleClip(clip, clip.coil + (0 - clip.coil) * s, READY_POSE, coilPose);
      this.shape(this.play!.action, coilPose, mods);
      lerpPose(from, coilPose, Math.min(1, s * 1.6), this.tmpPose2);
      // keep the body at its start so only the blade sweeps
      this.applyPose(this.tmpPose2);
      this.hero.root.updateMatrixWorld(true);
      this.sampleTrail(t - (1 - s) * 0.04);
    }
  }

  private sampleTrail(at: number): void {
    this.hero.bladeBase.getWorldPosition(this.v1);
    this.hero.bladeTip.getWorldPosition(this.v2);
    this.v1.lerp(this.v2, TRAIL.innerEdge);
    this.trail.push(this.v1, this.v2, at);
  }

  private recordHistory(t: number): void {
    const last = this.history[this.history.length - 1];
    if (last && t - last.t < 0.004) return;
    const m = this.history.length > 64 ? this.history.shift()!.m : new THREE.Matrix4();
    this.hero.sword.updateWorldMatrix(true, false);
    m.copy(this.hero.sword.matrixWorld);
    this.history.push({ t, m });
  }

  private matrixAt(t: number): THREE.Matrix4 | null {
    for (let i = this.history.length - 1; i >= 0; i--) {
      if (this.history[i]!.t <= t) return this.history[i]!.m;
    }
    return null;
  }

  private updateEchoes(t: number, mods: AttackModifiers): void {
    const p = this.play;
    const n = Math.min(this.echoes.length, mods.echoCount);
    const u = p ? this.playClipTime(p, t, mods) : 0;
    const active =
      p !== null && p.clip.cut[1] > p.clip.cut[0] && u <= p.clip.cut[1] + 0.06 && u >= 0;
    this.echoes.forEach((e, i) => {
      if (!active || i >= n) {
        e.mesh.visible = false;
        return;
      }
      const k = i + 1;
      const m = this.matrixAt(t - k * mods.echoDelay * SWORD_FX.echoDelayAmount);
      if (!m) {
        e.mesh.visible = false;
        return;
      }
      const side = k % 2 === 1 ? 1 : -1;
      const yaw = side * Math.ceil(k / 2) * mods.echoSpread * SWORD_FX.echoSpreadAmount;
      const pivot = this.v4.setFromMatrixPosition(m);
      this.m1.makeTranslation(pivot.x, pivot.y, pivot.z);
      this.m1.multiply(this.m2.makeRotationY(yaw));
      this.m1.multiply(this.m2.makeTranslation(-pivot.x, -pivot.y, -pivot.z));
      e.mesh.matrix.multiplyMatrices(this.m1, m);
      e.mesh.matrixWorldNeedsUpdate = true;
      e.mesh.visible = true;
      const fade = 1 - Math.max(0, u - p!.clip.cut[1]) / 0.06;
      e.mat.opacity = (SWORD_FX.echoOpacity * fade) / k;
      e.mat.color.set(ACTION_SPECS[p!.action].color);
    });
  }

  // ------------------------------------------------------------------ frame

  /** `bob` is 0..1 on-beat bounce; `ant` the cue the hero is reading, if any. */
  update(t: number, mods: AttackModifiers, bob: number, ant: Anticipation | null = null): void {
    const p = this.play;
    if (p && !p.holding) {
      const u = this.playClipTime(p, t, mods);
      if (u >= p.clip.end) this.play = null;
    }
    const play = this.play;
    if (play && t > this.lastSample) {
      // sub-frame samples for smooth trails and echoes
      const steps = 4;
      const from = Math.max(play.start, this.lastSample);
      for (let k = 1; k <= steps; k++) {
        const st = from + ((t - from) * k) / steps;
        const u = this.playClipTime(play, st, mods);
        this.compose(st, mods, bob, ant);
        this.applyPose(this.pose);
        this.hero.root.updateMatrixWorld(true);
        if (u >= play.clip.cut[0] && u <= play.clip.cut[1]) this.sampleTrail(st);
        this.recordHistory(st);
      }
      this.lastSample = t;
    }
    this.compose(t, mods, bob, ant);
    this.applyPose(this.pose);
    this.hero.sword.scale.set(1, 1, 1 + (mods.reach - 1.1) * SWORD_FX.reachAmount);
    this.hero.root.updateMatrixWorld(true);
    if (!play) this.recordHistory(t);
    this.trail.update(t);
    this.updateEchoes(t, mods);

    // blade glows only on a connect; materia slots glow softly with the cutoff
    const g = Math.max(0, 1 - (t - this.hitGlowAt) / SWORD_FX.hitGlowDecay);
    const bm = this.hero.bladeMaterial;
    bm.emissive.copy(this.hitGlowColor);
    bm.emissiveIntensity = g * SWORD_FX.hitGlow;
    this.materia.emissiveIntensity =
      SWORD_FX.materiaGlow + (mods.reach - 0.8) * SWORD_FX.materiaCutoffGlow + g * 0.6;
    // hurt flash
    const hurt = Math.max(0, 1 - (t - this.hurtAt) / 0.3);
    for (const [m, base] of this.baseEmissive) {
      m.emissive.copy(base).lerp(HURT_COLOR, hurt);
    }
  }

  /** Seconds since the last key press (for anticipation gaps). */
  sincePress(t: number): number {
    return t - this.lastPress;
  }
}
