/**
 * Pure timing for the audio-first experiments (keysound, call-response, by-ear): when a hit's
 * keysound starts, the by-ear count-ins, the teaching fade and the hit-punch envelope.
 */
import type { Action } from '../../chart/types';
import type { Judgement } from '../../rhythm/judge';

export interface KeysoundStart {
  /** Context time to start the one-shot. */
  when: number;
  gain: number;
  /** High-shelf boost (dB) above 2.5 kHz: PERFECT hits are brighter. */
  shelfDb: number;
  /** Low-pass cutoff (Hz): GOOD hits are duller. */
  lowpassHz: number;
}

/** Below this (s) a start in the future is treated as "now". */
const START_SLOP = 0.003;

/**
 * When and how a hit's keysound plays. The note belongs on the beat: an early press waits for
 * `target` (the cue's context time), a late press plays at once (`now`). PERFECT is a touch
 * louder and brighter, GOOD softer and duller, so accuracy is audible.
 */
export function keysoundStart(target: number, now: number, j: Judgement): KeysoundStart {
  const when = target - now > START_SLOP ? target : now;
  switch (j) {
    case 'perfect':
      return { when, gain: 0.92, shelfDb: 3, lowpassHz: 20000 };
    case 'great':
      return { when, gain: 0.85, shelfDb: 0, lowpassHz: 20000 };
    default:
      return { when, gain: 0.68, shelfDb: -2, lowpassHz: 4200 };
  }
}

export type CountInKind = 'hup' | 'whoosh' | 'tick' | 'three' | 'two';

export interface CountInEvent {
  kind: CountInKind;
  /** Game time the sound starts. */
  time: number;
  /** Seconds (the whoosh rises over this and cuts on the cue). */
  dur: number;
  /** 0-based step within the count-in (tick 1 / tick 2). */
  step: number;
}

/** Beats of lead each action's count-in starts before its cue. */
export const COUNT_IN_LEAD_BEATS: Record<Action, number> = {
  block: 1,
  slash: 1,
  stab: 1,
  flourish: 2,
};

/**
 * Each action's audio count-in before a cue at `cueTime` (spb = seconds per beat):
 * BLOCK a heavy "hup!" one beat before, SLASH a whoosh rising over the beat and cutting on the
 * cue, STAB two ticks on the two eighths before, FLOURISH a vocal "three, two" on the two
 * beats before.
 */
export function countInPlan(action: Action, cueTime: number, spb: number): CountInEvent[] {
  switch (action) {
    case 'block':
      return [{ kind: 'hup', time: cueTime - spb, dur: spb * 0.4, step: 0 }];
    case 'slash':
      return [{ kind: 'whoosh', time: cueTime - spb, dur: spb, step: 0 }];
    case 'stab':
      return [
        { kind: 'tick', time: cueTime - spb, dur: 0.06, step: 0 },
        { kind: 'tick', time: cueTime - spb / 2, dur: 0.06, step: 1 },
      ];
    case 'flourish':
      return [
        { kind: 'three', time: cueTime - 2 * spb, dur: spb * 0.6, step: 0 },
        { kind: 'two', time: cueTime - spb, dur: spb * 0.6, step: 1 },
      ];
  }
}

/**
 * Teaching-phase visibility of the by-ear icons at song beat `beat`: fully shown until
 * `fullUntil`, then fading linearly to nothing over `fadeBeats`.
 */
export function teachAlpha(beat: number, fullUntil: number, fadeBeats: number): number {
  if (beat <= fullUntil) return 1;
  return Math.max(0, 1 - (beat - fullUntil) / Math.max(1e-6, fadeBeats));
}

/** Hit punch (camera kick, flash): 0 before `age` 0, a 15 ms attack, then a fast decay. */
export function punchEnvelope(age: number): number {
  if (age < 0) return 0;
  if (age < 0.015) return age / 0.015;
  return Math.exp(-(age - 0.015) / 0.07);
}

/**
 * The enemy's performance of one call note at `age` seconds from the note: a short wind-up
 * that peaks exactly on the note, then a slower release. 0 outside [-windup, release].
 */
export function performEnvelope(age: number, windup = 0.12, release = 0.32): number {
  if (age < -windup || age > release) return 0;
  if (age <= 0) {
    const k = 1 + age / windup;
    return k * k;
  }
  const k = 1 - age / release;
  return k * k * (3 - 2 * k);
}
