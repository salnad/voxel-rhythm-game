import { describe, expect, it } from 'vitest';
import { buildChart } from '../src/chart/build';
import { buildDemoChart } from '../src/chart/demoChart';
import { validateChart } from '../src/chart/validate';
import { PLAYER } from '../src/config/gameplay';
import { ClockSync } from '../src/core/clockSync';
import { GameSession } from '../src/game/session';
import { autoplayInputs } from '../src/rhythm/input';
import { deriveModifiers, easeForWeights, morphWeights } from '../src/synth/modifiers';
import { DEFAULT_PATCH } from '../src/synth/patch';

const chartFrom = (notes: Array<{ beat: number; lane: string; length?: number }>) => {
  const r = validateChart({
    format: 'voxel-rhythm-chart',
    version: 1,
    meta: { title: 't' },
    audio: { procedural: 'x' },
    timing: { bpm: 60, offsetMs: 0 },
    lanes: ['kick', 'perc', 'bass', 'synth'],
    notes,
  });
  if (!r.ok) throw new Error(r.errors.join('\n'));
  return buildChart(r.chart);
};

describe('ClockSync', () => {
  it('smooths jittery context time and snaps on large drift', () => {
    const s = new ClockSync(0.1, 0.03);
    // ctx time quantized to 10ms steps while perf advances smoothly
    for (let perf = 0; perf < 2000; perf += 16.7) {
      const ctx = Math.floor((perf / 1000 + 5) * 100) / 100;
      s.sample(ctx, perf);
    }
    expect(Math.abs(s.ctxTimeAt(2000) - 7)).toBeLessThan(0.01);
    s.sample(100, 2000);
    expect(s.ctxTimeAt(2000)).toBeCloseTo(100);
  });
});

describe('synth modifiers', () => {
  it('morphs between neighbouring tables', () => {
    expect(morphWeights(0)).toEqual([1, 0, 0, 0]);
    expect(morphWeights(1)).toEqual([0, 0, 0, 1]);
    const w = morphWeights(0.5);
    expect(w[1]! + w[2]!).toBeCloseTo(1);
    expect(easeForWeights([1, 0, 0, 0], 0.5)).toBeCloseTo(0.5);
  });

  it('unison adds echo slashes and parry charge', () => {
    const m1 = deriveModifiers({ ...DEFAULT_PATCH, unison: 1 });
    const m5 = deriveModifiers({ ...DEFAULT_PATCH, unison: 5, detune: 0.5 });
    expect(m1.echoCount).toBe(0);
    expect(m1.parryChargePerHit).toBe(0);
    expect(m5.echoCount).toBe(4);
    expect(m5.parryChargePerHit).toBeGreaterThan(0);
    expect(m5.echoSpread).toBeGreaterThan(m1.echoSpread - 1e-9);
  });
});

describe('GameSession pipeline', () => {
  it('hit → attack action → kill; miss → player hit', () => {
    const s = new GameSession(
      chartFrom([
        { beat: 1, lane: 'kick' },
        { beat: 2, lane: 'perc' },
      ]),
      { noFail: false },
    );
    const log: string[] = [];
    s.bus.on('judgement', (j) => log.push(`j:${j.judgement}`));
    s.bus.on('action', (a) => log.push(`a:${a.attack}`));
    s.bus.on('combat', (c) => log.push(`c:${c.type}`));
    s.step(
      [
        { lane: 0, down: true, time: 1.01 },
        { lane: 0, down: false, time: 1.05 },
      ],
      1.1,
    );
    s.step([], 3);
    expect(log).toEqual(['j:perfect', 'a:slam', 'c:kill', 'j:miss', 'c:playerHit']);
    expect(s.sim.hp).toBeLessThan(PLAYER.maxHp);
    expect(s.score.counts).toMatchObject({ perfect: 1, miss: 1 });
    expect(s.finished).toBe(true);
  });

  it('holds grind then finish', () => {
    const s = new GameSession(chartFrom([{ beat: 1, lane: 'bass', length: 2 }]), { noFail: true });
    const types: string[] = [];
    s.bus.on('action', (a) => types.push(a.attack + (a.grind ? ':grind' : '')));
    s.step([{ lane: 2, down: true, time: 1 }], 2);
    s.step([], 3.1);
    expect(types).toEqual(['sweep:grind', 'finisher']);
    expect(s.sim.kills).toBe(1);
  });

  it('echo parry absorbs a miss once charged', () => {
    const s = new GameSession(
      chartFrom([
        { beat: 1, lane: 'kick' },
        { beat: 3, lane: 'kick' },
      ]),
      { noFail: true },
    );
    s.sim.parryCharge = 1;
    const events: string[] = [];
    s.bus.on('combat', (c) => events.push(c.type));
    s.step([], 5);
    expect(events).toEqual(['parry', 'playerHit']);
  });

  it('autoplay through the real judge clears the demo chart with high accuracy', () => {
    const chart = buildChart(buildDemoChart('normal'));
    const s = new GameSession(chart, { noFail: true });
    const inputs = autoplayInputs(chart.notes, 0.012, 0, 1);
    s.step(inputs, chart.lastNoteTime + 1);
    expect(s.finished).toBe(true);
    expect(s.score.accuracy).toBeGreaterThan(0.9);
    expect(s.sim.kills).toBeGreaterThan(chart.notes.length * 0.95);
  });
});
