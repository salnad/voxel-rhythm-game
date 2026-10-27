/** The four sword actions and the enemies that telegraph them. Pure data. */
import type { Action, EnemyKind } from '../chart/types';

export interface ActionSpec {
  label: string;
  /** Lane, cue, trail and effect colour (CSS hex). */
  color: string;
  /** What the enemy does to ask for this action. */
  telegraph: string;
  /** World label when the action lands. */
  hitText: string;
  /** World label when it's missed, describing the consequence. */
  missText: string;
  /** Damage number shown on the enemy (cosmetic). */
  damage: number;
}

export const ACTION_SPECS: Record<Action, ActionSpec> = {
  block: {
    label: 'BLOCK',
    color: '#45c8ff',
    telegraph: 'winds up an attack',
    hitText: 'BLOCKED',
    missText: 'HIT',
    damage: 0,
  },
  slash: {
    label: 'SLASH',
    color: '#39ff6a',
    telegraph: 'opens its guard',
    hitText: 'CUT',
    missText: 'RECOVERED',
    damage: 30,
  },
  stab: {
    label: 'STAB',
    color: '#ffb22e',
    telegraph: 'shows a weak point',
    hitText: 'PIERCED',
    missText: 'GUARDED',
    damage: 45,
  },
  flourish: {
    label: 'FLOURISH',
    color: '#ff4fd8',
    telegraph: 'staggers',
    hitText: 'FINISHED',
    missText: 'ESCAPED',
    damage: 99,
  },
};

export interface EnemySpec {
  /** Overall size multiplier. */
  scale: number;
  /** Armor/accent colour. */
  accent: string;
  body: string;
  weapon: 'blade' | 'rapier' | 'club' | 'halberd';
  shield: boolean;
  /** Missed-block damage multiplier. */
  damageMultiplier: number;
}

export const ENEMIES: Record<EnemyKind, EnemySpec> = {
  grunt: {
    scale: 1.05,
    accent: '#39ff6a',
    body: '#0d2214',
    weapon: 'blade',
    shield: false,
    damageMultiplier: 0.8,
  },
  duelist: {
    scale: 1.1,
    accent: '#7dfcff',
    body: '#0b1c26',
    weapon: 'rapier',
    shield: false,
    damageMultiplier: 0.9,
  },
  brute: {
    scale: 1.25,
    accent: '#ff3b5c',
    body: '#26090f',
    weapon: 'club',
    shield: false,
    damageMultiplier: 1.4,
  },
  knight: {
    scale: 1.15,
    accent: '#d8e0ea',
    body: '#1a1d24',
    weapon: 'halberd',
    shield: true,
    damageMultiplier: 1.1,
  },
};
