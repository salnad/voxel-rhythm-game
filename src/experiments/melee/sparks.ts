import * as THREE from 'three';

/** Additive streak sparks (metal on metal): each spark is a short line along its velocity. */
export class Sparks {
  readonly mesh: THREE.LineSegments;
  private readonly pos: Float32Array;
  private readonly col: Float32Array;
  private readonly p: THREE.Vector3[] = [];
  private readonly v: THREE.Vector3[] = [];
  private readonly c: THREE.Color[] = [];
  private readonly life: Float32Array;
  private readonly maxLife: Float32Array;
  private next = 0;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly max = 320,
  ) {
    this.pos = new Float32Array(max * 6);
    this.col = new Float32Array(max * 6);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    for (let i = 0; i < max; i++) {
      this.p.push(new THREE.Vector3());
      this.v.push(new THREE.Vector3());
      this.c.push(new THREE.Color());
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.mesh = new THREE.LineSegments(
      geo,
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      }),
    );
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 14;
    scene.add(this.mesh);
  }

  /** Spray `count` sparks from `at`, biased along `dir` (unit-ish), at `speed` world units/s. */
  burst(at: THREE.Vector3, color: string, count: number, speed: number, dir: THREE.Vector3) {
    const base = new THREE.Color(color);
    const white = new THREE.Color('#ffffff');
    for (let k = 0; k < count; k++) {
      const i = this.next;
      this.next = (this.next + 1) % this.max;
      this.p[i]!.copy(at);
      const s = speed * (0.45 + Math.random() * 0.75);
      this.v[i]!.set(Math.random() - 0.5, Math.random() - 0.35, Math.random() - 0.5)
        .normalize()
        .multiplyScalar(0.8)
        .add(dir)
        .normalize()
        .multiplyScalar(s);
      const l = 0.18 + Math.random() * 0.3;
      this.life[i] = l;
      this.maxLife[i] = l;
      this.c[i]!.copy(base).lerp(white, Math.random() * 0.7);
    }
  }

  update(dt: number): void {
    const { pos, col } = this;
    for (let i = 0; i < this.max; i++) {
      let l = this.life[i]!;
      const o = i * 6;
      if (l <= 0) {
        pos.fill(0, o, o + 6);
        col.fill(0, o, o + 6);
        continue;
      }
      l -= dt;
      this.life[i] = l;
      const v = this.v[i]!;
      const p = this.p[i]!;
      v.y -= 9 * dt;
      v.multiplyScalar(Math.max(0, 1 - 2.5 * dt));
      p.addScaledVector(v, dt);
      const k = Math.max(0, l / this.maxLife[i]!);
      const tail = 0.035 + 0.02 * k;
      pos[o] = p.x;
      pos[o + 1] = p.y;
      pos[o + 2] = p.z;
      pos[o + 3] = p.x - v.x * tail;
      pos[o + 4] = p.y - v.y * tail;
      pos[o + 5] = p.z - v.z * tail;
      const c = this.c[i]!;
      col[o] = c.r * k;
      col[o + 1] = c.g * k;
      col[o + 2] = c.b * k;
      col[o + 3] = c.r * k * 0.3;
      col[o + 4] = c.g * k * 0.3;
      col[o + 5] = c.b * k * 0.3;
    }
    this.mesh.geometry.attributes.position!.needsUpdate = true;
    this.mesh.geometry.attributes.color!.needsUpdate = true;
  }

  dispose(): void {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

/** A four-point star with a soft core, white (tint with the sprite colour). */
export function starTexture(): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const c = cv.getContext('2d')!;
  const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.08)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 128, 128);
  c.fillStyle = 'rgba(255,255,255,0.95)';
  for (const [w, h] of [
    [64, 5],
    [5, 64],
  ] as const) {
    c.beginPath();
    c.moveTo(64 - w, 64);
    c.quadraticCurveTo(64, 64, 64, 64 - h);
    c.quadraticCurveTo(64, 64, 64 + w, 64);
    c.quadraticCurveTo(64, 64, 64, 64 + h);
    c.quadraticCurveTo(64, 64, 64 - w, 64);
    c.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** One additive glint sprite that the caller drives each frame. */
export class Glint {
  readonly sprite: THREE.Sprite;
  private readonly mat: THREE.SpriteMaterial;

  constructor(
    private readonly parent: THREE.Object3D,
    tex: THREE.Texture,
  ) {
    this.mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.sprite = new THREE.Sprite(this.mat);
    this.sprite.renderOrder = 15;
    this.sprite.visible = false;
    parent.add(this.sprite);
  }

  /** Show at world position `at` with brightness k (0 hides) and size in world units. */
  set(at: THREE.Vector3, color: string, k: number, size: number, spin = 0): void {
    this.sprite.visible = k > 0.01;
    if (!this.sprite.visible) return;
    this.sprite.position.copy(at);
    this.mat.color.set(color).multiplyScalar(Math.min(2, 0.6 + k));
    this.mat.opacity = Math.min(1, k);
    this.mat.rotation = spin;
    this.sprite.scale.setScalar(size);
  }

  dispose(): void {
    this.parent.remove(this.sprite);
    this.mat.dispose();
  }
}
