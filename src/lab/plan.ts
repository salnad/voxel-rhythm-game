/**
 * Playtest Lab: a guided sequence of short experiment trials, each followed by quick ratings.
 * Pure data and logic (no DOM, no storage) so ordering and the results format are unit-tested.
 */
import { rng } from '../rhythm/input';

export const LAB_FORMAT = 'voxel-rhythm-lab';
export const LAB_VERSION = 1;

export const RATINGS = [
  { key: 'fun', label: 'FUN', ask: 'Did you enjoy it? Want another go?' },
  { key: 'control', label: 'CONTROL', ask: 'Did your presses feel responsive and fair?' },
  { key: 'read', label: 'READABILITY', ask: 'Could you tell what to press, and when?' },
  { key: 'music', label: 'MUSIC', ask: 'Did your actions feel connected to the music?' },
] as const;
export type RatingKey = (typeof RATINGS)[number]['key'];
export type Ratings = Record<RatingKey, number>;

/** Performance in one trial, from the session at the end of the run. */
export interface TrialStats {
  /** Accuracy 0..1 (rounded to 3 places in the export). */
  acc: number;
  perfect: number;
  great: number;
  good: number;
  miss: number;
  /** Mean hit offset in ms (positive = late). */
  offsetMs: number;
  hitsTaken: number;
  combosCleared: number;
  combosFailed: number;
  defeated: number;
  enemies: number;
}

export interface TrialResult {
  exp: string;
  ratings: Ratings;
  note: string;
  /** How many times the trial was played (replays allowed). */
  plays: number;
  /** Stats of the last play. */
  stats: TrialStats | null;
  /** ISO time the ratings were saved. */
  at: string;
}

export interface LabState {
  format: typeof LAB_FORMAT;
  v: typeof LAB_VERSION;
  seed: number;
  build: string;
  startedAt: string;
  /** Experiment keys in trial order. */
  order: string[];
  /** Index into `order` of the next trial to run. */
  index: number;
  trials: TrialResult[];
  /** Skipped experiment keys. */
  skipped: string[];
}

/**
 * Trial order: the anchor (baseline) first, so every rating has the same reference point, then
 * the rest in a seeded random order. A fresh seed per Lab run counterbalances order effects
 * (fatigue, learning the song) across runs.
 */
export function labOrder(keys: readonly string[], seed: number, anchor?: string): string[] {
  const rest = keys.filter((k) => k !== anchor);
  const r = rng(seed);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [rest[i], rest[j]] = [rest[j]!, rest[i]!];
  }
  return anchor && keys.includes(anchor) ? [anchor, ...rest] : rest;
}

export function newLabState(
  keys: readonly string[],
  seed: number,
  build: string,
  anchor?: string,
  now = new Date(),
): LabState {
  return {
    format: LAB_FORMAT,
    v: LAB_VERSION,
    seed,
    build,
    startedAt: now.toISOString(),
    order: labOrder(keys, seed, anchor),
    index: 0,
    trials: [],
    skipped: [],
  };
}

export function currentTrial(s: LabState): string | null {
  return s.order[s.index] ?? null;
}

export function isComplete(s: LabState): boolean {
  return s.index >= s.order.length;
}

/** Record ratings for the current trial and move on. Re-rating an experiment replaces it. */
export function recordTrial(s: LabState, t: TrialResult): LabState {
  return {
    ...s,
    index: s.index + 1,
    trials: [...s.trials.filter((x) => x.exp !== t.exp), t],
  };
}

export function skipTrial(s: LabState): LabState {
  const k = currentTrial(s);
  return { ...s, index: s.index + 1, skipped: k ? [...s.skipped, k] : s.skipped };
}

/** Restore a saved state, or null if it isn't a Lab state this version understands. */
export function parseLabState(raw: unknown): LabState | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Partial<LabState>;
  if (s.format !== LAB_FORMAT || s.v !== LAB_VERSION) return null;
  if (!Array.isArray(s.order) || !Array.isArray(s.trials) || typeof s.index !== 'number')
    return null;
  return { ...(s as LabState), skipped: Array.isArray(s.skipped) ? s.skipped : [] };
}

/** Mean of the four ratings. */
export function overall(r: Ratings): number {
  return RATINGS.reduce((sum, x) => sum + r[x.key], 0) / RATINGS.length;
}

/**
 * Compact JSON to paste back into chat: one line per trial, ratings as [fun, control, read,
 * music], the note, and the key stats.
 */
export function resultsJson(s: LabState): string {
  const head = {
    lab: LAB_FORMAT,
    v: LAB_VERSION,
    build: s.build,
    started: s.startedAt,
    seed: s.seed,
    order: s.order,
    ratings: 'fun,control,read,music (1-5)',
    ...(s.skipped.length ? { skipped: s.skipped } : {}),
  };
  const trials = s.order
    .map((k) => s.trials.find((t) => t.exp === k))
    .filter((t): t is TrialResult => !!t)
    .map((t) => {
      const st = t.stats;
      return JSON.stringify({
        exp: t.exp,
        r: RATINGS.map((x) => t.ratings[x.key]),
        ...(t.note ? { note: t.note } : {}),
        ...(t.plays > 1 ? { plays: t.plays } : {}),
        ...(st
          ? {
              acc: Math.round(st.acc * 1000) / 1000,
              pgom: [st.perfect, st.great, st.good, st.miss],
              off: Math.round(st.offsetMs),
              hits: st.hitsTaken,
              combo: [st.combosCleared, st.combosFailed],
              kills: `${st.defeated}/${st.enemies}`,
            }
          : {}),
      });
    });
  const headJson = JSON.stringify(head).slice(0, -1);
  return `${headJson},"trials":[\n${trials.join(',\n')}\n]}`;
}
