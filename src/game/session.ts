import type { Chart } from '../chart/build';
import { directJudgement, type AttackAction } from '../combat/director';
import { CombatSim, type CombatEvent } from '../combat/sim';
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
  action: AttackAction;
  combat: CombatEvent;
}

/**
 * One play of one chart. Owns the pipeline:
 *   LaneInput → Judge → JudgementEvent → director (+ synth modifiers) → AttackAction → CombatSim → CombatEvent
 * and publishes each stage on `bus` for renderers/HUD/audio. No DOM, no clocks: the
 * caller passes song time in, which keeps it unit-testable and replayable.
 */
export class GameSession {
  readonly bus = new EventBus<SessionEvents>();
  readonly judge: Judge;
  readonly sim: CombatSim;
  readonly score = new ScoreKeeper();
  patch: SynthPatch;
  mods: AttackModifiers;
  private lastTime = -Infinity;

  constructor(
    readonly chart: Chart,
    opts: { noFail: boolean; patch?: SynthPatch },
  ) {
    this.judge = new Judge(chart.notes, chart.lanes.length, JUDGEMENT_WINDOWS);
    this.sim = new CombatSim(chart.notes, chart.lanes, opts.noFail);
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
    return this.judge.finished || this.sim.down;
  }

  private advance(t: number): void {
    if (t < this.lastTime) t = this.lastTime;
    this.lastTime = t;
    for (const j of this.judge.update(t)) this.handleJudgement(j);
    for (const c of this.sim.update(t)) this.bus.emit('combat', c);
  }

  private handleJudgement(j: JudgementEvent): void {
    const out = directJudgement(j, this.chart.lanes, this.mods);
    const crit = out.type === 'attack' && out.action.crit;
    this.score.apply(j, crit ? this.mods.critMultiplier : 1);
    this.bus.emit('judgement', j);
    if (out.type === 'attack') {
      this.sim.applyAction(out.action);
      this.bus.emit('action', out.action);
    } else {
      this.sim.letThrough(out.noteId, out.time);
    }
    for (const c of this.sim.update(j.time)) this.bus.emit('combat', c);
  }
}
