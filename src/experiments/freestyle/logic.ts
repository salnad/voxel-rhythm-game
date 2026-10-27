/**
 * FREESTYLE rules as pure functions: judge a swing against the eighth-note grid, keep the
 * FURY multiplier, and drain enemy HP. No clocks, no DOM: the runtime feeds in beats.
 */

export type GridQuality = 'perfect' | 'good' | 'whiff';

export interface GridWindows {
  /** Half-widths in seconds around the nearest eighth note. */
  perfect: number;
  good: number;
}

export const GRID_WINDOWS: GridWindows = { perfect: 0.035, good: 0.075 };

export interface GridHit {
  /** Eighth-note slot index (beat * 2, rounded). */
  slot: number;
  /** Seconds from the slot (negative = early). */
  offset: number;
  quality: GridQuality;
}

/** Judge a swing at song beat `beat` against the nearest eighth note. */
export function gridJudge(
  beat: number,
  secPerBeat: number,
  w: GridWindows = GRID_WINDOWS,
): GridHit {
  const slot = Math.round(beat * 2);
  const offset = (beat - slot / 2) * secPerBeat;
  const a = Math.abs(offset);
  const quality: GridQuality = a <= w.perfect ? 'perfect' : a <= w.good ? 'good' : 'whiff';
  return { slot, offset, quality };
}

export interface FuryTier {
  mult: number;
  /** Consecutive on-beat hits needed to reach this tier. */
  at: number;
  label: string;
  color: string;
}

export const FURY_TIERS: readonly FuryTier[] = [
  { mult: 1, at: 0, label: 'x1', color: '#39ff6a' },
  { mult: 2, at: 4, label: 'x2', color: '#7dfcff' },
  { mult: 4, at: 10, label: 'x4', color: '#ffd23b' },
  { mult: 8, at: 18, label: 'x8', color: '#ff8a2e' },
  { mult: 16, at: 28, label: 'x16', color: '#ff4fd8' },
];

/** Beats without an on-beat hit (or block) before fury drops one tier. */
export const FURY_IDLE_BEATS = 4;

export type FuryChange = 'up' | 'down' | null;

/**
 * The FURY multiplier: consecutive on-beat hits climb the tiers; an off-beat swing drops one
 * tier, a missed block drops two, and a bar without landing anything drops one.
 */
export class Fury {
  streak = 0;
  private lastHitBeat = -Infinity;

  get tier(): number {
    let k = 0;
    FURY_TIERS.forEach((t, i) => {
      if (this.streak >= t.at) k = i;
    });
    return k;
  }

  get mult(): number {
    return FURY_TIERS[this.tier]!.mult;
  }

  /** 0..1 progress toward the next tier (1 at the top tier). */
  get progress(): number {
    const k = this.tier;
    const next = FURY_TIERS[k + 1];
    if (!next) return 1;
    const from = FURY_TIERS[k]!.at;
    return (this.streak - from) / (next.at - from);
  }

  hit(beat: number): FuryChange {
    const before = this.tier;
    this.streak++;
    this.lastHitBeat = beat;
    return this.tier > before ? 'up' : null;
  }

  whiff(beat: number): FuryChange {
    this.lastHitBeat = beat;
    return this.drop(1);
  }

  hurt(beat: number): FuryChange {
    this.lastHitBeat = beat;
    return this.drop(2);
  }

  /** Call every frame: a bar without a landed hit drops one tier. */
  idle(beat: number): FuryChange {
    if (beat - this.lastHitBeat < FURY_IDLE_BEATS) return null;
    this.lastHitBeat = beat;
    return this.streak > 0 ? this.drop(1) : null;
  }

  private drop(tiers: number): FuryChange {
    const before = this.tier;
    const k = Math.max(0, before - tiers);
    this.streak = before === 0 ? 0 : FURY_TIERS[k]!.at;
    return before > 0 ? 'down' : null;
  }
}

/** Damage dealt by a swing on an off-beat ("and") eighth, relative to one on the beat. */
export const OFFBEAT_DAMAGE = 0.5;

/**
 * Damage of one grid hit: fury multiplies score fully but damage gently (x16 = 1.8x), and
 * hits on the beat land harder than the "and" between, so eighth-note streaks build fury
 * fast without shredding HP twice as fast as quarter notes.
 */
export function hitDamage(quality: GridQuality, tier: number, slot = 0): number {
  if (quality === 'whiff') return 0;
  const offbeat = Math.abs(slot % 2) === 1;
  return (quality === 'perfect' ? 1.2 : 1) * (1 + tier * 0.2) * (offbeat ? OFFBEAT_DAMAGE : 1);
}

/** Score of one on-beat hit. */
export function hitScore(quality: GridQuality, mult: number): number {
  if (quality === 'whiff') return 0;
  return (quality === 'perfect' ? 120 : 80) * mult;
}

/** At most one swing per eighth-note slot counts; mashing extra swings whiffs. */
export class SlotGuard {
  private last = -Infinity;
  take(slot: number): boolean {
    if (slot <= this.last) return false;
    this.last = slot;
    return true;
  }
}

/** Gain per song part at each fury tier (Hellsinger-style layering, drums + bass first). */
export const LAYERS: Record<string, readonly number[]> = {
  k808: [1, 1, 1, 1, 1],
  perc: [1, 1, 1, 1, 1],
  lead: [0, 1, 1, 1, 1],
  vox: [0, 0, 1, 1, 1],
  backing: [0, 0, 0, 1, 1],
};

export function layerGain(part: string, tier: number): number {
  const g = LAYERS[part];
  if (!g) return 1;
  return g[Math.max(0, Math.min(g.length - 1, tier))]!;
}

/** Lanes the autoplay bot swings per eighth slot of a bar (0 = rest): 1 slash, 2 stab, 3 heavy. */
export const BOT_PATTERN: readonly number[] = [1, 0, 2, 1, 1, 2, 3, 0];

/**
 * The lane the autoplay bot swings on eighth slot `slot` (at song time `slotTime`), or null to
 * rest: it follows BOT_PATTERN and keeps clear of charted cues so it never steals a block.
 */
export function botSwing(
  slot: number,
  slotTime: number,
  cueTimes: readonly number[],
  clearance: number,
): number | null {
  const lane = BOT_PATTERN[((slot % 8) + 8) % 8]!;
  if (lane === 0) return null;
  return cueTimes.some((c) => Math.abs(c - slotTime) < clearance) ? null : lane;
}

/** Whole beats in [fromBeat, toBeat) with no block within half a beat: room to attack. */
export function freeBeats(fromBeat: number, toBeat: number, blockBeats: readonly number[]): number {
  let n = 0;
  for (let b = Math.ceil(fromBeat); b < toBeat; b++) {
    if (!blockBeats.some((x) => Math.abs(x - b) < 0.5)) n++;
  }
  return n;
}

/**
 * Enemy HP for the `index`-th encounter with `free` free beats (see freeBeats). Tuned by
 * playtesting so on-beat quarter notes break an enemy just before its finisher and eighth-note
 * streaks break it early; later enemies are tougher because fury carries over.
 */
export function enemyHp(free: number, index = 0): number {
  return Math.max(6, Math.round(free * (1.15 + 0.1 * index)));
}
