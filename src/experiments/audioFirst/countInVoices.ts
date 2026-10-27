import { demoHarmony } from '../../audio/demo/composition';
import type { CountInKind } from './timing';

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** Formants (Hz) of the count-in voice's vowels. */
const VOWELS = {
  uh: [640, 1190, 2390],
  ee: [300, 2500, 3200],
  oo: [340, 870, 2250],
  r: [420, 1300, 1700],
} as const;

/**
 * The by-ear count-in sounds, synthesized live on the audio clock and pitched to the bar's
 * chord so they sit in the song's key:
 *   hup    BLOCK: a heavy chest-voice "hup!" with a sub thump (one beat before)
 *   whoosh SLASH: band-passed noise plus a saw glide rising over the beat, cut on the cue
 *   tick   STAB: two dry woodblock ticks on the two eighths before (low, then high)
 *   three/two FLOURISH: a sung "three, two" on the two beats before
 * Every node is tracked so a count-in for a cue that gets dropped can be cancelled.
 */
export class CountInVoices {
  readonly bus: GainNode;
  private noise: AudioBuffer | null = null;

  constructor(private readonly ctx: AudioContext) {
    this.bus = ctx.createGain();
  }

  /** Schedule one count-in sound at context time `at`. Returns its source nodes. */
  play(kind: CountInKind, at: number, dur: number, bar: number, step: number) {
    const nodes: AudioScheduledSourceNode[] = [];
    const h = demoHarmony(bar);
    const chord = [...h.chord].sort((a, b) => a - b);
    switch (kind) {
      case 'hup': {
        // h: breath, then the vowel cut short (the "p")
        nodes.push(this.noiseBurst(at, 'bandpass', 1400, 0.22, 0.035, 1));
        nodes.push(...this.voice(at + 0.02, 0.11, mtof(h.root808 + 12), VOWELS.uh, 0.62, 1.25));
        const sub = this.ctx.createOscillator();
        sub.frequency.setValueAtTime(mtof(h.root808 + 12), at);
        sub.frequency.exponentialRampToValueAtTime(mtof(h.root808), at + 0.1);
        sub.connect(this.env(at, 0.5, 0.004, 0.16)).connect(this.bus);
        sub.start(at);
        sub.stop(at + 0.2);
        nodes.push(sub);
        break;
      }
      case 'whoosh': {
        const n = this.src();
        const bp = this.ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.Q.value = 2.5;
        bp.frequency.setValueAtTime(350, at);
        bp.frequency.exponentialRampToValueAtTime(7000, at + dur);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.75, at + dur - 0.01);
        g.gain.linearRampToValueAtTime(0, at + dur);
        n.connect(bp).connect(g).connect(this.bus);
        n.loop = true;
        n.start(at);
        n.stop(at + dur + 0.02);
        nodes.push(n);
        const top = h.leadTones[3] ?? 81;
        const o = this.ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(mtof(top - 12), at);
        o.frequency.exponentialRampToValueAtTime(mtof(top), at + dur);
        const lp = this.ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(600, at);
        lp.frequency.exponentialRampToValueAtTime(5000, at + dur);
        const og = this.ctx.createGain();
        og.gain.setValueAtTime(0.0001, at);
        og.gain.exponentialRampToValueAtTime(0.16, at + dur - 0.01);
        og.gain.linearRampToValueAtTime(0, at + dur);
        o.connect(lp).connect(og).connect(this.bus);
        o.start(at);
        o.stop(at + dur + 0.02);
        nodes.push(o);
        break;
      }
      case 'tick': {
        const m = (step === 0 ? chord[2] : chord[chord.length - 1])! + 12;
        for (const [ratio, lvl, dec] of [
          [1, 0.55, 0.045],
          [2.76, 0.18, 0.02],
        ] as const) {
          const o = this.ctx.createOscillator();
          o.frequency.value = mtof(m) * ratio;
          o.connect(this.env(at, lvl, 0.001, dec)).connect(this.bus);
          o.start(at);
          o.stop(at + 0.08);
          nodes.push(o);
        }
        nodes.push(this.noiseBurst(at, 'highpass', 5000, 0.3, 0.012, 0.7));
        break;
      }
      case 'three': {
        nodes.push(this.noiseBurst(at, 'highpass', 4200, 0.2, 0.05, 0.8));
        const f0 = mtof(chord[chord.length - 1]!);
        nodes.push(...this.voice(at + 0.04, dur, f0, VOWELS.r, 0.42, 1, VOWELS.ee, 0.06));
        break;
      }
      case 'two': {
        nodes.push(this.noiseBurst(at, 'highpass', 3000, 0.35, 0.018, 1));
        const f0 = mtof(chord[chord.length - 2]!);
        nodes.push(...this.voice(at + 0.012, dur, f0, VOWELS.oo, 0.5, 1));
        break;
      }
    }
    return nodes;
  }

  dispose(): void {
    this.bus.disconnect();
  }

  private env(at: number, peak: number, attack: number, decay: number): GainNode {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(peak, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
    return g;
  }

  private src(): AudioBufferSourceNode {
    if (!this.noise) {
      const { ctx } = this;
      this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      let s = 777;
      for (let i = 0; i < d.length; i++) {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        d[i] = (s / 0x7fffffff) * 2 - 1;
      }
    }
    const n = this.ctx.createBufferSource();
    n.buffer = this.noise;
    return n;
  }

  private noiseBurst(
    at: number,
    type: BiquadFilterType,
    hz: number,
    level: number,
    len: number,
    q: number,
  ): AudioBufferSourceNode {
    const n = this.src();
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = hz;
    f.Q.value = q;
    n.connect(f)
      .connect(this.env(at, level, 0.002, len))
      .connect(this.bus);
    n.start(at, Math.random() * 0.5, len + 0.05);
    return n;
  }

  /**
   * A sung syllable by formant synthesis: a buzzy source through three resonances, optionally
   * gliding from one vowel to another over `glide` seconds, with a firm (not clicky) cut-off.
   */
  private voice(
    at: number,
    dur: number,
    f0: number,
    vowel: readonly number[],
    level: number,
    drive: number,
    to?: readonly number[],
    glide = 0,
  ): AudioScheduledSourceNode[] {
    const { ctx } = this;
    const src = ctx.createOscillator();
    src.type = 'sawtooth';
    src.frequency.setValueAtTime(f0 * 1.06, at);
    src.frequency.exponentialRampToValueAtTime(f0, at + 0.05);
    const sum = ctx.createGain();
    vowel.forEach((hz, i) => {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(hz, at);
      if (to) bp.frequency.linearRampToValueAtTime(to[i]!, at + glide);
      bp.Q.value = [6, 9, 11][i]!;
      const g = ctx.createGain();
      g.gain.value = [1.6, 1, 0.5][i]! * drive;
      src.connect(bp).connect(g).connect(sum);
    });
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(level, at + 0.012);
    g.gain.setValueAtTime(level, at + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    sum.connect(g).connect(this.bus);
    src.start(at);
    src.stop(at + dur + 0.02);
    return [src];
  }
}
