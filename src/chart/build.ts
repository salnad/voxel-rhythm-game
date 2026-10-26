import { TempoMap } from './tempo';
import {
  ACTIONS,
  ENEMY_KINDS,
  type ChartEncounter,
  type ChartFile,
  type Encounter,
  type Note,
  type Prompt,
} from './types';

/** Default prompt duration in beats. */
export const PROMPT_BEATS = 8;

/** A validated chart with absolute times, ready for play. */
export interface Chart {
  file: ChartFile;
  /** Always ACTIONS; one lane per action. */
  lanes: readonly string[];
  notes: Note[];
  encounters: Encounter[];
  prompts: Prompt[];
  tempo: TempoMap;
  beatsPerBar: number;
  /** Time (s) the last note ends. */
  lastNoteTime: number;
}

/**
 * Encounter starts for a chart. Explicit `encounters` win; otherwise a new enemy walks in
 * right after every flourish (except the last note).
 */
export function encounterStarts(file: ChartFile): ChartEncounter[] {
  if (file.encounters && file.encounters.length > 0) return file.encounters;
  const out: ChartEncounter[] = [{ beat: Math.min(0, file.notes[0]?.beat ?? 0) }];
  file.notes.forEach((n, i) => {
    if (n.action === 'flourish' && i < file.notes.length - 1) {
      out.push({ beat: n.beat + (n.length ?? 0) + 1 / 96 });
    }
  });
  return out;
}

export function buildChart(file: ChartFile): Chart {
  const tempo = new TempoMap(file.timing.bpm, file.timing.offsetMs, file.timing.bpmChanges ?? []);
  const starts = encounterStarts(file);
  const encounterOf = (beat: number) => {
    let k = 0;
    for (let i = 0; i < starts.length; i++) if (starts[i]!.beat <= beat + 1e-9) k = i;
    return k;
  };
  const notes: Note[] = file.notes
    .map((n) => {
      const endBeat = n.length && n.length > 0 ? n.beat + n.length : null;
      return {
        id: 0,
        lane: ACTIONS.indexOf(n.action),
        action: n.action,
        beat: n.beat,
        time: tempo.beatToSec(n.beat),
        endBeat,
        endTime: endBeat === null ? null : tempo.beatToSec(endBeat),
        encounter: encounterOf(n.beat),
      };
    })
    .sort((a, b) => a.time - b.time || a.lane - b.lane);
  notes.forEach((n, i) => (n.id = i));

  // Drop encounters that ended up empty (only possible with auto encounters) and renumber.
  const used = starts
    .map((s, i) => ({ s, ids: notes.filter((n) => n.encounter === i).map((n) => n.id) }))
    .filter((e) => e.ids.length > 0);
  const encounters: Encounter[] = used.map(({ s, ids }, index) => {
    const enemy = s.enemy ?? ENEMY_KINDS[index % ENEMY_KINDS.length]!;
    for (const id of ids) notes[id]!.encounter = index;
    return {
      index,
      enemy,
      name: s.name ?? enemy.toUpperCase(),
      startBeat: s.beat,
      startTime: tempo.beatToSec(s.beat),
      noteIds: ids,
    };
  });

  const prompts: Prompt[] = (file.prompts ?? [])
    .map((p) => ({
      text: p.text,
      action: p.action ?? null,
      time: tempo.beatToSec(p.beat),
      endTime: tempo.beatToSec(p.beat + (p.beats ?? PROMPT_BEATS)),
    }))
    .sort((a, b) => a.time - b.time);

  const lastNoteTime = notes.reduce((m, n) => Math.max(m, n.endTime ?? n.time), 0);
  return {
    file,
    lanes: ACTIONS,
    notes,
    encounters,
    prompts,
    tempo,
    beatsPerBar: file.timing.beatsPerBar ?? 4,
    lastNoteTime,
  };
}
