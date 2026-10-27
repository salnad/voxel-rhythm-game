/**
 * Tiny synthesized one-shots for experiment sounds (tells, clangs, impacts). Everything is
 * scheduled at explicit context times and routed into one output (normally the Sfx bus, so
 * the hitsound volume applies), optionally panned.
 */
export class OneShots {
  private noise: AudioBuffer | null = null;
  readonly out: GainNode;

  constructor(
    readonly ctx: BaseAudioContext,
    destination: AudioNode,
    gain = 1,
  ) {
    this.out = ctx.createGain();
    this.out.gain.value = gain;
    this.out.connect(destination);
  }

  private noiseBuf(): AudioBuffer {
    if (!this.noise) {
      const { ctx } = this;
      this.noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.6), ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return this.noise;
  }

  private dest(pan: number): AudioNode {
    if (pan === 0 || !('createStereoPanner' in this.ctx)) return this.out;
    const p = this.ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    p.connect(this.out);
    return p;
  }

  /** A pitched blip with an exponential pitch glide and decay. */
  tone(
    at: number,
    type: OscillatorType,
    f0: number,
    f1: number,
    gain: number,
    len: number,
    pan = 0,
    attack = 0.002,
  ): OscillatorNode {
    const { ctx } = this;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, at);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), at + len);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    o.connect(g).connect(this.dest(pan));
    o.start(at);
    o.stop(at + len + 0.03);
    return o;
  }

  /** Filtered noise with a filter sweep. */
  noiseBurst(
    at: number,
    type: BiquadFilterType,
    f0: number,
    f1: number,
    gain: number,
    len: number,
    pan = 0,
    q = 1.2,
    attack = 0.002,
  ): void {
    const { ctx } = this;
    const n = ctx.createBufferSource();
    n.buffer = this.noiseBuf();
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, at);
    f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), at + len);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    n.connect(f).connect(g).connect(this.dest(pan));
    n.start(at, Math.random() * 0.1, len + 0.05);
  }

  /** Struck metal: inharmonic partials with fast, uneven decays plus a bright transient. */
  metal(at: number, f: number, gain: number, len: number, pan = 0): void {
    const partials: Array<[number, number, number]> = [
      [1, 1, 1],
      [2.76, 0.55, 0.7],
      [5.4, 0.35, 0.45],
      [8.93, 0.18, 0.3],
    ];
    for (const [ratio, g, l] of partials) {
      this.tone(
        at,
        ratio > 5 ? 'sine' : 'triangle',
        f * ratio,
        f * ratio * 0.995,
        gain * g,
        len * l,
        pan,
      );
    }
    this.noiseBurst(at, 'highpass', 6000, 3000, gain * 0.9, 0.04, pan, 0.8);
  }
}
