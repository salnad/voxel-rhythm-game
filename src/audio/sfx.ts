import type { Action } from '../chart/types';

/**
 * Small synthesized one-shots (move sounds, hits, hurt). Played live, or scheduled at explicit
 * times on an OfflineAudioContext (`at`) to render a playthrough's sound for a video.
 */
export class Sfx {
  private readonly out: GainNode;
  private noise: AudioBuffer | null = null;

  constructor(private readonly ctx: BaseAudioContext) {
    this.out = ctx.createGain();
    this.out.connect(ctx.destination);
  }

  /** Final output (for taps such as a recorder). */
  get output(): AudioNode {
    return this.out;
  }

  set volume(v: number) {
    this.out.gain.value = v;
  }

  private noiseBuf(): AudioBuffer {
    if (!this.noise) {
      const { ctx } = this;
      this.noise = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return this.noise;
  }

  private noiseBurst(
    t: number,
    type: BiquadFilterType,
    f0: number,
    f1: number,
    gain: number,
    len: number,
  ) {
    const { ctx } = this;
    const n = ctx.createBufferSource();
    n.buffer = this.noiseBuf();
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = 1.2;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + len);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    n.connect(f).connect(g).connect(this.out);
    n.start(t, Math.random() * 0.2, len + 0.05);
  }

  private tone(t: number, type: OscillatorType, f0: number, f1: number, gain: number, len: number) {
    const { ctx } = this;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + len);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(this.out);
    o.start(t);
    o.stop(t + len + 0.02);
  }

  /** Quiet whoosh on every key press: the move happens whether or not a cue is there. */
  swing(action: Action, at?: number): void {
    const t = at ?? this.ctx.currentTime;
    if (action === 'block') this.noiseBurst(t, 'lowpass', 900, 300, 0.05, 0.06);
    else this.noiseBurst(t, 'bandpass', action === 'stab' ? 3000 : 1800, 600, 0.07, 0.09);
  }

  /** The move connected. */
  hit(action: Action, perfect: boolean, at?: number): void {
    const t = at ?? this.ctx.currentTime;
    const k = perfect ? 1 : 0.8;
    switch (action) {
      case 'block':
        this.tone(t, 'square', 2600 * k, 1900, 0.09, 0.09);
        this.tone(t, 'triangle', 3900 * k, 3100, 0.07, 0.14);
        this.noiseBurst(t, 'highpass', 5000, 3000, 0.12, 0.05);
        break;
      case 'slash':
        this.noiseBurst(t, 'bandpass', 5000, 900, 0.18, 0.12);
        this.tone(t, 'sawtooth', 900 * k, 300, 0.05, 0.08);
        break;
      case 'stab':
        this.tone(t, 'square', 1500 * k, 500, 0.1, 0.05);
        this.noiseBurst(t, 'highpass', 6000, 4000, 0.1, 0.03);
        break;
      case 'flourish':
        for (const [i, f] of [1320, 1660, 1980].entries())
          this.tone(t + i * 0.03, 'triangle', f * k, f, 0.06, 0.22);
        this.noiseBurst(t, 'bandpass', 6000, 800, 0.14, 0.25);
        break;
    }
  }

  /** Missed slash/stab: the enemy's guard closes. */
  clank(at?: number): void {
    const t = at ?? this.ctx.currentTime;
    this.tone(t, 'square', 320, 180, 0.08, 0.08);
  }

  shatter(at?: number): void {
    const t = at ?? this.ctx.currentTime;
    this.noiseBurst(t, 'highpass', 3000, 9000, 0.2, 0.35);
    this.tone(t, 'sine', 140, 40, 0.25, 0.4);
  }

  hurt(at?: number): void {
    const t = at ?? this.ctx.currentTime;
    this.noiseBurst(t, 'lowpass', 2500, 200, 0.5, 0.28);
  }
}

/** Render a metronome click track (for offset calibration). */
export async function renderMetronome(
  bpm: number,
  beats: number,
  sampleRate = 44100,
): Promise<AudioBuffer> {
  const spb = 60 / bpm;
  const ctx = new OfflineAudioContext(1, Math.ceil((beats * spb + 1) * sampleRate), sampleRate);
  for (let i = 0; i < beats; i++) {
    const t = i * spb;
    const o = ctx.createOscillator();
    o.frequency.value = i % 4 === 0 ? 1800 : 1200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.6, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.06);
  }
  return ctx.startRendering();
}
