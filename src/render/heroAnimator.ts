import * as THREE from 'three';
import type { Action } from '../chart/types';
import { ACTION_SPECS, MOVES } from '../config/actions';
import { PALETTE, TRAIL } from '../config/visuals';
import { easeForWeights, type AttackModifiers } from '../synth/modifiers';
import type { CharacterRig } from './character';
import { Trail } from './effects';

const DEG = Math.PI / 180;
const AX = new THREE.Vector3(1, 0, 0);
const AY = new THREE.Vector3(0, 1, 0);
const AZ = new THREE.Vector3(0, 0, 1);

/**
 * Arm orientation in the hero's body frame (forward +X, up +Y, right +Z):
 * yaw > 0 swings the arm toward the hero's left, pitch > 0 raises it, roll turns the blade.
 */
function armQ(yaw: number, pitch: number, roll: number, out = new THREE.Quaternion()) {
  return out
    .setFromAxisAngle(AY, yaw)
    .multiply(new THREE.Quaternion().setFromAxisAngle(AZ, pitch))
    .multiply(new THREE.Quaternion().setFromAxisAngle(AX, roll));
}

/** Arc swing: sweep `a` around a plane tilted by `tilt` about the forward axis. */
function swingQ(yaw: number, tilt: number, a: number, out = new THREE.Quaternion()) {
  return out
    .setFromAxisAngle(AY, yaw)
    .multiply(new THREE.Quaternion().setFromAxisAngle(AX, -tilt))
    .multiply(new THREE.Quaternion().setFromAxisAngle(AY, a));
}

const Q_READY = armQ(-0.35, 0.3, 1.2);
const Q_BLOCK = armQ(1.2, 0.62, 1.57);
const REST_POS = new THREE.Vector3(0, 1.32, 0.36);
const smooth = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

interface Pose {
  arm: THREE.Quaternion;
  armOff: THREE.Vector3;
  spin: number;
  lean: number;
  hop: number;
  fwd: number;
  leftArmX: number;
  leftArmZ: number;
  /** Whether the blade is cutting (draw a trail). */
  cutting: boolean;
}

interface Play {
  action: Action;
  start: number;
  dir: number;
  mods: AttackModifiers;
  from: THREE.Quaternion;
  holding: boolean;
  releasedAt: number | null;
  hit: boolean;
}

interface Ghost {
  pivot: THREE.Group;
  sword: THREE.Object3D;
  base: THREE.Object3D;
  tip: THREE.Object3D;
  trail: Trail;
}

/** Peak time of each move: where a hold freezes it. */
function peakOf(action: Action): number {
  switch (action) {
    case 'block':
      return MOVES.block.raise;
    case 'slash':
      return MOVES.slash.duration;
    case 'stab':
      return MOVES.stab.windup + MOVES.stab.thrust;
    case 'flourish':
      return MOVES.flourish.duration * 0.62;
  }
}

function totalOf(action: Action): number {
  const m = MOVES;
  switch (action) {
    case 'block':
      return m.block.raise + m.block.hold + m.block.lower;
    case 'slash':
      return m.slash.duration + 0.2;
    case 'stab':
      return m.stab.windup + m.stab.thrust + m.stab.hold + m.stab.retract;
    case 'flourish':
      return m.flourish.duration + 0.18;
  }
}

/**
 * Plays the hero's sword moves. A key press starts its move immediately, whether or not a
 * cue is there; a hit adds impact effects on top (handled by the arena). Synth modifiers
 * shape the arcs and spawn echo blades.
 */
export class HeroAnimator {
  private play: Play | null = null;
  private slashDir = 1;
  private readonly mainTrail: Trail;
  private readonly ghosts: Ghost[] = [];
  private lastSample = -Infinity;
  private readonly tmpB = new THREE.Vector3();
  private readonly tmpT = new THREE.Vector3();
  private readonly pose: Pose = {
    arm: new THREE.Quaternion(),
    armOff: new THREE.Vector3(),
    spin: 0,
    lean: 0,
    hop: 0,
    fwd: 0,
    leftArmX: 0,
    leftArmZ: 0,
    cutting: false,
  };

  constructor(
    scene: THREE.Scene,
    private readonly hero: CharacterRig,
  ) {
    this.mainTrail = new Trail(scene);
    hero.swingRig.quaternion.copy(Q_READY);
    const ghostMat = new THREE.MeshBasicMaterial({
      color: PALETTE.green,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (let i = 0; i < 6; i++) {
      const pivot = new THREE.Group();
      pivot.position.copy(REST_POS);
      const sword = new THREE.Group();
      sword.position.x = 0.62;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.04, 0.24), ghostMat);
      blade.position.x = 0.19 + 0.725;
      const base = new THREE.Object3D();
      base.position.x = 0.3;
      const tip = new THREE.Object3D();
      tip.position.x = 1.79;
      sword.add(blade, base, tip);
      pivot.add(sword);
      pivot.visible = false;
      hero.body.add(pivot);
      const trail = new Trail(scene);
      this.ghosts.push({ pivot, sword, base, tip, trail });
    }
  }

  get current(): Action | null {
    return this.play?.action ?? null;
  }

  /** Start a move now (on key press). */
  start(action: Action, t: number, mods: AttackModifiers): void {
    if (action === 'slash') this.slashDir = -this.slashDir;
    this.play = {
      action,
      start: t,
      dir: this.slashDir,
      mods,
      from: this.hero.swingRig.quaternion.clone(),
      holding: false,
      releasedAt: null,
      hit: false,
    };
    this.lastSample = t;
    this.mainTrail.setColor(ACTION_SPECS[action].color, 0, 0.62);
    this.mainTrail.alpha = action === 'flourish' ? 0.45 : action === 'slash' ? 0.8 : 1;
    this.mainTrail.stepped = mods.trailStepped;
    for (const g of this.ghosts) {
      g.trail.setColor('#39ff6a', mods.trailHue - 125, 0.5);
      g.trail.alpha = TRAIL.ghostAlpha;
      g.trail.stepped = mods.trailStepped;
    }
  }

  /** The move connected with a cue (hold = keep the peak pose until release). */
  connect(action: Action, hold: boolean): void {
    if (!this.play || this.play.action !== action) return;
    this.play.hit = true;
    if (hold) this.play.holding = true;
  }

  release(t: number): void {
    if (this.play?.holding) {
      this.play.holding = false;
      this.play.releasedAt = t;
    }
  }

  get holding(): boolean {
    return this.play?.holding ?? false;
  }

  /** World position of the main blade tip. */
  bladeTip(out = new THREE.Vector3()): THREE.Vector3 {
    return this.hero.bladeTip.getWorldPosition(out);
  }

  private effectiveAge(p: Play, t: number): number {
    const peak = peakOf(p.action);
    const a = t - p.start;
    if (p.holding) return Math.min(a, peak);
    if (p.releasedAt !== null) return peak + (t - p.releasedAt);
    return a;
  }

  private computePose(p: Play | null, a: number, out: Pose, mods: AttackModifiers): void {
    out.armOff.set(0, 0, 0);
    out.spin = 0;
    out.lean = 0;
    out.hop = 0;
    out.fwd = 0;
    out.leftArmX = 0;
    out.leftArmZ = 0.25;
    out.cutting = false;
    out.arm.copy(Q_READY);
    if (!p) return;
    const w = p.mods.shapeWeights;
    const M = MOVES;
    switch (p.action) {
      case 'block': {
        const up = smooth(a / M.block.raise);
        const down = smooth((a - M.block.raise - M.block.hold) / M.block.lower);
        out.arm.copy(p.from).slerp(Q_BLOCK, up).slerp(Q_READY, down);
        const k = up * (1 - down);
        out.lean = -0.12 * k;
        out.fwd = -0.08 * k;
        out.leftArmX = -1.2 * k;
        out.leftArmZ = 0.25 + 0.9 * k;
        if (p.holding)
          out.arm.multiply(new THREE.Quaternion().setFromAxisAngle(AY, Math.sin(a * 70) * 0.03));
        break;
      }
      case 'slash': {
        const d = M.slash.duration;
        const span = M.slash.arcDeg * DEG * mods.arcScale;
        const tilt = M.slash.tiltDeg * DEG * p.dir;
        const sp = Math.min(1, a / d);
        const e = easeForWeights(w, sp);
        const ang = p.dir * (-span / 2 + e * span);
        const swing = swingQ(0, tilt, ang);
        const blendIn = smooth(a / 0.025);
        out.arm.copy(p.from).slerp(swing, blendIn);
        const rec = smooth((a - d) / 0.2);
        if (rec > 0) out.arm.slerp(Q_READY, rec);
        out.spin = -p.dir * 0.35 * Math.sin(Math.min(1, a / (d + 0.1)) * Math.PI);
        out.fwd = 0.12 * Math.sin(Math.min(1, a / (d + 0.2)) * Math.PI);
        out.cutting = a > 0.01 && a < d + 0.02;
        break;
      }
      case 'stab': {
        const { windup, thrust, hold, retract, lunge } = M.stab;
        const back = armQ(0.05, 0.05, 1.57);
        const forward = armQ(0.12, -0.05, 1.57);
        const w1 = smooth(a / windup);
        const th = easeForWeights(w, Math.min(1, Math.max(0, (a - windup) / thrust)));
        const ret = smooth((a - windup - thrust - hold) / retract);
        out.arm.copy(p.from).slerp(back, w1).slerp(forward, th).slerp(Q_READY, ret);
        const reach = lunge * mods.stabLunge;
        const ext = -0.3 * w1 * (1 - th) + reach * th * (1 - ret);
        out.armOff.set(ext, 0, -0.1 * th * (1 - ret));
        out.fwd = 0.35 * reach * th * (1 - ret);
        out.lean = 0.18 * th * (1 - ret);
        out.leftArmX = 0.6 * th * (1 - ret);
        out.leftArmZ = 0.25 - 0.5 * th * (1 - ret);
        out.cutting = a > windup && a < windup + thrust + 0.02;
        break;
      }
      case 'flourish': {
        const d = M.flourish.duration;
        const pr = Math.min(1, a / d);
        const spinEnd = 0.62;
        if (pr < spinEnd) {
          const sp = easeForWeights(w, pr / spinEnd);
          out.spin = sp * Math.PI * 2 * M.flourish.spins;
          const outward = armQ(-1.45, 0.12, 0.2);
          out.arm.copy(p.from).slerp(outward, smooth(a / 0.04));
          out.hop = M.flourish.hop * Math.sin((pr / spinEnd) * Math.PI);
        } else {
          const k = easeForWeights(w, (pr - spinEnd) / (1 - spinEnd));
          const span = 150 * DEG * mods.arcScale;
          out.arm.copy(swingQ(0, 85 * DEG, -span * 0.65 + k * span));
          out.fwd = 0.25 * k;
          out.lean = 0.25 * k;
        }
        const rec = smooth((a - d) / 0.18);
        if (rec > 0) out.arm.slerp(Q_READY, rec);
        out.leftArmZ = 0.25 + 1.1 * (1 - rec) * (pr < spinEnd ? 1 : 0.4);
        out.cutting = a > 0.03 && a < d + 0.02;
        break;
      }
    }
  }

  private applyPose(pose: Pose): void {
    const h = this.hero;
    h.swingRig.quaternion.copy(pose.arm);
    h.swingRig.position.copy(REST_POS).add(pose.armOff);
    h.body.rotation.set(0, pose.spin, pose.lean * -1);
    h.body.position.set(pose.fwd, pose.hop, 0);
    h.leftArm.rotation.set(pose.leftArmX, 0, pose.leftArmZ);
  }

  /** `bob` is 0..1 on-beat bounce for the idle groove. */
  update(t: number, mods: AttackModifiers, bob: number): void {
    const p = this.play;
    if (
      p &&
      t - p.start > totalOf(p.action) &&
      !p.holding &&
      (p.releasedAt === null || t - p.releasedAt > totalOf(p.action))
    ) {
      this.play = null;
    }
    const play = this.play;
    // sub-frame samples for smooth trails
    if (play) {
      const steps = 4;
      const from = Math.max(play.start, this.lastSample);
      for (let k = 1; k <= steps; k++) {
        const st = from + ((t - from) * k) / steps;
        this.computePose(play, this.effectiveAge(play, st), this.pose, mods);
        this.applyPose(this.pose);
        this.hero.root.updateMatrixWorld(true);
        if (this.pose.cutting) {
          this.hero.bladeBase.getWorldPosition(this.tmpB);
          this.hero.bladeTip.getWorldPosition(this.tmpT);
          this.mainTrail.push(this.tmpB, this.tmpT, st);
        }
        this.updateGhosts(play, st, mods, true);
      }
      this.lastSample = t;
    }
    this.computePose(play, play ? this.effectiveAge(play, t) : 0, this.pose, mods);
    this.applyPose(this.pose);
    if (play) this.updateGhosts(play, t, mods, false);
    else for (const g of this.ghosts) g.pivot.visible = false;
    this.hero.body.position.y += 0.04 * bob;
    this.hero.legs[0].rotation.x = Math.sin(t * 2.6) * 0.06;
    this.hero.legs[1].rotation.x = -Math.sin(t * 2.6) * 0.06;
    this.mainTrail.update(t);
    for (const g of this.ghosts) g.trail.update(t);
    for (const g of this.ghosts) g.sword.scale.set(mods.reach, 1, 1);
    (this.hero.bladeBase.parent as THREE.Object3D).scale.set(mods.reach, 1, 1);
  }

  private readonly ghostPose: Pose = {
    arm: new THREE.Quaternion(),
    armOff: new THREE.Vector3(),
    spin: 0,
    lean: 0,
    hop: 0,
    fwd: 0,
    leftArmX: 0,
    leftArmZ: 0,
    cutting: false,
  };

  private updateGhosts(p: Play, t: number, mods: AttackModifiers, sample: boolean): void {
    const n = Math.min(this.ghosts.length, mods.echoCount);
    this.ghosts.forEach((g, i) => {
      if (i >= n) {
        g.pivot.visible = false;
        return;
      }
      const k = i + 1;
      const side = k % 2 === 1 ? 1 : -1;
      const yaw = side * Math.ceil(k / 2) * Math.max(0.12, mods.echoSpread);
      if (p.action === 'block') {
        // a fanned shield of echo blades around the guard
        const a = this.effectiveAge(p, t);
        const on = a >= 0 && (p.holding || a < MOVES.block.raise + MOVES.block.hold);
        g.pivot.visible = on;
        g.pivot.quaternion
          .copy(Q_BLOCK)
          .premultiply(new THREE.Quaternion().setFromAxisAngle(AZ, yaw * 0.8));
        g.pivot.position.copy(REST_POS);
        return;
      }
      const a = this.effectiveAge(p, t) - k * mods.echoDelay;
      const active = a > 0 && a < peakOf(p.action) + 0.06;
      g.pivot.visible = active;
      if (!active) return;
      this.computePose(p, a, this.ghostPose, mods);
      g.pivot.quaternion
        .copy(this.ghostPose.arm)
        .premultiply(new THREE.Quaternion().setFromAxisAngle(AY, yaw));
      g.pivot.position.copy(REST_POS).add(this.ghostPose.armOff);
      if (sample && this.ghostPose.cutting) {
        g.pivot.updateMatrixWorld(true);
        g.base.getWorldPosition(this.tmpB);
        g.tip.getWorldPosition(this.tmpT);
        g.trail.push(this.tmpB, this.tmpT, t);
      }
    });
  }
}
