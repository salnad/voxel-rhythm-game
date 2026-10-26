import * as THREE from 'three';
import type { Chart } from '../chart/build';
import { ACTIONS, type Action } from '../chart/types';
import { ACTION_SPECS } from '../config/actions';
import { ARENA } from '../config/visuals';
import type { GameSession } from '../game/session';
import { drawActionIcon, hexA } from './icons';

const DEG = Math.PI / 180;
export const COMBO_COLOR = '#ffd23b';
export const RETRY_COLOR = '#ff3b5c';

function canvasTexture(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  draw(cv.getContext('2d')!);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function roundRect(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
}

function cueTexture(action: Action): THREE.CanvasTexture {
  const color = ACTION_SPECS[action].color;
  return canvasTexture(256, 128, (c) => {
    c.shadowColor = color;
    c.shadowBlur = 14;
    c.fillStyle = color;
    roundRect(c, 10, 10, 236, 108, 22);
    c.fill();
    c.shadowBlur = 0;
    c.strokeStyle = '#ffffff';
    c.lineWidth = 6;
    roundRect(c, 13, 13, 230, 102, 20);
    c.stroke();
    drawActionIcon(c, action, 128, 64, 40, '#04140a');
  });
}

function receptorTexture(action: Action): THREE.CanvasTexture {
  const color = ACTION_SPECS[action].color;
  return canvasTexture(256, 128, (c) => {
    c.fillStyle = hexA(color, 0.16);
    roundRect(c, 10, 10, 236, 108, 22);
    c.fill();
    c.strokeStyle = color;
    c.lineWidth = 8;
    roundRect(c, 12, 12, 232, 104, 20);
    c.stroke();
    drawActionIcon(c, action, 128, 64, 36, hexA(color, 0.75));
  });
}

/** Vertical fade: opaque at the near end (v=0), faint far away. */
function fadeTexture(): THREE.CanvasTexture {
  return canvasTexture(4, 256, (c) => {
    const g = c.createLinearGradient(0, 256, 0, 0);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.55, '#777777');
    g.addColorStop(1, '#111111');
    c.fillStyle = g;
    c.fillRect(0, 0, 4, 256);
  });
}

interface CueMesh {
  tile: THREE.Mesh;
  body: THREE.Mesh;
}

/**
 * The four action lanes as a translucent highway in the arena: they run from far away,
 * through the enemy, into a hit line just in front of the hero. Cues move toward the camera
 * at constant speed, so the hit line, approach time and scroll direction read like a
 * classic highway. Cues and receptors draw over the fighters so they're never hidden.
 */
export class Highway3D {
  readonly group = new THREE.Group();
  readonly hitZ = -ARENA.hitDistance;
  private readonly cueMats: THREE.MeshBasicMaterial[];
  private readonly bodyMats: THREE.MeshBasicMaterial[];
  private readonly receptors: THREE.Mesh[] = [];
  private readonly laneFloors: THREE.MeshBasicMaterial[] = [];
  private readonly beatLines: THREE.Mesh[] = [];
  private readonly pools: CueMesh[][] = [];
  private readonly hitLine: THREE.Mesh;
  private readonly rails: THREE.Mesh[] = [];
  private readonly railMats: THREE.MeshBasicMaterial[] = [];
  private readonly tilt = ARENA.cueTiltDeg * DEG;

  constructor(
    scene: THREE.Scene,
    private readonly chart: Chart,
  ) {
    scene.add(this.group);
    const W = ARENA.laneWidth;
    const L = ARENA.highwayLength;
    const fade = fadeTexture();
    const total = W * ACTIONS.length;

    // dark base so the lanes read against the grid
    const base = new THREE.Mesh(
      new THREE.PlaneGeometry(total + 0.2, L + 0.6),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.55,
        alphaMap: fade,
        depthWrite: false,
      }),
    );
    base.rotation.x = -Math.PI / 2;
    base.position.set(0, 0.008, this.hitZ - L / 2 + 0.3);
    this.group.add(base);

    ACTIONS.forEach((action, i) => {
      const color = ACTION_SPECS[action].color;
      const floorMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.1,
        alphaMap: fade,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      this.laneFloors.push(floorMat);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.94, L), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(this.laneX(i), 0.012, this.hitZ - L / 2);
      this.group.add(floor);

      const rec = new THREE.Mesh(
        new THREE.PlaneGeometry(W * 0.9, ARENA.cueDepth),
        new THREE.MeshBasicMaterial({
          map: receptorTexture(action),
          transparent: true,
          depthTest: false,
          depthWrite: false,
        }),
      );
      this.placeTile(rec, i, this.hitZ, 0.02);
      rec.renderOrder = 9;
      this.group.add(rec);
      this.receptors.push(rec);
    });

    // lane dividers
    for (let i = 0; i <= ACTIONS.length; i++) {
      const edge = i === 0 || i === ACTIONS.length;
      const line = new THREE.Mesh(
        new THREE.PlaneGeometry(edge ? 0.05 : 0.025, L),
        new THREE.MeshBasicMaterial({
          color: 0xc8ffd8,
          transparent: true,
          opacity: edge ? 0.55 : 0.25,
          alphaMap: fade,
          depthWrite: false,
        }),
      );
      line.rotation.x = -Math.PI / 2;
      line.position.set((i - ACTIONS.length / 2) * W, 0.016, this.hitZ - L / 2);
      this.group.add(line);
    }

    this.hitLine = new THREE.Mesh(
      new THREE.PlaneGeometry(total + 0.4, 0.07),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.hitLine.rotation.x = -Math.PI / 2;
    this.hitLine.position.set(0, 0.03, this.hitZ + ARENA.cueDepth * 0.5 * Math.cos(this.tilt));
    this.hitLine.renderOrder = 9;
    this.group.add(this.hitLine);

    const beatGeo = new THREE.PlaneGeometry(total, 1);
    for (let i = 0; i < 48; i++) {
      const m = new THREE.Mesh(
        beatGeo,
        new THREE.MeshBasicMaterial({
          color: 0xc8ffd8,
          transparent: true,
          opacity: 0.1,
          depthWrite: false,
        }),
      );
      m.rotation.x = -Math.PI / 2;
      m.visible = false;
      this.group.add(m);
      this.beatLines.push(m);
    }

    this.cueMats = ACTIONS.map(
      (a) =>
        new THREE.MeshBasicMaterial({
          map: cueTexture(a),
          transparent: true,
          depthTest: false,
          depthWrite: false,
        }),
    );
    this.bodyMats = ACTIONS.map(
      (a) =>
        new THREE.MeshBasicMaterial({
          color: ACTION_SPECS[a].color,
          transparent: true,
          opacity: 0.45,
          depthTest: false,
          depthWrite: false,
        }),
    );
    for (let i = 0; i < ACTIONS.length; i++) this.pools.push([]);

    // combo measure rails along both highway edges
    const railGeo = new THREE.PlaneGeometry(0.16, 1);
    for (let i = 0; i < 8; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: COMBO_COLOR,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      });
      const m = new THREE.Mesh(railGeo, mat);
      m.rotation.x = -Math.PI / 2;
      m.renderOrder = 8;
      m.visible = false;
      this.group.add(m);
      this.rails.push(m);
      this.railMats.push(mat);
    }
  }

  laneX(i: number): number {
    return (i - (ACTIONS.length - 1) / 2) * ARENA.laneWidth;
  }

  /** World point at the centre of a lane's receptor. */
  receptorPoint(i: number): THREE.Vector3 {
    return new THREE.Vector3(this.laneX(i), 0.1, this.hitZ);
  }

  /** z of a cue that lands at noteTime, at song time t. */
  cueZ(noteTime: number, t: number, approach: number): number {
    return this.hitZ - ((noteTime - t) / approach) * ARENA.highwayLength;
  }

  private placeTile(m: THREE.Object3D, lane: number, z: number, lift: number): void {
    m.rotation.set(-Math.PI / 2 + this.tilt, 0, 0);
    const half = ARENA.cueDepth / 2;
    m.position.set(this.laneX(lane), lift + Math.sin(this.tilt) * half, z);
  }

  private cueMesh(lane: number, idx: number): CueMesh {
    const pool = this.pools[lane]!;
    let c = pool[idx];
    if (!c) {
      const tile = new THREE.Mesh(
        new THREE.PlaneGeometry(ARENA.laneWidth * 0.86, ARENA.cueDepth),
        this.cueMats[lane]!.clone(),
      );
      tile.renderOrder = 11;
      const body = new THREE.Mesh(
        new THREE.PlaneGeometry(ARENA.laneWidth * 0.36, 1),
        this.bodyMats[lane]!,
      );
      body.rotation.x = -Math.PI / 2;
      body.renderOrder = 10;
      this.group.add(tile, body);
      c = { tile, body };
      pool.push(c);
    }
    return c;
  }

  update(
    t: number,
    approach: number,
    session: GameSession,
    held: readonly boolean[],
    pressAt: readonly number[],
    hitAt: readonly number[],
    dropped: ReadonlyMap<number, number>,
  ): void {
    const L = ARENA.highwayLength;
    const judge = session.judge;
    const bpb = this.chart.beatsPerBar;
    // beat lines and combo rails, from the measure plan (retries included)
    let bi = 0;
    let ri = 0;
    for (const p of session.conductor.plays) {
      if (p.start > t + approach) break;
      if (p.start + p.dur < t - 0.1) continue;
      for (let b = 0; b < bpb && bi < this.beatLines.length; b++) {
        const bt = p.start + (p.dur * b) / bpb;
        if (bt < t - 0.05 || bt > t + approach) continue;
        const z = this.cueZ(bt, t, approach) + ARENA.cueDepth * 0.5;
        const m = this.beatLines[bi++]!;
        m.visible = true;
        m.position.set(0, 0.014, z);
        m.scale.y = b === 0 ? 0.06 : 0.03;
        const far = (this.hitZ - z) / L;
        (m.material as THREE.MeshBasicMaterial).opacity = (b === 0 ? 0.32 : 0.12) * (1 - far * 0.7);
      }
      if (p.combo && ri + 1 < this.rails.length) {
        const z0 = Math.min(
          this.hitZ + 0.6,
          this.cueZ(p.start, t, approach) + ARENA.cueDepth * 0.5,
        );
        const z1 = Math.max(
          this.hitZ - L,
          this.cueZ(p.start + p.dur, t, approach) + ARENA.cueDepth * 0.5,
        );
        if (z0 > z1) {
          const failed = p.status === 'failed';
          const color = p.attempt > 1 || failed ? RETRY_COLOR : COMBO_COLOR;
          for (const side of [-1, 1]) {
            const r = this.rails[ri]!;
            const mat = this.railMats[ri++]!;
            r.visible = true;
            r.position.set(side * (ARENA.laneWidth * 2 + 0.12), 0.02, (z0 + z1) / 2);
            r.scale.y = z0 - z1 - 0.06;
            mat.color.set(color);
            mat.opacity = failed ? 0.35 + 0.35 * Math.sin(t * 40) : 0.8;
          }
        }
      }
    }
    for (; bi < this.beatLines.length; bi++) this.beatLines[bi]!.visible = false;
    for (; ri < this.rails.length; ri++) this.rails[ri]!.visible = false;

    // receptors + lane floors react to presses and hits
    this.receptors.forEach((r, i) => {
      const sinceHit = t - hitAt[i]!;
      const sincePress = t - pressAt[i]!;
      const hitK = sinceHit >= 0 && sinceHit < 0.18 ? 1 - sinceHit / 0.18 : 0;
      const pressK = held[i] ? 1 : sincePress >= 0 && sincePress < 0.12 ? 1 - sincePress / 0.12 : 0;
      r.scale.setScalar(1 + hitK * 0.18 + pressK * 0.06);
      (r.material as THREE.MeshBasicMaterial).opacity = 0.75 + 0.25 * Math.max(hitK, pressK);
      this.laneFloors[i]!.opacity = 0.09 + pressK * 0.12 + hitK * 0.25;
    });

    // cues (voided ones flash red and fall away for a moment)
    const used = new Array<number>(ACTIONS.length).fill(0);
    for (const n of session.conductor.cues) {
      if (n.removed || n.time > t + approach + 0.05) continue;
      if ((n.endTime ?? n.time) < t - 0.3) continue;
      const pending = judge.isPending(n.id);
      const holding = judge.isHolding(n.id);
      const droppedAt = judge.isVoid(n.id) ? dropped.get(n.id) : undefined;
      const voidAge = droppedAt === undefined ? Infinity : t - droppedAt;
      if (!pending && !holding && !(voidAge < 0.3)) continue;
      const c = this.cueMesh(n.lane, used[n.lane]!++);
      const headZ = holding ? this.hitZ : this.cueZ(n.time, t, approach);
      const far = (this.hitZ - headZ) / L;
      const fadeIn = Math.min(1, (1 - far) / 0.12);
      const late = pending && t > n.time;
      c.tile.visible = true;
      this.placeTile(c.tile, n.lane, headZ, 0.03 + (voidAge < 0.3 ? voidAge * 1.5 : 0));
      const mat = c.tile.material as THREE.MeshBasicMaterial;
      mat.opacity =
        Math.max(0, fadeIn) * (late ? 0.45 : 1) * (voidAge < 0.3 ? 1 - voidAge / 0.3 : 1);
      mat.color.set(voidAge < 0.3 ? RETRY_COLOR : '#ffffff');
      if (n.endTime !== null && voidAge === Infinity) {
        const tailZ = Math.max(this.hitZ - L, this.cueZ(n.endTime, t, approach));
        const len = Math.max(0.01, headZ - tailZ);
        c.body.visible = true;
        c.body.position.set(this.laneX(n.lane), 0.025, (headZ + tailZ) / 2);
        c.body.scale.y = len;
      } else {
        c.body.visible = false;
      }
    }
    this.pools.forEach((pool, lane) => {
      for (let i = used[lane]!; i < pool.length; i++) {
        pool[i]!.tile.visible = false;
        pool[i]!.body.visible = false;
      }
    });

    const beat = session.conductor.beatAt(t);
    (this.hitLine.material as THREE.MeshBasicMaterial).opacity =
      0.7 + 0.3 * Math.pow(1 - (beat - Math.floor(beat)), 3);
  }
}
