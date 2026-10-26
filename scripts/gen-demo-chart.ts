import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildDemoChart, formatChartJson } from '../src/chart/demoChart';
import { validateChart } from '../src/chart/validate';

const root = resolve(import.meta.dirname, '..');
for (const [difficulty, file] of [
  ['normal', 'chart.json'],
  ['easy', 'chart-easy.json'],
] as const) {
  const chart = buildDemoChart(difficulty);
  const result = validateChart(JSON.parse(JSON.stringify(chart)));
  if (!result.ok) {
    console.error(result.errors.join('\n'));
    process.exit(1);
  }
  const out = resolve(root, 'public/maps/demo', file);
  writeFileSync(out, formatChartJson(chart, '../../../schema/chart.schema.json'));
  console.log(`wrote ${out} (${chart.notes.length} notes)`);
}
