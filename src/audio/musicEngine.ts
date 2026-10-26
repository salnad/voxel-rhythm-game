import type { Chart } from '../chart/build';
import { WONKY } from '../config/gameplay';
import { ClockSync } from '../core/clockSync';
import type { MeasurePlay } from '../game/conductor';

/** Seconds of scheduling headroom when starting playback. */
const START_AHEAD = 0.1;
/** Measures are committed to audio this long (s) before they start. */
export const SCHEDULE_LOOKAHEAD = 0.15;
const XFADE = 0.012;

interface StemVoice {
  src: AudioBufferSourceNode;
  gain: GainNode;
}

/**
 * Plays a map's music on the adaptive timeline and is the single source of truth for game
 * time. Music is a set of stems (one per song part, or a single "mix" for audio-file maps),
 * each through its own gain node so action-music layers can perform, mute or glitch parts.
 *
 * Game time = chart/audio time until the first retry. Each measure play is scheduled
 * SCHEDULE_LOOKAHEAD ahead: if it continues from the previous measure the stems just keep
 * playing; if it repeats a measure (or follows a wonky one) the stems crossfade-jump to that
 * measure's offset. A failed combo makes the rest of its measure wonky (bitcrush, pitch
 * wobble, stutter gate, tape-stop) via `wonky()`.
 */
export class MusicEngine {
  readonly parts = new Map<string, GainNode>();
  /** Every part mixes into this bus; mix-wide layers can process it. */
  readonly musicBus: GainNode;
  readonly output: GainNode;
  private readonly dry: GainNode;
  private readonly crush: GainNode;
  private readonly filter: BiquadFilterNode;
  private readonly gate: GainNode;
  private readonly detune: ConstantSourceNode;
  private readonly lfo: OscillatorNode;
  private readonly lfoDepth: GainNode;
  private voices = new Map<string, StemVoice>();
  private readonly sync = new ClockSync();
  private anchor = 0;
  private pausedAt: number | null = null;
  private lastScheduled: MeasurePlay | null = null;
  private resyncAt: number | null = null;
  private started = false;
  /** Positive = the player hears audio late, so judge/display later. */
  userOffsetSec = 0;
  private useOutputTimestamp = true;

  constructor(
    readonly ctx: AudioContext,
    private readonly chart: Chart,
    private readonly stems: Record<string, AudioBuffer>,
  ) {
    this.output = ctx.createGain();
    this.output.connect(ctx.destination);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 5;
    comp.attack.value = 0.003;
    comp.release.value = 0.15;
    this.musicBus = ctx.createGain();
    this.dry = ctx.createGain();
    this.crush = ctx.createGain();
    this.crush.gain.value = 0;
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 20000;
    this.gate = ctx.createGain();
    this.musicBus.connect(this.dry).connect(this.filter);
    this.musicBus.connect(crusher(ctx)).connect(this.crush).connect(this.filter);
    this.filter.connect(this.gate).connect(comp).connect(this.output);

    this.detune = ctx.createConstantSource();
    this.detune.offset.value = 0;
    this.detune.start();
    this.lfo = ctx.createOscillator();
    this.lfo.frequency.value = 6;
    this.lfoDepth = ctx.createGain();
    this.lfoDepth.gain.value = 0;
    this.lfo.connect(this.lfoDepth).connect(this.detune.offset);
    this.lfo.start();

    for (const name of Object.keys(stems)) {
      const g = ctx.createGain();
      g.connect(this.musicBus);
      this.parts.set(name, g);
    }
  }

  get playing(): boolean {
    return this.started && this.pausedAt === null;
  }

  /** Context time (scheduling domain) at which game time t is heard. */
  ctxTimeFor(t: number): number {
    return this.anchor - this.outputLatency() + t;
  }

  /** Start so that game time `from` (negative for a lead-in) is heard shortly. */
  start(from: number): void {
    const now = this.ctx.currentTime;
    const base = now + START_AHEAD - from;
    this.anchor = base + this.outputLatency();
    this.started = true;
    this.pausedAt = null;
    this.sync.reset();
    this.sampleClock(performance.now());
    this.startVoices(Math.max(now + START_AHEAD, base), Math.max(0, from), true);
  }

  async pause(): Promise<void> {
    if (this.pausedAt !== null || !this.started) return;
    this.pausedAt = this.rawTimeAt(performance.now());
    await this.ctx.suspend();
  }

  async resume(): Promise<void> {
    if (this.pausedAt === null) return;
    await this.ctx.resume();
    this.sync.reset();
    this.pausedAt = null;
  }

  stop(): void {
    for (const v of this.voices.values()) stopVoice(v, this.ctx.currentTime);
    this.voices.clear();
    this.started = false;
    try {
      this.lfo.stop();
      this.detune.stop();
    } catch {
      /* already stopped */
    }
    this.output.disconnect();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  /** Commit measure plays that start within the lookahead. Call every frame. */
  schedule(plays: readonly MeasurePlay[], now: number): void {
    for (const p of plays) {
      if (p.start > now + SCHEDULE_LOOKAHEAD) break;
      if (this.lastScheduled && p.index <= this.lastScheduled.index) continue;
      const prev = this.lastScheduled;
      this.lastScheduled = p;
      if (!prev) continue; // the first measure plays from the initial start
      const resync = this.resyncAt !== null && Math.abs(this.resyncAt - p.start) < 1e-3;
      if (p.bar === prev.bar + 1 && !resync) continue;
      this.resyncAt = null;
      const offset = this.chart.bars[p.bar]!.startSec;
      this.startVoices(this.ctxTimeFor(p.start), offset, false);
    }
  }

  /**
   * Make the music wonky from game time `from` until `until` (end of the failed measure):
   * bitcrush, pitch wobble, a stutter gate and a tape-stop into the boundary. The next
   * measure always resyncs, so the drift never leaks.
   */
  wonky(from: number, until: number): void {
    const a = this.ctxTimeFor(from);
    const b = this.ctxTimeFor(until);
    const span = Math.max(0.05, b - a);
    const ramp = (p: AudioParam, from0: number, to: number, at: number, end: number) => {
      p.cancelScheduledValues(at);
      p.setValueAtTime(from0, at);
      p.linearRampToValueAtTime(to, end);
    };
    ramp(this.crush.gain, 0, WONKY.crush, a, a + 0.03);
    ramp(this.dry.gain, 1, 1 - WONKY.crush * 0.8, a, a + 0.03);
    this.filter.frequency.cancelScheduledValues(a);
    this.filter.frequency.setValueAtTime(20000, a);
    this.filter.frequency.exponentialRampToValueAtTime(WONKY.filterHz, b);
    ramp(this.lfoDepth.gain, 0, WONKY.wobbleCents, a, a + 0.05);
    this.lfo.frequency.setValueAtTime(WONKY.wobbleHz, a);
    // tape-stop over the last part of the measure
    const stopAt = Math.max(a, b - Math.min(WONKY.tapeStop, span));
    this.detune.offset.cancelScheduledValues(a);
    this.detune.offset.setValueAtTime(0, a);
    this.detune.offset.setValueAtTime(0, stopAt);
    this.detune.offset.linearRampToValueAtTime(-WONKY.tapeStopCents, b);
    // stutter gate (1/32 chops) right after the miss
    const g = this.gate.gain;
    g.cancelScheduledValues(a);
    const chop = 60 / this.chart.tempo.bpmAtBeat(0) / 8;
    let t = a;
    let on = true;
    while (t < Math.min(b, a + WONKY.stutterSeconds)) {
      g.setValueAtTime(on ? 1 : 0.15, t);
      on = !on;
      t += chop;
    }
    g.setValueAtTime(1, Math.min(b, t));
    // reset at the boundary
    for (const p of [this.crush.gain, this.dry.gain, this.lfoDepth.gain, this.detune.offset]) {
      p.setValueAtTime(p === this.dry.gain ? 1 : 0, b);
    }
    this.filter.frequency.setValueAtTime(20000, b);
    g.setValueAtTime(1, b);
    this.resyncAt = until;
  }

  private startVoices(when: number, offset: number, initial: boolean): void {
    const old = this.voices;
    this.voices = new Map();
    for (const [name, buf] of Object.entries(this.stems)) {
      const part = this.parts.get(name)!;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const gain = this.ctx.createGain();
      src.connect(gain).connect(part);
      this.detune.connect(src.detune);
      if (initial) {
        gain.gain.value = 1;
      } else {
        gain.gain.setValueAtTime(0, when);
        gain.gain.linearRampToValueAtTime(1, when + XFADE);
      }
      if (offset < buf.duration) src.start(when, offset);
      this.voices.set(name, { src, gain });
    }
    for (const v of old.values()) stopVoice(v, when);
  }

  /** Call once per animation frame. */
  sampleClock(perfNow: number): void {
    const ts = this.useOutputTimestamp ? this.ctx.getOutputTimestamp?.() : undefined;
    if (
      ts &&
      ts.contextTime !== undefined &&
      ts.performanceTime !== undefined &&
      ts.performanceTime > 0 &&
      ts.contextTime > 0
    ) {
      this.sync.sample(ts.contextTime + this.outputLatency(), ts.performanceTime);
      if (Math.abs(this.sync.ctxTimeAt(perfNow) - this.ctx.currentTime) > 0.5) {
        this.useOutputTimestamp = false;
        this.sync.reset();
      }
    } else {
      this.sync.sample(this.ctx.currentTime, perfNow);
    }
  }

  /** Game time (s) at a performance.now() timestamp, e.g. a KeyboardEvent.timeStamp. */
  timeAt(perfMs: number): number {
    return this.rawTimeAt(perfMs) - this.userOffsetSec;
  }

  private rawTimeAt(perfMs: number): number {
    if (this.pausedAt !== null) return this.pausedAt;
    return this.sync.ctxTimeAt(perfMs) - this.anchor;
  }

  private outputLatency(): number {
    const c = this.ctx as AudioContext & { outputLatency?: number };
    return (c.outputLatency || 0) + (c.baseLatency || 0);
  }
}

function stopVoice(v: StemVoice, at: number): void {
  try {
    v.gain.gain.cancelScheduledValues(at);
    v.gain.gain.setValueAtTime(v.gain.gain.value, at);
    v.gain.gain.linearRampToValueAtTime(0, at + XFADE);
    v.src.stop(at + XFADE + 0.01);
  } catch {
    /* not started */
  }
}

function crusher(ctx: BaseAudioContext): WaveShaperNode {
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.round(Math.tanh(x * 2) * 5) / 5;
  }
  const s = ctx.createWaveShaper();
  s.curve = curve;
  return s;
}
