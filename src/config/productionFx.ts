/**
 * Tuning for the PRODUCER FX action → music mapping (src/audio/fx/): each move is a
 * mix-wide production effect on the song instead of an instrument. Times in seconds unless
 * the name says beats.
 */
import type { Action } from '../chart/types';
import type { Judgement } from '../rhythm/judge';

export type FxKind = 'pump' | 'sweep' | 'stutter' | 'lift';

export const FX_FOR_ACTION: Record<Action, FxKind> = {
  block: 'pump',
  slash: 'sweep',
  stab: 'stutter',
  flourish: 'lift',
};

/** Effect depth per judgement (0..1). A miss plays the fumbled version instead. */
export const FX_AMOUNT: Record<Judgement, number> = {
  perfect: 1,
  great: 0.8,
  good: 0.6,
  miss: 0,
};

/** BLOCK: sidechain-style duck of the whole mix, recovering over the beat. */
export const PUMP = {
  /** Gain reduction at amount 1 (0.8 ≈ -14 dB). */
  depth: 0.8,
  /** The duck starts this long after the cue, so the kick transient gets through. */
  attackDelay: 0.035,
  attack: 0.02,
  /** Recovery back to full level, in beats after the cue. */
  recoverBeats: 0.9,
  /** A held block holds the duck at this fraction of `depth` until release. */
  holdFraction: 0.7,
  /** Stems that trigger the pump rather than duck under it (when the map has them). */
  exempt: ['k808'] as readonly string[],
};

/** SLASH: resonant low-pass slammed shut on the cue, then swept open. */
export const SWEEP = {
  /** Cutoff on the cue at amount 1; weaker hits start higher. */
  lowHz: 320,
  openHz: 20000,
  /** Sweep length in beats. */
  beats: 0.75,
  q: 9,
};

/** STAB: beat-repeat of the slice right after the cue, locked to the 1/16 grid. */
export const STUTTER = {
  /** Slice length in beats (1/16 note). */
  sliceBeats: 0.25,
  /** Fraction of each slice the gate is open (the rest is the chop). */
  duty: 0.8,
  /** Level of the repeats (the repeated snare stacks transients on an already hot mix). */
  gain: 0.85,
  /** Repeats (slice lengths, in beats) per judgement. */
  pattern: {
    perfect: [0.25, 0.25, 0.125, 0.125],
    great: [0.25, 0.25, 0.25],
    good: [0.25, 0.25],
  } as Record<Exclude<Judgement, 'miss'>, readonly number[]>,
};

/** FLOURISH: whole-mix pitch riser into the next bar line, plus a noise riser. */
export const LIFT = {
  /** Pitch at the bar line at amount 1 (semitones). */
  semis: 7,
  /** Pitch-shifter grain window (s). */
  windowSec: 0.05,
  /** Wet level at the bar line. */
  wet: 0.85,
  riserGain: 0.16,
  /** A flourish with less than this many beats to the bar line rises into the next one. */
  minBeats: 1,
};
