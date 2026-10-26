import { describe, expect, it } from 'vitest';
import type { ChartEncounter, ChartNote } from '../src/chart/types';
import { telegraphAt } from '../src/combat/telegraph';
import { PLAYER } from '../src/config/gameplay';
import { GameSession } from '../src/game/session';
import { AutoPlayer, type LaneInput } from '../src/rhythm/input';
import { chartFrom, simulate, tap } from './helpers';

function run(notes: ChartNote[], inputs: LaneInput[], until = 20, encounters?: ChartEncounter[]) {
  const s = new GameSession(chartFrom(notes, encounters ? { encounters } : {}), { noFail: false });
  const log: string[] = [];
  s.bus.on('duel', (d) => {
    if (d.type === 'enemyEnter') log.push(`enter:${d.encounter}`);
    else if (d.type === 'struck' || d.type === 'recovered' || d.type === 'released')
      log.push(`${d.type}:${d.action}`);
    else log.push(d.type);
  });
  simulate(s, inputs, until);
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
    expect(s.duel.enemies[0]!.state).toBe('escaped');
  });

  it('one enemy at a time: the next walks in when its encounter starts', () => {
    const notes: ChartNote[] = [
      { beat: 2, action: 'flourish' },
      { beat: 5, action: 'block' },
      { beat: 6, action: 'flourish' },
    ];
    const s = new GameSession(
      chartFrom(notes, { encounters: [{ beat: 0 }, { beat: 3, enemy: 'brute' }] }),
      {
        noFail: true,
      },
    );
    simulate(s, tap('flourish', 2), 2.5);
    expect(s.duel.activeEncounter(2.5)).toBe(0);
    expect(s.duel.enemies.map((e) => e.state)).toEqual(['defeated', 'waiting']);
    simulate(s, [], 3.05);
    expect(s.duel.activeEncounter(3.05)).toBe(1);
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
    simulate(s, [], 5);
    expect(events).toEqual(['enemyEnter', 'parry', 'playerHit', 'escaped']);
  });

  it('pressing keys plays the move even with no cue (input event), without judging', () => {
    const s = new GameSession(chartFrom([{ beat: 4, action: 'flourish' }]), { noFail: true });
    const inputs: string[] = [];
    s.bus.on('input', (i) => i.down && inputs.push(`lane${i.lane}`));
    let judged = 0;
    s.bus.on('judgement', () => judged++);
    simulate(s, [...tap('slash', 1), ...tap('stab', 1.5)], 2);
    expect(inputs).toEqual(['lane1', 'lane2']);
    expect(judged).toBe(0);
  });
});

describe('boss combos and the adaptive timeline', () => {
  // 60 BPM, 4/4: bar n = seconds 4n..4n+4. Bar 1 is a combo: block@4, slash@5, stab@6.
  const notes: ChartNote[] = [
    { beat: 1, action: 'block' },
    { beat: 4, action: 'block' },
    { beat: 5, action: 'slash' },
    { beat: 6, action: 'stab' },
    { beat: 9, action: 'flourish' },
  ];
  const combos = [{ fromBar: 1, retries: 2 }];

  it('game time equals chart time while nothing is retried', () => {
    const s = new GameSession(chartFrom(notes, { combos }), { noFail: true });
    simulate(
      s,
      [
        ...tap('block', 1),
        ...tap('block', 4),
        ...tap('slash', 5),
        ...tap('stab', 6),
        ...tap('flourish', 9),
      ],
      12,
    );
    expect(s.conductor.plays.slice(0, 3).map((p) => [p.bar, p.start])).toEqual([
      [0, 0],
      [1, 4],
      [2, 8],
    ]);
    expect(s.combosCleared).toBe(1);
    expect(s.duel.defeated).toBe(1);
  });

  it('a miss inside a combo costs HP, voids the rest, and the measure repeats', () => {
    const s = new GameSession(chartFrom(notes, { combos }), { noFail: true });
    const combo: string[] = [];
    s.bus.on('combo', (c) =>
      combo.push(c.type === 'failed' ? `failed:${c.retry}:${c.until}` : 'cleared'),
    );
    const hits: number[] = [];
    s.bus.on('duel', (d) => d.type === 'playerHit' && hits.push(d.time));
    let judgedSlash = 0;
    s.bus.on('judgement', (j) => j.lane === 1 && j.time < 8 && judgedSlash++);
    // first try: hit the block, miss the slash; retry (bar 1 again at 8..12): hit everything
    simulate(
      s,
      [
        ...tap('block', 1),
        ...tap('block', 4),
        ...tap('stab', 6),
        ...tap('block', 8),
        ...tap('slash', 9),
        ...tap('stab', 10),
        ...tap('flourish', 13),
      ],
      15,
    );
    expect(combo).toEqual(['failed:true:8', 'cleared']);
    expect(hits).toHaveLength(1);
    expect(judgedSlash).toBe(1); // the missed slash; the stab at 6 was voided, never judged
    expect(s.conductor.plays.map((p) => [p.bar, p.attempt, p.start])).toEqual([
      [0, 1, 0],
      [1, 1, 4],
      [1, 2, 8],
      [2, 1, 12],
      [3, 1, 16],
    ]);
    // the flourish that was charted at 9s now plays a measure later
    expect(s.duel.defeated).toBe(1);
    expect(s.score.counts.miss).toBe(1);
  });

  it('caps retries, then moves on', () => {
    const s = new GameSession(chartFrom(notes, { combos }), { noFail: true });
    const fails: boolean[] = [];
    s.bus.on('combo', (c) => c.type === 'failed' && fails.push(c.retry));
    simulate(s, [], 24);
    expect(fails).toEqual([true, true, false]);
    expect(s.conductor.plays.filter((p) => p.bar === 1)).toHaveLength(3);
    expect(s.conductor.plays.find((p) => p.bar === 2)!.start).toBe(16);
    expect(s.duel.hitsTaken).toBe(1 + 3); // block at 1 (not a combo) + one per failed attempt
  });

  it("voiding an encounter's last cue (no retries left) lets the enemy escape", () => {
    const s = new GameSession(
      chartFrom(
        [
          { beat: 4, action: 'block' },
          { beat: 6, action: 'flourish' },
        ],
        { combos: [{ fromBar: 1, retries: 0 }] },
      ),
      { noFail: true },
    );
    simulate(s, [], 10);
    expect(s.duel.escaped).toBe(1);
    expect(s.finished).toBe(true);
  });

  it('autoplay that fumbles the first try clears the retry', () => {
    const s = new GameSession(chartFrom(notes, { combos }), { noFail: true });
    simulate(s, [], 16, new AutoPlayer(0, 0, 1, [1]));
    expect(s.combosFailed).toBe(1);
    expect(s.combosCleared).toBe(1);
    expect(s.duel.defeated).toBe(1);
  });
});

describe('telegraphAt', () => {
  const opts = { lead: 0.7, resolve: 0.15, walkIn: 1 };
  const cues = [
    { id: 0, action: 'block' as const, time: 3, endTime: null },
    { id: 1, action: 'slash' as const, time: 3.5, endTime: null },
    { id: 2, action: 'flourish' as const, time: 6, endTime: null },
  ];

  it('is idle before the first enemy and tracks walk-in age', () => {
    expect(telegraphAt(null, 0, [], 0.5, opts).encounter).toBeNull();
    expect(telegraphAt(0, 1, cues, 1.5, opts)).toMatchObject({ encounter: 0, enterAge: 0.5 });
  });

  it('winds up over the lead time and peaks exactly on the cue', () => {
    expect(telegraphAt(0, 0, cues, 2.3, opts).next).toMatchObject({ action: 'block', progress: 0 });
    expect(telegraphAt(0, 0, cues, 2.65, opts).next!.progress).toBeCloseTo(0.5);
    expect(telegraphAt(0, 0, cues, 2.9999, opts).next!.progress).toBeCloseTo(1, 3);
  });

  it('starts the next wind-up only after the previous outcome plays out', () => {
    const t = telegraphAt(0, 0, cues, 3.1, opts);
    expect(t.last).toMatchObject({ action: 'block' });
    expect(t.last!.age).toBeCloseTo(0.1);
    expect(t.next).toMatchObject({ action: 'slash', progress: 0 });
    expect(telegraphAt(0, 0, cues, 3.325, opts).next!.progress).toBeCloseTo(0.5);
  });

  it('has no next cue after the encounter ends', () => {
    const t = telegraphAt(0, 0, cues, 7, opts);
    expect(t.next).toBeNull();
    expect(t.last).toMatchObject({ action: 'flourish' });
  });
});
