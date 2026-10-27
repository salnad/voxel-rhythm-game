/**
 * TWO BUTTONS input remap as pure logic: DEFEND keys play the block lane, ATTACK keys play
 * the lane of the nearest pending offensive cue (so the move follows the chart), or alternate
 * slash and stab when no attack is due.
 */
import { ACTIONS, type Action } from '../../chart/types';
import type { LaneInput } from '../../rhythm/input';

/** Physical keys, in KeyboardLanes order: D/F defend (left hand), J/K attack (right hand). */
export const TWO_BUTTON_KEYS = ['KeyF', 'KeyJ', 'KeyD', 'KeyK'] as const;
const DEFEND_SLOTS = new Set([0, 2]);

export const BLOCK_LANE = ACTIONS.indexOf('block');
const SLASH_LANE = ACTIONS.indexOf('slash');
const STAB_LANE = ACTIONS.indexOf('stab');

export type Button = 'defend' | 'attack';

export function buttonOf(slot: number): Button {
  return DEFEND_SLOTS.has(slot) ? 'defend' : 'attack';
}

export interface OffenseCue {
  lane: number;
  time: number;
  action: Action;
}

/** The pending offensive cue nearest to `time` within `reach` seconds, or null. */
export function nearestOffense(
  cues: readonly OffenseCue[],
  time: number,
  reach: number,
): OffenseCue | null {
  let best: OffenseCue | null = null;
  let bestD = reach;
  for (const c of cues) {
    if (c.action === 'block') continue;
    const d = Math.abs(c.time - time);
    if (d <= bestD) {
      best = c;
      bestD = d;
    }
  }
  return best;
}

/** Maps physical two-button presses to lanes; key-ups follow their press's lane. */
export class TwoButtonMapper {
  private readonly downLane = new Map<number, number>();
  private ghost = 0;

  constructor(private readonly reach: number) {}

  map(input: LaneInput, pending: readonly OffenseCue[]): LaneInput {
    if (!input.down) {
      const lane = this.downLane.get(input.lane) ?? input.lane;
      this.downLane.delete(input.lane);
      return { ...input, lane };
    }
    let lane: number;
    if (buttonOf(input.lane) === 'defend') {
      lane = BLOCK_LANE;
    } else {
      const cue = nearestOffense(pending, input.time, this.reach);
      lane = cue ? cue.lane : this.ghost++ % 2 === 0 ? SLASH_LANE : STAB_LANE;
    }
    this.downLane.set(input.lane, lane);
    return { ...input, lane };
  }
}
