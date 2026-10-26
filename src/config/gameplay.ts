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
  /** HP lost when an enemy gets through, before modifiers. */
  missDamage: 7,
  /** Seconds of invulnerability flashing after a hit (visual only for now). */
  hurtFlash: 0.35,
};

/** Combat field geometry, in world units. Enemies are 1:1 with notes. */
export const FIELD = {
  /** Distance from the player at which an enemy is struck when its note is judged. */
  strikeRadius: 2.1,
  /** World units per second enemies move toward the player. */
  approachSpeed: 7.5,
  /** Enemies appear when farther than this would be needed (they fade in). */
  spawnDistance: 26,
  /** Lane tracks fan out over this angle (degrees) around the player's facing direction. */
  laneFanDegrees: 70,
};

export const AUTOPLAY = {
  /** Std-dev of autoplay timing error, seconds. */
  jitter: 0.018,
  /** Fraction of notes autoplay deliberately skips (to show misses in demos). */
  missRate: 0.06,
  seed: 1337,
};
