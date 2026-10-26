import { composeDemo, DEMO_BPM, DEMO_LENGTH_BEATS, type CompEvent } from './composition';

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

/**
 * Render the demo song offline. Returns an AudioBuffer so the demo plays through the
 * exact same path (and clock) as a user's audio file.
 */
export async function renderDemoSong(sampleRate = 44100): Promise<AudioBuffer> {
  const spb = 60 / DEMO_BPM;
  const duration = DEMO_LENGTH_BEATS * spb + 2;
  const ctx = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);
  const T = (beat: number) => beat * spb;

  // ---- buses
  const master = ctx.createDynamicsCompressor();
  master.threshold.value = -14;
  master.ratio.value = 6;
  master.attack.value = 0.003;
  master.release.value = 0.12;
  const clip = makeShaper(ctx, 1.4);
  const out = ctx.createGain();
  out.gain.value = 0.8;
  master.connect(clip).connect(out).connect(ctx.destination);

  const kickBus = ctx.createGain();
  kickBus.gain.value = 0.9;
  kickBus.connect(makeShaper(ctx, 3)).connect(master);
  const percBus = ctx.createGain();
  percBus.gain.value = 0.5;
  percBus.connect(master);
  const bassBus = ctx.createGain();
  bassBus.gain.value = 0.55;
  bassBus.connect(makeShaper(ctx, 2.5)).connect(master);
  // melodic bus gets sidechain ducking on every kick
  const duck = ctx.createGain();
  duck.connect(master);
  const synthBus = ctx.createGain();
  synthBus.gain.value = 0.32;
  synthBus.connect(makeShaper(ctx, 1.2, 48)).connect(duck);

  // simple stereo delay for the synths
  const delay = ctx.createDelay(1);
  delay.delayTime.value = spb * 0.75;
  const fb = ctx.createGain();
  fb.gain.value = 0.28;
  const delayOut = ctx.createGain();
  delayOut.gain.value = 0.22;
  synthBus.connect(delay);
  delay.connect(fb).connect(delay);
  delay.connect(delayOut).connect(duck);

  const events = composeDemo();
  for (const e of events) if (e.inst === 'kick') sidechain(duck.gain, T(e.beat));

  // Each unique voice (instrument + pitch + length) is rendered once in its own small
  // offline context, then summed into per-bus buffers in plain JS. Only the bus effects
  // run in the big context. (One oscillator graph per note took over a minute to render.)
  type Bus = 'kick' | 'perc' | 'bass' | 'synth';
  const busOf: Record<CompEvent['inst'], Bus> = {
    kick: 'kick',
    clap: 'perc',
    hat: 'perc',
    riser: 'perc',
    bass: 'bass',
    lead: 'synth',
    arp: 'synth',
    stab: 'synth',
    pad: 'synth',
  };
  const busNode: Record<Bus, AudioNode> = {
    kick: kickBus,
    perc: percBus,
    bass: bassBus,
    synth: synthBus,
  };
  const voices = new Map<string, Promise<AudioBuffer>>();
  const keyed = events.map((e) => {
    const key = voiceKey(e);
    if (!voices.has(key)) voices.set(key, renderVoice(e, spb, sampleRate));
    return { e, key };
  });
  const buffers = new Map<string, AudioBuffer>();
  await Promise.all([...voices].map(async ([k, p]) => buffers.set(k, await p)));

  const frames = ctx.length;
  const mixes = {} as Record<Bus, AudioBuffer>;
  for (const b of Object.keys(busNode) as Bus[]) mixes[b] = ctx.createBuffer(2, frames, sampleRate);
  for (const { e, key } of keyed) {
    const v = buffers.get(key)!;
    const mix = mixes[busOf[e.inst]];
    const at = Math.round(T(e.beat) * sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const src = v.getChannelData(Math.min(ch, v.numberOfChannels - 1));
      const dst = mix.getChannelData(ch);
      const n = Math.min(src.length, frames - at);
      for (let i = 0; i < n; i++) dst[at + i]! += src[i]! * e.vel;
    }
  }
  for (const b of Object.keys(busNode) as Bus[]) {
    const src = ctx.createBufferSource();
    src.buffer = mixes[b];
    src.connect(busNode[b]);
    src.start(0);
  }
  return ctx.startRendering();
}

function voiceKey(e: CompEvent): string {
  switch (e.inst) {
    case 'kick':
    case 'clap':
    case 'hat':
      return e.inst;
    default:
      return `${e.inst}:${e.midi.join(',')}:${e.len}:${e.glideFrom ?? ''}`;
  }
}

async function renderVoice(e: CompEvent, spb: number, sampleRate: number): Promise<AudioBuffer> {
  const len = e.len * spb;
  const tail = e.inst === 'pad' ? 1 : 0.4;
  const ctx = new OfflineAudioContext(2, Math.ceil((len + tail) * sampleRate), sampleRate);
  const out = ctx.destination;
  const noise = noiseBuffer(ctx, 2);
  const unit = { ...e, vel: 1 };
  switch (e.inst) {
    case 'kick':
      kick(ctx, out, noise, 0, 1);
      break;
    case 'clap':
      clap(ctx, out, noise, 0, 1);
      break;
    case 'hat':
      hat(ctx, out, noise, 0, 1);
      break;
    case 'bass':
      bass(ctx, out, 0, len, unit);
      break;
    case 'lead':
      lead(ctx, out, 0, len, unit);
      break;
    case 'arp':
      arp(ctx, out, 0, len, unit);
      break;
    case 'stab':
      supersaw(ctx, out, 0, len, e.midi, 1, 0.004, 0.12);
      break;
    case 'pad':
      supersaw(ctx, out, 0, len, e.midi, 0.6, 0.6, 0.8);
      break;
    case 'riser':
      riser(ctx, out, noise, 0, len, 1);
      break;
  }
  return ctx.startRendering();
}

function sidechain(g: AudioParam, t: number) {
  g.setValueAtTime(1, Math.max(0, t - 0.002));
  g.linearRampToValueAtTime(0.3, t + 0.01);
  g.linearRampToValueAtTime(1, t + 0.22);
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

function kick(ctx: BaseAudioContext, bus: AudioNode, noise: AudioBuffer, t: number, vel: number) {
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(180, t);
  o.frequency.exponentialRampToValueAtTime(48, t + 0.09);
  const g = env(ctx, t, vel, 0.002, 0.05, 0.3);
  o.connect(g).connect(bus);
  o.start(t);
  o.stop(t + 0.4);
  const n = ctx.createBufferSource();
  n.buffer = noise;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 3000;
  const ng = env(ctx, t, 0.3 * vel, 0.001, 0.003, 0.02);
  n.connect(hp).connect(ng).connect(bus);
  n.start(t, 0.3, 0.05);
}

function clap(ctx: BaseAudioContext, bus: AudioNode, noise: AudioBuffer, t: number, vel: number) {
  const n = ctx.createBufferSource();
  n.buffer = noise;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1600;
  bp.Q.value = 0.9;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  for (let i = 0; i < 3; i++) {
    g.gain.linearRampToValueAtTime(vel, t + i * 0.011 + 0.001);
    g.gain.linearRampToValueAtTime(vel * 0.3, t + i * 0.011 + 0.009);
  }
  g.gain.linearRampToValueAtTime(vel * 0.8, t + 0.035);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  n.connect(bp).connect(g).connect(bus);
  n.start(t, 0.4, 0.25);
  const body = ctx.createOscillator();
  body.type = 'triangle';
  body.frequency.setValueAtTime(240, t);
  body.frequency.exponentialRampToValueAtTime(160, t + 0.08);
  const bg = env(ctx, t, 0.45 * vel, 0.001, 0.01, 0.09);
  body.connect(bg).connect(bus);
  body.start(t);
  body.stop(t + 0.15);
}

function hat(ctx: BaseAudioContext, bus: AudioNode, noise: AudioBuffer, t: number, vel: number) {
  const n = ctx.createBufferSource();
  n.buffer = noise;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 8500;
  const g = env(ctx, t, 0.45 * vel, 0.001, 0.005, 0.035);
  n.connect(hp).connect(g).connect(bus);
  n.start(t, 0.9, 0.06);
}

function bass(ctx: BaseAudioContext, bus: AudioNode, t: number, len: number, e: CompEvent) {
  const f = mtof(e.midi[0]!);
  const o = ctx.createOscillator();
  o.type = 'sine';
  const o2 = ctx.createOscillator();
  o2.type = 'square';
  for (const osc of [o, o2]) {
    if (e.glideFrom !== undefined) {
      osc.frequency.setValueAtTime(mtof(e.glideFrom), t);
      osc.frequency.exponentialRampToValueAtTime(f, t + 0.07);
    } else {
      osc.frequency.setValueAtTime(f, t);
    }
  }
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 420;
  const sq = ctx.createGain();
  sq.gain.value = 0.18;
  const g = env(ctx, t, e.vel, 0.004, Math.max(0.01, len - 0.06), 0.06);
  o.connect(g);
  o2.connect(sq).connect(lp).connect(g);
  g.connect(bus);
  o.start(t);
  o2.start(t);
  o.stop(t + len + 0.1);
  o2.stop(t + len + 0.1);
}

function supersaw(
  ctx: BaseAudioContext,
  bus: AudioNode,
  t: number,
  len: number,
  midis: number[],
  vel: number,
  attack: number,
  release: number,
) {
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 2;
  lp.frequency.setValueAtTime(1400, t);
  lp.frequency.exponentialRampToValueAtTime(7000, t + Math.max(0.03, attack));
  lp.frequency.exponentialRampToValueAtTime(2500, t + len);
  const g = env(ctx, t, vel / midis.length, attack, Math.max(0.01, len - attack), release);
  lp.connect(g).connect(bus);
  const detunes = [-18, -7, 0, 7, 18];
  midis.forEach((m, mi) => {
    detunes.forEach((d, di) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = mtof(m);
      o.detune.value = d + mi;
      const p = ctx.createStereoPanner();
      p.pan.value = (di / (detunes.length - 1)) * 1.4 - 0.7;
      o.connect(p).connect(lp);
      o.start(t);
      o.stop(t + len + release + 0.05);
    });
  });
}

function lead(ctx: BaseAudioContext, bus: AudioNode, t: number, len: number, e: CompEvent) {
  const f = mtof(e.midi[0]!);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(9000, t);
  lp.frequency.exponentialRampToValueAtTime(3500, t + 0.25);
  const g = env(ctx, t, e.vel * 0.55, 0.004, Math.max(0.01, len * 0.8), 0.08);
  lp.connect(g).connect(bus);
  const vib = ctx.createOscillator();
  vib.frequency.value = 6;
  const vibAmt = ctx.createGain();
  vibAmt.gain.setValueAtTime(0, t);
  vibAmt.gain.linearRampToValueAtTime(len > 0.6 ? 18 : 0, t + 0.3);
  vib.connect(vibAmt);
  vib.start(t);
  vib.stop(t + len + 0.2);
  for (const [type, d] of [
    ['sawtooth', -9],
    ['sawtooth', 9],
    ['square', 1200],
  ] as const) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f * Math.pow(2, -1 / 12), t);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.03);
    o.detune.value = d;
    vibAmt.connect(o.detune);
    const og = ctx.createGain();
    og.gain.value = type === 'square' ? 0.25 : 0.5;
    o.connect(og).connect(lp);
    o.start(t);
    o.stop(t + len + 0.2);
  }
}

function arp(ctx: BaseAudioContext, bus: AudioNode, t: number, len: number, e: CompEvent) {
  const o = ctx.createOscillator();
  o.type = 'square';
  o.frequency.value = mtof(e.midi[0]!);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 6;
  lp.frequency.setValueAtTime(5000, t);
  lp.frequency.exponentialRampToValueAtTime(700, t + 0.12);
  const g = env(ctx, t, e.vel * 0.35, 0.002, 0.01, Math.max(0.05, len));
  o.connect(lp).connect(g).connect(bus);
  o.start(t);
  o.stop(t + len + 0.1);
}

function riser(
  ctx: BaseAudioContext,
  bus: AudioNode,
  noise: AudioBuffer,
  t: number,
  len: number,
  vel: number,
) {
  const n = ctx.createBufferSource();
  n.buffer = noise;
  n.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 3;
  bp.frequency.setValueAtTime(300, t);
  bp.frequency.exponentialRampToValueAtTime(9000, t + len);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vel * 0.6, t + len);
  g.gain.linearRampToValueAtTime(0, t + len + 0.02);
  n.connect(bp).connect(g).connect(bus);
  n.start(t);
  n.stop(t + len + 0.05);
}
