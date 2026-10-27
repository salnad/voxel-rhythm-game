/** Beat-phase helpers for on-beat visuals. Pure. */

/** 1 exactly on a beat, decaying to 0 before the next (`sharp` = how fast). */
export function beatPulse(beat: number, sharp = 3): number {
  if (!Number.isFinite(beat)) return 0;
  const phase = beat - Math.floor(beat);
  return Math.pow(1 - phase, sharp);
}

/** 0 just after a beat, rising to 1 as the next beat arrives. */
export function beatApproach(beat: number): number {
  if (!Number.isFinite(beat)) return 0;
  return beat - Math.floor(beat);
}

/** The integer beat crossed going from `prev` to `beat`, or null. */
export function crossedBeat(prev: number, beat: number): number | null {
  if (!Number.isFinite(prev) || !Number.isFinite(beat) || beat <= prev) return null;
  const b = Math.floor(beat);
  return b > Math.floor(prev) ? b : null;
}
