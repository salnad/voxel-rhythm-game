import * as THREE from 'three';
import { PALETTE, TRAIL } from '../config/visuals';

/** Fading ribbon between a blade's base and tip. */
export class Trail {
  readonly mesh: THREE.Mesh;
  private readonly samples: Array<{ b: THREE.Vector3; t: THREE.Vector3; at: number }> = [];
  private readonly pos: Float32Array;
  private readonly col: Float32Array;
  private readonly geo: THREE.BufferGeometry;
  private readonly color = new THREE.Color();
  stepped = 0;
  alpha = 1;
  busy = false;

  constructor(scene: THREE.Scene) {
    const n = TRAIL.maxSamples;
    this.pos = new Float32Array(n * 2 * 3);
    this.col = new Float32Array(n * 2 * 4);
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 4));
    const idx: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    this.geo.setIndex(idx);
    this.mesh = new THREE.Mesh(
      this.geo,
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  setColor(css: string, hueShift = 0, light = 0.6): void {
    this.color.set(css);
    const hsl = { h: 0, s: 0, l: 0 };
    this.color.getHSL(hsl);
    this.color.setHSL((hsl.h + hueShift / 360 + 1) % 1, 1, light);
  }

  /** Add a sample. `stepped` is the jitter amplitude in world units. Samples must arrive in time order. */
  push(b: THREE.Vector3, t: THREE.Vector3, at: number): void {
    const last = this.samples[this.samples.length - 1];
    if (last && at < last.at) return;
    const j = this.stepped;
    const jit = () => (Math.random() - 0.5) * j;
    this.samples.push({
      b: b.clone().add(new THREE.Vector3(jit(), jit(), jit())),
      t: t.clone().add(new THREE.Vector3(jit(), jit(), jit())),
      at,
    });
    if (this.samples.length > TRAIL.maxSamples) this.samples.shift();
  }

  update(now: number): void {
    while (this.samples.length && now - this.samples[0]!.at > TRAIL.lifetime) this.samples.shift();
    const s = this.samples;
    for (let i = 0; i < s.length; i++) {
      const { b, t, at } = s[i]!;
      const life = Math.max(0, 1 - (now - at) / TRAIL.lifetime);
      const k = life * life * TRAIL.opacity * this.alpha;
      this.pos.set([b.x, b.y, b.z, t.x, t.y, t.z], i * 6);
      const { r, g, b: bl } = this.color;
      this.col.set([r, g, bl, 0, r, g, bl, k], i * 8);
    }
    this.geo.setDrawRange(0, Math.max(0, (s.length - 1) * 6));
    this.geo.attributes.position!.needsUpdate = true;
    this.geo.attributes.color!.needsUpdate = true;
    if (!s.length) this.busy = false;
  }
}

/** Instanced voxel debris and sparks. */
export class Voxels {
  readonly mesh: THREE.InstancedMesh;
  private readonly p: THREE.Vector3[] = [];
  private readonly v: THREE.Vector3[] = [];
  private readonly life: number[] = [];
  private readonly size: number[] = [];
  private next = 0;
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly s = new THREE.Vector3();

  constructor(
    scene: THREE.Scene,
    private readonly max = 900,
  ) {
    this.mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.11, 0.11, 0.11),
      new THREE.MeshBasicMaterial(),
      max,
    );
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
    for (let i = 0; i < max; i++) {
      this.p.push(new THREE.Vector3());
      this.v.push(new THREE.Vector3());
      this.life.push(0);
      this.size.push(1);
      this.mesh.setColorAt(i, new THREE.Color(0));
    }
    scene.add(this.mesh);
  }

  /** Burst from a point. `dir` biases the spray (e.g. away from the hero). */
  burst(
    at: THREE.Vector3,
    color: string,
    count: number,
    speed: number,
    dir = new THREE.Vector3(0, 0, -1),
    size = 1,
  ): void {
    const c = new THREE.Color(color);
    for (let k = 0; k < count; k++) {
      const i = this.next;
      this.next = (this.next + 1) % this.max;
      this.p[i]!.copy(at);
      this.v[i]!.set(
        (Math.random() - 0.5) * speed + dir.x * speed * 0.6,
        Math.random() * speed * 0.9 + 1 + dir.y * speed * 0.6,
        (Math.random() - 0.5) * speed + dir.z * speed * 0.6,
      );
      this.life[i] = 0.4 + Math.random() * 0.5;
      this.size[i] = size * (0.6 + Math.random() * 0.8);
      this.mesh.setColorAt(i, Math.random() < 0.2 ? new THREE.Color(PALETTE.white) : c);
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  update(dt: number): void {
    for (let i = 0; i < this.max; i++) {
      let l = this.life[i]!;
      if (l <= 0) {
        this.s.setScalar(0);
      } else {
        l -= dt;
        this.life[i] = l;
        const v = this.v[i]!;
        v.y -= 14 * dt;
        this.p[i]!.addScaledVector(v, dt);
        if (this.p[i]!.y < 0.05) {
          this.p[i]!.y = 0.05;
          v.y *= -0.3;
          v.x *= 0.7;
          v.z *= 0.7;
        }
        this.s.setScalar(Math.max(0, Math.min(1, l * 2)) * this.size[i]!);
      }
      this.m.compose(this.p[i]!, this.q, this.s);
      this.mesh.setMatrixAt(i, this.m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

/** Expanding flat rings (block impacts, receptor hits). */
export class Rings {
  private readonly pool: Array<{ mesh: THREE.Mesh; age: number; life: number; grow: number }> = [];

  constructor(scene: THREE.Scene, count = 16) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(
        new THREE.RingGeometry(0.42, 0.5, 32),
        new THREE.MeshBasicMaterial({
          transparent: true,
          depthWrite: false,
          depthTest: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        }),
      );
      mesh.visible = false;
      mesh.renderOrder = 12;
      scene.add(mesh);
      this.pool.push({ mesh, age: 0, life: 1, grow: 1 });
    }
  }

  spawn(at: THREE.Vector3, color: string, normal: THREE.Vector3, life = 0.3, grow = 2.5): void {
    const r = this.pool.find((x) => !x.mesh.visible) ?? this.pool[0]!;
    r.mesh.position.copy(at);
    r.mesh.lookAt(at.clone().add(normal));
    (r.mesh.material as THREE.MeshBasicMaterial).color.set(color);
    r.mesh.visible = true;
    r.age = 0;
    r.life = life;
    r.grow = grow;
  }

  update(dt: number): void {
    for (const r of this.pool) {
      if (!r.mesh.visible) continue;
      r.age += dt;
      const k = r.age / r.life;
      if (k >= 1) {
        r.mesh.visible = false;
        continue;
      }
      r.mesh.scale.setScalar(1 + k * r.grow);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - k;
    }
  }
}
