/**
 * Maps performance.now() timestamps (ms) to AudioContext time (s) of what is currently
 * audible at the speakers.
 *
 * AudioContext time advances in coarse render-quantum steps, so reading it every frame
 * gives jittery visuals. We keep a smoothed linear offset between the two clocks and
 * snap if the clocks drift apart (e.g. after a tab stall or device change).
 */
export class ClockSync {
  private offset: number | null = null;

  constructor(
    /** Fraction of each new sample blended in (0..1). */
    private readonly smoothing = 0.08,
    /** Snap instead of smoothing when the error exceeds this many seconds. */
    private readonly snapThreshold = 0.03,
  ) {}

  /** Feed one sample: audible context time `ctxTime` (s) observed at `perfMs`. */
  sample(ctxTime: number, perfMs: number): void {
    const o = ctxTime - perfMs / 1000;
    if (this.offset === null || Math.abs(o - this.offset) > this.snapThreshold) {
      this.offset = o;
    } else {
      this.offset += (o - this.offset) * this.smoothing;
    }
  }

  reset(): void {
    this.offset = null;
  }

  get ready(): boolean {
    return this.offset !== null;
  }

  /** Estimated audible context time at a performance.now() timestamp. */
  ctxTimeAt(perfMs: number): number {
    return perfMs / 1000 + (this.offset ?? 0);
  }
}
