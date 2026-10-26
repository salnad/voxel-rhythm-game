import type { Note } from '../chart/types';
import type { JudgementWindows } from '../config/gameplay';

export type Judgement = 'perfect' | 'great' | 'good' | 'miss';
export type JudgementKind = 'tap' | 'holdStart' | 'holdEnd';

export interface JudgementEvent {
  noteId: number;
  lane: number;
  kind: JudgementKind;
  judgement: Judgement;
  /** Input time minus target time, in seconds (negative = early). 0 for auto/miss-by-timeout. */
  offset: number;
  /** Song time (s) the judgement applies to. */
  time: number;
}

type NoteState = 'pending' | 'holding' | 'done';

/**
 * Pure note judge. Feed it lane presses/releases (in song time) and call update()
 * every frame; it returns judgement events. No clocks, no DOM.
 */
export class Judge {
  private readonly state: NoteState[];
  private readonly byLane: Note[][];
  /** Index into byLane[lane] of the earliest note that may still be pending. */
  private readonly cursor: number[];
  private readonly holding: (Note | null)[];

  constructor(
    notes: readonly Note[],
    laneCount: number,
    private readonly windows: JudgementWindows,
  ) {
    this.state = notes.map(() => 'pending');
    this.byLane = Array.from({ length: laneCount }, () => []);
    for (const n of notes) this.byLane[n.lane]?.push(n);
    for (const lane of this.byLane) lane.sort((a, b) => a.time - b.time);
    this.cursor = new Array<number>(laneCount).fill(0);
    this.holding = new Array<Note | null>(laneCount).fill(null);
  }

  classify(absOffset: number): Judgement {
    const w = this.windows;
    if (absOffset <= w.perfect) return 'perfect';
    if (absOffset <= w.great) return 'great';
    if (absOffset <= w.good) return 'good';
    return 'miss';
  }

  isPending(noteId: number): boolean {
    return this.state[noteId] === 'pending';
  }

  isHolding(noteId: number): boolean {
    return this.state[noteId] === 'holding';
  }

  press(lane: number, time: number): JudgementEvent | null {
    const list = this.byLane[lane];
    if (!list || this.holding[lane]) return null;
    for (let i = this.cursor[lane]!; i < list.length; i++) {
      const n = list[i]!;
      if (this.state[n.id] !== 'pending') continue;
      const offset = time - n.time;
      if (offset > this.windows.good) continue; // too late; update() will miss it
      if (offset < -this.windows.miss) return null; // earliest pending note is too far away
      const judgement = this.classify(Math.abs(offset));
      if (n.endTime !== null && judgement !== 'miss') {
        this.state[n.id] = 'holding';
        this.holding[lane] = n;
        return { noteId: n.id, lane, kind: 'holdStart', judgement, offset, time };
      }
      this.state[n.id] = 'done';
      this.advance(lane);
      return {
        noteId: n.id,
        lane,
        kind: n.endTime !== null ? 'holdStart' : 'tap',
        judgement,
        offset,
        time,
      };
    }
    return null;
  }

  release(lane: number, time: number): JudgementEvent | null {
    const n = this.holding[lane];
    if (!n || n.endTime === null) return null;
    this.holding[lane] = null;
    this.state[n.id] = 'done';
    this.advance(lane);
    const offset = time - n.endTime;
    const judgement: Judgement = offset >= -this.windows.good ? 'perfect' : 'miss';
    return { noteId: n.id, lane, kind: 'holdEnd', judgement, offset, time };
  }

  /** Emit misses for notes that can no longer be hit, and complete held notes. */
  update(time: number): JudgementEvent[] {
    const out: JudgementEvent[] = [];
    for (let lane = 0; lane < this.byLane.length; lane++) {
      const h = this.holding[lane];
      if (h && h.endTime !== null && time >= h.endTime) {
        this.holding[lane] = null;
        this.state[h.id] = 'done';
        out.push({
          noteId: h.id,
          lane,
          kind: 'holdEnd',
          judgement: 'perfect',
          offset: 0,
          time: h.endTime,
        });
      }
      const list = this.byLane[lane]!;
      for (let i = this.cursor[lane]!; i < list.length; i++) {
        const n = list[i]!;
        if (this.state[n.id] !== 'pending') continue;
        if (time - n.time <= this.windows.good) break;
        this.state[n.id] = 'done';
        out.push({
          noteId: n.id,
          lane,
          kind: n.endTime !== null ? 'holdStart' : 'tap',
          judgement: 'miss',
          offset: 0,
          time: n.time + this.windows.good,
        });
      }
      this.advance(lane);
    }
    return out;
  }

  /** True once every note is judged. */
  get finished(): boolean {
    return this.state.every((s) => s === 'done');
  }

  private advance(lane: number): void {
    const list = this.byLane[lane]!;
    let c = this.cursor[lane]!;
    while (c < list.length && this.state[list[c]!.id] === 'done') c++;
    this.cursor[lane] = c;
  }
}
