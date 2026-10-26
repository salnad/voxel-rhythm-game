import { TempoMap } from './tempo';
import { DEFAULT_COMBO_RETRIES } from './validate';
import {
  ACTIONS,
  ENEMY_KINDS,
  type Bar,
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
  /** Every measure from 0 to the end of the song (or 1 bar past the last note). */
  bars: Bar[];
  tempo: TempoMap;
  beatsPerBar: number;
  /** Chart time (s) the last note ends. */
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
  const bpb = file.timing.beatsPerBar ?? 4;
  const barOf = (beat: number) => Math.floor(beat / bpb + 1e-9);
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
        bar: barOf(n.beat),
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
  const lastBeat = notes.reduce((m, n) => Math.max(m, n.endBeat ?? n.beat), 0);
  const barCount = Math.max(barOf(lastBeat) + 2, Math.ceil((file.audio.lengthBeats ?? 0) / bpb));
  const comboOf = (bar: number) => {
    const c = (file.combos ?? []).find((r) => bar >= r.fromBar && bar <= (r.toBar ?? r.fromBar));
    return c ? { retries: c.retries ?? DEFAULT_COMBO_RETRIES } : null;
  };
  const bars: Bar[] = [];
  for (let i = 0; i < barCount; i++) {
    const startBeat = i * bpb;
    const startSec = tempo.beatToSec(startBeat);
    const noteIds = notes.filter((n) => n.bar === i).map((n) => n.id);
    bars.push({
      index: i,
      startBeat,
      startSec,
      durSec: tempo.beatToSec(startBeat + bpb) - startSec,
      noteIds,
      combo: noteIds.length > 0 ? comboOf(i) : null,
    });
  }
  return {
    file,
    lanes: ACTIONS,
    notes,
    encounters,
    prompts,
    bars,
    tempo,
    beatsPerBar: bpb,
    lastNoteTime,
  };
}
