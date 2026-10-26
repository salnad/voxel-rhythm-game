import { readFileSync } from 'node:fs';
import { parseChartText } from '../src/chart/validate';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: npm run validate-chart -- path/to/chart.json [more.json...]');
  process.exit(2);
}
let failed = false;
for (const f of files) {
  const r = parseChartText(readFileSync(f, 'utf8'));
  for (const w of r.warnings) console.warn(`${f}: warning: ${w}`);
  if (r.ok) {
    console.log(`${f}: OK (${r.chart.notes.length} notes, ${r.chart.lanes.length} lanes)`);
  } else {
    failed = true;
    for (const e of r.errors) console.error(`${f}: error: ${e}`);
  }
}
process.exit(failed ? 1 : 0);
