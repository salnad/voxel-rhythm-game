/**
 * Pure timing and layout math shared by the enemy-anchored cue experiments (one-lane,
 * converge, approach-ring). No DOM, no Three.js: everything here is unit-tested.
 */
import type { Action } from '../../chart/types';
import type { Judgement, JudgementEvent } from '../../rhythm/judge';

export const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
export const smoothstep = (x: number): number => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};
/** Ease out cubic. */
export const easeOut = (x: number): number => 1 - (1 - clamp01(x)) ** 3;

/** What became of a cue, as far as the visuals care. */
export interface CueOutcome {
  judgement: Judgement;
  /** Game time of the judgement. */
  time: number;
  /** Input minus target (s); 0 for a timeout miss. */
  offset: number;
}

/**
 * Remembers each cue's first judgement (tap or hold start) so its badge can burst or crack
 * where it was, for a short while after it left the judge's pending list.
 */
export class OutcomeLog {
  private readonly byId = new Map<number, CueOutcome>();

  record(e: JudgementEvent): CueOutcome | null {
    if (e.kind === 'holdEnd' || this.byId.has(e.noteId)) return null;
    const o = { judgement: e.judgement, time: e.time, offset: e.offset };
    this.byId.set(e.noteId, o);
    return o;
  }

  get(id: number): CueOutcome | undefined {
    return this.byId.get(id);
  }

  /** Forget outcomes older than `before` (keeps the map small on long runs). */
  prune(before: number): void {
    for (const [id, o] of this.byId) if (o.time < before) this.byId.delete(id);
  }
}

/** The minimum a cue view needs (a subset of the conductor's Cue). */
export interface CueLike {
  id: number;
  action: Action;
  lane: number;
  time: number;
  endTime: number | null;
}

export type CueStage = 'incoming' | 'holding' | 'hit' | 'miss' | 'void';

export interface StagedCue<C extends CueLike = CueLike> {
  cue: C;
  stage: CueStage;
  /** Seconds until the cue's time (negative once past). */
  tau: number;
  /** Seconds since the outcome (hit/miss/void), else 0. */
  age: number;
  outcome?: CueOutcome;
}

export interface CueStatus {
  isPending(id: number): boolean;
  isHolding(id: number): boolean;
  isVoid(id: number): boolean;
}

/**
 * Cues to draw at time t: pending ones up to `approach` ahead, held ones, and judged or voided
 * ones for `linger` seconds after their outcome (so they can burst or crack). Sorted by time.
 */
export function stageCues<C extends CueLike & { removed?: boolean }>(
  cues: readonly C[],
  t: number,
  approach: number,
  linger: number,
  status: CueStatus,
  outcomes: OutcomeLog,
  voidedAt: ReadonlyMap<number, number>,
): StagedCue<C>[] {
  const out: StagedCue<C>[] = [];
  for (const cue of cues) {
    if (cue.removed) continue;
    const tau = cue.time - t;
    if (tau > approach) continue;
    if ((cue.endTime ?? cue.time) < t - linger - 0.5) continue;
    if (status.isHolding(cue.id)) {
      out.push({ cue, stage: 'holding', tau, age: 0 });
      continue;
    }
    if (status.isPending(cue.id)) {
      out.push({ cue, stage: 'incoming', tau, age: 0 });
      continue;
    }
    if (status.isVoid(cue.id)) {
      const at = voidedAt.get(cue.id);
      if (at !== undefined && t - at < linger)
        out.push({ cue, stage: 'void', tau, age: Math.max(0, t - at) });
      continue;
    }
    const o = outcomes.get(cue.id);
    if (o && t - o.time < linger) {
      out.push({
        cue,
        stage: o.judgement === 'miss' ? 'miss' : 'hit',
        tau,
        age: Math.max(0, t - o.time),
        outcome: o,
      });
    }
  }
  return out.sort((a, b) => a.cue.time - b.cue.time);
}

/**
 * Emphasis of each incoming cue by its rank among incoming cues: the next cue is full
 * strength, the following `ghosts` are faint, the rest hidden. Returns alpha per staged cue
 * (1 for non-incoming stages).
 */
export function ghostAlphas(staged: readonly StagedCue[], ghosts: readonly number[]): number[] {
  let rank = 0;
  return staged.map((s) => {
    if (s.stage !== 'incoming') return 1;
    const a = rank === 0 ? 1 : (ghosts[rank - 1] ?? 0);
    rank++;
    return a;
  });
}

/**
 * A press on `lane` that will judge nothing but lands within `window` s of another lane's
 * pending cue: the player read the timing but picked the wrong key. Returns that cue (the
 * nearest), or null when the press has a cue of its own or none is near.
 */
export function wrongKeyCue<C extends CueLike & { removed?: boolean }>(
  cues: readonly C[],
  lane: number,
  time: number,
  window: number,
  status: Pick<CueStatus, 'isPending'>,
): C | null {
  let best: C | null = null;
  let bestD = Infinity;
  for (const c of cues) {
    if (c.removed || !status.isPending(c.id)) continue;
    const d = Math.abs(c.time - time);
    if (d > window) continue;
    if (c.lane === lane) return null;
    if (d < bestD) {
      best = c;
      bestD = d;
    }
  }
  return best;
}

/** 0 when the cue spawns (tau = approach), 1 when it lands (tau = 0). Can exceed 1 when late. */
export function travel(tau: number, approach: number): number {
  return 1 - tau / Math.max(1e-6, approach);
}

/** Approach-ring scale: `from` at spawn, shrinking linearly to 1 exactly on the cue's time. */
export function ringScale(tau: number, approach: number, from: number): number {
  return 1 + (from - 1) * clamp01(tau / Math.max(1e-6, approach));
}

/**
 * Converge path: a badge `tau` seconds out sits at distance radius·tau/approach from the target,
 * at `angle` (radians, 0 = straight up, clockwise positive) curled by `curl`·progress-left.
 * Returns the offset from the target in screen axes (x right, y down).
 */
export function convergeOffset(
  tau: number,
  approach: number,
  angle: number,
  radius: number,
  curl: number,
): { x: number; y: number } {
  const k = clamp01(tau / Math.max(1e-6, approach));
  const a = angle + curl * k;
  const r = radius * k;
  return { x: Math.sin(a) * r, y: -Math.cos(a) * r };
}

/**
 * Converge spawn angle for the n-th cue of the song: cues sweep back and forth across an upper
 * fan (±spread around straight up) in `step` increments, so consecutive badges sit next to each
 * other and the incoming queue reads as a curved train.
 */
export function fanAngle(n: number, spread: number, step: number): number {
  const span = 2 * spread;
  const steps = Math.max(1, Math.round(span / step));
  const period = steps * 2;
  const i = ((n % period) + period) % period;
  const pos = i <= steps ? i : period - i;
  return -spread + (pos / steps) * span;
}

/** One-lane strip: x of a cue between the spawn edge (x0) and the hit target (x1). */
export function stripX(tau: number, approach: number, x0: number, x1: number): number {
  return x1 + (x0 - x1) * (tau / Math.max(1e-6, approach));
}

/** Kick envelope for punches and flashes: 1 at age 0, decaying to 0 at `life`, quick ease. */
export function kick(age: number, life: number): number {
  if (age < 0 || age >= life) return 0;
  return (1 - age / life) ** 2;
}

/** Visual time for effects that hit-stop: frozen for `stop` s after `at`, then runs late. */
export function hitStopAge(age: number, stop: number): number {
  return age < stop ? 0 : age - stop;
}
