import {
  CR_BPM,
  CR_EXCHANGES,
  CR_INTRO_BARS,
  CR_SONG_NAME,
  composeCallResponse,
  type CallExchange,
} from '../audio/demo/callResponseSong';
import { beatKey, cueGroups } from '../audio/demo/keysounds';
import { ACTIONS, type Action } from '../chart/types';
import { ACTION_SPECS } from '../config/actions';
import { PALETTE } from '../config/visuals';
import { keyLabel } from '../core/settings';
import { drawActionIcon, hexA } from '../render/icons';
import type { Judgement } from '../rhythm/judge';
import { callResponseChart } from './audioFirst/charts';
import { Juice } from './audioFirst/juice';
import { KeysoundPlayer } from './audioFirst/keysoundPlayer';
import { insertMasterLimiter } from './audioFirst/mix';
import { onStrayPress } from './audioFirst/presses';
import { performEnvelope, punchEnvelope } from './audioFirst/timing';
import { NO_MUSIC_LAYER, type Experiment, type ExperimentContext } from './types';

const PUNCH = { perfect: 1, great: 0.7, good: 0.45, miss: 0 } as const;
/** How faint the call's ghost icons are while you answer (0 hides them). */
const GHOST_ALPHA = 0.16;

type Phase = 'intro' | 'call' | 'response' | 'outro';

interface Outcome {
  judgement: Judgement;
  at: number;
}

/** Where game time t falls: which exchange, which half, and how far through the bar. */
export function exchangeAt(
  beat: number,
  exchanges: readonly CallExchange[],
): { phase: Phase; x: CallExchange | null; frac: number } {
  const bar = Math.floor(beat / 4);
  const frac = beat / 4 - bar;
  if (bar < CR_INTRO_BARS) return { phase: 'intro', x: null, frac };
  const x = exchanges[Math.floor((bar - CR_INTRO_BARS) / 2)];
  if (!x) return { phase: 'outro', x: null, frac };
  return { phase: bar === x.callBar ? 'call' : 'response', x, frac };
}

function createCallResponse(c: ExperimentContext) {
  const { audio, engine, session, chart, arena, camera, keys, sfx } = c;
  const limiter = insertMasterLimiter(engine, audio, sfx);
  const player = new KeysoundPlayer(audio);
  player.bus.connect(engine.musicBus);
  void player.load(`${CR_SONG_NAME}:answers`, cueGroups(composeCallResponse()), CR_BPM);
  const juice = new Juice();
  /** Outcome of each answer note, by beatKey of its song beat. */
  const outcomes = new Map<number, Outcome>();
  const echoes = new Map<number, number>();
  const beatTime = (beat: number) => chart.tempo.beatToSec(beat);

  /** The call note the enemy is performing at t, with its envelope (0..1). */
  const performing = (
    t: number,
    release = 0.32,
  ): { action: Action; k: number; at: number } | null => {
    const { phase, x } = exchangeAt(session.conductor.beatAt(t), CR_EXCHANGES);
    if (phase !== 'call' || !x) return null;
    let best: { action: Action; k: number; at: number } | null = null;
    for (const n of x.notes) {
      const at = beatTime(x.callBar * 4 + n.beat);
      const k = performEnvelope(t - at, 0.12, release);
      if (k > 0 && (!best || k > best.k)) best = { action: n.action, k, at };
    }
    return best;
  };

  arena.setEnemyPoseFilter((pose) => {
    const { phase } = exchangeAt(session.conductor.beatAt(pose.t), CR_EXCHANGES);
    if (phase === 'call') {
      const p = performing(pose.t);
      return { ...pose, next: p && { action: p.action, progress: p.k } };
    }
    // while you answer the enemy only reacts: its wind-ups would give the phrase away
    if (phase === 'response') return { ...pose, next: null };
    return pose;
  });

  const off = [
    session.bus.on('judgement', (j) => {
      if (j.kind === 'holdEnd') return;
      const cue = session.conductor.cues[j.noteId];
      const note = cue && chart.notes[cue.noteId];
      if (!cue || !note) return;
      const at = j.judgement === 'miss' ? j.time : Math.max(cue.time, j.time);
      outcomes.set(beatKey(note.beat), { judgement: j.judgement, at });
      if (j.judgement === 'miss') {
        player.thunk();
        return;
      }
      player.hit(note.beat, engine.ctxTimeFor(cue.time), j.judgement);
      const strength = PUNCH[j.judgement] * (note.action === 'flourish' ? 1.5 : 1);
      juice.punch(at, strength, ACTION_SPECS[note.action].color);
      const x = CR_EXCHANGES.find((e) => e.responseBar === Math.floor(note.beat / 4));
      if (!x) return;
      const results = x.notes.map((n) => outcomes.get(beatKey(x.responseBar * 4 + n.beat)));
      if (results.every((r) => r && r.judgement !== 'miss')) echoes.set(x.index, at);
    }),
    onStrayPress(session, (lane) => player.ghost(ACTIONS[lane] ?? 'block')),
  ];

  const drawStrip = (ctx: CanvasRenderingContext2D, t: number, w: number) => {
    const beat = session.conductor.beatAt(t);
    const { phase, x, frac } = exchangeAt(beat, CR_EXCHANGES);
    if (phase === 'outro') return;
    const sw = Math.min(520, w * 0.46);
    const sh = 54;
    const x0 = w / 2 - sw / 2;
    const y0 = 50;
    const call = phase === 'call';
    const accent = call ? PALETTE.danger : PALETTE.green;
    ctx.fillStyle = 'rgba(0,10,4,0.62)';
    ctx.strokeStyle = hexA(accent, 0.7);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x0, y0, sw, sh, 8);
    ctx.fill();
    ctx.stroke();
    const pad = 22;
    const bx = (b: number) => x0 + pad + (b / 4) * (sw - pad * 2);
    // beat cells: the current beat lights up
    for (let b = 0; b < 4; b++) {
      const on = Math.floor(frac * 4) === b;
      ctx.fillStyle = hexA(accent, on ? 0.75 : 0.25);
      ctx.beginPath();
      ctx.arc(bx(b), y0 + sh - 9, on ? 3.5 : 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // playhead
    ctx.fillStyle = hexA(accent, 0.5);
    ctx.fillRect(bx(frac * 4) - 1, y0 + 6, 2, sh - 12);
    // label
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 18px monospace';
    const label = phase === 'intro' ? 'GET READY' : call ? 'LISTEN' : 'ANSWER';
    const pulse = call ? 0.65 + 0.35 * Math.pow(1 - ((frac * 4) % 1), 2) : 1;
    ctx.fillStyle = hexA(call ? '#ff8a8a' : '#e6ffe9', pulse);
    ctx.fillText(label, x0 - 14, y0 + sh / 2);
    ctx.textAlign = 'center';
    if (!x) return;
    for (const n of x.notes) {
      const cx = bx(n.beat);
      const cy = y0 + sh / 2 - 4;
      const color = ACTION_SPECS[n.action].color;
      if (call) {
        const at = beatTime(x.callBar * 4 + n.beat);
        if (t < at - 0.03) continue;
        const k = punchEnvelope(t - at);
        drawActionIcon(ctx, n.action, cx, cy, 13 + 7 * k, color);
      } else {
        const o = outcomes.get(beatKey(x.responseBar * 4 + n.beat));
        if (!o) {
          ctx.globalAlpha = GHOST_ALPHA;
          drawActionIcon(ctx, n.action, cx, cy, 13, color);
          ctx.globalAlpha = 1;
        } else if (o.judgement === 'miss') {
          ctx.globalAlpha = 0.35;
          drawActionIcon(ctx, n.action, cx, cy, 12, '#7a2a2a');
          ctx.globalAlpha = 1;
          ctx.strokeStyle = PALETTE.danger;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(cx - 9, cy - 9);
          ctx.lineTo(cx + 9, cy + 9);
          ctx.moveTo(cx + 9, cy - 9);
          ctx.lineTo(cx - 9, cy + 9);
          ctx.stroke();
        } else {
          const k = punchEnvelope(t - o.at);
          ctx.shadowColor = color;
          ctx.shadowBlur = 8 + 14 * k;
          drawActionIcon(ctx, n.action, cx, cy, 14 + 8 * k, color);
          ctx.shadowBlur = 0;
        }
      }
    }
    // a clean answer echoes back
    const echoAt = echoes.get(x.index);
    if (!call && echoAt !== undefined && t - echoAt < 0.9) {
      const k = Math.min(1, (t - echoAt) / 0.9);
      ctx.globalAlpha = 1 - k;
      ctx.font = `bold ${Math.round(22 + 8 * (1 - k))}px monospace`;
      ctx.fillStyle = PALETTE.white;
      ctx.fillText('ECHO!', w / 2, y0 + sh + 24 + 14 * k);
      ctx.globalAlpha = 1;
    }
  };

  return {
    update: (t: number) => {
      juice.apply(camera, t);
      const rig = arena.enemyRig();
      const p = performing(t, 0.45);
      if (!rig || !p) return;
      // the enemy performs: a squash-and-lunge on the note and its action icon popping overhead
      const pop = punchEnvelope(t - p.at);
      rig.root.scale.multiplyScalar(1 + 0.12 * pop);
      rig.root.position.z += 0.35 * pop;
      rig.icon.visible = true;
      rig.icon.material = rig.iconMats[p.action];
      rig.icon.material.opacity = Math.min(1, p.k * 1.4);
      rig.icon.scale.setScalar(0.55 + 0.45 * p.k + 0.25 * pop);
    },
    drawHud: (ctx: CanvasRenderingContext2D, t: number, w: number, h: number) => {
      juice.drawFlash(ctx, t, w, h);
      drawStrip(ctx, t, w);
      const p = performing(t, 0.45);
      const at = arena.enemyScreen();
      if (p && at) {
        const lane = ACTIONS.indexOf(p.action);
        ctx.globalAlpha = Math.min(1, p.k * 1.4);
        ctx.font = 'bold 24px monospace';
        ctx.fillStyle = ACTION_SPECS[p.action].color;
        ctx.textAlign = 'center';
        ctx.fillText(keyLabel(keys[lane] ?? ''), at.x + 64, at.y - 4);
        ctx.globalAlpha = 1;
      }
    },
    dispose: () => {
      off.forEach((f) => f());
      arena.setEnemyPoseFilter(null);
      player.dispose();
      limiter.dispose();
    },
  };
}

/**
 * Call and response: the enemy plays a one-bar phrase in its own voice and poses, then you
 * answer it in the next bar. Each correct answer plays the matching note in the hero's voice,
 * so the two bars sound like a duet. No highway: the memory of the call is the cue.
 */
export const callResponse: Experiment = {
  key: 'call-response',
  label: 'CALL & RESPONSE · ANSWER THE ENEMY',
  tagline: 'The enemy plays a one-bar phrase; you play it back in the next bar. No highway.',
  hypothesis:
    'Listen-and-repeat turns the duel into a musical conversation: with no highway, players watch the enemy, remember its phrase and answer it, and rate fun and music connection above baseline.',
  inspiration: ['Patapon', 'Rhythm Heaven', 'Simon'],
  howTo: [
    'The enemy plays a short phrase (LISTEN): watch its poses and the icons it shows.',
    'Next bar (ANSWER), play the same phrase back in the same rhythm.',
    'A block · S slash · D stab · F flourish. Your answers play the notes.',
  ],
  options: {
    highway: false,
    enemyIcon: false,
    musicMapping: NO_MUSIC_LAYER,
    keyLegend: 'A S D F',
  },
  chart: callResponseChart,
  create: createCallResponse,
};
