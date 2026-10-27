import * as THREE from 'three';
import type { Chart } from '../chart/build';
import type { Action } from '../chart/types';
import type { DuelAction } from '../combat/director';
import type { DuelEvent } from '../combat/duel';
import { telegraphAt, type Telegraph, type TelegraphCue } from '../combat/telegraph';
import { ACTION_SPECS, ENEMIES } from '../config/actions';
import { DUEL } from '../config/gameplay';
import { HERO_ANIM } from '../config/heroAnimation';
import { ARENA, CAMERA, CHARACTER, PALETTE, RENDER, SWORD_FX } from '../config/visuals';
import type { GameSession } from '../game/session';
import type { LaneInput } from '../rhythm/input';
import { buildCharacter, type CharacterRig } from './character';
import { Rings, Voxels } from './effects';
import { buildEnemy, poseEnemy, type EnemyRig } from './enemy';
import { FloatingText } from './floatingText';
import { HeroAnimator, type Anticipation } from './heroAnimator';
import { Highway3D } from './highway3d';

const UP = new THREE.Vector3(0, 1, 0);

/** Presentation switches (experiments turn parts of the default view off). */
export interface ArenaOptions {
  /** Draw the 4-lane floor highway. Default true. */
  highway?: boolean;
  /** Show the next-action icon over the enemy's head. Default true. */
  enemyIcon?: boolean;
}
const TOWARD_ENEMY = new THREE.Vector3(0, 0, -1);

/** Which cue the enemy is winding up for at time t (see `telegraphAt`). */
export type TelegraphFn = (
  encounter: number | null,
  encounterStart: number,
  cues: readonly TelegraphCue[],
  t: number,
) => Telegraph;

/** A camera placement replacing CAMERA's (shake and FOV kicks still apply on top). */
export interface CameraView {
  position: readonly [number, number, number];
  lookAt: readonly [number, number, number];
  fov?: number;
}

/**
 * The whole play view in one Three.js scene: hero, the enemy on stage, and the action
 * highway between them. Purely reactive to session state and bus events.
 */
export class ArenaView {
  private readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private readonly hero: CharacterRig;
  private readonly anim: HeroAnimator;
  readonly highway: Highway3D;
  private readonly enemyRigs = new Map<number, EnemyRig>();
  private readonly voxels: Voxels;
  private readonly rings: Rings;
  private readonly labels: FloatingText;
  private readonly held: boolean[];
  private readonly pressAt: number[];
  private readonly hitAt: number[];
  private readonly dropped = new Map<number, number>();
  private now = 0;
  private shake = 0;
  private hurtAt = -10;
  private fovPulse = 0;
  private lastGrindSpark = 0;
  private readonly walkIn: number;
  private readonly beforeRender: Array<(t: number, dt: number) => void> = [];
  private readonly showHighway: boolean;
  private readonly showEnemyIcon: boolean;
  /** Seconds the visuals are drawn ahead of game time (Settings → visual offset). */
  visualOffset = 0;
  private cueScan = 0;
  private stopFrom = -10;
  private stopUntil = -10;
  private heroYaw = 0;
  private heroPitch = 0;

  // ---- experiment hooks (all optional; the defaults are the normal game)
  /** Replaces the enemy's telegraph timing (default: `telegraphAt` with DUEL's lead). */
  telegraph: TelegraphFn | null = null;
  /** Built-in hit/miss effects (world labels, debris, rings, shake, hurt flash). */
  duelEffects = true;
  /** Which hero move a press on `lane` plays (null: none). Default: the lane's action. */
  pressMove: ((lane: number) => Action | null) | null = null;
  /** Camera placement override. */
  view: CameraView | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    labelLayer: HTMLElement,
    private readonly chart: Chart,
    private readonly session: GameSession,
    opts: ArenaOptions = {},
  ) {
    this.showHighway = opts.highway ?? true;
    this.showEnemyIcon = opts.enemyIcon ?? true;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, 0.1, 120);
    this.scene.fog = new THREE.Fog(0x000000, 12, 30);
    this.labels = new FloatingText(labelLayer, this.camera, canvas);
    this.walkIn = DUEL.walkInBeats * (60 / chart.tempo.bpmAtBeat(0));

    this.scene.add(new THREE.HemisphereLight(0xcfffe0, 0x062010, 0.95));
    const key = new THREE.DirectionalLight(0xfff4e0, 2.2);
    key.position.set(5, 9, 6);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x39ff6a, 2.2);
    rim.position.set(-5, 4, -8);
    this.scene.add(rim);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 90),
      new THREE.MeshStandardMaterial({ color: 0x020803, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);
    const grid = new THREE.GridHelper(80, 80, 0x1a8f3c, 0x0b3d18);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.35;
    grid.position.y = 0.004;
    this.scene.add(grid);

    this.highway = new Highway3D(this.scene, chart);
    this.highway.group.visible = this.showHighway;
    const n = chart.lanes.length;
    this.held = new Array<boolean>(n).fill(false);
    this.pressAt = new Array<number>(n).fill(-10);
    this.hitAt = new Array<number>(n).fill(-10);

    this.hero = buildCharacter();
    this.hero.root.rotation.y = Math.PI / 2;
    this.hero.root.scale.setScalar(CHARACTER.scale);
    this.scene.add(this.hero.root);
    const blob = new THREE.Mesh(
      new THREE.CircleGeometry(0.6, 12),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      }),
    );
    blob.rotation.x = -Math.PI / 2;
    blob.position.set(0, 0.02, ARENA.heroZ);
    this.scene.add(blob);
    this.anim = new HeroAnimator(this.scene, this.hero);
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__hero = this.anim;

    this.voxels = new Voxels(this.scene);
    this.rings = new Rings(this.scene);

    session.bus.on('input', (i) => this.onInput(i));
    session.bus.on('action', (a) => this.onAction(a));
    session.bus.on('duel', (d) => this.onDuel(d));
    session.bus.on('cuesDropped', (ids) => {
      for (const id of ids) this.dropped.set(id, this.now);
    });
    this.resize();
  }

  // ---------------------------------------------------------------- layout helpers

  /** Screen position (CSS px) of a world point. */
  toScreen(v: THREE.Vector3): { x: number; y: number } {
    const p = v.clone().project(this.camera);
    return {
      x: ((p.x + 1) / 2) * this.canvas.clientWidth,
      y: ((1 - p.y) / 2) * this.canvas.clientHeight,
    };
  }

  /** Screen x of each lane at the hit line, and the hit line's screen y. */
  laneScreen(): { xs: number[]; y: number; width: number } {
    const xs = this.chart.lanes.map((_, i) => this.toScreen(this.highway.receptorPoint(i)).x);
    const y = this.toScreen(this.highway.receptorPoint(0)).y;
    const width = xs.length > 1 ? Math.abs(xs[1]! - xs[0]!) : 100;
    return { xs, y, width };
  }

  /** Run a callback every frame after the scene is posed, just before it renders. */
  onBeforeRender(fn: (t: number, dt: number) => void): void {
    this.beforeRender.push(fn);
  }

  /** The hero's rig (read-only use: anchor effects to it). */
  get heroRig(): CharacterRig {
    return this.hero;
  }

  /** The rig of the enemy on stage (walking in, fighting or exiting), or null. */
  enemyRig(includeHidden = false): EnemyRig | null {
    const k = this.session.duel.activeEncounter(this.now);
    const rig = k === null ? undefined : this.enemyRigs.get(k);
    return rig && (includeHidden || rig.root.visible) ? rig : null;
  }

  /** Play a hero move now (e.g. a finisher), as if it had connected. */
  playHeroMove(action: Action, t = this.now): void {
    this.anim.start(action, t, this.session.mods);
    this.anim.connect(action, false);
  }

  /** Freeze the hero's and enemy's poses for `seconds` from `at` (impact hit-stop). */
  hitStop(seconds: number, at = this.now): void {
    this.stopFrom = at;
    this.stopUntil = at + seconds;
  }

  /** Turn (yaw, + = toward screen left) and tilt (pitch, + = lean back) the hero's whole body. */
  setHeroLean(yaw: number, pitch: number): void {
    this.heroYaw = yaw;
    this.heroPitch = pitch;
  }

  /** The hero's hit reaction (flinch + knockback), for experiments that turn off duelEffects. */
  hurtHero(t = this.now): void {
    this.hurtAt = t;
    this.anim.hurt(t);
  }

  private moveFor(lane: number): Action | null {
    if (this.pressMove) return this.pressMove(lane);
    return (this.chart.lanes[lane] as Action | undefined) ?? null;
  }

  /** Screen point above the enemy on stage, or null. */
  enemyScreen(): { x: number; y: number } | null {
    const k = this.session.duel.activeEncounter(this.now);
    const rig = k === null ? undefined : this.enemyRigs.get(k);
    if (!rig || !rig.root.visible) return null;
    return this.toScreen(rig.root.position.clone().setY(3.2 * ENEMIES[rig.kind].scale));
  }

  // ---------------------------------------------------------------- adaptive resolution

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
    // keep the whole highway in view on narrow (portrait) screens
    this.camera.fov =
      this.camera.aspect < 1.2 ? CAMERA.fov * (1.2 / this.camera.aspect) ** 0.6 : CAMERA.fov;
    this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    this.renderer.dispose();
    this.labels.clear();
  }

  get heldLanes(): readonly boolean[] {
    return this.held;
  }

  // ---------------------------------------------------------------- events

  private enemyChest(encounter: number): THREE.Vector3 {
    const rig = this.enemyRigs.get(encounter);
    const scale = rig ? ENEMIES[rig.kind].scale : 1;
    const z = rig ? rig.root.position.z : -ARENA.duelDistance;
    return new THREE.Vector3(0, 1.25 * scale, z + 0.3);
  }

  private onInput(i: LaneInput): void {
    if (!this.chart.lanes[i.lane]) return;
    this.held[i.lane] = i.down;
    const move = this.moveFor(i.lane);
    // moves start at the input's own time, so the strike lands on the key press
    const at = i.time + this.visualOffset;
    if (i.down) {
      this.pressAt[i.lane] = this.now;
      if (move) this.anim.start(move, at, this.session.mods);
    } else {
      this.anim.release(at);
    }
  }

  private onAction(a: DuelAction): void {
    if (!a.hit) return;
    if (a.kind !== 'holdEnd') {
      this.hitAt[a.lane] = this.now;
      const move = this.moveFor(a.lane);
      if (move) this.anim.connect(move, a.hold);
      if (this.showHighway && this.duelEffects) {
        const p = this.highway.receptorPoint(a.lane);
        this.rings.spawn(p.setY(0.06), ACTION_SPECS[a.action].color, UP, 0.22, 0.7);
      }
    }
  }

  private onDuel(d: DuelEvent): void {
    if (!this.duelEffects) return;
    switch (d.type) {
      case 'enemyEnter':
        break;
      case 'blocked': {
        const clash = new THREE.Vector3(0.1, 1.7, (ARENA.heroZ - ARENA.duelDistance) / 2);
        this.voxels.burst(
          clash,
          ACTION_SPECS.block.color,
          d.judgement === 'perfect' ? 16 : 9,
          4,
          UP,
          0.7,
        );
        this.rings.spawn(clash, ACTION_SPECS.block.color, new THREE.Vector3(0, 0.3, 1), 0.2, 0.9);
        this.labels.spawn(
          clash.clone().setY(2.3),
          d.lock ? 'BLADE LOCK' : 'BLOCKED',
          ACTION_SPECS.block.color,
        );
        this.shake = Math.max(this.shake, 0.06);
        break;
      }
      case 'struck': {
        const spec = ACTION_SPECS[d.action];
        const at = this.enemyChest(d.encounter);
        this.voxels.burst(at, spec.color, d.judgement === 'perfect' ? 22 : 12, 5, TOWARD_ENEMY);
        this.labels.spawn(at.clone().add(new THREE.Vector3(0.6, 0.5, 0)), spec.hitText, spec.color);
        if (d.crit)
          this.labels.spawn(at.clone().add(new THREE.Vector3(-0.6, 0.9, 0)), 'CRIT', PALETTE.white);
        if (d.action === 'flourish') this.fovPulse = CAMERA.kickPulseFov;
        break;
      }
      case 'released': {
        const at = this.enemyChest(d.encounter);
        this.voxels.burst(at, ACTION_SPECS[d.action].color, 14, 5, TOWARD_ENEMY);
        this.labels.spawn(
          at.clone().setY(2.2),
          d.action === 'block' ? 'SHOVE' : 'RELEASE',
          ACTION_SPECS[d.action].color,
        );
        break;
      }
      case 'playerHit':
        this.hurtAt = this.now;
        this.anim.hurt(this.now);
        this.shake = CAMERA.shakeOnHit;
        this.labels.spawn(
          new THREE.Vector3(0, 2.6, 0),
          `HIT -${Math.round(d.damage)}`,
          PALETTE.danger,
        );
        this.voxels.burst(new THREE.Vector3(0, 1.4, -0.2), PALETTE.danger, 10, 3, UP);
        break;
      case 'parry': {
        const at = new THREE.Vector3(0, 1.8, (ARENA.heroZ - ARENA.duelDistance) / 2);
        this.labels.spawn(at.clone().setY(2.5), 'ECHO PARRY', PALETTE.parry);
        this.rings.spawn(at, PALETTE.parry, new THREE.Vector3(0, 0.3, 1), 0.3, 1.4);
        this.voxels.burst(at, PALETTE.parry, 12, 4, UP);
        break;
      }
      case 'recovered': {
        const spec = ACTION_SPECS[d.action];
        const text = d.action === 'flourish' ? 'RECOVERED' : spec.missText;
        this.labels.spawn(
          this.enemyChest(d.encounter).add(new THREE.Vector3(0, 1, 0)),
          text,
          '#9fb3a6',
        );
        break;
      }
      case 'defeated': {
        const at = this.enemyChest(d.encounter);
        const rig = this.enemyRigs.get(d.encounter);
        const accent = rig ? ENEMIES[rig.kind].accent : PALETTE.green;
        this.voxels.burst(at, accent, 40, 7, TOWARD_ENEMY, 1.5);
        this.voxels.burst(at.clone().setY(at.y + 0.6), ACTION_SPECS.flourish.color, 30, 6, UP, 1.2);
        this.rings.spawn(at.clone().setY(0.1), ACTION_SPECS.flourish.color, UP, 0.45, 3);
        this.labels.spawn(at.clone().setY(at.y + 1.4), 'DEFEATED', PALETTE.white);
        this.fovPulse = CAMERA.kickPulseFov * 1.5;
        this.shake = Math.max(this.shake, 0.1);
        break;
      }
      case 'escaped':
        this.labels.spawn(
          this.enemyChest(d.encounter).add(new THREE.Vector3(0, 1.4, 0)),
          'ESCAPED',
          '#9fb3a6',
        );
        break;
      case 'playerDown':
        this.labels.spawn(new THREE.Vector3(0, 3, 0), 'SYSTEM FAILURE', PALETTE.danger);
        break;
    }
  }

  // ---------------------------------------------------------------- frame

  update(songTime: number, dt: number, realDt: number, approach: number): void {
    this.now = songTime;
    this.adaptScale(realDt);
    const mods = this.session.mods;
    const beat = this.session.conductor.beatAt(songTime);
    const phase = beat - Math.floor(beat);
    const bob = Math.pow(1 - phase, 3);
    const poseT = songTime >= this.stopFrom && songTime < this.stopUntil ? this.stopFrom : songTime;

    this.hero.root.rotation.set(this.heroPitch, Math.PI / 2 + this.heroYaw, 0);
    this.anim.update(poseT, mods, bob, this.anticipation(poseT));

    // blade-lock sparks
    if (this.anim.holding && songTime - this.lastGrindSpark > 1 / SWORD_FX.grindSparks) {
      this.lastGrindSpark = songTime;
      this.voxels.burst(this.anim.bladeTip(), PALETTE.white, 1, 2.5, UP, 0.4);
    }

    // knockback
    const hurt = Math.max(0, 1 - (songTime - this.hurtAt) / 0.3);
    this.hero.root.position.z = ARENA.heroZ + hurt * hurt * 0.2;

    this.highway.update(
      songTime,
      approach,
      this.session,
      this.held,
      this.pressAt,
      this.hitAt,
      this.dropped,
    );
    this.updateEnemies(poseT, phase);
    this.voxels.update(dt);
    this.rings.update(dt);

    this.shake = Math.max(0, this.shake - dt);
    this.fovPulse = Math.max(0, this.fovPulse - dt * 10);
    const view = this.view ?? CAMERA;
    const [cx, cy, cz] = view.position;
    const sh = this.shake * 0.6;
    this.camera.position.set(cx + (Math.random() - 0.5) * sh, cy + (Math.random() - 0.5) * sh, cz);
    this.camera.lookAt(...view.lookAt);
    const fov = view.fov ?? CAMERA.fov;
    const baseFov = this.camera.aspect < 1.2 ? fov * (1.2 / this.camera.aspect) ** 0.6 : fov;
    this.camera.fov = baseFov - this.fovPulse;
    this.camera.updateProjectionMatrix();

    for (const fn of this.beforeRender) fn(songTime, dt);
    this.renderer.render(this.scene, this.camera);
    this.labels.update(dt);
  }

  /** The next cue the hero should coil for: the earliest one still pending. */
  private anticipation(t: number): Anticipation | null {
    const cues = this.session.conductor.cues;
    const judge = this.session.judge;
    while (this.cueScan < cues.length) {
      const c = cues[this.cueScan]!;
      if ((c.endTime ?? c.time) > t - 2) break;
      this.cueScan++;
    }
    let prev = t - this.anim.sincePress(t);
    for (let i = this.cueScan; i < cues.length; i++) {
      const c = cues[i]!;
      if (c.removed) continue;
      if (c.time > t + 1) break;
      if (c.time < t - HERO_ANIM.anticipationRelease || !judge.isPending(c.id)) {
        prev = Math.max(prev, c.endTime ?? c.time);
        continue;
      }
      const action = this.chart.lanes[c.lane] as Action | undefined;
      return action ? { action, timeTo: c.time - t, gap: c.time - prev } : null;
    }
    return null;
  }

  private rigFor(encounter: number): EnemyRig {
    let rig = this.enemyRigs.get(encounter);
    if (!rig) {
      rig = buildEnemy(this.chart.encounters[encounter]!.enemy);
      this.scene.add(rig.root);
      this.enemyRigs.set(encounter, rig);
    }
    return rig;
  }

  private updateEnemies(t: number, phase: number): void {
    const session = this.session;
    const duel = session.duel;
    const k = duel.activeEncounter(t);
    const start = k === null ? 0 : (session.encounterStart(k) ?? 0);
    const cues = k === null ? [] : session.encounterCues(k);
    const tel = this.telegraph
      ? this.telegraph(k, start, cues, t)
      : telegraphAt(k, start, cues, t, {
          lead: DUEL.telegraphLead,
          resolve: DUEL.resolveTime,
          walkIn: this.walkIn,
        });
    const showing = new Set<number>();
    const walkDistance = ARENA.enterDistance - ARENA.duelDistance;
    const exitOf = (e: number) => {
      const st = duel.enemies[e]!;
      return st.state === 'defeated' || st.state === 'escaped'
        ? { kind: st.state, age: t - st.stateTime }
        : null;
    };

    if (tel.encounter !== null) {
      const enc = tel.encounter;
      const rig = this.rigFor(enc);
      showing.add(enc);
      poseEnemy(rig, {
        t,
        beatPhase: phase,
        enterAge: tel.enterAge,
        walkIn: this.walkIn,
        walkDistance,
        next: tel.next && { action: tel.next.action, progress: tel.next.progress },
        last: tel.last && {
          action: tel.last.action,
          age: tel.last.age,
          outcome: duel.outcome(tel.last.noteId),
        },
        exit: exitOf(enc),
      });
      if (!this.showEnemyIcon) rig.icon.visible = false;
      rig.root.position.z = -ARENA.duelDistance + (rig.root.userData.fwd as number);
      // the previous enemy finishes its exit while the next walks in
      const prev = enc - 1;
      const pe = prev >= 0 ? exitOf(prev) : null;
      if (pe && pe.kind === 'escaped' && pe.age < 0.7) {
        const prig = this.rigFor(prev);
        showing.add(prev);
        const ids = this.chart.encounters[prev]!.noteIds;
        poseEnemy(prig, {
          t,
          beatPhase: phase,
          enterAge: 99,
          walkIn: this.walkIn,
          walkDistance,
          next: null,
          last: { action: this.chart.notes[ids[ids.length - 1]!]!.action, age: 1, outcome: 'miss' },
          exit: pe,
        });
        prig.root.position.z = -ARENA.duelDistance + (prig.root.userData.fwd as number);
      }
    }
    for (const [e, rig] of this.enemyRigs) {
      if (!showing.has(e)) {
        this.scene.remove(rig.root);
        this.enemyRigs.delete(e);
      }
    }
  }
}
