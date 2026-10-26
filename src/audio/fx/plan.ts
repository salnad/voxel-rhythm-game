/**
 * Pure envelope and timing plans for the PRODUCER FX layer. No Web Audio here: the rack
 * (rack.ts) turns these into AudioParam automation. Shapes are keyframes relative to the
 * moment an effect is locked to (usually the cue's beat), linear in between.
 */
import { LIFT, PUMP, STUTTER, SWEEP } from '../../config/productionFx';
import type { Judgement } from '../../rhythm/judge';

export interface Point {
  time: number;
  value: number;
}

/** Keyframes `[offset, value]`, offsets ascending and relative to an anchor time. */
export type Shape = ReadonlyArray<readonly [number, number]>;

/**
 * Absolute automation points for `shape` anchored at `anchor`, for an effect that can only
 * start at `from` (a press is heard a little after its cue). Points before `from` are
 * dropped; if `from` falls inside the shape, its interpolated value at `from` comes first,
 * so a late start joins the effect mid-way instead of replaying its attack late.
 */
export function clipShape(shape: Shape, anchor: number, from: number): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < shape.length; i++) {
    const [dt, v] = shape[i]!;
    const t = anchor + dt;
    if (t < from) continue;
    const prev = shape[i - 1];
    if (out.length === 0 && prev && t > from) {
      const t0 = anchor + prev[0];
      const k = (from - t0) / (t - t0);
      out.push({ time: from, value: prev[1] + (v - prev[1]) * k });
    }
    out.push({ time: t, value: v });
  }
  return out;
}

/** `n + 1` keyframes over [t0, t1] following f(p), p in 0..1. */
function sampled(t0: number, t1: number, n: number, f: (p: number) => number): [number, number][] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const p = i / n;
    return [t0 + (t1 - t0) * p, f(p)];
  });
}

/** Exponential interpolation between two frequencies (p in 0..1). */
function expHz(a: number, b: number, p: number): number {
  return a * Math.pow(b / a, p);
}

// ── BLOCK: pump ──────────────────────────────────────────────────────────────

export function pumpShape(amount: number, beat: number): Shape {
  const floor = 1 - PUMP.depth * amount;
  const a = PUMP.attackDelay;
  const hold = a + PUMP.attack + 0.03;
  const end = Math.max(hold + 0.05, PUMP.recoverBeats * beat);
  return [
    [0, 1],
    [a, 1],
    [a + PUMP.attack, floor],
    [hold, floor],
    ...sampled(hold, end, 8, (p) => 1 - (1 - floor) * Math.exp(-4 * p) * (1 - p)).slice(1),
  ];
}

/** Held block: duck and stay down until release. */
export function pumpHoldShape(amount: number): Shape {
  const a = PUMP.attackDelay;
  return [
    [0, 1],
    [a, 1],
    [a + PUMP.attack, 1 - PUMP.depth * amount * PUMP.holdFraction],
  ];
}

/** Relative to the release; the rack ramps from wherever the gain is. */
export function pumpReleaseShape(beat: number, fumble: boolean): Shape {
  if (!fumble) return [[0.5 * beat, 1]];
  return [
    [0.05, 0.25],
    [0.14, 0.85],
    [0.22, 0.35],
    [1.2 * beat, 1],
  ];
}

/** Missed block: a mushy, off-grid double duck with a lumbering recovery. */
export function pumpFumbleShape(beat: number): Shape {
  return [
    [0, 1],
    [0.045, 0.35],
    [0.1, 0.8],
    [0.15, 0.25],
    [0.22, 0.55],
    [0.3, 0.4],
    [1.3 * beat, 1],
  ];
}

// ── SLASH: filter sweep ─────────────────────────────────────────────────────

export interface FilterShapes {
  freq: Shape;
  q: Shape;
}

export function sweepShapes(amount: number, beat: number): FilterShapes {
  const low = SWEEP.lowHz * Math.pow(2, 1.6 * (1 - amount));
  const end = SWEEP.beats * beat;
  return {
    freq: [
      [0, SWEEP.openHz],
      [0.006, low],
      ...sampled(0.02, end, 10, (p) => expHz(low, SWEEP.openHz, Math.pow(p, 1.5))),
    ],
    q: [
      [0, 0.7],
      [0.006, SWEEP.q * (0.5 + 0.5 * amount)],
      [end * 0.7, SWEEP.q * 0.4],
      [end, 0.7],
    ],
  };
}

/** Missed slash: the filter jams shut, honks and only crawls open again. */
export function sweepFumbleShapes(beat: number): FilterShapes {
  return {
    freq: [
      [0, SWEEP.openHz],
      [0.06, 250],
      [0.12, 600],
      [0.18, 240],
      [0.26, 520],
      [0.34, 260],
      [beat, 480],
      [2 * beat, 2500],
      [2.5 * beat, SWEEP.openHz],
    ],
    q: [
      [0, 0.7],
      [0.06, 16],
      [beat, 12],
      [2.5 * beat, 0.7],
    ],
  };
}

// ── STAB: stutter ───────────────────────────────────────────────────────────

export interface StutterSlice {
  start: number;
  len: number;
  /** Delay-line time: how far back the replayed audio is. */
  delay: number;
  gain: number;
}

export interface StutterPlan {
  slices: StutterSlice[];
  /** Low-pass on the repeats (Hz). */
  tone: Shape;
  /** Time the dry signal comes back. */
  end: number;
}

/**
 * Beat-repeat locked to the grid: the slice that starts at the cue (`anchor`) replays on the
 * following 1/16 slots. The first repeat is the first slot at or after `from`, so a late
 * press still lands on the grid. Null when the press is too late to repeat anything musical.
 */
export function stutterPlan(
  anchor: number,
  from: number,
  beat: number,
  judgement: Exclude<Judgement, 'miss'>,
): StutterPlan | null {
  const unit = STUTTER.sliceBeats * beat;
  const k0 = Math.max(1, Math.ceil((from - anchor) / unit - 1e-9));
  if (k0 > 3) return null;
  let t = anchor + k0 * unit;
  const slices: StutterSlice[] = [];
  for (const lenBeats of STUTTER.pattern[judgement]) {
    const len = lenBeats * beat;
    slices.push({ start: t, len, delay: t - anchor, gain: STUTTER.gain });
    t += len;
  }
  return { slices, tone: [[0, 20000]], end: t };
}

/** Missed stab: off-grid, too-short repeats of whatever just played, decaying and dulling. */
export function stutterFumblePlan(from: number, beat: number): StutterPlan {
  const len = STUTTER.sliceBeats * beat * 0.62;
  const src = from - len;
  const slices: StutterSlice[] = [];
  for (let i = 0; i < 5; i++) {
    const start = from + i * len;
    slices.push({ start, len, delay: start - src, gain: 0.9 - i * 0.15 });
  }
  const end = from + 5 * len + 0.04;
  return {
    slices,
    tone: [
      [0, 6000],
      [end - from, 600],
    ],
    end,
  };
}

// ── FLOURISH: lift ──────────────────────────────────────────────────────────

/**
 * The bar line a flourish rises into: the end of its measure, or the one after when the
 * cue is too close to the bar line for a riser.
 */
export function liftTarget(
  cueTime: number,
  playStart: number,
  playDur: number,
  beat: number,
): number {
  let end = playStart + playDur;
  while (end - cueTime < LIFT.minBeats * beat - 1e-9) end += playDur;
  return end;
}

/** Oscillator rate (Hz) of a delay-line pitch shifter with grain `window` for `semis`. */
export function shifterRate(semis: number, window: number): number {
  return (Math.pow(2, semis / 12) - 1) / window;
}

/** Inverse of shifterRate. */
export function shifterSemis(rate: number, window: number): number {
  return 12 * Math.log2(1 + rate * window);
}

export interface LiftShapes {
  /** Pitch-shifter oscillator rate (Hz). */
  rate: Shape;
  wet: Shape;
  dry: Shape;
  riser: Shape;
  riserHz: Shape;
}

/** Shapes relative to the cue; `span` is the time to the target bar line. */
export function liftShapes(amount: number, span: number): LiftShapes {
  const semis = LIFT.semis * (0.4 + 0.6 * amount);
  const w = LIFT.windowSec;
  const snap = Math.min(0.006, span / 4);
  const top = span - snap;
  return {
    rate: [...sampled(0, top, 12, (p) => shifterRate(0.15 + semis * p * p, w)), [span, 0]],
    wet: [...sampled(0, top, 6, (p) => LIFT.wet * Math.min(1, 0.2 + p)), [span, 0]],
    dry: [...sampled(0, top, 6, (p) => 1 - 0.8 * p), [span, 1]],
    riser: [...sampled(0, top, 8, (p) => LIFT.riserGain * amount * p * p * p), [span, 0]],
    riserHz: sampled(0, top, 8, (p) => expHz(300, 9000, p)),
  };
}

/** Missed flourish: the riser stalls, sags flat and dies before the bar line. */
export function liftFumbleShapes(span: number): LiftShapes {
  const w = LIFT.windowSec;
  return {
    rate: [
      [0, shifterRate(0.3, w)],
      [span * 0.35, shifterRate(2, w)],
      [span * 0.65, shifterRate(-5, w)],
      [span * 0.85, 0],
    ],
    wet: [
      [0, 0.4],
      [span * 0.35, 0.8],
      [span * 0.65, 0.8],
      [span * 0.85, 0],
    ],
    dry: [
      [0, 0.8],
      [span * 0.35, 0.3],
      [span * 0.65, 0.3],
      [span * 0.85, 1],
    ],
    riser: [
      [0, 0.02],
      [span * 0.3, LIFT.riserGain * 0.5],
      [span * 0.32, 0],
    ],
    riserHz: [
      [0, 300],
      [span * 0.3, 1500],
      [span * 0.32, 400],
    ],
  };
}
