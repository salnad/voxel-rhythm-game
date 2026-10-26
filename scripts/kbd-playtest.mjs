// Plays a chart with REAL keyboard events (xdotool → X11 → browser), timed off the game's
// own song clock read over the Chrome DevTools Protocol. Exercises the whole input path,
// unlike ?autoplay=1 which injects inputs after the keyboard layer.
//
// Needs: `npm run dev`, Chrome started with --remote-debugging-port=9222 on DISPLAY (default :1)
// showing the game, and xdotool. The game must be running in dev mode (exposes window.__vr).
//
//   node scripts/kbd-playtest.mjs [--start] [--diff easy|normal] [--miss 0.05] [--keys f,g,h,j]
//                                 [--skip-beats 76,79] [--until 62] [--log timing.json] [--events events.json]
//
// --start       navigate to ?map=demo&autostart=1 first
// --miss        fraction of notes to skip on purpose
// --skip-beats  chart beats to skip on purpose (to show miss consequences)
// --until       stop playing at this song time (s)
// --log         write (wallclock ms, songTime s) samples, e.g. to line up audio with a screen capture
// --events      write the sword sound events (song time, kind, action), to render a soundtrack

import { execFile } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const keys = opt('keys', 'f,g,h,j').split(',');
const missRate = Number(opt('miss', '0.05'));
const logFile = opt('log', '');
const eventsFile = opt('events', '');
const until = Number(opt('until', 'Infinity'));
const skipBeats = new Set(opt('skip-beats', '').split(',').filter(Boolean).map(Number));
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
  await ev(`location.href='/?map=demo&autostart=1&diff=${opt('diff', 'easy')}'`);
  ws.close();
  await new Promise((r) => setTimeout(r, 1000));
  ev = (await connect('autostart=1')).ev;
}
while (!(await ev('!!window.__vr'))) await new Promise((r) => setTimeout(r, 100));

await ev(`(() => {
  const s = window.__vr.session;
  const log = (window.__vrlog = []);
  s.bus.on('input', (i) => i.down && log.push({ t: i.time, kind: 'swing', lane: i.lane }));
  s.bus.on('action', (a) => a.hit && a.kind !== 'holdEnd' && log.push({ t: a.time, kind: 'hit', lane: a.lane, perfect: a.judgement === 'perfect' }));
  s.bus.on('duel', (d) => ['playerHit', 'recovered', 'defeated'].includes(d.type) && log.push({ t: d.time, kind: d.type }));
  return true;
})()`);
const notes = (
  await ev(
    'window.__vr.session.chart.notes.map(n => ({lane: n.lane, beat: n.beat, t: n.time, end: n.endTime}))',
  )
).filter((n) => !skipBeats.has(n.beat) && n.t < until);
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
await new Promise((r) => setTimeout(r, 1500));
if (eventsFile) writeFileSync(eventsFile, JSON.stringify(await ev('window.__vrlog')));
const result = await ev(
  '({counts: window.__vr.session.score.counts, accuracy: window.__vr.session.score.accuracy, meanOffsetMs: window.__vr.session.score.meanOffsetMs, defeated: window.__vr.session.duel.defeated, hitsTaken: window.__vr.session.duel.hitsTaken})',
);
console.log(JSON.stringify(result));
if (logFile) writeFileSync(logFile, JSON.stringify(samples));
process.exit(0);
