// Runs the offline FX audit (probe.ts) inside Chrome through the Vite dev server and prints
// a table. Needs `npm run dev` and Chrome with --remote-debugging-port=9222 showing the game.
//
//   node scripts/fx-audit/run.mjs [--latency 0.03] [--bars 16] [--from 16] [--file-map]
//                                 [--miss block] [--mapping fx] [--json out.json]

import { writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const options = {
  mapping: opt('mapping', 'fx'),
  latency: Number(opt('latency', '0.03')),
  fromBar: Number(opt('from', '16')),
  bars: Number(opt('bars', '16')),
  chartFile: opt('chart', 'chart.json'),
  fileMap: args.includes('--file-map'),
  missAction: opt('miss', null),
};

const list = await (await fetch('http://127.0.0.1:9222/json')).json();
const page = list.find((p) => p.type === 'page' && p.url.includes('127.0.0.1:5173'));
if (!page) throw new Error('open the game at http://127.0.0.1:5173 in Chrome first');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
const result = await new Promise((resolve, reject) => {
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id !== 1) return;
    if (d.result?.exceptionDetails) reject(new Error(JSON.stringify(d.result.exceptionDetails)));
    else resolve(d.result.result.value);
  };
  ws.send(
    JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: {
        expression: `import('/scripts/fx-audit/probe.ts').then((m) => m.runAudit(${JSON.stringify(options)}))`,
        awaitPromise: true,
        returnByValue: true,
      },
    }),
  );
});
ws.close();

const f = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : '-');
console.log(
  `mapping=${options.mapping} latency=${options.latency * 1000}ms bars ${options.fromBar}-${options.fromBar + options.bars}${options.fileMap ? ' (file map)' : ''}${options.missAction ? ` missing ${options.missAction}` : ''}`,
);
console.log(
  'action    cues  peak dB  audible ms  onset ms  level dB  >1.5k dB  pre-master level dB',
);
for (const [a, s] of Object.entries(result.actions)) {
  console.log(
    `${a.padEnd(9)} ${String(s.cues).padStart(4)}  ${f(s.peakDb).padStart(7)}  ${f(s.audibleMs, 0).padStart(10)}  ${f(s.onsetMs, 0).padStart(8)}  ${f(s.levelDb).padStart(8)}  ${f(s.hfDb).padStart(8)}  ${f(s.preLevelDb).padStart(8)}`,
  );
}
const dbfs = (p) => (20 * Math.log10(p)).toFixed(1);
console.log(
  `dry: peak ${dbfs(result.dry.peak)} dBFS, ${result.dry.clipped} clipped samples · all effects: peak ${dbfs(result.all.peak)} dBFS, ${result.all.clipped} clipped · dry song's own dip after each kick ${f(result.dryPumpDb)} dB`,
);
const out = opt('json', '');
if (out) writeFileSync(out, JSON.stringify(result, null, 2));
