import { describe, expect, it } from 'vitest';
import { CR_ENEMIES, CR_EXCHANGES, composeCallResponse } from '../src/audio/demo/callResponseSong';
import { composeSong } from '../src/audio/demo/composition';
import { beatKey, cueGroups, withoutCues } from '../src/audio/demo/keysounds';
import { LAB_SONG } from '../src/audio/demo/labSong';
import { SONGS, songEvents } from '../src/audio/songs';
import { buildChart } from '../src/chart/build';
import { buildLabChart } from '../src/chart/labChart';
import { validateChart } from '../src/chart/validate';
import { byEarChart, callResponseChart, keysoundChart } from '../src/experiments/audioFirst/charts';
import {
  countInPlan,
  keysoundStart,
  performEnvelope,
  punchEnvelope,
  teachAlpha,
} from '../src/experiments/audioFirst/timing';
import { exchangeAt } from '../src/experiments/callResponse';

describe('keysounds', () => {
  const lab = composeSong(LAB_SONG);
  const groups = cueGroups(lab);

  it('the keysound backing keeps no cue-sounding event, but keeps the groove', () => {
    const backing = songEvents('lab-140-keysound')!;
    expect(backing.some((e) => e.chart || e.cueBeat !== undefined)).toBe(false);
    expect(backing.filter((e) => e.inst === 'hat').length).toBeGreaterThan(100);
    expect(backing.some((e) => e.inst === 'k808')).toBe(false);
    expect(backing.length + lab.filter((e) => e.cueBeat !== undefined).length).toBe(lab.length);
  });

  it('every Lab cue has its own one-shot group, starting on the cue', () => {
    const notes = buildLabChart().notes;
    expect(groups.size).toBe(notes.length);
    for (const n of notes) {
      const g = groups.get(beatKey(n.beat));
      expect(g, `beat ${n.beat}`).toBeDefined();
      expect(Math.min(...g!.map((e) => e.beat))).toBe(0);
      expect(g!.some((e) => e.chart?.action === n.action)).toBe(true);
    }
  });

  it('groups carry the whole cue: a stab roll with its blip, a flourish with its chops and crash', () => {
    const roll = [...groups.values()].find((g) => g.some((e) => e.inst === 'blip'))!;
    expect(roll.filter((e) => e.inst === 'hat').length).toBeGreaterThanOrEqual(3);
    const flourish = [...groups.values()].find((g) =>
      g.some((e) => e.chart?.action === 'flourish'),
    )!;
    expect(flourish.filter((e) => e.inst === 'chop').length).toBe(4);
    expect(flourish.some((e) => e.inst === 'impact')).toBe(true);
  });

  it('keysoundStart quantizes early presses to the beat and plays late ones at once', () => {
    expect(keysoundStart(10.05, 10, 'perfect').when).toBe(10.05);
    expect(keysoundStart(10, 10.04, 'great').when).toBe(10.04);
    expect(keysoundStart(10.001, 10, 'great').when).toBe(10);
    const p = keysoundStart(1, 0, 'perfect');
    const g = keysoundStart(1, 0, 'great');
    const ok = keysoundStart(1, 0, 'good');
    expect(p.gain).toBeGreaterThan(g.gain);
    expect(g.gain).toBeGreaterThan(ok.gain);
    expect(p.shelfDb).toBeGreaterThan(g.shelfDb);
    expect(ok.lowpassHz).toBeLessThan(g.lowpassHz);
    expect(p.gain).toBeLessThanOrEqual(1);
  });
});

describe('call and response', () => {
  const chart = buildChart(callResponseChart());

  it('lasts 45-90 s, validates without warnings and starts with 1-2 note phrases', () => {
    const r = validateChart(callResponseChart());
    expect(r.ok && r.warnings).toEqual([]);
    expect(chart.lastNoteTime).toBeGreaterThan(45);
    expect(chart.lastNoteTime).toBeLessThan(90);
    expect(CR_EXCHANGES[0]!.notes.length).toBeLessThanOrEqual(2);
    expect(Math.max(...CR_EXCHANGES.map((x) => x.notes.length))).toBeLessThanOrEqual(4);
    expect(Math.max(...CR_EXCHANGES.slice(-4).map((x) => x.notes.length))).toBeGreaterThanOrEqual(
      3,
    );
  });

  it('cues only the answer bars, with exactly the call rhythm', () => {
    for (const x of CR_EXCHANGES) {
      const inCall = chart.notes.filter((n) => n.bar === x.callBar);
      const answer = chart.notes.filter((n) => n.bar === x.responseBar);
      expect(inCall).toEqual([]);
      expect(answer.map((n) => [n.beat - x.responseBar * 4, n.action])).toEqual(
        x.notes.map((n) => [n.beat, n.action]),
      );
    }
  });

  it('each enemy ends on a flourish and walks in after the previous one is finished', () => {
    for (let k = 0; k < CR_ENEMIES.length; k++) {
      const last = CR_ENEMIES[k]!.phrases.at(-1)!;
      expect(last.replace(/\./g, '').at(-1)).toBe('F');
      const ids = chart.encounters[k]!.noteIds;
      expect(chart.notes[ids[ids.length - 1]!]!.action).toBe('flourish');
    }
  });

  it('the enemy call is in the stems in its own voice; the answers are keysounds', () => {
    const all = composeCallResponse();
    const stems = songEvents('call-response-124')!;
    for (const x of CR_EXCHANGES) {
      const call = stems.filter((e) => Math.floor(e.beat / 4) === x.callBar);
      for (const n of x.notes)
        expect(call.some((e) => e.beat === x.callBar * 4 + n.beat && e.inst !== 'pad')).toBe(true);
      expect(stems.some((e) => e.cueBeat !== undefined)).toBe(false);
    }
    expect(cueGroups(all).size).toBe(chart.notes.length);
    expect(SONGS['call-response-124']!.bpm).toBe(124);
  });

  it('exchangeAt finds the call and answer halves', () => {
    const x = CR_EXCHANGES[3]!;
    expect(exchangeAt(0, CR_EXCHANGES).phase).toBe('intro');
    expect(exchangeAt(x.callBar * 4 + 1, CR_EXCHANGES)).toMatchObject({ phase: 'call', x });
    expect(exchangeAt(x.responseBar * 4 + 2, CR_EXCHANGES)).toMatchObject({
      phase: 'response',
      x,
      frac: 0.5,
    });
    expect(exchangeAt(999, CR_EXCHANGES).phase).toBe('outro');
  });

  it('the enemy performance peaks exactly on the note', () => {
    expect(performEnvelope(0)).toBe(1);
    expect(performEnvelope(-0.2)).toBe(0);
    expect(performEnvelope(-0.06)).toBeGreaterThan(0);
    expect(performEnvelope(0.1)).toBeLessThan(1);
    expect(performEnvelope(0.5)).toBe(0);
  });
});

describe('play by ear', () => {
  it('thins LAB.EXE to cues at least a beat apart, keeping every enemy and finisher', () => {
    const file = byEarChart();
    const r = validateChart(file);
    expect(r.ok && r.warnings).toEqual([]);
    const lab = new Set(buildLabChart().notes.map((n) => `${n.beat}:${n.action}`));
    for (const n of file.notes) expect(lab.has(`${n.beat}:${n.action}`)).toBe(true);
    for (let i = 1; i < file.notes.length; i++)
      expect(file.notes[i]!.beat - file.notes[i - 1]!.beat).toBeGreaterThanOrEqual(1);
    expect(buildChart(file).encounters.length).toBe(4);
  });

  it('count-ins start at a fixed musical lead and end by the cue', () => {
    const spb = 0.5;
    const at = (a: Parameters<typeof countInPlan>[0]) => countInPlan(a, 10, spb);
    expect(at('block').map((e) => [e.kind, e.time])).toEqual([['hup', 9.5]]);
    expect(at('slash')).toMatchObject([{ kind: 'whoosh', time: 9.5, dur: 0.5 }]);
    expect(at('stab').map((e) => e.time)).toEqual([9.5, 9.75]);
    expect(at('flourish').map((e) => [e.kind, e.time])).toEqual([
      ['three', 9],
      ['two', 9.5],
    ]);
    for (const a of ['block', 'slash', 'stab', 'flourish'] as const)
      for (const e of at(a)) expect(e.time + e.dur).toBeLessThanOrEqual(10 + 1e-9);
  });

  it('the teaching icons stay, then fade to nothing', () => {
    expect(teachAlpha(10, 36, 20)).toBe(1);
    expect(teachAlpha(46, 36, 20)).toBeCloseTo(0.5);
    expect(teachAlpha(60, 36, 20)).toBe(0);
  });
});

describe('keysound chart', () => {
  it('is the Lab chart on the keysound backing', () => {
    const k = keysoundChart();
    expect(k.notes).toEqual(buildLabChart().notes);
    expect(k.audio.procedural).toBe('lab-140-keysound');
  });
});

describe('hit punch', () => {
  it('rises in 15 ms and is mostly gone by 300 ms', () => {
    expect(punchEnvelope(-0.01)).toBe(0);
    expect(punchEnvelope(0.015)).toBeCloseTo(1);
    expect(punchEnvelope(0.3)).toBeLessThan(0.05);
  });
});

describe('cue tagging', () => {
  it('withoutCues is the identity on a song with no cues tagged', () => {
    const untagged = composeSong(LAB_SONG).filter((e) => e.cueBeat === undefined);
    expect(withoutCues(untagged)).toEqual(untagged);
  });
});
