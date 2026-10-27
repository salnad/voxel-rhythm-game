/**
 * Offline audit of an action → music mapping's effects, run in a browser (it needs Web Audio):
 * `node scripts/fx-audit/run.mjs` imports this through the Vite dev server.
 *
 * It renders the demo song through the real MusicEngine, GameSession and mapping layer on an
 * OfflineAudioContext, pressing every cue perfectly, stepped like the game's frame loop
 * (60 Hz ticks) with a simulated output latency. Passes: the song with no effects (dry), then
 * one pass per action where only that action's effect is allowed to play. Each cue's effect is
 * measured against the dry render in the band laptop speakers reproduce (200 Hz - 8 kHz).
 */
import { mixStems } from '../../src/audio/demo/render';
import { MusicEngine } from '../../src/audio/musicEngine';
import { Sfx } from '../../src/audio/sfx';
import type { Action } from '../../src/chart/types';
import { ACTIONS } from '../../src/chart/types';
import { musicMapping } from '../../src/config/musicMapping';
import { loadBuiltinMap } from '../../src/game/maps';
import { GameSession } from '../../src/game/session';
import type { LaneInput } from '../../src/rhythm/input';
import { DEFAULT_PATCH } from '../../src/synth/patch';

export interface AuditOptions {
  mapping: string;
  /** Simulated output latency (s). */
  latency: number;
  fromBar: number;
  bars: number;
  chartFile: string;
  /** Render the song as one "mix" stem, like an audio-file map. */
  fileMap: boolean;
  /** Skip (miss) this action's cues instead of hitting them, to measure the fumbles. */
  missAction: Action | null;
}

const SR = 44100;
const LEAD = 0.5;
const TICK = 1 / 60;
const N = 1024;
const HOP = 256;
const LO_HZ = 200;
const HI_HZ = 8000;
const HF_HZ = 1500;
/** A frame whose band levels differ from dry by this much (RMS dB) counts as audibly changed. */
const AUDIBLE_DB = 3;

interface Render {
  post: Float32Array;
  pre: Float32Array;
  peak: number;
  clipped: number;
  base: number;
  cues: Array<{ action: Action; time: number; beat: number; barEnd: number }>;
}

async function render(o: AuditOptions, only: Action | 'none' | 'all'): Promise<Render> {
  const loader = new OfflineAudioContext(2, 1, SR);
  const map = await loadBuiltinMap(loader, 'demo', o.chartFile);
  const chart = map.chart;
  const stems = o.fileMap ? { mix: mixStems(map.stems as never) } : map.stems;
  const end = chart.bars[Math.min(chart.bars.length - 1, o.fromBar + o.bars)]!.startSec;
  const frames = Math.ceil((end + LEAD + 1.5) * SR);
  const ctx = new OfflineAudioContext({ numberOfChannels: 4, length: frames, sampleRate: SR });
  ctx.destination.channelCount = 4;
  ctx.destination.channelInterpretation = 'discrete';
  Object.defineProperty(ctx, 'outputLatency', { value: o.latency });
  const actx = ctx as unknown as AudioContext;
  const engine = new MusicEngine(actx, chart, stems);
  engine.output.gain.value = 0.8;
  // pre-master tap (the music bus, before the engine's dynamics) on channels 3-4
  const merger = ctx.createChannelMerger(4);
  const split = ctx.createChannelSplitter(2);
  engine.musicBus.connect(split);
  split.connect(merger, 0, 2);
  split.connect(merger, 1, 3);
  merger.connect(ctx.destination);
  const session = new GameSession(chart, { noFail: true, patch: DEFAULT_PATCH });
  const sfx = new Sfx(ctx);
  sfx.output.disconnect();
  const allowed = (a: Action) => only === 'all' || only === a;
  const facade = new Proxy(session, {
    get(target, prop, recv) {
      if (prop !== 'bus') return Reflect.get(target, prop, recv);
      const bus = target.bus;
      return new Proxy(bus, {
        get(b, p, r) {
          if (p !== 'on') return Reflect.get(b, p, r);
          return (type: string, fn: (e: unknown) => void) =>
            b.on(
              type as never,
              ((e: { action?: Action }) => {
                if (type === 'action' && e.action && !allowed(e.action)) return;
                fn(e);
              }) as never,
            );
        },
      });
    },
  });
  const layer =
    only === 'none'
      ? null
      : musicMapping(o.mapping).create({ ctx: actx, engine, sfx, chart, session: facade });

  engine.start(-LEAD);
  const anchor = (engine as unknown as { anchor: number }).anchor;
  const base = anchor - o.latency;
  const pending: LaneInput[] = [];
  const queued = new Set<number>();
  const cues: Render['cues'] = [];
  session.bus.on('cues', (list) => {
    for (const c of list) {
      if (queued.has(c.id)) continue;
      queued.add(c.id);
      const play = session.conductor.plays[c.play]!;
      if (c.bar >= o.fromBar && c.bar < o.fromBar + o.bars)
        cues.push({
          action: c.action,
          time: c.time,
          beat: play.dur / chart.beatsPerBar,
          barEnd: play.start + play.dur,
        });
      if (o.missAction === c.action) continue;
      pending.push({ lane: c.lane, down: true, time: c.time });
      pending.push({ lane: c.lane, down: false, time: c.endTime ?? c.time + 0.06 });
    }
  });
  const tick = () => {
    const t = ctx.currentTime - base - o.latency;
    pending.sort((a, b) => a.time - b.time);
    const due: LaneInput[] = [];
    while (pending.length && pending[0]!.time <= t) due.push(pending.shift()!);
    session.step(due, t);
    engine.schedule(session.conductor.plays, t);
    layer?.update?.(t);
  };
  const last = frames / SR - 0.05;
  for (let k = 1; k * TICK < last; k++) {
    void ctx.suspend(k * TICK).then(() => {
      tick();
      void ctx.resume();
    });
  }
  const buf = await ctx.startRendering();
  layer?.dispose?.();
  const mono = (a: number, b: number) => {
    const x = buf.getChannelData(a);
    const y = buf.getChannelData(b);
    const out = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) out[i] = 0.5 * (x[i]! + y[i]!);
    return out;
  };
  let peak = 0;
  let clipped = 0;
  for (const ch of [0, 1]) {
    for (const v of buf.getChannelData(ch)) {
      const a = Math.abs(v);
      if (a > peak) peak = a;
      if (a >= 1) clipped++;
    }
  }
  return { post: mono(0, 1), pre: mono(2, 3), peak, clipped, base, cues };
}

// ── analysis ────────────────────────────────────────────────────────────────

function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j]!, re[i]!];
      [im[i], im[j]] = [im[j]!, im[i]!];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(ang * k);
        const wi = Math.sin(ang * k);
        const a = i + k;
        const b = a + len / 2;
        const xr = re[b]! * wr - im[b]! * wi;
        const xi = re[b]! * wi + im[b]! * wr;
        re[b] = re[a]! - xr;
        im[b] = im[a]! - xi;
        re[a] = re[a]! + xr;
        im[a] = im[a]! + xi;
      }
    }
  }
}

/** Third-octave band edges between LO_HZ and HI_HZ, as FFT bin ranges. */
const BANDS: Array<[number, number]> = (() => {
  const out: Array<[number, number]> = [];
  for (let f = LO_HZ; f < HI_HZ; f *= Math.pow(2, 1 / 3)) {
    const a = Math.round((f * N) / SR);
    const b = Math.max(a + 1, Math.round((f * Math.pow(2, 1 / 3) * N) / SR));
    out.push([a, b]);
  }
  return out;
})();
const HF_BIN = Math.round((HF_HZ * N) / SR);
const HI_BIN = Math.round((HI_HZ * N) / SR);
const LO_BIN = Math.round((LO_HZ * N) / SR);

interface Frames {
  bands: Float64Array[];
  level: Float64Array;
  hf: Float64Array;
}

function analyse(x: Float32Array): Frames {
  const count = Math.floor((x.length - N) / HOP);
  const win = Float64Array.from(
    { length: N },
    (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N),
  );
  const bands: Float64Array[] = [];
  const level = new Float64Array(count);
  const hf = new Float64Array(count);
  const re = new Float64Array(N);
  const im = new Float64Array(N);
  const db = (e: number) => 10 * Math.log10(e + 1e-10);
  for (let f = 0; f < count; f++) {
    for (let i = 0; i < N; i++) {
      re[i] = x[f * HOP + i]! * win[i]!;
      im[i] = 0;
    }
    fft(re, im);
    const pow = (k: number) => re[k]! * re[k]! + im[k]! * im[k]!;
    const b = new Float64Array(BANDS.length);
    BANDS.forEach(([lo, hi], j) => {
      let e = 0;
      for (let k = lo; k < hi; k++) e += pow(k);
      b[j] = db(e);
    });
    bands.push(b);
    let all = 0;
    let h = 0;
    for (let k = LO_BIN; k < HI_BIN; k++) {
      all += pow(k);
      if (k >= HF_BIN) h += pow(k);
    }
    level[f] = db(all);
    hf[f] = db(h);
  }
  return { bands, level, hf };
}

export interface CueMetric {
  action: Action;
  time: number;
  /** Largest band-level difference from dry (RMS over bands, dB). */
  peakDb: number;
  /** How long the effect audibly changes the music (ms with > AUDIBLE_DB difference). */
  audibleMs: number;
  /** From the press (as heard) to the first audibly changed frame (ms); null if none. */
  onsetMs: number | null;
  /** Deepest 200 Hz - 8 kHz level drop vs dry (dB, negative = quieter). */
  levelDb: number;
  /** Deepest drop above 1.5 kHz vs dry (dB). */
  hfDb: number;
}

function median(v: number[]): number {
  const s = [...v].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)]! : NaN;
}

function measure(
  dry: Frames,
  wet: Frames,
  base: number,
  cues: Render['cues'],
  action: Action,
): CueMetric[] {
  const own = cues.filter((c) => c.action === action).sort((a, b) => a.time - b.time);
  const frameAt = (t: number) => Math.round(((base + t) * SR - N / 2) / HOP);
  const hopMs = (HOP / SR) * 1000;
  return own.map((c, i) => {
    const next = own[i + 1]?.time ?? Infinity;
    const span = action === 'flourish' ? c.barEnd - c.time + 2 * c.beat : 2 * c.beat;
    const stop = Math.min(c.time + span, next);
    const f0 = frameAt(c.time);
    const f1 = Math.min(frameAt(stop), wet.level.length - 1, dry.level.length - 1);
    let peakDb = 0;
    let audible = 0;
    let onset: number | null = null;
    let levelDb = 0;
    let hfDb = 0;
    for (let f = Math.max(0, f0); f <= f1; f++) {
      const w = wet.bands[f]!;
      const d = dry.bands[f]!;
      let s = 0;
      for (let j = 0; j < w.length; j++) {
        const diff = Math.max(-40, Math.min(40, w[j]! - d[j]!));
        s += diff * diff;
      }
      const lsd = Math.sqrt(s / w.length);
      if (lsd > peakDb) peakDb = lsd;
      if (lsd > AUDIBLE_DB) {
        audible++;
        onset ??= (f - f0) * hopMs;
      }
      levelDb = Math.min(levelDb, wet.level[f]! - dry.level[f]!);
      hfDb = Math.min(hfDb, wet.hf[f]! - dry.hf[f]!);
    }
    return {
      action,
      time: c.time,
      peakDb,
      audibleMs: audible * hopMs,
      onsetMs: onset,
      levelDb,
      hfDb,
    };
  });
}

export interface ActionSummary {
  cues: number;
  peakDb: number;
  audibleMs: number;
  onsetMs: number;
  levelDb: number;
  hfDb: number;
  /** Same level drop measured before the engine's master dynamics (pump only). */
  preLevelDb: number;
}

export interface AuditReport {
  options: AuditOptions;
  actions: Partial<Record<Action, ActionSummary>>;
  dry: { peak: number; clipped: number };
  all: { peak: number; clipped: number };
  /** The dry song's own level dip after each BLOCK cue (the baked-in sidechain), dB. */
  dryPumpDb: number;
}

export async function runAudit(partial: Partial<AuditOptions> = {}): Promise<AuditReport> {
  const o: AuditOptions = {
    mapping: 'fx',
    latency: 0.03,
    fromBar: 16,
    bars: 16,
    chartFile: 'chart.json',
    fileMap: false,
    missAction: null,
    ...partial,
  };
  const dryR = await render(o, 'none');
  const dryPost = analyse(dryR.post);
  const dryPre = analyse(dryR.pre);
  const report: AuditReport = {
    options: o,
    actions: {},
    dry: { peak: dryR.peak, clipped: dryR.clipped },
    all: { peak: 0, clipped: 0 },
    dryPumpDb: 0,
  };
  const actions = o.missAction ? [o.missAction] : ACTIONS;
  for (const a of actions) {
    const r = await render(o, a);
    const post = measure(dryPost, analyse(r.post), r.base, r.cues, a);
    const pre = measure(dryPre, analyse(r.pre), r.base, r.cues, a);
    report.actions[a] = {
      cues: post.length,
      peakDb: median(post.map((m) => m.peakDb)),
      audibleMs: median(post.map((m) => m.audibleMs)),
      onsetMs: median(post.map((m) => m.onsetMs ?? Infinity)),
      levelDb: median(post.map((m) => m.levelDb)),
      hfDb: median(post.map((m) => m.hfDb)),
      preLevelDb: median(pre.map((m) => m.levelDb)),
    };
  }
  const allR = await render(o, 'all');
  report.all = { peak: allR.peak, clipped: allR.clipped };
  // the dry song's own pump: level right after each kick vs just before it
  const frameAt = (t: number) => Math.round(((dryR.base + t) * SR - N / 2) / HOP);
  const dips = dryR.cues
    .filter((c) => c.action === 'block')
    .map((c) => {
      const before = dryPost.level[frameAt(c.time - 0.08)]!;
      let lo = Infinity;
      for (let f = frameAt(c.time + 0.03); f <= frameAt(c.time + 0.25); f++)
        lo = Math.min(lo, dryPost.level[f]!);
      return lo - before;
    });
  report.dryPumpDb = median(dips);
  return report;
}
