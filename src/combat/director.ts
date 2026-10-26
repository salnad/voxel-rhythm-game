import type { Action, Note } from '../chart/types';
import type { Judgement, JudgementEvent, JudgementKind } from '../rhythm/judge';
import type { AttackModifiers } from '../synth/modifiers';

/** A judged cue turned into a sword action, already carrying the synth modifiers. */
export interface DuelAction {
  noteId: number;
  lane: number;
  action: Action;
  encounter: number;
  kind: JudgementKind;
  judgement: Judgement;
  hit: boolean;
  /** True for a hold head: the hero holds the move (blade lock, grind) until release. */
  hold: boolean;
  /** True when this resolves the encounter's last cue. */
  final: boolean;
  crit: boolean;
  time: number;
  mods: AttackModifiers;
}

/**
 * Judgement → duel action. This is the seam where future systems (weapons, synth-driven
 * patterns) plug in: they transform or add actions here.
 */
export function resolveJudgement(
  e: JudgementEvent,
  note: Note,
  lastNoteOfEncounter: boolean,
  mods: AttackModifiers,
): DuelAction {
  const hit = e.judgement !== 'miss';
  const offensive = note.action !== 'block';
  return {
    noteId: e.noteId,
    lane: e.lane,
    action: note.action,
    encounter: note.encounter,
    kind: e.kind,
    judgement: e.judgement,
    hit,
    hold: hit && e.kind === 'holdStart',
    // A hold is only resolved by its release (or by a missed head).
    final: lastNoteOfEncounter && (e.kind !== 'holdStart' || !hit),
    crit: hit && offensive && e.judgement === 'perfect' && mods.critMultiplier > 1.15,
    time: e.time,
    mods,
  };
}
