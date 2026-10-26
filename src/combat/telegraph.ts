import type { Chart } from '../chart/build';
import type { Action } from '../chart/types';

export interface TelegraphOptions {
  /** Longest wind-up before a cue (s). */
  lead: number;
  /** Time after a cue that its outcome animation owns the enemy (s). */
  resolve: number;
  /** Seconds the enemy spends walking in. */
  walkIn: number;
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
 * What the enemy is doing at song time t, so each cue on the highway has a matching
 * telegraph: the wind-up for cue n starts after cue n-1's outcome has played out (or after
 * the walk-in), at most `lead` seconds early, and peaks exactly on the cue's time.
 */
export function telegraphAt(chart: Chart, t: number, o: TelegraphOptions): Telegraph {
  let enc: number | null = null;
  for (const e of chart.encounters) if (e.startTime <= t) enc = e.index;
  if (enc === null) return { encounter: null, enterAge: 0, next: null, last: null };
  const encounter = chart.encounters[enc]!;
  const ids = encounter.noteIds;

  let lastIdx = -1;
  for (let i = 0; i < ids.length; i++) {
    if (chart.notes[ids[i]!]!.time <= t) lastIdx = i;
    else break;
  }
  const lastNote = lastIdx >= 0 ? chart.notes[ids[lastIdx]!]! : null;
  const nextNote = lastIdx + 1 < ids.length ? chart.notes[ids[lastIdx + 1]!]! : null;

  let next: Telegraph['next'] = null;
  if (nextNote) {
    const after = lastNote
      ? (lastNote.endTime ?? lastNote.time) + o.resolve
      : encounter.startTime + o.walkIn;
    const start = Math.max(after, nextNote.time - o.lead);
    const span = nextNote.time - start;
    const progress = span <= 1e-6 ? 1 : Math.min(1, Math.max(0, (t - start) / span));
    next = { noteId: nextNote.id, action: nextNote.action, time: nextNote.time, progress };
  }
  return {
    encounter: enc,
    enterAge: t - encounter.startTime,
    next,
    last: lastNote
      ? { noteId: lastNote.id, action: lastNote.action, age: t - lastNote.time }
      : null,
  };
}
