import * as THREE from 'three';
import { ACTIONS, type Action } from '../chart/types';
import { ACTION_SPECS, ENEMIES } from '../config/actions';
import { keyLabel } from '../core/settings';
import type { Cue } from '../game/conductor';
import { drawActionIcon, hexA } from '../render/icons';
import { drawImpact } from './enemyCues/draw';
import {
  clamp01,
  easeOut,
  ghostAlphas,
  hitStopAge,
  kick,
  ringScale,
  type StagedCue,
} from './enemyCues/logic';
import { DUEL_CLOSEUP, EnemyCueStage, type EnemySpot } from './enemyCues/stage';
import type { Experiment, ExperimentContext, ExperimentRuntime } from './types';

/** Where each action's target sits on the enemy, and its size (world units at enemy scale 1). */
const TARGETS: Record<Action, { spot: EnemySpot; r: number }> = {
  block: { spot: 'weapon', r: 0.42 },
  slash: { spot: 'slash', r: 0.62 },
  stab: { spot: 'core', r: 0.19 },
  flourish: { spot: 'feet', r: 0.85 },
};
/** The approach ring starts this many times the target's size. */
const RING_FROM = 3.2;
/** Faint previews of the cues after the next one. */
const GHOSTS = [0.34, 0.14];
/** Hit-stop on the burst (s) for perfect / other hits. */
const STOP = { perfect: 0.055, other: 0.03 };
const BURST_LIFE = 0.26;
const CRACK_LIFE = 0.42;
const SLASH_MINOR = 0.32;

/** A target in screen space: a circle, a slanted ellipse (slash) or a projected floor ring. */
interface Shape {
  x: number;
  y: number;
  /** Radius (circle) or semi-major axis (ellipse/floor). */
  r: number;
  ry: number;
  rot: number;
  /** Where to draw the icon and key. */
  ix: number;
  iy: number;
  /** Icon radius. */
  ir: number;
}

function shapePath(c: CanvasRenderingContext2D, s: Shape, k: number): void {
  c.beginPath();
  c.ellipse(s.x, s.y, Math.max(0.5, s.r * k), Math.max(0.5, s.ry * k), s.rot, 0, Math.PI * 2);
}

const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

class ApproachRingRuntime implements ExperimentRuntime {
  private readonly stage: EnemyCueStage;
  private approach = 1;
  private readonly impacts: Array<{ x: number; y: number; r: number; color: string; at: number }> =
    [];

  constructor(private readonly ctx: ExperimentContext) {
    this.stage = new EnemyCueStage(ctx, { framing: DUEL_CLOSEUP, linger: CRACK_LIFE });
    this.stage.onOutcome = ({ cue, outcome }) => {
      this.stage.react(cue.action, outcome);
      const s = this.shapeFor(cue.action);
      if (!s) return;
      const color = ACTION_SPECS[cue.action].color;
      this.stage.pop(s.x, s.y - s.ry * 0.6, outcome);
      if (outcome.judgement === 'miss') {
        this.stage.shards.burst(s.x, s.y, '#5d6b63', 6, 120, 3);
        return;
      }
      const perfect = outcome.judgement === 'perfect';
      this.impacts.push({ x: s.x, y: s.y, r: Math.max(26, s.r * 1.2), color, at: this.stage.now });
      this.stage.shards.burst(s.x, s.y, color, perfect ? 22 : 12, perfect ? 420 : 300, 5);
    };
  }

  update(t: number, dt: number, approach: number): void {
    this.approach = approach;
    this.stage.update(t, dt);
  }

  /** The action's target on the enemy on stage, in screen space (null with no enemy). */
  private shapeFor(action: Action): Shape | null {
    const rig = this.ctx.arena.enemyRig();
    if (!rig) return null;
    const tg = TARGETS[action];
    const p = this.stage.enemySpot(tg.spot, tmpA);
    if (!p) return null;
    const scale = ENEMIES[rig.kind].scale * rig.root.scale.x;
    const r = tg.r * scale;
    const at = this.stage.screenAt(p);
    if (action === 'flourish') {
      // floor ring: project its right and front points to get the screen ellipse
      const side = this.ctx.arena.toScreen(tmpB.copy(p).add(new THREE.Vector3(r, 0, 0)));
      const front = this.ctx.arena.toScreen(tmpB.copy(p).add(new THREE.Vector3(0, 0, r)));
      const rx = Math.abs(side.x - at.x);
      const ry = Math.max(4, Math.abs(front.y - at.y));
      return { x: at.x, y: at.y, r: rx, ry, rot: 0, ix: at.x, iy: at.y + ry, ir: 13 };
    }
    if (action === 'slash') {
      // along the enemy's diagonal cut line (rising to its left = screen right)
      const dir = new THREE.Vector3(Math.cos(0.6), Math.sin(0.6), 0).multiplyScalar(r);
      const end = this.ctx.arena.toScreen(tmpB.copy(p).add(dir));
      const rot = Math.atan2(end.y - at.y, end.x - at.x);
      const len = Math.hypot(end.x - at.x, end.y - at.y);
      return {
        x: at.x,
        y: at.y,
        r: len,
        ry: len * SLASH_MINOR,
        rot,
        ix: at.x + Math.cos(rot) * len * 0.62,
        iy: at.y + Math.sin(rot) * len * 0.62 - len * 0.34,
        ir: Math.max(9, len * 0.2),
      };
    }
    const rp = r * at.ppu;
    return {
      x: at.x,
      y: at.y,
      r: rp,
      ry: rp,
      rot: 0,
      ix: at.x,
      iy: at.y,
      ir: Math.max(8, rp * (action === 'stab' ? 0.75 : 0.5)),
    };
  }

  drawHud(c: CanvasRenderingContext2D, t: number, w: number, h: number): void {
    const staged = this.stage.staged(t, this.approach);
    const alphas = ghostAlphas(staged, GHOSTS);
    // ghosts first (furthest in time at the back), the next cue on top
    const order = staged.map((s, i) => ({ s, a: alphas[i]! })).reverse();
    for (const { s, a } of order) this.drawCue(c, s, a, t);
    for (let i = this.impacts.length - 1; i >= 0; i--) {
      const im = this.impacts[i]!;
      const k = kick(t - im.at, 0.18);
      if (k <= 0 && t - im.at > 0.18) {
        this.impacts.splice(i, 1);
        continue;
      }
      drawImpact(c, im.x, im.y, im.r, im.color, k);
    }
    const chest = this.shapeFor('stab');
    if (chest) this.stage.drawCombo(c, chest.x + Math.max(110, w * 0.12), chest.y + 30);
    this.stage.drawOverlay(c, t, w, h);
  }

  private drawCue(c: CanvasRenderingContext2D, s: StagedCue<Cue>, alpha: number, t: number) {
    if (alpha <= 0.01) return;
    const action = s.cue.action;
    const base = this.shapeFor(action);
    if (!base) return;
    const wrong = this.stage.wrongShake(s.cue.id, t);
    const jx = wrong > 0 ? Math.sin(wrong * 40) * 6 * wrong : 0;
    const shape = { ...base, x: base.x + jx, ix: base.ix + jx };
    const color = ACTION_SPECS[action].color;
    c.save();
    if (s.stage === 'incoming' || s.stage === 'holding') {
      const A = this.approach;
      // fade in over the first 40% of the approach
      const fade = clamp01((A - s.tau) / (A * 0.4));
      const k =
        s.stage === 'holding'
          ? 1
          : Math.max(0.86, ringScale(s.tau, A, RING_FROM) - (s.tau < 0 ? -s.tau * 1.2 : 0));
      const closeness = clamp01(1 - s.tau / A);
      this.drawTarget(c, action, shape, alpha * fade, s.stage === 'holding' ? 1 : 0, t);
      if (wrong > 0.05 && alpha >= 1) {
        c.globalAlpha = wrong;
        c.strokeStyle = '#ff3b5c';
        c.lineWidth = 5;
        shapePath(c, shape, 1.08);
        c.stroke();
      }
      if (s.stage === 'incoming') {
        c.globalAlpha = alpha * fade * (0.35 + 0.65 * closeness);
        c.strokeStyle = color;
        c.shadowColor = color;
        c.shadowBlur = alpha >= 1 ? 10 : 0;
        c.lineWidth = alpha >= 1 ? 2.5 + 2.5 * closeness : 2;
        shapePath(c, shape, k);
        c.stroke();
      } else if (s.cue.endTime !== null) {
        const p = clamp01((t - s.cue.time) / (s.cue.endTime - s.cue.time));
        c.globalAlpha = 1;
        c.strokeStyle = '#ffffff';
        c.lineWidth = 5;
        c.beginPath();
        c.ellipse(
          shape.x,
          shape.y,
          shape.r * 1.15,
          shape.ry * 1.15,
          shape.rot,
          -Math.PI / 2,
          -Math.PI / 2 + p * Math.PI * 2,
        );
        c.stroke();
      }
    } else if (s.stage === 'hit') {
      const stop = s.outcome?.judgement === 'perfect' ? STOP.perfect : STOP.other;
      const age = hitStopAge(s.age, stop);
      const k = easeOut(age / BURST_LIFE);
      if (age < BURST_LIFE) {
        const white = s.age < stop ? 1 : 0;
        c.globalAlpha = 1 - k;
        c.lineWidth = 6 * (1 - k) + 1;
        c.strokeStyle = white ? '#ffffff' : color;
        c.shadowColor = color;
        c.shadowBlur = 18;
        shapePath(c, shape, 1 + k * 0.7);
        c.stroke();
        if (white) {
          c.globalAlpha = 0.55;
          c.fillStyle = hexA(color, 1);
          shapePath(c, shape, 1);
          c.fill();
        }
      }
    } else {
      // miss or voided: the target cracks into falling arcs
      const k = clamp01(s.age / CRACK_LIFE);
      c.globalAlpha = 1 - k;
      c.lineWidth = 3;
      c.strokeStyle = s.stage === 'miss' ? '#ff3b5c' : '#5d6b63';
      for (let i = 0; i < 4; i++) {
        const a0 = (i / 4) * Math.PI * 2 + 0.2;
        const mid = a0 + Math.PI / 4;
        const dx = Math.cos(mid) * k * 26;
        const dy = Math.sin(mid) * k * 14 + k * k * 120;
        c.beginPath();
        c.ellipse(
          shape.x + dx,
          shape.y + dy,
          shape.r,
          shape.ry,
          shape.rot,
          a0,
          a0 + Math.PI / 2 - 0.25,
        );
        c.stroke();
      }
    }
    c.restore();
  }

  /** The hit target ("hit circle"): dark fill, coloured rim, icon and key. */
  private drawTarget(
    c: CanvasRenderingContext2D,
    action: Action,
    s: Shape,
    alpha: number,
    hold: number,
    t: number,
  ) {
    if (alpha <= 0.01) return;
    const color = ACTION_SPECS[action].color;
    const full = alpha >= 0.99;
    c.globalAlpha = alpha;
    shapePath(c, s, 1);
    c.fillStyle = action === 'flourish' ? hexA(color, 0.16 + hold * 0.2) : 'rgba(0,8,3,0.32)';
    c.fill();
    c.lineWidth = full ? 4 : 2.5;
    c.strokeStyle = color;
    c.shadowColor = color;
    c.shadowBlur = full ? 16 : 0;
    c.stroke();
    c.shadowBlur = 0;
    c.lineWidth = 1.2;
    c.strokeStyle = hexA('#ffffff', 0.7);
    shapePath(c, s, 0.86);
    c.stroke();
    if (action === 'slash') {
      // the cut line itself, across the chest
      c.lineWidth = 2.5;
      c.strokeStyle = '#ffffff';
      c.beginPath();
      c.moveTo(s.x - Math.cos(s.rot) * s.r * 0.95, s.y - Math.sin(s.rot) * s.r * 0.95);
      c.lineTo(s.x + Math.cos(s.rot) * s.r * 0.95, s.y + Math.sin(s.rot) * s.r * 0.95);
      c.stroke();
    }
    if (action === 'block') {
      // warning chevrons above the raised weapon
      const wob = Math.sin(t * 20) * 1.5;
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(s.x - 7, s.y - s.r - 6 + wob);
      c.lineTo(s.x + 7, s.y - s.r - 6 + wob);
      c.lineTo(s.x, s.y - s.r + 2 + wob);
      c.closePath();
      c.fill();
    }
    // icon + key chip
    c.fillStyle = 'rgba(0,10,4,0.85)';
    c.beginPath();
    c.arc(s.ix, s.iy, s.ir * 1.25, 0, Math.PI * 2);
    c.fill();
    c.lineWidth = 1.5;
    c.strokeStyle = color;
    c.stroke();
    drawActionIcon(c, action, s.ix, s.iy - s.ir * 0.12, s.ir * 0.62, color);
    const key = keyLabel(this.ctx.keys[ACTIONS.indexOf(action)] ?? '');
    c.font = `bold ${Math.round(Math.max(10, s.ir * 0.85))}px monospace`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#ffffff';
    c.fillText(key, s.ix + s.ir * 1.25, s.iy + s.ir * 1.0);
  }

  dispose(): void {
    this.stage.dispose();
    this.impacts.length = 0;
  }
}

/** osu!'s approach circle, anchored on the enemy's body: the ring closes on the beat. */
export const approachRing: Experiment = {
  key: 'approach-ring',
  label: 'APPROACH RING · ON THE ENEMY',
  tagline:
    'No lanes: a ring shrinks onto the spot of the enemy you must hit and closes on the beat.',
  hypothesis:
    'An osu!-style approach ring anchored on the enemy (weapon = block, chest cut line = slash, core = stab, feet = flourish) is the most readable timing cue there is, and putting it on the body makes reading the cue the same as reading the fight: timing accuracy and readability rise over the 4-lane baseline.',
  inspiration: ['osu!', 'Rhythm Heaven', 'Sekiro (deflect timing)'],
  howTo: [
    'A ring shrinks onto a spot on the enemy. Press as it closes onto the target.',
    'Weapon raised = A BLOCK · cut line on the chest = S SLASH · glowing core = D STAB · ring at its feet = F FLOURISH.',
    'Faint rings show the next cues, so you can read the rhythm ahead.',
  ],
  options: {
    musicMapping: 'instruments',
    highway: false,
    laneLabels: false,
    enemyIcon: false,
    judgementHud: false,
    approachSeconds: 1.15,
    keyLegend: 'A S D F',
  },
  create: (ctx) => new ApproachRingRuntime(ctx),
};
