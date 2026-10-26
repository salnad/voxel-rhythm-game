import type { BpmChange } from './types';

interface Segment {
  beat: number;
  sec: number;
  bpm: number;
}

/** Piecewise-constant tempo map converting between beats and seconds (audio-file time). */
export class TempoMap {
  private readonly segments: Segment[];

  constructor(bpm: number, offsetMs: number, changes: readonly BpmChange[] = []) {
    const sorted = [...changes].filter((c) => c.beat > 0).sort((a, b) => a.beat - b.beat);
    const segs: Segment[] = [{ beat: 0, sec: offsetMs / 1000, bpm }];
    for (const c of sorted) {
      const prev = segs[segs.length - 1]!;
      const sec = prev.sec + ((c.beat - prev.beat) * 60) / prev.bpm;
      segs.push({ beat: c.beat, sec, bpm: c.bpm });
    }
    this.segments = segs;
  }

  private segmentForBeat(beat: number): Segment {
    let seg = this.segments[0]!;
    for (const s of this.segments) {
      if (s.beat <= beat) seg = s;
      else break;
    }
    return seg;
  }

  private segmentForSec(sec: number): Segment {
    let seg = this.segments[0]!;
    for (const s of this.segments) {
      if (s.sec <= sec) seg = s;
      else break;
    }
    return seg;
  }

  beatToSec(beat: number): number {
    const s = this.segmentForBeat(beat);
    return s.sec + ((beat - s.beat) * 60) / s.bpm;
  }

  secToBeat(sec: number): number {
    const s = this.segmentForSec(sec);
    return s.beat + ((sec - s.sec) * s.bpm) / 60;
  }

  bpmAtBeat(beat: number): number {
    return this.segmentForBeat(beat).bpm;
  }
}
