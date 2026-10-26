import { describe, expect, it } from 'vitest';
import { TempoMap } from '../src/chart/tempo';

describe('TempoMap', () => {
  it('converts beats to seconds with offset', () => {
    const t = new TempoMap(120, 250);
    expect(t.beatToSec(0)).toBeCloseTo(0.25);
    expect(t.beatToSec(4)).toBeCloseTo(2.25);
    expect(t.secToBeat(2.25)).toBeCloseTo(4);
  });

  it('handles bpm changes piecewise and round-trips', () => {
    const t = new TempoMap(120, 0, [{ beat: 8, bpm: 60 }]);
    expect(t.beatToSec(8)).toBeCloseTo(4);
    expect(t.beatToSec(10)).toBeCloseTo(6);
    for (const b of [0, 3.5, 8, 9.25, 20]) expect(t.secToBeat(t.beatToSec(b))).toBeCloseTo(b);
    expect(t.bpmAtBeat(9)).toBe(60);
  });

  it('extrapolates before beat 0 (lead-in)', () => {
    const t = new TempoMap(150, 1000);
    expect(t.beatToSec(-1)).toBeCloseTo(0.6);
  });
});
