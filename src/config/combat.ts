/** Lane element → attack/enemy mapping and attack tuning. Pure data. */

export type AttackKind = 'slam' | 'flick' | 'sweep' | 'thrust' | 'finisher';
export type EnemyKind = 'brute' | 'imp' | 'wall' | 'drone';

export interface AttackSpec {
  /** Swing duration (s). */
  duration: number;
  /** Arc span (degrees) before synth arcScale. */
  arcDeg: number;
  /** Swing plane tilt (degrees): 0 = horizontal, 90 = vertical overhead. */
  tiltDeg: number;
  /** Damage number shown on hit (cosmetic for now: enemies are 1 note = 1 kill). */
  damage: number;
  label: string;
}

export const ATTACKS: Record<AttackKind, AttackSpec> = {
  slam: { duration: 0.2, arcDeg: 150, tiltDeg: 80, damage: 40, label: 'SLAM' },
  flick: { duration: 0.12, arcDeg: 100, tiltDeg: 15, damage: 15, label: 'FLICK' },
  sweep: { duration: 0.26, arcDeg: 240, tiltDeg: 5, damage: 30, label: 'SWEEP' },
  thrust: { duration: 0.16, arcDeg: 70, tiltDeg: 40, damage: 25, label: 'PIERCE' },
  finisher: { duration: 0.32, arcDeg: 320, tiltDeg: 30, damage: 80, label: 'FINISHER' },
};

export interface LaneStyle {
  attack: AttackKind;
  enemy: EnemyKind;
  /** CSS color for the highway lane / enemy accent. */
  color: string;
  /** Glyph drawn on notes. */
  glyph: string;
}

/** Keyed by lane name from the chart. Unknown lane names fall back to DEFAULT_LANE_STYLE by index. */
export const LANE_STYLES: Record<string, LaneStyle> = {
  kick: { attack: 'slam', enemy: 'brute', color: '#39ff6a', glyph: 'キ' },
  perc: { attack: 'flick', enemy: 'imp', color: '#b6ff3b', glyph: 'パ' },
  snare: { attack: 'flick', enemy: 'imp', color: '#b6ff3b', glyph: 'ス' },
  hat: { attack: 'flick', enemy: 'imp', color: '#d8ff9a', glyph: 'ハ' },
  bass: { attack: 'sweep', enemy: 'wall', color: '#1de9b6', glyph: 'ベ' },
  synth: { attack: 'thrust', enemy: 'drone', color: '#7dffe0', glyph: 'シ' },
  lead: { attack: 'thrust', enemy: 'drone', color: '#7dffe0', glyph: 'リ' },
};

const FALLBACK_STYLES: LaneStyle[] = [
  LANE_STYLES.kick!,
  LANE_STYLES.perc!,
  LANE_STYLES.bass!,
  LANE_STYLES.synth!,
];

export function laneStyle(name: string, index: number): LaneStyle {
  return LANE_STYLES[name] ?? FALLBACK_STYLES[index % FALLBACK_STYLES.length]!;
}

export interface EnemySpec {
  /** Voxel body size (world units). */
  size: [number, number, number];
  /** Hover height. */
  y: number;
  damageMultiplier: number;
}

export const ENEMIES: Record<EnemyKind, EnemySpec> = {
  brute: { size: [1.1, 1.3, 1.1], y: 0, damageMultiplier: 1.3 },
  imp: { size: [0.55, 0.6, 0.55], y: 0, damageMultiplier: 0.7 },
  wall: { size: [1.6, 0.8, 0.5], y: 0, damageMultiplier: 1 },
  drone: { size: [0.7, 0.7, 0.7], y: 1.2, damageMultiplier: 0.9 },
};
