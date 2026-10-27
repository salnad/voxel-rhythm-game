import * as THREE from 'three';
import type { Action, EnemyKind } from '../chart/types';
import { ACTION_SPECS, ENEMIES } from '../config/actions';
import { ENEMY_REACT, PALETTE } from '../config/visuals';
import { drawActionIcon } from './icons';

export interface EnemyRig {
  kind: EnemyKind;
  root: THREE.Group;
  body: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  weaponArm: THREE.Group;
  offArm: THREE.Group;
  weaponTip: THREE.Object3D;
  core: THREE.Mesh;
  shutters: [THREE.Mesh, THREE.Mesh];
  guardLine: THREE.Mesh;
  dizzy: THREE.Mesh;
  icon: THREE.Sprite;
  iconMats: Record<Action, THREE.SpriteMaterial>;
  weaponMat: THREE.MeshStandardMaterial;
  bodyMat: THREE.MeshStandardMaterial;
  eyeMat: THREE.MeshBasicMaterial;
  coreMat: THREE.MeshBasicMaterial;
}

const FLASH = new THREE.Color('#ffffff');
const iconCache = new Map<Action, THREE.CanvasTexture>();
function iconTexture(action: Action): THREE.CanvasTexture {
  let tex = iconCache.get(action);
  if (!tex) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const c = cv.getContext('2d')!;
    const color = ACTION_SPECS[action].color;
    c.fillStyle = 'rgba(0,0,0,0.65)';
    c.beginPath();
    c.arc(64, 64, 58, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = color;
    c.lineWidth = 7;
    c.stroke();
    drawActionIcon(c, action, 64, 64, 34, color);
    tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    iconCache.set(action, tex);
  }
  return tex;
}

function box(w: number, h: number, d: number, m: THREE.Material, edges?: THREE.Material) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, m);
  if (edges) mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edges));
  return mesh;
}

/** Voxel duelist facing +Z (toward the hero), feet at y = 0. */
export function buildEnemy(kind: EnemyKind): EnemyRig {
  const spec = ENEMIES[kind];
  const bodyMat = new THREE.MeshStandardMaterial({
    color: spec.body,
    emissive: spec.accent,
    emissiveIntensity: 0.08,
    flatShading: true,
    roughness: 0.6,
  });
  const edge = new THREE.LineBasicMaterial({ color: spec.accent });
  const darkMat = new THREE.MeshStandardMaterial({ color: '#07090b', flatShading: true });
  const eyeMat = new THREE.MeshBasicMaterial({ color: PALETTE.white });
  const weaponMat = new THREE.MeshStandardMaterial({
    color: '#aab4bf',
    metalness: 0.6,
    roughness: 0.35,
    emissive: '#000000',
    flatShading: true,
  });

  const root = new THREE.Group();
  const body = new THREE.Group();
  body.scale.setScalar(spec.scale);
  root.add(body);

  for (const s of [-1, 1]) {
    const leg = box(0.24, 0.72, 0.28, darkMat, edge);
    leg.position.set(s * 0.17, 0.36, 0);
    body.add(leg);
  }
  const torso = new THREE.Group();
  torso.position.y = 0.72;
  body.add(torso);
  const chestW = kind === 'brute' ? 0.95 : 0.72;
  const chest = box(chestW, 0.78, 0.46, bodyMat, edge);
  chest.position.y = 0.42;
  torso.add(chest);
  const belt = box(chestW + 0.04, 0.1, 0.5, darkMat);
  belt.position.y = 0.06;
  torso.add(belt);

  // weak point: a core behind two sliding chest plates
  const coreMat = new THREE.MeshBasicMaterial({ color: ACTION_SPECS.stab.color });
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), coreMat);
  core.position.set(0, 0.5, 0.22);
  torso.add(core);
  const plateMat = new THREE.MeshStandardMaterial({
    color: spec.body,
    emissive: spec.accent,
    emissiveIntensity: 0.2,
    flatShading: true,
  });
  const shutters: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    const plate = box(0.2, 0.34, 0.06, plateMat, edge);
    plate.position.set(s * 0.1, 0.5, 0.26);
    torso.add(plate);
    shutters.push(plate);
  }

  // slash marker: a diagonal glowing cut line across the chest
  const guardLine = new THREE.Mesh(
    new THREE.PlaneGeometry(chestW * 1.5, 0.07),
    new THREE.MeshBasicMaterial({
      color: ACTION_SPECS.slash.color,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  guardLine.position.set(0, 0.45, 0.3);
  guardLine.rotation.z = 0.6;
  torso.add(guardLine);

  // head
  const head = new THREE.Group();
  head.position.y = 0.95;
  torso.add(head);
  const skull = box(0.48, 0.44, 0.44, bodyMat, edge);
  skull.position.y = 0.2;
  head.add(skull);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.02), eyeMat);
    eye.position.set(s * 0.1, 0.24, 0.23);
    head.add(eye);
  }
  if (kind === 'brute') {
    for (const s of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 4), bodyMat);
      horn.position.set(s * 0.2, 0.52, 0);
      horn.rotation.z = -s * 0.35;
      head.add(horn);
    }
  } else if (kind === 'knight') {
    const crest = box(0.06, 0.24, 0.4, bodyMat, edge);
    crest.position.y = 0.52;
    head.add(crest);
  } else if (kind === 'duelist') {
    const brim = box(0.7, 0.04, 0.6, darkMat, edge);
    brim.position.y = 0.43;
    head.add(brim);
  }

  // stagger ring above the head
  const dizzy = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.035, 4, 18),
    new THREE.MeshBasicMaterial({
      color: ACTION_SPECS.flourish.color,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  dizzy.rotation.x = Math.PI / 2;
  dizzy.position.y = 0.62;
  head.add(dizzy);

  // arms: pivots at the shoulders, hanging along -Y. The enemy's right is -X.
  const shoulderX = chestW / 2 + 0.1;
  const weaponArm = new THREE.Group();
  weaponArm.position.set(-shoulderX, 0.72, 0);
  torso.add(weaponArm);
  const wUpper = box(0.17, 0.62, 0.17, bodyMat, edge);
  wUpper.position.y = -0.3;
  weaponArm.add(wUpper);
  const weapon = new THREE.Group();
  weapon.position.y = -0.62;
  weaponArm.add(weapon);
  const weaponTip = new THREE.Object3D();
  if (spec.weapon === 'blade') {
    const b = box(0.07, 1.0, 0.2, weaponMat);
    b.position.y = -0.55;
    weapon.add(b, box(0.26, 0.05, 0.08, darkMat));
    weaponTip.position.y = -1.05;
  } else if (spec.weapon === 'rapier') {
    const b = box(0.035, 1.25, 0.035, weaponMat);
    b.position.y = -0.66;
    const guard = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 4, 10), weaponMat);
    guard.rotation.x = Math.PI / 2;
    weapon.add(b, guard);
    weaponTip.position.y = -1.3;
  } else if (spec.weapon === 'club') {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.08, 1.0, 6), weaponMat);
    b.position.y = -0.5;
    weapon.add(b);
    weaponTip.position.y = -1.0;
  } else {
    const pole = box(0.06, 1.7, 0.06, darkMat);
    pole.position.y = -0.6;
    const axe = box(0.06, 0.38, 0.34, weaponMat);
    axe.position.set(0, -1.3, 0.16);
    weapon.add(pole, axe);
    weaponTip.position.y = -1.45;
  }
  weapon.add(weaponTip);

  const offArm = new THREE.Group();
  offArm.position.set(shoulderX, 0.72, 0);
  torso.add(offArm);
  const oUpper = box(0.17, 0.62, 0.17, bodyMat, edge);
  oUpper.position.y = -0.3;
  offArm.add(oUpper);
  if (spec.shield) {
    const shield = box(0.08, 0.7, 0.55, bodyMat, edge);
    shield.position.set(0.08, -0.55, 0.1);
    offArm.add(shield);
  }

  const iconMats = {} as Record<Action, THREE.SpriteMaterial>;
  for (const a of Object.keys(ACTION_SPECS) as Action[]) {
    iconMats[a] = new THREE.SpriteMaterial({
      map: iconTexture(a),
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
  }
  const icon = new THREE.Sprite(iconMats.block);
  icon.scale.setScalar(0.62);
  icon.position.y = 2.75 * spec.scale;
  icon.renderOrder = 13;
  root.add(icon);

  return {
    kind,
    root,
    body,
    torso,
    head,
    weaponArm,
    offArm,
    weaponTip,
    core,
    shutters: [shutters[0]!, shutters[1]!],
    guardLine,
    dizzy,
    icon,
    iconMats,
    weaponMat,
    bodyMat,
    eyeMat,
    coreMat,
  };
}

/** Everything the enemy pose depends on. Built by the arena from the telegraph + duel state. */
export interface EnemyPoseInput {
  t: number;
  /** 0..1 beat phase for idle bob. */
  beatPhase: number;
  /** Seconds since walk-in started, and walk-in duration. */
  enterAge: number;
  walkIn: number;
  /** World units covered by the walk-in. */
  walkDistance: number;
  next: { action: Action; progress: number } | null;
  last: { action: Action; age: number; outcome: 'hit' | 'miss' | 'holding' | 'pending' } | null;
  exit: { kind: 'defeated' | 'escaped'; age: number } | null;
}

interface PoseParams {
  armX: number;
  armZ: number;
  offX: number;
  offZ: number;
  lean: number;
  twist: number;
  crouch: number;
  /** Forward (toward the hero) offset. */
  fwd: number;
  shutter: number;
  core: number;
  line: number;
  dizzy: number;
  glow: number;
  eyes: number;
}

const IDLE: PoseParams = {
  armX: -1.15,
  armZ: 0.2,
  offX: -0.5,
  offZ: 0.25,
  lean: 0,
  twist: 0,
  crouch: 0,
  fwd: 0,
  shutter: 0,
  core: 0.15,
  line: 0,
  dizzy: 0,
  glow: 0,
  eyes: 0,
};

/** Telegraph pose at full wind-up, per action. */
const TELEGRAPH: Record<Action, Partial<PoseParams>> = {
  block: { armX: -3.05, armZ: 0.15, offX: -0.2, lean: -0.22, glow: 1, eyes: 1, fwd: -0.1 },
  slash: { armX: -0.15, armZ: -1.45, offX: 0, offZ: 1.45, lean: -0.12, line: 1 },
  stab: { armX: -0.5, armZ: -0.9, offX: -0.2, offZ: 0.9, lean: -0.32, shutter: 1, core: 1 },
  flourish: { armX: 0.15, armZ: 0.35, offX: 0.2, offZ: 0.1, lean: 0.38, crouch: -0.22, dizzy: 1 },
};

function mix(a: PoseParams, b: Partial<PoseParams>, k: number): PoseParams {
  const out = { ...a };
  for (const key of Object.keys(b) as Array<keyof PoseParams>) {
    out[key] = a[key] + (b[key]! - a[key]) * k;
  }
  return out;
}

const smooth = (x: number) => x * x * (3 - 2 * x);
/** Ease out with a small overshoot (knockback that rocks past and settles). */
const backOut = (x: number) => {
  const c = ENEMY_REACT.overshoot;
  return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
};

/** Outcome animation for the last cue, starting from its full telegraph pose. */
function outcomePose(
  from: PoseParams,
  action: Action,
  outcome: 'hit' | 'miss' | 'holding' | 'pending',
  age: number,
  t: number,
): PoseParams {
  const k = Math.min(1, age / 0.08);
  const settle = Math.min(1, Math.max(0, (age - 0.12) / 0.25));
  let p: PoseParams;
  if (action === 'block') {
    if (outcome === 'holding') {
      // blade lock: weapon pressed against the hero's guard, trembling
      p = mix(from, { armX: -1.75 + Math.sin(t * 60) * 0.04, glow: 0.6, fwd: 0.25, lean: 0.15 }, k);
      return p;
    }
    p =
      outcome === 'miss'
        ? mix(from, { armX: -0.55, fwd: 0.75, lean: 0.25, glow: 0, eyes: 1 }, k)
        : mix(from, { armX: -1.75, fwd: 0.1, lean: 0.05, glow: 0, eyes: 0 }, k);
    if (outcome !== 'miss' && age > 0.08)
      p = mix(p, { armX: -2.2, fwd: -0.3, lean: -0.15 }, Math.min(1, (age - 0.08) / 0.08));
  } else if (outcome === 'miss' || outcome === 'pending') {
    // guard snaps shut
    p = mix(
      from,
      { ...IDLE, armX: -1.3, offX: -0.9, offZ: 0.05, fwd: 0.18 },
      Math.min(1, age / 0.06),
    );
  } else {
    // struck: freeze for the hit-stop (with a shudder), then knock back past the pose and settle
    const struck = Math.max(0, age - ENEMY_REACT.hitStop);
    const kb = backOut(Math.min(1, struck / ENEMY_REACT.knockback));
    if (action === 'slash') {
      p = mix(from, { twist: 0.6, fwd: -0.45, lean: 0.28, line: 0, armZ: -0.6, offZ: 0.6 }, kb);
    } else if (action === 'stab') {
      p = mix(from, { lean: 0.5, fwd: -0.55, core: 0, crouch: -0.12 }, kb);
    } else {
      p = mix(from, { lean: 0.55, crouch: -0.38, fwd: -0.35, twist: -0.3, dizzy: 0 }, kb);
    }
    if (age < ENEMY_REACT.hitStop) p.twist += Math.sin(t * 95) * ENEMY_REACT.shudder;
    const rest = Math.min(1, Math.max(0, (struck - 0.1) / 0.28));
    return mix(p, IDLE, smooth(rest));
  }
  return mix(p, IDLE, smooth(settle));
}

export function poseEnemy(rig: EnemyRig, s: EnemyPoseInput): void {
  let p = { ...IDLE };
  const bob = Math.pow(1 - s.beatPhase, 3);
  p.crouch = -0.03 * bob;

  // most recent cue's outcome, then the wind-up for the next one on top
  if (s.last && s.last.age < 0.4) {
    const peak = mix(IDLE, TELEGRAPH[s.last.action], 1);
    p = outcomePose(peak, s.last.action, s.last.outcome, s.last.age, s.t);
  } else if (s.last && s.last.outcome === 'holding') {
    p = outcomePose(mix(IDLE, TELEGRAPH.block, 1), s.last.action, 'holding', 1, s.t);
  }
  if (s.next && s.next.progress > 0) {
    p = mix(p, TELEGRAPH[s.next.action], smooth(s.next.progress));
    if (s.next.action === 'flourish') p.twist += Math.sin(s.t * 7) * 0.18 * s.next.progress;
    if (s.next.action === 'stab') p.core *= 0.75 + 0.25 * Math.sin(s.t * 30);
  }

  // walk-in
  const walk = Math.min(1, s.enterAge / Math.max(0.01, s.walkIn));
  const stepping = walk < 1;
  let rootY = 0;
  let scale = 1;
  let fwdWalk = 0;
  if (stepping) {
    fwdWalk = -(1 - smooth(walk)) * s.walkDistance;
    rootY = Math.abs(Math.sin(walk * Math.PI * 3)) * 0.12;
    scale = Math.min(1, 0.4 + walk * 1.2);
  }

  // exits
  rig.root.visible = true;
  if (s.exit) {
    if (s.exit.kind === 'defeated') {
      rig.root.visible = false;
    } else {
      const a = s.exit.age;
      fwdWalk -= a * 7;
      rootY += Math.max(0, a * 4 - a * a * 9);
      scale *= Math.max(0, 1 - a / 0.6);
      p = mix(p, { lean: -0.4, armX: -1.6 }, Math.min(1, a / 0.1));
    }
  }

  rig.root.userData.fwd = p.fwd + fwdWalk;
  rig.root.position.y = rootY;
  rig.root.scale.setScalar(scale);
  rig.body.rotation.set(0, p.twist, 0);
  rig.body.position.y = p.crouch;
  rig.torso.rotation.x = p.lean;
  rig.head.rotation.x = -p.lean * 0.4 + (p.dizzy > 0.3 ? 0.3 : 0);
  rig.weaponArm.rotation.set(p.armX, 0, p.armZ);
  rig.offArm.rotation.set(p.offX, 0, p.offZ);
  rig.shutters[0].position.x = -0.1 - p.shutter * 0.2;
  rig.shutters[1].position.x = 0.1 + p.shutter * 0.2;
  rig.coreMat.color.set(ACTION_SPECS.stab.color).multiplyScalar(0.25 + 0.75 * p.core);
  rig.core.scale.setScalar(0.8 + p.core * 0.6);
  rig.core.rotation.y = s.t * 3;
  (rig.guardLine.material as THREE.MeshBasicMaterial).opacity =
    p.line * (0.7 + 0.3 * Math.sin(s.t * 25));
  rig.guardLine.scale.x = 0.4 + 0.6 * p.line;
  (rig.dizzy.material as THREE.MeshBasicMaterial).opacity = p.dizzy;
  rig.dizzy.rotation.z = s.t * 6;
  rig.weaponMat.emissive.set(ACTION_SPECS.block.color).multiplyScalar(p.glow * 1.4);
  // white flash on a landed slash, stab or flourish
  const struck =
    s.last && s.last.outcome === 'hit' && s.last.action !== 'block' && s.last.age >= 0
      ? Math.max(0, 1 - s.last.age / ENEMY_REACT.flashDecay)
      : 0;
  rig.bodyMat.emissive.set(ENEMIES[rig.kind].accent).lerp(FLASH, struck);
  rig.bodyMat.emissiveIntensity = 0.08 + struck * ENEMY_REACT.flash;
  rig.eyeMat.color.set(p.eyes > 0.5 ? PALETTE.danger : PALETTE.white);

  // upcoming action icon above the head
  if (s.next && !s.exit && walk >= 1) {
    rig.icon.visible = true;
    rig.icon.material = rig.iconMats[s.next.action];
    const k = smooth(s.next.progress);
    rig.icon.material.opacity = 0.35 + 0.65 * k;
    rig.icon.scale.setScalar(0.5 + 0.22 * k);
  } else {
    rig.icon.visible = false;
  }
}
