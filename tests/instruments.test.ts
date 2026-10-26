import { describe, expect, it } from 'vitest';
import { composeDemo, PARTS } from '../src/audio/demo/composition';
import { PartGates } from '../src/audio/partGates';
import { ACTIONS } from '../src/chart/types';
import { INSTRUMENT_BINDINGS } from '../src/config/instrumentMapping';
import { DEFAULT_MUSIC_MAPPING, MUSIC_MAPPINGS, musicMapping } from '../src/config/musicMapping';

describe('instrument mapping (variant A)', () => {
  it('is the default music mapping, with the sword-only mapping still available', () => {
    expect(DEFAULT_MUSIC_MAPPING).toBe('instruments');
    expect(musicMapping('nope')).toBe(MUSIC_MAPPINGS.instruments);
    expect(MUSIC_MAPPINGS.sword).toBeDefined();
  });

  it('binds each action to its own demo part', () => {
    const parts = ACTIONS.map((a) => INSTRUMENT_BINDINGS[a].part);
    expect(new Set(parts).size).toBe(4);
    for (const p of parts) expect(PARTS).toContain(p);
    expect(INSTRUMENT_BINDINGS.block.part).toBe('k808');
    expect(INSTRUMENT_BINDINGS.slash.part).toBe('lead');
    expect(INSTRUMENT_BINDINGS.stab.part).toBe('perc');
    expect(INSTRUMENT_BINDINGS.flourish.part).toBe('vox');
  });

  it('every demo cue is an onset in the part its action plays', () => {
    for (const e of composeDemo()) {
      if (e.chart) expect(e.part).toBe(INSTRUMENT_BINDINGS[e.chart.action].part);
    }
  });
});

describe('PartGates', () => {
  it("a miss knocks the action's part out until that action's next cue", () => {
    const g = new PartGates(INSTRUMENT_BINDINGS, 3);
    const { part, state } = g.miss('slash', 10);
    expect(part).toBe('lead');
    expect(state).toEqual({ mode: 'glitch', from: 10, until: 13 });
    expect(g.cue('block', 11)).toBeNull(); // other actions don't bring it back
    expect(g.cue('slash', 9.9)).toBeNull(); // nor an earlier cue
    expect(g.cue('slash', 11)).toBe('lead');
    expect(g.state('lead')).toBeNull();
  });

  it('brings a part back after the time-out if no cue comes', () => {
    const g = new PartGates(INSTRUMENT_BINDINGS, 3);
    g.miss('block', 10);
    expect(g.state('k808')).toMatchObject({ mode: 'mute' });
    expect(g.expire(12.9)).toEqual([]);
    expect(g.expire(13)).toEqual(['k808']);
    expect(g.state('k808')).toBeNull();
  });
});
