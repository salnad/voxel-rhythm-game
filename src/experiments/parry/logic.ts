import type { Judgement } from '../../rhythm/judge';

/** Where a strike comes from (screen space, from behind the hero). */
export type Direction = 'left' | 'right' | 'low' | 'high';

/**
 * Lane → direction. Lanes stay the chart's actions (block, slash, stab, flourish), so the
 * Lab chart and the INSTRUMENTS mapping are unchanged: 808 hits come from the LEFT, lead
 * notes from the RIGHT (so the two most common parts alternate sides), snare/hats sweep LOW,
 * and each enemy's closing crash is an overhead HIGH blow.
 */
export const LANE_DIRECTION: readonly Direction[] = ['left', 'right', 'low', 'high'];

/** Keys per lane: A = left, F = right, S = low, D = high, i.e. A S D F reads ← ↓ ↑ →. */
export const PARRY_KEYS = ['KeyA', 'KeyF', 'KeyS', 'KeyD'];
export const PARRY_ALT_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'];

export interface DirectionSpec {
  label: string;
  arrow: string;
  color: string;
  /** Unit screen offset of the clash point from the guard centre (+x right, +y up). */
  sx: number;
  sy: number;
  /** Clang pitch (Hz) and stereo pan. */
  pitch: number;
  pan: number;
  /** Hero body lean when deflecting this way: yaw (+ = screen left), pitch (+ = lean back). */
  yaw: number;
  tilt: number;
}

export const DIRECTIONS: Record<Direction, DirectionSpec> = {
  left: {
    label: 'LEFT',
    arrow: '←',
    color: '#45c8ff',
    sx: -1,
    sy: 0,
    pitch: 880,
    pan: -0.65,
    yaw: 0.5,
    tilt: 0,
  },
  right: {
    label: 'RIGHT',
    arrow: '→',
    color: '#ff4fd8',
    sx: 1,
    sy: 0,
    pitch: 1175,
    pan: 0.65,
    yaw: -0.5,
    tilt: 0,
  },
  low: {
    label: 'LOW',
    arrow: '↓',
    color: '#ffb22e',
    sx: 0,
    sy: -1,
    pitch: 587,
    pan: 0,
    yaw: 0,
    tilt: -0.22,
  },
  high: {
    label: 'HIGH',
    arrow: '↑',
    color: '#ff3b5c',
    sx: 0,
    sy: 1,
    pitch: 1480,
    pan: 0,
    yaw: 0,
    tilt: 0.2,
  },
};

export interface StrikeTiming {
  /** Seconds the warning arc is visible before contact (it closes on the beat). */
  warn: number;
  /** Longest wind-up (s). Shorter when strikes are closer together. */
  windup: number;
  /** The swing itself: wind-up pose → contact, ending exactly on the beat (s). */
  swing: number;
  /** Seconds the outcome (recoil or follow-through) owns the pose before the next wind-up. */
  recover: number;
}

export function strikeTiming(bpm: number): StrikeTiming {
  const beat = 60 / bpm;
  return { warn: beat * 2, windup: beat, swing: Math.min(0.09, beat / 4), recover: 0.08 };
}

export interface StrikeCue {
  id: number;
  lane: number;
  time: number;
}

export interface StrikePhase {
  /** The strike being wound up / swung, or null. */
  next: StrikeCue | null;
  /** 0..1 wind-up amount (eased; 1 = fully cocked). */
  windup: number;
  /** 0..1 swing from the cocked pose to contact (1 exactly on the beat). */
  swing: number;
  /** The most recent strike at or before t, and seconds since its contact. */
  last: StrikeCue | null;
  lastAge: number;
}

/** What the enemy's weapon is doing at t, for time-ordered live strikes. */
export function strikePhase(cues: readonly StrikeCue[], t: number, o: StrikeTiming): StrikePhase {
  let lastIdx = -1;
  for (let i = 0; i < cues.length; i++) {
    if (cues[i]!.time <= t) lastIdx = i;
    else break;
  }
  const last = lastIdx >= 0 ? cues[lastIdx]! : null;
  const next = cues[lastIdx + 1] ?? null;
  const lastAge = last ? t - last.time : Infinity;
  if (!next) return { next: null, windup: 0, swing: 0, last, lastAge };
  const swingStart = next.time - o.swing;
  const earliest = last ? last.time + o.recover : -Infinity;
  const start = Math.min(swingStart, Math.max(earliest, swingStart - o.windup));
  const span = swingStart - start;
  const w = span <= 1e-6 ? (t >= start ? 1 : 0) : clamp01((t - start) / span);
  const windup = 1 - (1 - w) ** 3;
  const swing = t <= swingStart ? 0 : clamp01((t - swingStart) / o.swing) ** 2;
  return { next, windup, swing, last, lastAge };
}

/** 0..1 approach of a strike's warning arc (0 when it appears, 1 on the beat). */
export function warnProgress(cueTime: number, t: number, warn: number): number {
  return clamp01(1 - (cueTime - t) / warn);
}

export const POSTURE = {
  /** Posture gained per deflect, by judgement; a miss lets the enemy recover some. */
  gain: { perfect: 1, great: 0.75, good: 0.45, miss: -0.75 } as Record<Judgement, number>,
  /** Share of an enemy's strikes (perfect-equivalent) needed to fill its posture. */
  fill: 0.8,
};

/** One enemy's posture meter. Full posture turns its closing blow into a DEATHBLOW. */
export class Posture {
  value = 0;
  readonly capacity: number;

  constructor(strikes: number) {
    this.capacity = Math.max(1, (strikes - 1) * POSTURE.fill);
  }

  /** Apply a judged deflect; returns true when this filled the meter. */
  apply(j: Judgement): boolean {
    const was = this.full;
    this.value = Math.max(0, Math.min(this.capacity, this.value + POSTURE.gain[j]));
    return !was && this.full;
  }

  get ratio(): number {
    return this.value / this.capacity;
  }

  get full(): boolean {
    return this.value >= this.capacity - 1e-9;
  }
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
