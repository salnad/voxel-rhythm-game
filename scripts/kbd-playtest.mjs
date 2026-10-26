// Plays a chart with REAL keyboard events (xdotool → X11 → browser), timed off the game's
// own song clock read over the Chrome DevTools Protocol. Exercises the whole input path,
// unlike ?autoplay=1 which injects inputs after the keyboard layer.
//
// Needs: `npm run dev`, Chrome started with --remote-debugging-port=9222 on DISPLAY (default :1)
// showing the game, and xdotool. The game must be running in dev mode (exposes window.__vr).
//
//   node scripts/kbd-playtest.mjs [--start] [--miss 0.05] [--keys d,f,j,k] [--log timing.json]
//
// --start   navigate to ?map=demo&autostart=1 first
// --miss    fraction of notes to skip on purpose
// --log     write (wallclock ms, songTime s) samples, e.g. to line up audio with a screen capture

import { execFile } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const keys = opt('keys', 'd,f,j,k').split(',');
const missRate = Number(opt('miss', '0.05'));
const logFile = opt('log', '');
const display = process.env.DISPLAY ?? ':1';

async function connect(match) {
  for (;;) {
    const list = await (await fetch('http://127.0.0.1:9222/json')).json();
    const page = list.find((p) => p.type === 'page' && p.url.includes(match));
    if (page) {
      const ws = new WebSocket(page.webSocketDebuggerUrl);
      await new Promise((r) => (ws.onopen = r));
      let id = 0;
      const pending = new Map();
      ws.onmessage = (m) => {
        const d = JSON.parse(m.data);
        if (pending.has(d.id)) {
          pending.get(d.id)(d.result?.result?.value);
          pending.delete(d.id);
        }
      };
      const ev = (expression) =>
        new Promise((resolve) => {
          const i = ++id;
          pending.set(i, resolve);
          ws.send(
            JSON.stringify({
              id: i,
              method: 'Runtime.evaluate',
              params: { expression, returnByValue: true },
            }),
          );
        });
      return { ws, ev };
    }
    await new Promise((r) => setTimeout(r, 200));
  }
}

let { ws, ev } = await connect('127.0.0.1:5173');
if (args.includes('--start')) {
  await ev("location.href='/?map=demo&autostart=1'");
  ws.close();
  await new Promise((r) => setTimeout(r, 1000));
  ev = (await connect('autostart=1')).ev;
}
while (!(await ev('!!window.__vr'))) await new Promise((r) => setTimeout(r, 100));

const notes = await ev(
  'window.__vr.session.chart.notes.map(n => ({lane: n.lane, t: n.time, end: n.endTime}))',
);
let seed = 7;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const events = [];
for (const n of notes) {
  if (rand() < missRate) continue;
  events.push({ t: n.t, key: keys[n.lane], down: true });
  events.push({ t: n.end ?? n.t + 0.045, key: keys[n.lane], down: false });
}
events.sort((a, b) => a.t - b.t || (a.down ? 1 : -1));

const xd = (a) => execFile('xdotool', a, { env: { ...process.env, DISPLAY: display } });
const samples = [];
const LEAD = 0.01; // xdotool spawn + X11 delivery
let i = 0;
while (i < events.length) {
  const wall = Date.now();
  const now = await ev('window.__vr.songTime()');
  samples.push([wall, now]);
  const due = [];
  while (i < events.length && events[i].t - LEAD <= now) due.push(events[i++]);
  const downs = due.filter((e) => e.down).map((e) => e.key);
  const ups = due.filter((e) => !e.down).map((e) => e.key);
  if (ups.length) xd(['keyup', ...ups]);
  if (downs.length) xd(['keydown', ...downs]);
  const next = events[i]?.t ?? now;
  if (next - now > 0.12) await new Promise((r) => setTimeout(r, 40));
}
await new Promise((r) => setTimeout(r, 3000));
const result = await ev(
  '({counts: window.__vr.session.score.counts, accuracy: window.__vr.session.score.accuracy, meanOffsetMs: window.__vr.session.score.meanOffsetMs})',
);
console.log(JSON.stringify(result));
if (logFile) writeFileSync(logFile, JSON.stringify(samples));
process.exit(0);
