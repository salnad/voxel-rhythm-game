// Plays a chart with REAL keyboard events (xdotool → X11 → browser), timed off the game's
// own song clock read over the Chrome DevTools Protocol. Exercises the whole input path,
// unlike ?autoplay=1 which injects inputs after the keyboard layer.
//
// Needs: `npm run dev`, Chrome started with --remote-debugging-port=9222 on DISPLAY (default :1)
// showing the game, and xdotool. The game must be running in dev mode (exposes window.__vr).
//
//   node scripts/kbd-playtest.mjs [--start] [--diff easy|normal] [--miss 0.05] [--keys a,s,d,f]
//                                 [--skip-beats 76,79] [--fail-bars 41] [--until 62] [--log timing.json]
//                                 [--events events.json]
//
// --start       navigate to ?map=demo&autostart=1 first
// --miss        fraction of notes to skip on purpose
// --skip-beats  chart beats to skip on purpose (to show miss consequences)
// --fail-bars   combo bars where the first try misses one cue (shows the wonky measure + retry)
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
const keys = opt('keys', 'a,s,d,f').split(',');
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
// Cues are planned on the fly (boss combos can repeat a measure), so poll for upcoming cues
// instead of reading the chart up front.
const failBars = new Set(opt('fail-bars', '').split(',').filter(Boolean).map(Number));
let seed = 7;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const xd = (a) => execFile('xdotool', a, { env: { ...process.env, DISPLAY: display } });
const samples = [];
const LEAD = 0.01; // xdotool spawn + X11 delivery
const seen = new Set();
const failedBars = new Set();
const events = [];
let now = -10;
while (now < until) {
  const wall = Date.now();
  const state = await ev(`(() => {
    const s = window.__vr.session, t = window.__vr.songTime();
    const cues = s.cuesBetween(t, t + 1.2).map((c) => ({ id: c.id, lane: c.lane, t: c.time, end: c.endTime, beat: s.chart.notes[c.noteId].beat, bar: c.bar, attempt: c.attempt, pending: s.judge.isPending(c.id) }));
    return { t, cues, done: s.finished };
  })()`);
  now = state.t;
  samples.push([wall, now]);
  for (const c of state.cues) {
    if (seen.has(c.id) || c.t >= until) continue;
    seen.add(c.id);
    if (skipBeats.has(c.beat) || rand() < missRate) continue;
    if (failBars.has(c.bar) && c.attempt === 1 && !failedBars.has(c.bar)) {
      const sameBar = state.cues.filter((x) => x.bar === c.bar && x.attempt === 1);
      if (sameBar.indexOf(c) === Math.min(1, sameBar.length - 1)) {
        failedBars.add(c.bar);
        continue;
      }
    }
    events.push({ t: c.t, key: keys[c.lane], down: true, id: c.id });
    events.push({ t: c.end ?? c.t + 0.045, key: keys[c.lane], down: false, id: c.id });
  }
  events.sort((a, b) => a.t - b.t || (a.down ? 1 : -1));
  const pending = new Set(state.cues.filter((c) => c.pending).map((c) => c.id));
  const due = [];
  while (events.length && events[0].t - LEAD <= now) due.push(events.shift());
  // presses for cues voided by a failed combo are dropped
  const downs = due.filter((e) => e.down && pending.has(e.id)).map((e) => e.key);
  const ups = due.filter((e) => !e.down).map((e) => e.key);
  if (ups.length) xd(['keyup', ...ups]);
  if (downs.length) xd(['keydown', ...downs]);
  if (state.done) break;
  const next = events[0]?.t ?? now + 0.5;
  if (next - now > 0.15) await new Promise((r) => setTimeout(r, 30));
}
await new Promise((r) => setTimeout(r, 1500));
if (eventsFile) writeFileSync(eventsFile, JSON.stringify(await ev('window.__vrlog')));
const result = await ev(
  '({counts: window.__vr.session.score.counts, accuracy: window.__vr.session.score.accuracy, meanOffsetMs: window.__vr.session.score.meanOffsetMs, defeated: window.__vr.session.duel.defeated, hitsTaken: window.__vr.session.duel.hitsTaken})',
);
console.log(JSON.stringify(result));
if (logFile) writeFileSync(logFile, JSON.stringify(samples));
process.exit(0);
