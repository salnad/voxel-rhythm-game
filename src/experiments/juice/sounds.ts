import type { Action } from '../../chart/types';

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/**
 * Small synthesized one-shots for the experiments' instant press feedback and on-beat
 * impacts. Everything plays into `out` (the Sfx bus, so the hit-sound volume applies) at a
 * context time (default now).
 */
export class JuiceSounds {
  private noiseBuf: AudioBuffer | null = null;

  constructor(
    private readonly ctx: AudioContext,
    private readonly out: AudioNode,
  ) {}

  private noise(): AudioBuffer {
    if (!this.noiseBuf) {
      const { ctx } = this;
      this.noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return this.noiseBuf;
  }

  private env(t: number, peak: number, len: number, attack = 0.001): GainNode {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + len);
    g.connect(this.out);
    return g;
  }

  private tone(t: number, type: OscillatorType, f0: number, f1: number, peak: number, len: number) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + len);
    o.connect(this.env(t, peak, len));
    o.start(t);
    o.stop(t + len + 0.03);
  }

  private hiss(
    t: number,
    type: BiquadFilterType,
    f0: number,
    f1: number,
    peak: number,
    len: number,
    q = 1,
  ) {
    const n = this.ctx.createBufferSource();
    n.buffer = this.noise();
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + len);
    n.connect(f).connect(this.env(t, peak, len));
    n.start(t, Math.random() * 0.3, len + 0.05);
  }

  private at(t?: number): number {
    return Math.max(this.ctx.currentTime, t ?? this.ctx.currentTime);
  }

  /** Blade leaving the sheath: the instant a key goes down. */
  draw(action: Action, when?: number): void {
    const t = this.at(when);
    if (action === 'block') {
      this.hiss(t, 'bandpass', 1400, 500, 0.12, 0.06, 1.5);
      this.tone(t, 'triangle', 420, 260, 0.08, 0.05);
    } else {
      this.hiss(t, 'bandpass', action === 'stab' ? 5200 : 3600, 1200, 0.16, 0.07, 1.8);
      this.tone(t, 'square', 2400, 1800, 0.025, 0.02);
    }
  }

  /** A meaty contact: low thump + crack + metallic ring, by action. */
  impact(action: Action, strength = 1, when?: number): void {
    const t = this.at(when);
    const s = strength;
    this.tone(t, 'sine', 150, 48, 0.42 * s, 0.16);
    this.hiss(t, 'highpass', 3500, 1800, 0.22 * s, 0.05);
    switch (action) {
      case 'block':
        this.tone(t, 'square', 2900, 2100, 0.07 * s, 0.12);
        this.tone(t, 'triangle', 4350, 3600, 0.06 * s, 0.22);
        break;
      case 'slash':
        this.hiss(t, 'bandpass', 6500, 900, 0.22 * s, 0.13, 1.2);
        break;
      case 'stab':
        this.tone(t, 'square', 1700, 420, 0.1 * s, 0.06);
        break;
      case 'flourish':
        for (const [i, f] of [1320, 1660, 1980, 2640].entries())
          this.tone(t + i * 0.025, 'triangle', f, f, 0.05 * s, 0.25);
        this.tone(t, 'sine', 90, 30, 0.4 * s, 0.4);
        break;
    }
  }

  /** Taiko-style drum on a key press: "don" (centre, low) or "ka" (rim, bright). */
  drum(kind: 'don' | 'ka', when?: number): void {
    const t = this.at(when);
    if (kind === 'don') {
      this.tone(t, 'sine', 190, 70, 0.55, 0.2);
      this.hiss(t, 'lowpass', 900, 200, 0.18, 0.06);
    } else {
      this.tone(t, 'square', 1250, 1150, 0.06, 0.035);
      this.hiss(t, 'bandpass', 4200, 2600, 0.22, 0.045, 3);
      this.tone(t, 'triangle', 880, 820, 0.08, 0.06);
    }
  }

  /** A swing that found nothing / missed the beat: dull and short. */
  whiff(when?: number): void {
    const t = this.at(when);
    this.hiss(t, 'lowpass', 700, 250, 0.12, 0.08);
    this.tone(t, 'triangle', 260, 140, 0.07, 0.09);
  }

  /** Bright tick for an on-beat press acknowledged before its beat. */
  lockOn(when?: number): void {
    const t = this.at(when);
    this.tone(t, 'sine', 2600, 2600, 0.035, 0.03);
  }

  /** Rising arpeggio when a multiplier tier is reached (`tier` 1..4). */
  tierUp(tier: number, when?: number): void {
    const t = this.at(when);
    const base = 74 + tier * 2;
    [0, 4, 7, 12].forEach((iv, i) =>
      this.tone(t + i * 0.035, 'square', mtof(base + iv), mtof(base + iv), 0.05, 0.09),
    );
  }

  /** Falling blip when a multiplier tier is lost. */
  tierDown(when?: number): void {
    const t = this.at(when);
    this.tone(t, 'sawtooth', 520, 110, 0.07, 0.22);
  }
}
