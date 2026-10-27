import { describe, expect, it } from 'vitest';
import {
  tellAt,
  tellLead,
  tellStarts,
  tellTelegraph,
  tellTiming,
  type TellCue,
} from '../src/experiments/tells/timing';

const cue = (id: number, time: number, endTime: number | null = null): TellCue => ({
  id,
  action: 'slash',
  time,
  endTime,
});

describe('tells timing', () => {
  const o = tellTiming(120);

  it('leads by exactly one beat with a glint on the last eighth', () => {
    expect(o.lead).toBeCloseTo(0.5);
    expect(o.glint).toBeCloseTo(0.25);
  });

  it('shortens the lead to the gap when cues are closer than a beat', () => {
    expect(tellLead(4, null, 0.5)).toBe(0.5);
    expect(tellLead(4, 3, 0.5)).toBe(0.5);
    expect(tellLead(4, 3.75, 0.5)).toBeCloseTo(0.25);
    expect(tellLead(4, 4, 0.5)).toBe(0);
  });

  it('starts each tell one beat before its hit, or right after the previous cue ends', () => {
    const cues = [cue(1, 2), cue(2, 3), cue(3, 3.2), cue(4, 5, 4.8)];
    expect(tellStarts(cues, 0.5)).toEqual([1.5, 2.5, 3, 4.5]);
    expect(tellStarts([cue(1, 2, 1.9), cue(2, 2.2)], 0.5)[1]).toBeCloseTo(1.9);
  });

  it('is idle before the tell, snaps into the pose, and peaks the glint on the beat', () => {
    const cues = [cue(1, 4)];
    const before = tellAt(cues, 3.4, o);
    expect(before.cue?.id).toBe(1);
    expect(before.pose).toBe(0);
    expect(before.glint).toBe(0);

    const snapped = tellAt(cues, 3.5 + o.lead * o.snap, o);
    expect(snapped.pose).toBeCloseTo(1);
    expect(snapped.glint).toBe(0);

    const mid = tellAt(cues, 4 - o.glint / 2, o);
    expect(mid.glint).toBeGreaterThan(0);
    expect(mid.glint).toBeLessThan(0.5);

    const hit = tellAt(cues, 4, o);
    expect(hit.last?.cue.id).toBe(1);
    expect(hit.afterGlint).toBe(1);
    expect(tellAt(cues, 4 - 1e-6, o).glint).toBeCloseTo(1, 4);
    expect(tellAt(cues, 4 + o.fade, o).afterGlint).toBe(0);
  });

  it('keeps the shape of a compressed tell (full pose and glint by the hit)', () => {
    const cues = [cue(1, 4), cue(2, 4.2)];
    const s = tellAt(cues, 4.2 - 1e-6, o);
    expect(s.cue?.id).toBe(2);
    expect(s.pose).toBeCloseTo(1, 4);
    expect(s.glint).toBeCloseTo(1, 4);
    expect(tellAt(cues, 4.05, o).pose).toBeGreaterThan(0);
  });

  it('becomes the enemy telegraph with progress = pose', () => {
    const cues = [cue(1, 4), cue(2, 5)];
    expect(tellTelegraph(null, 0, cues, 3, o).next).toBeNull();
    const tg = tellTelegraph(0, 1, cues, 4.8, o);
    expect(tg.enterAge).toBeCloseTo(3.8);
    expect(tg.next?.noteId).toBe(2);
    expect(tg.next?.progress).toBeCloseTo(tellAt(cues, 4.8, o).pose);
    expect(tg.last?.noteId).toBe(1);
  });
});
