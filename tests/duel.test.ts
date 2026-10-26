import { describe, expect, it } from 'vitest';
import { buildChart } from '../src/chart/build';
import type { ChartEncounter, ChartNote } from '../src/chart/types';
import { validateChart } from '../src/chart/validate';
import { telegraphAt } from '../src/combat/telegraph';
import { PLAYER } from '../src/config/gameplay';
import { GameSession } from '../src/game/session';
import type { LaneInput } from '../src/rhythm/input';

/** 60 BPM so beat == second. */
const chartFrom = (notes: ChartNote[], encounters?: ChartEncounter[]) => {
  const r = validateChart({
    format: 'voxel-rhythm-chart',
    version: 2,
    meta: { title: 't' },
    audio: { procedural: 'x' },
    timing: { bpm: 60, offsetMs: 0 },
    ...(encounters ? { encounters } : {}),
    notes,
  });
  if (!r.ok) throw new Error(r.errors.join('\n'));
  return buildChart(r.chart);
};

const LANE = { block: 0, slash: 1, stab: 2, flourish: 3 };
const tap = (action: keyof typeof LANE, time: number): LaneInput[] => [
  { lane: LANE[action], down: true, time },
  { lane: LANE[action], down: false, time: time + 0.05 },
];

function run(notes: ChartNote[], inputs: LaneInput[], until = 20, encounters?: ChartEncounter[]) {
  const s = new GameSession(chartFrom(notes, encounters), { noFail: false });
  const log: string[] = [];
  s.bus.on('duel', (d) => {
    if (d.type === 'enemyEnter') log.push(`enter:${d.encounter}`);
    else if (d.type === 'struck' || d.type === 'recovered' || d.type === 'released')
      log.push(`${d.type}:${d.action}`);
    else log.push(d.type);
  });
  s.step(inputs, until);
  return { s, log };
}

describe('duel consequences', () => {
  it('a hit block parries the attack; a missed block lands it on the hero', () => {
    const notes: ChartNote[] = [
      { beat: 2, action: 'block' },
      { beat: 3, action: 'block' },
      { beat: 4, action: 'flourish' },
    ];
    const { s, log } = run(notes, [...tap('block', 2), ...tap('flourish', 4)]);
    expect(log).toEqual(['enter:0', 'blocked', 'playerHit', 'struck:flourish', 'defeated']);
    expect(s.duel.hp).toBeLessThan(PLAYER.maxHp);
    expect(s.duel.hitsTaken).toBe(1);
  });

  it('missed slashes and stabs let the enemy recover without hurting the hero', () => {
    const notes: ChartNote[] = [
      { beat: 2, action: 'slash' },
      { beat: 3, action: 'stab' },
      { beat: 4, action: 'flourish' },
    ];
    const { s, log } = run(notes, tap('flourish', 4));
    expect(log).toEqual([
      'enter:0',
      'recovered:slash',
      'recovered:stab',
      'struck:flourish',
      'defeated',
    ]);
    expect(s.duel.hp).toBe(PLAYER.maxHp);
    expect(s.duel.enemies[0]!.guard).toBe(2);
  });

  it('missing the last cue lets the enemy escape', () => {
    const { s, log } = run(
      [
        { beat: 2, action: 'slash' },
        { beat: 3, action: 'flourish' },
      ],
      tap('slash', 2),
    );
    expect(log).toEqual(['enter:0', 'struck:slash', 'recovered:flourish', 'escaped']);
    expect(s.duel.escaped).toBe(1);
    expect(s.duel.defeated).toBe(0);
    expect(s.duel.enemies[0]!.state).toBe('escaped');
  });

  it('one enemy at a time: the next walks in when its encounter starts', () => {
    const notes: ChartNote[] = [
      { beat: 2, action: 'flourish' },
      { beat: 5, action: 'block' },
      { beat: 6, action: 'flourish' },
    ];
    const s = new GameSession(chartFrom(notes, [{ beat: 0 }, { beat: 3, enemy: 'brute' }]), {
      noFail: true,
    });
    s.step(tap('flourish', 2), 2.5);
    expect(s.duel.activeEncounter(2.5)).toBe(0);
    expect(s.duel.enemies.map((e) => e.state)).toEqual(['defeated', 'waiting']);
    s.step([], 3.01);
    expect(s.duel.activeEncounter(3.01)).toBe(1);
    expect(s.duel.enemies[1]!.state).toBe('fighting');
  });

  it('a held block is a blade lock: release on time to shove, let go early and get hit', () => {
    const notes: ChartNote[] = [
      { beat: 2, action: 'block', length: 2 },
      { beat: 6, action: 'block', length: 2 },
      { beat: 9, action: 'flourish' },
    ];
    const inputs: LaneInput[] = [
      { lane: 0, down: true, time: 2 },
      { lane: 0, down: false, time: 4 },
      { lane: 0, down: true, time: 6 },
      { lane: 0, down: false, time: 6.5 },
    ];
    const { log } = run(notes, inputs);
    expect(log.slice(0, 5)).toEqual([
      'enter:0',
      'blocked',
      'released:block',
      'blocked',
      'playerHit',
    ]);
  });

  it('echo parry absorbs a missed block once charged', () => {
    const s = new GameSession(
      chartFrom([
        { beat: 1, action: 'block' },
        { beat: 3, action: 'block' },
      ]),
      { noFail: true },
    );
    s.duel.parryCharge = 1;
    const events: string[] = [];
    s.bus.on('duel', (d) => events.push(d.type));
    s.step([], 5);
    expect(events).toEqual(['enemyEnter', 'parry', 'playerHit', 'escaped']);
  });

  it('pressing keys plays the move even with no cue (input event), without judging', () => {
    const s = new GameSession(chartFrom([{ beat: 4, action: 'flourish' }]), { noFail: true });
    const inputs: string[] = [];
    s.bus.on('input', (i) => i.down && inputs.push(`lane${i.lane}`));
    let judged = 0;
    s.bus.on('judgement', () => judged++);
    s.step([...tap('slash', 1), ...tap('stab', 1.5)], 2);
    expect(inputs).toEqual(['lane1', 'lane2']);
    expect(judged).toBe(0);
  });
});

describe('telegraphAt', () => {
  const opts = { lead: 0.7, resolve: 0.15, walkIn: 1 };
  const chart = chartFrom([
    { beat: 3, action: 'block' },
    { beat: 3.5, action: 'slash' },
    { beat: 6, action: 'flourish' },
  ]);

  it('is idle before the first enemy and tracks walk-in age', () => {
    const late = chartFrom([{ beat: 3, action: 'block' }], [{ beat: 1 }]);
    expect(telegraphAt(late, 0.5, opts).encounter).toBeNull();
    expect(telegraphAt(late, 1.5, opts)).toMatchObject({ encounter: 0, enterAge: 0.5 });
  });

  it('winds up over the lead time and peaks exactly on the cue', () => {
    expect(telegraphAt(chart, 2.3, opts).next).toMatchObject({ action: 'block', progress: 0 });
    expect(telegraphAt(chart, 2.65, opts).next!.progress).toBeCloseTo(0.5);
    expect(telegraphAt(chart, 2.9999, opts).next!.progress).toBeCloseTo(1, 3);
  });

  it('starts the next wind-up only after the previous outcome plays out', () => {
    const t = telegraphAt(chart, 3.1, opts);
    expect(t.last).toMatchObject({ action: 'block' });
    expect(t.last!.age).toBeCloseTo(0.1);
    expect(t.next).toMatchObject({ action: 'slash', progress: 0 });
    // window for the slash is 3.15 → 3.5
    expect(telegraphAt(chart, 3.325, opts).next!.progress).toBeCloseTo(0.5);
  });

  it('has no next cue after the encounter ends', () => {
    const t = telegraphAt(chart, 7, opts);
    expect(t.next).toBeNull();
    expect(t.last).toMatchObject({ action: 'flourish' });
  });
});
