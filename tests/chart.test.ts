import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import { buildChart } from '../src/chart/build';
import { buildDemoChart, formatChartJson } from '../src/chart/demoChart';
import { parseChartText, validateChart } from '../src/chart/validate';

const root = resolve(import.meta.dirname, '..');
const schema = JSON.parse(readFileSync(resolve(root, 'schema/chart.schema.json'), 'utf8'));
const ajv = new Ajv({ allErrors: true });
const schemaValidate = ajv.compile(schema);

const minimal = () => ({
  format: 'voxel-rhythm-chart',
  version: 1,
  meta: { title: 'Test' },
  audio: { file: 'song.mp3' },
  timing: { bpm: 120, offsetMs: 100 },
  lanes: ['kick', 'perc', 'bass', 'synth'],
  notes: [
    { beat: 0, lane: 'kick' },
    { beat: 1, lane: 'bass', length: 2 },
    { beat: 0.5, lane: 'perc' },
  ],
});

describe('validateChart', () => {
  it('accepts a minimal chart and sorts notes (with a warning)', () => {
    const r = validateChart(minimal());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.chart.notes.map((n) => n.beat)).toEqual([0, 0.5, 1]);
    expect(r.warnings.some((w) => w.includes('not sorted'))).toBe(true);
  });

  it('reports precise paths for bad notes', () => {
    const c = minimal();
    (c.notes as unknown[]).push({ beat: -1, lane: 'kik' }, { beat: 2, lane: 'kick', length: 'x' });
    const r = validateChart(c);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors).toContain(
      'notes[3].beat: must be a number >= 0 (beats from beat 0; 0.5 = an eighth note later), got -1 (number)',
    );
    expect(
      r.errors.some(
        (e) => e.startsWith('notes[3].lane: "kik"') && e.includes('[kick, perc, bass, synth]'),
      ),
    ).toBe(true);
    expect(r.errors.some((e) => e.startsWith('notes[4].length'))).toBe(true);
  });

  it('rejects duplicates and notes inside holds', () => {
    const c = minimal();
    c.notes.push({ beat: 0, lane: 'kick' }, { beat: 2, lane: 'bass' });
    const r = validateChart(c);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.includes('duplicate note in lane "kick" at beat 0'))).toBe(true);
    expect(r.errors.some((e) => e.includes('inside the hold'))).toBe(true);
  });

  it('requires exactly one audio source', () => {
    const c = minimal() as Record<string, unknown>;
    c.audio = { file: 'a.mp3', procedural: 'hyperpop-demo' };
    const r = validateChart(c);
    expect(r.ok).toBe(false);
  });

  it('reports JSON syntax errors with a location', () => {
    const r = parseChartText('{\n  "format": "voxel-rhythm-chart",\n  "version": 1,,\n}');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]).toMatch(/invalid JSON.*line 3/);
  });

  it('agrees with the JSON schema on good and bad charts', () => {
    expect(schemaValidate(minimal())).toBe(true);
    const bad = { ...minimal(), lanes: ['Kick'] };
    expect(schemaValidate(bad)).toBe(false);
    expect(validateChart(bad).ok).toBe(false);
  });
});

describe('buildChart', () => {
  it('computes absolute times including offset and hold ends', () => {
    const r = validateChart(minimal());
    if (!r.ok) throw new Error(r.errors.join());
    const c = buildChart(r.chart);
    expect(c.notes[0]!.time).toBeCloseTo(0.1);
    const hold = c.notes.find((n) => n.laneName === 'bass')!;
    expect(hold.time).toBeCloseTo(0.6);
    expect(hold.endTime).toBeCloseTo(1.6);
    expect(c.notes.map((n) => n.id)).toEqual([0, 1, 2]);
  });
});

describe('demo map', () => {
  for (const [difficulty, file] of [
    ['normal', 'chart.json'],
    ['easy', 'chart-easy.json'],
  ] as const) {
    it(`committed ${file} matches the composition (run npm run gen:demo if this fails)`, () => {
      const text = readFileSync(resolve(root, 'public/maps/demo', file), 'utf8');
      expect(text).toBe(
        formatChartJson(buildDemoChart(difficulty), '../../../schema/chart.schema.json'),
      );
      const r = parseChartText(text);
      expect(r.ok).toBe(true);
      expect(schemaValidate(JSON.parse(text))).toBe(true);
    });
  }
});
