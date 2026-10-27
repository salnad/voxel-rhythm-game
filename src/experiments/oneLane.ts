import * as THREE from 'three';
import { ACTIONS } from '../chart/types';
import { ACTION_SPECS } from '../config/actions';
import { ARENA } from '../config/visuals';
import { keyLabel } from '../core/settings';
import type { Cue } from '../game/conductor';
import { COMBO_COLOR, RETRY_COLOR } from '../render/highway3d';
import { hexA } from '../render/icons';
import { drawBadge, drawImpact } from './enemyCues/draw';
import { clamp01, easeOut, hitStopAge, kick, stripX, type StagedCue } from './enemyCues/logic';
import { DUEL_CLOSEUP, EnemyCueStage } from './enemyCues/stage';
import type { Experiment, ExperimentContext, ExperimentRuntime } from './types';

type Layout = 'column' | 'strip';

/** Column: one floor lane from behind the enemy to the hero's sword reach. */
const COLUMN = {
  farZ: -9,
  hitZ: -ARENA.hitDistance,
  halfWidth: 0.5,
  /** Badges hover this high over the lane (world units) and are this big. */
  lift: 0.42,
  badge: 0.36,
};
/** Strip: Taiko-style horizontal track at the enemy's chest, the drum on the enemy. */
const STRIP = { height: 66, badge: 23, drum: 31 };
const STOP = { perfect: 0.055, other: 0.03 };
const BURST_LIFE = 0.24;
const LINGER = 0.45;

interface Pt {
  x: number;
  y: number;
}

class OneLaneRuntime implements ExperimentRuntime {
  private readonly stage: EnemyCueStage;
  private approach = 1;
  private readonly impacts: Array<Pt & { r: number; color: string; at: number }> = [];
  private hit: Pt & { r: number } = { x: 0, y: 0, r: 30 };
  private readonly v = new THREE.Vector3();

  constructor(
    private readonly ctx: ExperimentContext,
    private readonly layout: Layout,
  ) {
    this.stage = new EnemyCueStage(ctx, {
      framing: layout === 'strip' ? DUEL_CLOSEUP : null,
      linger: LINGER,
    });
    this.stage.onOutcome = ({ cue, outcome }) => {
      this.stage.react(cue.action, outcome);
      const p = this.hit;
      this.stage.pop(p.x, p.y - p.r * 1.1, outcome);
      if (outcome.judgement === 'miss') {
        this.stage.shards.crack(p.x, p.y, cue.action, p.r * 0.75);
        return;
      }
      const color = ACTION_SPECS[cue.action].color;
      const perfect = outcome.judgement === 'perfect';
      this.impacts.push({
        x: p.x,
        y: p.y,
        r: p.r * (perfect ? 1.6 : 1.2),
        color,
        at: this.stage.now,
      });
      this.stage.shards.burst(p.x, p.y, color, perfect ? 22 : 12, perfect ? 420 : 300, 5);
    };
  }

  update(t: number, dt: number, approach: number): void {
    this.approach = approach;
    this.stage.update(t, dt);
  }

  drawHud(c: CanvasRenderingContext2D, t: number, w: number, h: number): void {
    const staged = this.stage.staged(t, this.approach * 1.02);
    if (this.layout === 'column') this.drawColumn(c, t, staged);
    else this.drawStrip(c, t, w, staged);
    for (let i = this.impacts.length - 1; i >= 0; i--) {
      const im = this.impacts[i]!;
      if (t - im.at > 0.2) {
        this.impacts.splice(i, 1);
        continue;
      }
      drawImpact(c, im.x, im.y, im.r, im.color, kick(t - im.at, 0.2));
    }
    const comboAt =
      this.layout === 'strip'
        ? { x: this.hit.x + 70, y: this.hit.y - STRIP.height / 2 - 34 }
        : { x: this.hit.x + Math.max(150, w * 0.16), y: this.hit.y - 20 };
    this.stage.drawCombo(c, comboAt.x, comboAt.y);
    this.stage.drawOverlay(c, t, w, h);
  }

  private key(cue: Cue): string {
    return keyLabel(this.ctx.keys[ACTIONS.indexOf(cue.action)] ?? '');
  }

  /** Beat times (and whether each is a downbeat / in a combo measure) inside [t - back, t + A]. */
  private beats(
    t: number,
    back: number,
  ): Array<{ time: number; down: boolean; combo: string | null }> {
    const out: Array<{ time: number; down: boolean; combo: string | null }> = [];
    const bpb = this.ctx.chart.beatsPerBar;
    for (const p of this.ctx.session.conductor.plays) {
      if (p.start > t + this.approach) break;
      if (p.start + p.dur < t - back) continue;
      const combo = p.combo
        ? p.attempt > 1 || p.status === 'failed'
          ? RETRY_COLOR
          : COMBO_COLOR
        : null;
      for (let b = 0; b < bpb; b++) {
        const time = p.start + (p.dur * b) / bpb;
        if (time >= t - back && time <= t + this.approach) out.push({ time, down: b === 0, combo });
      }
    }
    return out;
  }

  // ------------------------------------------------------------------ column

  private floor(z: number, x: number, y = 0): Pt {
    return this.ctx.arena.toScreen(this.v.set(x, y, z));
  }

  private columnZ(tau: number): number {
    return COLUMN.hitZ + (COLUMN.farZ - COLUMN.hitZ) * (tau / this.approach);
  }

  private drawColumn(c: CanvasRenderingContext2D, t: number, staged: StagedCue<Cue>[]) {
    const { farZ, hitZ, halfWidth: hw, lift } = COLUMN;
    const nearZ = hitZ + 0.55;
    const fl = this.floor(farZ, -hw);
    const fr = this.floor(farZ, hw);
    const nl = this.floor(nearZ, -hw);
    const nr = this.floor(nearZ, hw);
    const grad = c.createLinearGradient(0, fl.y, 0, nl.y);
    grad.addColorStop(0, 'rgba(0,10,4,0)');
    grad.addColorStop(0.25, 'rgba(0,14,6,0.55)');
    grad.addColorStop(1, 'rgba(0,20,8,0.75)');
    c.save();
    c.fillStyle = grad;
    c.beginPath();
    c.moveTo(fl.x, fl.y);
    c.lineTo(fr.x, fr.y);
    c.lineTo(nr.x, nr.y);
    c.lineTo(nl.x, nl.y);
    c.closePath();
    c.fill();
    // rails (gold/red through combo measures)
    const rail = (side: number, z0: number, z1: number, color: string, width: number) => {
      const a = this.floor(z0, side * hw);
      const b = this.floor(z1, side * hw);
      c.strokeStyle = color;
      c.lineWidth = width;
      c.beginPath();
      c.moveTo(a.x, a.y);
      c.lineTo(b.x, b.y);
      c.stroke();
    };
    for (const s of [-1, 1]) rail(s, farZ, nearZ, 'rgba(200,255,216,0.45)', 1.5);
    const beats = this.beats(t, 0.1);
    for (const b of beats) {
      const z = this.columnZ(b.time - t);
      if (z > nearZ) continue;
      const a = this.floor(z, -hw);
      const e = this.floor(z, hw);
      const far = (hitZ - z) / (hitZ - farZ);
      c.strokeStyle = `rgba(200,255,216,${(b.down ? 0.4 : 0.16) * (1 - far * 0.7)})`;
      c.lineWidth = b.down ? 2 : 1;
      c.beginPath();
      c.moveTo(a.x, a.y);
      c.lineTo(e.x, e.y);
      c.stroke();
    }
    for (const p of this.ctx.session.conductor.plays) {
      if (!p.combo || p.start > t + this.approach || p.start + p.dur < t) continue;
      const z0 = Math.min(nearZ, this.columnZ(p.start - t));
      const z1 = Math.max(farZ, this.columnZ(p.start + p.dur - t));
      const color = p.attempt > 1 || p.status === 'failed' ? RETRY_COLOR : COMBO_COLOR;
      for (const s of [-1, 1]) rail(s * 1.06, z0, z1, color, 4);
    }
    c.restore();

    // the hit gate at the hero's sword reach
    const gate = this.ctx.arena.toScreen(this.v.set(0, lift, hitZ));
    const ppu = this.stage.screenAt(this.v.set(0, lift, hitZ)).ppu;
    const r = COLUMN.badge * ppu * 1.2;
    this.hit = { x: gate.x, y: gate.y, r };
    this.drawGate(c, t, gate.x, gate.y, r, staged);

    for (let i = staged.length - 1; i >= 0; i--) {
      const s = staged[i]!;
      if (s.stage === 'incoming' || s.stage === 'holding') {
        const tau = s.stage === 'holding' ? 0 : s.tau;
        const z = this.columnZ(Math.max(tau, -0.12));
        const p = this.ctx.arena.toScreen(this.v.set(0, lift, z));
        const shadow = this.floor(z, 0);
        const pr = COLUMN.badge * this.stage.screenAt(this.v.set(0, lift, z)).ppu;
        const far = (hitZ - z) / (hitZ - farZ);
        const fade = clamp01((1 - far) / 0.15) * (tau < 0 ? 0.5 : 1);
        c.save();
        c.globalAlpha = 0.35 * fade;
        c.fillStyle = '#000000';
        c.beginPath();
        c.ellipse(shadow.x, shadow.y, pr * 0.8, pr * 0.25, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
        drawBadge(c, s.cue.action, p.x, p.y, pr, {
          alpha: fade,
          key: pr > 10 ? this.key(s.cue) : undefined,
          wrong: this.stage.wrongShake(s.cue.id, t),
        });
      } else if (s.stage === 'hit') {
        this.drawBurst(c, s, gate.x, gate.y, r * 0.85);
      }
    }
  }

  private drawGate(
    c: CanvasRenderingContext2D,
    t: number,
    x: number,
    y: number,
    r: number,
    staged: StagedCue<Cue>[],
  ) {
    const beat = this.ctx.session.conductor.beatAt(t);
    const pulse = Math.pow(1 - (beat - Math.floor(beat)), 4);
    const lastPress = Math.max(...this.stage.pressAt);
    const lane = this.stage.pressAt.indexOf(lastPress);
    const press = kick(t - lastPress, 0.14);
    const next = staged.find((s) => s.stage === 'incoming');
    const near = next ? clamp01(1 - next.tau / 0.4) : 0;
    const pressColor = ACTION_SPECS[ACTIONS[lane] ?? 'block'].color;
    c.save();
    c.fillStyle = press > 0 ? hexA(pressColor, 0.35 * press) : 'rgba(0,10,4,0.45)';
    c.beginPath();
    c.arc(x, y, r * (1 + press * 0.12), 0, Math.PI * 2);
    c.fill();
    c.lineWidth = 3 + pulse * 1.5;
    c.strokeStyle =
      press > 0 ? pressColor : `rgba(230,255,233,${0.7 + 0.3 * Math.max(pulse, near)})`;
    c.shadowColor = '#e6ffe9';
    c.shadowBlur = 6 + near * 10;
    c.stroke();
    c.shadowBlur = 0;
    c.lineWidth = 1;
    c.strokeStyle = 'rgba(230,255,233,0.4)';
    c.beginPath();
    c.arc(x, y, r * 0.72, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }

  private drawBurst(
    c: CanvasRenderingContext2D,
    s: StagedCue<Cue>,
    x: number,
    y: number,
    r: number,
  ) {
    const stop = s.outcome?.judgement === 'perfect' ? STOP.perfect : STOP.other;
    const age = hitStopAge(s.age, stop);
    if (age >= BURST_LIFE) return;
    const e = easeOut(age / BURST_LIFE);
    drawBadge(c, s.cue.action, x, y, r * (1.1 + e * 0.9), {
      alpha: 1 - e,
      flash: s.age < stop ? 1 : 0,
    });
  }

  // ------------------------------------------------------------------ strip

  private drawStrip(c: CanvasRenderingContext2D, t: number, w: number, staged: StagedCue<Cue>[]) {
    const spot = this.stage.enemySpot('chest');
    if (spot) {
      const at = this.stage.screenAt(spot);
      this.hit = { x: at.x, y: at.y, r: STRIP.drum };
    }
    const { x: dx, y } = this.hit;
    const H = STRIP.height;
    const x0 = w - 24;
    const left = dx - 90;
    c.save();
    const grad = c.createLinearGradient(left, 0, x0, 0);
    grad.addColorStop(0, 'rgba(0,10,4,0)');
    grad.addColorStop(0.08, 'rgba(0,14,6,0.5)');
    grad.addColorStop(1, 'rgba(0,14,6,0.62)');
    c.fillStyle = grad;
    c.fillRect(left, y - H / 2, x0 - left + 24, H);
    // rails, gold/red through combo measures
    c.fillStyle = 'rgba(200,255,216,0.35)';
    c.fillRect(left + 20, y - H / 2, x0 - left, 1.5);
    c.fillRect(left + 20, y + H / 2 - 1.5, x0 - left, 1.5);
    for (const p of this.ctx.session.conductor.plays) {
      if (!p.combo || p.start > t + this.approach || p.start + p.dur < t) continue;
      const a = Math.max(dx, stripX(p.start - t, this.approach, x0, dx));
      const b = Math.min(x0, stripX(p.start + p.dur - t, this.approach, x0, dx));
      c.fillStyle = p.attempt > 1 || p.status === 'failed' ? RETRY_COLOR : COMBO_COLOR;
      c.fillRect(a, y - H / 2 - 2, b - a, 4);
      c.fillRect(a, y + H / 2 - 2, b - a, 4);
    }
    for (const b of this.beats(t, 0.05)) {
      const x = stripX(b.time - t, this.approach, x0, dx);
      if (x < dx + STRIP.drum) continue;
      c.fillStyle = `rgba(200,255,216,${b.down ? 0.42 : 0.16})`;
      const bh = b.down ? H : H * 0.45;
      c.fillRect(x - (b.down ? 1 : 0.5), y - bh / 2, b.down ? 2 : 1, bh);
    }
    c.restore();

    this.drawGate(c, t, dx, y, STRIP.drum, staged);

    for (let i = staged.length - 1; i >= 0; i--) {
      const s = staged[i]!;
      if (s.stage === 'incoming' || s.stage === 'holding') {
        const tau = s.stage === 'holding' ? 0 : s.tau;
        const x = stripX(Math.max(tau, -0.15), this.approach, x0, dx);
        const fade = clamp01((x0 - x) / 60) * (tau < 0 ? 0.5 : 1);
        drawBadge(c, s.cue.action, x, y, STRIP.badge, {
          alpha: fade,
          key: this.key(s.cue),
          wrong: this.stage.wrongShake(s.cue.id, t),
        });
      } else if (s.stage === 'hit') {
        this.drawBurst(c, s, dx, y, STRIP.badge);
      }
    }
  }

  dispose(): void {
    this.stage.dispose();
    this.impacts.length = 0;
  }
}

const HOW_KEYS =
  'Read the badge: A blue shield BLOCK · S green diamond SLASH · D amber arrow STAB · F pink star FLOURISH.';

/** Taiko-style single lane: every cue travels one column; colour + shape say which key. */
export const oneLane: Experiment = {
  key: 'one-lane',
  label: 'ONE LANE · COLUMN',
  tagline: 'One central lane through the enemy: badge colour and shape say which key.',
  hypothesis:
    'Mapping actions to lane positions costs attention. With one lane through the fight and the key read from badge colour + shape (Taiko’s don/ka), the eyes stay on a narrow column over the enemy: readability and fun match or beat the 4-lane baseline.',
  inspiration: ['Taiko no Tatsujin', 'Thumper', 'Rhythm Heaven'],
  howTo: [
    'Every cue slides down one lane, through the enemy, to the ring in front of you.',
    HOW_KEYS,
    'Press as the badge reaches the ring.',
  ],
  options: {
    musicMapping: 'instruments',
    highway: false,
    laneLabels: false,
    judgementHud: false,
    approachSeconds: 1.35,
    keyLegend: 'A S D F',
  },
  create: (ctx) => new OneLaneRuntime(ctx, 'column'),
};

/** Taiko's horizontal strip at the enemy's chest: badges slide in from the right onto the enemy. */
export const oneLaneStrip: Experiment = {
  key: 'one-lane-strip',
  label: 'ONE LANE · TAIKO STRIP',
  tagline: 'One horizontal track at the enemy’s chest: badges slide onto the enemy, Taiko style.',
  hypothesis:
    'A Taiko-style horizontal strip whose drum sits on the enemy’s chest keeps cue, timing and target on one line through the fight; reading colour + shape for the key is no harder than lane position, and fun rises over the 4-lane baseline.',
  inspiration: ['Taiko no Tatsujin', 'Rhythm Heaven', 'Muse Dash'],
  howTo: [
    'Badges slide in from the right along one track onto the ring on the enemy’s chest.',
    HOW_KEYS,
    'Press as the badge reaches the ring.',
  ],
  options: {
    musicMapping: 'instruments',
    highway: false,
    laneLabels: false,
    enemyIcon: false,
    judgementHud: false,
    approachSeconds: 1.7,
    keyLegend: 'A S D F',
  },
  create: (ctx) => new OneLaneRuntime(ctx, 'strip'),
};
