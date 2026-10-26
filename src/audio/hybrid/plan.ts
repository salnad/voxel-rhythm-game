/**
 * Pure planning for the hybrid action → music mapping (Variant C): each move performs an
 * instrument part, and a cleanly cleared combo measure fires a production flourish at its
 * bar line. No Web Audio here, so all of it is unit-tested; hybridLayer turns the plans
 * into audio-param automation.
 */
import type { Chart } from '../../chart/build';
import type { Action } from '../../chart/types';
import type { Judgement } from '../../rhythm/judge';
import type { MeasurePlay } from '../../game/conductor';
import type { CompEvent } from '../demo/composition';

/** The song part each move performs (demo stems). */
export const LANE_PART: Record<Action, string> = {
  block: 'k808',
  slash: 'lead',
  stab: 'perc',
  flourish: 'vox',
};

export const HYBRID = {
  /** Part level while muted after a miss (a faint ghost, not silence). */
  mutedLevel: 0.1,
  /** Glitch after a miss, in beats: 1/32 chops, then the part fades to mutedLevel. */
  glitchBeats: 0.5,
  /** Gate level on the "off" chops of the glitch. */
  chopLow: 0.12,
  /** Per-judgement accent peak on a hit, decaying back to 1 over accentBeats. */
  accent: { perfect: 1.35, great: 1.2, good: 1.08 } as Record<Exclude<Judgement, 'miss'>, number>,
  accentBeats: 0.25,
  /** Live lead notes are scheduled this far (s) ahead of the game clock. */
  leadLookahead: 0.1,
} as const;

/** One step of gain automation, in game time. */
export interface GainPoint {
  t: number;
  v: number;
  ramp: 'set' | 'linear';
}

/**
 * A miss glitches the move's part (1/32 stutter chops) and then mutes it until the next hit.
 * With `mute` false (single "mix" stem maps) the glitch returns to full level instead.
 */
export function missGlitch(t: number, spb: number, mute = true): GainPoint[] {
  const chop = spb / 8;
  const end = t + HYBRID.glitchBeats * spb;
  const pts: GainPoint[] = [];
  let on = true;
  for (let x = t; x < end - 1e-9; x += chop) {
    pts.push({ t: x, v: on ? 1 : HYBRID.chopLow, ramp: 'set' });
    on = !on;
  }
  pts.push({ t: end, v: mute ? HYBRID.mutedLevel : 1, ramp: 'linear' });
  return pts;
}

/** A hit brings the part back (if a miss muted it) with an accent by judgement. */
export function hitAccent(
  t: number,
  judgement: Exclude<Judgement, 'miss'>,
  spb: number,
): GainPoint[] {
  return [
    { t, v: HYBRID.accent[judgement], ramp: 'linear' },
    { t: t + HYBRID.accentBeats * spb, v: 1, ramp: 'linear' },
  ];
}

export type FlourishKind = 'stutter' | 'riser' | 'filterOpen' | 'tapeStop';

export interface FlourishPick {
  kind: FlourishKind;
  /** 0.7..1: grows with the clean streak. */
  intensity: number;
  /** Beats before the bar line the fill starts (it never starts before the clear). */
  fillBeats: number;
}

export const FLOURISH_LABEL: Record<FlourishKind, string> = {
  stutter: 'STUTTER FILL',
  riser: 'RISER',
  filterOpen: 'FILTER OPEN',
  tapeStop: 'TAPE STOP',
};

const FILL_BEATS: Record<FlourishKind, number> = {
  stutter: 1,
  riser: 2,
  filterOpen: 2,
  tapeStop: 1,
};

/** Streak order within a combo run: the fills build up as the player keeps it clean. */
const STREAK_ORDER: readonly FlourishKind[] = ['stutter', 'riser', 'filterOpen'];

/**
 * Picks the flourish for each cleanly cleared combo measure, tied to the combo:
 * - the last measure of a combo range ends with a tape stop into the next bar;
 * - a measure cleared on a retry opens the filter back up (the music comes back);
 * - otherwise the fills cycle stutter → riser → filter-open as the clean streak grows.
 * Intensity grows with the streak. A failed measure resets the streak.
 */
export class FlourishDirector {
  private streak = 0;
  private lastBar = -2;

  failed(): void {
    this.streak = 0;
  }

  cleared(play: Pick<MeasurePlay, 'bar' | 'attempt'>, lastOfCombo: boolean): FlourishPick {
    const consecutive = play.bar === this.lastBar + 1;
    this.streak = consecutive ? this.streak + 1 : 1;
    this.lastBar = play.bar;
    const kind: FlourishKind = lastOfCombo
      ? 'tapeStop'
      : play.attempt > 1
        ? 'filterOpen'
        : STREAK_ORDER[(this.streak - 1) % STREAK_ORDER.length]!;
    return {
      kind,
      intensity: Math.min(1, 0.7 + 0.1 * (this.streak - 1)),
      fillBeats: FILL_BEATS[kind],
    };
  }
}

/** True when the measure after `bar` isn't a combo (the run ends at this bar line). */
export function lastOfCombo(chart: Chart, bar: number): boolean {
  return !chart.bars[bar + 1]?.combo;
}

/**
 * Tape-stop delay-line curve: delay(x) = x² / (2T) over [0, T]. Reading a delay line whose
 * delay grows at rate d' plays back at speed 1 - d', so the pitch falls linearly from 1 to 0
 * exactly at the bar line.
 */
export function tapeStopCurve(T: number, n = 64): Float32Array {
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * T;
    c[i] = (x * x) / (2 * T);
  }
  return c;
}

export interface LeadNote {
  key: string;
  /** Game time of the onset. */
  time: number;
  midi: number;
  /** Seconds. */
  len: number;
  vel: number;
}

/**
 * Schedules the demo's lead line live on the adaptive timeline, so the player's wavetable
 * patch voices it and repeated measures replay their notes. Notes are handed out once each,
 * shortly before they sound; measures dropped by a re-plan are never reached.
 */
export class LeadScheduler {
  private readonly done = new Set<string>();

  constructor(
    private readonly chart: Chart,
    private readonly byBar: readonly (readonly CompEvent[] | undefined)[],
  ) {}

  due(plays: readonly MeasurePlay[], now: number, ahead = HYBRID.leadLookahead): LeadNote[] {
    const out: LeadNote[] = [];
    const { tempo } = this.chart;
    for (const p of plays) {
      if (p.start > now + ahead) break;
      if (p.start + p.dur < now - 0.05) continue;
      const bar = this.chart.bars[p.bar];
      const notes = this.byBar[p.bar];
      if (!bar || !notes) continue;
      notes.forEach((e, i) => {
        const time = p.start + (tempo.beatToSec(e.beat) - bar.startSec);
        const key = `${p.index}:${p.bar}:${p.attempt}:${i}`;
        if (time > now + ahead || this.done.has(key)) return;
        this.done.add(key);
        if (time < now - 0.05) return;
        const len = tempo.beatToSec(e.beat + e.len) - tempo.beatToSec(e.beat);
        out.push({ key, time, midi: e.midi[0] ?? 74, len, vel: e.vel });
      });
    }
    return out;
  }
}
