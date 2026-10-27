/**
 * The hero's pose as plain numbers, and keyframe clips over it. Pure (no Three.js), so the
 * animation data can be validated and sampled in tests.
 *
 * Space: the hero's model frame, forward +Z, up +Y, the hero's right is -X, feet at y = 0.
 * Hand and left-hand targets are in torso (spine) space, origin at the hips.
 * Angles are radians. Yaw > 0 turns toward the hero's left; pitch > 0 tilts up / leans forward.
 */
export interface HeroPose {
  /** Hip offset from the rest stance (crouch < 0, hop > 0, lunge = +Z). */
  pelvisX: number;
  pelvisY: number;
  pelvisZ: number;
  /** Whole-body yaw, legs included (spins). */
  bodyYaw: number;
  /** Torso twist, forward lean, side lean. */
  spineYaw: number;
  spinePitch: number;
  spineRoll: number;
  headYaw: number;
  headPitch: number;
  /** Sword hand (grip centre), torso space. */
  handX: number;
  handY: number;
  handZ: number;
  /** Blade direction in torso space: yaw 0 + pitch 0 points forward; roll turns the edge. */
  swordYaw: number;
  swordPitch: number;
  swordRoll: number;
  /** Free left hand target, torso space. */
  leftX: number;
  leftY: number;
  leftZ: number;
  /** 0 = free left hand, 1 = left hand on the sword at `leftGripZ` along the blade axis. */
  leftGrip: number;
  leftGripZ: number;
  /** Foot offsets from the rest stance, and lift off the ground. */
  footLX: number;
  footLZ: number;
  footLLift: number;
  footRX: number;
  footRZ: number;
  footRLift: number;
}

export type Channel = keyof HeroPose;

export const CHANNELS: readonly Channel[] = [
  'pelvisX',
  'pelvisY',
  'pelvisZ',
  'bodyYaw',
  'spineYaw',
  'spinePitch',
  'spineRoll',
  'headYaw',
  'headPitch',
  'handX',
  'handY',
  'handZ',
  'swordYaw',
  'swordPitch',
  'swordRoll',
  'leftX',
  'leftY',
  'leftZ',
  'leftGrip',
  'leftGripZ',
  'footLX',
  'footLZ',
  'footLLift',
  'footRX',
  'footRZ',
  'footRLift',
];

/** Channel groups, so a new move can snap the blade while the body blends. */
export type ChannelGroup = 'blade' | 'body' | 'feet';

export function groupOf(c: Channel): ChannelGroup {
  if (c.startsWith('foot')) return 'feet';
  if (c.startsWith('hand') || c.startsWith('sword')) return 'blade';
  return 'body';
}

/** Ease for the segment that starts at a key. `spline` = smooth Catmull-Rom through the keys. */
export type Ease = 'spline' | 'linear' | 'in' | 'out' | 'inOut' | 'step';

export interface Key {
  /** Seconds relative to the contact frame (0 = the key press). */
  t: number;
  /** Channels not listed fall back to the ready pose. */
  pose: Partial<HeroPose>;
  ease?: Ease;
}

export interface MoveClip {
  keys: Key[];
  /** Clip time (≤ 0) the anticipation coils to while a cue approaches. */
  coil: number;
  /** Longest anticipation before a cue (s). Shortened when cues are close together. */
  anticipation: number;
  /** Clip time a held cue freezes at. */
  hold: number;
  /** Hit-stop on connect (s): the contact frame holds this long. */
  hitStop: number;
  /** Clip time the move is back at the ready pose. */
  end: number;
  /** Whether the blade is cutting (draws a trail) between these clip times. */
  cut: [number, number];
}

export function makePose(init: Partial<HeroPose> = {}): HeroPose {
  const p = {} as HeroPose;
  for (const c of CHANNELS) p[c] = init[c] ?? 0;
  return p;
}

export function copyPose(from: HeroPose, out: HeroPose): HeroPose {
  for (const c of CHANNELS) out[c] = from[c];
  return out;
}

export function lerpPose(a: HeroPose, b: HeroPose, k: number, out: HeroPose): HeroPose {
  for (const c of CHANNELS) out[c] = a[c] + (b[c] - a[c]) * k;
  return out;
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smoothstep = (x: number) => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};

function ease(kind: Ease, x: number): number {
  switch (kind) {
    case 'linear':
      return x;
    case 'in':
      return x * x * x;
    case 'out':
      return 1 - (1 - x) ** 3;
    case 'inOut':
      return smoothstep(x);
    case 'step':
      return x < 1 ? 0 : 1;
    case 'spline':
      return x;
  }
}

/** Value of a channel at key `i`, falling back to the base (ready) pose. */
const keyVal = (keys: readonly Key[], i: number, c: Channel, base: HeroPose) =>
  keys[i]!.pose[c] ?? base[c];

/**
 * Sample a clip at clip time `u`. Keys are sorted by time; before the first key and after the
 * last the clip holds its end values. Spline segments use non-uniform Catmull-Rom tangents.
 */
export function sampleClip(clip: MoveClip, u: number, base: HeroPose, out: HeroPose): HeroPose {
  const keys = clip.keys;
  const n = keys.length;
  if (n === 0) return copyPose(base, out);
  if (u <= keys[0]!.t) {
    for (const c of CHANNELS) out[c] = keyVal(keys, 0, c, base);
    return out;
  }
  if (u >= keys[n - 1]!.t) {
    for (const c of CHANNELS) out[c] = keyVal(keys, n - 1, c, base);
    return out;
  }
  let i = 0;
  while (i < n - 2 && u >= keys[i + 1]!.t) i++;
  const k0 = keys[i]!;
  const k1 = keys[i + 1]!;
  const dt = k1.t - k0.t;
  const x = dt > 0 ? (u - k0.t) / dt : 1;
  const kind = k0.ease ?? 'spline';
  if (kind !== 'spline') {
    const e = ease(kind, x);
    for (const c of CHANNELS) {
      const a = keyVal(keys, i, c, base);
      out[c] = a + (keyVal(keys, i + 1, c, base) - a) * e;
    }
    return out;
  }
  const x2 = x * x;
  const x3 = x2 * x;
  const h00 = 2 * x3 - 3 * x2 + 1;
  const h10 = x3 - 2 * x2 + x;
  const h01 = -2 * x3 + 3 * x2;
  const h11 = x3 - x2;
  const tPrev = i > 0 ? keys[i - 1]!.t : k0.t;
  const tNext = i + 2 < n ? keys[i + 2]!.t : k1.t;
  for (const c of CHANNELS) {
    const p0 = keyVal(keys, i, c, base);
    const p1 = keyVal(keys, i + 1, c, base);
    const pm = i > 0 ? keyVal(keys, i - 1, c, base) : p0;
    const pn = i + 2 < n ? keyVal(keys, i + 2, c, base) : p1;
    // tangents in value per second, zero at the clip ends so moves settle cleanly
    const m0 = i > 0 ? (p1 - pm) / (k1.t - tPrev) : 0;
    const m1 = i + 2 < n ? (pn - p0) / (tNext - k0.t) : 0;
    out[c] = h00 * p0 + h10 * m0 * dt + h01 * p1 + h11 * m1 * dt;
  }
  return out;
}

/** Clip time for a move `age` seconds after its key press. Hit-stop freezes the contact frame. */
export function clipTime(
  clip: MoveClip,
  age: number,
  opts: {
    hit: boolean;
    holding: boolean;
    releasedAge: number | null;
    followScale: number;
    /** Hit-stop multiplier (shorter in fast chains). Default 1. */
    stopScale?: number;
  },
): number {
  const stop = opts.hit ? clip.hitStop * (opts.stopScale ?? 1) : 0;
  if (opts.holding) return Math.min(clip.hold, Math.max(0, age - stop));
  if (opts.releasedAge !== null)
    return clip.hold + Math.max(0, opts.releasedAge) * opts.followScale;
  return Math.max(0, age - stop) * opts.followScale;
}
