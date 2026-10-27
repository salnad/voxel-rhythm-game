/**
 * Keysounds: the cue notes of a composition lifted out of the song so a player can play them.
 * `withoutCues` is what the stems keep; `cueGroups` is one sound per cue (its onset plus its
 * roll, chop phrase or crash), with beats relative to the cue, ready for `renderOneShots`.
 */
import type { CompEvent } from './composition';

/** The composition with every cue-sounding event removed (the backing the player plays over). */
export function withoutCues(events: readonly CompEvent[]): CompEvent[] {
  return events.filter((e) => e.cueBeat === undefined);
}

/** Every cue's events keyed by `beatKey(cue beat)`, re-based so the cue starts at beat 0. */
export function cueGroups(events: readonly CompEvent[]): Map<number, CompEvent[]> {
  const out = new Map<number, CompEvent[]>();
  for (const e of events) {
    if (e.cueBeat === undefined) continue;
    const k = beatKey(e.cueBeat);
    let g = out.get(k);
    if (!g) {
      g = [];
      out.set(k, g);
    }
    g.push({ ...e, beat: e.beat - e.cueBeat });
  }
  return out;
}

/** Integer map key for a song beat (cue beats sit on a 1/96 grid). */
export function beatKey(beat: number): number {
  return Math.round(beat * 96);
}
