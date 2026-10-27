import type { CompEvent } from '../../audio/demo/composition';
import { beatKey } from '../../audio/demo/keysounds';
import { renderOneShots } from '../../audio/demo/render';
import type { Action } from '../../chart/types';
import type { Judgement } from '../../rhythm/judge';
import { keysoundStart } from './timing';

const renderCache = new Map<string, Promise<Map<number, AudioBuffer>>>();

/** Render (once per song and sample rate) one buffer per cue group, keyed by beatKey. */
function renderGroups(
  cacheKey: string,
  groups: Map<number, CompEvent[]>,
  bpm: number,
  sampleRate: number,
): Promise<Map<number, AudioBuffer>> {
  const key = `${cacheKey}@${sampleRate}`;
  let p = renderCache.get(key);
  if (!p) {
    const keys = [...groups.keys()];
    p = renderOneShots(
      keys.map((k) => groups.get(k)!),
      bpm,
      sampleRate,
    ).then((bufs) => new Map(keys.map((k, i) => [k, bufs[i]!])));
    renderCache.set(key, p);
  }
  return p;
}

/**
 * Plays a song's cue notes as keysounds: each hit schedules its cue's own sound on the audio
 * clock at the cue's beat (early presses wait for the beat, late ones play at once). A miss
 * plays a dull muted thunk and a stray press a quiet dead tick, so the hole in the music is the
 * miss feedback. Everything runs through `bus`, which the caller connects (normally to the
 * engine's music bus, so the mix compressor, wonky FX and volume apply).
 */
export class KeysoundPlayer {
  readonly bus: GainNode;
  private buffers: Map<number, AudioBuffer> | null = null;
  private readonly live = new Set<AudioScheduledSourceNode>();
  private noise: AudioBuffer | null = null;
  private disposed = false;

  constructor(private readonly ctx: AudioContext) {
    this.bus = ctx.createGain();
  }

  /** Start rendering the one-shots; hits before they are ready stay silent. */
  load(cacheKey: string, groups: Map<number, CompEvent[]>, bpm: number): Promise<void> {
    return renderGroups(cacheKey, groups, bpm, this.ctx.sampleRate).then((b) => {
      if (!this.disposed) this.buffers = b;
    });
  }

  get ready(): boolean {
    return this.buffers !== null;
  }

  /** Play the cue at song beat `beat` (its context time `target`). Returns the start time. */
  hit(beat: number, target: number, j: Judgement, level = 1): number | null {
    const buf = this.buffers?.get(beatKey(beat));
    if (!buf || this.disposed) return null;
    const { ctx } = this;
    const s = keysoundStart(target, ctx.currentTime, j);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const shelf = ctx.createBiquadFilter();
    shelf.type = 'highshelf';
    shelf.frequency.value = 2500;
    shelf.gain.value = s.shelfDb;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = s.lowpassHz;
    const g = ctx.createGain();
    g.gain.value = s.gain * level;
    src.connect(shelf).connect(lp).connect(g).connect(this.bus);
    this.track(src);
    src.start(s.when);
    return s.when;
  }

  /** A miss: a dull, muted thunk (no pitch, no sustain) where the note should have been. */
  thunk(at = this.ctx.currentTime): void {
    if (this.disposed) return;
    const { ctx } = this;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(140, at);
    o.frequency.exponentialRampToValueAtTime(48, at + 0.09);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.32, at + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.14);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 380;
    o.connect(g).connect(lp).connect(this.bus);
    this.track(o);
    o.start(at);
    o.stop(at + 0.16);
    this.noiseHit(at, 'lowpass', 700, 0.12, 0.05);
  }

  /** A stray press (no cue in reach): a quiet dead tick in the action's register. */
  ghost(action: Action, at = this.ctx.currentTime): void {
    if (this.disposed) return;
    const hz = { block: 300, slash: 1500, stab: 3200, flourish: 2200 }[action];
    this.noiseHit(at, 'bandpass', hz, 0.07, 0.035);
  }

  dispose(): void {
    this.disposed = true;
    for (const s of this.live) {
      try {
        s.stop();
      } catch {
        /* not started */
      }
    }
    this.live.clear();
    this.bus.disconnect();
  }

  private noiseHit(at: number, type: BiquadFilterType, hz: number, level: number, len: number) {
    const { ctx } = this;
    if (!this.noise) {
      this.noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.25), ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      let s = 4242;
      for (let i = 0; i < d.length; i++) {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        d[i] = (s / 0x7fffffff) * 2 - 1;
      }
    }
    const n = ctx.createBufferSource();
    n.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = hz;
    f.Q.value = 1.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(level, at + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    n.connect(f).connect(g).connect(this.bus);
    this.track(n);
    n.start(at, 0, len + 0.02);
  }

  private track(s: AudioScheduledSourceNode): void {
    this.live.add(s);
    s.onended = () => this.live.delete(s);
  }
}
