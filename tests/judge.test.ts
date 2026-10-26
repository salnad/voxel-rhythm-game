import { describe, expect, it } from 'vitest';
import type { Note } from '../src/chart/types';
import { JUDGEMENT_WINDOWS as W } from '../src/config/gameplay';
import { Judge } from '../src/rhythm/judge';

const tap = (id: number, lane: number, time: number): Note => ({
  id,
  lane,
  laneName: `l${lane}`,
  beat: time,
  time,
  endBeat: null,
  endTime: null,
});
const hold = (id: number, lane: number, time: number, end: number): Note => ({
  ...tap(id, lane, time),
  endBeat: end,
  endTime: end,
});

describe('Judge', () => {
  it('classifies by absolute offset', () => {
    const j = new Judge([], 1, W);
    expect(j.classify(0)).toBe('perfect');
    expect(j.classify(W.perfect + 0.001)).toBe('great');
    expect(j.classify(W.great + 0.001)).toBe('good');
    expect(j.classify(W.good + 0.001)).toBe('miss');
  });

  it('judges a press against the nearest pending note in the lane', () => {
    const j = new Judge([tap(0, 0, 1), tap(1, 0, 2), tap(2, 1, 1)], 2, W);
    const e = j.press(0, 1.02)!;
    expect(e).toMatchObject({ noteId: 0, judgement: 'perfect', kind: 'tap' });
    expect(e.offset).toBeCloseTo(0.02);
    expect(j.press(0, 1.5)).toBeNull(); // ghost tap, too early for note 1
    expect(j.press(1, 0.93)!.judgement).toBe('great');
  });

  it('treats very early presses inside the miss window as a miss', () => {
    const j = new Judge([tap(0, 0, 1)], 1, W);
    const e = j.press(0, 1 - (W.good + W.miss) / 2)!;
    expect(e.judgement).toBe('miss');
    expect(j.finished).toBe(true);
  });

  it('times out unhit notes as misses only after the good window', () => {
    const j = new Judge([tap(0, 0, 1)], 1, W);
    expect(j.update(1 + W.good - 0.001)).toEqual([]);
    const out = j.update(1 + W.good + 0.001);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ noteId: 0, judgement: 'miss' });
  });

  it('skips a late note to hit the next one', () => {
    const j = new Judge([tap(0, 0, 1), tap(1, 0, 1.2)], 1, W);
    // note 0 is past its good window at 1.19
    const e = j.press(0, 1.19)!;
    expect(e.noteId).toBe(1);
  });

  it('handles holds: start, early release = miss, held to end = perfect', () => {
    const j = new Judge([hold(0, 0, 1, 2), hold(1, 1, 1, 2)], 2, W);
    expect(j.press(0, 1)!.kind).toBe('holdStart');
    expect(j.release(0, 1.5)).toMatchObject({ kind: 'holdEnd', judgement: 'miss' });
    j.press(1, 1.01);
    const done = j.update(2.0);
    expect(done).toEqual([
      expect.objectContaining({ noteId: 1, kind: 'holdEnd', judgement: 'perfect' }),
    ]);
    expect(j.finished).toBe(true);
  });

  it('accepts a release slightly before the hold end', () => {
    const j = new Judge([hold(0, 0, 1, 2)], 1, W);
    j.press(0, 1);
    expect(j.release(0, 2 - W.good / 2)!.judgement).toBe('perfect');
  });
});
