import { describe, expect, it } from 'vitest';
import {
  convergeOffset,
  fanAngle,
  ghostAlphas,
  hitStopAge,
  kick,
  OutcomeLog,
  ringScale,
  stageCues,
  stripX,
  travel,
  wrongKeyCue,
  type CueLike,
  type CueStatus,
} from '../src/experiments/enemyCues/logic';
import type { JudgementEvent } from '../src/rhythm/judge';

const cue = (id: number, lane: number, time: number, removed = false) => ({
  id,
  lane,
  action: (['block', 'slash', 'stab', 'flourish'] as const)[lane]!,
  time,
  endTime: null,
  removed,
});

function status(pending: number[], holding: number[] = [], voided: number[] = []): CueStatus {
  return {
    isPending: (id) => pending.includes(id),
    isHolding: (id) => holding.includes(id),
    isVoid: (id) => voided.includes(id),
  };
}

const judgement = (
  noteId: number,
  j: JudgementEvent['judgement'],
  time: number,
): JudgementEvent => ({
  noteId,
  lane: 0,
  kind: 'tap',
  judgement: j,
  offset: 0.01,
  time,
});

describe('enemy cue timing', () => {
  it('approach rings close exactly on the cue and start at their full size', () => {
    expect(ringScale(1.2, 1.2, 3)).toBeCloseTo(3);
    expect(ringScale(0.6, 1.2, 3)).toBeCloseTo(2);
    expect(ringScale(0, 1.2, 3)).toBe(1);
    expect(ringScale(2, 1.2, 3)).toBe(3);
  });

  it('travel runs 0 at spawn to 1 on the cue, past 1 when late', () => {
    expect(travel(1.5, 1.5)).toBe(0);
    expect(travel(0, 1.5)).toBe(1);
    expect(travel(-0.15, 1.5)).toBeCloseTo(1.1);
  });

  it('strip badges move linearly from the spawn edge onto the drum', () => {
    expect(stripX(1.7, 1.7, 1200, 600)).toBe(1200);
    expect(stripX(0, 1.7, 1200, 600)).toBe(600);
    expect(stripX(0.85, 1.7, 1200, 600)).toBe(900);
    // equal time gaps are equal distances: rhythm reads as spacing
    expect(stripX(0.2, 1.7, 1200, 600) - stripX(0.1, 1.7, 1200, 600)).toBeCloseTo(
      stripX(1.2, 1.7, 1200, 600) - stripX(1.1, 1.7, 1200, 600),
    );
  });

  it('converge badges land on the target and start at the radius', () => {
    const land = convergeOffset(0, 1.5, 0.7, 300, 0.5);
    expect(Math.hypot(land.x, land.y)).toBeCloseTo(0);
    const spawn = convergeOffset(1.5, 1.5, 0, 300, 0);
    expect(spawn.x).toBeCloseTo(0);
    expect(spawn.y).toBeCloseTo(-300); // straight up on screen
    const half = convergeOffset(0.75, 1.5, Math.PI / 2, 300, 0);
    expect(half.x).toBeCloseTo(150);
    expect(half.y).toBeCloseTo(0);
  });

  it('fan angles sweep back and forth inside the spread in steps', () => {
    const spread = 1.2;
    const angles = Array.from({ length: 40 }, (_, n) => fanAngle(n, spread, 0.4));
    for (const a of angles) {
      expect(a).toBeGreaterThanOrEqual(-spread - 1e-9);
      expect(a).toBeLessThanOrEqual(spread + 1e-9);
    }
    for (let i = 1; i < angles.length; i++)
      expect(Math.abs(angles[i]! - angles[i - 1]!)).toBeCloseTo(0.4);
    expect(angles[0]).toBeCloseTo(-spread);
    expect(angles[6]).toBeCloseTo(spread);
    expect(angles[12]).toBeCloseTo(-spread);
  });

  it('kick and hit-stop envelopes', () => {
    expect(kick(0, 0.2)).toBe(1);
    expect(kick(0.2, 0.2)).toBe(0);
    expect(kick(-0.01, 0.2)).toBe(0);
    expect(kick(0.1, 0.2)).toBeCloseTo(0.25);
    expect(hitStopAge(0.03, 0.05)).toBe(0);
    expect(hitStopAge(0.08, 0.05)).toBeCloseTo(0.03);
  });
});

describe('cue staging', () => {
  it('logs the first judgement of a cue only', () => {
    const log = new OutcomeLog();
    expect(log.record(judgement(3, 'great', 1))?.judgement).toBe('great');
    expect(log.record(judgement(3, 'miss', 1.2))).toBeNull();
    expect(log.record({ ...judgement(4, 'perfect', 2), kind: 'holdEnd' })).toBeNull();
    expect(log.get(3)?.judgement).toBe('great');
    log.prune(1.5);
    expect(log.get(3)).toBeUndefined();
  });

  it('stages incoming, held, hit, missed and voided cues inside their windows', () => {
    const cues = [
      cue(0, 0, 0.8), // hit at 0.8, lingers
      cue(1, 1, 0.9), // missed at 1.0
      cue(2, 2, 1.1), // held
      cue(3, 3, 1.4), // incoming
      cue(4, 0, 3.5), // beyond the approach
      cue(5, 1, 1.2), // voided at 0.95
      cue(6, 2, 1.3, true), // removed by a re-plan
      cue(7, 3, 0.1), // hit long ago
    ];
    const log = new OutcomeLog();
    log.record(judgement(0, 'perfect', 0.8));
    log.record(judgement(1, 'miss', 1.0));
    log.record(judgement(7, 'good', 0.1));
    const staged = stageCues(
      cues,
      1.0,
      1.5,
      0.4,
      status([3, 4], [2], [5]),
      log,
      new Map([[5, 0.95]]),
    );
    expect(staged.map((s) => [s.cue.id, s.stage])).toEqual([
      [0, 'hit'],
      [1, 'miss'],
      [2, 'holding'],
      [5, 'void'],
      [3, 'incoming'],
    ]);
    expect(staged.find((s) => s.cue.id === 0)!.age).toBeCloseTo(0.2);
    expect(staged.find((s) => s.cue.id === 3)!.tau).toBeCloseTo(0.4);
  });

  it('ghost alphas: the next incoming cue is full, the following ones faint, the rest hidden', () => {
    const staged = [
      { cue: cue(0, 0, 0) as CueLike, stage: 'hit' as const, tau: -0.1, age: 0.1 },
      { cue: cue(1, 1, 1), stage: 'incoming' as const, tau: 0.2, age: 0 },
      { cue: cue(2, 2, 1.2), stage: 'incoming' as const, tau: 0.4, age: 0 },
      { cue: cue(3, 3, 1.4), stage: 'incoming' as const, tau: 0.6, age: 0 },
      { cue: cue(4, 0, 1.6), stage: 'incoming' as const, tau: 0.8, age: 0 },
    ];
    expect(ghostAlphas(staged, [0.3, 0.15])).toEqual([1, 1, 0.3, 0.15, 0]);
  });

  it('flags a wrong key pressed right on another lane’s cue', () => {
    const cues = [cue(0, 0, 1), cue(1, 2, 1.5), cue(2, 1, 2, true)];
    const st = status([0, 1, 2]);
    expect(wrongKeyCue(cues, 1, 1.02, 0.13, st)?.id).toBe(0);
    // the pressed lane has its own cue near: not a misread
    expect(wrongKeyCue(cues, 0, 1.05, 0.13, st)).toBeNull();
    // nothing near
    expect(wrongKeyCue(cues, 3, 1.25, 0.13, st)).toBeNull();
    // removed or already judged cues don't count
    expect(wrongKeyCue(cues, 3, 2, 0.13, st)).toBeNull();
    expect(wrongKeyCue(cues, 3, 1.5, 0.13, status([0]))).toBeNull();
  });
});
