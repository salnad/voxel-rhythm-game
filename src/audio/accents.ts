/** Live one-shots a move plays in its part's voice (scheduled at context time t). */

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

function env(
  ctx: BaseAudioContext,
  t: number,
  peak: number,
  attack: number,
  decay: number,
): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  return g;
}

const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();
function noise(ctx: BaseAudioContext): AudioBuffer {
  let b = noiseCache.get(ctx);
  if (!b) {
    b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noiseCache.set(ctx, b);
  }
  return b;
}

function drive(ctx: BaseAudioContext, amount: number): WaveShaperNode {
  const n = 1024;
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = Math.tanh(x * amount) / Math.tanh(amount);
  }
  const s = ctx.createWaveShaper();
  s.curve = c;
  return s;
}

/** A short distorted 808 hit with a pitch drop. */
export function boom808(
  ctx: BaseAudioContext,
  out: AudioNode,
  t: number,
  midi: number,
  level: number,
): void {
  const o = ctx.createOscillator();
  const f = mtof(midi);
  o.frequency.setValueAtTime(f * 2.6, t);
  o.frequency.exponentialRampToValueAtTime(f, t + 0.045);
  o.connect(env(ctx, t, level, 0.002, 0.32))
    .connect(drive(ctx, 5))
    .connect(out);
  o.start(t);
  o.stop(t + 0.4);
}

/** A glitchy 32nd hat roll rising in pitch. */
export function hatRoll(
  ctx: BaseAudioContext,
  out: AudioNode,
  t: number,
  step: number,
  level: number,
): void {
  for (let k = 0; k < 4; k++) {
    const n = ctx.createBufferSource();
    n.buffer = noise(ctx);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000 + k * 1200;
    const at = t + k * step;
    n.connect(hp)
      .connect(env(ctx, at, level * (0.5 + k * 0.17), 0.001, 0.035))
      .connect(out);
    n.start(at, Math.random() * 0.5, 0.06);
  }
}

const FORMANTS: Record<string, [number, number, number]> = {
  a: [850, 1220, 2810],
  e: [420, 2000, 2600],
  o: [460, 840, 2830],
};

/** A pitched-up formant "ah!" chop. */
export function vocalChop(
  ctx: BaseAudioContext,
  out: AudioNode,
  t: number,
  midi: number,
  level: number,
  vowel: 'a' | 'e' | 'o' = 'a',
): void {
  const src = ctx.createOscillator();
  src.type = 'sawtooth';
  const f0 = mtof(midi);
  src.frequency.setValueAtTime(f0 * Math.pow(2, -2 / 12), t);
  src.frequency.exponentialRampToValueAtTime(f0, t + 0.035);
  const sum = ctx.createGain();
  FORMANTS[vowel]!.forEach((fHz, i) => {
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = fHz * 1.35;
    bp.Q.value = [7, 11, 13][i]!;
    const g = ctx.createGain();
    g.gain.value = [1.6, 1, 0.55][i]!;
    src.connect(bp).connect(g).connect(sum);
  });
  sum
    .connect(env(ctx, t, level, 0.006, 0.2))
    .connect(drive(ctx, 1.8))
    .connect(out);
  src.start(t);
  src.stop(t + 0.25);
}
