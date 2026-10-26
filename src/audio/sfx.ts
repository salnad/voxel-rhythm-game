/** Small synthesized one-shots played live (hitsounds, hurt, calibration clicks). */
export class Sfx {
  private readonly out: GainNode;
  private noise: AudioBuffer | null = null;

  constructor(private readonly ctx: AudioContext) {
    this.out = ctx.createGain();
    this.out.connect(ctx.destination);
  }

  set volume(v: number) {
    this.out.gain.value = v;
  }

  hit(lane: number, perfect: boolean): void {
    const { ctx } = this;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime([1320, 1760, 990, 2200][lane % 4]! * (perfect ? 1 : 0.75), t);
    o.frequency.exponentialRampToValueAtTime(400, t + 0.04);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g).connect(this.out);
    o.start(t);
    o.stop(t + 0.06);
  }

  hurt(): void {
    const { ctx } = this;
    const t = ctx.currentTime;
    if (!this.noise) {
      this.noise = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < d.length; i++)
        d[i] = (Math.random() * 2 - 1) * (Math.random() < 0.2 ? 1 : 0.2);
    }
    const n = ctx.createBufferSource();
    n.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(2500, t);
    f.frequency.exponentialRampToValueAtTime(200, t + 0.25);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    n.connect(f).connect(g).connect(this.out);
    n.start(t);
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
