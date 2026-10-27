import { describe, expect, it } from 'vitest';
import {
  currentTrial,
  isComplete,
  labOrder,
  newLabState,
  overall,
  parseLabState,
  recordTrial,
  resultsJson,
  skipTrial,
  type TrialResult,
} from '../src/lab/plan';

const KEYS = ['baseline', 'a', 'b', 'c', 'd', 'e'];

const trial = (exp: string, r = 3, note = ''): TrialResult => ({
  exp,
  ratings: { fun: r, control: r, read: r, music: r },
  note,
  plays: 1,
  stats: {
    acc: 0.91234,
    perfect: 40,
    great: 5,
    good: 2,
    miss: 3,
    offsetMs: -12.4,
    hitsTaken: 1,
    combosCleared: 3,
    combosFailed: 1,
    defeated: 4,
    enemies: 4,
  },
  at: '2026-10-27T00:00:00.000Z',
});

describe('lab order', () => {
  it('puts the anchor first and shuffles the rest as a permutation', () => {
    const o = labOrder(KEYS, 42, 'baseline');
    expect(o[0]).toBe('baseline');
    expect([...o].sort()).toEqual([...KEYS].sort());
  });

  it('is deterministic per seed and varies across seeds', () => {
    expect(labOrder(KEYS, 7, 'baseline')).toEqual(labOrder(KEYS, 7, 'baseline'));
    const orders = new Set(
      [1, 2, 3, 4, 5, 6, 7, 8].map((s) => labOrder(KEYS, s, 'baseline').join()),
    );
    expect(orders.size).toBeGreaterThan(3);
  });

  it('spreads each experiment over different positions across seeds', () => {
    const positions = new Set<number>();
    for (let s = 0; s < 40; s++) positions.add(labOrder(KEYS, s, 'baseline').indexOf('a'));
    expect(positions.size).toBe(KEYS.length - 1);
  });
});

describe('lab state', () => {
  it('records, replaces and skips trials', () => {
    let s = newLabState(KEYS, 1, 'abc1234', 'baseline');
    expect(currentTrial(s)).toBe('baseline');
    s = recordTrial(s, trial('baseline', 3));
    expect(s.index).toBe(1);
    s = skipTrial(s);
    expect(s.skipped).toEqual([s.order[1]]);
    s = recordTrial(s, trial(s.order[2]!, 5));
    expect(s.trials.length).toBe(2);
    while (!isComplete(s)) s = recordTrial(s, trial(currentTrial(s)!, 2));
    expect(currentTrial(s)).toBeNull();
  });

  it('round-trips through JSON and rejects foreign data', () => {
    const s = recordTrial(newLabState(KEYS, 1, 'x', 'baseline'), trial('baseline'));
    expect(parseLabState(JSON.parse(JSON.stringify(s)))).toEqual(s);
    expect(parseLabState({ format: 'other' })).toBeNull();
    expect(parseLabState(null)).toBeNull();
  });

  it('exports compact, parseable JSON with ratings in a fixed order', () => {
    let s = newLabState(KEYS, 3, 'abc1234', 'baseline');
    s = recordTrial(s, trial('baseline', 4, 'felt laggy'));
    const json = resultsJson(s);
    const parsed = JSON.parse(json) as {
      build: string;
      order: string[];
      trials: Array<{ exp: string; r: number[]; note?: string; acc: number; pgom: number[] }>;
    };
    expect(parsed.build).toBe('abc1234');
    expect(parsed.order).toEqual(s.order);
    expect(parsed.trials).toHaveLength(1);
    expect(parsed.trials[0]).toMatchObject({
      exp: 'baseline',
      r: [4, 4, 4, 4],
      note: 'felt laggy',
      acc: 0.912,
      pgom: [40, 5, 2, 3],
    });
    // one line per trial
    expect(json.split('\n').filter((l) => l.startsWith('{"exp"'))).toHaveLength(1);
    expect(overall({ fun: 5, control: 3, read: 4, music: 4 })).toBe(4);
  });
});
