import type { Note } from '../chart/types';

/** A lane press/release in song time. Keyboard, touch and autoplay all produce these. */
export interface LaneInput {
  lane: number;
  down: boolean;
  time: number;
  auto?: boolean;
}

/**
 * Keyboard → LaneInput. Converts each event's own timeStamp to song time, so judgement
 * precision doesn't depend on frame rate.
 */
export class KeyboardLanes {
  private readonly queue: LaneInput[] = [];
  private readonly held = new Set<number>();
  private keys: string[] = [];
  private readonly onDown = (e: KeyboardEvent) => this.handle(e, true);
  private readonly onUp = (e: KeyboardEvent) => this.handle(e, false);

  constructor(private readonly toSongTime: (perfMs: number) => number) {
    window.addEventListener('keydown', this.onDown);
    window.addEventListener('keyup', this.onUp);
  }

  setKeys(keys: string[]): void {
    this.keys = keys;
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
    const lane = this.keys.indexOf(e.code);
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

/**
 * Scripted "bot" input for demos and soak tests. It goes through the real judge,
 * with gaussian timing jitter and a deliberate miss rate.
 */
export function autoplayInputs(
  notes: readonly Note[],
  jitter: number,
  missRate: number,
  seed: number,
): LaneInput[] {
  const r = rng(seed);
  const gauss = () => {
    const u = Math.max(1e-9, r());
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
  };
  const out: LaneInput[] = [];
  for (const n of notes) {
    if (r() < missRate) continue;
    const t = n.time + gauss() * jitter;
    out.push({ lane: n.lane, down: true, time: t, auto: true });
    const up = n.endTime !== null ? n.endTime + 0.01 : t + 0.05;
    out.push({ lane: n.lane, down: false, time: up, auto: true });
  }
  return out.sort((a, b) => a.time - b.time || (a.down === b.down ? 0 : a.down ? 1 : -1));
}
