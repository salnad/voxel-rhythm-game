import { renderMetronome, Sfx } from './audio/sfx';
import { SongPlayer } from './audio/songPlayer';
import { PLAYER } from './config/gameplay';
import { loadSettings, saveSettings, type Settings } from './core/settings';
import {
  fetchMapIndex,
  loadBuiltinMap,
  loadCustomMap,
  loadHandoff,
  MapLoadError,
  type LoadedMap,
  type MapIndexEntry,
} from './game/maps';
import { PlayRunner } from './game/runner';
import type { GameSession } from './game/session';
import { DigitalRain } from './render/rain';
import { SynthPanel } from './ui/synthPanel';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const overlay = $('overlay');
const params = new URLSearchParams(location.search);

let settings: Settings = loadSettings();
const player = new SongPlayer();
const sfx = new Sfx(player.ctx);
const rain = new DigitalRain($('rain'));
let runner: PlayRunner | null = null;
let lastMap: LoadedMap | null = null;
let autoplay = params.get('autoplay') === '1';
let screen: 'menu' | 'play' | 'pause' | 'results' | 'other' = 'menu';

const synth = new SynthPanel($('synth-mount'), (p) => runner?.setPatch(p));

// idle rain on menus
let idleRaf = 0;
let idleLast = performance.now();
function idle(now: number) {
  idleRaf = requestAnimationFrame(idle);
  rain.update(Math.min(0.05, (now - idleLast) / 1000));
  idleLast = now;
}
idleRaf = requestAnimationFrame(idle);
window.addEventListener('resize', () => rain.resize());

function show(html: string): HTMLElement {
  overlay.innerHTML = `<div class="screen">${html}</div>`;
  return overlay.firstElementChild as HTMLElement;
}
function hide() {
  overlay.innerHTML = '';
}
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

// ------------------------------------------------------------------ menu

async function menu(): Promise<void> {
  screen = 'menu';
  let maps: MapIndexEntry[] = [];
  try {
    maps = await fetchMapIndex();
  } catch {
    /* offline? */
  }
  const el = show(`
    <h1>VOXEL//RHYTHM</h1>
    <div class="sub">hit the lanes. swing the sword. hold the line.</div>
    <div class="maps">
      ${maps
        .map(
          (
            m,
          ) => `<div class="map"><div><div class="title">${esc(m.title)}</div><div class="sub" style="margin:0">${esc(m.artist ?? '')}</div></div>
          <div>${m.charts.map((c) => `<button class="big" data-map="${esc(m.id)}" data-file="${esc(c.file)}">${esc(c.difficulty.toUpperCase())}</button>`).join('')}</div></div>`,
        )
        .join('')}
      <div class="map"><div><div class="title">CUSTOM MAP</div>
        <div class="sub" style="margin:4px 0 0">chart <input type="file" id="f-chart" accept=".json,application/json"></div>
        <div class="sub" style="margin:4px 0 0">audio <input type="file" id="f-audio" accept="audio/*"></div></div>
        <div><button class="big" id="b-custom">PLAY</button></div></div>
    </div>
    <label class="chk"><input type="checkbox" id="c-auto" ${autoplay ? 'checked' : ''}> autoplay (watch the bot)</label>
    <label class="chk"><input type="checkbox" id="c-nofail" ${settings.noFail ? 'checked' : ''}> no-fail</label>
    <div style="margin-top:14px">
      <button class="big" id="b-settings">SETTINGS</button>
      <button class="big" id="b-cal">CALIBRATE OFFSET</button>
      <button class="big" id="b-editor">MAP EDITOR</button>
    </div>
    <div class="help">
      <kbd>D</kbd> <kbd>F</kbd> <kbd>J</kbd> <kbd>K</kbd> hit lanes (kick / perc / bass / synth) &nbsp; hold long notes<br>
      <kbd>Esc</kbd> pause &nbsp; <kbd>Tab</kbd> show/hide the sword synth &nbsp; <kbd>R</kbd> retry on results<br>
      Each note is an enemy. Hit it on time and the sword cuts it down; miss and it gets through.<br>
      Tweak the WAVETABLE synth (bottom left) to change your sword: WT POS reshapes the swing arc,
      UNISON/DETUNE add echo slashes that build ECHO PARRY charges.
    </div>`);
  el.querySelectorAll<HTMLButtonElement>('button[data-map]').forEach((b) => {
    b.onclick = () => playBuiltin(b.dataset.map!, b.dataset.file!);
  });
  $<HTMLInputElement>('c-auto').onchange = (e) =>
    (autoplay = (e.target as HTMLInputElement).checked);
  $<HTMLInputElement>('c-nofail').onchange = (e) => {
    settings = { ...settings, noFail: (e.target as HTMLInputElement).checked };
    saveSettings(settings);
  };
  $('b-settings').onclick = settingsScreen;
  $('b-cal').onclick = calibrate;
  $('b-editor').onclick = () => window.open('/editor.html', '_blank');
  $('b-custom').onclick = async () => {
    const chartF = $<HTMLInputElement>('f-chart').files?.[0];
    const audioF = $<HTMLInputElement>('f-audio').files?.[0];
    if (!chartF) return errorScreen('Pick a chart .json file first.');
    await load(async () =>
      loadCustomMap(
        player.ctx,
        await chartF.text(),
        audioF ? await audioF.arrayBuffer() : undefined,
      ),
    );
  };
}

async function playBuiltin(id: string, file: string) {
  await load(() => loadBuiltinMap(player.ctx, id, file));
}

async function load(fn: () => Promise<LoadedMap>) {
  screen = 'other';
  await player.resumeContext();
  show('<h2>LOADING</h2><div class="sub">jacking in… rendering audio</div>');
  try {
    const map = await fn();
    lastMap = map;
    if (map.warnings.length) console.warn('chart warnings:\n' + map.warnings.join('\n'));
    startPlay(map);
  } catch (e) {
    if (e instanceof MapLoadError) errorScreen(e.message, e.details);
    else errorScreen(e instanceof Error ? e.message : String(e));
  }
}

// ------------------------------------------------------------------ play

function startPlay(map: LoadedMap) {
  runner?.stop();
  hide();
  synth.toggle(false);
  cancelAnimationFrame(idleRaf);
  screen = 'play';
  runner = new PlayRunner(
    { combatCanvas: $('combat'), highwayCanvas: $('highway'), labelLayer: $('labels') },
    map,
    player,
    sfx,
    rain,
    settings,
    synth.patch,
    autoplay,
    { onFrame: hud, onEnd: results },
  );
  runner.start();
}

function hud(s: GameSession) {
  const hp = s.sim.hp / PLAYER.maxHp;
  const fill = $('hp-fill');
  fill.style.width = `${hp * 100}%`;
  fill.classList.toggle('low', hp < 0.3);
  const charges = Math.floor(s.sim.parryCharge);
  const partial = s.sim.parryCharge - charges;
  $('parry').textContent =
    '◆'.repeat(charges) +
    (s.mods.echoCount > 0 ? `◇${Math.round(partial * 100)}%` : ' (needs UNISON > 1)');
  $('kills').textContent = String(s.sim.kills);
  $('score').textContent = String(s.score.score).padStart(7, '0');
  $('acc').textContent = `${(s.score.accuracy * 100).toFixed(2)}%`;
  $('mult').textContent = `x${s.score.multiplier}`;
}

function pause() {
  if (!runner || screen !== 'play') return;
  runner.pause();
  synth.toggle(true);
  screen = 'pause';
  const el = show(`<h2>PAUSED</h2>
    <button class="big" id="p-resume">RESUME</button>
    <button class="big" id="p-restart">RESTART</button>
    <button class="big" id="p-quit">QUIT</button>
    <div class="help">Audio offset ${settings.audioOffsetMs} ms · tweak the synth now, it applies on resume.</div>`);
  el.querySelector<HTMLButtonElement>('#p-resume')!.onclick = resume;
  el.querySelector<HTMLButtonElement>('#p-restart')!.onclick = () => lastMap && startPlay(lastMap);
  el.querySelector<HTMLButtonElement>('#p-quit')!.onclick = quit;
}

function resume() {
  if (!runner || screen !== 'pause') return;
  hide();
  synth.toggle(false);
  screen = 'play';
  runner.resume();
}

function quit() {
  synth.toggle(true);
  runner?.stop();
  runner = null;
  idleRaf = requestAnimationFrame(idle);
  void menu();
}

function results(s: GameSession, failed: boolean) {
  screen = 'results';
  const sc = s.score;
  const mean = sc.meanOffsetMs;
  const suggest = Math.round(settings.audioOffsetMs + mean);
  const el = show(`
    <div class="grade">${failed ? 'F' : sc.grade}</div>
    <h2>${failed ? 'SYSTEM FAILURE' : 'TRACK CLEAR'}</h2>
    <div class="sub">${esc(s.chart.file.meta.title)} · ${esc(s.chart.file.meta.difficulty ?? '')}${autoplay ? ' · AUTOPLAY' : ''}</div>
    <div class="stats">
      <div>SCORE</div><div>${sc.score}</div>
      <div>ACCURACY</div><div>${(sc.accuracy * 100).toFixed(2)}%</div>
      <div>MAX COMBO</div><div>${sc.maxCombo}</div>
      <div>PERFECT / GREAT / GOOD / MISS</div><div>${sc.counts.perfect} / ${sc.counts.great} / ${sc.counts.good} / ${sc.counts.miss}</div>
      <div>ENEMIES CUT</div><div>${s.sim.kills} / ${s.chart.notes.length}</div>
      <div>MEAN HIT OFFSET</div><div>${mean >= 0 ? '+' : ''}${mean.toFixed(1)} ms (${mean >= 0 ? 'late' : 'early'})</div>
    </div>
    ${!autoplay && Math.abs(mean) > 8 ? `<div class="help">Your hits average ${mean.toFixed(0)} ms ${mean > 0 ? 'late' : 'early'}. <button class="btn" id="r-apply">set audio offset to ${suggest} ms</button></div>` : ''}
    <div style="margin-top:16px"><button class="big" id="r-retry">RETRY [R]</button><button class="big" id="r-menu">MENU [Esc]</button></div>`);
  el.querySelector<HTMLButtonElement>('#r-retry')!.onclick = () => lastMap && startPlay(lastMap);
  el.querySelector<HTMLButtonElement>('#r-menu')!.onclick = quit;
  const apply = el.querySelector<HTMLButtonElement>('#r-apply');
  if (apply)
    apply.onclick = () => {
      settings = { ...settings, audioOffsetMs: suggest };
      saveSettings(settings);
      apply.textContent = `offset set to ${suggest} ms`;
    };
}

// ------------------------------------------------------------------ settings

function settingsScreen() {
  screen = 'other';
  const rows: Array<[keyof Settings, string, number, number, number]> = [
    ['audioOffsetMs', 'audio offset (ms)', -250, 250, 1],
    ['visualOffsetMs', 'visual offset (ms)', -150, 150, 1],
    ['scrollSpeed', 'scroll speed', 0.5, 2.5, 0.05],
    ['musicVolume', 'music volume', 0, 1, 0.01],
    ['hitsoundVolume', 'hitsound volume', 0, 1, 0.01],
  ];
  const el = show(`<h2>SETTINGS</h2>
    <div class="grid">
      ${rows
        .map(
          ([k, label, min, max, step]) =>
            `<span>${label}</span><input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${settings[k] as number}"><span data-v="${k}">${settings[k] as number}</span>`,
        )
        .join('')}
      <span>lane keys</span><span>${settings.keys4.map((k, i) => `<button class="btn" data-lane="${i}">${k.replace('Key', '')}</button>`).join(' ')}</span><span></span>
    </div>
    <div class="help">Audio offset: positive if you tend to hit late (or your audio output is delayed). Use CALIBRATE to measure it.<br>
    Visual offset only moves the highway drawing. Click a lane key, then press the new key.</div>
    <button class="big" id="s-back">BACK</button>`);
  el.querySelectorAll<HTMLInputElement>('input[data-k]').forEach((inp) => {
    inp.oninput = () => {
      const k = inp.dataset.k as keyof Settings;
      settings = { ...settings, [k]: Number(inp.value) };
      el.querySelector(`[data-v="${k}"]`)!.textContent = inp.value;
      saveSettings(settings);
    };
  });
  el.querySelectorAll<HTMLButtonElement>('button[data-lane]').forEach((b) => {
    b.onclick = () => {
      b.textContent = '…';
      const onKey = (e: KeyboardEvent) => {
        e.preventDefault();
        const keys = [...settings.keys4];
        keys[Number(b.dataset.lane)] = e.code;
        settings = { ...settings, keys4: keys };
        saveSettings(settings);
        b.textContent = e.code.replace('Key', '');
        window.removeEventListener('keydown', onKey, true);
      };
      window.addEventListener('keydown', onKey, true);
    };
  });
  $('s-back').onclick = () => void menu();
}

// ------------------------------------------------------------------ calibration

async function calibrate() {
  screen = 'other';
  await player.resumeContext();
  const bpm = 120;
  const beats = 32;
  const buf = await renderMetronome(bpm, beats);
  const offsets: number[] = [];
  const el = show(`<h2>CALIBRATE</h2>
    <div class="sub">Tap <kbd>Space</kbd> on every click. 4 count-in clicks, then tap along.</div>
    <div id="cal-out" style="font-size:22px;color:var(--w)">listening…</div>
    <div id="cal-taps" class="help"></div>
    <button class="big" id="cal-apply" disabled>APPLY</button><button class="big" id="cal-back">BACK</button>`);
  const prevOffset = player.userOffsetSec;
  player.userOffsetSec = 0;
  player.output.gain.cancelScheduledValues(0);
  player.output.gain.value = settings.musicVolume;
  player.setBuffer(buf);
  player.play(-0.5);
  const spb = 60 / bpm;
  let median = 0;
  const onKey = (e: KeyboardEvent) => {
    if (e.code !== 'Space' || e.repeat) return;
    e.preventDefault();
    const t = player.songTimeAt(e.timeStamp);
    const beat = Math.round(t / spb);
    if (beat < 4 || beat >= beats) return;
    offsets.push(t - beat * spb);
    const sorted = [...offsets].sort((a, b) => a - b);
    median = sorted[Math.floor(sorted.length / 2)]! * 1000;
    el.querySelector('#cal-out')!.textContent =
      `${median >= 0 ? '+' : ''}${median.toFixed(0)} ms (${offsets.length} taps)`;
    el.querySelector('#cal-taps')!.textContent = offsets
      .slice(-12)
      .map((o) => `${(o * 1000).toFixed(0)}`)
      .join('  ');
    (el.querySelector('#cal-apply') as HTMLButtonElement).disabled = offsets.length < 8;
  };
  window.addEventListener('keydown', onKey);
  const done = () => {
    window.removeEventListener('keydown', onKey);
    player.stop();
    player.userOffsetSec = prevOffset;
    void menu();
  };
  el.querySelector<HTMLButtonElement>('#cal-apply')!.onclick = () => {
    settings = { ...settings, audioOffsetMs: Math.round(median) };
    saveSettings(settings);
    done();
  };
  el.querySelector<HTMLButtonElement>('#cal-back')!.onclick = done;
}

function errorScreen(msg: string, details: string[] = []) {
  screen = 'other';
  const el = show(`<h2>ERROR</h2><div class="err">${esc(msg)}</div>
    ${details.length ? `<div class="err" style="margin-top:8px">${details.map(esc).join('\n')}</div>` : ''}
    <div style="margin-top:14px"><button class="big" id="e-back">BACK</button></div>`);
  el.querySelector<HTMLButtonElement>('#e-back')!.onclick = () => void menu();
}

// ------------------------------------------------------------------ keys

window.addEventListener('keydown', (e) => {
  if (e.code === 'Tab') {
    e.preventDefault();
    synth.toggle();
    return;
  }
  if (e.code === 'Escape') {
    if (screen === 'play') pause();
    else if (screen === 'pause') resume();
    else if (screen === 'results') quit();
  }
  if (e.code === 'KeyR' && screen === 'results' && lastMap) startPlay(lastMap);
});
window.addEventListener('blur', () => {
  if (screen === 'play' && !autoplay) pause();
});

// ------------------------------------------------------------------ boot

async function boot() {
  const map = params.get('map');
  if (map === 'editor') {
    await load(async () => {
      const m = await loadHandoff(player.ctx);
      if (!m) throw new MapLoadError('No chart was handed off from the editor.');
      return m;
    });
    return;
  }
  if (map && params.get('autostart') === '1') {
    const diff = params.get('diff') ?? 'normal';
    await playBuiltin(map, diff === 'normal' ? 'chart.json' : `chart-${diff}.json`);
    return;
  }
  await menu();
}
void boot();
