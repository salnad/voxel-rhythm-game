import type { FxKind } from '../../config/productionFx';
import type { Judgement } from '../../rhythm/judge';

interface TracePoint {
  time: number;
  value: number;
  /** Reached by a linear ramp from the previous point (else a step). */
  ramp: boolean;
}

/**
 * A copy of the automation scheduled on one AudioParam (holds, steps and linear ramps), so
 * the visuals can read the exact envelope the audio follows at any time. Pure.
 */
export class Trace {
  private pts: TracePoint[];

  constructor(initial: number) {
    this.pts = [{ time: -Infinity, value: initial, ramp: false }];
  }

  valueAt(t: number): number {
    const { pts } = this;
    let i = pts.length - 1;
    while (i > 0 && pts[i]!.time > t) i--;
    const p0 = pts[i]!;
    const p1 = pts[i + 1];
    if (!p1 || !p1.ramp || p1.time <= p0.time || p0.time === -Infinity) return p0.value;
    return p0.value + ((p1.value - p0.value) * (t - p0.time)) / (p1.time - p0.time);
  }

  /** cancelAndHoldAtTime: keep the value at `at`, drop everything after. */
  hold(at: number): void {
    const v = this.valueAt(at);
    this.cancel(at);
    this.push({ time: at, value: v, ramp: true });
  }

  /** cancelScheduledValues: drop events at or after `at`. */
  cancel(at: number): void {
    this.pts = this.pts.filter((p, i) => i === 0 || p.time < at);
  }

  set(value: number, time: number): void {
    this.push({ time, value, ramp: false });
  }

  ramp(value: number, time: number): void {
    this.push({ time, value, ramp: true });
  }

  /** Forget points that ended before `t` (keeps the one that sets the value at `t`). */
  prune(t: number): void {
    let i = 0;
    while (i + 1 < this.pts.length && this.pts[i + 1]!.time <= t) i++;
    if (i > 0) {
      const keep = this.pts[i]!;
      this.pts = [{ time: -Infinity, value: keep.value, ramp: false }, ...this.pts.slice(i + 1)];
      if (this.pts[1]?.ramp) this.pts.splice(1, 0, { ...keep, ramp: false });
    }
  }

  private push(p: TracePoint): void {
    let i = this.pts.length;
    while (i > 1 && this.pts[i - 1]!.time > p.time) i--;
    this.pts.splice(i, 0, p);
  }
}

/** What the effects are doing to the mix at one moment, for the visuals and the FX RACK. */
export interface FxMeter {
  /** BLOCK: how far the pump has ducked the mix (0..1). */
  duck: number;
  /** SLASH: low-pass cutoff (Hz) and how far it is closed (0 open .. 1 fully shut). */
  cutoffHz: number;
  closed: number;
  /** STAB: the beat-repeat playing, if any. */
  repeat: {
    /** Increments per stutter, so a new one grabs a new frame. */
    id: number;
    /** Index of the slice playing (-1 when off), and how many there are. */
    slice: number;
    of: number;
    /** The slice's gate is open (the chop is closed otherwise). */
    open: boolean;
    /** Slice length in beats (1/16 = 0.25). */
    beats: number;
  };
  /** FLOURISH: pitch lift (semitones), how far into the full lift (0..1), the pre-bar gap. */
  semis: number;
  lift: number;
  gap: boolean;
  /** The latest trigger of each effect: seconds since it started (as heard) and its grade. */
  last: Record<FxKind, { age: number; judgement: Judgement } | null>;
}
