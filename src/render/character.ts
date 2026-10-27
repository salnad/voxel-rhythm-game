import * as THREE from 'three';
import { CHARACTER as C } from '../config/visuals';

/** Rig dimensions (model space: forward +Z, up +Y, the hero's right is -X). */
export const RIG = {
  hipY: 0.72,
  hipX: 0.14,
  thigh: 0.34,
  shin: 0.32,
  ankleY: 0.08,
  /** Rest foot positions (x, z): a light fighting stance, left foot forward. */
  footL: [0.19, 0.08] as const,
  footR: [-0.2, -0.1] as const,
  /** Shoulders and neck in torso (spine) space. */
  shoulderL: [0.29, 0.5, 0] as const,
  shoulderR: [-0.29, 0.5, 0] as const,
  neckY: 0.66,
  upperArm: 0.23,
  foreArm: 0.22,
  /** Wrist to grip centre. */
  hand: 0.07,
  /** Sword, along its local +Z from the grip centre. */
  bladeStart: 0.16,
  bladeLength: 0.66,
};

export interface CharacterRig {
  root: THREE.Group;
  /** Yaw toward target / spins. Holds the model, which is turned to face body +X. */
  body: THREE.Group;
  pelvis: THREE.Group;
  spine: THREE.Group;
  head: THREE.Group;
  /** Sword hand: positioned at the grip, oriented along the blade. */
  swordHand: THREE.Group;
  /** Sword (child of swordHand), scaled along its length by reach. */
  sword: THREE.Group;
  /** Right glove (child of swordHand); its cuff is aimed at the forearm each frame. */
  gloveR: THREE.Group;
  leftHand: THREE.Group;
  /** Bone meshes placed by IK each frame: [start, end] segments. */
  armR: [THREE.Object3D, THREE.Object3D];
  armL: [THREE.Object3D, THREE.Object3D];
  legL: [THREE.Object3D, THREE.Object3D, THREE.Object3D];
  legR: [THREE.Object3D, THREE.Object3D, THREE.Object3D];
  bladeBase: THREE.Object3D;
  bladeMid: THREE.Object3D;
  bladeTip: THREE.Object3D;
  /** Blade geometry, shared with echo afterimages. */
  bladeGeometry: THREE.BufferGeometry;
  bladeMaterial: THREE.MeshStandardMaterial;
  materiaMaterial: THREE.MeshStandardMaterial;
  /** All materials, for hurt flashes. */
  materials: THREE.MeshStandardMaterial[];
}

const mats: THREE.MeshStandardMaterial[] = [];
function mat(color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  const m = new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: 0.78,
    metalness: 0,
    ...opts,
  });
  mats.push(m);
  return m;
}

function box(w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  return mesh;
}

/** Faceted prism along +Y from y = 0 to y = h (a bone segment). */
function bone(rTop: number, rBottom: number, h: number, m: THREE.Material, segs = 6): THREE.Mesh {
  const g = new THREE.CylinderGeometry(rTop, rBottom, h, segs);
  g.translate(0, h / 2, 0);
  return new THREE.Mesh(g, m);
}

/** A box with chamfered vertical edges: an octagonal prism scaled to w × h × d. */
function chamferBox(w: number, h: number, d: number, m: THREE.Material, top = 1): THREE.Mesh {
  const g = new THREE.CylinderGeometry(0.5 * top, 0.5, 1, 8);
  g.rotateY(Math.PI / 8);
  g.scale(w / Math.cos(Math.PI / 8), h, d / Math.cos(Math.PI / 8));
  return new THREE.Mesh(g, m);
}

/**
 * Low-poly chibi swordfighter after the FF7 chibi reference: big faceted head, swept spiky
 * hair, compact torso with harness, bare arms with stacked-ring gloves, baggy tapered pants,
 * chunky boots, and a short broad sword. About 2 units tall.
 */
export function buildCharacter(): CharacterRig {
  mats.length = 0;
  const skin = mat(C.skin);
  const hair = mat(C.hair, { roughness: 0.6 });
  const hairDark = mat(C.hairShade, { roughness: 0.6 });
  const outfit = mat(C.outfit);
  const outfitDark = mat(C.outfitDark);
  const leather = mat(C.leather);
  const metal = mat(C.metal, { metalness: 0.55, roughness: 0.38 });
  const metalDark = mat(C.metalDark, { metalness: 0.45, roughness: 0.5 });
  const eyes = mat(C.eyes, { emissive: C.eyes, emissiveIntensity: 0.35 });
  const dark = mat('#1d1d26');

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const model = new THREE.Group();
  model.rotation.y = Math.PI / 2;
  body.add(model);

  // ---- legs (IK-placed): baggy faceted pants tapering into chunky boots
  const legOf = (side: number) => {
    // bone groups point their +Y from joint to joint (set by IK each frame)
    const thigh = new THREE.Group();
    thigh.add(bone(0.13, 0.16, RIG.thigh, outfit, 6));
    const shin = new THREE.Group();
    shin.add(bone(0.09, 0.145, RIG.shin, outfitDark, 6));
    const knee = chamferBox(0.22, 0.08, 0.22, outfitDark);
    shin.add(knee);
    const foot = new THREE.Group();
    const cuff = chamferBox(0.22, 0.1, 0.24, leather);
    cuff.position.set(0, 0.06, 0);
    const boot = box(0.2, 0.12, 0.32, metalDark, 0, -0.025, 0.04);
    const toe = chamferBox(0.19, 0.08, 0.13, metalDark, 0.8);
    toe.position.set(0, -0.04, 0.2);
    const sole = box(0.21, 0.03, 0.34, dark, 0, -0.07, 0.05);
    foot.add(cuff, boot, toe, sole);
    foot.position.x = side * 0.005;
    model.add(thigh, shin, foot);
    return [thigh, shin, foot] as [THREE.Object3D, THREE.Object3D, THREE.Object3D];
  };
  const legL = legOf(1);
  const legR = legOf(-1);

  // ---- pelvis + torso
  const pelvis = new THREE.Group();
  pelvis.position.y = RIG.hipY;
  model.add(pelvis);
  const skirt = chamferBox(0.46, 0.16, 0.3, outfitDark, 0.92);
  skirt.position.y = -0.02;
  pelvis.add(skirt);

  const spine = new THREE.Group();
  spine.rotation.order = 'YXZ';
  spine.position.y = 0.04;
  pelvis.add(spine);
  const belt = chamferBox(0.47, 0.08, 0.31, leather);
  belt.position.y = 0.08;
  const buckle = box(0.1, 0.07, 0.03, metal, 0, 0.08, 0.16);
  const chest = chamferBox(0.46, 0.38, 0.29, outfit, 1.14);
  chest.position.y = 0.32;
  const strapL = box(0.07, 0.4, 0.03, leather, 0.11, 0.33, 0.165);
  strapL.rotation.z = -0.08;
  const strapR = box(0.07, 0.4, 0.03, leather, -0.11, 0.33, 0.165);
  strapR.rotation.z = 0.08;
  const plate = box(0.2, 0.09, 0.035, leather, 0, 0.22, 0.17);
  const collar = chamferBox(0.42, 0.06, 0.27, outfitDark);
  collar.position.y = 0.55;
  spine.add(belt, buckle, chest, strapL, strapR, plate, collar);

  // left pauldron with two spikes (the reference's shoulder guard)
  const pauldron = chamferBox(0.24, 0.13, 0.27, outfitDark, 0.85);
  pauldron.position.set(0.31, 0.56, 0);
  pauldron.rotation.z = -0.25;
  spine.add(pauldron);
  for (const dz of [-0.06, 0.06]) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 4), metal);
    spike.position.set(0.36, 0.67, dz);
    spike.rotation.z = -0.35;
    spine.add(spike);
  }
  const shoulderR = chamferBox(0.15, 0.12, 0.17, skin);
  shoulderR.position.set(RIG.shoulderR[0], RIG.shoulderR[1] + 0.02, 0);
  spine.add(shoulderR);

  // ---- head: big faceted chibi head with swept spiky hair
  const head = new THREE.Group();
  head.rotation.order = 'YXZ';
  head.position.y = RIG.neckY;
  spine.add(head);
  const neck = bone(0.07, 0.08, 0.1, skin, 6);
  neck.position.y = -0.04;
  head.add(neck);
  const skull = chamferBox(0.6, 0.5, 0.52, skin, 0.94);
  skull.position.y = 0.3;
  head.add(skull);
  const jaw = chamferBox(0.38, 0.12, 0.34, skin, 1.25);
  jaw.position.set(0, 0.06, 0.04);
  head.add(jaw);
  for (const side of [-1, 1]) {
    const eye = box(0.1, 0.11, 0.02, eyes, side * 0.125, 0.27, 0.265);
    const brow = box(0.14, 0.03, 0.03, hairDark, side * 0.125, 0.36, 0.27);
    brow.rotation.z = side * -0.18;
    const ear = box(0.04, 0.1, 0.08, skin, side * 0.31, 0.26, 0.02);
    head.add(eye, brow, ear);
  }
  head.add(box(0.07, 0.015, 0.02, dark, 0, 0.13, 0.265));
  head.add(chamferBox(0.64, 0.18, 0.56, hair, 0.85).translateY(0.55).translateZ(-0.02));
  // x, y, z, pitch (back sweep), roll (side splay), radius, length
  const spikes: Array<[number, number, number, number, number, number, number]> = [
    [0, 0.62, -0.02, -0.85, 0, 0.15, 0.48],
    [0.17, 0.6, 0.02, -0.62, -0.7, 0.13, 0.44],
    [-0.17, 0.6, 0.02, -0.62, 0.7, 0.13, 0.44],
    [0.27, 0.48, 0.04, -0.15, -1.2, 0.11, 0.42],
    [-0.27, 0.48, 0.04, -0.15, 1.2, 0.11, 0.42],
    [0.1, 0.56, -0.18, -1.05, -0.35, 0.13, 0.46],
    [-0.1, 0.56, -0.18, -1.05, 0.35, 0.13, 0.46],
    [0, 0.42, -0.26, -1.45, 0, 0.15, 0.42],
    [0.22, 0.38, -0.2, -1.25, -0.75, 0.11, 0.36],
    [-0.22, 0.38, -0.2, -1.25, 0.75, 0.11, 0.36],
    // bangs over the forehead
    [0.12, 0.5, 0.26, 2.35, -0.3, 0.085, 0.3],
    [-0.13, 0.5, 0.26, 2.4, 0.35, 0.085, 0.3],
    [0, 0.52, 0.27, 2.6, 0, 0.08, 0.28],
    [0.26, 0.38, 0.2, 2.6, -0.45, 0.07, 0.28],
    [-0.26, 0.38, 0.2, 2.6, 0.45, 0.07, 0.28],
  ];
  spikes.forEach(([x, y, z, rx, rz, r, len], i) => {
    const s = new THREE.Mesh(new THREE.ConeGeometry(r, len, 4), i % 3 === 2 ? hairDark : hair);
    s.position.set(x, y, z);
    s.rotation.set(rx, 0, rz);
    s.translateY(len * 0.38);
    head.add(s);
  });

  // ---- arms (IK-placed segments), bare skin
  const upper = (m: THREE.Material) => {
    const g = new THREE.Group();
    g.add(bone(0.065, 0.075, RIG.upperArm, m, 6));
    return g;
  };
  const fore = (m: THREE.Material) => {
    const g = new THREE.Group();
    g.add(bone(0.06, 0.065, RIG.foreArm, m, 6));
    return g;
  };
  const armR: [THREE.Object3D, THREE.Object3D] = [upper(skin), fore(skin)];
  const armL: [THREE.Object3D, THREE.Object3D] = [upper(skin), fore(skin)];
  spine.add(...armR, ...armL);

  // ---- sword hand: glove around the grip, sword along local +Z
  const swordHand = new THREE.Group();
  spine.add(swordHand);
  const gloveR = glove(dark, leather, metalDark);
  swordHand.add(gloveR);
  const sword = new THREE.Group();
  swordHand.add(sword);
  const swordParts = buildSword(leather, dark, metal, metalDark);
  sword.add(swordParts.group);
  const bladeBase = new THREE.Object3D();
  bladeBase.position.z = RIG.bladeStart + 0.04;
  const bladeMid = new THREE.Object3D();
  bladeMid.position.z = RIG.bladeStart + RIG.bladeLength * 0.45;
  const bladeTip = new THREE.Object3D();
  bladeTip.position.z = RIG.bladeStart + RIG.bladeLength;
  sword.add(bladeBase, bladeMid, bladeTip);

  const leftHand = new THREE.Group();
  leftHand.add(glove(dark, leather, metalDark));
  spine.add(leftHand);

  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });

  return {
    root,
    body,
    pelvis,
    spine,
    head,
    swordHand,
    sword,
    gloveR,
    leftHand,
    armR,
    armL,
    legL,
    legR,
    bladeBase,
    bladeMid,
    bladeTip,
    bladeGeometry: swordParts.bladeGeometry,
    bladeMaterial: swordParts.bladeMaterial,
    materiaMaterial: swordParts.materiaMaterial,
    materials: [...mats],
  };
}

/**
 * Short broad single-edged sword, chunky and faceted: chamfered blade with a clipped tip, a
 * dark fuller, two materia slots, block guard, wrapped grip and a pommel. Grip centre at the
 * origin, blade along +Z.
 */
function buildSword(
  leather: THREE.Material,
  dark: THREE.Material,
  metal: THREE.Material,
  metalDark: THREE.Material,
): {
  group: THREE.Group;
  bladeGeometry: THREE.BufferGeometry;
  bladeMaterial: THREE.MeshStandardMaterial;
  materiaMaterial: THREE.MeshStandardMaterial;
} {
  const group = new THREE.Group();
  const L = RIG.bladeLength;
  const w0 = 0.19;
  const w1 = 0.17;
  const clip = 0.17;
  // blade silhouette in (x = width, y = length); +x is the cutting edge
  const shape = new THREE.Shape();
  shape.moveTo(-w0 / 2, 0);
  shape.lineTo(w0 / 2, 0);
  shape.lineTo(w1 / 2, L - clip);
  shape.lineTo(-w1 / 2 + 0.02, L);
  shape.lineTo(-w1 / 2, L - 0.03);
  shape.lineTo(-w0 / 2, 0);
  const bladeGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.016,
    bevelSize: 0.02,
    bevelSegments: 1,
    curveSegments: 1,
  });
  bladeGeometry.translate(0, 0, -0.006);
  // length → +Z, thickness → Y
  bladeGeometry.rotateX(Math.PI / 2);
  bladeGeometry.translate(0, 0, RIG.bladeStart);
  bladeGeometry.computeVertexNormals();
  const bladeMaterial = mat(C.blade, {
    metalness: 0.65,
    roughness: 0.32,
    emissive: '#000000',
  });
  const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
  group.add(blade);
  // fuller along the spine side, both faces
  for (const side of [-1, 1]) {
    const fuller = box(
      0.035,
      0.006,
      L * 0.6,
      metalDark,
      -0.035,
      side * 0.03,
      RIG.bladeStart + L * 0.36,
    );
    group.add(fuller);
  }
  // two materia slots near the guard
  const slotMat = mat(C.materia, { emissive: C.materia, emissiveIntensity: 0.25, roughness: 0.4 });
  for (const z of [0.08, 0.17]) {
    const slot = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.07, 6), slotMat);
    slot.position.set(-0.03, 0, RIG.bladeStart + z);
    group.add(slot);
  }
  // guard, grip, pommel
  const guard = chamferBox(0.27, 0.075, 0.07, metalDark);
  guard.position.z = RIG.bladeStart - 0.03;
  const guardCap = box(0.2, 0.05, 0.04, metal, 0, 0, RIG.bladeStart - 0.075);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.033, 0.2, 6), leather);
  grip.rotation.x = Math.PI / 2;
  grip.position.z = 0;
  group.add(guard, guardCap, grip);
  for (const z of [-0.07, 0.06]) {
    const wrap = new THREE.Mesh(new THREE.CylinderGeometry(0.037, 0.037, 0.02, 6), dark);
    wrap.rotation.x = Math.PI / 2;
    wrap.position.z = z;
    group.add(wrap);
  }
  const pommel = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), metal);
  pommel.scale.set(1, 1, 0.8);
  pommel.position.z = -0.135;
  group.add(pommel);
  return { group, bladeGeometry, bladeMaterial, materiaMaterial: slotMat };
}

/**
 * FF7-style stacked-ring glove: a fist at the origin and a cuff of rings running back along
 * local -Z toward the wrist. The caller aims -Z at the forearm.
 */
function glove(dark: THREE.Material, leather: THREE.Material, metal: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  g.add(chamferBox(0.15, 0.14, 0.15, dark));
  const rings = [dark, leather, metal];
  rings.forEach((m, i) => {
    const r = chamferBox(0.18 - i * 0.006, 0.05, 0.18 - i * 0.006, m);
    r.rotation.x = Math.PI / 2;
    r.position.set(0, 0, -0.06 - i * 0.042);
    g.add(r);
  });
  return g;
}
