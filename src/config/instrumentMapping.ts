/**
 * Variant A: each move plays an instrument. Swap parts, miss behaviour or accents here.
 *
 * - `part`: the music stem the action performs (demo stems: k808, lead, perc, vox, backing).
 * - `onMiss`: what a missed cue does to that part. "mute" stutters then drops it out;
 *   "glitch" chops it, filters it down and crunches it.
 * - `accent`: the one-shot the hero's move plays on a hit, in the part's voice.
 * The part comes back on that action's next cue (or after `maxMuteBars`).
 */
import type { Action } from '../chart/types';

export type MissMode = 'mute' | 'glitch';
export type AccentKind = 'boom808' | 'leadPluck' | 'hatRoll' | 'vocalChop';

export interface InstrumentBinding {
  part: string;
  onMiss: MissMode;
  accent: AccentKind;
}

export const INSTRUMENT_BINDINGS: Record<Action, InstrumentBinding> = {
  block: { part: 'k808', onMiss: 'mute', accent: 'boom808' },
  slash: { part: 'lead', onMiss: 'glitch', accent: 'leadPluck' },
  stab: { part: 'perc', onMiss: 'mute', accent: 'hatRoll' },
  flourish: { part: 'vox', onMiss: 'glitch', accent: 'vocalChop' },
};

export const INSTRUMENT_TUNING = {
  /** A missed part stays out at most this many measures if its action has no cue sooner. */
  maxMuteBars: 2,
  /** Stutter length right after a miss (s). */
  stutterSeconds: 0.16,
  /** Glitched parts are low-passed to this (Hz) and crushed this much (0..1). */
  glitchFilterHz: 900,
  glitchCrush: 0.8,
  glitchLevel: 0.35,
  /** Accent one-shot level. */
  accentLevel: 0.55,
  /** The song's lead is voiced live by the player's wavetable patch (else the rendered stem plays). */
  liveLead: true,
};
