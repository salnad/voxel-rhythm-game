import { tapeStopCurve, type FlourishPick } from './plan';

const XF = 0.008;

/**
 * Mix-wide production flourishes for cleared combo measures. Everything the layer routes
 * into `input` passes through a dry path, a tape-stop delay line, a beat-repeat loop and a
 * low-pass, then into the engine's music bus (so the engine's own wonky FX still apply).
 * Risers and impacts are extra sources mixed in after the chain.
 */
export class FlourishFx {
  readonly input: GainNode;
  private readonly dry: GainNode;
  private readonly tape: DelayNode;
  private readonly tapeGain: GainNode;
  private readonly capture: GainNode;
  private readonly loop: DelayNode;
  private readonly loopFb: GainNode;
  private readonly loopGain: GainNode;
  private readonly lp: BiquadFilterNode;
  private readonly out: GainNode;
  private noise: AudioBuffer | null = null;

  constructor(
    private readonly ctx: AudioContext,
    private readonly dest: AudioNode,
  ) {
    this.input = ctx.createGain();
    this.dry = ctx.createGain();
    this.tape = ctx.createDelay(2);
    this.tape.delayTime.value = 0;
    this.tapeGain = ctx.createGain();
    this.tapeGain.gain.value = 0;
    this.capture = ctx.createGain();
    this.capture.gain.value = 0;
    this.loop = ctx.createDelay(1);
    this.loopFb = ctx.createGain();
    this.loopFb.gain.value = 0;
    this.loopGain = ctx.createGain();
    this.loopGain.gain.value = 0;
    this.lp = ctx.createBiquadFilter();
    this.lp.type = 'lowpass';
    this.lp.frequency.value = 20000;
    this.lp.Q.value = 0.7;
    this.out = ctx.createGain();

    this.input.connect(this.dry).connect(this.lp);
    this.input.connect(this.tape).connect(this.tapeGain).connect(this.lp);
    this.input.connect(this.capture).connect(this.loop);
    this.loop.connect(this.loopFb).connect(this.loop);
    this.loop.connect(this.loopGain).connect(this.lp);
    this.lp.connect(this.out).connect(dest);
  }

  /** Play a flourish whose fill runs over [a, b] (context times); b is the bar line. */
  play(pick: FlourishPick, a: number, b: number, spb: number): void {
    const now = this.ctx.currentTime;
    a = Math.max(a, now + 0.01);
    if (b - a < 0.05) return;
    switch (pick.kind) {
      case 'stutter':
        this.stutter(a, b, spb, pick.intensity);
        break;
      case 'tapeStop':
        this.tapeStop(a, b);
        break;
      case 'filterOpen':
        this.filterOpen(a, b, spb, pick.intensity);
        break;
      case 'riser':
        this.riser(a, b, pick.intensity);
        break;
    }
  }

  /** Beat-repeat: capture a 1/16 slice and loop it until the bar line. */
  private stutter(a: number, b: number, spb: number, k: number): void {
    const slice = spb / 4;
    this.loop.delayTime.setValueAtTime(slice, a);
    const cap = this.capture.gain;
    cap.cancelScheduledValues(a);
    cap.setValueAtTime(1, a);
    cap.setValueAtTime(0, a + slice);
    const fb = this.loopFb.gain;
    fb.cancelScheduledValues(a);
    fb.setValueAtTime(1, a);
    fb.setValueAtTime(0, b);
    const sw = Math.min(b, a + slice);
    this.fade(this.dry.gain, 1, 0, sw);
    const wet = this.loopGain.gain;
    wet.cancelScheduledValues(sw);
    wet.setValueAtTime(0, sw);
    wet.linearRampToValueAtTime(0.75 + 0.3 * k, sw + XF);
    wet.linearRampToValueAtTime(0.9 + 0.3 * k, b - XF);
    wet.linearRampToValueAtTime(0, b);
    this.fade(this.dry.gain, 0, 1, b);
  }

  /** Tape stop: pitch and speed fall to zero exactly at the bar line, then snap back. */
  private tapeStop(a: number, b: number): void {
    const T = b - a;
    const d = this.tape.delayTime;
    // setValueCurveAtTime may not share its start time with another event
    d.cancelScheduledValues(a - 0.001);
    d.setValueCurveAtTime(tapeStopCurve(T), a, T - 0.001);
    d.setValueAtTime(0, b + XF);
    this.fade(this.dry.gain, 1, 0, a);
    const g = this.tapeGain.gain;
    g.cancelScheduledValues(a);
    g.setValueAtTime(0, a);
    g.linearRampToValueAtTime(1, a + XF);
    g.setValueAtTime(1, b - T * 0.3);
    g.linearRampToValueAtTime(0.35, b);
    g.linearRampToValueAtTime(0, b + XF);
    this.fade(this.dry.gain, 0, 1, b);
    this.impact(b, 0.8);
  }

  /** Low-pass closes over the fill, then opens with a resonant sweep from the bar line. */
  private filterOpen(a: number, b: number, spb: number, k: number): void {
    const f = this.lp.frequency;
    const q = this.lp.Q;
    f.cancelScheduledValues(a);
    q.cancelScheduledValues(a);
    f.setValueAtTime(20000, a);
    f.exponentialRampToValueAtTime(420 - 120 * k, b);
    q.setValueAtTime(0.7, a);
    q.linearRampToValueAtTime(5 + 4 * k, b);
    f.exponentialRampToValueAtTime(20000, b + spb);
    q.linearRampToValueAtTime(0.7, b + spb);
  }

  /** Noise + pitch riser swelling into the bar line, cut by an impact. */
  private riser(a: number, b: number, k: number): void {
    const { ctx } = this;
    const n = ctx.createBufferSource();
    n.buffer = this.noiseBuf();
    n.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 3;
    bp.frequency.setValueAtTime(400, a);
    bp.frequency.exponentialRampToValueAtTime(9000, b);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, a);
    g.gain.exponentialRampToValueAtTime(0.35 * k, b - 0.01);
    g.gain.linearRampToValueAtTime(0, b);
    n.connect(bp).connect(g).connect(this.dest);
    n.start(a);
    n.stop(b + 0.05);
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, a);
    o.frequency.exponentialRampToValueAtTime(1760, b);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, a);
    og.gain.exponentialRampToValueAtTime(0.06 * k, b - 0.01);
    og.gain.linearRampToValueAtTime(0, b);
    o.connect(og).connect(this.dest);
    o.start(a);
    o.stop(b + 0.05);
    this.impact(b, k);
  }

  private impact(t: number, k: number): void {
    const { ctx } = this;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(32, t + 0.45);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5 * k, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g).connect(this.dest);
    o.start(t);
    o.stop(t + 0.55);
    const n = ctx.createBufferSource();
    n.buffer = this.noiseBuf();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(7000, t);
    lp.frequency.exponentialRampToValueAtTime(500, t + 0.4);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.18 * k, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    n.connect(lp).connect(ng).connect(this.dest);
    n.start(t);
    n.stop(t + 0.45);
  }

  private fade(p: AudioParam, from: number, to: number, at: number): void {
    p.setValueAtTime(from, at);
    p.linearRampToValueAtTime(to, at + XF);
  }

  private noiseBuf(): AudioBuffer {
    if (!this.noise) {
      const { ctx } = this;
      this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return this.noise;
  }

  dispose(): void {
    this.input.disconnect();
    this.out.disconnect();
  }
}
