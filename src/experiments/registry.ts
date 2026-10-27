/**
 * Every gameplay experiment, in menu order. Add one by writing a module in src/experiments/
 * that exports an `Experiment`, then listing it here. Keys are permanent (URLs and saved Lab
 * results refer to them).
 */
import { approachRing } from './approachRing';
import { baseline } from './baseline';
import { converge } from './converge';
import { oneLane, oneLaneStrip } from './oneLane';
import { byEar } from './byEar';
import { callResponse } from './callResponse';
import { keysound } from './keysound';
import { parry } from './parry';
import { tells } from './tells';
import type { Experiment } from './types';

export const BASELINE_KEY = 'baseline';

export const EXPERIMENTS: readonly Experiment[] = [
  baseline,
  tells,
  parry,
  oneLane,
  oneLaneStrip,
  converge,
  approachRing,
  keysound,
  callResponse,
  byEar,
];

export function experimentByKey(key: string | null | undefined): Experiment | null {
  if (!key) return null;
  return EXPERIMENTS.find((e) => e.key === key) ?? null;
}
