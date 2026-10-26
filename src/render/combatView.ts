import * as THREE from 'three';
import type { Chart } from '../chart/build';
import type { AttackAction } from '../combat/director';
import { CombatSim, type CombatEvent, type Enemy } from '../combat/sim';
import { ATTACKS, ENEMIES, laneStyle, type EnemyKind } from '../config/combat';
import { FIELD } from '../config/gameplay';
import { CAMERA, PALETTE, RENDER, TRAIL } from '../config/visuals';
import type { GameSession } from '../game/session';
import { easeForWeights, type AttackModifiers } from '../synth/modifiers';
import { buildCharacter, type CharacterRig } from './character';
import { FloatingText } from './floatingText';

const DEG = Math.PI / 180;
const AX = new THREE.Vector3(1, 0, 0);
const AY = new THREE.Vector3(0, 1, 0);
const AZ = new THREE.Vector3(0, 0, 1);
const IDLE_Q = new THREE.Quaternion()
  .setFromAxisAngle(AZ, 2.15)
  .multiply(new THREE.Quaternion().setFromAxisAngle(AX, -0.35));

export function laneAngle(lane: number, n: number): number {
  if (n <= 1) return 0;
  return FIELD.laneFanDegrees * DEG * (lane / (n - 1) - 0.5);
}

/** Something a swing can drive: the hero's arm rig or a ghost sword. */
interface SwingTarget {
  pivot: THREE.Group;
  /** Scaled by reach. */
  sword: THREE.Object3D;
  base: THREE.Object3D;
  tip: THREE.Object3D;
  ghost: boolean;
  busy: boolean;
}

interface Swing {
  target: SwingTarget;
  trail: Trail;
  start: number;
  duration: number;
  span: number;
  tilt: number;
  yaw: number;
  dir: number;
  lunge: number;
  mods: AttackModifiers;
  lastSample: number;
}

/** Fading ribbon between the blade base and tip. */
class Trail {
  readonly mesh: THREE.Mesh;
  private readonly samples: Array<{ b: THREE.Vector3; t: THREE.Vector3; at: number }> = [];
  private readonly pos: Float32Array;
  private readonly col: Float32Array;
  private readonly geo: THREE.BufferGeometry;
  private readonly color = new THREE.Color();
  stepped = 0;
  busy = false;

  constructor(scene: THREE.Scene) {
    const n = TRAIL.maxSamples;
    this.pos = new Float32Array(n * 2 * 3);
    this.col = new Float32Array(n * 2 * 4);
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 4));
    const idx: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    this.geo.setIndex(idx);
    this.mesh = new THREE.Mesh(
      this.geo,
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  setHue(h: number, light = 0.6): void {
    this.color.setHSL(h / 360, 1, light);
  }

  push(b: THREE.Vector3, t: THREE.Vector3, at: number): void {
    const j = this.stepped * 0.18;
    const jit = () => (Math.random() - 0.5) * j;
    this.samples.push({
      b: b.clone().add(new THREE.Vector3(jit(), jit(), jit())),
      t: t.clone().add(new THREE.Vector3(jit(), jit(), jit())),
      at,
    });
    if (this.samples.length > TRAIL.maxSamples) this.samples.shift();
  }

  update(now: number): void {
    while (this.samples.length && now - this.samples[0]!.at > TRAIL.lifetime) this.samples.shift();
    const s = this.samples;
    for (let i = 0; i < s.length; i++) {
      const { b, t, at } = s[i]!;
      const k = Math.max(0, 1 - (now - at) / TRAIL.lifetime) * TRAIL.opacity;
      this.pos.set([b.x, b.y, b.z, t.x, t.y, t.z], i * 6);
      const { r, g, b: bl } = this.color;
      this.col.set([r, g, bl, k * 0.15, r, g, bl, k], i * 8);
    }
    this.geo.setDrawRange(0, Math.max(0, (s.length - 1) * 6));
    this.geo.attributes.position!.needsUpdate = true;
    this.geo.attributes.color!.needsUpdate = true;
    if (!s.length) this.busy = false;
  }
}

/** Instanced voxel debris. */
class Voxels {
  readonly mesh: THREE.InstancedMesh;
  private readonly p: THREE.Vector3[] = [];
  private readonly v: THREE.Vector3[] = [];
  private readonly life: number[] = [];
  private next = 0;
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly s = new THREE.Vector3();

  constructor(
    scene: THREE.Scene,
    private readonly max = 700,
  ) {
    this.mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.11, 0.11, 0.11),
      new THREE.MeshBasicMaterial(),
      max,
    );
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    for (let i = 0; i < max; i++) {
      this.p.push(new THREE.Vector3());
      this.v.push(new THREE.Vector3());
      this.life.push(0);
      this.mesh.setColorAt(i, new THREE.Color(0));
    }
    scene.add(this.mesh);
  }

  burst(at: THREE.Vector3, color: string, count: number, speed: number): void {
    const c = new THREE.Color(color);
    for (let k = 0; k < count; k++) {
      const i = this.next;
      this.next = (this.next + 1) % this.max;
      this.p[i]!.copy(at);
      this.v[i]!.set(
        (Math.random() - 0.3) * speed,
        Math.random() * speed * 0.9 + 1,
        (Math.random() - 0.5) * speed,
      );
      this.life[i] = 0.5 + Math.random() * 0.5;
      this.mesh.setColorAt(i, Math.random() < 0.2 ? new THREE.Color(PALETTE.white) : c);
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  update(dt: number): void {
    for (let i = 0; i < this.max; i++) {
      let l = this.life[i]!;
      if (l <= 0) {
        this.s.setScalar(0);
      } else {
        l -= dt;
        this.life[i] = l;
        const v = this.v[i]!;
        v.y -= 14 * dt;
        this.p[i]!.addScaledVector(v, dt);
        if (this.p[i]!.y < 0.05) {
          this.p[i]!.y = 0.05;
          v.y *= -0.3;
          v.x *= 0.7;
          v.z *= 0.7;
        }
        this.s.setScalar(Math.max(0, Math.min(1, l * 2)));
      }
      this.m.compose(this.p[i]!, this.q, this.s);
      this.mesh.setMatrixAt(i, this.m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

/** Left-half 3D view: the hero, enemies, slashes. Purely reactive to session state/events. */
export class CombatView {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly hero: CharacterRig;
  private readonly heroTarget: SwingTarget;
  private readonly ghosts: SwingTarget[] = [];
  private readonly trails: Trail[] = [];
  private swings: Swing[] = [];
  private readonly enemyMeshes = new Map<number, THREE.Group>();
  private readonly templates: Record<EnemyKind, THREE.Group[]>;
  private readonly voxels: Voxels;
  private readonly strikeRing: THREE.Mesh;
  private readonly labels: FloatingText;
  private now = 0;
  private heroYaw = 0;
  private targetYaw = 0;
  private lastActionAt = -10;
  private shake = 0;
  private hurtAt = -10;
  private fovPulse = 0;
  private swingDir = 1;
  private readonly tmpB = new THREE.Vector3();
  private readonly tmpT = new THREE.Vector3();
  private readonly laneCount: number;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    labelLayer: HTMLElement,
    private readonly chart: Chart,
    private readonly session: GameSession,
  ) {
    this.laneCount = chart.lanes.length;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, 0.1, 120);
    this.scene.fog = new THREE.Fog(0x000000, 14, 34);
    this.labels = new FloatingText(labelLayer, this.camera, canvas);

    // lights
    this.scene.add(new THREE.HemisphereLight(0xcfffe0, 0x062010, 0.9));
    const key = new THREE.DirectionalLight(0xfff4e0, 2.2);
    key.position.set(6, 10, 7);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x39ff6a, 2.5);
    rim.position.set(-6, 4, -6);
    this.scene.add(rim);

    // ground + grid
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 90),
      new THREE.MeshStandardMaterial({ color: 0x020803, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);
    const blob = new THREE.Mesh(
      new THREE.CircleGeometry(0.7, 12),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      }),
    );
    blob.rotation.x = -Math.PI / 2;
    blob.position.y = 0.015;
    this.scene.add(blob);
    const grid = new THREE.GridHelper(80, 80, 0x1a8f3c, 0x0b3d18);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.45;
    grid.position.y = 0.01;
    this.scene.add(grid);

    // lane tracks
    for (let i = 0; i < this.laneCount; i++) {
      const style = laneStyle(chart.lanes[i]!, i);
      const len = FIELD.spawnDistance - FIELD.strikeRadius;
      const track = new THREE.Mesh(
        new THREE.PlaneGeometry(len, 0.08),
        new THREE.MeshBasicMaterial({
          color: style.color,
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
        }),
      );
      track.rotation.x = -Math.PI / 2;
      const a = laneAngle(i, this.laneCount);
      const mid = FIELD.strikeRadius + len / 2;
      track.position.set(Math.cos(a) * mid, 0.02, Math.sin(a) * mid);
      track.rotation.z = a;
      this.scene.add(track);
    }
    this.strikeRing = new THREE.Mesh(
      new THREE.RingGeometry(
        FIELD.strikeRadius - 0.04,
        FIELD.strikeRadius + 0.04,
        48,
        1,
        -40 * DEG - (FIELD.laneFanDegrees * DEG) / 2,
        (FIELD.laneFanDegrees + 80) * DEG,
      ),
      new THREE.MeshBasicMaterial({
        color: PALETTE.green,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.strikeRing.rotation.x = Math.PI / 2;
    this.strikeRing.position.y = 0.03;
    this.scene.add(this.strikeRing);

    // hero
    this.hero = buildCharacter();
    this.scene.add(this.hero.root);
    const sword = this.hero.bladeBase.parent!;
    this.heroTarget = {
      pivot: this.hero.swingRig,
      sword,
      base: this.hero.bladeBase,
      tip: this.hero.bladeTip,
      ghost: false,
      busy: false,
    };
    this.hero.swingRig.quaternion.copy(IDLE_Q);

    // ghost swords for echo slashes
    const ghostMat = new THREE.MeshBasicMaterial({
      color: PALETTE.green,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (let i = 0; i < 18; i++) {
      const pivot = new THREE.Group();
      pivot.position.copy(this.hero.swingRig.position);
      const s = new THREE.Group();
      s.position.x = 0.62;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.04, 0.24), ghostMat);
      blade.position.x = 0.19 + 0.725;
      const base = new THREE.Object3D();
      base.position.x = 0.3;
      const tip = new THREE.Object3D();
      tip.position.x = 1.79;
      s.add(blade, base, tip);
      pivot.add(s);
      pivot.visible = false;
      this.hero.body.add(pivot);
      this.ghosts.push({ pivot, sword: s, base, tip, ghost: true, busy: false });
    }
    for (let i = 0; i < 24; i++) this.trails.push(new Trail(this.scene));

    this.templates = { brute: [], imp: [], wall: [], drone: [] };
    this.voxels = new Voxels(this.scene);

    session.bus.on('action', (a) => this.onAction(a));
    session.bus.on('combat', (c) => this.onCombat(c));
    this.resize();
  }

  /** Adaptive resolution: drop render scale when frames are slow (software GL, laptops). */
  private renderScale = RENDER.initialScale;
  private frameAvg = 1 / 60;

  private adaptScale(dt: number): void {
    if (dt <= 0) return;
    this.frameAvg += (dt - this.frameAvg) * 0.05;
    const fps = 1 / this.frameAvg;
    let next = this.renderScale;
    if (fps < RENDER.lowFps && this.renderScale > RENDER.minScale)
      next = Math.max(RENDER.minScale, this.renderScale - 0.1);
    else if (fps > RENDER.highFps && this.renderScale < RENDER.maxScale)
      next = Math.min(RENDER.maxScale, this.renderScale + 0.1);
    if (next !== this.renderScale) {
      this.renderScale = next;
      this.frameAvg = 1 / ((RENDER.lowFps + RENDER.highFps) / 2);
      this.resize();
    }
  }

  resize(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5) * this.renderScale);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    this.renderer.dispose();
    this.labels.clear();
  }

  // ---------------------------------------------------------------- events

  private onAction(a: AttackAction): void {
    const spec = ATTACKS[a.attack];
    const yaw = laneAngle(a.lane, this.laneCount);
    this.targetYaw = yaw;
    this.lastActionAt = this.now;
    this.swingDir = -this.swingDir;
    const base = {
      duration: spec.duration,
      span: spec.arcDeg * DEG * a.mods.arcScale,
      tilt: spec.tiltDeg * DEG,
      dir: a.attack === 'slam' ? 1 : this.swingDir,
      lunge: a.attack === 'thrust' ? 0.5 : a.attack === 'finisher' ? 0.3 : 0.1,
      mods: a.mods,
    };
    // main swing replaces any current hero swing
    this.swings = this.swings.filter((s) => {
      if (s.target === this.heroTarget) {
        s.target.busy = false;
        return false;
      }
      return true;
    });
    this.startSwing(this.heroTarget, { ...base, start: this.now, yaw: 0 });
    for (let k = 1; k <= a.mods.echoCount; k++) {
      const g = this.ghosts.find((x) => !x.busy);
      if (!g) break;
      const side = k % 2 === 1 ? 1 : -1;
      this.startSwing(g, {
        ...base,
        start: this.now + k * a.mods.echoDelay,
        yaw: side * Math.ceil(k / 2) * a.mods.echoSpread,
      });
    }
    if (a.attack === 'slam' || a.attack === 'finisher') this.fovPulse = CAMERA.kickPulseFov;
    if (a.crit) this.labels.spawn(this.enemyWorldPos(a.noteId), 'CRIT', PALETTE.white);
  }

  private onCombat(c: CombatEvent): void {
    switch (c.type) {
      case 'kill': {
        const pos = this.enemyWorldPos(c.enemyId);
        const style = laneStyle(this.chart.lanes[c.lane]!, c.lane);
        this.voxels.burst(pos, style.color, c.judgement === 'perfect' ? 18 : 10, 5);
        break;
      }
      case 'grindStart':
        break;
      case 'playerHit':
        this.hurtAt = this.now;
        this.shake = CAMERA.shakeOnHit;
        this.labels.spawn(new THREE.Vector3(0, 2.4, 0), `-${Math.round(c.damage)}`, PALETTE.danger);
        break;
      case 'parry': {
        this.labels.spawn(this.enemyWorldPos(c.enemyId), 'ECHO PARRY', PALETTE.parry);
        const g = this.ghosts.find((x) => !x.busy);
        if (g) {
          this.startSwing(g, {
            start: this.now,
            duration: 0.18,
            span: 200 * DEG,
            tilt: 20 * DEG,
            dir: 1,
            lunge: 0.2,
            yaw: this.heroYaw - laneAngle(c.lane, this.laneCount),
            mods: { ...this.session.mods, trailHue: 185 },
          });
        }
        this.voxels.burst(this.enemyWorldPos(c.enemyId), PALETTE.parry, 12, 4);
        break;
      }
      case 'playerDown':
        this.labels.spawn(new THREE.Vector3(0, 2.8, 0), 'SYSTEM FAILURE', PALETTE.danger);
        break;
    }
  }

  private startSwing(target: SwingTarget, s: Omit<Swing, 'target' | 'trail' | 'lastSample'>): void {
    const trail = this.trails.find((t) => !t.busy) ?? this.trails[0]!;
    trail.busy = true;
    trail.setHue(s.mods.trailHue, target.ghost ? 0.5 : 0.62);
    trail.stepped = s.mods.trailStepped;
    target.busy = true;
    this.swings.push({ ...s, target, trail, lastSample: s.start });
  }

  // ---------------------------------------------------------------- frame

  private swingPose(s: Swing, t: number, out: THREE.Quaternion): number {
    const p = Math.max(0, Math.min(1, (t - s.start) / s.duration));
    const e = easeForWeights(s.mods.shapeWeights, p);
    const a = s.dir * (-s.span / 2 + e * s.span);
    out
      .setFromAxisAngle(AY, s.yaw)
      .multiply(new THREE.Quaternion().setFromAxisAngle(AX, -s.tilt))
      .multiply(new THREE.Quaternion().setFromAxisAngle(AY, a));
    return p;
  }

  update(songTime: number, dt: number, realDt: number): void {
    this.now = songTime;
    this.adaptScale(realDt);
    const sim = this.session.sim;
    const mods = this.session.mods;

    // hero facing: snap toward last target, drift back to centre when idle
    if (songTime - this.lastActionAt > 0.6) this.targetYaw *= Math.pow(0.1, dt);
    this.heroYaw += (this.targetYaw - this.heroYaw) * Math.min(1, dt * 22);
    this.hero.body.rotation.y = -this.heroYaw;

    // groove to the beat
    const beat = this.chart.tempo.secToBeat(songTime);
    const phase = beat - Math.floor(beat);
    const bounce = Math.pow(1 - phase, 3);
    this.hero.body.position.y = 0.04 * bounce;
    this.hero.head.rotation.x = 0.06 * bounce;
    this.hero.leftArm.rotation.x = Math.sin(beat * Math.PI) * 0.15;
    this.hero.legs[0].rotation.x = Math.sin(beat * Math.PI) * 0.08;
    this.hero.legs[1].rotation.x = -Math.sin(beat * Math.PI) * 0.08;

    // reach + blade glow from the synth
    this.heroTarget.sword.scale.set(mods.reach, 1, 1);
    for (const g of this.ghosts) g.sword.scale.set(mods.reach, 1, 1);
    this.hero.bladeMaterial.emissiveIntensity = 0.1 + (mods.reach - 0.8) * 1.2 + bounce * 0.2;

    // swings (with sub-frame trail sampling)
    const q = new THREE.Quaternion();
    let heroSwinging = false;
    for (const s of this.swings) {
      const tgt = s.target;
      if (songTime < s.start) continue;
      tgt.pivot.visible = true;
      const steps = 4;
      const from = Math.max(s.start, s.lastSample);
      for (let k = 1; k <= steps; k++) {
        const t = from + ((songTime - from) * k) / steps;
        if (t > s.start + s.duration + 0.001) break;
        this.swingPose(s, t, q);
        tgt.pivot.quaternion.copy(q);
        const lp = Math.max(0, Math.min(1, (t - s.start) / s.duration));
        tgt.pivot.position.x = Math.sin(lp * Math.PI) * s.lunge;
        tgt.pivot.updateMatrixWorld(true);
        tgt.base.getWorldPosition(this.tmpB);
        tgt.tip.getWorldPosition(this.tmpT);
        s.trail.push(this.tmpB, this.tmpT, t);
      }
      s.lastSample = songTime;
      const p = this.swingPose(s, songTime, q);
      tgt.pivot.quaternion.copy(q);
      if (tgt === this.heroTarget && p < 1) heroSwinging = true;
    }
    this.swings = this.swings.filter((s) => {
      const done = songTime > s.start + s.duration + 0.02;
      if (done) {
        s.target.busy = false;
        if (s.target.ghost) s.target.pivot.visible = false;
      }
      return !done;
    });
    for (const t of this.trails) t.update(songTime);

    // hero idle / guard pose when not swinging
    if (!heroSwinging && !this.swings.some((s) => s.target === this.heroTarget)) {
      const grinding = sim.enemies.find((e) => e.state === 'grinding');
      const rig = this.hero.swingRig;
      rig.position.x *= 0.8;
      if (grinding) {
        this.targetYaw = laneAngle(grinding.lane, this.laneCount);
        this.lastActionAt = songTime;
        const guard = new THREE.Quaternion()
          .setFromAxisAngle(AX, -0.5)
          .multiply(new THREE.Quaternion().setFromAxisAngle(AY, Math.sin(songTime * 60) * 0.06));
        rig.quaternion.slerp(guard, Math.min(1, dt * 25));
      } else {
        rig.quaternion.slerp(IDLE_Q, Math.min(1, dt * 10));
      }
    }

    // hurt flash
    const hurt = Math.max(0, 1 - (songTime - this.hurtAt) / 0.3);
    for (const m of this.hero.materials) {
      if (m === this.hero.bladeMaterial) continue;
      m.emissive.setRGB(hurt * 0.9, 0, hurt * 0.15);
    }
    this.hero.root.position.x = -hurt * 0.25;

    this.updateEnemies(songTime, sim);
    this.voxels.update(dt);

    const ringMat = this.strikeRing.material as THREE.MeshBasicMaterial;
    ringMat.opacity = 0.25 + bounce * 0.3;

    // camera
    this.shake = Math.max(0, this.shake - dt);
    this.fovPulse = Math.max(0, this.fovPulse - dt * 12);
    const [cx, cy, cz] = CAMERA.position;
    const sh = this.shake * 0.6;
    this.camera.position.set(cx + (Math.random() - 0.5) * sh, cy + (Math.random() - 0.5) * sh, cz);
    this.camera.lookAt(...CAMERA.lookAt);
    this.camera.fov = CAMERA.fov - this.fovPulse;
    this.camera.updateProjectionMatrix();

    this.renderer.render(this.scene, this.camera);
    this.labels.update(dt);
  }

  // ---------------------------------------------------------------- enemies

  private enemyWorldPos(id: number): THREE.Vector3 {
    const mesh = this.enemyMeshes.get(id);
    if (mesh) return mesh.position.clone().setY(mesh.position.y + 0.5);
    const e = this.session.sim.enemies[id];
    if (!e) return new THREE.Vector3();
    const a = laneAngle(e.lane, this.laneCount);
    return new THREE.Vector3(
      Math.cos(a) * FIELD.strikeRadius,
      0.6,
      Math.sin(a) * FIELD.strikeRadius,
    );
  }

  private updateEnemies(t: number, sim: CombatSim): void {
    for (const e of sim.enemies) {
      let mesh = this.enemyMeshes.get(e.id);
      const visible = e.state !== 'gone' && t >= CombatSim.spawnTime(e.noteTime);
      if (!visible) {
        if (mesh) this.releaseEnemy(e, mesh);
        if (e.state === 'approach' && e.noteTime > t + 10) break; // notes are time-sorted
        continue;
      }
      if (!mesh) {
        mesh = this.acquireEnemy(e);
        this.enemyMeshes.set(e.id, mesh);
      }
      this.poseEnemy(e, mesh, t);
    }
  }

  private poseEnemy(e: Enemy, mesh: THREE.Group, t: number): void {
    const spec = ENEMIES[e.kind];
    const a = laneAngle(e.lane, this.laneCount);
    const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    let d = CombatSim.approachDistance(e.noteTime, t);
    let y = spec.y;
    let scale = 1;
    let spin = 0;
    const age = t - e.stateTime;
    switch (e.state) {
      case 'approach': {
        const spawnAge = t - CombatSim.spawnTime(e.noteTime);
        scale = Math.min(1, spawnAge / 0.35);
        if (e.kind === 'imp') y += Math.abs(Math.sin(t * 14 + e.id)) * 0.35;
        if (e.kind === 'drone') y += Math.sin(t * 4 + e.id) * 0.15;
        d = Math.max(d, FIELD.strikeRadius * 0.6);
        break;
      }
      case 'grinding':
        d = FIELD.strikeRadius + Math.sin(t * 70) * 0.05;
        scale = 1 - Math.min(0.35, age * 0.3);
        if (Math.random() < 0.5) {
          const pos = dir
            .clone()
            .multiplyScalar(FIELD.strikeRadius - 0.3)
            .setY(0.9);
          this.voxels.burst(pos, PALETTE.white, 1, 3);
        }
        break;
      case 'dying':
        d = FIELD.strikeRadius + age * 9;
        y += age * 5 - age * age * 9;
        spin = age * 14;
        scale = Math.max(0, 1 - age / 0.35);
        break;
      case 'striking': {
        const k = Math.min(1, age / 0.12);
        d = FIELD.strikeRadius - k * (FIELD.strikeRadius - 0.8);
        scale = age > 0.25 ? Math.max(0, 1 - (age - 0.25) / 0.2) : 1;
        break;
      }
      case 'parried':
        d = FIELD.strikeRadius + age * 12;
        y += age * 3;
        spin = -age * 20;
        scale = Math.max(0, 1 - age / 0.4);
        break;
    }
    mesh.position.copy(dir.multiplyScalar(d)).setY(y);
    mesh.rotation.set(spin, -Math.PI / 2 - a, spin * 0.5);
    if (e.kind === 'drone') mesh.rotation.y += t * 2;
    const glitch = scale < 1 && e.state === 'approach' && Math.random() < 0.3 ? 1.6 : 1;
    mesh.scale.set(scale, scale * glitch, scale);
  }

  private acquireEnemy(e: Enemy): THREE.Group {
    const pool = this.templates[e.kind];
    const m =
      pool.pop() ?? this.buildEnemy(e.kind, laneStyle(this.chart.lanes[e.lane]!, e.lane).color);
    m.visible = true;
    this.scene.add(m);
    return m;
  }

  private releaseEnemy(e: Enemy, m: THREE.Group): void {
    m.visible = false;
    this.scene.remove(m);
    this.enemyMeshes.delete(e.id);
    this.templates[e.kind].push(m);
  }

  private buildEnemy(kind: EnemyKind, color: string): THREE.Group {
    const g = new THREE.Group();
    const [w, h, d] = ENEMIES[kind].size;
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x030603,
      emissive: color,
      emissiveIntensity: 0.12,
      flatShading: true,
      roughness: 0.6,
    });
    const edgeMat = new THREE.LineBasicMaterial({ color });
    const eyeMat = new THREE.MeshBasicMaterial({
      color: kind === 'brute' ? PALETTE.danger : PALETTE.white,
    });
    const geo =
      kind === 'drone' ? new THREE.OctahedronGeometry(w * 0.65, 0) : new THREE.BoxGeometry(w, h, d);
    const body = new THREE.Mesh(geo, bodyMat);
    body.position.y = kind === 'drone' ? 0 : h / 2;
    body.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
    g.add(body);
    // eyes face +Z of the group (the group is rotated to face the hero)
    const eyeY = kind === 'drone' ? 0.05 : h * 0.7;
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(w * 0.16, h * 0.1, 0.02), eyeMat);
      eye.position.set(s * w * 0.2, eyeY, (kind === 'drone' ? w * 0.4 : d / 2) + 0.01);
      g.add(eye);
    }
    if (kind === 'brute') {
      for (const s of [-1, 1]) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 4), bodyMat);
        horn.position.set(s * w * 0.35, h + 0.12, 0);
        horn.add(new THREE.LineSegments(new THREE.EdgesGeometry(horn.geometry), edgeMat));
        g.add(horn);
      }
    }
    if (kind === 'imp') {
      for (const s of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.08), bodyMat);
        ear.position.set(s * w * 0.35, h + 0.1, 0);
        ear.rotation.z = -s * 0.4;
        g.add(ear);
      }
    }
    if (kind === 'wall') {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(w * 1.05, 0.06, d * 1.05),
        new THREE.MeshBasicMaterial({ color }),
      );
      bar.position.y = h * 0.35;
      g.add(bar);
    }
    if (kind === 'drone') {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(w * 0.75, 0.025, 4, 12),
        new THREE.MeshBasicMaterial({ color }),
      );
      ring.rotation.x = Math.PI / 2;
      g.add(ring);
    }
    return g;
  }
}
