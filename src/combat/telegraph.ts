import type { Action } from '../chart/types';

export interface TelegraphOptions {
  /** Longest wind-up before a cue (s). */
  lead: number;
  /** Time after a cue that its outcome animation owns the enemy (s). */
  resolve: number;
  /** Seconds the enemy spends walking in. */
  walkIn: number;
}

export interface TelegraphCue {
  id: number;
  action: Action;
  time: number;
  endTime: number | null;
}

export interface Telegraph {
  /** Enemy on stage, or null before the first walks in. */
  encounter: number | null;
  /** Seconds since that enemy started walking in. */
  enterAge: number;
  /** The cue the enemy is winding up for, with wind-up progress 0..1 (1 = on the beat). */
  next: { noteId: number; action: Action; time: number; progress: number } | null;
  /** The most recent cue at or before now, and how long ago it was. */
  last: { noteId: number; action: Action; age: number } | null;
}

/**
 * What the enemy is doing at game time t, so each cue on the highway has a matching
 * telegraph: the wind-up for cue n starts after cue n-1's outcome has played out (or after
 * the walk-in), at most `lead` seconds early, and peaks exactly on the cue's time.
 * `cues` are the active encounter's live cues (voided and re-planned ones left out), by time.
 */
export function telegraphAt(
  encounter: number | null,
  encounterStart: number,
  cues: readonly TelegraphCue[],
  t: number,
  o: TelegraphOptions,
): Telegraph {
  if (encounter === null) return { encounter: null, enterAge: 0, next: null, last: null };
  let lastIdx = -1;
  for (let i = 0; i < cues.length; i++) {
    if (cues[i]!.time <= t) lastIdx = i;
    else break;
  }
  const lastCue = lastIdx >= 0 ? cues[lastIdx]! : null;
  const nextCue = cues[lastIdx + 1] ?? null;

  let next: Telegraph['next'] = null;
  if (nextCue) {
    const after = lastCue
      ? (lastCue.endTime ?? lastCue.time) + o.resolve
      : encounterStart + o.walkIn;
    const start = Math.max(after, nextCue.time - o.lead);
    const span = nextCue.time - start;
    const progress = span <= 1e-6 ? 1 : Math.min(1, Math.max(0, (t - start) / span));
    next = { noteId: nextCue.id, action: nextCue.action, time: nextCue.time, progress };
  }
  return {
    encounter,
    enterAge: t - encounterStart,
    next,
    last: lastCue ? { noteId: lastCue.id, action: lastCue.action, age: t - lastCue.time } : null,
  };
}
