import type { Action } from '../../chart/types';
import { ACTION_SPECS } from '../../config/actions';
import { PALETTE } from '../../config/visuals';
import { hexA } from '../../render/icons';
import type { LaneInput } from '../../rhythm/input';
import type { Judgement } from '../../rhythm/judge';
import { beatApproach } from '../juice/beat';
import { Juice } from '../juice/juice';
import { JuiceSounds } from '../juice/sounds';
import { BeatWorld } from '../juice/world';
import type { Experiment, ExperimentContext, ExperimentRuntime } from '../types';
import { BeatQueue, cueForPress, holdUntil, ON_BEAT_WINDOWS, type LaneCue } from './logic';

const STRENGTH: Record<Judgement, number> = { perfect: 1, great: 0.85, good: 0.7, miss: 0 };

function createOnBeat(ctx: ExperimentContext): ExperimentRuntime {
  const { session, chart, engine, audio, sfx, arena } = ctx;
  const juice = new Juice(ctx.scene, ctx.camera, arena);
  const sounds = new JuiceSounds(audio, sfx.output);
  const world = new BeatWorld(ctx, {
    grid: true,
    heroRing: true,
    enemyBob: 0.06,
    rain: 0.3,
    camera: 0.5,
    frame: 0.2,
  });
  const queue = new BeatQueue();
  const released: LaneInput[] = [];
  /** Cue ids whose impact sound is already scheduled on their beat. */
  const onBeat = new Set<number>();
  let squash = 0;

  const laneCues = (lane: number): LaneCue[] =>
    session.conductor.cues
      .filter((c) => c.lane === lane && !c.removed && session.judge.isPending(c.id))
      .sort((a, b) => a.time - b.time);

  const actionOf = (lane: number) => chart.lanes[lane] as Action | undefined;

  /** Instant press feedback: a blade-draw sound and a spark at the blade. */
  const pressFx = (action: Action) => {
    sounds.draw(action);
    juice.sparks(juice.bladeTip(), ACTION_SPECS[action].color, 4, 2.5);
  };

  const off = [
    session.bus.on('input', (i) => {
      if (!i.down || !i.auto) return;
      const a = actionOf(i.lane);
      if (a) pressFx(a);
    }),
    session.bus.on('action', (a) => {
      if (a.kind === 'holdEnd') return;
      if (!a.hit) {
        if (a.kind === 'tap' && a.judgement === 'miss') juice.flash(PALETTE.danger, 0.1, 0.18);
        return;
      }
      const s = STRENGTH[a.judgement];
      const color = ACTION_SPECS[a.action].color;
      if (!onBeat.delete(a.noteId)) sounds.impact(a.action, s);
      const at = a.action === 'block' ? juice.clashPoint() : juice.enemyChest();
      juice.sparks(at, color, Math.round(10 + 14 * s), 5);
      juice.sparks(at, PALETTE.white, 5, 6);
      juice.punch(a.action === 'flourish' ? 1 : 0.35 + 0.35 * s);
      juice.shake(a.action === 'flourish' ? 0.18 : 0.05);
      juice.flash(color, 0.06 + 0.08 * s, 0.12);
      juice.stretchHero(1);
      if (a.action !== 'block') juice.flinchEnemy(0.6 + 0.4 * s);
    }),
    session.bus.on('duel', (d) => {
      if (d.type === 'playerHit') juice.flash(PALETTE.danger, 0.22, 0.25);
      if (d.type === 'defeated') juice.flash(PALETTE.white, 0.35, 0.3);
    }),
  ];

  return {
    mapInput(input) {
      if (!input.down) return queue.up(input) ? null : input;
      const action = actionOf(input.lane);
      if (!action) return input;
      pressFx(action);
      const cue = cueForPress(laneCues(input.lane), input.time, ON_BEAT_WINDOWS);
      const at = holdUntil(cue, input.time, ON_BEAT_WINDOWS);
      if (at === null || !cue) return input;
      released.push(...queue.hold(input, at, cue.id));
      onBeat.add(cue.id);
      sounds.impact(action, 1, engine.ctxTimeFor(at));
      juice.pop('ON BEAT', juice.clashPoint().setY(2.4), hexA(PALETTE.white, 0.9), 15, 0.5);
      return null;
    },

    pollInputs(t) {
      const lead = Math.max(0, Math.min(0.08, audio.currentTime - engine.ctxTimeFor(t)));
      const out = released.splice(0, released.length);
      out.push(...queue.due(t, lead));
      return out;
    },

    update(t, dt) {
      world.update(t);
      squash += ((queue.size > 0 ? 1 : 0) - squash) * Math.min(1, dt * 30);
      juice.squashHero(squash);
      juice.update(t, dt);
    },

    drawHud(c, t, w, h) {
      world.draw(c, w, h);
      drawBeatMeter(c, session.conductor.beatAt(t), arena.laneScreen(), chart.beatsPerBar);
      juice.draw(c, t, w, h);
    },

    dispose() {
      off.forEach((f) => f());
      world.dispose();
      juice.dispose();
    },
  };
}

/**
 * Hi-Fi Rush style beat meter on the hit line: dots slide in from both sides of
 * the highway and land in pulsing cores at its edges on every beat.
 */
function drawBeatMeter(
  c: CanvasRenderingContext2D,
  beat: number,
  lanes: { xs: number[]; y: number; width: number },
  bpb: number,
) {
  if (!Number.isFinite(beat) || lanes.xs.length === 0) return;
  const left = Math.min(...lanes.xs) - lanes.width * 0.8;
  const right = Math.max(...lanes.xs) + lanes.width * 0.8;
  const cy = lanes.y;
  const a = beatApproach(beat);
  const pulse = Math.pow(1 - a, 4);
  const spacing = 34;
  for (let n = 1; n <= 3; n++) {
    const d = (n - a) * spacing;
    const b = Math.floor(beat) + n;
    const down = ((b % bpb) + bpb) % bpb === 0;
    const r = down ? 6 : 4;
    c.globalAlpha = Math.max(0, 1 - (n - a) / 3.2);
    c.fillStyle = down ? PALETTE.white : PALETTE.green;
    for (const x of [left - d, right + d]) {
      c.beginPath();
      c.arc(x, cy, r, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.globalAlpha = 1;
  for (const x of [left, right]) {
    c.strokeStyle = hexA(PALETTE.green, 0.5 + 0.5 * pulse);
    c.lineWidth = 2 + 3 * pulse;
    c.beginPath();
    c.arc(x, cy, 9 + 6 * pulse, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = hexA(PALETTE.white, 0.25 + 0.7 * pulse);
    c.beginPath();
    c.arc(x, cy, 4 + 4 * pulse, 0, Math.PI * 2);
    c.fill();
  }
}

export const onBeat: Experiment = {
  key: 'on-beat',
  label: 'ON-BEAT ASSIST',
  tagline: 'Forgiving timing; every hit resolves exactly on the beat, and the arena pulses.',
  hypothesis:
    'When the game reacts on the beat instead of on your key press, everyone feels on-rhythm: generous windows plus on-beat reactions beat precise judging for fun and flow.',
  inspiration: ['Hi-Fi Rush'],
  howTo: [
    'Same four lanes: A block · S slash · D stab · F flourish.',
    'Timing is generous. Press a bit early and the hero coils, then strikes right on the beat.',
    'Everything pulses with the music: ride the pulse, not the numbers.',
  ],
  options: { musicMapping: 'instruments', keyLegend: 'A S D F', windows: ON_BEAT_WINDOWS },
  create: createOnBeat,
};
