/**
 * Every gameplay experiment, in menu order. Add one by writing a module in src/experiments/
 * that exports an `Experiment`, then listing it here. Keys are permanent (URLs and saved Lab
 * results refer to them).
 */
import { baseline } from './baseline';
import { parry } from './parry';
import { tells } from './tells';
import type { Experiment } from './types';

export const BASELINE_KEY = 'baseline';

export const EXPERIMENTS: readonly Experiment[] = [baseline, tells, parry];

export function experimentByKey(key: string | null | undefined): Experiment | null {
  if (!key) return null;
  return EXPERIMENTS.find((e) => e.key === key) ?? null;
}
