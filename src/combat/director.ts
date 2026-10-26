import { laneStyle, type AttackKind } from '../config/combat';
import type { Judgement, JudgementEvent } from '../rhythm/judge';
import type { AttackModifiers } from '../synth/modifiers';

/** A combat action derived from a judgement, already carrying synth modifiers. */
export interface AttackAction {
  noteId: number;
  lane: number;
  attack: AttackKind;
  judgement: Judgement;
  /** True for a hold head: the enemy is pinned and ground down until release. */
  grind: boolean;
  crit: boolean;
  time: number;
  mods: AttackModifiers;
}

export type DirectorOutput =
  | { type: 'attack'; action: AttackAction }
  | { type: 'letThrough'; noteId: number; lane: number; time: number };

/**
 * Judgement → combat. This is the seam where future systems (weapons, synth-driven
 * attack patterns) plug in: they transform or add AttackActions here.
 */
export function directJudgement(
  e: JudgementEvent,
  laneNames: readonly string[],
  mods: AttackModifiers,
): DirectorOutput {
  if (e.judgement === 'miss') {
    return { type: 'letThrough', noteId: e.noteId, lane: e.lane, time: e.time };
  }
  const style = laneStyle(laneNames[e.lane] ?? '', e.lane);
  const attack: AttackKind = e.kind === 'holdEnd' ? 'finisher' : style.attack;
  return {
    type: 'attack',
    action: {
      noteId: e.noteId,
      lane: e.lane,
      attack,
      judgement: e.judgement,
      grind: e.kind === 'holdStart',
      crit: e.judgement === 'perfect' && mods.critMultiplier > 1.15,
      time: e.time,
      mods,
    },
  };
}
