import * as THREE from 'three';
import { CHARACTER as C } from '../config/visuals';

export interface CharacterRig {
  root: THREE.Group;
  /** Rotates the whole body (yaw toward target, lean, bob). */
  body: THREE.Group;
  /** Swing pivot at the right shoulder; children point along local +X (arm → sword). */
  swingRig: THREE.Group;
  leftArm: THREE.Group;
  legs: [THREE.Group, THREE.Group];
  head: THREE.Group;
  bladeBase: THREE.Object3D;
  bladeTip: THREE.Object3D;
  blade: THREE.Mesh;
  bladeMaterial: THREE.MeshStandardMaterial;
  /** All materials, for hurt flashes. */
  materials: THREE.MeshStandardMaterial[];
}

const mats: THREE.MeshStandardMaterial[] = [];
function mat(color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  const m = new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: 0.75,
    metalness: 0,
    ...opts,
  });
  mats.push(m);
  return m;
}

function box(w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  return mesh;
}

function prism(rTop: number, rBottom: number, h: number, m: THREE.Material, segs = 6): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segs), m);
  mesh.castShadow = true;
  return mesh;
}

/** Low-poly chibi swordfighter, ~2.1 units tall, facing +X. */
export function buildCharacter(): CharacterRig {
  mats.length = 0;
  const skin = mat(C.skin);
  const hair = mat(C.hair, { roughness: 0.55 });
  const outfit = mat(C.outfit);
  const outfitDark = mat(C.outfitDark);
  const leather = mat(C.leather);
  const metal = mat(C.metal, { metalness: 0.6, roughness: 0.35 });
  const metalDark = mat(C.metalDark, { metalness: 0.5, roughness: 0.5 });
  const eyes = mat(C.eyes, { emissive: C.eyes, emissiveIntensity: 0.4 });
  const dark = mat('#1b1b22');

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  // Model is authored facing +Z, then turned to face +X.
  const model = new THREE.Group();
  model.rotation.y = Math.PI / 2;
  body.add(model);

  // ---- legs (baggy prismatic pants + chunky boots)
  const legs: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.17, 0.78, 0);
    const thigh = prism(0.15, 0.2, 0.42, outfit, 5);
    thigh.position.y = -0.2;
    const shin = prism(0.2, 0.12, 0.3, outfitDark, 5);
    shin.position.y = -0.55;
    const boot = box(0.26, 0.16, 0.34, leather, 0, -0.72, 0.03);
    const toe = box(0.27, 0.1, 0.16, metalDark, 0, -0.75, 0.22);
    const cuff = box(0.28, 0.08, 0.28, metal, 0, -0.62, 0);
    leg.add(thigh, shin, boot, toe, cuff);
    model.add(leg);
    legs.push(leg);
  }

  // ---- torso
  const torso = new THREE.Group();
  torso.position.y = 0.78;
  model.add(torso);
  torso.add(box(0.5, 0.14, 0.34, outfitDark, 0, 0.04, 0)); // hips / skirt top
  torso.add(box(0.54, 0.1, 0.36, leather, 0, 0.15, 0)); // belt
  torso.add(box(0.1, 0.08, 0.04, metal, 0, 0.15, 0.19)); // buckle
  torso.add(box(0.5, 0.42, 0.32, outfit, 0, 0.4, 0)); // chest
  torso.add(box(0.07, 0.42, 0.04, leather, -0.12, 0.4, 0.17)); // straps
  torso.add(box(0.07, 0.42, 0.04, leather, 0.12, 0.4, 0.17));
  torso.add(box(0.2, 0.1, 0.04, leather, 0, 0.3, 0.18)); // harness plate
  torso.add(box(0.56, 0.06, 0.36, outfitDark, 0, 0.6, 0)); // collar

  // left shoulder pauldron with spikes (character's left = +X in model space)
  const pauldron = box(0.26, 0.16, 0.3, outfitDark, 0.36, 0.62, 0);
  torso.add(pauldron);
  for (const dz of [-0.07, 0.07]) {
    const spike = prism(0.0, 0.035, 0.12, metal, 4);
    spike.position.set(0.4, 0.75, dz);
    torso.add(spike);
  }

  // left arm (idle, hangs down with blocky glove)
  const leftArm = new THREE.Group();
  leftArm.position.set(0.36, 0.55, 0);
  const lUpper = prism(0.08, 0.07, 0.28, skin, 6);
  lUpper.position.y = -0.14;
  const lFore = prism(0.07, 0.06, 0.24, skin, 6);
  lFore.position.y = -0.38;
  leftArm.add(lUpper, lFore, glove(dark, leather, metalDark, -0.56));
  leftArm.rotation.z = 0.25;
  torso.add(leftArm);

  // ---- head (big chibi head)
  const head = new THREE.Group();
  head.position.y = 1.62;
  model.add(head);
  head.add(box(0.6, 0.56, 0.54, skin, 0, 0.0, 0));
  head.add(box(0.36, 0.14, 0.3, skin, 0, -0.3, 0.06)); // chin/jaw
  head.add(box(0.2, 0.12, 0.2, skin, 0, -0.38, 0)); // neck
  for (const side of [-1, 1]) {
    head.add(box(0.11, 0.12, 0.03, eyes, side * 0.13, -0.02, 0.27));
    head.add(box(0.15, 0.03, 0.03, dark, side * 0.13, 0.07, 0.275)); // brows
  }
  head.add(box(0.08, 0.015, 0.02, dark, 0, -0.22, 0.27)); // mouth

  // spiky hair: pyramids pointing outward from the top/back
  const spikes: Array<[number, number, number, number, number, number, number]> = [
    // x, y, z, rotX, rotZ, radius, length
    [0, 0.42, -0.05, -0.2, 0, 0.17, 0.6],
    [0.18, 0.38, -0.02, -0.1, -0.7, 0.15, 0.6],
    [-0.18, 0.38, -0.02, -0.1, 0.7, 0.15, 0.6],
    [0.3, 0.2, 0.0, 0, -1.25, 0.13, 0.55],
    [-0.3, 0.2, 0.0, 0, 1.25, 0.13, 0.55],
    [0.1, 0.34, -0.2, -0.9, -0.35, 0.15, 0.55],
    [-0.1, 0.34, -0.2, -0.9, 0.35, 0.15, 0.55],
    [0, 0.2, -0.32, -1.5, 0, 0.17, 0.5],
    [0.24, 0.12, -0.26, -1.3, -0.8, 0.13, 0.45],
    [-0.24, 0.12, -0.26, -1.3, 0.8, 0.13, 0.45],
    // bangs falling over the forehead
    [0.12, 0.18, 0.3, 2.3, -0.3, 0.1, 0.4],
    [-0.14, 0.2, 0.3, 2.4, 0.35, 0.1, 0.38],
    [0.0, 0.22, 0.31, 2.6, 0, 0.09, 0.36],
    [0.29, 0.02, 0.22, 2.2, -0.6, 0.08, 0.36],
    [-0.29, 0.02, 0.22, 2.2, 0.6, 0.08, 0.36],
  ];
  head.add(box(0.64, 0.22, 0.58, hair, 0, 0.26, -0.01)); // hair cap
  for (const [x, y, z, rx, rz, r, len] of spikes) {
    const s = new THREE.Mesh(new THREE.ConeGeometry(r, len, 4), hair);
    s.position.set(x, y, z);
    s.rotation.set(rx, 0, rz);
    s.translateY(len * 0.35);
    s.castShadow = true;
    head.add(s);
  }

  // ---- right arm + buster sword on a swing pivot at the right shoulder
  const swingRig = new THREE.Group();
  swingRig.position.set(0, 1.32, 0.36);
  body.add(swingRig);
  const arm = new THREE.Group();
  swingRig.add(arm);
  const rUpper = prism(0.08, 0.07, 0.3, skin, 6);
  rUpper.rotation.z = Math.PI / 2;
  rUpper.position.x = 0.15;
  const rFore = prism(0.07, 0.06, 0.26, skin, 6);
  rFore.rotation.z = Math.PI / 2;
  rFore.position.x = 0.42;
  const rGlove = glove(dark, leather, metalDark, 0);
  rGlove.rotation.z = Math.PI / 2;
  rGlove.position.x = 0.6;
  const shoulder = box(0.2, 0.2, 0.2, skin, 0, 0, 0);
  arm.add(shoulder, rUpper, rFore, rGlove);

  const sword = new THREE.Group();
  sword.position.x = 0.62;
  arm.add(sword);
  const handle = prism(0.035, 0.035, 0.28, dark, 6);
  handle.rotation.z = Math.PI / 2;
  const guard = box(0.06, 0.08, 0.26, metalDark, 0.16, 0, 0);
  const bladeMaterial = mat(C.blade, {
    metalness: 0.7,
    roughness: 0.3,
    emissive: C.bladeEmissive,
    emissiveIntensity: 0.15,
  });
  const bladeLen = 1.45;
  const blade = box(bladeLen, 0.05, 0.24, bladeMaterial, 0.19 + bladeLen / 2, 0, 0);
  const edge = box(bladeLen, 0.03, 0.05, metal, 0.19 + bladeLen / 2, 0, 0.13);
  const tipWedge = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.25, 4), bladeMaterial);
  tipWedge.rotation.set(Math.PI / 4, 0, -Math.PI / 2);
  tipWedge.scale.set(1, 1, 0.3);
  tipWedge.position.x = 0.19 + bladeLen + 0.1;
  const pommel = box(0.06, 0.06, 0.06, metal, -0.16, 0, 0);
  sword.add(handle, guard, blade, edge, tipWedge, pommel);
  const bladeBase = new THREE.Object3D();
  bladeBase.position.x = 0.3;
  const bladeTip = new THREE.Object3D();
  bladeTip.position.x = 0.19 + bladeLen + 0.15;
  sword.add(bladeBase, bladeTip);

  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });

  return {
    root,
    body,
    swingRig,
    leftArm,
    legs: [legs[0]!, legs[1]!],
    head,
    bladeBase,
    bladeTip,
    blade,
    bladeMaterial,
    materials: [...mats],
  };
}

/** FF7-style stacked-ring glove, centered at y. */
function glove(
  dark: THREE.Material,
  leather: THREE.Material,
  metal: THREE.Material,
  y: number,
): THREE.Group {
  const g = new THREE.Group();
  g.position.y = y;
  const ring = [dark, leather, dark, metal];
  ring.forEach((m, i) => g.add(box(0.24 - i * 0.005, 0.055, 0.24, m, 0, 0.07 - i * 0.055, 0)));
  g.add(box(0.2, 0.08, 0.2, dark, 0, -0.16, 0.02)); // fist
  return g;
}
