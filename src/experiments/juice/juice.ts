import * as THREE from 'three';
import { ARENA } from '../../config/visuals';
import type { ArenaView } from '../../render/arenaView';
import { Voxels } from '../../render/effects';

const UP = new THREE.Vector3(0, 1, 0);

interface Flash {
  color: string;
  at: number;
  strength: number;
  life: number;
}

interface Pop {
  text: string;
  pos: THREE.Vector3;
  color: string;
  at: number;
  size: number;
  life: number;
}

interface RingFx {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  age: number;
  life: number;
  grow: number;
}

/**
 * Hit juice shared by the experiments: voxel sparks, impact rings, camera punch and shake,
 * full-screen flashes, 2D popups anchored to world points, an enemy flinch and a hero
 * squash. Everything is offset per frame on top of the arena's own pose (never accumulated),
 * and `dispose()` removes it all.
 */
export class Juice {
  private readonly voxels: Voxels;
  private readonly rings: RingFx[] = [];
  private readonly ringGeo = new THREE.RingGeometry(0.42, 0.5, 40);
  private punchAmt = 0;
  private shakeAmt = 0;
  private flinchAmt = 0;
  private squashAmt = 0;
  private stretchAmt = 0;
  private flashes: Flash[] = [];
  private pops: Pop[] = [];
  private now = 0;
  private readonly heroScale: THREE.Vector3;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.PerspectiveCamera,
    private readonly arena: ArenaView,
  ) {
    this.voxels = new Voxels(scene, 500);
    this.heroScale = arena.heroRig.root.scale.clone();
    for (let i = 0; i < 12; i++) {
      const mat = new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(this.ringGeo, mat);
      mesh.visible = false;
      mesh.renderOrder = 13;
      scene.add(mesh);
      this.rings.push({ mesh, mat, age: 0, life: 1, grow: 1 });
    }
  }

  /** Where blade meets enemy: between the fighters, at chest height. */
  clashPoint(): THREE.Vector3 {
    return new THREE.Vector3(0.1, 1.5, (ARENA.heroZ - ARENA.duelDistance) / 2);
  }

  /** The enemy's chest (or where it would stand). */
  enemyChest(): THREE.Vector3 {
    const rig = this.arena.enemyRig();
    const z = rig ? rig.root.position.z : -ARENA.duelDistance;
    const s = rig ? rig.root.scale.y : 1;
    return new THREE.Vector3(0, 1.3 * Math.max(0.6, s), z + 0.35);
  }

  bladeTip(): THREE.Vector3 {
    return this.arena.heroRig.bladeTip.getWorldPosition(new THREE.Vector3());
  }

  sparks(at: THREE.Vector3, color: string, count: number, speed = 4, dir = UP, size = 1): void {
    this.voxels.burst(at, color, count, speed, dir, size);
  }

  ring(at: THREE.Vector3, color: string, normal: THREE.Vector3, life = 0.3, grow = 2.5): void {
    const r = this.rings.find((x) => !x.mesh.visible) ?? this.rings[0]!;
    r.mesh.position.copy(at);
    r.mesh.lookAt(at.clone().add(normal));
    r.mat.color.set(color);
    r.mat.opacity = 1;
    r.mesh.scale.setScalar(1);
    r.mesh.visible = true;
    r.age = 0;
    r.life = life;
    r.grow = grow;
  }

  punch(amount: number): void {
    this.punchAmt = Math.max(this.punchAmt, amount);
  }

  shake(amount: number): void {
    this.shakeAmt = Math.max(this.shakeAmt, amount);
  }

  flinchEnemy(amount: number): void {
    this.flinchAmt = Math.max(this.flinchAmt, amount);
  }

  /** Hero coils (squash) while a press waits for its beat; `stretch` springs it out on contact. */
  squashHero(amount: number): void {
    this.squashAmt = amount;
  }

  stretchHero(amount: number): void {
    this.stretchAmt = Math.max(this.stretchAmt, amount);
  }

  flash(color: string, strength = 0.25, life = 0.14): void {
    this.flashes.push({ color, at: this.now, strength, life });
  }

  pop(text: string, at: THREE.Vector3, color: string, size = 22, life = 0.6): void {
    this.pops.push({ text, pos: at.clone(), color, at: this.now, size, life });
    if (this.pops.length > 24) this.pops.shift();
  }

  /** Call from the runtime's update (after the arena posed the scene). */
  update(t: number, dt: number): void {
    this.now = t;
    this.voxels.update(dt);
    for (const r of this.rings) {
      if (!r.mesh.visible) continue;
      r.age += dt;
      const k = r.age / r.life;
      if (k >= 1) {
        r.mesh.visible = false;
        continue;
      }
      r.mesh.scale.setScalar(1 + k * r.grow);
      r.mat.opacity = 1 - k;
    }

    const cam = this.camera;
    if (this.punchAmt > 0.001 || this.shakeAmt > 0.001) {
      const p = this.punchAmt;
      const s = this.shakeAmt;
      cam.position.z -= p * 0.45;
      cam.position.y -= p * 0.12;
      cam.position.x += (Math.random() - 0.5) * s;
      cam.position.y += (Math.random() - 0.5) * s;
      cam.fov -= p * 2.4;
      cam.updateProjectionMatrix();
    }
    this.punchAmt = Math.max(0, this.punchAmt - dt * 7 * Math.max(0.3, this.punchAmt));
    this.shakeAmt = Math.max(0, this.shakeAmt - dt * 1.2);

    const rig = this.arena.enemyRig();
    if (rig && this.flinchAmt > 0.001) {
      rig.root.position.z -= this.flinchAmt * 0.35;
      rig.torso.rotation.x -= this.flinchAmt * 0.5;
    }
    this.flinchAmt = Math.max(0, this.flinchAmt - dt * 6);

    const sq = this.squashAmt - this.stretchAmt;
    this.arena.heroRig.root.scale.set(
      this.heroScale.x * (1 + sq * 0.07),
      this.heroScale.y * (1 - sq * 0.1),
      this.heroScale.z * (1 + sq * 0.07),
    );
    this.stretchAmt = Math.max(0, this.stretchAmt - dt * 5);
  }

  /** Call from the runtime's drawHud. */
  draw(ctx: CanvasRenderingContext2D, t: number, w: number, h: number): void {
    this.flashes = this.flashes.filter((f) => t - f.at < f.life);
    for (const f of this.flashes) {
      const k = 1 - (t - f.at) / f.life;
      if (k <= 0 || k > 1.0001) continue;
      ctx.globalAlpha = f.strength * k * k;
      ctx.fillStyle = f.color;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalAlpha = 1;
    this.pops = this.pops.filter((p) => t - p.at < p.life);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of this.pops) {
      const age = t - p.at;
      if (age < 0) continue;
      const k = age / p.life;
      const s = this.arena.toScreen(p.pos);
      const scale = age < 0.06 ? 1.5 - (age / 0.06) * 0.5 : 1;
      ctx.globalAlpha = Math.min(1, (1 - k) * 2.2);
      ctx.font = `bold ${Math.round(p.size * scale)}px monospace`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      ctx.strokeText(p.text, s.x, s.y - k * 34);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, s.x, s.y - k * 34);
    }
    ctx.globalAlpha = 1;
  }

  dispose(): void {
    this.scene.remove(this.voxels.mesh);
    this.voxels.mesh.geometry.dispose();
    (this.voxels.mesh.material as THREE.Material).dispose();
    this.voxels.mesh.dispose();
    for (const r of this.rings) {
      this.scene.remove(r.mesh);
      r.mat.dispose();
    }
    this.ringGeo.dispose();
    this.arena.heroRig.root.scale.copy(this.heroScale);
  }
}
