import type { Chart } from '../chart/build';
import type { Action } from '../chart/types';
import { ACTION_SPECS, ENEMIES } from '../config/actions';
import { PLAYER } from '../config/gameplay';
import type { Judgement } from '../rhythm/judge';
import type { DuelAction } from './director';

export type EnemyState = 'waiting' | 'fighting' | 'defeated' | 'escaped';
export type CueOutcome = 'pending' | 'holding' | 'hit' | 'miss';

export interface EnemyStatus {
  index: number;
  state: EnemyState;
  /** Song time the current state began. */
  stateTime: number;
  /** Offensive cues (slash/stab/flourish) left to land: the enemy's guard pips. */
  guard: number;
  guardMax: number;
}

export type DuelEvent =
  | { type: 'enemyEnter'; encounter: number; time: number }
  | {
      type: 'blocked';
      noteId: number;
      encounter: number;
      judgement: Judgement;
      /** Hold head: a blade lock until release. */
      lock: boolean;
      time: number;
    }
  | {
      type: 'struck';
      noteId: number;
      encounter: number;
      action: Exclude<Action, 'block'>;
      judgement: Judgement;
      crit: boolean;
      damage: number;
      hold: boolean;
      time: number;
    }
  | { type: 'released'; noteId: number; encounter: number; action: Action; time: number }
  | { type: 'playerHit'; noteId: number; encounter: number; damage: number; time: number }
  | { type: 'parry'; noteId: number; encounter: number; time: number }
  | { type: 'recovered'; noteId: number; encounter: number; action: Action; time: number }
  | { type: 'defeated'; noteId: number; encounter: number; time: number }
  | { type: 'escaped'; noteId: number; encounter: number; time: number }
  | { type: 'playerDown'; time: number };

/**
 * Deterministic duel state. One enemy at a time: encounter k's enemy walks in at its start
 * time and duels through its cues. Consequences follow the action:
 *  - missed BLOCK: the enemy's attack lands (HP loss) unless an echo-parry charge absorbs it
 *  - missed SLASH / STAB / mid-phrase FLOURISH: the enemy recovers its guard
 *  - the encounter's last cue: hit it and the enemy is defeated, miss it and it escapes
 */
export class DuelSim {
  readonly enemies: EnemyStatus[];
  readonly outcomes: CueOutcome[];
  hp: number = PLAYER.maxHp;
  parryCharge = 0;
  defeated = 0;
  escaped = 0;
  hitsTaken = 0;
  down = false;
  private nextEnter = 0;
  private readonly pending: DuelEvent[] = [];

  constructor(
    private readonly chart: Chart,
    private readonly noFail: boolean,
  ) {
    this.outcomes = chart.notes.map(() => 'pending');
    this.enemies = chart.encounters.map((e) => {
      const guardMax = e.noteIds.filter((id) => chart.notes[id]!.action !== 'block').length;
      return { index: e.index, state: 'waiting', stateTime: 0, guard: guardMax, guardMax };
    });
  }

  /** Index of the enemy on stage at song time t (the latest one that has walked in). */
  activeEncounter(t: number): number | null {
    let k: number | null = null;
    for (const e of this.chart.encounters) if (e.startTime <= t) k = e.index;
    return k;
  }

  isLastCue(noteId: number): boolean {
    const n = this.chart.notes[noteId];
    if (!n) return false;
    const ids = this.chart.encounters[n.encounter]!.noteIds;
    return ids[ids.length - 1] === noteId;
  }

  apply(a: DuelAction): void {
    this.enterUpTo(a.time);
    const enemy = this.enemies[a.encounter];
    if (!enemy || this.outcomes[a.noteId] === 'hit' || this.outcomes[a.noteId] === 'miss') return;
    const base = { noteId: a.noteId, encounter: a.encounter, time: a.time };

    if (a.kind === 'holdEnd') {
      if (a.hit) {
        this.outcomes[a.noteId] = 'hit';
        this.pending.push({ type: 'released', ...base, action: a.action });
      } else {
        this.outcomes[a.noteId] = 'miss';
        this.missConsequence(a, enemy);
      }
    } else if (a.hit) {
      this.outcomes[a.noteId] = a.hold ? 'holding' : 'hit';
      if (a.action === 'block') {
        this.pending.push({ type: 'blocked', ...base, judgement: a.judgement, lock: a.hold });
      } else {
        enemy.guard = Math.max(0, enemy.guard - 1);
        this.pending.push({
          type: 'struck',
          ...base,
          action: a.action,
          judgement: a.judgement,
          crit: a.crit,
          damage: ACTION_SPECS[a.action].damage * (a.crit ? 2 : 1),
          hold: a.hold,
        });
      }
      this.parryCharge = Math.min(3, this.parryCharge + a.mods.parryChargePerHit);
      this.hp = Math.min(PLAYER.maxHp, this.hp + PLAYER.heal[a.judgement]);
    } else {
      this.outcomes[a.noteId] = 'miss';
      this.missConsequence(a, enemy);
    }

    if (a.final && enemy.state === 'fighting') {
      const won = this.outcomes[a.noteId] === 'hit';
      enemy.state = won ? 'defeated' : 'escaped';
      enemy.stateTime = a.time;
      if (won) this.defeated++;
      else this.escaped++;
      this.pending.push({ type: won ? 'defeated' : 'escaped', ...base });
    }
  }

  update(t: number): DuelEvent[] {
    this.enterUpTo(t);
    return this.pending.splice(0, this.pending.length);
  }

  private enterUpTo(t: number): void {
    while (this.nextEnter < this.chart.encounters.length) {
      const e = this.chart.encounters[this.nextEnter]!;
      if (e.startTime > t) break;
      const enemy = this.enemies[this.nextEnter]!;
      enemy.state = 'fighting';
      enemy.stateTime = e.startTime;
      this.pending.push({ type: 'enemyEnter', encounter: e.index, time: e.startTime });
      this.nextEnter++;
    }
  }

  private missConsequence(a: DuelAction, enemy: EnemyStatus): void {
    const base = { noteId: a.noteId, encounter: a.encounter, time: a.time };
    if (a.action !== 'block') {
      this.pending.push({ type: 'recovered', ...base, action: a.action });
      return;
    }
    if (this.parryCharge >= 1) {
      this.parryCharge -= 1;
      this.pending.push({ type: 'parry', ...base });
      return;
    }
    const kind = this.chart.encounters[enemy.index]!.enemy;
    const damage = PLAYER.missDamage * ENEMIES[kind].damageMultiplier;
    this.hitsTaken++;
    this.hp = Math.max(0, this.hp - damage);
    this.pending.push({ type: 'playerHit', ...base, damage });
    if (this.hp <= 0 && !this.down && !this.noFail) {
      this.down = true;
      this.pending.push({ type: 'playerDown', time: a.time });
    }
  }
}
