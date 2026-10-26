/**
 * Gameplay tuning. Everything a designer is likely to tweak between playtests lives in
 * src/config/*. Logic modules take these values as inputs; nothing here is imported for
 * side effects.
 */
import type { Judgement } from '../rhythm/judge';

export interface JudgementWindows {
  /** Half-widths in seconds. A press within ±perfect is PERFECT, etc. */
  perfect: number;
  great: number;
  good: number;
  /** Early presses within this window (but outside good) count as a MISS instead of a ghost tap. */
  miss: number;
}

export const JUDGEMENT_WINDOWS: JudgementWindows = {
  perfect: 0.04,
  great: 0.075,
  good: 0.115,
  miss: 0.16,
};

/** Accuracy weight per judgement (0..1). */
export const ACCURACY_WEIGHT: Record<Judgement, number> = {
  perfect: 1,
  great: 0.7,
  good: 0.35,
  miss: 0,
};

export const SCORE_PER_JUDGEMENT: Record<Judgement, number> = {
  perfect: 300,
  great: 200,
  good: 100,
  miss: 0,
};

/** Combo multiplier steps: combo >= threshold → multiplier. */
export const COMBO_MULTIPLIERS: ReadonlyArray<[number, number]> = [
  [0, 1],
  [10, 1.5],
  [25, 2],
  [50, 3],
  [100, 4],
];

export const PLAYER = {
  maxHp: 100,
  /** HP restored per judgement. */
  heal: { perfect: 1.5, great: 0.75, good: 0, miss: 0 } as Record<Judgement, number>,
  /** HP lost to a missed block, before the enemy's damage multiplier. */
  missDamage: 8,
  /** Seconds of invulnerability flashing after a hit (visual only for now). */
  hurtFlash: 0.35,
};

/** Duel timing. The enemy's telegraph for a cue builds up over the last `telegraphLead` s. */
export const DUEL = {
  /** Longest wind-up before a cue (s). Shorter when cues are closer together. */
  telegraphLead: 0.7,
  /** Time after a cue that its outcome animation owns the enemy (s). */
  resolveTime: 0.14,
  /** Beats an enemy takes to walk in at the start of its encounter. */
  walkInBeats: 1,
};

/** Seconds a cue takes to travel the highway at note speed 1.0. */
export const APPROACH_SECONDS = 1.6;

export const AUTOPLAY = {
  /** Std-dev of autoplay timing error, seconds. */
  jitter: 0.018,
  /** Fraction of notes autoplay deliberately skips (to show misses in demos). */
  missRate: 0.06,
  seed: 1337,
};

/** The wonky measure after a failed combo (digicore-style glitch). */
export const WONKY = {
  /** Bitcrush wet level 0..1. */
  crush: 0.85,
  /** Low-pass sweeps down to this by the end of the measure. */
  filterHz: 1600,
  /** Pitch wobble depth (cents) and rate (Hz). */
  wobbleCents: 70,
  wobbleHz: 7,
  /** Tape-stop over the last this-many seconds of the measure, dropping this many cents. */
  tapeStop: 0.35,
  tapeStopCents: 1800,
  /** 1/32 stutter-gate right after the miss (s). */
  stutterSeconds: 0.3,
};
