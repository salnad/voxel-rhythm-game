import { composeSong } from '../audio/demo/composition';
import { LAB_BPM, LAB_COMBOS, LAB_LENGTH_BEATS, LAB_SONG } from '../audio/demo/labSong';
import {
  ACTIONS,
  CHART_FORMAT_ID,
  CHART_FORMAT_VERSION,
  type ChartFile,
  type ChartNote,
} from './types';

export const LAB_SONG_NAME = 'lab-140';

/**
 * The shared Playtest Lab chart: every cue is an onset in LAB.EXE (808 = block, lead = slash,
 * snare/hats = stab, vocal chop + crash = flourish). Experiments start from this and transform
 * it (strip prompts, remap actions, add call phrases) so their trials stay comparable.
 */
export function buildLabChart(): ChartFile {
  const notes: ChartNote[] = [];
  for (const e of composeSong(LAB_SONG)) {
    if (!e.chart) continue;
    const n: ChartNote = { beat: e.beat, action: e.chart.action };
    if (e.chart.length) n.length = e.chart.length;
    notes.push(n);
  }
  notes.sort((a, b) => a.beat - b.beat || ACTIONS.indexOf(a.action) - ACTIONS.indexOf(b.action));
  return {
    format: CHART_FORMAT_ID,
    version: CHART_FORMAT_VERSION,
    meta: {
      title: 'LAB.EXE',
      artist: 'procedural (Web Audio)',
      charter: 'playtest lab generator',
      difficulty: 'lab',
      description: 'A 57 s test chart shared by the gameplay experiments.',
    },
    audio: { procedural: LAB_SONG_NAME, lengthBeats: LAB_LENGTH_BEATS },
    timing: { bpm: LAB_BPM, offsetMs: 0, beatsPerBar: 4 },
    encounters: [
      { beat: 0, enemy: 'grunt', name: 'GRUNT' },
      { beat: 8 * 4 + 1, enemy: 'duelist', name: 'DUELIST' },
      { beat: 16 * 4 + 1, enemy: 'knight', name: 'KNIGHT' },
      { beat: 22 * 4 + 1, enemy: 'brute', name: 'DAEMON' },
    ],
    prompts: [
      { beat: 17 * 4, text: 'BOSS COMBO: clear the whole measure or it repeats', beats: 4 },
    ],
    combos: LAB_COMBOS.map((c) => ({ ...c })),
    notes,
  };
}
