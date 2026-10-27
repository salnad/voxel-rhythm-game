import * as THREE from 'three';
import { boom808, hatRoll, vocalChop } from '../../audio/accents';
import { demoHarmony } from '../../audio/demo/composition';
import { playLeadNote } from '../../audio/leadVoice';
import type { Action } from '../../chart/types';
import { ACTION_SPECS } from '../../config/actions';
import { JUDGEMENT_WINDOWS } from '../../config/gameplay';
import { PALETTE } from '../../config/visuals';
import type { Cue } from '../../game/conductor';
import { drawActionIcon, hexA } from '../../render/icons';
import type { LaneInput } from '../../rhythm/input';
import { beatPulse } from '../juice/beat';
import { Juice } from '../juice/juice';
import { JuiceSounds } from '../juice/sounds';
import { BeatWorld } from '../juice/world';
import type { Experiment, ExperimentContext, ExperimentRuntime } from '../types';
import { buildFreestyleChart } from './chart';
import {
  botSwing,
  enemyHp,
  freeBeats,
  FURY_TIERS,
  Fury,
  GRID_WINDOWS,
  gridJudge,
  hitDamage,
  hitScore,
  layerGain,
  SlotGuard,
  type FuryChange,
  type GridQuality,
} from './logic';

const BLOCK_LANE = 0;
const FINISH_LANE = 3;
/** S, D, F: the move each free-attack key swings. */
const SWING: Record<number, Action> = { 1: 'slash', 2: 'stab', 3: 'flourish' };
/** Beats before the first fight where a quiet metronome ticks the grid in. */
const TICK_UNTIL_BEAT = 24;

interface EnemyHp {
  max: number;
  hp: number;
  brokenAt: number | null;
  finisher: Cue | null;
  finisherBeat: number;
}

interface Stats {
  hits: number;
  perfect: number;
  whiffs: number;
  broken: number;
  finished: number;
  escaped: number;
  peakTier: number;
  /** Beats left before the finisher when each enemy broke. */
  spare: number[];
}

function createFreestyle(ctx: ExperimentContext): ExperimentRuntime {
  const { session, chart, engine, audio, sfx, arena, autoplay } = ctx;
  const conductor = session.conductor;
  const juice = new Juice(ctx.scene, ctx.camera, arena);
  const sounds = new JuiceSounds(audio, sfx.output);
  const world = new BeatWorld(ctx, {
    grid: true,
    heroRing: true,
    enemyBob: 0.05,
    rain: 0.25,
    camera: 0.4,
    frame: 0.22,
  });
  const fury = new Fury();
  const guard = new SlotGuard();
  const stats: Stats = {
    hits: 0,
    perfect: 0,
    whiffs: 0,
    broken: 0,
    finished: 0,
    escaped: 0,
    peakTier: 0,
    spare: [],
  };
  const accentBus = audio.createGain();
  accentBus.gain.value = 0.9;
  accentBus.connect(engine.musicBus);
  const passUps = new Set<number>();
  const autoFinished = new Set<number>();
  const bpb = chart.beatsPerBar;
  let score = 0;
  let now = 0;
  let lastBeat = -Infinity;
  let lastTickBeat = -Infinity;
  let swingFlash = { at: -10, quality: 'whiff' as GridQuality };

  const spbAt = (beat: number) => 60 / chart.tempo.bpmAtBeat(Math.max(0, beat));
  const tier = () => FURY_TIERS[fury.tier]!;

  // ---------------------------------------------------------------- enemies

  const blockBeats = chart.notes.filter((n) => n.action === 'block').map((n) => n.beat);
  const enemies = chart.encounters.map((e) => {
    const finisherNote = chart.notes
      .filter((n) => n.encounter === e.index && n.action === 'flourish')
      .pop();
    const endBeat = finisherNote?.beat ?? e.startBeat + 16;
    const free = freeBeats(e.startBeat, endBeat, blockBeats);
    const max = enemyHp(free, e.index);
    return { max, hp: max, brokenAt: null, finisher: null, finisherBeat: endBeat } as EnemyHp;
  });

  const finisherOf = (k: number): Cue | null => {
    const e = enemies[k];
    if (!e) return null;
    e.finisher ??=
      conductor.cues.find((c) => c.encounter === k && c.action === 'flourish' && !c.removed) ??
      null;
    return e.finisher;
  };

  const activeEnemy = (t: number): { k: number; e: EnemyHp } | null => {
    const k = session.duel.activeEncounter(t);
    if (k === null) return null;
    const status = session.duel.enemies[k];
    const e = enemies[k];
    if (!e || !status || status.state !== 'fighting') return null;
    return { k, e };
  };

  // ---------------------------------------------------------------- music layers

  const applyLayers = (when: number) => {
    const k = fury.tier;
    for (const [name, g] of engine.parts) {
      const target = layerGain(name, k);
      g.gain.cancelScheduledValues(audio.currentTime);
      g.gain.setValueAtTime(g.gain.value, audio.currentTime);
      g.gain.setTargetAtTime(target, Math.max(audio.currentTime, when), target > 0 ? 0.02 : 0.06);
    }
  };
  for (const [name, g] of engine.parts) g.gain.value = layerGain(name, 0);

  /** Layers change on the next beat, so the song never stumbles mid-beat. */
  const nextBeatCtx = (t: number) =>
    engine.ctxTimeFor(chart.tempo.beatToSec(Math.ceil(conductor.beatAt(t) + 1e-3)));

  const onFury = (change: FuryChange, t: number) => {
    if (!change) return;
    applyLayers(nextBeatCtx(t));
    const tr = tier();
    if (change === 'up') {
      stats.peakTier = Math.max(stats.peakTier, fury.tier);
      sounds.tierUp(fury.tier);
      juice.pop(
        `FURY ${tr.label}`,
        arena.heroRig.root.position.clone().setY(2.6),
        tr.color,
        30,
        0.9,
      );
      juice.flash(tr.color, 0.18, 0.25);
      juice.ring(
        arena.heroRig.root.position.clone().setY(0.05),
        tr.color,
        new THREE.Vector3(0, 1, 0),
        0.45,
        4,
      );
      ctx.rain.pulse(1.2);
    } else {
      sounds.tierDown();
      juice.pop(`${tr.label}`, arena.heroRig.root.position.clone().setY(2.4), '#8a9a90', 22, 0.6);
    }
  };

  /** The note a free attack plays, in the song's key: S lead, D hats + snare, F vocal chop. */
  const playNote = (lane: number, t: number, quality: GridQuality) => {
    const at = audio.currentTime;
    const beat = conductor.beatAt(t);
    const bar = Math.max(0, Math.floor(beat / bpb));
    const h = demoHarmony(bar);
    const slot = Math.round(beat * 2);
    const lvl = quality === 'perfect' ? 0.5 : 0.38;
    const k = fury.tier;
    if (lane === 1) {
      const tone = h.leadTones[((slot % 4) + 4) % 4] ?? 81;
      for (const o of playLeadNote(
        audio,
        accentBus,
        at,
        tone,
        spbAt(beat) * 0.45,
        lvl * 1.6,
        session.patch,
      ))
        engine.connectBend(o.detune);
      if (k >= 3)
        playLeadNote(audio, accentBus, at, tone + 12, spbAt(beat) * 0.3, lvl * 0.7, session.patch);
    } else if (lane === 2) {
      hatRoll(audio, accentBus, at, spbAt(beat) / 8, lvl);
      if (k >= 3) boom808(audio, accentBus, at, h.root808 + 12, lvl * 0.6);
    } else {
      const top = Math.max(...h.chord);
      vocalChop(audio, accentBus, at, top + 12, lvl, slot % 2 === 0 ? 'a' : 'o');
      if (k >= 4) vocalChop(audio, accentBus, at + 0.02, top + 19, lvl * 0.6, 'e');
    }
  };

  // ---------------------------------------------------------------- swings

  const swing = (lane: number, time: number, t: number) => {
    const action = SWING[lane] ?? 'slash';
    const beat = conductor.beatAt(time);
    const g = gridJudge(beat, spbAt(beat), GRID_WINDOWS);
    const fresh = g.quality !== 'whiff' && guard.take(g.slot);
    sounds.draw(action);
    juice.sparks(juice.bladeTip(), tier().color, 4, 2.5);
    swingFlash = { at: t, quality: fresh ? g.quality : 'whiff' };
    if (!fresh) {
      stats.whiffs++;
      sounds.whiff();
      arena.playMove(action, t, false);
      juice.pop('OFF BEAT', juice.clashPoint().setY(2.1), '#9aa8a0', 16, 0.45);
      juice.flash('#000000', 0.12, 0.12);
      onFury(fury.whiff(beat), t);
      return;
    }
    const target = activeEnemy(time);
    stats.hits++;
    if (g.quality === 'perfect') stats.perfect++;
    playNote(lane, time, g.quality);
    onFury(fury.hit(beat), t);
    score += hitScore(g.quality, fury.mult);
    const tr = tier();
    const perfect = g.quality === 'perfect';
    arena.playMove(action, t, target !== null);
    if (!target) return;
    const dmg = hitDamage(g.quality, fury.tier, g.slot);
    const e = target.e;
    const wasBroken = e.brokenAt !== null;
    e.hp = Math.max(0, e.hp - dmg);
    const at = juice.enemyChest();
    sounds.impact(action, perfect ? 1 : 0.75);
    juice.sparks(at, tr.color, Math.round((perfect ? 14 : 9) + fury.tier * 4), 4 + fury.tier);
    if (perfect) juice.sparks(at, PALETTE.white, 5, 6);
    juice.flinchEnemy(perfect ? 0.9 : 0.6);
    juice.punch(0.2 + 0.08 * fury.tier + (perfect ? 0.1 : 0));
    juice.flash(tr.color, 0.04 + 0.02 * fury.tier, 0.1);
    juice.pop(
      wasBroken ? `+${hitScore(g.quality, fury.mult)}` : `${Math.round(dmg * 10) / 10}`,
      at.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.8, 0.5, 0)),
      perfect ? PALETTE.white : tr.color,
      perfect ? 22 : 17,
      0.5,
    );
    if (!wasBroken && e.hp <= 0) {
      e.brokenAt = t;
      stats.broken++;
      stats.spare.push(Math.round(e.finisherBeat - beat));
      sounds.impact('flourish', 1);
      juice.pop('BROKEN!', at.clone().setY(at.y + 1.3), ACTION_SPECS.flourish.color, 34, 1.1);
      juice.flash(ACTION_SPECS.flourish.color, 0.3, 0.3);
      juice.shake(0.15);
      juice.punch(1);
      ctx.rain.pulse(1.5);
    }
  };

  // ---------------------------------------------------------------- autoplay bot

  const botStep = (t: number) => {
    const beat = conductor.beatAt(t);
    if (!Number.isFinite(lastBeat)) return;
    const from = Math.floor(lastBeat * 2) + 1;
    const to = Math.floor(beat * 2);
    for (let slot = from; slot <= to; slot++) {
      const slotTime = chart.tempo.beatToSec(slot / 2);
      const near = session.cuesBetween(slotTime - 0.5, slotTime + 0.5).map((c) => c.time);
      const lane = botSwing(slot, slotTime, near, spbAt(slot / 2) * 0.6);
      if (lane !== null && activeEnemy(slotTime)) swing(lane, slotTime, t);
    }
  };

  // ---------------------------------------------------------------- session events

  const off = [
    session.bus.on('input', (i) => {
      if (i.down && i.lane === BLOCK_LANE)
        juice.sparks(juice.bladeTip(), ACTION_SPECS.block.color, 4, 2.5);
    }),
    session.bus.on('action', (a) => {
      if (a.kind === 'holdEnd' || !a.hit) {
        if (a.kind === 'tap' && !a.hit) juice.flash(PALETTE.danger, 0.1, 0.18);
        return;
      }
      const color = ACTION_SPECS[a.action].color;
      const at = a.action === 'block' ? juice.clashPoint() : juice.enemyChest();
      sounds.impact(a.action, a.judgement === 'perfect' ? 1 : 0.8);
      juice.sparks(at, color, a.action === 'flourish' ? 40 : 16, a.action === 'flourish' ? 7 : 5);
      juice.punch(a.action === 'flourish' ? 1.2 : 0.4);
      juice.shake(a.action === 'flourish' ? 0.25 : 0.06);
      juice.flash(color, a.action === 'flourish' ? 0.4 : 0.1, 0.2);
      juice.stretchHero(1);
    }),
    session.bus.on('duel', (d) => {
      const beat = conductor.beatAt(d.time);
      if (d.type === 'blocked') {
        onFury(fury.hit(beat), now);
        score += hitScore(d.judgement === 'perfect' ? 'perfect' : 'good', fury.mult);
      } else if (d.type === 'playerHit') {
        onFury(fury.hurt(beat), now);
        juice.flash(PALETTE.danger, 0.28, 0.3);
        juice.pop(
          'OUCH  FURY DOWN',
          arena.heroRig.root.position.clone().setY(2.3),
          PALETTE.danger,
          20,
          0.8,
        );
      } else if (d.type === 'defeated') {
        stats.finished++;
        score += 1000 * fury.mult;
        juice.flash(PALETTE.white, 0.45, 0.35);
        juice.pop('FINISHED', juice.enemyChest().setY(2.6), PALETTE.white, 36, 1.2);
      } else if (d.type === 'escaped') {
        stats.escaped++;
        juice.pop('ESCAPED', juice.enemyChest().setY(2.4), PALETTE.danger, 30, 1.1);
      }
    }),
  ];

  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__vrx = () => ({
      ...stats,
      score,
      tier: fury.tier,
      streak: fury.streak,
      enemies: enemies.map((e) => ({
        max: e.max,
        hp: Math.round(e.hp * 10) / 10,
        broken: e.brokenAt !== null,
      })),
    });
  }

  // ---------------------------------------------------------------- HUD

  const drawHp = (c: CanvasRenderingContext2D, t: number, w: number) => {
    const k = session.duel.activeEncounter(t);
    const e = k === null ? undefined : enemies[k];
    const status = k === null ? undefined : session.duel.enemies[k];
    if (!e || !status || status.state === 'waiting') return;
    const bw = 300;
    const x = w / 2 - bw / 2;
    const y = 46;
    const frac = e.hp / e.max;
    const broken = e.brokenAt !== null;
    c.fillStyle = 'rgba(0,8,3,0.85)';
    c.fillRect(x - 3, y - 3, bw + 6, 16);
    const pink = ACTION_SPECS.flourish.color;
    c.fillStyle = broken
      ? hexA(pink, 0.6 + 0.4 * beatPulse(conductor.beatAt(t), 3))
      : PALETTE.danger;
    c.fillRect(x, y, broken ? bw : bw * frac, 10);
    c.strokeStyle = hexA(PALETTE.white, 0.7);
    c.lineWidth = 1;
    c.strokeRect(x - 3, y - 3, bw + 6, 16);
    c.textAlign = 'center';
    c.font = 'bold 12px monospace';
    if (status.state !== 'fighting') return;
    const fin = finisherOf(k!);
    if (broken && fin) {
      const beatsLeft = Math.max(0, Math.ceil(conductor.beatAt(fin.time) - conductor.beatAt(t)));
      c.fillStyle = pink;
      c.font = 'bold 15px monospace';
      c.fillText(
        beatsLeft > 0 ? `BROKEN · FINISHER IN ${beatsLeft}` : 'FINISH HIM!',
        w / 2,
        y + 30,
      );
    } else if (fin && fin.time - t < spbAt(0) * bpb * 1.5) {
      c.fillStyle = hexA(PALETTE.danger, 0.6 + 0.4 * beatPulse(conductor.beatAt(t), 2));
      c.font = 'bold 15px monospace';
      c.fillText('BREAK IT BEFORE IT ESCAPES!', w / 2, y + 30);
    } else {
      c.fillStyle = hexA(PALETTE.white, 0.8);
      c.fillText(`HP ${Math.ceil(e.hp)} / ${e.max}`, w / 2, y + 28);
    }
  };

  const drawFury = (c: CanvasRenderingContext2D, t: number, w: number) => {
    const tr = tier();
    const x = w - 24;
    const y = 160;
    const pulse = beatPulse(conductor.beatAt(t), 3);
    c.textAlign = 'right';
    c.font = 'bold 13px monospace';
    c.fillStyle = hexA(tr.color, 0.85);
    c.fillText('FURY', x, y - 44);
    c.font = `bold ${46 + Math.round(fury.tier * 4 + pulse * 4)}px monospace`;
    c.fillStyle = tr.color;
    c.shadowColor = tr.color;
    c.shadowBlur = 4 + fury.tier * 2;
    c.fillText(tr.label, x, y);
    c.shadowBlur = 0;
    const bw = 150;
    c.fillStyle = 'rgba(0,8,3,0.8)';
    c.fillRect(x - bw, y + 10, bw, 8);
    c.fillStyle = tr.color;
    c.fillRect(x - bw, y + 10, bw * fury.progress, 8);
    const next = FURY_TIERS[fury.tier + 1];
    c.font = '11px monospace';
    c.fillStyle = hexA(PALETTE.white, 0.7);
    c.fillText(next ? `${next.at - fury.streak} on-beat to ${next.label}` : 'MAX FURY', x, y + 32);
    c.font = 'bold 18px monospace';
    c.fillStyle = PALETTE.white;
    c.fillText(score.toString().padStart(7, '0'), x, y + 58);
    c.font = '10px monospace';
    c.fillStyle = hexA(PALETTE.white, 0.55);
    c.fillText('FURY SCORE', x, y + 72);
  };

  /** NecroDancer-style beat bar: eighth ticks slide into a pulsing heart; blocks ride along. */
  const drawBeatBar = (c: CanvasRenderingContext2D, t: number, w: number, h: number) => {
    const beat = conductor.beatAt(t);
    if (!Number.isFinite(beat)) return;
    const cx = w / 2;
    const cy = h - 40;
    const half = Math.min(300, w * 0.3);
    const beatsShown = 3;
    const px = half / beatsShown;
    const tr = tier();
    c.fillStyle = 'rgba(0,8,3,0.7)';
    c.fillRect(cx - half - 10, cy - 20, half * 2 + 20, 40);
    for (
      let s = Math.ceil((beat - beatsShown) * 2);
      s <= Math.floor((beat + beatsShown) * 2);
      s++
    ) {
      const d = s / 2 - beat;
      const quarter = s % 2 === 0;
      const down = quarter && (((s / 2) % bpb) + bpb) % bpb === 0;
      const a = Math.max(0, 1 - Math.abs(d) / beatsShown);
      c.fillStyle = hexA(down ? PALETTE.white : tr.color, a * (quarter ? 0.95 : 0.5));
      const hh = down ? 16 : quarter ? 11 : 6;
      for (const side of [-1, 1]) {
        if (d < 0) continue;
        c.fillRect(cx + side * d * px - 1.5, cy - hh, 3, hh * 2);
      }
    }
    for (const cue of session.cuesBetween(t - 0.1, t + chart.tempo.beatToSec(beatsShown) + 1)) {
      if (session.duel.outcome(cue.id) !== 'pending') continue;
      const d = conductor.beatAt(cue.time) - beat;
      if (d < -0.1 || d > beatsShown) continue;
      const col = ACTION_SPECS[cue.action].color;
      for (const side of [-1, 1]) {
        const x = cx + side * d * px;
        c.fillStyle = 'rgba(0,0,0,0.6)';
        c.beginPath();
        c.arc(x, cy, 12, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = col;
        c.lineWidth = 2;
        c.stroke();
        drawActionIcon(c, cue.action, x, cy, 7, col);
      }
    }
    const pulse = beatPulse(beat, 4);
    const age = t - swingFlash.at;
    const sf = age < 0.15 ? 1 - age / 0.15 : 0;
    const heart =
      sf > 0
        ? swingFlash.quality === 'whiff'
          ? '#5d6b63'
          : swingFlash.quality === 'perfect'
            ? PALETTE.white
            : tr.color
        : tr.color;
    c.fillStyle = hexA(heart, 0.5 + 0.5 * Math.max(pulse, sf));
    const r = 11 + 6 * pulse + 4 * sf;
    c.beginPath();
    c.moveTo(cx, cy + r);
    c.lineTo(cx - r, cy);
    c.lineTo(cx, cy - r);
    c.lineTo(cx + r, cy);
    c.closePath();
    c.fill();
    c.font = 'bold 13px monospace';
    c.textAlign = 'right';
    c.fillStyle = hexA(ACTION_SPECS.block.color, 0.95);
    c.fillText('A  BLOCK', cx - half - 20, cy + 5);
    c.textAlign = 'left';
    c.fillStyle = hexA(tr.color, 0.95);
    c.fillText('S D F  ATTACK', cx + half + 20, cy + 5);
  };

  // ---------------------------------------------------------------- runtime

  return {
    mapInput(input: LaneInput, t: number) {
      if (input.lane === BLOCK_LANE) return input;
      if (!input.down) {
        if (!passUps.delete(input.lane)) return null;
        return { ...input, lane: FINISH_LANE };
      }
      const target = activeEnemy(input.time);
      const fin = target ? finisherOf(target.k) : null;
      if (
        target &&
        fin &&
        target.e.brokenAt !== null &&
        session.judge.isPending(fin.id) &&
        Math.abs(input.time - fin.time) <= JUDGEMENT_WINDOWS.good
      ) {
        passUps.add(input.lane);
        autoFinished.add(fin.id);
        return { ...input, lane: FINISH_LANE };
      }
      swing(input.lane, input.time, t);
      return null;
    },

    pollInputs(t) {
      if (autoplay) return [];
      const target = activeEnemy(t);
      const fin = target ? finisherOf(target.k) : null;
      if (!target || !fin || target.e.brokenAt === null) return [];
      if (autoFinished.has(fin.id) || !session.judge.isPending(fin.id)) return [];
      const lead = Math.max(0, Math.min(0.08, audio.currentTime - engine.ctxTimeFor(t)));
      if (t < fin.time - lead) return [];
      autoFinished.add(fin.id);
      return [
        { lane: FINISH_LANE, down: true, time: fin.time, moveAt: fin.time },
        { lane: FINISH_LANE, down: false, time: fin.time + 0.05 },
      ];
    },

    update(t, dt) {
      now = t;
      const beat = conductor.beatAt(t);
      if (autoplay) botStep(t);
      if (Number.isFinite(beat)) onFury(fury.idle(beat), t);
      // a quiet metronome ticks the grid in before the first enemy attacks
      if (beat < TICK_UNTIL_BEAT) {
        const next = Math.floor(beat) + 1;
        if (next > lastTickBeat && chart.tempo.beatToSec(next) - t < 0.12 && next >= 0) {
          lastTickBeat = next;
          sounds.lockOn(engine.ctxTimeFor(chart.tempo.beatToSec(next)));
        }
      }
      lastBeat = beat;
      world.color = tier().color;
      world.intensity = 0.55 + fury.tier * 0.3;
      const target = activeEnemy(t);
      const rig = arena.enemyRig();
      if (rig && target && target.e.brokenAt !== null) {
        const wob = Math.sin(t * 9);
        rig.torso.rotation.z += wob * 0.12;
        rig.body.rotation.x += 0.25;
        const m = rig.dizzy.material as THREE.MeshBasicMaterial;
        m.opacity = 0.9;
        rig.dizzy.rotation.z = t * 6;
      }
      juice.update(t, dt);
    },

    drawHud(c, t, w, h) {
      world.draw(c, w, h);
      drawHp(c, t, w);
      drawFury(c, t, w);
      drawBeatBar(c, t, w, h);
      juice.draw(c, t, w, h);
    },

    dispose() {
      off.forEach((f) => f());
      for (const g of engine.parts.values()) {
        g.gain.cancelScheduledValues(0);
        g.gain.value = 1;
      }
      accentBus.disconnect();
      world.dispose();
      juice.dispose();
      if (import.meta.env.DEV) delete (window as unknown as Record<string, unknown>).__vrx;
    },
  };
}

export const freestyle: Experiment = {
  key: 'freestyle',
  label: 'FREESTYLE ON THE BEAT',
  tagline: 'Only the enemy is charted. Attack freely on the beat; FURY climbs and the song grows.',
  hypothesis:
    'Expressive freedom is more fun than following a chart: if the player chooses when and how to attack (judged only against the beat grid) and the music grows with their streak, they feel like the author of the song.',
  inspiration: ['Metal: Hellsinger', 'Crypt of the NecroDancer'],
  howTo: [
    'Only enemy attacks are charted: press A to BLOCK when it winds up.',
    'Between them attack freely with S D F on any beat or half-beat. Off-beat swings whiff.',
    'On-beat streaks raise FURY x2 to x16: more damage, more music. Break the enemy before its finisher.',
  ],
  options: {
    highway: false,
    laneLabels: false,
    enemyIcon: true,
    prompts: false,
    musicMapping: 'sword',
    keys: ['KeyA', 'KeyS', 'KeyD', 'KeyF'],
    keyLegend: 'A block · S D F attack',
  },
  chart: buildFreestyleChart,
  create: createFreestyle,
};
