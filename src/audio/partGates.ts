import type { Action } from '../chart/types';
import type { InstrumentBinding, MissMode } from '../config/instrumentMapping';

export interface GateState {
  mode: MissMode;
  /** Game time the part dropped out. */
  from: number;
  /** Latest time it comes back on its own. */
  until: number;
}

/**
 * Which parts a missed action has knocked out, and when they come back. Pure logic: the
 * instrument layer turns it into gain automation.
 *  - a miss on action a knocks out a's part from the miss time
 *  - the part comes back on a's next cue (so the song carries on when you do), or after
 *    `maxMute` seconds at the latest
 */
export class PartGates {
  private readonly out = new Map<string, GateState>();

  constructor(
    private readonly bindings: Record<Action, InstrumentBinding>,
    private readonly maxMute: number,
  ) {}

  miss(action: Action, t: number): { part: string; state: GateState } {
    const b = this.bindings[action];
    const state = { mode: b.onMiss, from: t, until: t + this.maxMute };
    this.out.set(b.part, state);
    return { part: b.part, state };
  }

  /** A cue of `action` arrives at `cueTime`: its part comes back if it was out. */
  cue(action: Action, cueTime: number): string | null {
    const part = this.bindings[action].part;
    const s = this.out.get(part);
    if (!s || cueTime <= s.from) return null;
    this.out.delete(part);
    return part;
  }

  /** Parts whose time-out ran out by t (they come back). */
  expire(t: number): string[] {
    const back: string[] = [];
    for (const [part, s] of this.out) {
      if (t >= s.until) {
        this.out.delete(part);
        back.push(part);
      }
    }
    return back;
  }

  state(part: string): GateState | null {
    return this.out.get(part) ?? null;
  }
}
