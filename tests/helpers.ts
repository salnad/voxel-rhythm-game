import { buildChart } from '../src/chart/build';
import type { ChartCombo, ChartEncounter, ChartNote } from '../src/chart/types';
import { validateChart } from '../src/chart/validate';
import { GameSession } from '../src/game/session';
import { AutoPlayer, type LaneInput } from '../src/rhythm/input';

/** A v3 chart at 60 BPM (beat == second), offset 0. */
export function chartFrom(
  notes: ChartNote[],
  extra: { encounters?: ChartEncounter[]; combos?: ChartCombo[] } = {},
) {
  const r = validateChart({
    format: 'voxel-rhythm-chart',
    version: 3,
    meta: { title: 't' },
    audio: { procedural: 'x' },
    timing: { bpm: 60, offsetMs: 0 },
    ...extra,
    notes,
  });
  if (!r.ok) throw new Error(r.errors.join('\n'));
  return buildChart(r.chart);
}

export const LANE = { block: 0, slash: 1, stab: 2, flourish: 3 } as const;

export const tap = (action: keyof typeof LANE, time: number): LaneInput[] => [
  { lane: LANE[action], down: true, time },
  { lane: LANE[action], down: false, time: time + 0.05 },
];

/** Step a session in small increments, feeding scripted inputs and/or an autoplayer. */
export function simulate(
  s: GameSession,
  inputs: LaneInput[],
  until: number,
  auto?: AutoPlayer,
  dt = 0.02,
) {
  if (auto) {
    s.bus.on('cues', (c) => auto.onCues(c));
    s.bus.on('cuesDropped', (ids) => auto.onDropped(ids));
  }
  const queue = [...inputs].sort((a, b) => a.time - b.time);
  for (let t = -1; t <= until + 1e-9; t += dt) {
    const due: LaneInput[] = [];
    while (queue.length && queue[0]!.time <= t) due.push(queue.shift()!);
    if (auto) due.push(...auto.due(t));
    due.sort((a, b) => a.time - b.time);
    s.step(due, t);
  }
}
