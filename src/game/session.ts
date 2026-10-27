import type { Chart } from '../chart/build';
import { resolveJudgement, type DuelAction } from '../combat/director';
import { DuelSim, type DuelEvent } from '../combat/duel';
import type { TelegraphCue } from '../combat/telegraph';
import { JUDGEMENT_WINDOWS, type JudgementWindows } from '../config/gameplay';
import { EventBus } from '../core/events';
import type { LaneInput } from '../rhythm/input';
import { Judge, type JudgementEvent } from '../rhythm/judge';
import { ScoreKeeper } from '../rhythm/score';
import { deriveModifiers, type AttackModifiers } from '../synth/modifiers';
import { DEFAULT_PATCH, type SynthPatch } from '../synth/patch';
import { Conductor, type Cue, type MeasurePlay } from './conductor';

/** How far ahead (s) measures are planned, so cues can be shown and music scheduled. */
export const PLAN_AHEAD = 4;

export type ComboEvent =
  | {
      type: 'failed';
      play: MeasurePlay;
      /** Whether the measure will repeat. */
      retry: boolean;
      time: number;
      /** End of the failed measure: the music stays wonky until then. */
      until: number;
    }
  | { type: 'cleared'; play: MeasurePlay; time: number };

export interface SessionEvents extends Record<string, unknown> {
  input: LaneInput;
  judgement: JudgementEvent;
  action: DuelAction;
  duel: DuelEvent;
  combo: ComboEvent;
  /** A measure play started. */
  measure: MeasurePlay;
  /** Newly planned cues. */
  cues: Cue[];
  /** Cue ids that will never be judged (voided by a failed combo, or dropped by a re-plan). */
  cuesDropped: number[];
}

/**
 * One play of one chart. Owns the pipeline:
 *   Conductor (adaptive measure plan) → cues → Judge → JudgementEvent → director → DuelAction
 *   → DuelSim → DuelEvent, plus boss-combo failure/retry
 * and publishes each stage on `bus` for renderers/HUD/audio. No DOM, no clocks: the
 * caller passes game time in, which keeps it unit-testable and replayable.
 */
export class GameSession {
  readonly bus = new EventBus<SessionEvents>();
  readonly conductor: Conductor;
  readonly judge: Judge;
  readonly duel: DuelSim;
  readonly score = new ScoreKeeper();
  patch: SynthPatch;
  mods: AttackModifiers;
  combosCleared = 0;
  combosFailed = 0;
  private lastTime = -Infinity;
  private nextMeasure = 0;

  constructor(
    readonly chart: Chart,
    opts: { noFail: boolean; patch?: SynthPatch; windows?: JudgementWindows },
  ) {
    this.conductor = new Conductor(chart);
    this.judge = new Judge([], chart.lanes.length, opts.windows ?? JUDGEMENT_WINDOWS);
    this.duel = new DuelSim(chart, opts.noFail, (k) => this.encounterStart(k));
    this.patch = { ...(opts.patch ?? DEFAULT_PATCH) };
    this.mods = deriveModifiers(this.patch);
  }

  setPatch(patch: SynthPatch): void {
    this.patch = { ...patch };
    this.mods = deriveModifiers(this.patch);
  }

  encounterStart(k: number): number | null {
    const e = this.chart.encounters[k];
    return e ? this.conductor.firstTimeOfBeat(e.startBeat) : null;
  }

  /** Live (not voided, not dropped) cues of encounter k, in time order. */
  encounterCues(k: number): TelegraphCue[] {
    return this.conductor.cues.filter(
      (c) => c.encounter === k && !c.removed && !this.judge.isVoid(c.id),
    );
  }

  /** Live cues overlapping [from, to]. */
  cuesBetween(from: number, to: number): Cue[] {
    return this.conductor.cues.filter(
      (c) =>
        !c.removed && !this.judge.isVoid(c.id) && (c.endTime ?? c.time) >= from && c.time <= to,
    );
  }

  /** Process inputs (in time order) then advance to game time t. */
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

  /** The whole song has been played and every cue judged. */
  get finished(): boolean {
    return (
      this.duel.down ||
      (this.conductor.complete && this.judge.finished && this.lastTime >= this.lastCueEnd())
    );
  }

  lastCueEnd(): number {
    let end = 0;
    for (const c of this.conductor.cues) if (!c.removed) end = Math.max(end, c.endTime ?? c.time);
    return end;
  }

  private plan(t: number): void {
    const fresh = this.conductor.planUntil(t + PLAN_AHEAD);
    if (fresh.length === 0) return;
    for (const c of fresh) this.judge.add(c);
    this.bus.emit('cues', fresh);
  }

  private advance(t: number): void {
    if (t < this.lastTime) t = this.lastTime;
    this.lastTime = t;
    this.plan(t);
    for (const j of this.judge.update(t)) this.handleJudgement(j);
    while (this.nextMeasure < this.conductor.plays.length) {
      const p = this.conductor.plays[this.nextMeasure]!;
      if (p.start > t) break;
      this.bus.emit('measure', p);
      this.nextMeasure++;
    }
    for (const d of this.duel.update(t)) this.bus.emit('duel', d);
  }

  private handleJudgement(j: JudgementEvent): void {
    const cue = this.conductor.cues[j.noteId]!;
    const miss = j.judgement === 'miss';
    let retry = false;
    let failed: ReturnType<Conductor['fail']> | null = null;
    if (cue.combo && miss) {
      failed = this.conductor.fail(cue.play, j.time);
      retry = failed.retry;
    }
    const resolves = this.duel.isLastNote(cue.noteId) && !(miss && retry);
    const action = resolveJudgement(j, cue, resolves, this.mods);
    this.score.apply(j, action.crit ? this.mods.critMultiplier : 1);
    this.bus.emit('judgement', j);
    this.bus.emit('action', action);
    this.duel.apply(action);

    if (failed?.firstFail) this.failCombo(cue, failed, j.time);
    else if (cue.combo && !miss && j.kind !== 'holdStart') this.checkCleared(cue, j.time);
    for (const d of this.duel.update(j.time)) this.bus.emit('duel', d);
  }

  private failCombo(cue: Cue, failed: ReturnType<Conductor['fail']>, t: number): void {
    const play = this.conductor.plays[cue.play]!;
    const dropped: number[] = [];
    // the failed measure's remaining cues are voided
    for (const id of play.cueIds) {
      if (this.judge.isPending(id)) {
        this.judge.void(id);
        dropped.push(id);
        const c = this.conductor.cues[id]!;
        if (!failed.retry && this.duel.isLastNote(c.noteId)) this.duel.escape(c.encounter, id, t);
      }
    }
    // anything planned after it is re-planned (the measure repeats)
    for (const c of failed.removed) {
      this.judge.void(c.id);
      dropped.push(c.id);
    }
    this.combosFailed++;
    if (dropped.length) this.bus.emit('cuesDropped', dropped);
    this.bus.emit('combo', {
      type: 'failed',
      play,
      retry: failed.retry,
      time: t,
      until: play.start + play.dur,
    });
    if (failed.retry) this.plan(t);
  }

  private checkCleared(cue: Cue, t: number): void {
    const play = this.conductor.plays[cue.play]!;
    if (play.status === 'failed') return;
    if (play.cueIds.every((id) => this.duel.outcome(id) === 'hit')) {
      this.combosCleared++;
      this.bus.emit('combo', { type: 'cleared', play, time: t });
    }
  }
}
