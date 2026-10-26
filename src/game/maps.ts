import { mixStems, renderDemoStems } from '../audio/demo/render';
import { buildChart, type Chart } from '../chart/build';
import type { ChartFile } from '../chart/types';
import { parseChartText, validateChart } from '../chart/validate';

export interface MapIndexEntry {
  id: string;
  title: string;
  artist?: string;
  charts: Array<{ difficulty: string; file: string }>;
}

export interface LoadedMap {
  chart: Chart;
  /** Music stems by part name. Audio-file maps have a single "mix" stem. */
  stems: Record<string, AudioBuffer>;
  warnings: string[];
}

export class MapLoadError extends Error {
  constructor(
    message: string,
    readonly details: string[] = [],
  ) {
    super(message);
  }
}

const proceduralCache = new Map<string, Promise<Record<string, AudioBuffer>>>();

/** Built-in procedural songs, by `audio.procedural` name. They render to stems. */
const PROCEDURAL: Record<string, () => Promise<Record<string, AudioBuffer>>> = {
  'digicore-demo': () => renderDemoStems(),
};

/** A procedural song mixed down to one buffer (editor preview). */
export async function proceduralMix(name: string): Promise<AudioBuffer> {
  return mixStems(await proceduralSong(name));
}

export function proceduralSong(name: string): Promise<Record<string, AudioBuffer>> {
  const make = PROCEDURAL[name];
  if (!make)
    throw new MapLoadError(
      `Unknown procedural song "${name}". Known: ${Object.keys(PROCEDURAL).join(', ')}`,
    );
  let p = proceduralCache.get(name);
  if (!p) {
    p = make();
    proceduralCache.set(name, p);
  }
  return p;
}

export async function fetchMapIndex(): Promise<MapIndexEntry[]> {
  const res = await fetch('/maps/index.json');
  return (await res.json()) as MapIndexEntry[];
}

function checked(text: string): { file: ChartFile; warnings: string[] } {
  const r = parseChartText(text);
  if (!r.ok) throw new MapLoadError('Chart failed validation', r.errors);
  return { file: r.chart, warnings: r.warnings };
}

async function decode(ctx: BaseAudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  try {
    return await ctx.decodeAudioData(data);
  } catch (e) {
    throw new MapLoadError(`Could not decode audio: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function audioFor(
  ctx: BaseAudioContext,
  file: ChartFile,
  fetchRelative?: (path: string) => Promise<ArrayBuffer>,
  provided?: ArrayBuffer,
): Promise<Record<string, AudioBuffer>> {
  if (file.audio.procedural) return proceduralSong(file.audio.procedural);
  if (provided) return { mix: await decode(ctx, provided.slice(0)) };
  if (fetchRelative && file.audio.file)
    return { mix: await decode(ctx, await fetchRelative(file.audio.file)) };
  throw new MapLoadError(
    `This chart needs its audio file "${file.audio.file}". Pick it alongside the chart.`,
  );
}

/** Load a map from /public/maps/<id>/<chart>. */
export async function loadBuiltinMap(
  ctx: BaseAudioContext,
  id: string,
  chartFile: string,
): Promise<LoadedMap> {
  const base = `/maps/${encodeURIComponent(id)}/`;
  const res = await fetch(base + chartFile);
  if (!res.ok) throw new MapLoadError(`Could not load ${base + chartFile} (${res.status})`);
  const { file, warnings } = checked(await res.text());
  const stems = await audioFor(ctx, file, async (p) => {
    const r = await fetch(base + p);
    if (!r.ok) throw new MapLoadError(`Could not load audio ${base + p} (${r.status})`);
    return r.arrayBuffer();
  });
  return { chart: buildChart(file), stems, warnings };
}

/** Load a user-supplied chart (+ audio file unless procedural). */
export async function loadCustomMap(
  ctx: BaseAudioContext,
  chartText: string,
  audioData?: ArrayBuffer,
): Promise<LoadedMap> {
  const { file, warnings } = checked(chartText);
  const stems = await audioFor(ctx, file, undefined, audioData);
  return { chart: buildChart(file), stems, warnings };
}

export function chartFromValidated(file: ChartFile): Chart {
  const r = validateChart(file);
  if (!r.ok) throw new MapLoadError('Chart failed validation', r.errors);
  return buildChart(r.chart);
}

// ---- editor → game handoff (chart in localStorage, audio bytes in IndexedDB)

const HANDOFF_CHART = 'voxel-rhythm.handoff.chart';
const DB = 'voxel-rhythm';
const STORE = 'blobs';

function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putBlob(key: string, value: ArrayBuffer | null): Promise<void> {
  const d = await db();
  await new Promise<void>((resolve, reject) => {
    const tx = d.transaction(STORE, 'readwrite');
    if (value) tx.objectStore(STORE).put(value, key);
    else tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getBlob(key: string): Promise<ArrayBuffer | undefined> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const req = d.transaction(STORE, 'readonly').objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as ArrayBuffer | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function saveHandoff(chartText: string, audio: ArrayBuffer | null): Promise<void> {
  localStorage.setItem(HANDOFF_CHART, chartText);
  await putBlob('handoff-audio', audio);
}

export async function loadHandoff(ctx: BaseAudioContext): Promise<LoadedMap | null> {
  const text = localStorage.getItem(HANDOFF_CHART);
  if (!text) return null;
  const audio = await getBlob('handoff-audio');
  return loadCustomMap(ctx, text, audio);
}
