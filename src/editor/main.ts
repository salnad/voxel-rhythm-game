import { SongPlayer } from '../audio/songPlayer';
import { formatChartJson } from '../chart/demoChart';
import { TempoMap } from '../chart/tempo';
import {
  CHART_FORMAT_ID,
  CHART_FORMAT_VERSION,
  type ChartFile,
  type ChartNote,
} from '../chart/types';
import { parseChartText, validateChart } from '../chart/validate';
import { laneStyle } from '../config/combat';
import { proceduralSong, saveHandoff } from '../game/maps';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('timeline');
const ctx2d = canvas.getContext('2d')!;
const text = $<HTMLTextAreaElement>('text');
const statusEl = $('status');

const player = new SongPlayer();
let chart: ChartFile | null = null;
let tempo = new TempoMap(120, 0);
let audio: AudioBuffer | null = null;
let audioBytes: ArrayBuffer | null = null;
/** Beat at the playhead line. */
let cursorBeat = 0;
let pxPerBeat = 120;
let drag: { note: ChartNote; startBeat: number } | null = null;
let lastTickTime = -Infinity;

const snap = () => Number($<HTMLSelectElement>('snap').value);
const snapBeat = (b: number) => Math.round(b * snap()) / snap();

function setChart(c: ChartFile, rewriteText = true) {
  chart = c;
  tempo = new TempoMap(c.timing.bpm, c.timing.offsetMs, c.timing.bpmChanges ?? []);
  if (rewriteText) text.value = formatChartJson(c);
  validate();
}

function touched() {
  if (!chart) return;
  chart.notes.sort(
    (a, b) => a.beat - b.beat || chart!.lanes.indexOf(a.lane) - chart!.lanes.indexOf(b.lane),
  );
  text.value = formatChartJson(chart);
  validate();
}

function validate() {
  const r = parseChartText(text.value);
  const w = r.warnings.map((x) => `<div class="warn">⚠ ${esc(x)}</div>`).join('');
  if (r.ok) {
    statusEl.innerHTML = `<div class="ok">✓ valid · ${r.chart.notes.length} notes · ${r.chart.lanes.length} lanes</div>${w}`;
  } else {
    statusEl.innerHTML = r.errors.map((x) => `<div class="err">✗ ${esc(x)}</div>`).join('') + w;
  }
  return r;
}
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

async function loadAudioFor(c: ChartFile) {
  if (c.audio.procedural) {
    status('rendering procedural song…');
    audio = await proceduralSong(c.audio.procedural);
    audioBytes = null;
  }
  if (audio) player.setBuffer(audio);
}

function status(msg: string) {
  statusEl.innerHTML = `<div class="ok">${esc(msg)}</div>`;
}

// ---------------------------------------------------------------- loading

$('b-demo').onclick = async () => {
  await player.resumeContext();
  const r = parseChartText(await (await fetch('/maps/demo/chart.json')).text());
  if (!r.ok) return;
  await loadAudioFor(r.chart);
  setChart(r.chart);
  cursorBeat = 0;
};

$<HTMLInputElement>('f-chart').onchange = async (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  text.value = await f.text();
  const r = validate();
  if (r.ok) {
    setChart(r.chart, false);
    await player.resumeContext();
    await loadAudioFor(r.chart);
  }
};

$<HTMLInputElement>('f-audio').onchange = async (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  await player.resumeContext();
  audioBytes = await f.arrayBuffer();
  try {
    audio = await player.ctx.decodeAudioData(audioBytes.slice(0));
    player.setBuffer(audio);
    status(`audio loaded: ${f.name} (${audio.duration.toFixed(1)} s)`);
    if (chart?.audio.file !== undefined) {
      chart.audio.file = f.name;
      touched();
    }
  } catch (err) {
    status(`could not decode audio: ${String(err)}`);
  }
};

$('b-new').onclick = () => {
  const lanes = $<HTMLInputElement>('n-lanes')
    .value.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const file = $<HTMLInputElement>('f-audio').files?.[0];
  const c: ChartFile = {
    format: CHART_FORMAT_ID,
    version: CHART_FORMAT_VERSION,
    meta: { title: $<HTMLInputElement>('n-title').value || 'Untitled', charter: 'me' },
    audio: file ? { file: file.name } : { procedural: 'hyperpop-demo' },
    timing: {
      bpm: Number($<HTMLInputElement>('n-bpm').value),
      offsetMs: Number($<HTMLInputElement>('n-offset').value),
      beatsPerBar: 4,
    },
    lanes,
    notes: [],
  };
  const r = validateChart(c);
  if (!r.ok) {
    statusEl.innerHTML = r.errors.map((x) => `<div class="err">✗ ${esc(x)}</div>`).join('');
    return;
  }
  void loadAudioFor(c).then(() => setChart(c));
  cursorBeat = 0;
};

$('b-apply').onclick = () => {
  const r = validate();
  if (r.ok) setChart(r.chart, false);
};

$('b-dl').onclick = () => {
  const blob = new Blob([text.value], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'chart.json';
  a.click();
};

$('b-test').onclick = async () => {
  const r = validate();
  if (!r.ok) return;
  if (r.chart.audio.file && !audioBytes) return status('load the audio file first');
  await saveHandoff(text.value, audioBytes);
  window.open('/?map=editor', '_blank');
};

// ---------------------------------------------------------------- playback

function togglePlay() {
  if (!audio || !chart) return;
  if (player.playing) {
    player.pause();
    cursorBeat = snapBeat(tempo.secToBeat(player.songTimeAt(performance.now())));
  } else {
    void player.resumeContext();
    player.play(tempo.beatToSec(cursorBeat) - 0.3);
    lastTickTime = tempo.beatToSec(cursorBeat) - 0.3;
  }
}
$('b-play').onclick = togglePlay;
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && document.activeElement !== text) {
    e.preventDefault();
    togglePlay();
  }
});

function tick() {
  const t = player.ctx.currentTime;
  const o = player.ctx.createOscillator();
  o.frequency.value = 2400;
  const g = player.ctx.createGain();
  g.gain.setValueAtTime(0.15, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
  o.connect(g).connect(player.ctx.destination);
  o.start(t);
  o.stop(t + 0.04);
}

// ---------------------------------------------------------------- timeline

function layout() {
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  const n = chart?.lanes.length ?? 4;
  const laneW = Math.min(90, (W - 80) / n);
  const x0 = (W - laneW * n) / 2;
  const playY = H * 0.8;
  return { W, H, n, laneW, x0, playY };
}

function beatAtY(y: number) {
  const { playY } = layout();
  return cursorBeat + (playY - y) / pxPerBeat;
}

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (e.ctrlKey) {
    pxPerBeat = Math.max(30, Math.min(400, pxPerBeat * (e.deltaY > 0 ? 0.9 : 1.1)));
    $<HTMLInputElement>('zoom').value = String(pxPerBeat);
  } else {
    cursorBeat = Math.max(0, snapBeat(cursorBeat - Math.sign(e.deltaY) / snap()));
  }
});
$<HTMLInputElement>('zoom').oninput = (e) =>
  (pxPerBeat = Number((e.target as HTMLInputElement).value));

canvas.addEventListener('pointerdown', (e) => {
  if (!chart) return;
  const { laneW, x0, n } = layout();
  const rect = canvas.getBoundingClientRect();
  const lane = Math.floor((e.clientX - rect.left - x0) / laneW);
  if (lane < 0 || lane >= n) return;
  const laneName = chart.lanes[lane]!;
  const beat = beatAtY(e.clientY - rect.top);
  const tol = 0.5 / snap();
  const hit = chart.notes.find(
    (nn) =>
      nn.lane === laneName &&
      beat >= nn.beat - tol &&
      beat <= nn.beat + Math.max(tol, nn.length ?? 0),
  );
  if (hit) {
    chart.notes.splice(chart.notes.indexOf(hit), 1);
    touched();
    return;
  }
  const b = Math.max(0, snapBeat(beat));
  const note: ChartNote = { beat: b, lane: laneName };
  chart.notes.push(note);
  drag = { note, startBeat: b };
  canvas.setPointerCapture(e.pointerId);
  touched();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const len = snapBeat(beatAtY(e.clientY - rect.top)) - drag.startBeat;
  if (len > 0) drag.note.length = len;
  else delete drag.note.length;
});
canvas.addEventListener('pointerup', () => {
  if (drag) touched();
  drag = null;
});

function draw() {
  requestAnimationFrame(draw);
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== Math.floor(canvas.clientWidth * dpr)) {
    canvas.width = Math.floor(canvas.clientWidth * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);
  }
  const { W, H, n, laneW, x0, playY } = layout();
  const c = ctx2d;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, W, H);

  if (player.playing && chart) {
    player.sampleClock(performance.now());
    const t = player.songTimeAt(performance.now());
    cursorBeat = tempo.secToBeat(t);
    if ($<HTMLInputElement>('ticks').checked) {
      for (const nn of chart.notes) {
        const nt = tempo.beatToSec(nn.beat);
        if (nt > lastTickTime && nt <= t) {
          tick();
          break;
        }
      }
    }
    lastTickTime = t;
  }

  c.fillStyle = '#010a03';
  c.fillRect(x0, 0, laneW * n, H);
  const bpb = chart?.timing.beatsPerBar ?? 4;
  const top = cursorBeat + playY / pxPerBeat;
  const bottom = cursorBeat - (H - playY) / pxPerBeat;
  const s = snap();
  for (let b = Math.floor(bottom * s) / s; b <= top; b += 1 / s) {
    if (b < 0) continue;
    const y = playY - (b - cursorBeat) * pxPerBeat;
    const isBeat = Math.abs(b - Math.round(b)) < 1e-6;
    const isBar = isBeat && Math.round(b) % bpb === 0;
    c.fillStyle = isBar
      ? 'rgba(57,255,106,0.5)'
      : isBeat
        ? 'rgba(57,255,106,0.22)'
        : 'rgba(57,255,106,0.07)';
    c.fillRect(x0, y, laneW * n, isBar ? 2 : 1);
    if (isBar) {
      c.fillStyle = '#39ff6a';
      c.font = '11px monospace';
      c.textAlign = 'right';
      c.fillText(`bar ${Math.round(b) / bpb + 1}`, x0 - 6, y + 4);
      c.textAlign = 'left';
      c.fillText(`b${Math.round(b)}`, x0 + laneW * n + 6, y + 4);
    }
  }
  for (let i = 0; i <= n; i++) {
    c.fillStyle = 'rgba(57,255,106,0.25)';
    c.fillRect(x0 + i * laneW, 0, 1, H);
  }
  if (chart) {
    chart.lanes.forEach((l, i) => {
      c.fillStyle = laneStyle(l, i).color;
      c.font = '11px monospace';
      c.textAlign = 'center';
      c.fillText(l, x0 + i * laneW + laneW / 2, H - 8);
    });
    for (const nn of chart.notes) {
      const i = chart.lanes.indexOf(nn.lane);
      if (i < 0) continue;
      const y = playY - (nn.beat - cursorBeat) * pxPerBeat;
      const color = laneStyle(nn.lane, i).color;
      if (nn.length) {
        const y2 = playY - (nn.beat + nn.length - cursorBeat) * pxPerBeat;
        c.fillStyle = color + '66';
        c.fillRect(x0 + i * laneW + laneW * 0.3, y2, laneW * 0.4, y - y2);
      }
      if (y < -20 || y > H + 20) continue;
      c.fillStyle = color;
      c.fillRect(x0 + i * laneW + 4, y - 7, laneW - 8, 14);
    }
  }
  c.fillStyle = '#e6ffe9';
  c.fillRect(x0 - 20, playY - 1, laneW * n + 40, 2);
  const sec = tempo.beatToSec(cursorBeat);
  $('pos').textContent =
    `beat ${cursorBeat.toFixed(2)} · ${sec.toFixed(2)} s${audio ? ` / ${audio.duration.toFixed(1)} s` : ' · no audio'}`;
}
requestAnimationFrame(draw);
status('load the demo, a chart, or audio + "create" to start');
