import { TempoMap } from './tempo';
import type { ChartFile, Note } from './types';

/** A validated chart with absolute note times, ready for play. */
export interface Chart {
  file: ChartFile;
  lanes: string[];
  notes: Note[];
  tempo: TempoMap;
  beatsPerBar: number;
  /** Time (s) the last note ends. */
  lastNoteTime: number;
}

export function buildChart(file: ChartFile): Chart {
  const tempo = new TempoMap(file.timing.bpm, file.timing.offsetMs, file.timing.bpmChanges ?? []);
  const laneIndex = new Map(file.lanes.map((l, i) => [l, i]));
  const notes: Note[] = file.notes
    .map((n, i) => {
      const lane = laneIndex.get(n.lane);
      if (lane === undefined) throw new Error(`notes[${i}].lane "${n.lane}" is not a lane`);
      const endBeat = n.length && n.length > 0 ? n.beat + n.length : null;
      return {
        id: 0,
        lane,
        laneName: n.lane,
        beat: n.beat,
        time: tempo.beatToSec(n.beat),
        endBeat,
        endTime: endBeat === null ? null : tempo.beatToSec(endBeat),
      };
    })
    .sort((a, b) => a.time - b.time || a.lane - b.lane);
  notes.forEach((n, i) => (n.id = i));
  const lastNoteTime = notes.reduce((m, n) => Math.max(m, n.endTime ?? n.time), 0);
  return {
    file,
    lanes: [...file.lanes],
    notes,
    tempo,
    beatsPerBar: file.timing.beatsPerBar ?? 4,
    lastNoteTime,
  };
}
