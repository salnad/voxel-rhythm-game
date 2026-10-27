import { describe, expect, it } from 'vitest';
import { ACTIONS } from '../src/chart/types';
import { HIT_REACT, MOVE_CLIPS, READY } from '../src/config/heroAnimation';
import { CHANNELS, clipTime, makePose, sampleClip, type MoveClip } from '../src/render/heroPose';

const READY_POSE = makePose(READY);
const allClips = (): Array<[string, MoveClip]> =>
  ACTIONS.flatMap((a) => MOVE_CLIPS[a].map((c, i) => [`${a}#${i}`, c] as [string, MoveClip]));
const opts = { hit: false, holding: false, releasedAge: null, followScale: 1 };

describe('hero move clips', () => {
  it('every action has at least one clip', () => {
    for (const a of ACTIONS) expect(MOVE_CLIPS[a].length).toBeGreaterThan(0);
  });

  it.each(allClips())('%s is well formed', (_, clip) => {
    const ts = clip.keys.map((k) => k.t);
    for (let i = 1; i < ts.length; i++) expect(ts[i]!).toBeGreaterThan(ts[i - 1]!);
    expect(ts).toContain(0);
    expect(clip.coil).toBeLessThanOrEqual(0);
    expect(clip.coil).toBeGreaterThanOrEqual(ts[0]!);
    expect(clip.hold).toBeGreaterThanOrEqual(0);
    expect(clip.hold).toBeLessThan(clip.end);
    expect(clip.end).toBe(ts[ts.length - 1]);
    expect(clip.hitStop).toBeGreaterThanOrEqual(0);
    expect(clip.hitStop).toBeLessThanOrEqual(0.1);
    expect(clip.cut[0]).toBeLessThanOrEqual(clip.cut[1]);
    for (const k of clip.keys) for (const c of Object.keys(k.pose)) expect(CHANNELS).toContain(c);
  });

  it.each(allClips())('%s shows its contact frame on the key press', (_, clip) => {
    const contact = clip.keys.find((k) => k.t === 0)!;
    const pose = sampleClip(clip, clipTime(clip, 0, opts), READY_POSE, makePose());
    for (const c of CHANNELS) expect(pose[c]).toBeCloseTo(contact.pose[c] ?? READY_POSE[c], 6);
  });

  it.each(allClips())('%s recovers to the ready pose', (_, clip) => {
    const pose = sampleClip(clip, clip.end, READY_POSE, makePose());
    for (const c of CHANNELS) {
      const want = READY_POSE[c];
      const got =
        c === 'bodyYaw' ? ((pose[c] % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) : pose[c];
      expect(Math.min(Math.abs(got - want), Math.abs(got - want - 2 * Math.PI))).toBeLessThan(1e-6);
    }
  });

  it.each(allClips())('%s is short enough to chain and has no pops', (_, clip) => {
    // the strike and follow-through finish well inside a beat at 155 BPM; full recovery is short
    expect(clip.end).toBeLessThanOrEqual(0.65);
    expect(clip.anticipation).toBeLessThanOrEqual(0.2);
    const a = makePose();
    const b = makePose();
    const dt = 0.001;
    for (let u = clip.keys[0]!.t; u < clip.end; u += dt) {
      sampleClip(clip, u, READY_POSE, a);
      sampleClip(clip, u + dt, READY_POSE, b);
      for (const c of CHANNELS) {
        // fastest plausible channel speed: a spin turns 2π in ~0.25 s
        expect(Math.abs(b[c] - a[c]) / dt, `${c} at ${u.toFixed(3)}`).toBeLessThan(60);
      }
    }
  });

  it("alternating slashes hand off: each follow-through ends near the other swing's coil", () => {
    const [fore, back] = MOVE_CLIPS.slash as [MoveClip, MoveClip];
    const endOf = (c: MoveClip) => sampleClip(c, 0.16, READY_POSE, makePose());
    const coilOf = (c: MoveClip) => sampleClip(c, c.coil, READY_POSE, makePose());
    for (const [from, to] of [
      [fore, back],
      [back, fore],
    ] as const) {
      const e = endOf(from);
      const c = coilOf(to);
      expect(Math.abs(e.swordYaw - c.swordYaw)).toBeLessThan(0.45);
      expect(Math.abs(e.spineYaw - c.spineYaw)).toBeLessThan(0.2);
      expect(Math.hypot(e.handX - c.handX, e.handY - c.handY, e.handZ - c.handZ)).toBeLessThan(
        0.12,
      );
    }
  });
});

describe('clip timing', () => {
  const clip = MOVE_CLIPS.stab[0]!;

  it('hit-stop holds the contact frame, then the follow-through runs', () => {
    const hit = { ...opts, hit: true };
    expect(clipTime(clip, 0, hit)).toBe(0);
    expect(clipTime(clip, clip.hitStop * 0.9, hit)).toBe(0);
    expect(clipTime(clip, clip.hitStop + 0.05, hit)).toBeCloseTo(0.05, 9);
    expect(clipTime(clip, 0.05, opts)).toBeCloseTo(0.05, 9);
  });

  it('a held cue freezes at the hold frame and resumes on release', () => {
    expect(clipTime(clip, 2, { ...opts, holding: true })).toBe(clip.hold);
    expect(clipTime(clip, 2, { ...opts, releasedAge: 0.1 })).toBeCloseTo(clip.hold + 0.1, 9);
  });

  it('follow scale speeds up or slows down the follow-through only', () => {
    expect(clipTime(clip, 0, { ...opts, followScale: 1.2 })).toBe(0);
    expect(clipTime(clip, 0.1, { ...opts, followScale: 1.2 })).toBeCloseTo(0.12, 9);
  });

  it('the hit reaction starts and ends at rest', () => {
    expect(HIT_REACT[0]!.t).toBe(0);
    expect(Object.keys(HIT_REACT[0]!.pose)).toHaveLength(0);
    expect(Object.keys(HIT_REACT[HIT_REACT.length - 1]!.pose)).toHaveLength(0);
  });
});
