import { describe, expect, it } from 'vitest';
import { composeDemo } from '../src/audio/demo/composition';
import { buildChart } from '../src/chart/build';
import { buildDemoChart } from '../src/chart/demoChart';
import { ACTIONS } from '../src/chart/types';
import { ClockSync } from '../src/core/clockSync';
import { GameSession } from '../src/game/session';
import { autoplayInputs } from '../src/rhythm/input';
import { deriveModifiers, easeForWeights, morphWeights } from '../src/synth/modifiers';
import { DEFAULT_PATCH } from '../src/synth/patch';

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

  it('unison adds echo blades and parry charge; cutoff extends stab reach', () => {
    const m1 = deriveModifiers({ ...DEFAULT_PATCH, unison: 1 });
    const m5 = deriveModifiers({ ...DEFAULT_PATCH, unison: 5, detune: 0.5 });
    expect(m1.echoCount).toBe(0);
    expect(m1.parryChargePerHit).toBe(0);
    expect(m5.echoCount).toBe(4);
    expect(m5.parryChargePerHit).toBeGreaterThan(0);
    expect(m5.echoSpread).toBeGreaterThan(m1.echoSpread - 1e-9);
    const lo = deriveModifiers({ ...DEFAULT_PATCH, cutoff: 0 });
    const hi = deriveModifiers({ ...DEFAULT_PATCH, cutoff: 1 });
    expect(hi.reach).toBeGreaterThan(lo.reach);
    expect(hi.stabLunge).toBeGreaterThan(lo.stabLunge);
  });
});

describe('demo song and charts', () => {
  const normal = buildChart(buildDemoChart('normal'));
  const easy = buildChart(buildDemoChart('easy'));
  const spb = 60 / 160;

  it('every kick, clap, rim and crash is a normal-chart cue with the matching action', () => {
    const drums = composeDemo().filter((e) => ['kick', 'clap', 'rim', 'impact'].includes(e.inst));
    const actionOf = { kick: 'block', clap: 'slash', rim: 'stab', impact: 'flourish' } as const;
    expect(drums.length).toBe(normal.notes.length);
    drums.forEach((d, i) => {
      expect(normal.notes[i]!.beat).toBe(d.beat);
      expect(normal.notes[i]!.action).toBe(actionOf[d.inst as keyof typeof actionOf]);
    });
  });

  it('easy is a subset of normal (same beats, same actions)', () => {
    const key = (n: { beat: number; action: string }) => `${n.beat}:${n.action}`;
    const normalKeys = new Set(normal.notes.map(key));
    for (const n of easy.notes) expect(normalKeys.has(key(n))).toBe(true);
    expect(easy.notes.length).toBeLessThan(normal.notes.length * 0.7);
  });

  it('opens gently: each action is introduced alone, after its prompt, with space', () => {
    for (const chart of [normal, easy]) {
      const firstTime = ACTIONS.map((a) => chart.notes.find((n) => n.action === a)!.time);
      // introduced in order block → slash → stab → flourish, at least 4 bars apart
      for (let i = 1; i < 4; i++) {
        expect(firstTime[i]! - firstTime[i - 1]!).toBeGreaterThanOrEqual(16 * spb - 1e-9);
      }
      ACTIONS.forEach((a, i) => {
        const prompt = chart.prompts.find((p) => p.action === a)!;
        expect(prompt).toBeDefined();
        expect(firstTime[i]! - prompt.time).toBeGreaterThanOrEqual(4 * spb - 1e-9);
      });
      // the first 8 bars of cues are at least 2 beats apart
      const opener = chart.notes.filter((n) => n.time < firstTime[0]! + 32 * spb);
      for (let i = 1; i < opener.length; i++) {
        expect(opener[i]!.time - opener[i - 1]!.time).toBeGreaterThanOrEqual(2 * spb - 1e-9);
      }
    }
  });

  it('ramps density across the song, and easy never goes faster than quarter notes', () => {
    const density = (chart: typeof normal, fromBar: number, toBar: number) =>
      chart.notes.filter((n) => n.beat >= fromBar * 4 && n.beat < toBar * 4).length /
      ((toBar - fromBar) * 4 * spb);
    for (const chart of [normal, easy]) {
      const intro = density(chart, 0, 10);
      const verse = density(chart, 10, 16);
      const drop1 = density(chart, 24, 40);
      const drop2 = density(chart, 48, 64);
      expect(intro).toBeLessThan(verse);
      expect(verse).toBeLessThan(drop1);
      expect(drop1).toBeLessThanOrEqual(drop2);
    }
    expect(density(easy, 0, 10)).toBeLessThan(1.2);
    expect(density(easy, 48, 64)).toBeLessThan(2.5);
    expect(density(normal, 48, 64)).toBeLessThan(5);
    for (let i = 1; i < easy.notes.length; i++) {
      expect(easy.notes[i]!.beat - easy.notes[i - 1]!.beat).toBeGreaterThanOrEqual(1);
    }
  });

  it('every enemy ends on a flourish (the crash on the downbeat)', () => {
    for (const chart of [normal, easy]) {
      expect(chart.encounters.length).toBe(12);
      for (const e of chart.encounters) {
        expect(chart.notes[e.noteIds[e.noteIds.length - 1]!]!.action).toBe('flourish');
      }
    }
  });
});

describe('GameSession pipeline', () => {
  it('autoplay through the real judge clears the demo chart and defeats every enemy', () => {
    for (const d of ['normal', 'easy'] as const) {
      const chart = buildChart(buildDemoChart(d));
      const s = new GameSession(chart, { noFail: true });
      const inputs = autoplayInputs(chart.notes, 0.012, 0, 1);
      s.step(inputs, chart.lastNoteTime + 1);
      expect(s.finished).toBe(true);
      expect(s.score.accuracy).toBeGreaterThan(0.9);
      expect(s.duel.defeated).toBe(chart.encounters.length);
      expect(s.duel.hitsTaken).toBe(0);
    }
  });
});
