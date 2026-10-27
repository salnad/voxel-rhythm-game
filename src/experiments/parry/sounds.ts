import type { OneShots } from '../melee/synth';
import type { DirectionSpec } from './logic';

/** Instant press feedback: a short blade swish toward that side. */
export function swish(s: OneShots, d: DirectionSpec, at: number): void {
  s.noiseBurst(at, 'bandpass', 2400, 900, 0.09, 0.07, d.pan * 0.7, 1.5);
}

/** A deflect: a big, ringing clang pitched and panned by direction. */
export function clang(s: OneShots, d: DirectionSpec, perfect: boolean, at: number): void {
  const g = perfect ? 0.2 : 0.15;
  s.metal(at, d.pitch, g, perfect ? 0.55 : 0.4, d.pan);
  s.metal(at, d.pitch * 1.5, g * 0.35, 0.25, d.pan);
  s.tone(at, 'square', d.pitch * 0.5, d.pitch * 0.35, g * 0.35, 0.05, d.pan);
  s.noiseBurst(at, 'bandpass', 3800, 1800, g * 1.6, 0.06, d.pan, 2);
  if (perfect) s.noiseBurst(at + 0.01, 'highpass', 7000, 11000, 0.07, 0.3, d.pan, 0.7, 0.01);
}

/** Struck: a dull, panned body blow. */
export function struck(s: OneShots, d: DirectionSpec, at: number): void {
  s.tone(at, 'sine', 150, 45, 0.5, 0.28, d.pan * 0.8);
  s.noiseBurst(at, 'lowpass', 1800, 200, 0.45, 0.2, d.pan * 0.8, 0.8);
  s.tone(at, 'square', 90, 60, 0.08, 0.12, d.pan * 0.8);
}

/** Posture filled: a rising, tense ring. */
export function postureBreak(s: OneShots, at: number): void {
  s.tone(at, 'sawtooth', 220, 880, 0.05, 0.35, 0, 0.05);
  s.metal(at + 0.02, 1760, 0.08, 0.6);
}

/** The finisher. A deathblow (full posture) lands much heavier than a riposte. */
export function finisher(s: OneShots, deathblow: boolean, at: number): void {
  s.tone(at, 'sine', deathblow ? 90 : 140, 30, deathblow ? 0.7 : 0.45, deathblow ? 0.7 : 0.4);
  s.noiseBurst(at, 'bandpass', 900, 7000, deathblow ? 0.35 : 0.2, 0.28, 0, 1.4, 0.01);
  s.metal(at, deathblow ? 1175 : 1480, deathblow ? 0.16 : 0.1, deathblow ? 1.1 : 0.6);
  if (deathblow) s.metal(at + 0.06, 2349, 0.07, 0.9);
}
