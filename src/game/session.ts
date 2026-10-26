import type { Chart } from '../chart/build';
import { resolveJudgement, type DuelAction } from '../combat/director';
import { DuelSim, type DuelEvent } from '../combat/duel';
import { JUDGEMENT_WINDOWS } from '../config/gameplay';
import { EventBus } from '../core/events';
import type { LaneInput } from '../rhythm/input';
import { Judge, type JudgementEvent } from '../rhythm/judge';
import { ScoreKeeper } from '../rhythm/score';
import { deriveModifiers, type AttackModifiers } from '../synth/modifiers';
import { DEFAULT_PATCH, type SynthPatch } from '../synth/patch';

export interface SessionEvents extends Record<string, unknown> {
  input: LaneInput;
  judgement: JudgementEvent;
  action: DuelAction;
  duel: DuelEvent;
}

/**
 * One play of one chart. Owns the pipeline:
 *   LaneInput → Judge → JudgementEvent → director (+ synth modifiers) → DuelAction → DuelSim → DuelEvent
 * and publishes each stage on `bus` for renderers/HUD/audio. No DOM, no clocks: the
 * caller passes song time in, which keeps it unit-testable and replayable.
 */
export class GameSession {
  readonly bus = new EventBus<SessionEvents>();
  readonly judge: Judge;
  readonly duel: DuelSim;
  readonly score = new ScoreKeeper();
  patch: SynthPatch;
  mods: AttackModifiers;
  private lastTime = -Infinity;

  constructor(
    readonly chart: Chart,
    opts: { noFail: boolean; patch?: SynthPatch },
  ) {
    this.judge = new Judge(chart.notes, chart.lanes.length, JUDGEMENT_WINDOWS);
    this.duel = new DuelSim(chart, opts.noFail);
    this.patch = { ...(opts.patch ?? DEFAULT_PATCH) };
    this.mods = deriveModifiers(this.patch);
  }

  setPatch(patch: SynthPatch): void {
    this.patch = { ...patch };
    this.mods = deriveModifiers(this.patch);
  }

  /** Process inputs (in time order) then advance to song time t. */
  step(inputs: readonly LaneInput[], t: number): void {
    for (const inp of inputs) {
      this.advance(inp.time);
      this.bus.emit('input', inp);
      const j = inp.down
        ? this.judge.press(inp.lane, inp.time)
        : this.judge.release(inp.lane, inp.time);
      if (j) this.handleJudgement(j);
    }
    this.advance(t);
  }

  get finished(): boolean {
    return this.judge.finished || this.duel.down;
  }

  private advance(t: number): void {
    if (t < this.lastTime) t = this.lastTime;
    this.lastTime = t;
    for (const j of this.judge.update(t)) this.handleJudgement(j);
    for (const d of this.duel.update(t)) this.bus.emit('duel', d);
  }

  private handleJudgement(j: JudgementEvent): void {
    const note = this.chart.notes[j.noteId]!;
    const action = resolveJudgement(j, note, this.duel.isLastCue(j.noteId), this.mods);
    this.score.apply(j, action.crit ? this.mods.critMultiplier : 1);
    this.bus.emit('judgement', j);
    this.bus.emit('action', action);
    this.duel.apply(action);
    for (const d of this.duel.update(j.time)) this.bus.emit('duel', d);
  }
}
