import { describe, expect, it } from 'vitest';
import {
  clipShape,
  liftShapes,
  pumpDelay,
  pumpShape,
  scaleDuck,
  shapeAt,
  stutterPlan,
  sweepShapes,
  warpShape,
  type Shape,
} from '../src/audio/fx/plan';
import { Trace } from '../src/audio/fx/trace';
import { softClipCurve } from '../src/audio/master';
import { LIFT, PUMP, STUTTER, SWEEP } from '../src/config/productionFx';

const beat = 60 / 155;
const db = (g: number) => 20 * Math.log10(g);

/** Seconds of `shape` (sampled every ms over [0, end]) where `pred` holds. */
function timeWhere(shape: Shape, end: number, pred: (v: number) => boolean): number {
  let n = 0;
  for (let t = 0; t <= end; t += 0.001) if (pred(shapeAt(shape, t))) n++;
  return n / 1000;
}

describe('effects are deep and long enough to hear over the song', () => {
  it('a perfect pump ducks the mix by at least 18 dB and stays 6 dB down for half a beat', () => {
    const s = pumpShape(1, beat);
    expect(db(Math.min(...s.map(([, v]) => v)))).toBeLessThan(-18);
    expect(timeWhere(s, beat, (v) => db(v) < -6)).toBeGreaterThan(beat / 2);
  });

  it('pump-exempt stems (the 808) only duck by their own depth', () => {
    const s = scaleDuck(pumpShape(1, beat), PUMP.exemptDepth / PUMP.depth);
    expect(Math.min(...s.map(([, v]) => v))).toBeCloseTo(1 - PUMP.exemptDepth);
  });

  it('a slash keeps the low-pass below 1 kHz for a third of a beat', () => {
    const s = sweepShapes(1, beat);
    expect(timeWhere(s.freq, SWEEP.beats * beat, (f) => f < 1000)).toBeGreaterThan(beat / 3);
  });

  it('a perfect stab rolls for a whole beat, faster towards the end', () => {
    const plan = stutterPlan(0, 0.04, beat, 'perfect')!;
    expect(plan.end - plan.slices[0]!.start).toBeCloseTo(beat);
    const lens = plan.slices.map((s) => s.len);
    expect(lens[lens.length - 1]!).toBeLessThan(lens[0]!);
    expect(shapeAt(plan.tone, 0)).toBe(STUTTER.toneFrom);
  });

  it('a lift goes silent just before the bar line, then snaps back on it', () => {
    const span = 4 * beat;
    const s = liftShapes(1, span, beat);
    const gap = LIFT.gapBeats * beat;
    expect(shapeAt(s.gap, span - gap / 2)).toBe(0);
    expect(shapeAt(s.gap, span - gap - 0.01)).toBe(1);
    expect(shapeAt(s.gap, span)).toBe(1);
    expect(shapeAt(s.hp, span - gap)).toBeCloseTo(LIFT.hpHz);
  });
});

describe('a late press slams the effect in at the press, released on the grid', () => {
  const shape: Shape = [
    [0, 1],
    [0.01, 0],
    [0.1, 0.5],
    [0.4, 1],
  ];

  it('moves the attack to the press and keeps the end', () => {
    const w = warpShape(shape, 0.05, 0.01, 0.1);
    expect(w[0]).toEqual([0.05, 1]);
    expect(w[1]![0]).toBeCloseTo(0.06);
    expect(w[1]![1]).toBe(0);
    expect(w[w.length - 1]![0]).toBeCloseTo(0.4);
    // the effect starts at full depth instead of joining it half recovered
    const pts = clipShape(w, 10, 10.05);
    expect(pts[1]!.value).toBe(0);
    expect(clipShape(shape, 10, 10.05)[0]!.value).toBeGreaterThan(0.2);
  });

  it('plays the whole shape late when too little tail would be left', () => {
    const w = warpShape(shape, 0.35, 0.01, 0.1);
    expect(w.map(([t]) => t)).toEqual(shape.map(([t]) => t + 0.35));
  });

  it('on time, nothing changes', () => {
    expect(warpShape(shape, 0, 0.01, 0.1)).toBe(shape);
  });

  it("drops the pump's kick-transient wait once the kick has gone by", () => {
    expect(pumpDelay(0)).toBe(PUMP.attackDelay);
    expect(pumpDelay(0.01)).toBeCloseTo(PUMP.attackDelay - 0.01);
    expect(pumpDelay(0.2)).toBe(0);
  });
});

describe('automation trace (what the visuals read)', () => {
  it('follows steps and ramps', () => {
    const t = new Trace(1);
    t.set(1, 10);
    t.ramp(0, 11);
    t.ramp(1, 13);
    expect(t.valueAt(5)).toBe(1);
    expect(t.valueAt(10.5)).toBeCloseTo(0.5);
    expect(t.valueAt(12)).toBeCloseTo(0.5);
    expect(t.valueAt(20)).toBe(1);
  });

  it('cancel-and-hold keeps the value reached and drops later points', () => {
    const t = new Trace(1);
    t.set(1, 0);
    t.ramp(0, 1);
    t.hold(0.25);
    expect(t.valueAt(0.25)).toBeCloseTo(0.75);
    expect(t.valueAt(0.9)).toBeCloseTo(0.75);
    t.ramp(0.2, 0.5);
    expect(t.valueAt(0.5)).toBeCloseTo(0.2);
  });

  it('pruning old points keeps the current value', () => {
    const t = new Trace(1);
    t.set(0.3, 1);
    t.ramp(0.9, 3);
    t.prune(2);
    expect(t.valueAt(2)).toBeCloseTo(0.6);
    expect(t.valueAt(3)).toBeCloseTo(0.9);
  });
});

describe('master soft clip', () => {
  it('is transparent below the knee and never reaches full scale', () => {
    const curve = softClipCurve(0.8, 2001);
    const at = (x: number) => curve[Math.round(((x + 1) / 2) * 2000)]!;
    expect(at(0.5)).toBeCloseTo(0.5, 3);
    expect(at(-0.7)).toBeCloseTo(-0.7, 3);
    expect(Math.max(...curve)).toBeLessThan(1);
    expect(at(1)).toBeGreaterThan(0.9);
  });
});
