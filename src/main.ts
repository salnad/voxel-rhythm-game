import { renderMetronome, Sfx } from './audio/sfx';
import { SongPlayer } from './audio/songPlayer';
import { PLAYER } from './config/gameplay';
import { ACTIONS } from './chart/types';
import { ACTION_SPECS } from './config/actions';
import { chooseMapping, urlWithMapping } from './config/mappingChoice';
import { DEFAULT_MUSIC_MAPPING, MUSIC_MAPPINGS } from './config/musicMapping';
import { KEY_PRESETS, keyLabel, loadSettings, saveSettings, type Settings } from './core/settings';
import {
  fetchMapIndex,
  loadBuiltinMap,
  loadCustomMap,
  loadHandoff,
  MapLoadError,
  type LoadedMap,
  type MapIndexEntry,
} from './game/maps';
import { loadExperimentMap } from './experiments/load';
import { EXPERIMENTS, experimentByKey } from './experiments/registry';
import type { Experiment } from './experiments/types';
import { PlayRunner } from './game/runner';
import type { GameSession } from './game/session';
import { DigitalRain } from './render/rain';
import { PlaytestLab } from './ui/lab';
import { SynthPanel } from './ui/synthPanel';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const overlay = $('overlay');
const params = new URLSearchParams(location.search);

let settings: Settings = loadSettings();
/** The saved mapping. `settings.musicMapping` holds what plays, which `?mapping=` can override. */
let savedMapping = settings.musicMapping;
const initialMapping = chooseMapping(
  params.get('mapping'),
  savedMapping,
  MUSIC_MAPPINGS,
  DEFAULT_MUSIC_MAPPING,
);
settings = { ...settings, musicMapping: initialMapping.key };
let unknownMapping = initialMapping.unknown;

function persist() {
  saveSettings({ ...settings, musicMapping: savedMapping });
}

function setMapping(key: string) {
  settings = { ...settings, musicMapping: key };
  savedMapping = key;
  unknownMapping = null;
  persist();
  history.replaceState(null, '', urlWithMapping(location.href, key));
}
const player = new SongPlayer();
const sfx = new Sfx(player.ctx);
const rain = new DigitalRain($('rain'));
let runner: PlayRunner | null = null;
let lastMap: LoadedMap | null = null;
/** The experiment of the last play (null for a regular map). */
let lastExp: Experiment | null = null;
let autoplay = params.get('autoplay') === '1';
/** `?failbars=41,57`: autoplay misses once on the first try of these bars (demo a retry). */
const autoplayFailBars = (params.get('failbars') ?? '').split(',').filter(Boolean).map(Number);
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

function lanesHelp(): string {
  return `<div class="lanes-help">${ACTIONS.map((a, i) => {
    const spec = ACTION_SPECS[a];
    return `<div class="lane" style="color:${spec.color}"><b>[${esc(keyLabel(settings.keys4[i] ?? ''))}] ${spec.label}</b>when the enemy ${spec.telegraph}</div>`;
  }).join('')}</div>`;
}

function show(html: string): HTMLElement {
  overlay.innerHTML = `<div class="screen">${html}</div>`;
  return overlay.firstElementChild as HTMLElement;
}
function hide() {
  overlay.innerHTML = '';
}
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

// ------------------------------------------------------------------ menu

function mappingSelector(): string {
  const current = musicMappingLabel(settings.musicMapping);
  return `<div class="mapping" role="radiogroup" aria-label="actions to music">
      <div class="mapping-head">ACTIONS → MUSIC</div>
      <div class="mapping-opts">${Object.entries(MUSIC_MAPPINGS)
        .map(
          ([k, m]) =>
            `<button class="mapping-opt" role="radio" data-mapping="${esc(k)}" aria-checked="${k === settings.musicMapping}" title="${esc(m.description)}">${esc(m.label)}</button>`,
        )
        .join('')}</div>
      <div class="mapping-desc">${esc(MUSIC_MAPPINGS[settings.musicMapping]?.description ?? '')}</div>
      ${unknownMapping ? `<div class="warn">This version has no "${esc(unknownMapping)}" mapping, so it plays ${esc(current)}.</div>` : ''}
    </div>`;
}

function experimentsBlock(): string {
  return `<div class="experiments">
      <div class="mapping-head">GAMEPLAY EXPERIMENTS <button class="big" id="b-lab">PLAYTEST LAB</button></div>
      <div class="exp-opts">${EXPERIMENTS.map(
        (e) =>
          `<button class="exp-opt" data-exp="${esc(e.key)}" title="${esc(e.tagline)}"><b>${esc(e.label)}</b><span>${esc(e.tagline)}</span></button>`,
      ).join('')}</div>
    </div>`;
}

/** Show an experiment's 10-second how-to (preloading its song meanwhile), then play it. */
async function runExperiment(exp: Experiment, header: string, onBack: () => void) {
  screen = 'other';
  await player.resumeContext();
  const mapP = loadExperimentMap(exp);
  mapP.catch(() => undefined);
  const legend = exp.options?.keyLegend ?? settings.keys4.map(keyLabel).join(' ');
  let left = HOWTO_SECONDS;
  const el = show(`
    <div class="sub">${esc(header)}</div>
    <h2>${esc(exp.label)}</h2>
    <div class="sub">${esc(exp.tagline)}</div>
    <div class="howto"><div class="howto-keys">${esc(legend)}</div>
      <ul>${exp.howTo.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></div>
    <div class="howto-count">starting in <b id="h-left">${left}</b> · <kbd>Space</kbd> start now · <kbd>Esc</kbd> back</div>`);
  let done = false;
  const go = async (start: boolean) => {
    if (done) return;
    done = true;
    clearInterval(timer);
    window.removeEventListener('keydown', onKey, true);
    if (!start) return onBack();
    if (!el.isConnected) return;
    show('<h2>LOADING</h2><div class="sub">rendering audio…</div>');
    try {
      const map = await mapP;
      lastMap = map;
      startPlay(map, exp);
    } catch (e) {
      if (e instanceof MapLoadError) errorScreen(e.message, e.details);
      else errorScreen(e instanceof Error ? e.message : String(e));
    }
  };
  const timer = setInterval(() => {
    left--;
    const n = el.querySelector('#h-left');
    if (n) n.textContent = String(left);
    if (left <= 0) void go(true);
  }, 1000);
  const onKey = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      void go(true);
    } else if (e.code === 'Escape') {
      e.stopPropagation();
      void go(false);
    }
  };
  window.addEventListener('keydown', onKey, true);
}

const HOWTO_SECONDS = 10;

const lab = new PlaytestLab({
  show,
  offScreen: () => {
    runner?.stop();
    runner = null;
    screen = 'other';
  },
  runTrial: (exp, header, onBack) => void runExperiment(exp, header, onBack),
  menu: () => void menu(),
  calibrate: () => void calibrate(),
  build: __BUILD_ID__,
});

function musicMappingLabel(key: string): string {
  return MUSIC_MAPPINGS[key]?.label ?? (key === 'none' ? 'EXPERIMENT AUDIO' : key);
}

function bindMappingSelector(el: HTMLElement) {
  el.querySelectorAll<HTMLButtonElement>('button[data-mapping]').forEach((b) => {
    b.onclick = () => {
      setMapping(b.dataset.mapping!);
      el.querySelector('.mapping')!.outerHTML = mappingSelector();
      bindMappingSelector(el);
    };
  });
}

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
    <div class="sub">one enemy at a time. four keys. every key is a sword move.</div>
    ${experimentsBlock()}
    ${mappingSelector()}
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
    ${lanesHelp()}
    <div class="help">
      ${settings.keys4.map((k) => `<kbd>${esc(keyLabel(k))}</kbd>`).join(' ')} block / slash / stab / flourish (change keys in SETTINGS) &nbsp; hold long cues<br>
      <kbd>Esc</kbd> pause &nbsp; <kbd>Tab</kbd> show/hide the sword synth &nbsp; <kbd>R</kbd> retry on results<br>
      One enemy at a time. Read its telegraph, hit the matching action as its cue reaches the line.
      Gold-railed measures are BOSS COMBOS: miss once and you take damage, the music glitches, and the measure repeats.
      Start with EASY. Tweak the WAVETABLE synth to change your sword: WT POS reshapes slashes,
      UNISON adds echo blades that build ECHO PARRY (it saves you from a missed block).
    </div>`);
  el.querySelectorAll<HTMLButtonElement>('button[data-map]').forEach((b) => {
    b.onclick = () => playBuiltin(b.dataset.map!, b.dataset.file!);
  });
  el.querySelectorAll<HTMLButtonElement>('button[data-exp]').forEach((b) => {
    b.onclick = () => {
      const exp = experimentByKey(b.dataset.exp);
      if (exp) runExperiment(exp, 'EXPERIMENT', () => void menu());
    };
  });
  $('b-lab').onclick = () => lab.home();
  bindMappingSelector(el);
  $<HTMLInputElement>('c-auto').onchange = (e) =>
    (autoplay = (e.target as HTMLInputElement).checked);
  $<HTMLInputElement>('c-nofail').onchange = (e) => {
    settings = { ...settings, noFail: (e.target as HTMLInputElement).checked };
    persist();
  };
  $('b-settings').onclick = settingsScreen;
  $('b-cal').onclick = calibrate;
  $('b-editor').onclick = () => window.open(`${import.meta.env.BASE_URL}editor.html`, '_blank');
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

async function load(fn: () => Promise<LoadedMap>, exp: Experiment | null = null) {
  screen = 'other';
  await player.resumeContext();
  show('<h2>LOADING</h2><div class="sub">jacking in… rendering audio</div>');
  try {
    const map = await fn();
    lastMap = map;
    if (map.warnings.length) console.warn('chart warnings:\n' + map.warnings.join('\n'));
    startPlay(map, exp);
  } catch (e) {
    if (e instanceof MapLoadError) errorScreen(e.message, e.details);
    else errorScreen(e instanceof Error ? e.message : String(e));
  }
}

// ------------------------------------------------------------------ play

function startPlay(map: LoadedMap, exp: Experiment | null = null) {
  lastExp = exp;
  runner?.stop();
  hide();
  synth.toggle(false);
  cancelAnimationFrame(idleRaf);
  screen = 'play';
  runner = new PlayRunner(
    { arenaCanvas: $('arena'), hudCanvas: $('hud'), labelLayer: $('labels') },
    map,
    player.ctx,
    sfx,
    rain,
    settings,
    synth.patch,
    { autoplay, autoplayFailBars, experiment: exp },
    { onFrame: hud, onEnd: results },
  );
  runner.start();
}

function hud(s: GameSession) {
  const hp = s.duel.hp / PLAYER.maxHp;
  const fill = $('hp-fill');
  fill.style.width = `${hp * 100}%`;
  fill.classList.toggle('low', hp < 0.3);
  const charges = Math.floor(s.duel.parryCharge);
  const partial = s.duel.parryCharge - charges;
  $('parry').textContent =
    '◆'.repeat(charges) +
    (s.mods.echoCount > 0 ? `◇${Math.round(partial * 100)}%` : ' (needs UNISON > 1)');
  $('kills').textContent = `${s.duel.defeated} / ${s.chart.encounters.length}`;
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
  el.querySelector<HTMLButtonElement>('#p-restart')!.onclick = () =>
    lastMap && startPlay(lastMap, lastExp);
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
  if (lab.active) lab.trialQuit();
  else void menu();
}

function results(s: GameSession, failed: boolean) {
  if (lab.active) {
    synth.toggle(true);
    idleRaf = requestAnimationFrame(idle);
    lab.trialEnded(s);
    return;
  }
  screen = 'results';
  const sc = s.score;
  const mean = sc.meanOffsetMs;
  const suggest = Math.round(settings.audioOffsetMs + mean);
  const el = show(`
    <div class="grade">${failed ? 'F' : sc.grade}</div>
    <h2>${failed ? 'SYSTEM FAILURE' : 'TRACK CLEAR'}</h2>
    <div class="sub">${lastExp ? `${esc(lastExp.label)} · ` : ''}${esc(s.chart.file.meta.title)} · ${esc(s.chart.file.meta.difficulty ?? '')} · ${esc(musicMappingLabel(lastExp?.options?.musicMapping ?? settings.musicMapping))}${autoplay ? ' · AUTOPLAY' : ''}</div>
    <div class="stats">
      <div>SCORE</div><div>${sc.score}</div>
      <div>ACCURACY</div><div>${(sc.accuracy * 100).toFixed(2)}%</div>
      <div>MAX COMBO</div><div>${sc.maxCombo}</div>
      <div>PERFECT / GREAT / GOOD / MISS</div><div>${sc.counts.perfect} / ${sc.counts.great} / ${sc.counts.good} / ${sc.counts.miss}</div>
      <div>ENEMIES DEFEATED</div><div>${s.duel.defeated} / ${s.chart.encounters.length}${s.duel.escaped ? ` (${s.duel.escaped} escaped)` : ''}</div>
      <div>HITS TAKEN</div><div>${s.duel.hitsTaken}</div>
      <div>BOSS COMBOS CLEARED / FAILED</div><div>${s.combosCleared} / ${s.combosFailed}</div>
      <div>MEAN HIT OFFSET</div><div>${mean >= 0 ? '+' : ''}${mean.toFixed(1)} ms (${mean >= 0 ? 'late' : 'early'})</div>
    </div>
    ${!autoplay && Math.abs(mean) > 8 ? `<div class="help">Your hits average ${mean.toFixed(0)} ms ${mean > 0 ? 'late' : 'early'}. <button class="btn" id="r-apply">set audio offset to ${suggest} ms</button></div>` : ''}
    <div style="margin-top:16px"><button class="big" id="r-retry">RETRY [R]</button><button class="big" id="r-menu">MENU [Esc]</button></div>`);
  el.querySelector<HTMLButtonElement>('#r-retry')!.onclick = () =>
    lastMap && startPlay(lastMap, lastExp);
  el.querySelector<HTMLButtonElement>('#r-menu')!.onclick = quit;
  const apply = el.querySelector<HTMLButtonElement>('#r-apply');
  if (apply)
    apply.onclick = () => {
      settings = { ...settings, audioOffsetMs: suggest };
      persist();
      apply.textContent = `offset set to ${suggest} ms`;
    };
}

// ------------------------------------------------------------------ settings

function keyButtons(): string {
  return ACTIONS.map(
    (a, i) =>
      `<button class="btn" data-lane="${i}" style="color:${ACTION_SPECS[a].color};border-color:${ACTION_SPECS[a].color}">${ACTION_SPECS[a].label} ${esc(keyLabel(settings.keys4[i] ?? ''))}</button>`,
  ).join(' ');
}

function settingsScreen() {
  screen = 'other';
  const rows: Array<[keyof Settings, string, number, number, number]> = [
    ['audioOffsetMs', 'audio offset (ms)', -250, 250, 1],
    ['visualOffsetMs', 'visual offset (ms)', -150, 150, 1],
    ['scrollSpeed', 'cue speed', 0.5, 2.5, 0.05],
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
      <span>key preset</span><span><select id="s-preset">${KEY_PRESETS.map((p, i) => `<option value="${i}" ${p.keys.join() === settings.keys4.join() ? 'selected' : ''}>${p.name}</option>`).join('')}<option value="-1" ${KEY_PRESETS.some((p) => p.keys.join() === settings.keys4.join()) ? '' : 'selected'}>custom</option></select></span><span></span>
      <span>action keys</span><span id="s-keys">${keyButtons()}</span><span></span>
      <span>actions → music</span><span><select id="s-music">${Object.entries(MUSIC_MAPPINGS)
        .map(
          ([k, m]) =>
            `<option value="${k}" ${k === settings.musicMapping ? 'selected' : ''}>${m.label}</option>`,
        )
        .join('')}</select></span><span></span>
    </div>
    <div class="help">Audio offset: positive if you tend to hit late (or your audio output is delayed). Use CALIBRATE to measure it.<br>
    Visual offset only moves the cue drawing. Cue speed: higher = cues arrive faster and sit further apart.<br>
    Pick a preset, or click an action's key and press the new key.<br>
    Actions → music picks how your moves interact with the song (applies on the next play).</div>
    <button class="big" id="s-back">BACK</button>`);
  el.querySelectorAll<HTMLInputElement>('input[data-k]').forEach((inp) => {
    inp.oninput = () => {
      const k = inp.dataset.k as keyof Settings;
      settings = { ...settings, [k]: Number(inp.value) };
      el.querySelector(`[data-v="${k}"]`)!.textContent = inp.value;
      persist();
    };
  });
  const bindKeys = () => {
    el.querySelectorAll<HTMLButtonElement>('button[data-lane]').forEach((b) => {
      b.onclick = () => {
        b.textContent = '…';
        const onKey = (e: KeyboardEvent) => {
          e.preventDefault();
          const keys = [...settings.keys4];
          const lane = Number(b.dataset.lane);
          const clash = keys.indexOf(e.code);
          if (clash >= 0 && clash !== lane) keys[clash] = keys[lane]!;
          keys[lane] = e.code;
          settings = { ...settings, keys4: keys };
          persist();
          window.removeEventListener('keydown', onKey, true);
          el.querySelector('#s-keys')!.innerHTML = keyButtons();
          (el.querySelector('#s-preset') as HTMLSelectElement).value = String(
            KEY_PRESETS.findIndex((p) => p.keys.join() === keys.join()),
          );
          bindKeys();
        };
        window.addEventListener('keydown', onKey, true);
      };
    });
  };
  bindKeys();
  el.querySelector<HTMLSelectElement>('#s-music')!.onchange = (e) =>
    setMapping((e.target as HTMLSelectElement).value);
  el.querySelector<HTMLSelectElement>('#s-preset')!.onchange = (e) => {
    const p = KEY_PRESETS[Number((e.target as HTMLSelectElement).value)];
    if (!p) return;
    settings = { ...settings, keys4: [...p.keys] };
    persist();
    el.querySelector('#s-keys')!.innerHTML = keyButtons();
    bindKeys();
  };
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
    persist();
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
  if (e.code === 'KeyR' && screen === 'results' && lastMap) startPlay(lastMap, lastExp);
});
window.addEventListener('blur', () => {
  if (screen === 'play' && !autoplay) pause();
});

// ------------------------------------------------------------------ boot

async function boot() {
  if (params.get('lab') === '1') return lab.home();
  const expKey = params.get('exp');
  if (expKey) {
    const exp = experimentByKey(expKey);
    if (!exp) return errorScreen(`This version has no experiment "${expKey}".`);
    if (params.get('autostart') === '1') {
      return load(() => loadExperimentMap(exp), exp);
    }
    return runExperiment(exp, 'EXPERIMENT', () => void menu());
  }
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
    const diff = params.get('diff') ?? 'easy';
    await playBuiltin(map, diff === 'normal' ? 'chart.json' : `chart-${diff}.json`);
    return;
  }
  await menu();
}
void boot();
