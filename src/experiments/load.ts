import { buildChart } from '../chart/build';
import { buildLabChart } from '../chart/labChart';
import type { ChartFile } from '../chart/types';
import { validateChart } from '../chart/validate';
import { MapLoadError, proceduralSong, type LoadedMap } from '../game/maps';
import type { Experiment } from './types';

/** The validated chart file an experiment plays (its own, or the shared Lab chart). */
export function experimentChartFile(exp: Experiment): { file: ChartFile; warnings: string[] } {
  const raw = exp.chart?.() ?? buildLabChart();
  const file = exp.options?.prompts === false ? { ...raw, prompts: [] } : raw;
  const r = validateChart(file);
  if (!r.ok) throw new MapLoadError(`Experiment "${exp.key}" has an invalid chart`, r.errors);
  return { file: r.chart, warnings: r.warnings };
}

/** Approximate trial length in seconds (to the last cue, plus lead-in and outro). */
export function experimentSeconds(exp: Experiment): number {
  try {
    const chart = buildChart(experimentChartFile(exp).file);
    return Math.round(chart.lastNoteTime + 4.5);
  } catch {
    return 60;
  }
}

/** Load an experiment's map: chart plus its procedural song's stems. */
export async function loadExperimentMap(exp: Experiment): Promise<LoadedMap> {
  const { file, warnings } = experimentChartFile(exp);
  if (!file.audio.procedural)
    throw new MapLoadError(`Experiment "${exp.key}" must use a procedural song`);
  const stems = await proceduralSong(file.audio.procedural);
  return { chart: buildChart(file), stems, warnings };
}
