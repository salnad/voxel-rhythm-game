import type { Action } from '../../chart/types';
import type { DuelAction } from '../../combat/director';
import { leadNotesByBar } from '../demo/composition';
import { songEvents } from '../songs';
import { leadBus } from '../demo/render';
import { playLeadNote } from '../leadVoice';
import type { ActionMusicLayer, MusicLayerFactory } from '../musicLayers';
import { FlourishFx } from './flourishFx';
import {
  FLOURISH_LABEL,
  FlourishDirector,
  hitAccent,
  LANE_PART,
  lastOfCombo,
  LeadScheduler,
  missGlitch,
  type GainPoint,
} from './plan';

/** One performable part: its level (performer automation) and a crush send for glitches. */
interface PartVoice {
  level: AudioParam;
  crush: GainNode;
  dry: GainNode;
  /** False for a single "mix" stem: misses glitch it but never mute it. */
  mute: boolean;
}

/**
 * Variant C, the hybrid: moves play instruments (BLOCK = 808, SLASH = lead, STAB = hats and
 * percussion, FLOURISH = vocal chops). A hit performs that part with an accent; a miss
 * glitches it and mutes it until the move lands again. Clearing a full combo measure cleanly
 * fires a production flourish at the bar line (stutter fill, riser, filter-open or tape stop,
 * chosen by FlourishDirector). On the demo song the lead is voiced live by the player's
 * wavetable patch.
 */
export const hybridLayer: MusicLayerFactory = ({ ctx, engine, sfx, chart, session }) => {
  const spb = 60 / chart.tempo.bpmAtBeat(0);
  const fx = new FlourishFx(ctx, engine.musicBus);
  const voices = new Map<string, PartVoice>();
  const rerouted: GainNode[] = [];

  const makeVoice = (src: AudioNode, level: AudioParam, mute: boolean): PartVoice => {
    const dry = ctx.createGain();
    const crush = ctx.createGain();
    crush.gain.value = 0;
    src.connect(dry).connect(fx.input);
    src.connect(crusher(ctx)).connect(crush).connect(fx.input);
    return { level, crush, dry, mute };
  };

  const songEv = songEvents(chart.file.audio.procedural);
  const liveLead = songEv !== null && engine.parts.has('lead');
  for (const [name, part] of engine.parts) {
    part.disconnect();
    rerouted.push(part);
    if (name === 'lead' && liveLead) {
      part.gain.value = 0;
      continue;
    }
    const performed = Object.values(LANE_PART).includes(name) || name === 'mix';
    if (performed) voices.set(name, makeVoice(part, part.gain, name !== 'mix'));
    else part.connect(fx.input);
  }

  let leadIn: GainNode | null = null;
  let scheduler: LeadScheduler | null = null;
  if (liveLead) {
    leadIn = ctx.createGain();
    const leadLevel = ctx.createGain();
    leadBus(ctx, leadIn, leadLevel, spb);
    voices.set('lead', makeVoice(leadLevel, leadLevel.gain, true));
    scheduler = new LeadScheduler(chart, leadNotesByBar(songEv!, chart.beatsPerBar));
  }

  const voiceFor = (action: Action): PartVoice | undefined =>
    voices.get(LANE_PART[action]) ?? voices.get('mix');

  const apply = (p: AudioParam, pts: GainPoint[]) => {
    const first = pts[0];
    if (!first) return;
    const at = Math.max(ctx.currentTime, engine.ctxTimeFor(first.t));
    p.cancelScheduledValues(at);
    p.setValueAtTime(p.value, at);
    for (const pt of pts) {
      const tt = Math.max(at, engine.ctxTimeFor(pt.t));
      if (pt.ramp === 'set') p.setValueAtTime(pt.v, tt);
      else p.linearRampToValueAtTime(pt.v, tt + 0.005);
    }
  };

  const onAction = (a: DuelAction) => {
    const v = voiceFor(a.action);
    if (!v) return;
    if (a.judgement === 'miss') {
      const pts = missGlitch(a.time, spb, v.mute);
      apply(v.level, pts);
      const end = pts[pts.length - 1]!.t;
      apply(v.crush.gain, [
        { t: a.time, v: 0.9, ramp: 'set' },
        { t: end, v: 0, ramp: 'linear' },
      ]);
      apply(v.dry.gain, [
        { t: a.time, v: 0.35, ramp: 'set' },
        { t: end, v: 1, ramp: 'linear' },
      ]);
    } else if (a.kind !== 'holdEnd') {
      apply(v.crush.gain, [{ t: a.time, v: 0, ramp: 'linear' }]);
      apply(v.dry.gain, [{ t: a.time, v: 1, ramp: 'linear' }]);
      if (v.mute) apply(v.level, hitAccent(a.time, a.judgement, spb));
    }
  };

  const director = new FlourishDirector();
  const label = flourishLabel();
  let pendingLabel: { at: number; text: string } | null = null;

  const off = [
    session.bus.on('input', (i) => {
      if (i.down) sfx.swing(chart.lanes[i.lane] as Action);
    }),
    session.bus.on('action', onAction),
    session.bus.on('duel', (d) => {
      if (d.type === 'recovered') sfx.clank();
      else if (d.type === 'defeated') sfx.shatter();
    }),
    session.bus.on('combo', (c) => {
      if (c.type === 'failed') {
        director.failed();
        return;
      }
      const pick = director.cleared(c.play, lastOfCombo(chart, c.play.bar));
      const barLine = c.play.start + c.play.dur;
      const fillStart = Math.max(c.time, barLine - pick.fillBeats * spb);
      fx.play(pick, engine.ctxTimeFor(fillStart), engine.ctxTimeFor(barLine), spb);
      pendingLabel = { at: fillStart, text: `FLOURISH · ${FLOURISH_LABEL[pick.kind]}` };
    }),
  ];

  const layer: ActionMusicLayer = {
    update(t) {
      if (scheduler && leadIn) {
        for (const n of scheduler.due(session.conductor.plays, t)) {
          const at = Math.max(ctx.currentTime, engine.ctxTimeFor(n.time));
          for (const o of playLeadNote(ctx, leadIn, at, n.midi, n.len, n.vel, session.patch))
            engine.connectBend(o.detune);
        }
      }
      if (pendingLabel && t >= pendingLabel.at) {
        label?.show(pendingLabel.text);
        pendingLabel = null;
      }
    },
    dispose() {
      off.forEach((f) => f());
      fx.dispose();
      leadIn?.disconnect();
      label?.remove();
      for (const p of rerouted) {
        p.disconnect();
        p.connect(engine.musicBus);
      }
    },
  };
  return layer;
};

/** A small on-screen tag naming the flourish, so playtesters can tell them apart. */
function flourishLabel(): { show(text: string): void; remove(): void } | null {
  if (typeof document === 'undefined') return null;
  const el = document.createElement('div');
  el.className = 'flourish-tag';
  Object.assign(el.style, {
    position: 'fixed',
    left: '50%',
    top: '88px',
    transform: 'translateX(-50%)',
    font: 'bold 15px monospace',
    letterSpacing: '0.12em',
    color: '#ffd84a',
    textShadow: '0 0 8px #ffd84a',
    pointerEvents: 'none',
    opacity: '0',
    transition: 'opacity 0.5s',
    zIndex: '20',
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(el);
  let timer = 0;
  return {
    show(text) {
      el.textContent = text;
      el.style.transition = 'none';
      el.style.opacity = '1';
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        el.style.transition = 'opacity 0.5s';
        el.style.opacity = '0';
      }, 1100);
    },
    remove() {
      window.clearTimeout(timer);
      el.remove();
    },
  };
}

function crusher(ctx: BaseAudioContext): WaveShaperNode {
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.round(Math.tanh(x * 2.5) * 4) / 4;
  }
  const s = ctx.createWaveShaper();
  s.curve = curve;
  return s;
}
