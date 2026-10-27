import type * as THREE from 'three';
import { hexA } from '../../render/icons';
import { punchEnvelope } from './timing';

interface Punch {
  at: number;
  strength: number;
  color: string;
}

/**
 * On-beat hit juice shared by the audio-first experiments: a camera kick (dolly in, FOV
 * squeeze, small dip) and an edge flash in the action's colour, both timed to game time `at`
 * (the beat the note sounds on, not the key press). Apply after the arena has posed the camera.
 */
export class Juice {
  private punches: Punch[] = [];

  punch(at: number, strength: number, color: string): void {
    this.punches.push({ at, strength, color });
    if (this.punches.length > 12) this.punches.shift();
  }

  private level(t: number): { k: number; color: string } {
    let k = 0;
    let color = '#ffffff';
    for (const p of this.punches) {
      const v = punchEnvelope(t - p.at) * p.strength;
      if (v > k) {
        k = v;
        color = p.color;
      }
    }
    return { k, color };
  }

  apply(camera: THREE.PerspectiveCamera, t: number): void {
    this.punches = this.punches.filter((p) => t - p.at < 0.6);
    const { k } = this.level(t);
    if (k <= 0.001) return;
    camera.position.z -= 0.32 * k;
    camera.position.y -= 0.06 * k;
    camera.fov -= 2.6 * k;
    camera.updateProjectionMatrix();
  }

  drawFlash(c: CanvasRenderingContext2D, t: number, w: number, h: number): void {
    const { k, color } = this.level(t);
    if (k <= 0.01) return;
    const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, w * 0.75);
    g.addColorStop(0, hexA(color, 0));
    g.addColorStop(1, hexA(color, 0.28 * k));
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  }
}
