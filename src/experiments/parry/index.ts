import * as THREE from 'three';
import type { Judgement } from '../../rhythm/judge';
import { ARENA, PALETTE } from '../../config/visuals';
import { ENEMIES } from '../../config/actions';
import { DUEL } from '../../config/gameplay';
import { keyLabel } from '../../core/settings';
import type { CameraView } from '../../render/arenaView';
import { Trail, Voxels } from '../../render/effects';
import { hexA } from '../../render/icons';
import { Glint, Sparks, starTexture } from '../melee/sparks';
import { OneShots } from '../melee/synth';
import type { Experiment, ExperimentContext, ExperimentRuntime } from '../types';
import {
  DIRECTIONS,
  LANE_DIRECTION,
  PARRY_ALT_KEYS,
  PARRY_KEYS,
  Posture,
  strikePhase,
  strikeTiming,
  warnProgress,
  type Direction,
} from './logic';
import {
  BROKEN,
  CONTACT,
  FOLLOW,
  IDLE_POSE,
  RECOIL,
  WINDUP,
  applyStrikePose,
  full,
  mixPose,
} from './poses';
import { clang, finisher, postureBreak, struck, swish } from './sounds';

/**
 * High and centred behind the hero (left and right must read symmetrically), long lens: the
 * whole enemy shows above the hero's head.
 */
export const PARRY_CAMERA: CameraView = {
  position: [0, 7.5, 8.5],
  lookAt: [0, 0.6, -2.4],
  fov: 30,
};

/** Where blades meet, in front of the hero's guard. */
const GUARD = new THREE.Vector3(0, 1.55, -0.9);
const CLASH: Record<Direction, THREE.Vector3> = {
  left: new THREE.Vector3(-1.0, 1.55, -0.9),
  right: new THREE.Vector3(1.0, 1.55, -0.9),
  high: new THREE.Vector3(0, 2.45, -0.9),
  low: new THREE.Vector3(0, 0.7, -0.9),
};
/** Canvas angle of each direction's guard quadrant (y down). */
const ANGLE: Record<Direction, number> = {
  right: 0,
  low: Math.PI / 2,
  left: Math.PI,
  high: -Math.PI / 2,
};
const ARC_HALF = 0.62;
const HIT_STOP = 0.05;
const SHATTER_DELAY = 0.17;
const RIPOSTE_DELAY = 0.06;

export const parry: Experiment = {
  key: 'parry',
  label: 'PARRY · DIRECTIONAL DEFLECTS',
  tagline: 'Every cue is a strike from a side: press that direction on the beat to deflect it.',
  hypothesis:
    'Direction is intuitive (no symbol-to-key memory), action and reaction happen in the same instant, and a crisp deflect (clang, sparks, hit-stop, blade snap) is the most satisfying rhythm-combat verb; a posture meter that ends in a finisher makes each enemy a little story.',
  inspiration: ['Sekiro (deflects, posture)', 'Punch-Out!! (dodges)', 'Beat Saber (directions)'],
  howTo: [
    'The enemy swings at you from a side. Press that side as its warning arc closes on the beat.',
    'A ←  ·  S ↓  ·  D ↑  ·  F →   (arrow keys work too)',
    'Clean deflects fill the enemy’s POSTURE bar; full posture turns its last blow into a DEATHBLOW.',
  ],
  options: {
    highway: false,
    laneLabels: false,
    enemyIcon: false,
    musicMapping: 'instruments',
    keys: PARRY_KEYS,
    altKeys: PARRY_ALT_KEYS,
    keyLegend: 'A ←   S ↓   D ↑   F →',
  },
  create: (ctx) => createParry(ctx),
};

interface Flash {
  glint: Glint;
  at: number;
  life: number;
  size: number;
  color: string;
  pos: THREE.Vector3;
}

function createParry(ctx: ExperimentContext): ExperimentRuntime {
  const { arena, session, chart, scene, camera } = ctx;
  const bpm = chart.tempo.bpmAtBeat(0);
  const timing = strikeTiming(bpm);
  const walkIn = (DUEL.walkInBeats * 60) / bpm;
  const shots = new OneShots(ctx.audio, ctx.sfx.output, 0.9);
  arena.view = { ...PARRY_CAMERA };
  arena.duelEffects = false;
  arena.pressMove = () => 'block';
  arena.telegraph = (encounter, start, _cues, t) => ({
    encounter,
    enterAge: t - start,
    next: null,
    last: null,
  });

  const tex = starTexture();
  const sparks = new Sparks(scene);
  const debris = new Voxels(scene, 300);
  const trail = new Trail(scene);
  const flashes: Flash[] = Array.from({ length: 4 }, () => ({
    glint: new Glint(scene, tex),
    at: -10,
    life: 0.1,
    size: 1,
    color: '#ffffff',
    pos: new THREE.Vector3(),
  }));
  let flashNext = 0;
  const flash = (pos: THREE.Vector3, color: string, size: number, life: number) => {
    const f = flashes[flashNext]!;
    flashNext = (flashNext + 1) % flashes.length;
    f.pos.copy(pos);
    f.color = color;
    f.size = size;
    f.life = life;
    f.at = now;
  };

  const postures = new Map<number, Posture>();
  const postureOf = (k: number) => {
    let p = postures.get(k);
    if (!p) {
      p = new Posture(chart.encounters[k]?.noteIds.length ?? 8);
      postures.set(k, p);
    }
    return p;
  };
  const hitTime = new Map<number, number>();
  const pressAt = new Array<number>(4).fill(-10);
  const resultAt = new Array<number>(4).fill(-10);
  const resultHit = new Array<boolean>(4).fill(false);
  let now = 0;
  let stopFrom = -10;
  let stopUntil = -10;
  let lean = { yaw: 0, tilt: 0, at: -10, hold: 0.22 };
  let punch = 0;
  let shake = { sx: 0, sy: 0, amp: 0, at: -10 };
  let vignette: { d: Direction; at: number } | null = null;
  let screenFlash = -10;
  let postureFlash = -10;
  let fin: {
    k: number;
    at: number;
    deathblow: boolean;
    riposted: boolean;
    shattered: boolean;
    dir: Direction;
  } | null = null;
  let banner: { text: string; color: string; at: number } | null = null;
  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  const fwd = new THREE.Vector3();

  const glitch = () => {
    const app = document.getElementById('app');
    if (!app) return;
    app.classList.remove('glitch');
    void app.offsetWidth;
    app.classList.add('glitch');
  };

  const deflect = (dir: Direction, j: Judgement, k: number, final: boolean, at: number) => {
    const d = DIRECTIONS[dir];
    const perfect = j === 'perfect';
    clang(shots, d, perfect, ctx.audio.currentTime);
    const p = CLASH[dir];
    sparks.burst(
      p,
      d.color,
      perfect ? 46 : 30,
      perfect ? 7 : 5.5,
      tmpA.set(d.sx * 0.9, d.sy * 0.7 + 0.45, 0.35),
    );
    flash(p, perfect ? '#ffffff' : d.color, perfect ? 2.6 : 1.9, 0.16);
    flash(p, d.color, perfect ? 4.2 : 3, 0.26);
    stopFrom = at;
    stopUntil = at + HIT_STOP;
    arena.hitStop(HIT_STOP, at);
    punch = perfect ? 0.2 : 0.13;
    lean = { yaw: d.yaw, tilt: d.tilt, at: now, hold: 0.22 };
    if (perfect) screenFlash = now;
    if (postureOf(k).apply(j) && !final) {
      postureBreak(shots, ctx.audio.currentTime + 0.03);
      postureFlash = now;
    }
    if (final) {
      fin = {
        k,
        at: now,
        deathblow: postureOf(k).full,
        riposted: false,
        shattered: false,
        dir,
      };
    }
  };

  const miss = (dir: Direction, k: number) => {
    const d = DIRECTIONS[dir];
    postureOf(k).apply('miss');
    struck(shots, d, ctx.audio.currentTime);
    shake = { sx: -d.sx, sy: -d.sy, amp: 0.55, at: now };
    vignette = { d: dir, at: now };
    lean = { yaw: -d.yaw * 0.8, tilt: 0.16 - d.tilt * 0.5, at: now, hold: 0.3 };
    arena.hurtHero(now);
    glitch();
  };

  const off = [
    session.bus.on('input', (i) => {
      if (!i.down) return;
      const dir = LANE_DIRECTION[i.lane];
      if (!dir) return;
      const d = DIRECTIONS[dir];
      pressAt[i.lane] = now;
      swish(shots, d, ctx.audio.currentTime);
      lean = { yaw: d.yaw * 0.7, tilt: d.tilt * 0.7, at: now, hold: 0.16 };
    }),
    session.bus.on('action', (a) => {
      if (a.kind === 'holdEnd') return;
      const dir = LANE_DIRECTION[a.lane];
      if (!dir) return;
      resultAt[a.lane] = now;
      resultHit[a.lane] = a.hit;
      if (a.hit) {
        hitTime.set(a.noteId, a.time);
        deflect(dir, a.judgement, a.encounter, a.final, a.time);
      } else {
        miss(dir, a.encounter);
      }
    }),
  ];

  const finisherStep = (t: number) => {
    if (!fin) return;
    const age = t - fin.at;
    if (!fin.riposted && age >= RIPOSTE_DELAY) {
      fin.riposted = true;
      arena.playHeroMove('stab');
      lean = { yaw: 0, tilt: -0.12, at: now, hold: 0.3 };
    }
    if (!fin.shattered && age >= SHATTER_DELAY) {
      fin.shattered = true;
      const kind = chart.encounters[fin.k]?.enemy ?? 'grunt';
      const spec = ENEMIES[kind];
      const at = tmpA.set(0, 1.3 * spec.scale, -ARENA.duelDistance + 0.6);
      const big = fin.deathblow;
      finisher(shots, big, ctx.audio.currentTime);
      debris.burst(at, spec.accent, big ? 60 : 36, big ? 8 : 6, tmpB.set(0, 0.3, -1), 1.4);
      debris.burst(at, big ? PALETTE.danger : '#ffffff', big ? 40 : 18, 6, tmpB.set(0, 1, 0), 1);
      sparks.burst(at, big ? PALETTE.danger : '#ffffff', big ? 90 : 50, 9, tmpB.set(0, 0.6, 0.2));
      flash(at, big ? PALETTE.danger : '#ffffff', big ? 7 : 4.5, big ? 0.45 : 0.3);
      flash(at, '#ffffff', big ? 3.5 : 2.5, 0.18);
      stopFrom = now;
      stopUntil = now + (big ? 0.11 : 0.07);
      arena.hitStop(big ? 0.11 : 0.07, now);
      punch = big ? 0.42 : 0.28;
      screenFlash = now;
      banner = big
        ? { text: 'DEATHBLOW', color: PALETTE.danger, at: now }
        : { text: 'RIPOSTE', color: PALETTE.white, at: now };
    }
  };

  const poseEnemy = (t: number, poseT: number) => {
    const rig = arena.enemyRig(true);
    const k = session.duel.activeEncounter(t);
    if (!rig || k === null) return;
    const st = session.duel.enemies[k]!;
    const scale = ENEMIES[rig.kind].scale;
    if (st.state === 'escaped') return;
    if (st.state === 'defeated') {
      // hold the broken enemy on screen for the riposte, then it shatters
      const show = fin && fin.k === k && !fin.shattered;
      rig.root.visible = !!show;
      if (show && fin) {
        const p = mixPose(full(RECOIL[fin.dir]), BROKEN, Math.min(1, (t - fin.at) / 0.08));
        applyStrikePose(rig, p, scale);
        rig.body.rotation.y += Math.sin(t * 90) * 0.05;
        rig.root.position.z = -ARENA.duelDistance + 0.2;
        rig.root.scale.setScalar(1);
        rig.root.position.y = 0;
        rig.bodyMat.emissive.set('#ffffff');
        rig.bodyMat.emissiveIntensity = 0.6;
      }
      return;
    }
    if (!rig.root.visible) return;
    const cues = session.encounterCues(k).map((c) => {
      const h = hitTime.get(c.id);
      const lane = chart.lanes.indexOf(c.action);
      return { id: c.id, lane, time: h === undefined ? c.time : Math.min(c.time, h) };
    });
    cues.sort((a, b) => a.time - b.time);
    const ph = strikePhase(cues, poseT, timing);
    let p = { ...IDLE_POSE };
    let glow = 0;
    let weaponFlash = 0;
    if (ph.last && ph.lastAge < 0.6) {
      const dir = LANE_DIRECTION[ph.last.lane]!;
      const outcome = session.duel.outcome(ph.last.id);
      if (outcome === 'hit') {
        const age = poseT - (hitTime.get(ph.last.id) ?? ph.last.time);
        const kick = 1 - (1 - Math.min(1, age / 0.1)) ** 3;
        p = mixPose(full(CONTACT[dir]), RECOIL[dir], kick);
        p = mixPose(p, IDLE_POSE, smooth((age - 0.14) / 0.3));
        weaponFlash = Math.max(0, 1 - age / 0.12);
      } else {
        const age = ph.lastAge;
        const carry = 1 - (1 - Math.min(1, age / 0.12)) ** 2;
        p = mixPose(full(CONTACT[dir]), FOLLOW[dir], carry);
        p = mixPose(p, IDLE_POSE, smooth((age - 0.22) / 0.32));
      }
    }
    if (ph.next) {
      const dir = LANE_DIRECTION[ph.next.lane]!;
      if (ph.windup > 0) {
        p = mixPose(p, WINDUP[dir], ph.windup);
        glow = ph.windup;
        const shiver = Math.sin(t * 75) * 0.04 * ph.windup * (1 - ph.swing);
        p.armZ += shiver;
      }
      if (ph.swing > 0) p = mixPose(p, CONTACT[dir], ph.swing);
    }
    const posture = postures.get(k);
    if (posture?.full) p = mixPose(p, BROKEN, 0.18 + 0.06 * Math.sin(t * 6));
    applyStrikePose(rig, p, scale);
    const walk = Math.min(1, Math.max(0, (t - (session.encounterStart(k) ?? 0)) / walkIn));
    rig.root.position.z += p.fwd * walk;

    const dirNow = ph.next
      ? LANE_DIRECTION[ph.next.lane]!
      : ph.last
        ? LANE_DIRECTION[ph.last.lane]!
        : null;
    const color = dirNow ? DIRECTIONS[dirNow].color : '#ffffff';
    rig.weaponMat.emissive
      .set(color)
      .multiplyScalar(glow * 1.5)
      .lerp(new THREE.Color('#ffffff'), weaponFlash);
    if (posture?.full) {
      rig.eyeMat.color.set(PALETTE.danger);
      rig.coreMat.color.set(PALETTE.danger);
      rig.core.scale.setScalar(1.4 + 0.3 * Math.sin(t * 12));
    }

    // the swing leaves a trail in its direction's colour
    const swinging = (ph.next && ph.swing > 0) || (ph.last && ph.lastAge < 0.1);
    if (swinging && dirNow) {
      rig.root.updateMatrixWorld(true);
      rig.weaponTip.getWorldPosition(tmpB);
      rig.weaponArm.getWorldPosition(tmpA);
      tmpA.lerp(tmpB, 0.45);
      trail.setColor(color, 0, 0.62);
      trail.alpha = 1;
      trail.push(tmpA, tmpB, t);
    }
  };

  return {
    update(t, dt) {
      now = t;
      const poseT = t >= stopFrom && t < stopUntil ? stopFrom : t;
      finisherStep(t);
      poseEnemy(t, poseT);
      trail.update(t);
      sparks.update(dt);
      debris.update(dt);
      for (const f of flashes) {
        const k = Math.max(0, 1 - (t - f.at) / f.life);
        f.glint.set(f.pos, f.color, k * 1.4, f.size * (0.7 + 0.3 * k), f.at * 7);
      }

      // hero body: snap toward the side, hold, ease back
      const la = t - lean.at;
      const lk = la < lean.hold ? 1 : Math.max(0, 1 - (la - lean.hold) / 0.18);
      const snap = Math.min(1, la / 0.035);
      arena.setHeroLean(lean.yaw * lk * snap, lean.tilt * lk * snap);

      // camera: punch toward the clash, directional shake when struck
      punch = Math.max(0, punch - dt * 2);
      camera.getWorldDirection(fwd);
      if (punch > 0) camera.position.addScaledVector(fwd, punch * punch * 5);
      const sa = t - shake.at;
      if (sa < 0.4) {
        const k = shake.amp * Math.exp(-sa * 9) * Math.cos(sa * 45);
        camera.position.x += shake.sx * k + (Math.random() - 0.5) * 0.05 * k;
        camera.position.y += shake.sy * k * 0.6;
      }
    },

    drawHud(c, t, w, h) {
      const k = session.duel.activeEncounter(t);
      const enemy = k === null ? null : session.duel.enemies[k]!;
      const fighting = enemy && enemy.state !== 'defeated' && enemy.state !== 'escaped';
      const g = arena.toScreen(GUARD);
      const right = arena.toScreen(CLASH.right);
      const R = Math.max(60, Math.abs(right.x - g.x));

      // the guard ring: four quadrants, lit when pressed, flashing on deflect / miss
      c.save();
      c.lineCap = 'round';
      for (const [lane, dir] of LANE_DIRECTION.entries()) {
        const d = DIRECTIONS[dir];
        const a0 = ANGLE[dir];
        const press = Math.max(0, 1 - (t - pressAt[lane]!) / 0.15);
        const res = Math.max(0, 1 - (t - resultAt[lane]!) / 0.28);
        const color = res > 0 ? (resultHit[lane] ? '#ffffff' : PALETTE.danger) : d.color;
        c.strokeStyle = hexA(color, (fighting ? 0.22 : 0.08) + 0.5 * press + 0.7 * res);
        c.lineWidth = 3 + 4 * press + 6 * res;
        c.beginPath();
        c.arc(g.x, g.y, R * (1 + 0.06 * res), a0 - ARC_HALF, a0 + ARC_HALF);
        c.stroke();
        // key badge sitting on the quadrant (readable over the hero's hair)
        const lx = g.x + Math.cos(a0) * R;
        const ly = g.y + Math.sin(a0) * R;
        const lit = (fighting ? 0.75 : 0.35) + 0.25 * press;
        c.fillStyle = press > 0 ? hexA(d.color, 0.5 * press + 0.2) : 'rgba(0,8,4,0.82)';
        c.strokeStyle = hexA(d.color, lit);
        c.lineWidth = 2;
        c.beginPath();
        c.arc(lx, ly, 12, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.font = 'bold 14px monospace';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillStyle = press > 0 ? PALETTE.white : hexA(d.color, lit);
        c.fillText(keyLabel(ctx.keys[lane] ?? ''), lx, ly + 1);
      }

      // incoming strikes: an arc per strike closing onto its quadrant exactly on the beat
      for (const cue of session.cuesBetween(t - 0.15, t + timing.warn)) {
        if (session.duel.outcome(cue.id) !== 'pending') continue;
        const dir = LANE_DIRECTION[cue.lane];
        if (!dir) continue;
        const d = DIRECTIONS[dir];
        const p = warnProgress(cue.time, t, timing.warn);
        const late = t > cue.time ? Math.max(0, 1 - (t - cue.time) / 0.15) : 1;
        const a0 = ANGLE[dir];
        const r = R * (1 + 1.7 * (1 - p));
        const alpha = Math.min(1, p * 3) * late;
        const half = ARC_HALF * (0.55 + 0.45 * p);
        c.shadowColor = d.color;
        c.shadowBlur = 8 + 14 * p;
        c.strokeStyle = hexA(d.color, alpha);
        c.lineWidth = 3 + 6 * p * p;
        c.beginPath();
        c.arc(g.x, g.y, r, a0 - half, a0 + half);
        c.stroke();
        // target quadrant warms up as the strike closes
        c.strokeStyle = hexA(d.color, 0.25 + 0.6 * p * p * late);
        c.lineWidth = 4 + 3 * p;
        c.beginPath();
        c.arc(g.x, g.y, R, a0 - ARC_HALF, a0 + ARC_HALF);
        c.stroke();
        // chevron on the arc, pointing in
        const cx = g.x + Math.cos(a0) * (r + 12);
        const cy = g.y + Math.sin(a0) * (r + 12);
        c.save();
        c.translate(cx, cy);
        c.rotate(a0);
        c.fillStyle = hexA(d.color, alpha);
        c.beginPath();
        c.moveTo(-6, 0);
        c.lineTo(8, -9);
        c.lineTo(8, 9);
        c.closePath();
        c.fill();
        c.restore();
        c.shadowBlur = 0;
      }
      c.restore();

      // posture bar over the enemy (Sekiro-style: fills from the centre outward)
      const rig = arena.enemyRig();
      const top = rig
        ? arena.toScreen(tmpA.copy(rig.root.position).setY(2.45 * ENEMIES[rig.kind].scale))
        : null;
      if (k !== null && top && fighting) {
        const ps = postures.get(k);
        const ratio = ps?.ratio ?? 0;
        const isFull = ps?.full ?? false;
        const bw = 190;
        const bx = top.x;
        const by = top.y - 6;
        c.fillStyle = 'rgba(0,0,0,0.6)';
        c.fillRect(bx - bw / 2 - 2, by - 5, bw + 4, 10);
        const pf = Math.max(0, 1 - (t - postureFlash) / 0.5);
        const hot = isFull ? 0.75 + 0.25 * Math.sin(t * 14) : ratio;
        c.fillStyle = `rgb(255,${Math.round(190 - 150 * hot)},${Math.round(60 - 40 * hot)})`;
        c.shadowColor = isFull ? PALETTE.danger : '#ffb22e';
        c.shadowBlur = isFull ? 16 : 6;
        c.fillRect(bx - (bw / 2) * ratio, by - 3, bw * ratio, 6);
        c.shadowBlur = 0;
        c.fillStyle = hexA(PALETTE.white, 0.75);
        c.font = 'bold 11px monospace';
        c.textAlign = 'center';
        c.fillText(isFull ? 'POSTURE BROKEN · DEFLECT ITS LAST BLOW' : 'POSTURE', bx, by - 14);
        if (pf > 0) {
          c.strokeStyle = hexA('#ffffff', pf);
          c.lineWidth = 2;
          c.strokeRect(bx - bw / 2 - 4 - 8 * (1 - pf), by - 7, bw + 8 + 16 * (1 - pf), 14);
        }
      }

      // struck: red vignette on the side the blow came from
      if (vignette) {
        const va = Math.max(0, 1 - (t - vignette.at) / 0.4);
        if (va > 0) {
          const d = DIRECTIONS[vignette.d];
          const x0 = d.sx < 0 ? 0 : d.sx > 0 ? w : w / 2;
          const y0 = d.sy > 0 ? 0 : d.sy < 0 ? h : h / 2;
          const x1 = d.sx !== 0 ? w / 2 : x0;
          const y1 = d.sy !== 0 ? h / 2 : y0;
          const grad = c.createLinearGradient(x0, y0, x0 + (x1 - x0) * 0.8, y0 + (y1 - y0) * 0.8);
          grad.addColorStop(0, hexA(PALETTE.danger, 0.55 * va));
          grad.addColorStop(1, hexA(PALETTE.danger, 0));
          c.fillStyle = grad;
          c.fillRect(0, 0, w, h);
        }
      }
      const sf = Math.max(0, 1 - (t - screenFlash) / 0.08);
      if (sf > 0) {
        c.fillStyle = hexA('#ffffff', 0.1 * sf);
        c.fillRect(0, 0, w, h);
      }

      // key legend: the four directions in keyboard order
      const order: Direction[] = ['left', 'low', 'high', 'right'];
      c.font = 'bold 15px monospace';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      order.forEach((dir, i) => {
        const lane = LANE_DIRECTION.indexOf(dir);
        const d = DIRECTIONS[dir];
        const x = w / 2 + (i - 1.5) * 78;
        const y = h - 34;
        const press = Math.max(0, 1 - (t - pressAt[lane]!) / 0.15);
        c.fillStyle = press > 0 ? hexA(d.color, 0.35 * press) : 'rgba(0,10,4,0.6)';
        c.strokeStyle = hexA(d.color, 0.55 + 0.45 * press);
        c.lineWidth = 1.5 + 1.5 * press;
        c.beginPath();
        c.roundRect(x - 33, y - 16, 66, 32, 6);
        c.fill();
        c.stroke();
        c.fillStyle = press > 0 ? PALETTE.white : d.color;
        c.fillText(`${keyLabel(ctx.keys[lane] ?? '')} ${d.arrow}`, x, y + 1);
      });

      // finisher banner
      if (banner) {
        const age = t - banner.at;
        if (age < 1.1) {
          const a = Math.min(1, (1.1 - age) / 0.3);
          const s = 1 + 0.4 * Math.max(0, 1 - age / 0.12);
          c.save();
          c.globalAlpha = a;
          c.translate(w / 2, h * 0.2);
          c.scale(s, s);
          c.shadowColor = banner.color;
          c.shadowBlur = 24;
          c.fillStyle = banner.color;
          c.font = `bold ${banner.text === 'DEATHBLOW' ? 54 : 40}px monospace`;
          c.textAlign = 'center';
          c.fillText(banner.text, 0, 0);
          c.restore();
        }
      }
    },

    dispose() {
      off.forEach((f) => f());
      arena.view = null;
      arena.duelEffects = true;
      arena.pressMove = null;
      arena.telegraph = null;
      arena.setHeroLean(0, 0);
      sparks.dispose();
      for (const f of flashes) f.glint.dispose();
      tex.dispose();
      scene.remove(debris.mesh);
      debris.mesh.geometry.dispose();
      (debris.mesh.material as THREE.Material).dispose();
      scene.remove(trail.mesh);
      trail.mesh.geometry.dispose();
      (trail.mesh.material as THREE.Material).dispose();
      shots.out.disconnect();
    },
  };
}

function smooth(x: number): number {
  const c = x < 0 ? 0 : x > 1 ? 1 : x;
  return c * c * (3 - 2 * c);
}
