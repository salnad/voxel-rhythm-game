/**
 * Tuning for the PRODUCER FX action → music mapping (src/audio/fx/): each move is a
 * mix-wide production effect on the song instead of an instrument. Times in seconds unless
 * the name says beats.
 *
 * Measured with `node scripts/fx-audit/run.mjs` (see the README): each effect has to change
 * the 200 Hz - 8 kHz band laptop speakers play by more than 3 dB for long enough to read as
 * the player's move, over a song that already pumps on its own kicks.
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
  great: 0.85,
  good: 0.7,
  miss: 0,
};

/**
 * A hit's effect is locked to the cue's beat, but the press is only heard (and handled) a
 * little after it. A late start slams the attack in at the press, then squeezes the rest so the
 * release still lands where it would have; past this much tail it just plays late.
 */
export const JOIN = { minTailBeats: 0.35 };

/** BLOCK: sidechain-style duck of the whole mix, recovering across the beat. */
export const PUMP = {
  /** Gain reduction at amount 1 (0.9 = -20 dB). */
  depth: 0.9,
  /** Pump-exempt stems (the 808) duck this much once their transient is through. */
  exemptDepth: 0.65,
  /** The duck starts this long after the cue, so the kick transient gets through. */
  attackDelay: 0.03,
  attack: 0.012,
  /** Time held at the bottom before the recovery. */
  hold: 0.07,
  /** Recovery back to full level, in beats after the cue. */
  recoverBeats: 1,
  /** Recovery curve exponent: > 1 stays down longer, the audible "suck" of a sidechain. */
  curve: 2.2,
  /** A held block holds the duck at this fraction of `depth` until release. */
  holdFraction: 0.75,
  /** Stems that trigger the pump rather than duck under it (when the map has them). */
  exempt: ['k808'] as readonly string[],
};

/** SLASH: resonant low-pass slammed shut on the cue, then swept open. */
export const SWEEP = {
  /** Cutoff on the cue at amount 1; weaker hits start higher. */
  lowHz: 200,
  openHz: 18000,
  /** Time held fully shut before the sweep opens. */
  hold: 0.06,
  /** Sweep length in beats. */
  beats: 1.5,
  /** Sweep curve exponent: > 1 stays dark longer before opening. */
  curve: 1.8,
  q: 14,
};

/** STAB: beat-repeat of the slice right after the cue, locked to the 1/16 grid. */
export const STUTTER = {
  /** Slice length in beats (1/16 note). */
  sliceBeats: 0.25,
  /** Fraction of each slice the gate is open (the rest is the chop). */
  duty: 0.7,
  /** Level of the repeats. */
  gain: 1,
  /** Repeats (slice lengths, in beats) per judgement: a roll that accelerates into the beat. */
  pattern: {
    perfect: [0.25, 0.25, 0.125, 0.125, 0.0625, 0.0625, 0.0625, 0.0625],
    great: [0.25, 0.25, 0.125, 0.125],
    good: [0.25, 0.25, 0.25],
  } as Record<Exclude<Judgement, 'miss'>, readonly number[]>,
  /** Low-pass on the repeats opens across the roll (Hz). */
  toneFrom: 2200,
  toneTo: 18000,
};

/** FLOURISH: whole-mix pitch riser into the next bar line, plus a noise riser. */
export const LIFT = {
  /** Pitch at the bar line at amount 1 (semitones). */
  semis: 12,
  /** Pitch-shifter grain window (s). */
  windowSec: 0.05,
  /** Wet level at the bar line. */
  wet: 1,
  /** Dry level at the bar line (the unshifted mix fades out under the riser). */
  dryFloor: 0,
  riserGain: 0.3,
  /** High-pass that thins the mix into the bar line (Hz at the top). */
  hpHz: 650,
  /** Silence just before the bar line, so the drop snaps back in (beats). */
  gapBeats: 0.25,
  /** A flourish with less than this many beats to the bar line rises into the next one. */
  minBeats: 1,
};

/**
 * What the player sees for each effect (src/render/fxFeedback.ts). `intensity` scales all of
 * it; 0 turns the visuals off and leaves the FX RACK readout.
 */
export const FX_VISUALS = {
  intensity: 1,
  /** BLOCK: the arena and highway shrink and dim with the duck. */
  pump: { scale: 0.06, dim: 0.5 },
  /** SLASH: the arena blurs, drains of colour and an iris closes with the cutoff. */
  sweep: { blurPx: 3, desaturate: 0.85, iris: 0.75 },
  /** STAB: the frame at the start of the roll repeats on every open slice, jittered. */
  stutter: { jitterPx: 10, freezeOpacity: 0.55 },
  /** FLOURISH: the camera lifts, brightens and glows gold with the pitch; a flash on the snap. */
  lift: { risePx: 28, zoom: 0.06, bright: 0.5, tint: 0.3, flash: 0.75 },
  /** How long the FX RACK keeps a trigger's judgement lit (s). */
  rackFlash: 0.6,
};
