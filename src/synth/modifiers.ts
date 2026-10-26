import type { SynthPatch } from './patch';

/** Swing arc shapes the wavetable morphs between. */
export const TABLE_SHAPES = ['sine', 'triangle', 'saw', 'square'] as const;
export type TableShape = (typeof TABLE_SHAPES)[number];

/**
 * Everything the synth contributes to the sword. Pure data derived from the patch;
 * the duel uses the gameplay fields, the renderer uses the visual ones.
 *
 *  - WT POS  → SLASH / FLOURISH arc shape and width, STAB thrust curve, trail colour
 *  - UNISON  → echo blades on every move (a fanned shield on BLOCK) + ECHO PARRY charges
 *  - DETUNE  → echo spread and timing
 *  - CUTOFF  → blade reach and glow, STAB lunge distance
 *  - RES     → crit score bonus on PERFECT slashes, stabs and flourishes
 */
export interface AttackModifiers {
  /** Morph weights over TABLE_SHAPES (sum to 1, at most two non-zero). */
  shapeWeights: [number, number, number, number];
  /** Arc span multiplier. */
  arcScale: number;
  /** Trail hue (degrees) and whether the trail is stepped/glitchy. */
  trailHue: number;
  trailStepped: number;
  /** Extra ghost blades after the main move. */
  echoCount: number;
  /** Delay between echoes (s) and angular spread (radians). */
  echoDelay: number;
  echoSpread: number;
  /** Echo-parry charge gained per landed hit (1 charge absorbs one missed block). */
  parryChargePerHit: number;
  /** Blade length multiplier. */
  reach: number;
  /** STAB lunge distance multiplier. */
  stabLunge: number;
  /** Score multiplier applied to PERFECT offensive hits. */
  critMultiplier: number;
}

/** Weights for a morph position 0..1 across n tables (linear crossfade between neighbours). */
export function morphWeights(pos: number, n = 4): number[] {
  const x = Math.min(1, Math.max(0, pos)) * (n - 1);
  const i = Math.min(n - 2, Math.floor(x));
  const f = x - i;
  const w = new Array<number>(n).fill(0);
  w[i] = 1 - f;
  w[i + 1] = f;
  return w;
}

/** Per-shape arc profile: progress 0..1 → angle fraction 0..1. */
export const SHAPE_EASE: Record<TableShape, (p: number) => number> = {
  sine: (p) => 0.5 - 0.5 * Math.cos(Math.PI * p),
  triangle: (p) => p,
  saw: (p) => 1 - Math.pow(1 - p, 4),
  square: (p) => Math.min(1, Math.floor(p * 4 + 0.6) / 4),
};
const SHAPE_SPAN: Record<TableShape, number> = { sine: 1, triangle: 0.85, saw: 1.35, square: 1.15 };
const SHAPE_HUE: Record<TableShape, number> = { sine: 125, triangle: 150, saw: 95, square: 170 };

export function easeForWeights(weights: readonly number[], p: number): number {
  let v = 0;
  TABLE_SHAPES.forEach((s, i) => (v += (weights[i] ?? 0) * SHAPE_EASE[s](p)));
  return v;
}

export function deriveModifiers(patch: SynthPatch): AttackModifiers {
  const w = morphWeights(patch.wtPosition) as [number, number, number, number];
  let arcScale = 0;
  let hue = 0;
  TABLE_SHAPES.forEach((s, i) => {
    arcScale += w[i]! * SHAPE_SPAN[s];
    hue += w[i]! * SHAPE_HUE[s];
  });
  const echoCount = Math.max(0, Math.round(patch.unison) - 1);
  return {
    shapeWeights: w,
    arcScale,
    trailHue: hue,
    trailStepped: w[3],
    echoCount,
    echoDelay: 0.035 + patch.detune * 0.05,
    echoSpread: patch.detune * 0.35,
    parryChargePerHit: echoCount * 0.02 * (0.5 + patch.detune),
    reach: 0.8 + patch.cutoff * 0.6,
    stabLunge: 0.7 + patch.cutoff * 0.6,
    critMultiplier: 1 + patch.resonance * 0.5,
  };
}
