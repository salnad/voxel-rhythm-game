import type { EnemyRig } from '../../render/enemy';
import type { Direction } from './logic';

/**
 * The enemy's directional strikes. The weapon arm hangs from the enemy's right shoulder
 * (screen left); rotations are Euler XYZ on that pivot, so armZ swings it out sideways,
 * armY sweeps it forward/back around the body and armX raises it.
 */
export interface StrikePose {
  armX: number;
  armY: number;
  armZ: number;
  offX: number;
  offZ: number;
  twist: number;
  lean: number;
  crouch: number;
  /** Lunge toward the hero (world units). */
  fwd: number;
}

export const IDLE_POSE: StrikePose = {
  armX: -1.15,
  armY: 0,
  armZ: 0.2,
  offX: -0.5,
  offZ: 0.25,
  twist: 0,
  lean: 0,
  crouch: 0,
  fwd: 0,
};

type Poses = Record<Direction, Partial<StrikePose>>;

/** Fully cocked, before the swing. */
export const WINDUP: Poses = {
  left: { armX: 0, armY: -0.7, armZ: -1.65, offX: -0.9, offZ: 0.6, twist: -0.6, lean: -0.1 },
  right: { armX: 0, armY: -0.35, armZ: 1.45, offX: -0.2, offZ: 1.1, twist: 0.7, lean: -0.1 },
  high: { armX: -3.15, armY: 0, armZ: 0.12, offX: -2.6, offZ: -0.2, lean: -0.3, crouch: 0.06 },
  low: { armX: 0.45, armY: 0, armZ: -1.05, offX: 0.3, twist: -0.5, lean: 0.3, crouch: -0.34 },
};

/** At contact, exactly on the beat: the weapon at the hero's guard on that side. */
export const CONTACT: Poses = {
  left: { armX: 0, armY: 1.25, armZ: -1.5, twist: 0.35, lean: 0.12, fwd: 0.95 },
  right: { armX: 0, armY: -1.5, armZ: 1.5, twist: -0.35, lean: 0.12, fwd: 0.95 },
  high: { armX: -1.6, armY: 0, armZ: 0.1, offX: -1.2, lean: 0.32, crouch: -0.1, fwd: 0.95 },
  low: { armX: -0.55, armY: 0, armZ: -0.15, twist: 0.3, lean: 0.45, crouch: -0.36, fwd: 0.95 },
};

/** Deflected: the weapon bounces back the way it came and the enemy rocks back. */
export const RECOIL: Poses = {
  left: { armX: -0.4, armY: -0.4, armZ: -2.0, twist: -0.45, lean: -0.3, fwd: 0.15 },
  right: { armX: -0.4, armY: -0.2, armZ: 1.95, twist: 0.5, lean: -0.3, fwd: 0.15 },
  high: { armX: -3.5, armZ: 0.3, lean: -0.42, crouch: 0.04, fwd: 0.05 },
  low: { armX: 0.35, armZ: -0.4, twist: -0.3, lean: -0.25, crouch: -0.12, fwd: 0.1 },
};

/** Not deflected: the swing carries through the hero. */
export const FOLLOW: Poses = {
  left: { armX: 0, armY: 2.15, armZ: -1.45, twist: 0.75, lean: 0.2, fwd: 1.15 },
  right: { armX: 0, armY: -2.3, armZ: 1.45, twist: -0.75, lean: 0.2, fwd: 1.15 },
  high: { armX: -0.75, armZ: 0.1, lean: 0.5, crouch: -0.15, fwd: 1.15 },
  low: { armX: -0.1, armZ: 0, twist: 0.65, lean: 0.5, crouch: -0.36, fwd: 1.15 },
};

/** Broken posture: slumped, weapon dropped, waiting for the deathblow. */
export const BROKEN: Partial<StrikePose> = {
  armX: -0.2,
  armY: 0,
  armZ: 0.5,
  offX: -0.1,
  offZ: 0.4,
  lean: 0.55,
  crouch: -0.32,
  twist: 0.15,
};

export function mixPose(a: StrikePose, b: Partial<StrikePose>, k: number): StrikePose {
  const out = { ...a };
  for (const key of Object.keys(b) as Array<keyof StrikePose>) {
    out[key] = a[key] + (b[key]! - a[key]) * k;
  }
  return out;
}

export function full(p: Partial<StrikePose>): StrikePose {
  return { ...IDLE_POSE, ...p };
}

/** Write a strike pose onto the rig (on top of the arena's walk-in / bob pose). */
export function applyStrikePose(rig: EnemyRig, p: StrikePose, scale: number): void {
  rig.weaponArm.rotation.set(p.armX, p.armY, p.armZ);
  rig.offArm.rotation.set(p.offX, 0, p.offZ);
  rig.body.rotation.set(0, p.twist, 0);
  rig.torso.rotation.x = p.lean;
  rig.head.rotation.x = -p.lean * 0.4;
  rig.body.position.y = p.crouch * scale;
}
