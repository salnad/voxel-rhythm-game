import * as THREE from 'three';
import type { Action } from '../../chart/types';
import { ACTION_SPECS } from '../../config/actions';
import { JUDGEMENT_WINDOWS } from '../../config/gameplay';
import { PALETTE } from '../../config/visuals';
import { COMBO_COLOR, RETRY_COLOR } from '../../render/highway3d';
import { drawActionIcon, hexA } from '../../render/icons';
import { beatPulse } from '../juice/beat';
import { Juice } from '../juice/juice';
import { JuiceSounds } from '../juice/sounds';
import { BeatWorld } from '../juice/world';
import type { Experiment, ExperimentContext, ExperimentRuntime } from '../types';
import { buttonOf, TWO_BUTTON_KEYS, TwoButtonMapper, type Button } from './logic';

const DEFEND_COLOR = ACTION_SPECS.block.color;
const ATTACK_COLOR = '#ff5a3c';
const FINISH_COLOR = ACTION_SPECS.flourish.color;
const LANE_HALF = 0.72;
/** Badge height (a squat drum) and radius, in world units. */
const BADGE_Y = 0.14;
const BADGE_R = 0.55;
const TWO_BUTTON_APPROACH = 1.5;

function createTwoButton(ctx: ExperimentContext): ExperimentRuntime {
  const { session, chart, arena, audio, sfx, scene } = ctx;
  const juice = new Juice(scene, ctx.camera, arena);
  const sounds = new JuiceSounds(audio, sfx.output);
  const world = new BeatWorld(ctx, { grid: true, enemyBob: 0.03, rain: 0.15 });
  const mapper = new TwoButtonMapper(JUDGEMENT_WINDOWS.good + 0.05);
  const hw = arena.highway;
  const held: Record<Button, boolean> = { defend: false, attack: false };
  const pressAt: Record<Button, number> = { defend: -10, attack: -10 };
  const hitAt = new Map<number, number>();
  let now = 0;
  let approach = TWO_BUTTON_APPROACH;

  // the single lane: a dark strip on the floor with glowing edges and a target ring
  const lane = new THREE.Group();
  const L = 19;
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(LANE_HALF * 2, L),
    new THREE.MeshBasicMaterial({ color: 0x03140a, transparent: true, opacity: 0.72 }),
  );
  strip.rotation.x = -Math.PI / 2;
  strip.position.set(0, 0.01, hw.hitZ - L / 2 + 0.6);
  lane.add(strip);
  const edgeMat = new THREE.MeshBasicMaterial({
    color: PALETTE.green,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.PlaneGeometry(0.04, L), edgeMat);
    e.rotation.x = -Math.PI / 2;
    e.position.set(s * LANE_HALF, 0.015, strip.position.z);
    lane.add(e);
  }
  const targetMat = new THREE.MeshBasicMaterial({
    color: PALETTE.white,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const target = new THREE.Mesh(
    new THREE.RingGeometry(BADGE_R * 1.05, BADGE_R * 1.18, 48),
    targetMat,
  );
  target.rotation.x = -Math.PI / 2;
  target.position.set(0, 0.02, hw.hitZ);
  lane.add(target);
  scene.add(lane);

  const offenseCues = () =>
    session.conductor.cues.filter(
      (c) => !c.removed && session.judge.isPending(c.id) && c.action !== 'block',
    );

  /** Teach the wrong button: a press when only the other kind of cue is near. */
  const hintWrong = (button: Button, time: number) => {
    const near = session
      .cuesBetween(time - JUDGEMENT_WINDOWS.good, time + JUDGEMENT_WINDOWS.good)
      .filter((c) => session.judge.isPending(c.id));
    if (near.length === 0) return;
    const wantDefend = near.some((c) => c.action === 'block');
    const wantAttack = near.some((c) => c.action !== 'block');
    const at = hw.receptorPoint(0).setX(0).setY(1.3);
    if (button === 'defend' && wantAttack && !wantDefend)
      juice.pop('ATTACK!', at, ATTACK_COLOR, 20);
    if (button === 'attack' && wantDefend && !wantAttack)
      juice.pop('DEFEND!', at, DEFEND_COLOR, 20);
  };

  const pressFeedback = (button: Button) => {
    sounds.drum(button === 'defend' ? 'don' : 'ka');
    pressAt[button] = now;
    juice.ring(
      new THREE.Vector3(0, 0.05, hw.hitZ),
      button === 'defend' ? DEFEND_COLOR : ATTACK_COLOR,
      new THREE.Vector3(0, 1, 0),
      0.18,
      0.9,
    );
  };

  const off = [
    session.bus.on('input', (i) => {
      if (!i.auto) return;
      const button: Button = chart.lanes[i.lane] === 'block' ? 'defend' : 'attack';
      held[button] = i.down;
      if (i.down) pressFeedback(button);
    }),
    session.bus.on('action', (a) => {
      if (a.kind === 'holdEnd') return;
      if (!a.hit) {
        if (a.kind === 'tap') juice.flash(PALETTE.danger, 0.08, 0.16);
        return;
      }
      hitAt.set(a.noteId, now);
      const color =
        a.action === 'block' ? DEFEND_COLOR : a.action === 'flourish' ? FINISH_COLOR : ATTACK_COLOR;
      const perfect = a.judgement === 'perfect';
      sounds.impact(a.action, perfect ? 1 : 0.8);
      const at = a.action === 'block' ? juice.clashPoint() : juice.enemyChest();
      juice.sparks(at, color, perfect ? 22 : 14, 5);
      juice.sparks(new THREE.Vector3(0, 0.5, hw.hitZ), color, 10, 3.5);
      juice.ring(new THREE.Vector3(0, 0.06, hw.hitZ), color, new THREE.Vector3(0, 1, 0), 0.3, 1.8);
      juice.punch(a.action === 'flourish' ? 1 : perfect ? 0.6 : 0.4);
      juice.flash(color, perfect ? 0.12 : 0.07, 0.12);
      if (a.action !== 'block') juice.flinchEnemy(perfect ? 1 : 0.7);
    }),
    session.bus.on('duel', (d) => {
      if (d.type === 'playerHit') juice.flash(PALETTE.danger, 0.22, 0.25);
      if (d.type === 'defeated') juice.flash(PALETTE.white, 0.35, 0.3);
    }),
  ];

  const badgeColor = (a: Action) =>
    a === 'block' ? DEFEND_COLOR : a === 'flourish' ? FINISH_COLOR : ATTACK_COLOR;

  /** Screen ellipse of a floor-parallel circle of radius R at height y. */
  const disc = (z: number, y: number, R: number) => {
    const p = arena.toScreen(new THREE.Vector3(0, y, z));
    const ex = arena.toScreen(new THREE.Vector3(R, y, z));
    const ez = arena.toScreen(new THREE.Vector3(0, y, z - R));
    return {
      x: p.x,
      y: p.y,
      rx: Math.max(3, Math.abs(ex.x - p.x)),
      ry: Math.max(2, Math.abs(ez.y - p.y)),
    };
  };

  const drawBadge = (
    c: CanvasRenderingContext2D,
    action: Action,
    z: number,
    alpha: number,
    grey: boolean,
  ) => {
    const R = BADGE_R * (action === 'flourish' ? 1.3 : 1);
    const color = grey ? '#5a6b60' : badgeColor(action);
    // a drum lying on the road: its side under a lit top face
    const base = disc(z, 0.02, R);
    const top = disc(z, BADGE_Y, R);
    c.globalAlpha = alpha;
    c.fillStyle = hexA(color, 0.55);
    c.beginPath();
    c.ellipse(base.x, base.y, base.rx, base.ry, 0, 0, Math.PI * 2);
    c.fill();
    c.fillRect(base.x - base.rx, top.y, base.rx * 2, base.y - top.y);
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(top.x, top.y, top.rx, top.ry, 0, 0, Math.PI * 2);
    c.fill();
    c.lineWidth = Math.max(1.5, top.rx * 0.12);
    c.strokeStyle = grey ? '#9fb3a6' : PALETTE.white;
    c.stroke();
    c.save();
    c.translate(top.x, top.y);
    c.scale(1, top.ry / top.rx);
    const icon: Action =
      action === 'block' ? 'block' : action === 'flourish' ? 'flourish' : 'slash';
    drawActionIcon(c, icon, 0, 0, top.rx * 0.55, grey ? '#c9d6cd' : '#0a0f0c');
    c.restore();
    c.globalAlpha = 1;
  };

  const drawLane = (c: CanvasRenderingContext2D, t: number, approach: number) => {
    // beat and bar lines (follow measure repeats)
    const bpb = chart.beatsPerBar;
    for (const p of session.conductor.plays) {
      if (p.start > t + approach) break;
      if (p.start + p.dur < t) continue;
      for (let k = 0; k < bpb; k++) {
        const bt = p.start + (k * p.dur) / bpb;
        if (bt < t || bt > t + approach) continue;
        const z = hw.cueZ(bt, t, approach);
        const a = arena.toScreen(new THREE.Vector3(-LANE_HALF, 0.02, z));
        const b = arena.toScreen(new THREE.Vector3(LANE_HALF, 0.02, z));
        c.strokeStyle = hexA(PALETTE.green, k === 0 ? 0.55 : 0.18);
        c.lineWidth = k === 0 ? 2 : 1;
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.stroke();
      }
      if (p.combo) {
        const z0 = hw.cueZ(Math.max(t, p.start), t, approach);
        const z1 = hw.cueZ(Math.min(t + approach, p.start + p.dur), t, approach);
        const color = p.attempt > 1 || p.status === 'failed' ? RETRY_COLOR : COMBO_COLOR;
        c.strokeStyle = hexA(color, 0.85);
        c.lineWidth = 3;
        for (const s of [-1, 1]) {
          const a = arena.toScreen(new THREE.Vector3(s * (LANE_HALF + 0.06), 0.02, z0));
          const b = arena.toScreen(new THREE.Vector3(s * (LANE_HALF + 0.06), 0.02, z1));
          c.beginPath();
          c.moveTo(a.x, a.y);
          c.lineTo(b.x, b.y);
          c.stroke();
        }
      }
    }
    // target: pulses on the beat, flashes in the pressed button's colour
    const tp = disc(hw.hitZ, 0.03, BADGE_R);
    const pulse = beatPulse(session.conductor.beatAt(t), 4);
    const dAge = t - pressAt.defend;
    const aAge = t - pressAt.attack;
    const flashBtn: Button | null =
      dAge < 0.15 || aAge < 0.15 ? (dAge < aAge ? 'defend' : 'attack') : null;
    const fk = flashBtn ? 1 - Math.min(dAge, aAge) / 0.15 : 0;
    const ring = flashBtn === 'defend' ? DEFEND_COLOR : flashBtn === 'attack' ? ATTACK_COLOR : null;
    c.lineWidth = 3 + 3 * fk;
    c.strokeStyle = ring ? hexA(ring, 0.6 + 0.4 * fk) : hexA(PALETTE.white, 0.45 + 0.4 * pulse);
    const tk = 1.12 + 0.1 * fk + 0.05 * pulse;
    c.beginPath();
    c.ellipse(tp.x, tp.y, tp.rx * tk, tp.ry * tk, 0, 0, Math.PI * 2);
    c.stroke();
    if (ring) {
      c.fillStyle = hexA(ring, 0.25 * fk);
      c.fill();
    }

    // cues: far ones first so near ones draw on top
    const cues = session.cuesBetween(t - 0.25, t + approach).sort((a, b) => b.time - a.time);
    for (const cue of cues) {
      const outcome = session.duel.outcome(cue.id);
      if (outcome === 'hit' || outcome === 'holding') {
        const ha = hitAt.get(cue.id);
        if (ha === undefined) continue;
        const k = (t - ha) / 0.18;
        if (k < 0 || k > 1) continue;
        const rk = 1 + k * 1.2;
        c.globalAlpha = 1 - k;
        c.strokeStyle = badgeColor(cue.action);
        c.lineWidth = 6 * (1 - k);
        c.beginPath();
        c.ellipse(tp.x, tp.y, tp.rx * rk, tp.ry * rk, 0, 0, Math.PI * 2);
        c.stroke();
        c.globalAlpha = 1;
        continue;
      }
      const missed = outcome === 'miss';
      const z = hw.cueZ(cue.time, t, approach);
      const far = (cue.time - t) / approach;
      const fadeIn = Math.min(1, (1 - far) * 5);
      const fadeOut = cue.time < t ? Math.max(0, 1 - (t - cue.time) / 0.25) : 1;
      drawBadge(c, cue.action, z, fadeIn * fadeOut, missed);
    }
  };

  const drawButtons = (c: CanvasRenderingContext2D, w: number, h: number) => {
    const boxes: Array<[Button, string, string, string, number]> = [
      ['defend', 'D  F', 'DEFEND', DEFEND_COLOR, w / 2 - 170],
      ['attack', 'J  K', 'ATTACK', ATTACK_COLOR, w / 2 + 170],
    ];
    const y = h - 50;
    for (const [btn, keys, label, color, x] of boxes) {
      const on = held[btn] || now - pressAt[btn] < 0.08;
      c.fillStyle = on ? hexA(color, 0.45) : 'rgba(0,10,4,0.75)';
      c.strokeStyle = hexA(color, on ? 1 : 0.8);
      c.lineWidth = on ? 3 : 1.5;
      c.beginPath();
      c.roundRect(x - 80, y - 28, 160, 58, 10);
      c.fill();
      c.stroke();
      c.textAlign = 'center';
      c.fillStyle = on ? PALETTE.white : color;
      c.font = 'bold 22px monospace';
      c.fillText(keys, x - 34, y);
      drawActionIcon(c, btn === 'defend' ? 'block' : 'slash', x + 46, y - 2, 13, color);
      c.font = 'bold 13px monospace';
      c.fillStyle = hexA(color, 0.95);
      c.fillText(label, x, y + 20);
    }
  };

  return {
    mapInput(input) {
      const button = buttonOf(input.lane);
      held[button] = input.down;
      if (input.down) {
        pressFeedback(button);
        hintWrong(button, input.time);
      }
      return mapper.map(input, offenseCues());
    },

    update(t, dt, ap) {
      now = t;
      approach = ap;
      world.update(t);
      const pulse = beatPulse(session.conductor.beatAt(t), 4);
      edgeMat.opacity = 0.35 + 0.45 * pulse;
      targetMat.opacity = 0.5 + 0.5 * pulse;
      juice.update(t, dt);
    },

    drawHud(c, t, w, h) {
      now = t;
      drawLane(c, t, approach);
      drawButtons(c, w, h);
      juice.draw(c, t, w, h);
    },

    dispose() {
      off.forEach((f) => f());
      scene.remove(lane);
      lane.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      strip.material.dispose();
      edgeMat.dispose();
      targetMat.dispose();
      world.dispose();
      juice.dispose();
    },
  };
}

export const twoButton: Experiment = {
  key: 'two-button',
  label: 'TWO BUTTONS · DEFEND / ATTACK',
  tagline: 'One lane, two buttons: defend or attack. The hero picks the move.',
  hypothesis:
    'Four arbitrary actions are a memorization tax; with one meaningful choice (defend vs attack) attention goes to rhythm and the fight, and flow comes sooner.',
  inspiration: ['Taiko no Tatsujin', 'Rhythm Heaven'],
  howTo: [
    'One lane, two kinds of drum: blue = DEFEND, red = ATTACK.',
    'Left hand D or F to DEFEND, right hand J or K to ATTACK, as the drum reaches the ring.',
    'The hero picks the move (slash, stab, the big pink finisher) for you.',
  ],
  options: {
    highway: false,
    laneLabels: false,
    enemyIcon: false,
    musicMapping: 'instruments',
    keys: [...TWO_BUTTON_KEYS],
    keyLegend: 'D F defend · J K attack',
    approachSeconds: TWO_BUTTON_APPROACH,
  },
  create: createTwoButton,
};
