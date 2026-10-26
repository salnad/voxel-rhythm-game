import type { Action } from '../chart/types';
import type { Cue } from '../game/conductor';
import type { Judgement, JudgementEvent, JudgementKind } from '../rhythm/judge';
import type { AttackModifiers } from '../synth/modifiers';

/** A judged cue turned into a sword action, already carrying the synth modifiers. */
export interface DuelAction {
  /** Cue id (one chart note in one measure play). */
  noteId: number;
  chartNoteId: number;
  lane: number;
  action: Action;
  encounter: number;
  kind: JudgementKind;
  judgement: Judgement;
  hit: boolean;
  /** True for a hold head: the hero holds the move (blade lock, grind) until release. */
  hold: boolean;
  /** True when this resolves the encounter (its last cue, with no retry coming). */
  final: boolean;
  /** True when the cue is inside a boss combo measure. */
  combo: boolean;
  crit: boolean;
  time: number;
  mods: AttackModifiers;
}

/**
 * Judgement → duel action. This is the seam where future systems (weapons, synth-driven
 * patterns) plug in: they transform or add actions here.
 * `resolvesEncounter`: the cue is its encounter's last note and won't be retried.
 */
export function resolveJudgement(
  e: JudgementEvent,
  cue: Cue,
  resolvesEncounter: boolean,
  mods: AttackModifiers,
): DuelAction {
  const hit = e.judgement !== 'miss';
  const offensive = cue.action !== 'block';
  return {
    noteId: e.noteId,
    chartNoteId: cue.noteId,
    lane: e.lane,
    action: cue.action,
    encounter: cue.encounter,
    kind: e.kind,
    judgement: e.judgement,
    hit,
    hold: hit && e.kind === 'holdStart',
    // A hold is only resolved by its release (or by a missed head).
    final: resolvesEncounter && (e.kind !== 'holdStart' || !hit),
    combo: cue.combo,
    crit: hit && offensive && e.judgement === 'perfect' && mods.critMultiplier > 1.15,
    time: e.time,
    mods,
  };
}
