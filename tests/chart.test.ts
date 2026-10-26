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
  version: 3,
  meta: { title: 'Test' },
  audio: { file: 'song.mp3' },
  timing: { bpm: 120, offsetMs: 100 },
  notes: [
    { beat: 4, action: 'block' },
    { beat: 8, action: 'flourish' },
    { beat: 6, action: 'slash' },
  ] as Array<Record<string, unknown>>,
});

const errorsOf = (c: unknown) => {
  const r = validateChart(c);
  return r.ok ? [] : r.errors;
};

describe('validateChart', () => {
  it('accepts a minimal chart and sorts notes (with a warning)', () => {
    const r = validateChart(minimal());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.chart.notes.map((n) => n.beat)).toEqual([4, 6, 8]);
    expect(r.warnings.some((w) => w.includes('not sorted'))).toBe(true);
  });

  it('reports precise paths for bad notes', () => {
    const c = minimal();
    c.notes.push({ beat: -1, action: 'parry' }, { beat: 12, action: 'stab', length: 'x' });
    const errors = errorsOf(c);
    expect(errors).toContain(
      'notes[3].beat: must be a number >= 0 (beats from beat 0; 0.5 = an eighth note later), got -1 (number)',
    );
    expect(errors).toContain(
      'notes[3].action: "parry" (string) is not one of [block, slash, stab, flourish]',
    );
    expect(errors.some((e) => e.startsWith('notes[4].length'))).toBe(true);
  });

  it('explains the v1 → v2 change for lanes', () => {
    const c = { ...minimal(), version: 1, lanes: ['kick'] } as Record<string, unknown>;
    (c.notes as unknown[]).push({ beat: 10, lane: 'kick' });
    const errors = errorsOf(c);
    expect(errors.some((e) => e.startsWith('lanes: was removed in version 2'))).toBe(true);
    expect(errors.some((e) => e.startsWith('notes[3].lane: was removed'))).toBe(true);
    expect(errors.some((e) => e.startsWith('version: must be 3') && e.includes('version 1'))).toBe(
      true,
    );
  });

  it('allows only one action at a time', () => {
    const c = minimal();
    c.notes.push({ beat: 4, action: 'slash' });
    expect(errorsOf(c)).toContain(
      'notes[3]: is at beat 4, the same beat as notes[0] (block). Only one action can happen at a time',
    );
    const h = minimal();
    h.notes[0] = { beat: 4, action: 'block', length: 3 };
    expect(errorsOf(h).some((e) => e.includes('inside the block hold notes[0]'))).toBe(true);
  });

  it('validates encounters: order, coverage, and empty enemies', () => {
    const c = { ...minimal(), encounters: [{ beat: 5 }, { beat: 5, enemy: 'dragon' }] };
    const errors = errorsOf(c);
    expect(errors.some((e) => e.startsWith('encounters[0].beat') && e.includes('first note'))).toBe(
      true,
    );
    expect(errors.some((e) => e.startsWith('encounters[1].beat: must be greater'))).toBe(true);
    expect(errors.some((e) => e.startsWith('encounters[1].enemy: "dragon"'))).toBe(true);

    const empty = { ...minimal(), encounters: [{ beat: 0 }, { beat: 4.5 }, { beat: 5 }] };
    expect(
      errorsOf(empty).some((e) => e.startsWith('encounters[1]') && e.includes('no notes')),
    ).toBe(true);
  });

  it('warns about rushed walk-ins and encounters that do not end on a flourish', () => {
    const c = { ...minimal(), encounters: [{ beat: 0 }, { beat: 5.5 }] };
    const r = validateChart(c);
    expect(r.ok).toBe(true);
    expect(r.warnings.some((w) => w.startsWith('encounters[0]: ends on a block'))).toBe(true);
    expect(r.warnings.some((w) => w.startsWith('encounters[1]: first note is 0.5 beats'))).toBe(
      true,
    );
  });

  it('validates prompts', () => {
    const c = {
      ...minimal(),
      prompts: [
        { beat: 0, text: '' },
        { beat: 1, text: 'x', action: 'kick' },
      ],
    };
    const errors = errorsOf(c);
    expect(errors.some((e) => e.startsWith('prompts[0].text'))).toBe(true);
    expect(errors.some((e) => e.startsWith('prompts[1].action'))).toBe(true);
  });

  it('requires exactly one audio source', () => {
    const c = minimal() as Record<string, unknown>;
    c.audio = { file: 'a.mp3', procedural: 'hyperpop-demo' };
    expect(validateChart(c).ok).toBe(false);
  });

  it('reports JSON syntax errors with a location', () => {
    const r = parseChartText('{\n  "format": "voxel-rhythm-chart",\n  "version": 3,,\n}');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]).toMatch(/invalid JSON.*line 3/);
  });

  it('agrees with the JSON schema on good and bad charts', () => {
    expect(schemaValidate(minimal())).toBe(true);
    expect(schemaValidate({ ...minimal(), encounters: [{ beat: 0, enemy: 'knight' }] })).toBe(true);
    for (const bad of [
      { ...minimal(), notes: [{ beat: 1, action: 'kick' }] },
      { ...minimal(), version: 1 },
      { ...minimal(), encounters: [{ beat: 0, enemy: 'dragon' }] },
      { ...minimal(), prompts: [{ beat: 0 }] },
    ]) {
      expect(schemaValidate(bad)).toBe(false);
      expect(validateChart(bad).ok).toBe(false);
    }
  });
});

describe('combos', () => {
  const comboChart = () => ({
    ...minimal(),
    timing: { bpm: 120, offsetMs: 0 },
    encounters: [{ beat: 0 }],
    notes: [
      { beat: 4, action: 'block' },
      { beat: 5, action: 'slash' },
      { beat: 7, action: 'stab' },
      { beat: 12, action: 'flourish' },
    ] as Array<Record<string, unknown>>,
    combos: [{ fromBar: 1 }] as Array<Record<string, unknown>>,
  });

  it('accepts a combo measure that leaves its last beat free', () => {
    const r = validateChart(comboChart());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const chart = buildChart(r.chart);
    expect(chart.bars[1]!.combo).toEqual({ retries: 2 });
    expect(chart.bars[0]!.combo).toBeNull();
    expect(chart.bars[1]!.noteIds).toEqual([0, 1, 2]);
  });

  it('rejects cues in the last beat of a combo measure', () => {
    const c = comboChart();
    c.notes.push({ beat: 7.5, action: 'slash' });
    expect(
      errorsOf(c).some(
        (e) => e.startsWith('notes[4]: slash at beat 7.5') && e.includes('last beat'),
      ),
    ).toBe(true);
    const h = comboChart();
    h.notes[0] = { beat: 4, action: 'block', length: 3.5 };
    h.notes.splice(1, 2);
    expect(errorsOf(h).some((e) => e.includes('held to 7.5'))).toBe(true);
  });

  it('rejects bad ranges and encounters that start inside a combo', () => {
    const c = comboChart();
    c.combos = [
      { fromBar: 2, toBar: 1 },
      { fromBar: 1 },
      { fromBar: 0.5 },
      { fromBar: 3, retries: 9 },
    ];
    const errors = errorsOf(c);
    expect(errors.some((e) => e.startsWith('combos[0].toBar'))).toBe(true);
    expect(errors.some((e) => e.startsWith('combos[2].fromBar'))).toBe(true);
    expect(errors.some((e) => e.startsWith('combos[3].retries'))).toBe(true);
    const e2 = { ...comboChart(), encounters: [{ beat: 0 }, { beat: 5 }] };
    expect(
      errorsOf(e2).some(
        (e) => e.startsWith('encounters[1].beat') && e.includes('inside combo bar 1'),
      ),
    ).toBe(true);
  });

  it('warns about combo bars without cues, and agrees with the schema', () => {
    const c = { ...comboChart(), combos: [{ fromBar: 1, toBar: 2 }] };
    const r = validateChart(c);
    expect(r.ok).toBe(true);
    expect(r.warnings).toContain('combos: bar 2 has no notes, so it is not a combo');
    expect(schemaValidate(c)).toBe(true);
    expect(schemaValidate({ ...c, combos: [{ toBar: 2 }] })).toBe(false);
  });
});

describe('buildChart', () => {
  it('computes absolute times, lanes from actions, and hold ends', () => {
    const c = minimal();
    c.notes.push({ beat: 10, action: 'stab', length: 2 });
    const r = validateChart(c);
    if (!r.ok) throw new Error(r.errors.join());
    const chart = buildChart(r.chart);
    expect(chart.notes.map((n) => n.lane)).toEqual([0, 1, 3, 2]);
    expect(chart.notes[0]!.time).toBeCloseTo(2.1);
    const hold = chart.notes[3]!;
    expect(hold.endTime).toBeCloseTo(0.1 + 6);
  });

  it('assigns notes to explicit encounters', () => {
    const r = validateChart({
      ...minimal(),
      encounters: [{ beat: 0, enemy: 'brute' }, { beat: 5 }],
    });
    if (!r.ok) throw new Error(r.errors.join());
    const chart = buildChart(r.chart);
    expect(chart.encounters.map((e) => e.noteIds)).toEqual([[0], [1, 2]]);
    expect(chart.encounters[0]!.enemy).toBe('brute');
    expect(chart.encounters[1]!.startTime).toBeCloseTo(0.1 + 2.5);
  });

  it('without encounters, starts a new enemy after every flourish', () => {
    const c = minimal();
    c.notes.push({ beat: 10, action: 'block' }, { beat: 12, action: 'flourish' });
    const r = validateChart(c);
    if (!r.ok) throw new Error(r.errors.join());
    const chart = buildChart(r.chart);
    expect(chart.encounters.map((e) => e.noteIds)).toEqual([
      [0, 1, 2],
      [3, 4],
    ]);
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
      if (r.ok) expect(r.warnings).toEqual([]);
      expect(schemaValidate(JSON.parse(text))).toBe(true);
    });
  }
});
