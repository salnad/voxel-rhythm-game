import { describe, expect, it } from 'vitest';
import { directFx, type FxCommand } from '../src/audio/fx/director';
import {
  clipShape,
  liftFumbleShapes,
  liftShapes,
  liftTarget,
  pumpFumbleShape,
  pumpShape,
  shifterRate,
  shifterSemis,
  stutterFumblePlan,
  stutterPlan,
  sweepFumbleShapes,
  sweepShapes,
  type Shape,
} from '../src/audio/fx/plan';
import { LIFT, PUMP, STUTTER, SWEEP } from '../src/config/productionFx';
import { GameSession } from '../src/game/session';
import { chartFrom, LANE, simulate, tap } from './helpers';

const values = (s: Shape) => s.map(([, v]) => v);
const last = (s: Shape) => s[s.length - 1]!;

describe('production FX shapes', () => {
  const shape: Shape = [
    [0, 1],
    [0.1, 0],
    [0.3, 1],
  ];

  it('clipShape keeps the whole shape when the effect can start on time', () => {
    expect(clipShape(shape, 10, 9.9)).toEqual([
      { time: 10, value: 1 },
      { time: 10.1, value: 0 },
      { time: 10.3, value: 1 },
    ]);
  });

  it('clipShape joins a late start mid-way instead of replaying the attack late', () => {
    const pts = clipShape(shape, 10, 10.2);
    expect(pts[0]!.time).toBeCloseTo(10.2);
    expect(pts[0]!.value).toBeCloseTo(0.5);
    expect(pts.slice(1)).toEqual([{ time: 10.3, value: 1 }]);
    expect(clipShape(shape, 10, 11)).toEqual([]);
  });

  it('pump ducks deeper for better hits and recovers by the next beat', () => {
    const beat = 0.4;
    const perfect = pumpShape(1, beat);
    const good = pumpShape(0.6, beat);
    expect(Math.min(...values(perfect))).toBeCloseTo(1 - PUMP.depth);
    expect(Math.min(...values(good))).toBeGreaterThan(Math.min(...values(perfect)));
    expect(last(perfect)).toEqual([PUMP.recoverBeats * beat, 1]);
    // the kick transient gets through before the duck
    expect(clipShape(perfect, 0, 0).find((p) => p.time < PUMP.attackDelay - 1e-9)?.value).toBe(1);
  });

  it('a fumbled pump double-ducks and recovers late', () => {
    const s = pumpFumbleShape(0.4);
    const dips = values(s).filter((v, i, a) => i > 0 && i < a.length - 1 && v < a[i - 1]!);
    expect(dips.length).toBeGreaterThanOrEqual(2);
    expect(last(s)[0]).toBeGreaterThan(PUMP.recoverBeats * 0.4);
  });

  it('slash slams the filter shut on the cue and sweeps it open; a miss jams it', () => {
    const beat = 0.4;
    const s = sweepShapes(1, beat);
    expect(Math.min(...values(s.freq))).toBeCloseTo(SWEEP.lowHz);
    expect(last(s.freq)).toEqual([SWEEP.beats * beat, SWEEP.openHz]);
    expect(Math.min(...values(sweepShapes(0.6, beat).freq))).toBeGreaterThan(SWEEP.lowHz);
    const f = sweepFumbleShapes(beat);
    // still muffled a whole beat later, and resonant
    const atBeat = clipShape(f.freq, 0, beat)[0]!.value;
    expect(atBeat).toBeLessThan(1000);
    expect(Math.max(...values(f.q))).toBeGreaterThan(SWEEP.q);
  });
});

describe('production FX stutter', () => {
  const beat = 0.4;
  const unit = STUTTER.sliceBeats * beat;

  it('repeats the slice after the cue on the following 1/16 slots', () => {
    const plan = stutterPlan(10, 10.03, beat, 'perfect')!;
    expect(plan.slices.map((s) => s.len)).toEqual(STUTTER.pattern.perfect.map((b) => b * beat));
    expect(plan.slices[0]!.start).toBeCloseTo(10 + unit);
    for (const s of plan.slices) {
      // every repeat replays audio from the cue
      expect(s.start - s.delay).toBeCloseTo(10);
      // and starts on the 1/64 grid
      const slots = (s.start - 10) / (unit / 4);
      expect(slots).toBeCloseTo(Math.round(slots));
    }
    const total = STUTTER.pattern.perfect.reduce((a, b) => a + b, 0) * beat;
    expect(plan.end).toBeCloseTo(10 + unit + total);
  });

  it('a late press still lands on the grid; a very late one plays nothing', () => {
    const plan = stutterPlan(10, 10 + unit + 0.01, beat, 'good')!;
    expect(plan.slices[0]!.start).toBeCloseTo(10 + 2 * unit);
    expect(plan.slices.length).toBe(STUTTER.pattern.good.length);
    expect(stutterPlan(10, 10 + 3.5 * unit, beat, 'good')).toBeNull();
  });

  it('a fumbled stutter is off-grid, decays and dulls', () => {
    const plan = stutterFumblePlan(10.013, beat);
    const lens = plan.slices.map((s) => s.len);
    expect(lens[0]! / unit).not.toBeCloseTo(Math.round(lens[0]! / unit));
    const gains = plan.slices.map((s) => s.gain);
    expect([...gains].sort((a, b) => b - a)).toEqual(gains);
    expect(last(plan.tone)[1]).toBeLessThan(1000);
  });
});

describe('production FX lift', () => {
  it('rises into the end of the measure, or the next one when too close', () => {
    const beat = 0.5;
    expect(liftTarget(8, 8, 2, beat)).toBe(10);
    expect(liftTarget(9.75, 8, 2, beat)).toBe(12);
  });

  it('pitch shifter rate and semitones are inverses', () => {
    for (const s of [-4, 0, 2, 7]) expect(shifterSemis(shifterRate(s, 0.05), 0.05)).toBeCloseTo(s);
  });

  it('a hit rises to its full pitch right at the bar line, then snaps back', () => {
    const span = 1.6;
    const s = liftShapes(1, span, 0.4);
    const peak = Math.max(...values(s.rate));
    expect(shifterSemis(peak, LIFT.windowSec)).toBeCloseTo(LIFT.semis + 0.15, 1);
    expect(last(s.rate)).toEqual([span, 0]);
    expect(last(s.wet)).toEqual([span, 0]);
    expect(last(s.dry)).toEqual([span, 1]);
    // the rise accelerates into the bar line
    const mid = clipShape(s.rate, 0, span / 2)[0]!.value;
    expect(shifterSemis(mid, LIFT.windowSec)).toBeLessThan(LIFT.semis / 3);
    const weaker = Math.max(...values(liftShapes(0.6, span, 0.4).rate));
    expect(weaker).toBeLessThan(peak);
  });

  it('a fumbled lift stalls, sags below pitch and dies before the bar line', () => {
    const span = 1.6;
    const s = liftFumbleShapes(span);
    const semis = values(s.rate).map((r) => shifterSemis(r, LIFT.windowSec));
    expect(Math.max(...semis)).toBeLessThanOrEqual(2 + 1e-9);
    expect(Math.min(...semis)).toBeLessThan(0);
    expect(last(s.rate)[0]).toBeLessThan(span);
    expect(last(s.riser)[0]).toBeLessThan(span / 2);
  });
});

describe('production FX director', () => {
  // 60 BPM: one beat per second, four beats per bar
  const chart = chartFrom([
    { beat: 0, action: 'block' },
    { beat: 1, action: 'slash' },
    { beat: 2, action: 'stab' },
    { beat: 4, action: 'flourish' },
    { beat: 8, action: 'block' },
    { beat: 9, action: 'stab' },
    { beat: 12, action: 'block', length: 1 },
  ]);

  function run(inputs: ReturnType<typeof tap>) {
    const s = new GameSession(chart, { noFail: true });
    const cmds: FxCommand[] = [];
    directFx(s, (c) => cmds.push(c));
    simulate(s, inputs, 15);
    return cmds;
  }

  it('maps each move to its effect, locked to the cue and scaled by the judgement', () => {
    const cmds = run([
      ...tap('block', 0),
      ...tap('slash', 1.06),
      ...tap('stab', 2.1),
      ...tap('flourish', 4.01),
    ]);
    const starts = cmds.filter((c) => c.type === 'start');
    expect(starts.slice(0, 4).map((c) => c.fx)).toEqual(['pump', 'sweep', 'stutter', 'lift']);
    expect(starts.slice(0, 4).map((c) => c.anchor)).toEqual([0, 1, 2, 4]);
    expect(starts.slice(0, 4).map((c) => c.fumble)).toEqual([false, false, false, false]);
    const [block, slash, stab, flourish] = starts;
    expect(block!.amount).toBe(1);
    expect(slash!.amount).toBeLessThan(1);
    expect(stab!.amount).toBeLessThan(slash!.amount);
    expect(block!.beat).toBeCloseTo(1);
    expect(flourish!.target).toBeCloseTo(8);
    expect(block!.target).toBeNull();
  });

  it('a missed cue fumbles its effect when the miss happens', () => {
    const cmds = run([...tap('block', 0), ...tap('stab', 9)]);
    const miss = cmds.find((c) => c.type === 'start' && c.fx === 'sweep');
    expect(miss).toMatchObject({ fumble: true, amount: 0, judgement: 'miss' });
    if (miss?.type !== 'start') throw new Error('no sweep');
    expect(miss.anchor).toBe(miss.at);
    expect(miss.anchor).toBeGreaterThan(1);
  });

  it('a held block sustains the pump until release', () => {
    const hold = [
      { lane: LANE.block, down: true, time: 12 },
      { lane: LANE.block, down: false, time: 13 },
    ];
    const cmds = run(hold).filter((c) => c.at >= 11.5);
    expect(cmds[0]).toMatchObject({ type: 'start', fx: 'pump', sustain: true, fumble: false });
    expect(cmds[1]).toMatchObject({ type: 'release', fx: 'pump', fumble: false });
  });

  it('a ghost press (no cue) issues nothing', () => {
    const cmds = run([...tap('stab', 6)]);
    expect(cmds.filter((c) => c.type === 'start' && !c.fumble)).toEqual([]);
  });
});
