import { describe, expect, it } from 'vitest';
import { buildChart } from '../src/chart/build';
import { buildLabChart } from '../src/chart/labChart';
import { buildFreestyleChart, EXTRA_FINISHER_BARS } from '../src/experiments/freestyle/chart';
import {
  botSwing,
  enemyHp,
  freeBeats,
  Fury,
  FURY_IDLE_BEATS,
  FURY_TIERS,
  GRID_WINDOWS,
  gridJudge,
  hitDamage,
  hitScore,
  layerGain,
  SlotGuard,
} from '../src/experiments/freestyle/logic';
import { beatApproach, beatPulse, crossedBeat } from '../src/experiments/juice/beat';
import {
  BeatQueue,
  cueForPress,
  holdUntil,
  ON_BEAT_WINDOWS,
} from '../src/experiments/onBeat/logic';
import {
  BLOCK_LANE,
  buttonOf,
  nearestOffense,
  TwoButtonMapper,
  type OffenseCue,
} from '../src/experiments/twoButton/logic';
import { GameSession } from '../src/game/session';
import { AutoPlayer } from '../src/rhythm/input';
import { simulate } from './helpers';

describe('beat helpers', () => {
  it('pulse peaks on the beat and decays; approach rises to the next beat', () => {
    expect(beatPulse(4)).toBe(1);
    expect(beatPulse(4.5)).toBeCloseTo(0.125);
    expect(beatPulse(Number.NaN)).toBe(0);
    expect(beatApproach(2.25)).toBeCloseTo(0.25);
  });

  it('crossedBeat reports the integer beat crossed', () => {
    expect(crossedBeat(1.9, 2.05)).toBe(2);
    expect(crossedBeat(2.05, 2.5)).toBeNull();
    expect(crossedBeat(-Infinity, 1)).toBeNull();
  });
});

describe('on-beat assist', () => {
  const w = ON_BEAT_WINDOWS;
  const cues = [
    { id: 1, time: 1 },
    { id: 2, time: 1.5 },
  ];

  it('widens the windows', () => {
    expect(w.perfect).toBe(0.06);
    expect(w.great).toBe(0.11);
    expect(w.good).toBe(0.16);
  });

  it('picks the cue the judge would', () => {
    expect(cueForPress(cues, 0.9, w)?.id).toBe(1);
    expect(cueForPress(cues, 1.35, w)?.id).toBe(2);
    expect(cueForPress(cues, 1.2, w)).toBeNull();
    expect(cueForPress(cues, 0.5, w)).toBeNull();
  });

  it('holds early hits until the beat and resolves late ones now', () => {
    expect(holdUntil(cues[0]!, 0.9, w)).toBe(1);
    expect(holdUntil(cues[0]!, 1.05, w)).toBeNull();
    expect(holdUntil(cues[0]!, 0.82, w)).toBeNull();
    expect(holdUntil(null, 0.9, w)).toBeNull();
  });

  it('releases held presses on the beat with their real time and moveAt on the beat', () => {
    const q = new BeatQueue();
    expect(q.hold({ lane: 1, down: true, time: 0.92 }, 1, 7)).toEqual([]);
    expect(q.up({ lane: 1, down: false, time: 0.95 })).toBe(true);
    expect(q.up({ lane: 2, down: false, time: 0.95 })).toBe(false);
    expect(q.isHeld(7)).toBe(true);
    expect(q.heldLanes()).toEqual([1]);
    expect(q.due(0.97)).toEqual([]);
    const out = q.due(0.98, 0.03);
    expect(out).toEqual([
      { lane: 1, down: true, time: 0.92, moveAt: 1 },
      { lane: 1, down: false, time: 0.95 },
    ]);
    expect(q.size).toBe(0);
  });

  it('a second early press on a lane releases the first at once', () => {
    const q = new BeatQueue();
    q.hold({ lane: 0, down: true, time: 0.9 }, 1, 1);
    const out = q.hold({ lane: 0, down: true, time: 1.4 }, 1.5, 2);
    expect(out).toEqual([{ lane: 0, down: true, time: 0.9, moveAt: 1 }]);
    expect(q.size).toBe(1);
  });
});

describe('two buttons', () => {
  const cues: OffenseCue[] = [
    { lane: 1, time: 1, action: 'slash' },
    { lane: 2, time: 1.5, action: 'stab' },
    { lane: 0, time: 1.2, action: 'block' },
    { lane: 3, time: 3, action: 'flourish' },
  ];

  it('slots 0 and 2 defend, 1 and 3 attack', () => {
    expect([0, 1, 2, 3].map(buttonOf)).toEqual(['defend', 'attack', 'defend', 'attack']);
  });

  it('finds the nearest offensive cue in reach, never a block', () => {
    expect(nearestOffense(cues, 1.1, 0.2)?.lane).toBe(1);
    expect(nearestOffense(cues, 1.4, 0.2)?.lane).toBe(2);
    expect(nearestOffense(cues, 1.2, 0.1)).toBeNull();
    expect(nearestOffense(cues, 2.95, 0.2)?.action).toBe('flourish');
  });

  it('maps defend to the block lane and attack to the due cue, ups follow', () => {
    const m = new TwoButtonMapper(0.2);
    expect(m.map({ lane: 0, down: true, time: 1.2 }, cues).lane).toBe(BLOCK_LANE);
    expect(m.map({ lane: 1, down: true, time: 1.48 }, cues).lane).toBe(2);
    expect(m.map({ lane: 1, down: false, time: 1.55 }, cues).lane).toBe(2);
    expect(m.map({ lane: 3, down: true, time: 3.02 }, cues).lane).toBe(3);
  });

  it('alternates slash and stab when no attack is due', () => {
    const m = new TwoButtonMapper(0.2);
    const lanes = [0, 1, 2, 3].map((k) => m.map({ lane: 1, down: true, time: 10 + k }, cues).lane);
    expect(lanes).toEqual([1, 2, 1, 2]);
  });
});

describe('freestyle rules', () => {
  const spb = 60 / 140;

  it('judges swings against the nearest eighth note', () => {
    expect(gridJudge(4, spb)).toMatchObject({ slot: 8, quality: 'perfect' });
    expect(gridJudge(4.5 + 0.05 / spb, spb)).toMatchObject({ slot: 9, quality: 'good' });
    expect(gridJudge(4.25, spb).quality).toBe('whiff');
    expect(gridJudge(4 - 0.02 / spb, spb).offset).toBeCloseTo(-0.02);
    expect(GRID_WINDOWS.perfect).toBeLessThan(GRID_WINDOWS.good);
  });

  it('fury climbs x1 to x16 with on-beat hits', () => {
    const f = new Fury();
    expect(f.mult).toBe(1);
    const seen: number[] = [];
    for (let i = 0; i < 40; i++) {
      if (f.hit(i * 0.5) === 'up') seen.push(f.mult);
    }
    expect(seen).toEqual([2, 4, 8, 16]);
    expect(f.progress).toBe(1);
    expect(FURY_TIERS.map((t) => t.mult)).toEqual([1, 2, 4, 8, 16]);
  });

  it('a whiff drops one tier, a hurt two, idling one', () => {
    const f = new Fury();
    for (let i = 0; i < 18; i++) f.hit(i);
    expect(f.mult).toBe(8);
    expect(f.whiff(18)).toBe('down');
    expect(f.mult).toBe(4);
    expect(f.hurt(19)).toBe('down');
    expect(f.mult).toBe(1);
    expect(f.whiff(20)).toBeNull();
    for (let i = 0; i < 4; i++) f.hit(21 + i);
    expect(f.mult).toBe(2);
    expect(f.idle(24 + FURY_IDLE_BEATS - 0.5)).toBeNull();
    expect(f.idle(24 + FURY_IDLE_BEATS)).toBe('down');
    expect(f.mult).toBe(1);
  });

  it('progress tracks the streak toward the next tier', () => {
    const f = new Fury();
    f.hit(0);
    f.hit(1);
    expect(f.progress).toBeCloseTo(0.5);
  });

  it('allows one swing per eighth slot', () => {
    const g = new SlotGuard();
    expect(g.take(4)).toBe(true);
    expect(g.take(4)).toBe(false);
    expect(g.take(3)).toBe(false);
    expect(g.take(5)).toBe(true);
  });

  it('damage grows gently with fury and halves on the off-beat; score multiplies fully', () => {
    expect(hitDamage('whiff', 4)).toBe(0);
    expect(hitDamage('good', 0)).toBe(1);
    expect(hitDamage('perfect', 0)).toBeCloseTo(1.2);
    expect(hitDamage('good', 4)).toBeCloseTo(1.8);
    expect(hitDamage('good', 0, 9)).toBeCloseTo(0.5);
    expect(hitDamage('good', 0, -3)).toBeCloseTo(0.5);
    expect(hitScore('perfect', 16)).toBe(1920);
    expect(hitScore('whiff', 16)).toBe(0);
  });

  it('layers the song in with fury: drums and bass, then lead, chops, backing', () => {
    expect(['k808', 'perc', 'lead', 'vox', 'backing'].map((p) => layerGain(p, 0))).toEqual([
      1, 1, 0, 0, 0,
    ]);
    expect(layerGain('lead', 1)).toBe(1);
    expect(layerGain('vox', 1)).toBe(0);
    expect(layerGain('vox', 2)).toBe(1);
    expect(layerGain('backing', 2)).toBe(0);
    expect(layerGain('backing', 3)).toBe(1);
    expect(layerGain('mix', 0)).toBe(1);
    expect(layerGain('lead', 99)).toBe(1);
  });

  it('counts free beats and scales HP with them and the enemy index', () => {
    expect(freeBeats(0, 8, [0, 4.25])).toBe(6);
    expect(freeBeats(0, 8, [4.5])).toBe(8);
    expect(freeBeats(0, 8, [])).toBe(8);
    expect(enemyHp(20, 0)).toBe(23);
    expect(enemyHp(20, 3)).toBeGreaterThan(enemyHp(20, 0));
    expect(enemyHp(0)).toBe(6);
  });

  it('the bot follows its pattern and keeps clear of cues', () => {
    expect(botSwing(0, 10, [], 0.25)).toBe(1);
    expect(botSwing(1, 10, [], 0.25)).toBeNull();
    expect(botSwing(0, 10, [10.1], 0.25)).toBeNull();
    expect(botSwing(-8, 10, [], 0.25)).toBe(1);
  });
});

describe('freestyle chart', () => {
  const file = buildFreestyleChart();
  const chart = buildChart(file);

  it('charts only enemy attacks (blocks) and finishers', () => {
    expect(new Set(file.notes.map((n) => n.action))).toEqual(new Set(['block', 'flourish']));
    const labBlocks = buildLabChart().notes.filter((n) => n.action === 'block').length;
    const blocks = file.notes.filter((n) => n.action === 'block').length;
    expect(blocks).toBe(labBlocks - EXTRA_FINISHER_BARS.length);
    expect(file.combos).toEqual([]);
    expect(file.prompts).toEqual([]);
  });

  it('has six enemies, each ending on a finisher', () => {
    expect(chart.encounters.length).toBe(6);
    for (const e of chart.encounters) {
      const last = chart.notes[e.noteIds[e.noteIds.length - 1]!]!;
      expect(last.action, e.name).toBe('flourish');
    }
  });

  it('autoplay clears it and defeats every enemy', () => {
    const s = new GameSession(chart, { noFail: false });
    simulate(s, [], chart.lastNoteTime + 3, new AutoPlayer(0.01, 0, 7));
    expect(s.duel.defeated).toBe(chart.encounters.length);
    expect(s.score.counts.miss).toBe(0);
  });
});
