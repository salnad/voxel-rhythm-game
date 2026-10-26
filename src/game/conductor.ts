import type { Chart } from '../chart/build';
import type { Action } from '../chart/types';

/** One pass through one chart measure on the game timeline. */
export interface MeasurePlay {
  index: number;
  bar: number;
  /** Game time (s) the measure starts. */
  start: number;
  dur: number;
  /** 1 = first try; 2+ = retries of a failed combo. */
  attempt: number;
  maxAttempts: number;
  combo: boolean;
  status: 'planned' | 'failed';
  failTime: number | null;
  cueIds: number[];
}

/** A chart note instantiated in one measure play, with game times. */
export interface Cue {
  id: number;
  /** The chart note this cue plays. */
  noteId: number;
  play: number;
  bar: number;
  lane: number;
  action: Action;
  time: number;
  endTime: number | null;
  encounter: number;
  combo: boolean;
  attempt: number;
  /** Set when a re-plan dropped this cue before it could be played. */
  removed: boolean;
}

/**
 * The adaptive timeline. Game time equals chart (audio file) time until the first retry.
 * Measures are planned ahead assuming success; when a combo measure fails, everything
 * planned after it is dropped and the same measure is planned again, up to its retry cap.
 * Pure logic: no clocks, no audio.
 */
export class Conductor {
  readonly plays: MeasurePlay[] = [];
  readonly cues: Cue[] = [];

  constructor(private readonly chart: Chart) {}

  /** Plan measure plays until the timeline reaches `until`. Returns the new cues. */
  planUntil(until: number): Cue[] {
    const out: Cue[] = [];
    for (;;) {
      const prev = this.plays[this.plays.length - 1];
      if (prev && prev.start >= until) break;
      const next = this.nextPlay(prev);
      if (!next) break;
      this.plays.push(next);
      const bar = this.chart.bars[next.bar]!;
      for (const noteId of bar.noteIds) {
        const n = this.chart.notes[noteId]!;
        const cue: Cue = {
          id: this.cues.length,
          noteId,
          play: next.index,
          bar: next.bar,
          lane: n.lane,
          action: n.action,
          time: next.start + (n.time - bar.startSec),
          endTime: n.endTime === null ? null : next.start + (n.endTime - bar.startSec),
          encounter: n.encounter,
          combo: next.combo,
          attempt: next.attempt,
          removed: false,
        };
        this.cues.push(cue);
        next.cueIds.push(cue.id);
        out.push(cue);
      }
    }
    return out;
  }

  private nextPlay(prev: MeasurePlay | undefined): MeasurePlay | null {
    const bars = this.chart.bars;
    if (!prev) {
      const b = bars[0];
      if (!b) return null;
      return this.makePlay(0, 0, b.startSec, 1);
    }
    const start = prev.start + prev.dur;
    if (prev.combo && prev.status === 'failed' && prev.attempt < prev.maxAttempts) {
      return this.makePlay(prev.index + 1, prev.bar, start, prev.attempt + 1);
    }
    if (prev.bar + 1 >= bars.length) return null;
    return this.makePlay(prev.index + 1, prev.bar + 1, start, 1);
  }

  private makePlay(index: number, bar: number, start: number, attempt: number): MeasurePlay {
    const b = this.chart.bars[bar]!;
    return {
      index,
      bar,
      start,
      dur: b.durSec,
      attempt,
      maxAttempts: b.combo ? b.combo.retries + 1 : 1,
      combo: b.combo !== null,
      status: 'planned',
      failTime: null,
      cueIds: [],
    };
  }

  /**
   * A combo measure was failed at time t. Marks it failed and, if a retry is left, drops
   * everything planned after it so the next plan repeats the measure.
   */
  fail(playIndex: number, t: number): { retry: boolean; removed: Cue[]; firstFail: boolean } {
    const p = this.plays[playIndex];
    if (!p || !p.combo) return { retry: false, removed: [], firstFail: false };
    if (p.status === 'failed')
      return { retry: p.attempt < p.maxAttempts, removed: [], firstFail: false };
    p.status = 'failed';
    p.failTime = t;
    const retry = p.attempt < p.maxAttempts;
    const removed: Cue[] = [];
    if (retry) {
      for (const later of this.plays.splice(playIndex + 1)) {
        for (const id of later.cueIds) {
          const c = this.cues[id]!;
          c.removed = true;
          removed.push(c);
        }
      }
    }
    return { retry, removed, firstFail: true };
  }

  /** The measure play under game time t (null during the lead-in or after the end). */
  playAt(t: number): MeasurePlay | null {
    for (let i = this.plays.length - 1; i >= 0; i--) {
      const p = this.plays[i]!;
      if (p.start <= t) return t < p.start + p.dur ? p : null;
    }
    return null;
  }

  /** Chart beat position at game time t (repeats during retries). */
  beatAt(t: number): number {
    const p = this.playAt(t);
    const bpb = this.chart.beatsPerBar;
    if (p) return this.chart.bars[p.bar]!.startBeat + ((t - p.start) / p.dur) * bpb;
    const first = this.plays[0];
    if (!first || t < first.start) {
      return this.chart.tempo.secToBeat(t);
    }
    const last = this.plays[this.plays.length - 1]!;
    return (
      this.chart.bars[last.bar]!.startBeat + bpb + ((t - last.start - last.dur) / last.dur) * bpb
    );
  }

  /** Game time chart beat `beat` is first reached, if it's planned yet. */
  firstTimeOfBeat(beat: number): number | null {
    const bpb = this.chart.beatsPerBar;
    const bar = Math.floor(beat / bpb + 1e-9);
    const p = this.plays.find((x) => x.bar === bar);
    if (!p) return beat <= 0 ? this.chart.tempo.beatToSec(beat) : null;
    const b = this.chart.bars[bar]!;
    return p.start + (this.chart.tempo.beatToSec(beat) - b.startSec);
  }

  /** True once every measure is planned; `endTime` is then the song's end on the timeline. */
  get complete(): boolean {
    const last = this.plays[this.plays.length - 1];
    return !!last && this.nextPlay(last) === null;
  }

  get endTime(): number {
    const last = this.plays[this.plays.length - 1];
    return last ? last.start + last.dur : 0;
  }
}
