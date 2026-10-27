import type { SynthPatch } from '../../synth/patch';
import { DEFAULT_PATCH } from '../../synth/patch';
import { playLeadNote } from '../leadVoice';
import {
  composeDemo,
  DEMO_BPM,
  DEMO_LENGTH_BEATS,
  PARTS,
  type CompEvent,
  type Part,
  type Vowel,
} from './composition';

export type Stems = Record<Part, AudioBuffer>;

/** The song's own lead sound (the stem). The player's patch can voice it live instead. */
export const SONG_LEAD_PATCH: SynthPatch = {
  ...DEFAULT_PATCH,
  wtPosition: 0.62,
  unison: 5,
  detune: 0.45,
  cutoff: 0.72,
  resonance: 0.25,
};

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

function makeShaper(ctx: BaseAudioContext, drive: number, crushSteps = 0): WaveShaperNode {
  const n = 2048;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    let y = Math.tanh(x * drive) / Math.tanh(drive);
    if (crushSteps > 0) y = Math.round(y * crushSteps) / crushSteps;
    curve[i] = y;
  }
  const s = ctx.createWaveShaper();
  s.curve = curve;
  s.oversample = '2x';
  return s;
}

function noiseBuffer(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = buf.getChannelData(0);
  let s = 12345;
  for (let i = 0; i < d.length; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    d[i] = (s / 0x7fffffff) * 2 - 1;
  }
  return buf;
}

/** Sample-and-hold decimation plus bit reduction, mixed in: digicore crunch. */
function bitcrush(buf: AudioBuffer, hold: number, bits: number, mix: number): void {
  const q = Math.pow(2, bits - 1);
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const d = buf.getChannelData(ch);
    let held = 0;
    for (let i = 0; i < d.length; i++) {
      if (i % hold === 0) held = Math.round(d[i]! * q) / q;
      d[i] = d[i]! * (1 - mix) + held * mix;
    }
  }
}

/**
 * Render the demo song offline as one stem per part. Each unique voice (instrument +
 * pitch + length) is rendered once in its own small context and summed in JS; only the
 * per-stem bus effects run in a full-length context.
 */
export async function renderDemoStems(
  sampleRate = 44100,
  leadPatch = SONG_LEAD_PATCH,
): Promise<Stems> {
  return renderSongStems(composeDemo(), DEMO_BPM, DEMO_LENGTH_BEATS, sampleRate, leadPatch);
}

/** Render any composition built from the digicore instruments as one stem per part. */
export async function renderSongStems(
  events: readonly CompEvent[],
  bpm: number,
  lengthBeats: number,
  sampleRate = 44100,
  leadPatch = SONG_LEAD_PATCH,
): Promise<Stems> {
  const spb = 60 / bpm;
  const duration = lengthBeats * spb + 2;
  const frames = Math.ceil(duration * sampleRate);
  const T = (beat: number) => beat * spb;

  const voices = new Map<string, Promise<AudioBuffer>>();
  const keyed = events.map((e) => {
    const key = voiceKey(e);
    if (!voices.has(key)) voices.set(key, renderVoice(e, spb, sampleRate, leadPatch));
    return { e, key };
  });
  const buffers = new Map<string, AudioBuffer>();
  await Promise.all([...voices].map(async ([k, p]) => buffers.set(k, await p)));

  const dry = {} as Record<Part, AudioBuffer>;
  const scratch = new OfflineAudioContext(2, 1, sampleRate);
  for (const p of PARTS) dry[p] = scratch.createBuffer(2, frames, sampleRate);
  for (const { e, key } of keyed) {
    const v = buffers.get(key)!;
    const mix = dry[e.part];
    const at = Math.round(T(e.beat) * sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const src = v.getChannelData(Math.min(ch, v.numberOfChannels - 1));
      const dst = mix.getChannelData(ch);
      const n = Math.min(src.length, frames - at);
      for (let i = 0; i < n; i++) dst[at + i]! += src[i]! * e.vel;
    }
  }
  bitcrush(dry.vox, 3, 7, 0.65);
  bitcrush(dry.perc, 2, 8, 0.35);

  const kicks = events.filter((e) => e.inst === 'k808').map((e) => T(e.beat));
  const busFx: Record<Part, (ctx: OfflineAudioContext, input: AudioNode, out: AudioNode) => void> =
    {
      k808: (ctx, input, out) => {
        const g = ctx.createGain();
        g.gain.value = 0.22;
        input.connect(makeShaper(ctx, 3.5)).connect(g).connect(out);
      },
      perc: (ctx, input, out) => {
        const g = ctx.createGain();
        g.gain.value = 0.75;
        input.connect(makeShaper(ctx, 1.6)).connect(g).connect(out);
      },
      vox: (ctx, input, out) => {
        const g = ctx.createGain();
        g.gain.value = 0.95;
        input.connect(g).connect(out);
        const d = ctx.createDelay(1);
        d.delayTime.value = spb * 0.75;
        const fb = ctx.createGain();
        fb.gain.value = 0.3;
        const wet = ctx.createGain();
        wet.gain.value = 0.25;
        g.connect(d).connect(fb).connect(d);
        d.connect(wet).connect(out);
      },
      lead: (ctx, input, out) => leadBus(ctx, input, out, spb),
      backing: (ctx, input, out) => {
        const duck = ctx.createGain();
        for (const k of kicks) sidechain(duck.gain, k);
        const g = ctx.createGain();
        g.gain.value = 0.6;
        input
          .connect(makeShaper(ctx, 1.2, 64))
          .connect(duck)
          .connect(g)
          .connect(out);
      },
    };

  const stems = {} as Stems;
  await Promise.all(
    PARTS.map(async (p) => {
      const ctx = new OfflineAudioContext(2, frames, sampleRate);
      const src = ctx.createBufferSource();
      src.buffer = dry[p];
      busFx[p](ctx, src, ctx.destination);
      src.start(0);
      stems[p] = await ctx.startRendering();
    }),
  );
  return stems;
}

/** The lead bus: light drive and a dotted-eighth stereo delay. Shared with the live lead. */
export function leadBus(
  ctx: BaseAudioContext,
  input: AudioNode,
  out: AudioNode,
  spb: number,
): void {
  const g = ctx.createGain();
  g.gain.value = 1.15;
  input.connect(makeShaper(ctx, 1.3)).connect(g).connect(out);
  const d = ctx.createDelay(1);
  d.delayTime.value = spb * 0.75;
  const fb = ctx.createGain();
  fb.gain.value = 0.28;
  const wet = ctx.createGain();
  wet.gain.value = 0.2;
  g.connect(d).connect(fb).connect(d);
  d.connect(wet).connect(out);
}

/** Every stem summed into one buffer (editor preview, tests, custom-mix fallback). */
export async function renderDemoSong(sampleRate = 44100): Promise<AudioBuffer> {
  const stems = await renderDemoStems(sampleRate);
  return mixStems(stems);
}

export function mixStems(stems: Partial<Stems>): AudioBuffer {
  const list = Object.values(stems).filter((b): b is AudioBuffer => !!b);
  const first = list[0]!;
  const out = new OfflineAudioContext(2, 1, first.sampleRate).createBuffer(
    2,
    first.length,
    first.sampleRate,
  );
  for (const b of list) {
    for (let ch = 0; ch < 2; ch++) {
      const src = b.getChannelData(Math.min(ch, b.numberOfChannels - 1));
      const dst = out.getChannelData(ch);
      for (let i = 0; i < dst.length; i++) dst[i]! += src[i]! * 0.8;
    }
  }
  return out;
}

function voiceKey(e: CompEvent): string {
  return `${e.inst}:${e.midi.join(',')}:${e.len}:${e.glideFrom ?? ''}:${e.vowel ?? ''}`;
}

async function renderVoice(
  e: CompEvent,
  spb: number,
  sampleRate: number,
  leadPatch: SynthPatch,
): Promise<AudioBuffer> {
  const len = e.len * spb;
  const tail = e.inst === 'pad' || e.inst === 'impact' ? 1.2 : 0.4;
  const ctx = new OfflineAudioContext(2, Math.ceil((len + tail) * sampleRate), sampleRate);
  const out = ctx.destination;
  const noise = noiseBuffer(ctx, 2);
  const m = e.midi[0] ?? 60;
  switch (e.inst) {
    case 'k808':
      k808(ctx, out, noise, len, m, e.glideFrom);
      break;
    case 'hat':
      hat(ctx, out, noise, 0.035, 7200 + m * 900);
      break;
    case 'openHat':
      hat(ctx, out, noise, 0.2, 7000);
      break;
    case 'snare':
      snare(ctx, out, noise);
      break;
    case 'blip':
      blip(ctx, out, m);
      break;
    case 'chop':
      chop(ctx, out, noise, len, m, e.vowel ?? 'a');
      break;
    case 'lead':
      playLeadNote(ctx, out, 0, m, len, 1, leadPatch);
      break;
    case 'pad':
      supersaw(ctx, out, len, e.midi, 0.55, 0.35, 0.9);
      break;
    case 'bell':
      bell(ctx, out, m, len);
      break;
    case 'riser':
      riser(ctx, out, noise, len);
      break;
    case 'impact':
      impact(ctx, out, noise, len);
      break;
    case 'glitch':
      glitch(ctx, out, m);
      break;
  }
  return ctx.startRendering();
}

function sidechain(g: AudioParam, t: number) {
  g.setValueAtTime(1, Math.max(0, t - 0.002));
  g.linearRampToValueAtTime(0.25, t + 0.01);
  g.linearRampToValueAtTime(1, t + 0.24);
}

function env(
  ctx: BaseAudioContext,
  t: number,
  peak: number,
  attack: number,
  hold: number,
  release: number,
) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.setValueAtTime(peak, t + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
  return g;
}

/** Distorted 808: punchy pitch drop (or a glide from the previous note) plus a kick click. */
function k808(
  ctx: BaseAudioContext,
  out: AudioNode,
  noise: AudioBuffer,
  len: number,
  midi: number,
  glideFrom?: number,
) {
  const f = mtof(midi);
  const o = ctx.createOscillator();
  o.type = 'sine';
  if (glideFrom !== undefined) {
    o.frequency.setValueAtTime(mtof(glideFrom), 0);
    o.frequency.exponentialRampToValueAtTime(f, 0.09);
  } else {
    o.frequency.setValueAtTime(f * 2.4, 0);
    o.frequency.exponentialRampToValueAtTime(f, 0.04);
  }
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, 0);
  g.gain.linearRampToValueAtTime(1, 0.003);
  g.gain.exponentialRampToValueAtTime(0.32, Math.max(0.05, Math.min(len, 1.2)));
  g.gain.setValueAtTime(0.32, Math.max(0.06, len));
  g.gain.exponentialRampToValueAtTime(0.0001, len + 0.1);
  o.connect(g).connect(makeShaper(ctx, 7)).connect(out);
  o.start(0);
  o.stop(len + 0.15);
  const k = ctx.createOscillator();
  k.frequency.setValueAtTime(170, 0);
  k.frequency.exponentialRampToValueAtTime(48, 0.06);
  k.connect(env(ctx, 0, 0.9, 0.001, 0.02, 0.1)).connect(out);
  k.start(0);
  k.stop(0.2);
  const n = ctx.createBufferSource();
  n.buffer = noise;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 3500;
  n.connect(hp)
    .connect(env(ctx, 0, 0.35, 0.0005, 0.002, 0.015))
    .connect(out);
  n.start(0, 0.3, 0.03);
}

function hat(
  ctx: BaseAudioContext,
  out: AudioNode,
  noise: AudioBuffer,
  decay: number,
  hpHz: number,
) {
  const n = ctx.createBufferSource();
  n.buffer = noise;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = Math.min(16000, hpHz);
  const bp = ctx.createBiquadFilter();
  bp.type = 'peaking';
  bp.frequency.value = 10000;
  bp.gain.value = 6;
  n.connect(hp)
    .connect(bp)
    .connect(env(ctx, 0, 0.5, 0.0008, 0.004, decay))
    .connect(out);
  n.start(0, 0.9, decay + 0.05);
}

function snare(ctx: BaseAudioContext, out: AudioNode, noise: AudioBuffer) {
  const n = ctx.createBufferSource();
  n.buffer = noise;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1900;
  bp.Q.value = 0.7;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, 0);
  for (let i = 0; i < 3; i++) {
    g.gain.linearRampToValueAtTime(0.9, i * 0.009 + 0.001);
    g.gain.linearRampToValueAtTime(0.3, i * 0.009 + 0.007);
  }
  g.gain.linearRampToValueAtTime(0.8, 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, 0.2);
  const sh = makeShaper(ctx, 2.5);
  n.connect(bp).connect(g).connect(sh).connect(out);
  n.start(0, 0.4, 0.25);
  const body = ctx.createOscillator();
  body.type = 'triangle';
  body.frequency.setValueAtTime(230, 0);
  body.frequency.exponentialRampToValueAtTime(170, 0.07);
  body.connect(env(ctx, 0, 0.55, 0.001, 0.01, 0.08)).connect(sh);
  body.start(0);
  body.stop(0.15);
}

function blip(ctx: BaseAudioContext, out: AudioNode, midi: number) {
  const o = ctx.createOscillator();
  o.type = 'square';
  o.frequency.setValueAtTime(mtof(midi), 0);
  o.frequency.setValueAtTime(mtof(midi + 7), 0.015);
  o.connect(env(ctx, 0, 0.18, 0.001, 0.02, 0.02))
    .connect(makeShaper(ctx, 1, 6))
    .connect(out);
  o.start(0);
  o.stop(0.08);
}

/** Formant frequencies per vowel (Hz), raised for a pitched-up synthetic voice. */
const FORMANTS: Record<Vowel, [number, number, number]> = {
  a: [850, 1220, 2810],
  e: [420, 2000, 2600],
  i: [310, 2700, 3300],
  o: [460, 840, 2830],
  u: [330, 720, 2530],
};
const FORMANT_SHIFT = 1.35;

/** A vocal chop by formant synthesis: a buzzy glottal source through three resonances. */
function chop(
  ctx: BaseAudioContext,
  out: AudioNode,
  noise: AudioBuffer,
  len: number,
  midi: number,
  vowel: Vowel,
) {
  const f0 = mtof(midi);
  const src = ctx.createOscillator();
  src.type = 'sawtooth';
  src.frequency.setValueAtTime(f0 * Math.pow(2, -2 / 12), 0);
  src.frequency.exponentialRampToValueAtTime(f0, 0.04);
  const vib = ctx.createOscillator();
  vib.frequency.value = 5.8;
  const vibAmt = ctx.createGain();
  vibAmt.gain.value = len > 0.2 ? 22 : 0;
  vib.connect(vibAmt).connect(src.detune);
  const g = env(ctx, 0, 0.9, 0.008, Math.max(0.01, len * 0.75), 0.05);
  const sum = ctx.createGain();
  FORMANTS[vowel].forEach((fHz, i) => {
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = fHz * FORMANT_SHIFT;
    bp.Q.value = [7, 11, 13][i]!;
    const lvl = ctx.createGain();
    lvl.gain.value = [1.6, 1.0, 0.55][i]!;
    src.connect(bp).connect(lvl).connect(sum);
  });
  sum.connect(g).connect(makeShaper(ctx, 1.8)).connect(out);
  src.start(0);
  vib.start(0);
  src.stop(len + 0.1);
  vib.stop(len + 0.1);
  // breathy consonant onset
  const n = ctx.createBufferSource();
  n.buffer = noise;
  const hp = ctx.createBiquadFilter();
  hp.type = 'bandpass';
  hp.frequency.value = 4500;
  n.connect(hp)
    .connect(env(ctx, 0, 0.25, 0.002, 0.01, 0.02))
    .connect(out);
  n.start(0, 1.1, 0.05);
}

function supersaw(
  ctx: BaseAudioContext,
  out: AudioNode,
  len: number,
  midis: number[],
  vel: number,
  attack: number,
  release: number,
) {
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 1.5;
  lp.frequency.setValueAtTime(1200, 0);
  lp.frequency.linearRampToValueAtTime(3200, len);
  const g = env(ctx, 0, vel / midis.length, attack, Math.max(0.01, len - attack), release);
  lp.connect(g).connect(out);
  const detunes = [-22, -9, 0, 9, 22];
  midis.forEach((m, mi) => {
    detunes.forEach((d, di) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = mtof(m);
      o.detune.value = d + mi;
      const p = ctx.createStereoPanner();
      p.pan.value = (di / (detunes.length - 1)) * 1.4 - 0.7;
      o.connect(p).connect(lp);
      o.start(0);
      o.stop(len + release + 0.05);
    });
  });
}

/** Glassy pluck: a sine and a bright partial, decaying fast. */
function bell(ctx: BaseAudioContext, out: AudioNode, midi: number, len: number) {
  for (const [ratio, a, dec] of [
    [1, 0.3, 0.35],
    [4.01, 0.12, 0.12],
    [2, 0.08, 0.2],
  ] as const) {
    const o = ctx.createOscillator();
    o.frequency.value = mtof(midi) * ratio;
    o.connect(env(ctx, 0, a, 0.002, 0.005, Math.min(len + 0.2, dec))).connect(out);
    o.start(0);
    o.stop(len + 0.3);
  }
}

function riser(ctx: BaseAudioContext, out: AudioNode, noise: AudioBuffer, len: number) {
  const n = ctx.createBufferSource();
  n.buffer = noise;
  n.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 3;
  bp.frequency.setValueAtTime(300, 0);
  bp.frequency.exponentialRampToValueAtTime(9000, len);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, 0);
  g.gain.exponentialRampToValueAtTime(0.5, len);
  g.gain.linearRampToValueAtTime(0, len + 0.02);
  n.connect(bp).connect(g).connect(out);
  n.start(0);
  n.stop(len + 0.05);
}

function impact(ctx: BaseAudioContext, out: AudioNode, noise: AudioBuffer, len: number) {
  const n = ctx.createBufferSource();
  n.buffer = noise;
  n.loop = true;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 4500;
  n.connect(hp)
    .connect(env(ctx, 0, 0.45, 0.002, 0.02, Math.min(1.6, len)))
    .connect(out);
  n.start(0);
  n.stop(len + 0.5);
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(110, 0);
  o.frequency.exponentialRampToValueAtTime(38, 0.5);
  o.connect(env(ctx, 0, 0.8, 0.003, 0.08, 0.7)).connect(out);
  o.start(0);
  o.stop(1);
}

function glitch(ctx: BaseAudioContext, out: AudioNode, midi: number) {
  const o = ctx.createOscillator();
  o.type = 'square';
  o.frequency.setValueAtTime(mtof(midi), 0);
  o.frequency.setValueAtTime(mtof(midi - 12), 0.03);
  o.connect(env(ctx, 0, 0.15, 0.001, 0.04, 0.02))
    .connect(makeShaper(ctx, 1, 4))
    .connect(out);
  o.start(0);
  o.stop(0.1);
}
