import { describe, expect, it } from 'vitest';
import {
  FlourishDirector,
  HYBRID,
  LANE_PART,
  LeadScheduler,
  hitAccent,
  lastOfCombo,
  missGlitch,
  tapeStopCurve,
  type FlourishKind,
  type LeadNote,
} from '../src/audio/hybrid/plan';
import { composeDemo, leadNotesByBar, PARTS } from '../src/audio/demo/composition';
import { buildChart } from '../src/chart/build';
import { buildDemoChart } from '../src/chart/demoChart';
import { ACTIONS } from '../src/chart/types';
import { DEFAULT_MUSIC_MAPPING, MUSIC_MAPPINGS, musicMapping } from '../src/config/musicMapping';
import { GameSession } from '../src/game/session';
import { AutoPlayer } from '../src/rhythm/input';

const SPB = 60 / 155;

describe('hybrid mapping: moves perform parts', () => {
  it('maps every action to a demo stem, and every demo cue is an onset in its mapped part', () => {
    for (const a of ACTIONS) expect(PARTS).toContain(LANE_PART[a]);
    for (const e of composeDemo()) if (e.chart) expect(e.part).toBe(LANE_PART[e.chart.action]);
  });

  it('a miss glitches the part with 1/32 chops, then mutes it', () => {
    const pts = missGlitch(10, SPB);
    expect(pts[0]).toEqual({ t: 10, v: 1, ramp: 'set' });
    const chops = pts.filter((p) => p.ramp === 'set');
    expect(chops).toHaveLength(HYBRID.glitchBeats * 8);
    chops.forEach((p, i) => {
      expect(p.t).toBeCloseTo(10 + (i * SPB) / 8, 9);
      expect(p.v).toBe(i % 2 === 0 ? 1 : HYBRID.chopLow);
    });
    const last = pts[pts.length - 1]!;
    expect(last.t).toBeCloseTo(10 + HYBRID.glitchBeats * SPB, 9);
    expect(last.v).toBe(HYBRID.mutedLevel);
  });

  it('a single mix stem is glitched but never left muted', () => {
    const pts = missGlitch(0, SPB, false);
    expect(pts[pts.length - 1]!.v).toBe(1);
  });

  it('a hit restores the part with an accent that scales with the judgement', () => {
    const peak = (j: 'perfect' | 'great' | 'good') => hitAccent(5, j, SPB)[0]!.v;
    expect(peak('perfect')).toBeGreaterThan(peak('great'));
    expect(peak('great')).toBeGreaterThan(peak('good'));
    expect(peak('good')).toBeGreaterThan(1);
    const [, back] = hitAccent(5, 'perfect', SPB);
    expect(back).toEqual({ t: 5 + HYBRID.accentBeats * SPB, v: 1, ramp: 'linear' });
  });
});

describe('hybrid mapping: combo flourishes', () => {
  it('fills build up with the clean streak and the run ends on a tape stop', () => {
    const d = new FlourishDirector();
    const kinds: FlourishKind[] = [];
    const intensities: number[] = [];
    for (let bar = 57; bar <= 63; bar++) {
      const p = d.cleared({ bar, attempt: 1 }, bar === 63);
      kinds.push(p.kind);
      intensities.push(p.intensity);
    }
    expect(kinds).toEqual([
      'stutter',
      'riser',
      'filterOpen',
      'stutter',
      'riser',
      'filterOpen',
      'tapeStop',
    ]);
    expect(intensities[0]).toBeCloseTo(0.7);
    for (let i = 1; i < intensities.length; i++)
      expect(intensities[i]).toBeGreaterThanOrEqual(intensities[i - 1]!);
    expect(intensities[intensities.length - 1]).toBe(1);
  });

  it('a failure resets the streak and a cleared retry opens the filter', () => {
    const d = new FlourishDirector();
    d.cleared({ bar: 41, attempt: 1 }, false);
    d.cleared({ bar: 42, attempt: 1 }, false);
    d.failed();
    const retry = d.cleared({ bar: 43, attempt: 2 }, false);
    expect(retry.kind).toBe('filterOpen');
    expect(retry.intensity).toBeCloseTo(0.7);
    expect(d.cleared({ bar: 44, attempt: 1 }, false).kind).toBe('riser');
  });

  it('a non-consecutive clear starts a new streak', () => {
    const d = new FlourishDirector();
    d.cleared({ bar: 41, attempt: 1 }, false);
    expect(d.cleared({ bar: 57, attempt: 1 }, false).kind).toBe('stutter');
  });

  it('knows where each demo combo run ends', () => {
    const chart = buildChart(buildDemoChart('normal'));
    expect(lastOfCombo(chart, 45)).toBe(false);
    expect(lastOfCombo(chart, 46)).toBe(true);
    expect(lastOfCombo(chart, 62)).toBe(false);
    expect(lastOfCombo(chart, 63)).toBe(true);
  });

  it('tape-stop delay curve slows playback linearly to a stop at the bar line', () => {
    const T = SPB;
    const n = 101;
    const c = tapeStopCurve(T, n);
    const dx = T / (n - 1);
    expect(c[0]).toBe(0);
    expect(c[n - 1]).toBeCloseTo(T / 2, 6);
    const speed = (i: number) => 1 - (c[i + 1]! - c[i]!) / dx;
    expect(speed(0)).toBeCloseTo(1, 1);
    expect(speed(n - 2)).toBeCloseTo(0, 1);
    for (let i = 1; i < n - 1; i++) expect(speed(i)).toBeLessThan(speed(i - 1));
  });
});

/** Run a session with autoplay, collecting live lead notes and flourish picks as a layer would. */
function run(failBars: number[]) {
  const chart = buildChart(buildDemoChart('normal'));
  const s = new GameSession(chart, { noFail: true });
  const auto = new AutoPlayer(0.01, 0, 1, failBars);
  s.bus.on('cues', (c) => auto.onCues(c));
  s.bus.on('cuesDropped', (ids) => auto.onDropped(ids));
  const director = new FlourishDirector();
  const picks: Array<{ bar: number; kind: FlourishKind }> = [];
  s.bus.on('combo', (c) => {
    if (c.type === 'failed') director.failed();
    else
      picks.push({
        bar: c.play.bar,
        kind: director.cleared(c.play, lastOfCombo(chart, c.play.bar)).kind,
      });
  });
  const sched = new LeadScheduler(chart, leadNotesByBar(composeDemo(), chart.beatsPerBar));
  const notes: LeadNote[] = [];
  const end = chart.lastNoteTime + 5;
  for (let t = -1; t <= end; t += 0.01) {
    s.step(auto.due(t), t);
    notes.push(...sched.due(s.conductor.plays, t));
  }
  return { chart, s, picks, notes };
}

describe('hybrid mapping: live lead on the adaptive timeline', () => {
  const lead = composeDemo().filter((e) => e.part === 'lead');

  it('schedules every lead note once, at chart time, when nothing repeats', () => {
    const { chart, notes } = run([]);
    expect(notes).toHaveLength(lead.length);
    expect(new Set(notes.map((n) => n.key)).size).toBe(notes.length);
    notes.forEach((n, i) => {
      expect(n.time).toBeCloseTo(chart.tempo.beatToSec(lead[i]!.beat), 6);
      expect(n.midi).toBe(lead[i]!.midi[0]);
    });
  });

  it('replays a repeated combo measure and shifts later notes by one measure', () => {
    const { chart, s, notes, picks } = run([41]);
    const measure = chart.bars[41]!.durSec;
    const inBar = lead.filter((e) => Math.floor(e.beat / 4) === 41).length;
    expect(notes).toHaveLength(lead.length + inBar);
    const [first, second] = s.conductor.plays.filter((p) => p.bar === 41);
    expect(second!.start - first!.start).toBeCloseTo(measure, 6);
    const last = lead[lead.length - 1]!;
    expect(notes[notes.length - 1]!.time).toBeCloseTo(
      chart.tempo.beatToSec(last.beat) + measure,
      6,
    );
    // the failed try gets no flourish; its retry opens the filter, the run ends on a tape stop
    expect(picks.filter((p) => p.bar <= 46)).toEqual([
      { bar: 41, kind: 'filterOpen' },
      { bar: 42, kind: 'riser' },
      { bar: 43, kind: 'filterOpen' },
      { bar: 44, kind: 'stutter' },
      { bar: 45, kind: 'riser' },
      { bar: 46, kind: 'tapeStop' },
    ]);
    expect(picks.filter((p) => p.bar >= 57)).toHaveLength(7);
  });
});

describe('music mapping registry', () => {
  it('offers the hybrid mapping without making it the default', () => {
    expect(MUSIC_MAPPINGS.hybrid?.create).toBeTypeOf('function');
    expect(musicMapping('hybrid').label).toMatch(/HYBRID/);
    expect(DEFAULT_MUSIC_MAPPING).not.toBe('hybrid');
  });
});
