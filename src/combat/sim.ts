import type { Note } from '../chart/types';
import { ENEMIES, laneStyle, type EnemyKind } from '../config/combat';
import { FIELD, PLAYER } from '../config/gameplay';
import type { Judgement } from '../rhythm/judge';
import type { AttackAction } from './director';

export type EnemyState = 'approach' | 'grinding' | 'dying' | 'striking' | 'parried' | 'gone';

export interface Enemy {
  id: number;
  lane: number;
  kind: EnemyKind;
  noteTime: number;
  endTime: number | null;
  state: EnemyState;
  /** Song time the current state began. */
  stateTime: number;
}

export type CombatEvent =
  | { type: 'kill'; enemyId: number; lane: number; judgement: Judgement; crit: boolean; time: number }
  | { type: 'grindStart'; enemyId: number; lane: number; time: number }
  | { type: 'playerHit'; enemyId: number; lane: number; damage: number; time: number }
  | { type: 'parry'; enemyId: number; lane: number; time: number }
  | { type: 'playerDown'; time: number };

/** How long post-mortem states linger for visuals (s). */
const LINGER = { dying: 0.6, striking: 0.45, parried: 0.45 };

/**
 * Deterministic combat state. One enemy per chart note: it reaches the strike radius
 * exactly at the note time, so the 3D field mirrors the highway. Hits kill, misses let
 * the enemy strike the player (unless an echo-parry charge absorbs it).
 */
export class CombatSim {
  readonly enemies: Enemy[];
  hp: number = PLAYER.maxHp;
  parryCharge = 0;
  kills = 0;
  down = false;
  private readonly pending: CombatEvent[] = [];

  constructor(
    notes: readonly Note[],
    laneNames: readonly string[],
    private readonly noFail: boolean,
  ) {
    this.enemies = notes.map((n) => ({
      id: n.id,
      lane: n.lane,
      kind: laneStyle(laneNames[n.lane] ?? '', n.lane).enemy,
      noteTime: n.time,
      endTime: n.endTime,
      state: 'approach',
      stateTime: 0,
    }));
  }

  /** Distance from the player of an approaching enemy at song time t. */
  static approachDistance(noteTime: number, t: number): number {
    return FIELD.strikeRadius + (noteTime - t) * FIELD.approachSpeed;
  }

  /** Song time at which an enemy should become visible. */
  static spawnTime(noteTime: number): number {
    return noteTime - (FIELD.spawnDistance - FIELD.strikeRadius) / FIELD.approachSpeed;
  }

  applyAction(a: AttackAction): void {
    const e = this.enemies[a.noteId];
    if (!e || e.state === 'gone' || e.state === 'dying') return;
    if (a.grind) {
      this.setState(e, 'grinding', a.time);
      this.pending.push({ type: 'grindStart', enemyId: e.id, lane: e.lane, time: a.time });
    } else {
      this.setState(e, 'dying', a.time);
      this.kills++;
      this.pending.push({ type: 'kill', enemyId: e.id, lane: e.lane, judgement: a.judgement, crit: a.crit, time: a.time });
    }
    this.parryCharge = Math.min(3, this.parryCharge + a.mods.parryChargePerHit);
    this.heal(PLAYER.heal[a.judgement]);
  }

  letThrough(noteId: number, time: number): void {
    const e = this.enemies[noteId];
    if (!e || e.state === 'gone' || e.state === 'dying' || e.state === 'striking' || e.state === 'parried') return;
    if (this.parryCharge >= 1) {
      this.parryCharge -= 1;
      this.setState(e, 'parried', time);
      this.pending.push({ type: 'parry', enemyId: e.id, lane: e.lane, time });
      return;
    }
    this.setState(e, 'striking', time);
    const damage = PLAYER.missDamage * ENEMIES[e.kind].damageMultiplier;
    this.pending.push({ type: 'playerHit', enemyId: e.id, lane: e.lane, damage, time });
    this.hp = Math.max(0, this.hp - damage);
    if (this.hp <= 0 && !this.down) {
      if (this.noFail) {
        this.hp = 0;
      } else {
        this.down = true;
        this.pending.push({ type: 'playerDown', time });
      }
    }
  }

  update(t: number): CombatEvent[] {
    for (const e of this.enemies) {
      if (e.state === 'dying' || e.state === 'striking' || e.state === 'parried') {
        if (t - e.stateTime > LINGER[e.state]) e.state = 'gone';
      }
    }
    return this.pending.splice(0, this.pending.length);
  }

  private heal(amount: number): void {
    this.hp = Math.min(PLAYER.maxHp, this.hp + amount);
  }

  private setState(e: Enemy, s: EnemyState, t: number): void {
    e.state = s;
    e.stateTime = t;
  }
}
