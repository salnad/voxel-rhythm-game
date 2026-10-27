import { ACTIONS, type Action } from '../chart/types';
import { ACTION_SPECS } from '../config/actions';
import { keyLabel } from '../core/settings';
import type { Cue } from '../game/conductor';
import { hexA } from '../render/icons';
import { byEarChart } from './audioFirst/charts';
import { CountInVoices } from './audioFirst/countInVoices';
import { Juice } from './audioFirst/juice';
import { insertMasterLimiter } from './audioFirst/mix';
import { countInPlan, teachAlpha, type CountInEvent } from './audioFirst/timing';
import type { Experiment, ExperimentContext, ExperimentRuntime } from './types';

/** Icons and key letters ride along with the count-ins until this beat, then fade out. */
export const BY_EAR_TEACH_UNTIL_BEAT = 36;
export const BY_EAR_TEACH_FADE_BEATS = 20;
/** Count-ins are committed to the audio clock this far (s) ahead of their start. */
const SCHEDULE_AHEAD = 0.2;
const SOUND_NAME: Record<Action, string> = {
  block: 'HUP!',
  slash: 'WHOOSH',
  stab: 'TICK TICK',
  flourish: '3, 2…',
};
const PUNCH = { perfect: 1, great: 0.7, good: 0.45, miss: 0 } as const;

interface Pending {
  cue: Cue;
  events: CountInEvent[];
  nodes: AudioScheduledSourceNode[][];
}

function createByEar(x: ExperimentContext): ExperimentRuntime {
  const { audio, engine, session, chart, arena, camera, keys, sfx } = x;
  const spb = 60 / chart.tempo.bpmAtBeat(0);
  const limiter = insertMasterLimiter(engine, audio, sfx);
  const voices = new CountInVoices(audio);
  const level = audio.createGain();
  level.gain.value = 0.9;
  voices.bus.connect(level).connect(engine.output);
  const juice = new Juice();
  const pending = new Map<number, Pending>();

  const stop = (p: Pending) => {
    const now = audio.currentTime;
    p.events.forEach((e, i) => {
      if (engine.ctxTimeFor(e.time) <= now) return;
      for (const n of p.nodes[i] ?? []) {
        try {
          n.stop();
        } catch {
          /* not started */
        }
      }
    });
  };

  const off = [
    session.bus.on('cues', (cues) => {
      for (const cue of cues)
        pending.set(cue.id, { cue, events: countInPlan(cue.action, cue.time, spb), nodes: [] });
    }),
    session.bus.on('cuesDropped', (ids) => {
      for (const id of ids) {
        const p = pending.get(id);
        if (!p) continue;
        stop(p);
        pending.delete(id);
      }
    }),
    session.bus.on('action', (a) => {
      if (!a.hit || a.kind === 'holdEnd') return;
      const cue = session.conductor.cues[a.noteId];
      const at = Math.max(cue?.time ?? a.time, a.time);
      juice.punch(
        at,
        PUNCH[a.judgement] * (a.action === 'flourish' ? 1.4 : 1),
        ACTION_SPECS[a.action].color,
      );
    }),
  ];

  /** Commit count-ins that start soon to the audio clock. */
  const schedule = () => {
    const now = audio.currentTime;
    for (const [id, p] of pending) {
      p.events.forEach((e, i) => {
        if (p.nodes[i]) return;
        const at = engine.ctxTimeFor(e.time);
        if (at > now + SCHEDULE_AHEAD) return;
        const bar = session.conductor.playAt(e.time)?.bar ?? p.cue.bar;
        p.nodes[i] =
          at < now - 0.03 ? [] : voices.play(e.kind, Math.max(at, now), e.dur, bar, e.step);
      });
      if (engine.ctxTimeFor(p.cue.time) < now - 2) pending.delete(id);
    }
  };

  /** The cue whose count-in is sounding at game time t (for the teaching icons). */
  const announced = (t: number): { cue: Cue; progress: number } | null => {
    let best: { cue: Cue; progress: number } | null = null;
    for (const p of pending.values()) {
      const start = p.events[0]!.time;
      if (t < start || t > p.cue.time + 0.08) continue;
      if (session.judge.isVoid(p.cue.id) || p.cue.removed) continue;
      if (!best || p.cue.time < best.cue.time)
        best = {
          cue: p.cue,
          progress: Math.min(1, (t - start) / Math.max(0.01, p.cue.time - start)),
        };
    }
    return best;
  };

  return {
    update: (t) => {
      schedule();
      juice.apply(camera, t);
      const rig = arena.enemyRig();
      if (!rig) return;
      const beat = session.conductor.beatAt(t);
      const alpha = teachAlpha(beat, BY_EAR_TEACH_UNTIL_BEAT, BY_EAR_TEACH_FADE_BEATS);
      const a = alpha > 0 ? announced(t) : null;
      if (!a) return;
      rig.icon.visible = true;
      rig.icon.material = rig.iconMats[a.cue.action];
      rig.icon.material.opacity = alpha * (0.55 + 0.45 * a.progress);
      rig.icon.scale.setScalar(0.55 + 0.25 * a.progress);
    },
    drawHud: (c, t, w, h) => {
      juice.drawFlash(c, t, w, h);
      const beat = session.conductor.beatAt(t);
      const alpha = teachAlpha(beat, BY_EAR_TEACH_UNTIL_BEAT, BY_EAR_TEACH_FADE_BEATS);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      if (alpha > 0) {
        const a = announced(t);
        const at = arena.enemyScreen();
        if (a && at) {
          const color = ACTION_SPECS[a.cue.action].color;
          const lane = ACTIONS.indexOf(a.cue.action);
          c.globalAlpha = alpha;
          c.font = 'bold 26px monospace';
          c.fillStyle = color;
          c.shadowColor = color;
          c.shadowBlur = 10;
          c.fillText(keyLabel(keys[lane] ?? ''), at.x + 62, at.y - 6);
          c.shadowBlur = 0;
          c.font = 'bold 15px monospace';
          c.textAlign = 'right';
          c.fillText(SOUND_NAME[a.cue.action], at.x - 48, at.y - 6);
          c.textAlign = 'center';
          c.globalAlpha = 1;
        }
        if (beat > BY_EAR_TEACH_UNTIL_BEAT - 4) {
          c.font = 'bold 15px monospace';
          c.fillStyle = hexA('#e6ffe9', Math.min(1, (1 - alpha) * 3) * 0.9);
          c.fillText('THE KEYS FADE OUT · KEEP LISTENING', w / 2, h * 0.2);
        }
      } else if (beat < BY_EAR_TEACH_UNTIL_BEAT + BY_EAR_TEACH_FADE_BEATS + 8) {
        c.font = 'bold 16px monospace';
        c.fillStyle = 'rgba(230,255,233,0.85)';
        c.fillText('EARS ONLY', w / 2, h * 0.2);
      }
    },
    dispose: () => {
      off.forEach((f) => f());
      for (const p of pending.values()) stop(p);
      pending.clear();
      voices.dispose();
      level.disconnect();
      limiter.dispose();
    },
  };
}

/**
 * Play by ear: no highway, no icons, no key boxes. Each action has its own audio count-in at a
 * fixed musical lead (one beat, two for FLOURISH), pitched to the song's chords. The first
 * enemy shows the icon and key with each count-in, then they fade out.
 */
export const byEar: Experiment = {
  key: 'by-ear',
  label: 'BY EAR · SOUND CUES ONLY',
  tagline: 'No highway, no icons: every move is announced by its own sound a beat ahead.',
  hypothesis:
    'With a distinct audio count-in per action at a fixed musical lead, players can play by ear with their eyes on the fight and rate control and music connection at least as high as baseline, so the game can be fully music-first.',
  inspiration: ['Rhythm Heaven', 'Rhythm Doctor', 'Patapon'],
  howTo: [
    'No cues on screen: each move is announced by a sound, and you hit on the next beat.',
    '"HUP!" = A block · rising whoosh = S slash · tick-tick = D stab.',
    'A voice counting "three, two" = F flourish: hit on the "one".',
    'The first enemy shows the key with each sound, then it is ears only.',
  ],
  options: {
    highway: false,
    laneLabels: false,
    enemyIcon: false,
    musicMapping: 'sword',
    keyLegend: 'A S D F',
  },
  chart: byEarChart,
  create: createByEar,
};
