import { describe, expect, it } from 'vitest';
import { composeDemo, composeSong, DEMO_SONG } from '../src/audio/demo/composition';
import { LAB_SONG } from '../src/audio/demo/labSong';
import { SONGS, songEvents } from '../src/audio/songs';
import { buildChart } from '../src/chart/build';
import { buildLabChart, LAB_SONG_NAME } from '../src/chart/labChart';
import { ACTIONS } from '../src/chart/types';
import { experimentChartFile, experimentSeconds } from '../src/experiments/load';
import { BASELINE_KEY, EXPERIMENTS, experimentByKey } from '../src/experiments/registry';
import { GameSession } from '../src/game/session';
import { AutoPlayer } from '../src/rhythm/input';
import { simulate } from './helpers';

describe('procedural songs', () => {
  it('composeSong reproduces the demo exactly', () => {
    expect(composeSong(DEMO_SONG)).toEqual(composeDemo());
  });

  it('every built-in song has a composition', () => {
    for (const name of Object.keys(SONGS)) expect(songEvents(name)?.length).toBeGreaterThan(0);
    expect(songEvents('nope')).toBeNull();
  });
});

describe('lab chart', () => {
  const file = buildLabChart();
  const chart = buildChart(file);

  it('plays the lab song and lasts about a minute', () => {
    expect(file.audio.procedural).toBe(LAB_SONG_NAME);
    expect(chart.lastNoteTime).toBeGreaterThan(45);
    expect(chart.lastNoteTime).toBeLessThan(90);
  });

  it('introduces all four actions in the first 25 seconds', () => {
    for (const a of ACTIONS) {
      const first = chart.notes.find((n) => n.action === a);
      expect(first, a).toBeDefined();
      expect(first!.time, a).toBeLessThan(25);
    }
  });

  it('keeps cues at least an eighth apart and at most about 2.5 per second over any bar', () => {
    const eighth = 60 / file.timing.bpm / 2;
    for (let i = 1; i < chart.notes.length; i++)
      expect(chart.notes[i]!.time - chart.notes[i - 1]!.time).toBeGreaterThan(eighth - 1e-6);
    for (const bar of chart.bars) expect(bar.noteIds.length / bar.durSec).toBeLessThanOrEqual(3);
  });

  it('every cue is an onset in the lab composition', () => {
    const charted = composeSong(LAB_SONG).filter((e) => e.chart);
    expect(charted.length).toBe(file.notes.length);
  });

  it('autoplay clears it and defeats every enemy', () => {
    const s = new GameSession(chart, { noFail: false });
    simulate(s, [], chart.lastNoteTime + 3, new AutoPlayer(0.01, 0, 7));
    expect(s.duel.defeated).toBe(chart.encounters.length);
    expect(s.score.counts.miss).toBe(0);
  });
});

describe('experiment registry', () => {
  it('has the baseline first and unique kebab-case keys', () => {
    expect(EXPERIMENTS[0]!.key).toBe(BASELINE_KEY);
    const keys = EXPERIMENTS.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const k of keys) expect(k).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(experimentByKey('nope')).toBeNull();
  });

  for (const exp of EXPERIMENTS) {
    describe(exp.key, () => {
      it('has a label, tagline, hypothesis and a 2-4 line how-to', () => {
        expect(exp.label.length).toBeGreaterThan(0);
        expect(exp.tagline.length).toBeGreaterThan(0);
        expect(exp.hypothesis.length).toBeGreaterThan(20);
        expect(exp.howTo.length).toBeGreaterThanOrEqual(2);
        expect(exp.howTo.length).toBeLessThanOrEqual(4);
      });

      it('has a valid chart on a procedural song, 30-100 s long', () => {
        const { file } = experimentChartFile(exp);
        expect(file.audio.procedural && SONGS[file.audio.procedural]).toBeTruthy();
        const secs = experimentSeconds(exp);
        expect(secs).toBeGreaterThan(30);
        expect(secs).toBeLessThan(100);
      });

      it('autoplay gets through its chart without errors', () => {
        const chart = buildChart(experimentChartFile(exp).file);
        const s = new GameSession(chart, { noFail: true });
        simulate(s, [], chart.lastNoteTime + 3, new AutoPlayer(0.01, 0, 3));
        expect(s.finished).toBe(true);
        expect(s.score.counts.miss).toBe(0);
      });
    });
  }
});
