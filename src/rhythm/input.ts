/** A lane press/release in song time. Keyboard, touch and autoplay all produce these. */
export interface LaneInput {
  lane: number;
  down: boolean;
  time: number;
  auto?: boolean;
  /** Song time the hero's move should connect, when an experiment retimes it (default: now). */
  moveAt?: number;
}

/**
 * Keyboard → LaneInput. Converts each event's own timeStamp to song time, so judgement
 * precision doesn't depend on frame rate.
 */
export class KeyboardLanes {
  private readonly queue: LaneInput[] = [];
  private readonly held = new Set<number>();
  private keys: string[] = [];
  private altKeys: string[] = [];
  private readonly onDown = (e: KeyboardEvent) => this.handle(e, true);
  private readonly onUp = (e: KeyboardEvent) => this.handle(e, false);

  constructor(private readonly toSongTime: (perfMs: number) => number) {
    window.addEventListener('keydown', this.onDown);
    window.addEventListener('keyup', this.onUp);
  }

  /** Key codes per lane, plus an optional second binding per lane. */
  setKeys(keys: string[], altKeys: string[] = []): void {
    this.keys = keys;
    this.altKeys = keys.length ? altKeys : [];
    this.held.clear();
  }

  isHeld(lane: number): boolean {
    return this.held.has(lane);
  }

  /** Inject from other sources (touch, pointer) with a perf timestamp. */
  push(lane: number, down: boolean, perfMs: number): void {
    if (down === this.held.has(lane)) return;
    if (down) this.held.add(lane);
    else this.held.delete(lane);
    this.queue.push({ lane, down, time: this.toSongTime(perfMs) });
  }

  drain(): LaneInput[] {
    return this.queue.splice(0, this.queue.length);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onDown);
    window.removeEventListener('keyup', this.onUp);
  }

  private handle(e: KeyboardEvent, down: boolean): void {
    let lane = this.keys.indexOf(e.code);
    if (lane < 0) lane = this.altKeys.indexOf(e.code);
    if (lane < 0) return;
    e.preventDefault();
    if (e.repeat) return;
    this.push(lane, down, e.timeStamp);
  }
}

/** Deterministic PRNG (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** What the autoplayer needs to know about a cue. */
export interface AutoCue {
  id: number;
  lane: number;
  time: number;
  endTime: number | null;
  bar: number;
  attempt: number;
}

/**
 * Scripted "bot" input for demos and soak tests. It goes through the real judge, with
 * gaussian timing jitter and a deliberate miss rate. Cues arrive as the adaptive timeline
 * plans them, and dropped cues are forgotten. `failFirstTry` lists bars where it misses one
 * cue on the first attempt, to show a failed combo and its retry.
 */
export class AutoPlayer {
  private readonly queue: Array<LaneInput & { cue: number }> = [];
  private readonly r: () => number;
  private readonly failed = new Set<number>();

  constructor(
    private readonly jitter: number,
    private readonly missRate: number,
    seed: number,
    private readonly failFirstTry: readonly number[] = [],
  ) {
    this.r = rng(seed);
  }

  private gauss(): number {
    const u = Math.max(1e-9, this.r());
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * this.r());
  }

  onCues(cues: readonly AutoCue[]): void {
    for (const c of cues) {
      if (c.attempt === 1 && this.failFirstTry.includes(c.bar) && !this.failed.has(c.bar)) {
        // skip the second cue of the measure (or the first if there's only one)
        const skipIndex = cues.filter((x) => x.bar === c.bar && x.attempt === 1).length > 1 ? 1 : 0;
        const nth = cues.filter((x) => x.bar === c.bar && x.attempt === 1).indexOf(c);
        if (nth === skipIndex) {
          this.failed.add(c.bar);
          continue;
        }
      }
      if (this.r() < this.missRate) continue;
      const t = c.time + this.gauss() * this.jitter;
      this.queue.push({ lane: c.lane, down: true, time: t, auto: true, cue: c.id });
      const up = c.endTime !== null ? c.endTime + 0.01 : t + 0.05;
      this.queue.push({ lane: c.lane, down: false, time: up, auto: true, cue: c.id });
    }
    this.queue.sort((a, b) => a.time - b.time || (a.down === b.down ? 0 : a.down ? 1 : -1));
  }

  onDropped(ids: readonly number[]): void {
    const drop = new Set(ids);
    for (let i = this.queue.length - 1; i >= 0; i--) {
      const q = this.queue[i]!;
      if (drop.has(q.cue) && q.down) this.queue.splice(i, 1);
    }
  }

  /** Inputs due by time t, in order. */
  due(t: number): LaneInput[] {
    const out: LaneInput[] = [];
    while (this.queue.length && this.queue[0]!.time <= t) {
      const q = this.queue.shift()!;
      out.push({ lane: q.lane, down: q.down, time: q.time, auto: true });
    }
    return out;
  }
}
