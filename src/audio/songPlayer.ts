import { ClockSync } from '../core/clockSync';

/** Seconds of scheduling headroom when starting playback. */
const START_AHEAD = 0.08;

/**
 * Plays one AudioBuffer and is the single source of truth for song time.
 *
 * Song time = audio-file position (seconds) of the sample the player is *hearing*,
 * minus the user's audio offset. Chart note times live in the same domain, so the
 * judge can compare input times directly against note times.
 */
export class SongPlayer {
  readonly ctx: AudioContext;
  readonly output: GainNode;
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private readonly sync = new ClockSync();
  /** Context time at which audio-file position 0 is (or would be) audible. */
  private anchor = 0;
  private pausedAt: number | null = 0;
  /** Positive = the player hears audio late, so judge/display later. */
  userOffsetSec = 0;
  private useOutputTimestamp = true;

  constructor(ctx?: AudioContext) {
    this.ctx = ctx ?? new AudioContext({ latencyHint: 'interactive' });
    this.output = this.ctx.createGain();
    this.output.connect(this.ctx.destination);
  }

  setBuffer(buffer: AudioBuffer): void {
    this.stop();
    this.buffer = buffer;
    this.pausedAt = 0;
  }

  get duration(): number {
    return this.buffer?.duration ?? 0;
  }

  get playing(): boolean {
    return this.pausedAt === null;
  }

  async resumeContext(): Promise<void> {
    if (this.ctx.state !== 'running') await this.ctx.resume();
  }

  /** Start playing so that audio position `fromPos` (may be negative for a lead-in) is heard shortly. */
  play(fromPos: number): void {
    if (!this.buffer) throw new Error('SongPlayer: no buffer');
    this.stopSource();
    const now = this.ctx.currentTime;
    const outLatency = this.outputLatency();
    // We want position p heard at ctx time anchor + p + outLatency; schedule accordingly.
    const scheduleAnchor = now + START_AHEAD - fromPos;
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer;
    src.connect(this.output);
    const when = Math.max(now + START_AHEAD, scheduleAnchor);
    const offset = Math.max(0, fromPos);
    if (offset < this.buffer.duration) src.start(when, offset);
    this.source = src;
    this.anchor = scheduleAnchor + outLatency;
    this.pausedAt = null;
    this.sync.reset();
    this.sampleClock(performance.now());
  }

  pause(): void {
    if (this.pausedAt !== null) return;
    this.pausedAt = this.rawPositionAt(performance.now());
    this.stopSource();
  }

  resume(): void {
    if (this.pausedAt === null) return;
    this.play(this.pausedAt);
  }

  stop(): void {
    this.stopSource();
    this.pausedAt = 0;
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
      // contextTime is what the output device is playing *now*; undo our own latency add.
      this.sync.sample(ts.contextTime + this.outputLatency(), ts.performanceTime);
      // Sanity: some platforms report garbage; fall back if far from currentTime.
      if (Math.abs(this.sync.ctxTimeAt(perfNow) - this.ctx.currentTime) > 0.5) {
        this.useOutputTimestamp = false;
        this.sync.reset();
      }
    } else {
      this.sync.sample(this.ctx.currentTime, perfNow);
    }
  }

  /** Song time (s) at a performance.now() timestamp, e.g. a KeyboardEvent.timeStamp. */
  songTimeAt(perfMs: number): number {
    return this.rawPositionAt(perfMs) - this.userOffsetSec;
  }

  private rawPositionAt(perfMs: number): number {
    if (this.pausedAt !== null) return this.pausedAt;
    return this.sync.ctxTimeAt(perfMs) - this.anchor;
  }

  private outputLatency(): number {
    const c = this.ctx as AudioContext & { outputLatency?: number };
    return (c.outputLatency || 0) + (c.baseLatency || 0);
  }

  private stopSource(): void {
    if (this.source) {
      try {
        this.source.stop();
      } catch {
        /* already stopped */
      }
      this.source.disconnect();
      this.source = null;
    }
  }
}
