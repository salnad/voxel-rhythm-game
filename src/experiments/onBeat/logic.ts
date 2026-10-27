/**
 * ON-BEAT ASSIST scheduling as pure functions: which cue a press is for, whether to hold it
 * back until that cue's beat, and the queue that releases held presses on the beat.
 */
import type { JudgementWindows } from '../../config/gameplay';
import type { LaneInput } from '../../rhythm/input';

export const ON_BEAT_WINDOWS: JudgementWindows = {
  perfect: 0.06,
  great: 0.11,
  good: 0.16,
  miss: 0.2,
};

export interface LaneCue {
  id: number;
  time: number;
}

/**
 * The cue a press at `time` will be judged against, using the Judge's own rule: the earliest
 * pending cue in the lane that is not already too late; none if that one is too far ahead.
 * `cues` are the lane's pending cues in time order.
 */
export function cueForPress(
  cues: readonly LaneCue[],
  time: number,
  w: JudgementWindows,
): LaneCue | null {
  for (const c of cues) {
    const offset = time - c.time;
    if (offset > w.good) continue;
    if (offset < -w.miss) return null;
    return c;
  }
  return null;
}

/** An early press that will hit: hold it until the cue's beat. Otherwise resolve it now. */
export function holdUntil(cue: LaneCue | null, time: number, w: JudgementWindows): number | null {
  if (!cue || time >= cue.time) return null;
  return cue.time - time <= w.good ? cue.time : null;
}

interface Held {
  down: LaneInput;
  up: LaneInput | null;
  at: number;
  cueId: number;
}

/**
 * Presses held back until their cue's beat. Each releases with its original time (so the
 * judge grades the real timing) and `moveAt` on the beat (so the hero connects on it).
 */
export class BeatQueue {
  private held: Held[] = [];

  get size(): number {
    return this.held.length;
  }

  isHeld(cueId: number): boolean {
    return this.held.some((h) => h.cueId === cueId);
  }

  /** Lanes with a held press (for the anticipation pose). */
  heldLanes(): number[] {
    return this.held.map((h) => h.down.lane);
  }

  /** Hold a press. Returns any earlier press on the same lane, released now. */
  hold(down: LaneInput, at: number, cueId: number): LaneInput[] {
    const out = this.takeLane(down.lane);
    this.held.push({ down, up: null, at, cueId });
    return out;
  }

  /** A key-up whose press is held follows it out; returns false if nothing is held. */
  up(up: LaneInput): boolean {
    for (let i = this.held.length - 1; i >= 0; i--) {
      const h = this.held[i]!;
      if (h.down.lane === up.lane && !h.up) {
        h.up = up;
        return true;
      }
    }
    return false;
  }

  /** Presses whose beat is at or before `t + lead`, in order. */
  due(t: number, lead = 0): LaneInput[] {
    const out: LaneInput[] = [];
    const keep: Held[] = [];
    for (const h of this.held) {
      if (h.at <= t + lead) out.push(...release(h));
      else keep.push(h);
    }
    this.held = keep;
    return out;
  }

  private takeLane(lane: number): LaneInput[] {
    const out: LaneInput[] = [];
    this.held = this.held.filter((h) => {
      if (h.down.lane !== lane) return true;
      out.push(...release(h));
      return false;
    });
    return out;
  }
}

function release(h: Held): LaneInput[] {
  const out: LaneInput[] = [{ ...h.down, moveAt: h.at }];
  if (h.up) out.push({ ...h.up, time: Math.max(h.up.time, h.down.time) });
  return out;
}
