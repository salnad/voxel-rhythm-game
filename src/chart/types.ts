/**
 * On-disk chart format (version 2). See docs/map-format.md and schema/chart.schema.json.
 * Everything a human or LLM writes lives here; runtime types are derived in build.ts.
 */
export const CHART_FORMAT_ID = 'voxel-rhythm-chart';
export const CHART_FORMAT_VERSION = 2;

/** The four sword actions, left to right. Each is one lane and one key. */
export const ACTIONS = ['block', 'slash', 'stab', 'flourish'] as const;
export type Action = (typeof ACTIONS)[number];

export const ENEMY_KINDS = ['grunt', 'duelist', 'brute', 'knight'] as const;
export type EnemyKind = (typeof ENEMY_KINDS)[number];

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
  /** Optional song length in beats; used for warnings. */
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
  action: Action;
  /** Hold length in beats. Omit (or 0) for a tap note. */
  length?: number;
}

/** One enemy. It walks in at `beat` and duels until the next encounter starts. */
export interface ChartEncounter {
  beat: number;
  enemy?: EnemyKind;
  name?: string;
}

/** On-screen tutorial text. */
export interface ChartPrompt {
  beat: number;
  text: string;
  /** Highlights this action's lane, icon and key next to the text. */
  action?: Action;
  /** How long it stays up, in beats. Default 8. */
  beats?: number;
}

export interface ChartFile {
  format: typeof CHART_FORMAT_ID;
  version: typeof CHART_FORMAT_VERSION;
  meta: ChartMeta;
  audio: ChartAudio;
  timing: ChartTiming;
  /** Optional. When omitted, a new enemy starts right after every flourish. */
  encounters?: ChartEncounter[];
  prompts?: ChartPrompt[];
  notes: ChartNote[];
}

/** Runtime note with absolute times (seconds into the audio file). */
export interface Note {
  id: number;
  /** Lane index = index into ACTIONS. */
  lane: number;
  action: Action;
  beat: number;
  time: number;
  /** For holds: end beat/time. null for taps. */
  endBeat: number | null;
  endTime: number | null;
  /** Index of the encounter (enemy) this note belongs to. */
  encounter: number;
}

export interface Encounter {
  index: number;
  enemy: EnemyKind;
  name: string;
  startBeat: number;
  startTime: number;
  /** Note ids in time order. Never empty. */
  noteIds: number[];
}

export interface Prompt {
  text: string;
  action: Action | null;
  time: number;
  endTime: number;
}
