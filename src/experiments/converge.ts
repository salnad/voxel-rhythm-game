import { ACTIONS, type Action } from '../chart/types';
import { ACTION_SPECS } from '../config/actions';
import { keyLabel } from '../core/settings';
import type { Cue } from '../game/conductor';
import { hexA } from '../render/icons';
import { drawBadge, drawDroppedBadge, drawImpact } from './enemyCues/draw';
import {
  clamp01,
  convergeOffset,
  easeOut,
  fanAngle,
  hitStopAge,
  kick,
  type StagedCue,
} from './enemyCues/logic';
import { DUEL_CLOSEUP, EnemyCueStage } from './enemyCues/stage';
import type { Experiment, ExperimentContext, ExperimentRuntime } from './types';

const DEG = Math.PI / 180;
/** Badges spawn across an upper fan, sweeping ±SPREAD in STEP increments cue after cue. */
const SPREAD = 78 * DEG;
const STEP = 26 * DEG;
/** Extra swirl on the way in (radians over the whole flight). */
const CURL = 0.55;
/** Spawn distance from the target as a fraction of the screen height. */
const RADIUS = 0.4;
const BADGE_PX = 23;
const STOP = { perfect: 0.055, other: 0.03 };
const BURST_LIFE = 0.24;
const LINGER = 0.5;
const ORBIT_MAX = 12;
const ORBIT_R = 46;

interface Impact {
  x: number;
  y: number;
  r: number;
  color: string;
  at: number;
}

class ConvergeRuntime implements ExperimentRuntime {
  private readonly stage: EnemyCueStage;
  private approach = 1;
  private readonly impacts: Impact[] = [];
  private target: { x: number; y: number; ppu: number } | null = null;
  private lastTarget = { x: 0, y: 0, ppu: 100 };
  /** Landed badges stick and orbit the chest (success builds up); a miss knocks them off. */
  private readonly orbit: Array<{ action: Action; at: number }> = [];
  private readonly offDuel: () => void;

  constructor(private readonly ctx: ExperimentContext) {
    this.stage = new EnemyCueStage(ctx, { framing: DUEL_CLOSEUP, linger: LINGER });
    this.stage.onOutcome = ({ cue, outcome }) => {
      this.stage.react(cue.action, outcome);
      const tg = this.lastTarget;
      this.stage.pop(tg.x - 95, tg.y + 10, outcome);
      if (outcome.judgement === 'miss') {
        this.stage.shards.crack(tg.x, tg.y, cue.action, BADGE_PX);
        this.scatterOrbit('#5d6b63', 160);
        return;
      }
      this.orbit.push({ action: cue.action, at: this.stage.now });
      if (this.orbit.length > ORBIT_MAX) this.orbit.shift();
      const color = ACTION_SPECS[cue.action].color;
      const perfect = outcome.judgement === 'perfect';
      this.impacts.push({ x: tg.x, y: tg.y, r: perfect ? 46 : 34, color, at: this.stage.now });
      this.stage.shards.burst(tg.x, tg.y, color, perfect ? 24 : 14, perfect ? 440 : 320, 5);
    };
    this.offDuel = ctx.session.bus.on('duel', (d) => {
      if (d.type === 'defeated') this.scatterOrbit(null, 520);
      else if (d.type === 'enemyEnter' || d.type === 'escaped') this.orbit.length = 0;
    });
  }

  /** Knock the stuck badges off: grey on a miss, a coloured blast when the enemy falls. */
  private scatterOrbit(color: string | null, speed: number) {
    const tg = this.lastTarget;
    this.orbit.forEach((o, i) => {
      const at = this.orbitPos(i, this.stage.now, tg.x, tg.y);
      this.stage.shards.burst(at.x, at.y, color ?? ACTION_SPECS[o.action].color, 4, speed, 5);
    });
    this.orbit.length = 0;
  }

  private orbitPos(i: number, t: number, x: number, y: number) {
    const o = this.orbit[i]!;
    const grow = easeOut((t - o.at) / 0.15);
    const a = (i / ORBIT_MAX) * Math.PI * 2 + t * 1.3;
    const r = ORBIT_R * grow;
    return { x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.8 };
  }

  update(t: number, dt: number, approach: number): void {
    this.approach = approach;
    this.stage.update(t, dt);
  }

  drawHud(c: CanvasRenderingContext2D, t: number, w: number, h: number): void {
    const spot = this.stage.enemySpot('chest');
    this.target = spot ? this.stage.screenAt(spot) : null;
    if (this.target) this.lastTarget = this.target;
    const tg = this.lastTarget;
    const R = h * RADIUS;
    const staged = this.stage.staged(t, this.approach);
    if (this.target) {
      this.drawBeatRings(c, t, tg.x, tg.y, R);
      this.drawReticle(c, t, tg.x, tg.y, staged);
    }
    if (this.target)
      this.orbit.forEach((o, i) => {
        const p = this.orbitPos(i, t, tg.x, tg.y);
        drawBadge(c, o.action, p.x, p.y, 6, { glow: 6 });
      });
    // far badges first so the next one draws on top
    for (let i = staged.length - 1; i >= 0; i--) this.drawCue(c, staged[i]!, t, tg.x, tg.y, R);
    for (let i = this.impacts.length - 1; i >= 0; i--) {
      const im = this.impacts[i]!;
      if (t - im.at > 0.2) {
        this.impacts.splice(i, 1);
        continue;
      }
      drawImpact(c, im.x, im.y, im.r, im.color, kick(t - im.at, 0.2));
    }
    if (this.target) this.stage.drawCombo(c, tg.x + 70, tg.y + Math.max(110, h * 0.17));
    this.stage.drawOverlay(c, t, w, h);
  }

  /** Faint circles shrinking onto the target, one per upcoming beat: the rhythm grid. */
  private drawBeatRings(c: CanvasRenderingContext2D, t: number, x: number, y: number, R: number) {
    const A = this.approach;
    const bpb = this.ctx.chart.beatsPerBar;
    c.save();
    for (const p of this.ctx.session.conductor.plays) {
      if (p.start > t + A) break;
      if (p.start + p.dur < t) continue;
      for (let b = 0; b < bpb; b++) {
        const bt = p.start + (p.dur * b) / bpb;
        const tau = bt - t;
        if (tau <= 0.02 || tau > A) continue;
        const k = tau / A;
        c.globalAlpha = (b === 0 ? 0.3 : 0.14) * (1 - k * 0.6) * clamp01((A - tau) / (A * 0.25));
        c.strokeStyle = p.combo ? '#ffd23b' : '#c8ffd8';
        c.lineWidth = b === 0 ? 2 : 1;
        c.beginPath();
        c.arc(x, y, R * k, 0, Math.PI * 2);
        c.stroke();
      }
    }
    c.restore();
  }

  /** The landing spot on the enemy's chest: pulses on the beat, tints to the next cue. */
  private drawReticle(
    c: CanvasRenderingContext2D,
    t: number,
    x: number,
    y: number,
    staged: StagedCue<Cue>[],
  ) {
    const next = staged.find((s) => s.stage === 'incoming');
    const beat = this.ctx.session.conductor.beatAt(t);
    const pulse = Math.pow(1 - (beat - Math.floor(beat)), 4);
    const press = Math.max(...this.stage.pressAt.map((p) => kick(t - p, 0.12)));
    const color = next ? ACTION_SPECS[next.cue.action].color : '#c8ffd8';
    const near = next ? clamp01(1 - next.tau / 0.5) : 0;
    const r = 27 + pulse * 3 + press * 6;
    c.save();
    c.fillStyle = 'rgba(0,10,4,0.3)';
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 0.75 + 0.25 * near;
    c.strokeStyle = near > 0 ? hexA(color, 1) : 'rgba(230,255,233,0.85)';
    c.lineWidth = 2.5 + near * 1.5;
    c.shadowColor = color;
    c.shadowBlur = 8 + near * 10;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.stroke();
    c.shadowBlur = 0;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      c.beginPath();
      c.moveTo(x + Math.cos(a) * (r + 4), y + Math.sin(a) * (r + 4));
      c.lineTo(x + Math.cos(a) * (r + 11), y + Math.sin(a) * (r + 11));
      c.stroke();
    }
    c.restore();
  }

  private drawCue(
    c: CanvasRenderingContext2D,
    s: StagedCue<Cue>,
    t: number,
    x: number,
    y: number,
    R: number,
  ) {
    const A = this.approach;
    const action = s.cue.action;
    const angle = fanAngle(s.cue.id, SPREAD, STEP);
    const key = keyLabel(this.ctx.keys[ACTIONS.indexOf(action)] ?? '');
    const color = ACTION_SPECS[action].color;
    if (s.stage === 'incoming' || s.stage === 'holding') {
      const tau = s.stage === 'holding' ? 0 : Math.max(0, s.tau);
      const o = convergeOffset(tau, A, angle, R, CURL);
      const k = clamp01(tau / A);
      const fade = clamp01((A - s.tau) / (A * 0.18));
      const size = BADGE_PX * (0.75 + 0.35 * (1 - k));
      // late: sits on the target, blinking
      const late = s.tau < 0 ? 0.5 + 0.5 * Math.sin(t * 60) : 1;
      // motion trail back along the path
      const tail = convergeOffset(Math.min(A, tau + 0.12), A, angle, R, CURL);
      const grad = c.createLinearGradient(x + tail.x, y + tail.y, x + o.x, y + o.y);
      grad.addColorStop(0, hexA(color, 0));
      grad.addColorStop(1, hexA(color, 0.55 * fade));
      c.save();
      c.strokeStyle = grad;
      c.lineWidth = size * 0.9;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(x + tail.x, y + tail.y);
      c.lineTo(x + o.x, y + o.y);
      c.stroke();
      c.restore();
      drawBadge(c, action, x + o.x, y + o.y, size, {
        alpha: fade * late,
        key: k < 0.85 ? key : undefined,
        wrong: this.stage.wrongShake(s.cue.id, t),
      });
      return;
    }
    if (s.stage === 'hit') {
      const stop = s.outcome?.judgement === 'perfect' ? STOP.perfect : STOP.other;
      const age = hitStopAge(s.age, stop);
      if (age >= BURST_LIFE) return;
      const e = easeOut(age / BURST_LIFE);
      // stamped flat onto the chest, then blown outward
      drawBadge(c, action, x, y, BADGE_PX * (1.15 + e * 0.9), {
        alpha: 1 - e,
        flash: s.age < stop ? 1 : 0,
      });
      return;
    }
    if (s.stage === 'void') {
      const o = convergeOffset(Math.max(0, s.tau + s.age), A, angle, R, CURL);
      drawDroppedBadge(c, action, x + o.x, y + o.y, BADGE_PX, s.age, LINGER);
      return;
    }
    // miss: the badge cracked on the enemy (shards); a red cross marks the spot
    const k = clamp01(s.age / LINGER);
    c.save();
    c.globalAlpha = Math.max(0, 0.6 - k * 3);
    c.strokeStyle = '#ff3b5c';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x - 10, y - 10);
    c.lineTo(x + 10, y + 10);
    c.moveTo(x + 10, y - 10);
    c.lineTo(x - 10, y + 10);
    c.stroke();
    c.restore();
  }

  dispose(): void {
    this.offDuel();
    this.stage.dispose();
    this.impacts.length = 0;
    this.orbit.length = 0;
  }
}

/** Salil's "badges falling at the enemy": cue badges fly in from around it and land on its chest. */
export const converge: Experiment = {
  key: 'converge',
  label: 'CONVERGE · BADGES ONTO THE ENEMY',
  tagline: 'No lanes: cue badges fly in from around the enemy and land on its chest on the beat.',
  hypothesis:
    'When every cue badge flies into the enemy and lands on its chest exactly on the hit time, timing and fiction coincide and the eyes never leave the fight: fun and music connection rise over the 4-lane baseline without losing readability.',
  inspiration: ['Rhythm Heaven', 'Sayonara Wild Hearts', 'Thumper'],
  howTo: [
    'Badges fly in from around the enemy and land on its chest. Press as one lands.',
    'The badge says which key: A blue shield BLOCK · S green diamond SLASH · D amber arrow STAB · F pink star FLOURISH.',
    'The faint circles closing in are beats: badges on the same circle land together.',
  ],
  options: {
    musicMapping: 'instruments',
    highway: false,
    laneLabels: false,
    enemyIcon: false,
    judgementHud: false,
    approachSeconds: 1.5,
    keyLegend: 'A S D F',
  },
  create: (ctx) => new ConvergeRuntime(ctx),
};
