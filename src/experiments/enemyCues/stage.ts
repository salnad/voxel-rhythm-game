/**
 * The shared runtime of the enemy-anchored cue experiments: bus wiring (outcomes, voided cues,
 * key legend state), press sound, camera framing and punch, hit flashes and screen shards.
 * Each experiment builds one of these and draws its own cue view on top.
 */
import * as THREE from 'three';
import type { Action } from '../../chart/types';
import { ACTION_SPECS, ENEMIES } from '../../config/actions';
import { CAMERA, PALETTE } from '../../config/visuals';
import type { Cue } from '../../game/conductor';
import type { EnemyRig } from '../../render/enemy';
import type { Judgement, JudgementEvent } from '../../rhythm/judge';
import type { ExperimentContext } from '../types';
import { drawKeyLegend, drawScreenFlash, Shards } from './draw';
import { kick, OutcomeLog, stageCues, wrongKeyCue, type CueOutcome, type StagedCue } from './logic';

/** A camera shot (world units), applied after the arena poses its default camera. */
export interface Framing {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}

/** Closer over-the-shoulder shot: the enemy fills the middle, the hero in the foreground. */
export const DUEL_CLOSEUP: Framing = {
  position: [2.1, 4.5, 4.1],
  lookAt: [-0.28, 1.3, -3.0],
  fov: 40,
};

/** Points on the enemy, in its body space before scale (feet at y = 0, facing +Z). */
export const ENEMY_SPOTS = {
  chest: new THREE.Vector3(0, 1.16, 0.3),
  core: new THREE.Vector3(0, 1.24, 0.12),
  /** Where the weapon is raised at the peak of an attack wind-up (above its right shoulder). */
  weapon: new THREE.Vector3(-0.3, 2.5, -0.25),
  slash: new THREE.Vector3(0, 1.17, 0.3),
  feet: new THREE.Vector3(0, 0.03, 0),
  head: new THREE.Vector3(0, 1.9, 0.2),
};
export type EnemySpot = keyof typeof ENEMY_SPOTS;

const tmp = new THREE.Vector3();
const PUNCH_LIFE = 0.14;
const POP_LIFE = 0.5;
/** A wrong key this close to another lane's cue (s) counts as a misread. */
const WRONG_KEY_WINDOW = 0.13;
const JUDGEMENT_LABEL: Record<Judgement, string> = {
  perfect: 'PERFECT',
  great: 'GREAT',
  good: 'GOOD',
  miss: 'MISS',
};
const easeOutQuad = (x: number) => 1 - (1 - x) * (1 - x);

function arenaFov(aspect: number, fov: number): number {
  return aspect < 1.2 ? fov * (1.2 / aspect) ** 0.6 : fov;
}

export interface StageOptions {
  framing?: Framing | null;
  /** Seconds judged/voided cues stay drawable (burst/crack animations). */
  linger?: number;
}

export interface HitInfo {
  cue: Cue;
  outcome: CueOutcome;
}

export class EnemyCueStage {
  readonly outcomes = new OutcomeLog();
  readonly voidedAt = new Map<number, number>();
  readonly shards = new Shards();
  readonly held: boolean[] = [false, false, false, false];
  readonly pressAt: number[] = [-10, -10, -10, -10];
  readonly hitAt: number[] = [-10, -10, -10, -10];
  /** Called on every judged cue (tap or hold start), after the outcome is logged. */
  onOutcome: ((h: HitInfo) => void) | null = null;
  /** Called on every key press (after the press sound). */
  onPress: ((action: Action, t: number) => void) | null = null;
  /** When a wrong key was pressed right on each cue (see wrongKeyCue). */
  readonly wrongAt = new Map<number, number>();
  now = 0;
  private punchAt = -10;
  private punchAmt = 0;
  private flashAt = -10;
  private flashColor = '#ffffff';
  private flashAmt = 0;
  private readonly pops: Array<{ x: number; y: number; o: CueOutcome; at: number }> = [];
  private readonly off: Array<() => void> = [];
  private readonly linger: number;

  constructor(
    private readonly ctx: ExperimentContext,
    private readonly opts: StageOptions = {},
  ) {
    this.linger = opts.linger ?? 0.5;
    const { session, chart, sfx } = ctx;
    this.off.push(
      session.bus.on('input', (i) => {
        if (i.lane < 0 || i.lane > 3) return;
        this.held[i.lane] = i.down;
        if (!i.down) return;
        this.pressAt[i.lane] = this.now;
        const action = chart.lanes[i.lane] as Action;
        sfx.swing(action);
        const wrong = wrongKeyCue(
          session.conductor.cues,
          i.lane,
          i.time,
          WRONG_KEY_WINDOW,
          session.judge,
        );
        if (wrong) {
          this.wrongAt.set(wrong.id, this.now);
          sfx.clank();
        }
        this.onPress?.(action, this.now);
      }),
      session.bus.on('judgement', (e) => this.onJudgement(e)),
      session.bus.on('cuesDropped', (ids) => {
        for (const id of ids) this.voidedAt.set(id, this.now);
      }),
    );
  }

  private onJudgement(e: JudgementEvent): void {
    const o = this.outcomes.record(e);
    if (!o) return;
    const cue = this.ctx.session.conductor.cues[e.noteId];
    if (!cue) return;
    if (o.judgement !== 'miss') this.hitAt[cue.lane] = this.now;
    this.onOutcome?.({ cue, outcome: o });
  }

  /** Cues to draw now, oldest first. */
  staged(t: number, approach: number): StagedCue<Cue>[] {
    return stageCues(
      this.ctx.session.conductor.cues,
      t,
      approach,
      this.linger,
      this.ctx.session.judge,
      this.outcomes,
      this.voidedAt,
    );
  }

  /** 0..1 shake for a cue the player just answered with the wrong key. */
  wrongShake(id: number, t: number): number {
    const at = this.wrongAt.get(id);
    return at === undefined ? 0 : kick(t - at, 0.3);
  }

  /** Camera kick toward the target (0..1). */
  punch(amount: number): void {
    const current = kick(this.now - this.punchAt, PUNCH_LIFE) * this.punchAmt;
    this.punchAt = this.now;
    this.punchAmt = Math.max(amount, current);
  }

  flash(color: string, amount: number): void {
    this.flashAt = this.now;
    this.flashColor = color;
    this.flashAmt = amount;
  }

  /** The standard hit reaction: a camera punch, plus a tinted impact frame on a perfect. */
  react(action: Action, o: CueOutcome): void {
    if (o.judgement === 'miss') return;
    const perfect = o.judgement === 'perfect';
    this.punch(perfect ? 1 : o.judgement === 'great' ? 0.55 : 0.3);
    if (perfect) this.flash(ACTION_SPECS[action].color, action === 'flourish' ? 0.22 : 0.12);
  }

  /** Per frame (from the experiment's update): camera framing and punch. */
  update(t: number, dt: number): void {
    this.now = t;
    this.shards.update(dt);
    this.outcomes.prune(t - 5);
    const cam = this.ctx.camera;
    const f = this.opts.framing;
    const p = kick(t - this.punchAt, PUNCH_LIFE) * this.punchAmt;
    if (f) {
      const [bx, by, bz] = CAMERA.position;
      const shake = tmp.set(cam.position.x - bx, cam.position.y - by, cam.position.z - bz);
      const pulse = arenaFov(cam.aspect, CAMERA.fov) - cam.fov;
      cam.position.set(...f.position).addScaledVector(shake, 0.6);
      cam.lookAt(...f.lookAt);
      cam.fov = arenaFov(cam.aspect, f.fov) - pulse;
    }
    if (p > 0) {
      const fwd = tmp.set(0, 0, -1).applyQuaternion(cam.quaternion);
      cam.position.addScaledVector(fwd, p * 0.28);
      cam.fov -= p * 1.6;
    }
    cam.updateProjectionMatrix();
  }

  /** Show a judgement word rising from a screen point (the contact point). */
  pop(x: number, y: number, o: CueOutcome): void {
    this.pops.push({ x, y, o, at: this.now });
    if (this.pops.length > 6) this.pops.shift();
  }

  private drawPops(c: CanvasRenderingContext2D, t: number): void {
    c.save();
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (const p of this.pops) {
      const age = t - p.at;
      if (age < 0 || age > POP_LIFE) continue;
      const k = age / POP_LIFE;
      const j = p.o.judgement;
      const color = PALETTE.judgement[j];
      const grow = j === 'perfect' ? 1 + 0.35 * kick(age, 0.12) : 1;
      c.globalAlpha = Math.min(1, (1 - k) * 2.2);
      c.font = `bold ${Math.round((j === 'miss' ? 20 : 22) * grow)}px monospace`;
      c.fillStyle = color;
      c.shadowColor = color;
      c.shadowBlur = 12;
      const y = p.y - 34 - easeOutQuad(k) * 26;
      c.fillText(JUDGEMENT_LABEL[j], p.x, y);
      c.shadowBlur = 0;
      if (j !== 'miss' && j !== 'perfect' && p.o.offset !== 0) {
        c.font = 'bold 11px monospace';
        c.fillText(p.o.offset < 0 ? 'EARLY' : 'LATE', p.x, y + 17);
      }
    }
    c.restore();
  }

  /** The combo counter beside the fight (from 4 up). */
  drawCombo(c: CanvasRenderingContext2D, x: number, y: number): void {
    const combo = this.ctx.session.score.combo;
    if (combo < 4) return;
    c.save();
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    const bump = 1 + 0.25 * kick(this.now - Math.max(...this.hitAt), 0.12);
    c.font = `bold ${Math.round(34 * bump)}px monospace`;
    c.fillStyle = 'rgba(230,255,233,0.9)';
    c.fillText(String(combo), x, y);
    c.font = '11px monospace';
    c.fillStyle = 'rgba(57,255,106,0.85)';
    c.fillText('COMBO', x + 2, y + 24);
    c.restore();
  }

  /** Per frame (from drawHud): shards, judgement pops, impact flash, key legend. */
  drawOverlay(c: CanvasRenderingContext2D, t: number, w: number, h: number, legend = true): void {
    this.shards.draw(c);
    this.drawPops(c, t);
    drawScreenFlash(c, w, h, this.flashColor, kick(t - this.flashAt, 0.1) * this.flashAmt);
    if (legend) drawKeyLegend(c, t, w, h, this.ctx.keys, this);
  }

  /** World position of a spot on the enemy on stage (null when no enemy is visible). */
  enemySpot(spot: EnemySpot, out = new THREE.Vector3()): THREE.Vector3 | null {
    const rig = this.ctx.arena.enemyRig();
    if (!rig) return null;
    return spotOn(rig, ENEMY_SPOTS[spot], out);
  }

  /** Screen position and pixels per world unit at a world point. */
  screenAt(p: THREE.Vector3): { x: number; y: number; ppu: number } {
    const a = this.ctx.arena.toScreen(p);
    const right = tmp.setFromMatrixColumn(this.ctx.camera.matrixWorld, 0);
    const b = this.ctx.arena.toScreen(p.clone().add(right));
    return { x: a.x, y: a.y, ppu: Math.hypot(b.x - a.x, b.y - a.y) };
  }

  dispose(): void {
    this.off.forEach((f) => f());
    this.shards.clear();
    this.pops.length = 0;
  }
}

/** World position of a body-space point on an enemy rig (accounts for walk-in scale and lean-free). */
export function spotOn(rig: EnemyRig, local: THREE.Vector3, out = new THREE.Vector3()) {
  const s = ENEMIES[rig.kind].scale;
  rig.root.updateMatrixWorld(true);
  return rig.root.localToWorld(out.copy(local).multiplyScalar(s));
}
