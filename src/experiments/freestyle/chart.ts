import { buildLabChart } from '../../chart/labChart';
import type { ChartFile, ChartNote } from '../../chart/types';

/** Bars whose downbeat block becomes an extra finisher, splitting the long Lab enemies in two. */
export const EXTRA_FINISHER_BARS = [12, 27] as const;

/**
 * The FREESTYLE chart: LAB.EXE with only the enemy's side charted. Every BLOCK stays (the
 * enemy's attacks on the 808); slashes and stabs are gone (you attack freely between); each
 * enemy ends on a FLOURISH finisher. Two extra finishers cut the Lab's four long fights into
 * six of three to six bars, and the boss combos and prompts are dropped.
 */
export function buildFreestyleChart(): ChartFile {
  const lab = buildLabChart();
  const bpb = lab.timing.beatsPerBar ?? 4;
  const extra = new Set<number>(EXTRA_FINISHER_BARS.map((b) => b * bpb));
  const notes: ChartNote[] = [];
  for (const n of lab.notes) {
    if (n.action === 'flourish') notes.push({ ...n });
    else if (n.action === 'block')
      notes.push(extra.has(n.beat) ? { beat: n.beat, action: 'flourish' } : { ...n });
  }
  return {
    ...lab,
    meta: {
      ...lab.meta,
      charter: 'freestyle transform of the lab chart',
      description: 'LAB.EXE with only the enemy attacks (blocks) and finishers charted.',
    },
    encounters: [
      { beat: 0, enemy: 'grunt', name: 'GRUNT' },
      { beat: 8 * bpb + 1, enemy: 'duelist', name: 'DUELIST' },
      { beat: 12 * bpb + 1, enemy: 'grunt', name: 'GRUNT MK2' },
      { beat: 16 * bpb + 1, enemy: 'knight', name: 'KNIGHT' },
      { beat: 22 * bpb + 1, enemy: 'brute', name: 'BRUTE' },
      { beat: 27 * bpb + 1, enemy: 'brute', name: 'DAEMON' },
    ],
    prompts: [],
    combos: [],
    notes,
  };
}
