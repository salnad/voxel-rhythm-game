/**
 * On-disk chart format (version 1). See docs/map-format.md and schema/chart.schema.json.
 * Everything a human or LLM writes lives here; runtime types are derived in build.ts.
 */
export const CHART_FORMAT_ID = 'voxel-rhythm-chart';
export const CHART_FORMAT_VERSION = 1;

export interface ChartMeta {
  title: string;
  artist?: string;
  charter?: string;
  difficulty?: string;
  description?: string;
}

export interface ChartAudio {
  /** Audio file path, relative to the chart file (e.g. "song.mp3"). */
  file?: string;
  /** Name of a built-in procedural song (e.g. "hyperpop-demo"). */
  procedural?: string;
  /** Optional song length in beats; used for progress display and warnings. */
  lengthBeats?: number;
}

export interface BpmChange {
  beat: number;
  bpm: number;
}

export interface ChartTiming {
  bpm: number;
  /** Milliseconds into the audio where beat 0 lands. */
  offsetMs: number;
  beatsPerBar?: number;
  bpmChanges?: BpmChange[];
}

export interface ChartNote {
  beat: number;
  lane: string;
  /** Hold length in beats. Omit (or 0) for a tap note. */
  length?: number;
}

export interface ChartFile {
  format: typeof CHART_FORMAT_ID;
  version: typeof CHART_FORMAT_VERSION;
  meta: ChartMeta;
  audio: ChartAudio;
  timing: ChartTiming;
  lanes: string[];
  notes: ChartNote[];
}

/** Runtime note with absolute times (seconds into the audio file). */
export interface Note {
  id: number;
  lane: number;
  laneName: string;
  beat: number;
  time: number;
  /** For holds: end beat/time. null for taps. */
  endBeat: number | null;
  endTime: number | null;
}
