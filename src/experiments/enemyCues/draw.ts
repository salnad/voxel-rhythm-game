/**
 * 2D drawing helpers for the enemy-anchored cue experiments: cue badges (shape + colour + icon
 * + key per action), a compact key legend, impact lines and screen-space shards. Everything is
 * drawn on the HUD canvas in CSS pixels; nothing touches the DOM at module load.
 */
import { ACTIONS, type Action } from '../../chart/types';
import { ACTION_SPECS } from '../../config/actions';
import { keyLabel } from '../../core/settings';
import { drawActionIcon, hexA } from '../../render/icons';
import { kick } from './logic';

type Ctx = CanvasRenderingContext2D;

/** Badge silhouette per action, so cues read by shape as well as colour. */
export const BADGE_SHAPE: Record<Action, 'square' | 'diamond' | 'triangle' | 'circle'> = {
  block: 'square',
  slash: 'diamond',
  stab: 'triangle',
  flourish: 'circle',
};

/** Flourish cues are drawn bigger (Taiko's big notes): they finish the enemy. */
export const BADGE_SCALE: Record<Action, number> = {
  block: 1,
  slash: 1,
  stab: 1,
  flourish: 1.22,
};

function shapePath(c: Ctx, action: Action, x: number, y: number, r: number): void {
  c.beginPath();
  switch (BADGE_SHAPE[action]) {
    case 'square':
      c.roundRect(x - r * 0.86, y - r * 0.86, r * 1.72, r * 1.72, r * 0.32);
      break;
    case 'diamond':
      c.moveTo(x, y - r * 1.12);
      c.lineTo(x + r * 1.12, y);
      c.lineTo(x, y + r * 1.12);
      c.lineTo(x - r * 1.12, y);
      c.closePath();
      break;
    case 'triangle':
      // points down/forward: a thrust
      c.moveTo(x - r * 1.08, y - r * 0.78);
      c.lineTo(x + r * 1.08, y - r * 0.78);
      c.lineTo(x, y + r * 1.12);
      c.closePath();
      break;
    case 'circle':
      c.arc(x, y, r, 0, Math.PI * 2);
      break;
  }
}

export interface BadgeStyle {
  alpha?: number;
  /** 0..1 white-hot flash (hit-stop frame). */
  flash?: number;
  /** Draw greyed out (a missed cue). */
  dead?: boolean;
  /** Key label in a chip under the badge. */
  key?: string;
  glow?: number;
  /** 0..1 wrong-key flash: the badge shakes with a red rim. */
  wrong?: number;
}

/** A filled cue badge: action shape and colour, white rim, dark icon, optional key chip. */
export function drawBadge(c: Ctx, action: Action, x: number, y: number, r: number, s: BadgeStyle) {
  const alpha = s.alpha ?? 1;
  if (alpha <= 0.01 || r <= 0.5) return;
  const wrong = s.wrong ?? 0;
  if (wrong > 0) x += Math.sin(wrong * 40) * r * 0.25 * wrong;
  const color = s.dead ? '#5d6b63' : ACTION_SPECS[action].color;
  const rr = r * BADGE_SCALE[action];
  c.save();
  c.globalAlpha = alpha;
  c.shadowColor = color;
  c.shadowBlur = (s.glow ?? 14) * (s.dead ? 0 : 1);
  shapePath(c, action, x, y, rr);
  c.fillStyle = color;
  c.fill();
  c.shadowBlur = 0;
  c.lineWidth = Math.max(1.5, rr * (0.13 + wrong * 0.12));
  c.strokeStyle = s.dead ? '#2a312d' : wrong > 0.05 ? '#ff3b5c' : '#ffffff';
  c.stroke();
  const iconY = BADGE_SHAPE[action] === 'triangle' ? y - rr * 0.18 : y;
  drawActionIcon(
    c,
    action,
    x,
    iconY,
    rr * (BADGE_SHAPE[action] === 'triangle' ? 0.42 : 0.5),
    '#04140a',
  );
  if (s.flash && s.flash > 0) {
    c.globalAlpha = alpha * Math.min(1, s.flash);
    shapePath(c, action, x, y, rr * 1.04);
    c.fillStyle = '#ffffff';
    c.fill();
  }
  if (s.key) {
    c.globalAlpha = alpha;
    const kr = Math.max(7, rr * 0.36);
    const ky = y + rr * 1.12 + kr * 0.9;
    c.fillStyle = 'rgba(0,10,4,0.85)';
    c.strokeStyle = color;
    c.lineWidth = 1.5;
    c.beginPath();
    c.roundRect(x - kr, ky - kr, kr * 2, kr * 2, kr * 0.35);
    c.fill();
    c.stroke();
    c.fillStyle = s.dead ? '#8a958f' : '#ffffff';
    c.font = `bold ${Math.round(kr * 1.35)}px monospace`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(s.key, x, ky + 1);
  }
  c.restore();
}

/** A cue voided by a failed combo: greys out, tips over and drops away from where it was. */
export function drawDroppedBadge(
  c: Ctx,
  action: Action,
  x: number,
  y: number,
  r: number,
  age: number,
  life: number,
) {
  const k = Math.min(1, age / life);
  if (k >= 1) return;
  c.save();
  c.translate(x, y + age * age * 900);
  c.rotate(k * 0.9);
  drawBadge(c, action, 0, 0, r * (1 - 0.3 * k), { alpha: 1 - k, dead: true, glow: 0 });
  c.restore();
}

/** Comic-style impact lines radiating from a contact point. k = 1 at impact, fading to 0. */
export function drawImpact(c: Ctx, x: number, y: number, r: number, color: string, k: number) {
  if (k <= 0) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = hexA(color, k);
  c.lineCap = 'round';
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (i % 2) * 0.13;
    const r0 = r * (0.55 + (1 - k) * 0.9);
    const r1 = r0 + r * (i % 2 ? 0.5 : 0.85) * k;
    c.lineWidth = Math.max(1, r * 0.09 * k);
    c.beginPath();
    c.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
    c.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
    c.stroke();
  }
  c.globalAlpha = k * 0.85;
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.arc(x, y, r * 0.42 * (0.6 + 0.4 * k), 0, Math.PI * 2);
  c.fill();
  c.restore();
}

interface Shard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  life: number;
  max: number;
  color: string;
  gravity: number;
  /** Half-badge pieces of a cracked cue. */
  half?: { action: Action; side: -1 | 1; r: number };
}

/** Screen-space debris: bursts on hits, cracked halves and fizzles on misses. */
export class Shards {
  private readonly list: Shard[] = [];

  burst(x: number, y: number, color: string, count: number, speed: number, size = 4): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.35 + Math.random() * 0.75);
      this.list.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - speed * 0.25,
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 18,
        size: size * (0.6 + Math.random() * 0.8),
        life: 0,
        max: 0.3 + Math.random() * 0.3,
        color: Math.random() < 0.25 ? '#ffffff' : color,
        gravity: speed * 2.2,
      });
    }
  }

  /** A cue badge splits in two and drops, with a few grey sparks. */
  crack(x: number, y: number, action: Action, r: number): void {
    for (const side of [-1, 1] as const) {
      this.list.push({
        x: x + side * r * 0.15,
        y,
        vx: side * (60 + Math.random() * 40),
        vy: -90 - Math.random() * 40,
        rot: 0,
        vr: side * (3 + Math.random() * 2),
        size: r,
        life: 0,
        max: 0.55,
        color: '#5d6b63',
        gravity: 900,
        half: { action, side, r },
      });
    }
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const v = 80 + Math.random() * 120;
      this.list.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        rot: 0,
        vr: 0,
        size: 2.5,
        life: 0,
        max: 0.25 + Math.random() * 0.2,
        color: '#ff3b5c',
        gravity: 500,
      });
    }
  }

  update(dt: number): void {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const s = this.list[i]!;
      s.life += dt;
      if (s.life >= s.max) {
        this.list.splice(i, 1);
        continue;
      }
      s.vy += s.gravity * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rot += s.vr * dt;
    }
  }

  draw(c: Ctx): void {
    c.save();
    for (const s of this.list) {
      const k = 1 - s.life / s.max;
      if (s.half) {
        const { action, side, r } = s.half;
        c.save();
        c.translate(s.x, s.y);
        c.rotate(s.rot);
        c.beginPath();
        c.rect(side < 0 ? -r * 2 : 0, -r * 2, r * 2, r * 4);
        c.clip();
        drawBadge(c, action, 0, 0, r, { alpha: k, dead: true, glow: 0 });
        c.restore();
        continue;
      }
      c.globalAlpha = k;
      c.fillStyle = s.color;
      c.save();
      c.translate(s.x, s.y);
      c.rotate(s.rot);
      const z = s.size * (0.5 + 0.5 * k);
      c.fillRect(-z / 2, -z / 2, z, z);
      c.restore();
    }
    c.restore();
  }

  clear(): void {
    this.list.length = 0;
  }
}

/** Per-action press and hit times, for the key legend. */
export interface LegendState {
  held: readonly boolean[];
  pressAt: readonly number[];
  hitAt: readonly number[];
}

/**
 * A compact key legend at the bottom centre (replaces the big lane labels): each chip shows the
 * key, the action's badge shape and its name; it lights on press and flashes on a hit.
 */
export function drawKeyLegend(
  c: Ctx,
  t: number,
  w: number,
  h: number,
  keys: readonly string[],
  st: LegendState,
): void {
  const chipW = 92;
  const chipH = 34;
  const gap = 8;
  const total = ACTIONS.length * chipW + (ACTIONS.length - 1) * gap;
  const x0 = (w - total) / 2;
  const y0 = h - chipH - 18;
  c.save();
  c.textBaseline = 'middle';
  ACTIONS.forEach((a, i) => {
    const color = ACTION_SPECS[a].color;
    const x = x0 + i * (chipW + gap);
    const press = st.held[i] ? 1 : kick(t - st.pressAt[i]!, 0.15);
    const hit = kick(t - st.hitAt[i]!, 0.25);
    const lift = press * 3;
    c.fillStyle =
      hit > 0 ? hexA(color, 0.25 + 0.5 * hit) : press > 0 ? hexA(color, 0.28) : 'rgba(0,10,4,0.7)';
    c.strokeStyle = hexA(color, 0.55 + 0.45 * Math.max(press, hit));
    c.lineWidth = press > 0.5 ? 2.5 : 1.25;
    c.beginPath();
    c.roundRect(x, y0 - lift, chipW, chipH, 7);
    c.fill();
    c.stroke();
    c.fillStyle = press > 0.5 || hit > 0.3 ? '#ffffff' : color;
    c.font = 'bold 17px monospace';
    c.textAlign = 'center';
    c.fillText(keyLabel(keys[i] ?? ''), x + 15, y0 + chipH / 2 - lift + 1);
    drawBadge(c, a, x + 38, y0 + chipH / 2 - lift, 8, { glow: 0 });
    c.font = 'bold 10px monospace';
    c.textAlign = 'left';
    c.fillStyle = hexA(color, 0.95);
    c.fillText(ACTION_SPECS[a].label, x + 51, y0 + chipH / 2 - lift + 1);
  });
  c.restore();
}

/** Full-screen additive tint (impact frame). */
export function drawScreenFlash(c: Ctx, w: number, h: number, color: string, k: number): void {
  if (k <= 0) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = hexA(color, k);
  c.fillRect(0, 0, w, h);
  c.restore();
}
