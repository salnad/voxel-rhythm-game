import * as THREE from 'three';
import { ACTIONS, type Action } from '../../chart/types';
import { ACTION_SPECS, ENEMIES } from '../../config/actions';
import { PALETTE } from '../../config/visuals';
import { keyLabel } from '../../core/settings';
import type { EnemyRig } from '../../render/enemy';
import type { CameraView } from '../../render/arenaView';
import { hexA } from '../../render/icons';
import { Glint, starTexture } from '../melee/sparks';
import { OneShots } from '../melee/synth';
import type { Experiment, ExperimentContext, ExperimentRuntime } from '../types';
import { playTell } from './sounds';
import { tellAt, tellStarts, tellTelegraph, tellTiming, type TellState } from './timing';

/**
 * Low, from behind the hero's right shoulder, with a long lens: the enemy's silhouette is big
 * and clear of the hero.
 */
export const TELLS_CAMERA: CameraView = {
  position: [4.9, 2.0, 5.1],
  lookAt: [-0.8, 1.65, -3],
  fov: 30,
};

/** What the legend says each tell looks like. */
const TELL_HINT: Record<Action, string> = {
  block: 'weapon up · scrape',
  slash: 'arms open · clack',
  stab: 'core glows · ting',
  flourish: 'dizzy · chime',
};

export const tells: Experiment = {
  key: 'tells',
  label: 'TELLS · READ THE ENEMY',
  tagline: 'No highway, no icons: the enemy’s wind-up is the cue, always one beat before the hit.',
  hypothesis:
    'If every enemy tell has the same musical lead (a pose and a sound exactly one beat before the hit, a glint on the last eighth), players read the enemy as precisely as a highway, and it feels like fighting instead of reading UI.',
  inspiration: ['Punch-Out!!', 'Sekiro', 'Rhythm Heaven'],
  howTo: [
    'No lanes. Each enemy move has a tell exactly one beat before you strike: watch and listen.',
    'Weapon raised + scrape → A BLOCK · arms thrown open + clack → S SLASH',
    'Chest core glows + ting → D STAB · dizzy wobble + chime → F FLOURISH',
    'Strike on the next beat, as the glint flashes.',
  ],
  options: {
    highway: false,
    laneLabels: false,
    enemyIcon: false,
    musicMapping: 'instruments',
    keyLegend: 'A S D F',
  },
  create: (ctx) => createTells(ctx),
};

function glintPoint(rig: EnemyRig, action: Action, out: THREE.Vector3): THREE.Vector3 {
  switch (action) {
    case 'block':
      return rig.weaponTip.getWorldPosition(out);
    case 'slash':
      return rig.guardLine.getWorldPosition(out);
    case 'stab':
      return rig.core.getWorldPosition(out);
    case 'flourish':
      return rig.dizzy.getWorldPosition(out);
  }
}

/** Push the default telegraph poses much further, so each tell has its own silhouette. */
function exaggerate(rig: EnemyRig, s: TellState, t: number): void {
  const scale = ENEMIES[rig.kind].scale;
  let grow = 0;
  rig.head.rotation.z = 0;
  rig.dizzy.scale.setScalar(1);
  rig.guardLine.scale.y = 1;
  if (s.cue) {
    const e = s.pose;
    const g = s.glint;
    const shiver = Math.sin(t * 80) * g;
    switch (s.cue.action) {
      case 'block':
        // tall: weapon cocked behind the head, up on its toes, looming
        rig.weaponArm.rotation.x -= 0.4 * e;
        rig.weaponArm.rotation.z += 0.06 * shiver;
        rig.offArm.rotation.x -= 0.5 * e;
        rig.torso.rotation.x -= 0.12 * e;
        rig.root.position.y += 0.14 * e;
        grow = 0.12 * e;
        break;
      case 'slash':
        // wide: both arms flung out, chest pushed forward
        rig.weaponArm.rotation.z -= 0.25 * e;
        rig.offArm.rotation.z += 0.25 * e;
        rig.weaponArm.rotation.x += 0.6 * e;
        rig.offArm.rotation.x += 0.6 * e;
        rig.torso.rotation.x -= 0.18 * e;
        rig.guardLine.scale.y = 1 + 1.5 * e + 2 * g;
        rig.body.rotation.z += 0.03 * shiver;
        grow = 0.05 * e;
        break;
      case 'stab':
        // arched: leaning far back, arms pulled behind, the core blazing
        rig.torso.rotation.x -= 0.3 * e;
        rig.weaponArm.rotation.x += 1.4 * e;
        rig.offArm.rotation.x += 1.4 * e;
        rig.core.scale.multiplyScalar(1 + 1.2 * e + 1.2 * g);
        rig.body.position.y -= 0.06 * e;
        rig.body.rotation.z += 0.03 * shiver;
        break;
      case 'flourish': {
        // low and wobbly: knees buckling, head lolling, stars spinning
        const w = Math.sin(t * 9);
        rig.body.rotation.z += 0.28 * e * w;
        rig.head.rotation.z = 0.4 * e * Math.sin(t * 9 + 1.2);
        rig.body.position.y -= 0.16 * e;
        rig.weaponArm.rotation.z += 0.5 * e;
        rig.dizzy.scale.setScalar(1 + 0.8 * e + 0.6 * g);
        break;
      }
    }
  }
  rig.body.scale.setScalar(scale * (1 + grow));
}

function createTells(ctx: ExperimentContext): ExperimentRuntime {
  const { arena, session, chart, engine, scene, camera } = ctx;
  const timing = tellTiming(chart.tempo.bpmAtBeat(0));
  const shots = new OneShots(ctx.audio, ctx.sfx.output, 0.9);
  arena.view = { ...TELLS_CAMERA };
  arena.telegraph = (k, start, cues, t) => tellTelegraph(k, start, cues, t, timing);

  const tex = starTexture();
  const glint = new Glint(scene, tex);
  const halo = new Glint(scene, tex);
  const light = new THREE.PointLight('#ffffff', 0, 7, 1.5);
  scene.add(light);

  const scheduled = new Set<number>();
  const hitAt = new Array<number>(ACTIONS.length).fill(-10);
  const missAt = new Array<number>(ACTIONS.length).fill(-10);
  let punch = 0;
  let now = 0;
  const tmp = new THREE.Vector3();
  const fwd = new THREE.Vector3();

  const off = [
    session.bus.on('input', (i) => {
      if (i.down) ctx.sfx.swing(chart.lanes[i.lane] as Action);
    }),
    session.bus.on('action', (a) => {
      if (a.kind === 'holdEnd') return;
      if (!a.hit) {
        missAt[a.lane] = now;
        return;
      }
      const perfect = a.judgement === 'perfect';
      arena.hitStop(perfect ? 0.06 : 0.04, a.time);
      punch = perfect ? 0.22 : 0.14;
      hitAt[a.lane] = now;
      ctx.sfx.hit(a.action, perfect);
    }),
  ];

  const scheduleTells = (t: number) => {
    const live = session.cuesBetween(t - 1, t + timing.lead + 0.3).sort((a, b) => a.time - b.time);
    const starts = tellStarts(live, timing.lead);
    live.forEach((c, i) => {
      const at = starts[i]!;
      if (scheduled.has(c.id) || at > t + 0.12 || at < t - 0.05) return;
      scheduled.add(c.id);
      playTell(shots, c.action, engine.ctxTimeFor(at));
    });
  };

  return {
    update(t, dt) {
      now = t;
      if (engine.playing) scheduleTells(t);
      const rig = arena.enemyRig();
      const k = session.duel.activeEncounter(t);
      const st = k === null ? null : session.duel.enemies[k]!;
      let glow = 0;
      let flash = 0;
      if (rig && k !== null && st && st.state !== 'defeated' && st.state !== 'escaped') {
        const s = tellAt(session.encounterCues(k), t, timing);
        exaggerate(rig, s, t);
        const told = s.cue ?? (s.afterGlint > 0 && s.last ? s.last.cue : null);
        if (told) {
          const color = ACTION_SPECS[told.action].color;
          const g = s.cue ? s.glint : s.afterGlint;
          glintPoint(rig, told.action, tmp);
          glint.set(tmp, color, g * 1.6, 0.35 + 1.3 * g, t * 1.5);
          halo.set(tmp, color, (s.cue ? s.pose : 0) * 0.35 + g * 0.5, 1.2 + 1.2 * g, 0.4);
          glow = s.cue ? s.pose : 0;
          flash = g;
          light.color.set(color);
        } else {
          glint.set(tmp, '#ffffff', 0, 0);
          halo.set(tmp, '#ffffff', 0, 0);
        }
        light.position.set(0, 1.7 * ENEMIES[rig.kind].scale, rig.root.position.z + 1.3);
      } else {
        glint.set(tmp, '#ffffff', 0, 0);
        halo.set(tmp, '#ffffff', 0, 0);
      }
      light.intensity = 3 * glow + 14 * flash;

      punch = Math.max(0, punch - dt * 2.2);
      if (punch > 0) {
        camera.getWorldDirection(fwd);
        camera.position.addScaledVector(fwd, punch * punch * 4);
      }
    },

    drawHud(c, t, w, h) {
      // compact legend: key, move, and what its tell looks like
      const held = arena.heldLanes;
      const chipW = Math.min(190, (w - 40) / 4);
      const chipH = 42;
      const y = h - chipH - 18;
      const x0 = w / 2 - (chipW * 4 + 18) / 2;
      c.textBaseline = 'middle';
      ACTIONS.forEach((a, i) => {
        const spec = ACTION_SPECS[a];
        const x = x0 + i * (chipW + 6);
        const hit = Math.max(0, 1 - (t - hitAt[i]!) / 0.25);
        const miss = Math.max(0, 1 - (t - missAt[i]!) / 0.6);
        const dx = miss > 0 ? Math.sin(t * 70) * 4 * miss : 0;
        c.fillStyle = held[i] ? hexA(spec.color, 0.3) : hexA('#000a04', 0.55 + 0.3 * hit);
        c.strokeStyle =
          miss > 0.01
            ? hexA(PALETTE.danger, 0.5 + 0.5 * miss)
            : hexA(spec.color, 0.35 + 0.65 * hit);
        c.lineWidth = held[i] || hit > 0 || miss > 0 ? 2.5 : 1;
        c.beginPath();
        c.roundRect(x + dx, y, chipW, chipH, 7);
        c.fill();
        c.stroke();
        c.textAlign = 'left';
        c.fillStyle = held[i] ? PALETTE.white : spec.color;
        c.font = 'bold 17px monospace';
        c.fillText(keyLabel(ctx.keys[i] ?? ''), x + dx + 10, y + chipH / 2);
        c.font = 'bold 12px monospace';
        c.fillText(spec.label, x + dx + 32, y + 14);
        c.font = '11px monospace';
        c.fillStyle = hexA(PALETTE.white, 0.7);
        c.fillText(TELL_HINT[a], x + dx + 32, y + 29, chipW - 38);
      });
      c.textAlign = 'center';
    },

    dispose() {
      off.forEach((f) => f());
      arena.view = null;
      arena.telegraph = null;
      glint.dispose();
      halo.dispose();
      tex.dispose();
      scene.remove(light);
      light.dispose();
      shots.out.disconnect();
    },
  };
}
