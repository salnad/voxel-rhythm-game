import type { Action } from '../../chart/types';
import type { Telegraph } from '../../combat/telegraph';

export interface TellCue {
  id: number;
  action: Action;
  time: number;
  endTime: number | null;
}

export interface TellTiming {
  /** Musical lead of a tell (s): one beat. */
  lead: number;
  /** Length of the glint before contact (s): one eighth. */
  glint: number;
  /** Fraction of the lead spent snapping into the anticipation pose. */
  snap: number;
  /** Seconds the glint takes to fade after contact. */
  fade: number;
}

/** Tell timing at a tempo: the tell starts one beat before the hit, the glint one eighth. */
export function tellTiming(bpm: number): TellTiming {
  const beat = 60 / bpm;
  return { lead: beat, glint: beat / 2, snap: 0.3, fade: 0.12 };
}

/**
 * Lead of the tell for a cue at `time` whose previous cue ended at `prevEnd`: the full
 * musical lead, shortened to the gap when cues are closer than that (the shape is kept,
 * only compressed).
 */
export function tellLead(time: number, prevEnd: number | null, lead: number): number {
  if (prevEnd === null) return lead;
  return Math.max(0, Math.min(lead, time - prevEnd));
}

/** Time each cue's tell starts (and its sound plays), for time-ordered cues. */
export function tellStarts(cues: readonly TellCue[], lead: number): number[] {
  return cues.map((c, i) => {
    const prev = i > 0 ? cues[i - 1]! : null;
    return c.time - tellLead(c.time, prev ? (prev.endTime ?? prev.time) : null, lead);
  });
}

export interface TellState {
  /** The cue being told, or null. */
  cue: TellCue | null;
  /** 0..1 progress through its tell (0 before it starts, 1 on the hit). */
  raw: number;
  /** 0..1 anticipation-pose amount: snaps in over the first `snap` of the tell, then holds. */
  pose: number;
  /** 0..1 glint: rises over the last eighth (or the whole tell if shorter), peaks on the hit. */
  glint: number;
  /** The most recent cue at or before t and how long ago it hit. */
  last: { cue: TellCue; age: number } | null;
  /** Glint of the last cue fading after contact (0..1). */
  afterGlint: number;
}

/** What the enemy is telling at game time t. `cues` are the live cues, in time order. */
export function tellAt(cues: readonly TellCue[], t: number, o: TellTiming): TellState {
  let lastIdx = -1;
  for (let i = 0; i < cues.length; i++) {
    if (cues[i]!.time <= t) lastIdx = i;
    else break;
  }
  const last = lastIdx >= 0 ? cues[lastIdx]! : null;
  const next = cues[lastIdx + 1] ?? null;
  const lastAge = last ? t - last.time : 0;
  const afterGlint = last ? Math.max(0, 1 - lastAge / o.fade) : 0;
  const lastOut = last ? { cue: last, age: lastAge } : null;
  if (!next) return { cue: null, raw: 0, pose: 0, glint: 0, last: lastOut, afterGlint };
  const lead = tellLead(next.time, last ? (last.endTime ?? last.time) : null, o.lead);
  const start = next.time - lead;
  const raw = lead <= 1e-6 ? 1 : clamp01((t - start) / lead);
  const snap = clamp01(raw / o.snap);
  const pose = t < start ? 0 : 1 - (1 - snap) ** 3;
  const gl = Math.min(o.glint, lead);
  const g = gl <= 1e-6 ? 0 : clamp01((t - (next.time - gl)) / gl);
  return { cue: next, raw, pose, glint: g * g, last: lastOut, afterGlint };
}

/** The tell as an enemy telegraph (for ArenaView.telegraph): wind-up progress = pose amount. */
export function tellTelegraph(
  encounter: number | null,
  encounterStart: number,
  cues: readonly TellCue[],
  t: number,
  o: TellTiming,
): Telegraph {
  if (encounter === null) return { encounter: null, enterAge: 0, next: null, last: null };
  const s = tellAt(cues, t, o);
  return {
    encounter,
    enterAge: t - encounterStart,
    next: s.cue
      ? { noteId: s.cue.id, action: s.cue.action, time: s.cue.time, progress: s.pose }
      : null,
    last: s.last ? { noteId: s.last.cue.id, action: s.last.cue.action, age: s.last.age } : null,
  };
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
