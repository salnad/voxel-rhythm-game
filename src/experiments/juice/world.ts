import * as THREE from 'three';
import { ARENA } from '../../config/visuals';
import { hexA } from '../../render/icons';
import type { ExperimentContext } from '../types';
import { beatApproach, beatPulse, crossedBeat } from './beat';

export interface BeatWorldOptions {
  /** Floor grid brightens on each beat. */
  grid?: boolean;
  /** A ring around the hero closes on every beat and bursts on it. */
  heroRing?: boolean;
  /** Enemy thump on the beat (scale amount). */
  enemyBob?: number;
  /** Rain pulse per beat (downbeats double). */
  rain?: number;
  /** Camera FOV bump per beat (degrees; downbeats double). */
  camera?: number;
  /** Screen-edge glow per beat (0..1 alpha). */
  frame?: number;
}

/**
 * Makes the whole arena pulse on the beat: floor grid, a beat ring around the hero, the
 * enemy, the background rain, the camera and the screen frame. `intensity` scales it all and
 * `color` tints it (freestyle drives both from FURY).
 */
export class BeatWorld {
  intensity = 1;
  color = '#39ff6a';
  private readonly grid: THREE.GridHelper | null;
  private readonly gridOpacity: number;
  private readonly group = new THREE.Group();
  private readonly baseRing: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  private readonly closeRing: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  private readonly burstRing: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  private lastBeat = -Infinity;
  private beat = 0;
  private pulse = 0;
  private downbeat = false;

  constructor(
    private readonly ctx: ExperimentContext,
    private readonly opts: BeatWorldOptions,
  ) {
    const found = ctx.scene.children.find(
      (o): o is THREE.GridHelper => o instanceof THREE.GridHelper,
    );
    this.grid = opts.grid ? (found ?? null) : null;
    const gm = this.grid?.material as THREE.LineBasicMaterial | undefined;
    this.gridOpacity = gm?.opacity ?? 0.35;

    const ring = (inner: number, outer: number, opacity: number) => {
      const m = new THREE.Mesh(
        new THREE.RingGeometry(inner, outer, 64),
        new THREE.MeshBasicMaterial({
          color: this.color,
          transparent: true,
          opacity,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        }),
      );
      m.rotation.x = -Math.PI / 2;
      this.group.add(m);
      return m;
    };
    this.baseRing = ring(0.86, 0.95, 0.3);
    this.closeRing = ring(0.94, 1.0, 0);
    this.burstRing = ring(0.9, 1.0, 0);
    this.group.position.set(0, 0.03, ARENA.heroZ);
    this.group.visible = opts.heroRing ?? false;
    ctx.scene.add(this.group);
  }

  /** Current beat (song beats) and the 0..1 on-beat pulse, after update(). */
  get state(): { beat: number; pulse: number; downbeat: boolean } {
    return { beat: this.beat, pulse: this.pulse, downbeat: this.downbeat };
  }

  update(t: number): void {
    const { session, arena, camera } = this.ctx;
    const beat = session.conductor.beatAt(t);
    this.beat = beat;
    const bpb = this.ctx.chart.beatsPerBar;
    const crossed = crossedBeat(this.lastBeat, beat);
    this.lastBeat = beat;
    const p = t < 0 && beat < 0 ? 0 : beatPulse(beat, 4);
    this.pulse = p;
    const barPos = ((Math.floor(beat) % bpb) + bpb) % bpb;
    this.downbeat = barPos === 0;
    const k = this.intensity;
    const down = this.downbeat ? 1.8 : 1;

    if (crossed !== null && this.opts.rain) this.ctx.rain.pulse(this.opts.rain * k * down);

    if (this.grid) {
      const m = this.grid.material as THREE.LineBasicMaterial;
      m.opacity = Math.min(1, this.gridOpacity * (1 + p * 1.6 * k * down));
      m.color.set(this.color).lerp(new THREE.Color(1, 1, 1), 0.35);
    }

    if (this.group.visible) {
      const col = this.color;
      this.baseRing.material.color.set(col);
      this.baseRing.material.opacity = 0.18 + 0.5 * p * k;
      const a = beatApproach(beat);
      this.closeRing.material.color.set(col);
      this.closeRing.scale.setScalar(1 + (1 - a) * 1.4);
      this.closeRing.material.opacity = 0.05 + 0.4 * a * a * Math.min(1, k);
      this.burstRing.material.color.set(col);
      this.burstRing.scale.setScalar(1 + (1 - p) * 1.8 * down);
      this.burstRing.material.opacity = 0.75 * p * k;
    }

    const rig = arena.enemyRig();
    if (rig && this.opts.enemyBob) {
      const b = this.opts.enemyBob * p * k * down;
      rig.root.scale.x *= 1 + b;
      rig.root.scale.z *= 1 + b;
      rig.root.scale.y *= 1 - b * 0.6;
    }

    if (this.opts.camera) {
      camera.fov -= this.opts.camera * p * k * down;
      camera.updateProjectionMatrix();
    }
  }

  /** Screen-edge glow on the beat (call from drawHud). */
  draw(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const f = this.opts.frame;
    if (!f) return;
    const a = Math.min(1, f * this.pulse * this.intensity * (this.downbeat ? 1.6 : 1));
    if (a < 0.01) return;
    const edge = Math.min(w, h) * 0.12;
    const col = hexA(this.color, a);
    const clear = hexA(this.color, 0);
    const sides: Array<[number, number, number, number, number, number, number, number]> = [
      [0, 0, 0, edge, 0, 0, w, edge],
      [0, h, 0, h - edge, 0, h - edge, w, edge],
      [0, 0, edge, 0, 0, 0, edge, h],
      [w, 0, w - edge, 0, w - edge, 0, edge, h],
    ];
    for (const [x0, y0, x1, y1, rx, ry, rw, rh] of sides) {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, col);
      g.addColorStop(1, clear);
      ctx.fillStyle = g;
      ctx.fillRect(rx, ry, rw, rh);
    }
  }

  dispose(): void {
    this.ctx.scene.remove(this.group);
    for (const m of [this.baseRing, this.closeRing, this.burstRing]) {
      m.geometry.dispose();
      m.material.dispose();
    }
    if (this.grid) {
      const m = this.grid.material as THREE.LineBasicMaterial;
      m.opacity = this.gridOpacity;
      m.color.set(0xffffff);
    }
  }
}
