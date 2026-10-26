/**
 * The player's wavetable synth. Its parameters are the game's powerup system: each one
 * maps to a sword/attack modifier in modifiers.ts. Progression (unlocking parameters,
 * widening ranges, new wavetables) will hang off `ParamSpec.unlocked` / `max` later.
 */

export type WavetableName = 'basic-shapes';

export interface SynthPatch {
  wavetable: WavetableName;
  /** 0..1 morph across the table: sine → triangle → saw → square. */
  wtPosition: number;
  /** Unison voices, 1..7. */
  unison: number;
  /** Unison detune spread, 0..1. */
  detune: number;
  /** Filter cutoff 0..1 (normalized). */
  cutoff: number;
  /** Filter resonance 0..1. */
  resonance: number;
  lfoRate: number;
  lfoDepth: number;
  /** Amp envelope, seconds. */
  envAttack: number;
  envRelease: number;
}

export type PatchKey = Exclude<keyof SynthPatch, 'wavetable'>;

export interface ParamSpec {
  key: PatchKey;
  label: string;
  min: number;
  max: number;
  step: number;
  /** What the parameter does to your sword (shown in UI). */
  effect: string;
  /** Whether the effect is wired up in this build. */
  live: boolean;
  unlocked: boolean;
}

export const PARAM_SPECS: ParamSpec[] = [
  { key: 'wtPosition', label: 'WT POS', min: 0, max: 1, step: 0.01, effect: 'swing arc shape + trail', live: true, unlocked: true },
  { key: 'unison', label: 'UNISON', min: 1, max: 7, step: 1, effect: 'echo slashes + echo parry', live: true, unlocked: true },
  { key: 'detune', label: 'DETUNE', min: 0, max: 1, step: 0.01, effect: 'echo spread', live: true, unlocked: true },
  { key: 'cutoff', label: 'CUTOFF', min: 0, max: 1, step: 0.01, effect: 'blade reach + glow', live: true, unlocked: true },
  { key: 'resonance', label: 'RES', min: 0, max: 1, step: 0.01, effect: 'crit on PERFECT (score)', live: true, unlocked: true },
  { key: 'lfoRate', label: 'LFO RATE', min: 0, max: 8, step: 0.1, effect: '(planned) pulsing aura', live: false, unlocked: false },
  { key: 'lfoDepth', label: 'LFO DEPTH', min: 0, max: 1, step: 0.01, effect: '(planned) pulse strength', live: false, unlocked: false },
  { key: 'envAttack', label: 'ATTACK', min: 0, max: 0.5, step: 0.01, effect: '(planned) wind-up / charge', live: false, unlocked: false },
  { key: 'envRelease', label: 'RELEASE', min: 0, max: 1, step: 0.01, effect: '(planned) lingering slash', live: false, unlocked: false },
];

export const DEFAULT_PATCH: SynthPatch = {
  wavetable: 'basic-shapes',
  wtPosition: 0,
  unison: 1,
  detune: 0.2,
  cutoff: 0.5,
  resonance: 0.1,
  lfoRate: 2,
  lfoDepth: 0,
  envAttack: 0.01,
  envRelease: 0.2,
};

export const PATCH_PRESETS: Record<string, Partial<SynthPatch>> = {
  'INIT SINE': { wtPosition: 0, unison: 1, detune: 0.2, cutoff: 0.5, resonance: 0.1 },
  'SUPERSAW': { wtPosition: 0.66, unison: 5, detune: 0.55, cutoff: 0.75, resonance: 0.2 },
  'SQUARE GLITCH': { wtPosition: 1, unison: 3, detune: 0.9, cutoff: 0.6, resonance: 0.8 },
  'TRI PLUCK': { wtPosition: 0.33, unison: 2, detune: 0.3, cutoff: 0.3, resonance: 0.5 },
};

export function clampPatch(p: SynthPatch): SynthPatch {
  const out = { ...p };
  for (const s of PARAM_SPECS) {
    let v = Math.min(s.max, Math.max(s.min, out[s.key]));
    if (s.step >= 1) v = Math.round(v);
    out[s.key] = v;
  }
  return out;
}
