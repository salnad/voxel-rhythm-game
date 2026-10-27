import type { Action } from '../chart/types';
import { INSTRUMENT_BINDINGS, INSTRUMENT_TUNING as T } from '../config/instrumentMapping';
import { boom808, hatRoll, vocalChop } from './accents';
import { demoHarmony, leadNotesByBar, type CompEvent } from './demo/composition';
import { songEvents } from './songs';
import { playLeadNote } from './leadVoice';
import type { MusicLayerFactory } from './musicLayers';
import { PartGates } from './partGates';

interface PartChain {
  /** Live voices and the stem enter here. */
  input: GainNode;
  gate: GainNode;
  dry: GainNode;
  crush: GainNode;
  filter: BiquadFilterNode;
}

function crushCurve(): Float32Array<ArrayBuffer> {
  const c = new Float32Array(512);
  for (let i = 0; i < c.length; i++) {
    const x = (i / (c.length - 1)) * 2 - 1;
    c[i] = Math.round(Math.tanh(x * 2.5) * 4) / 4;
  }
  return c;
}

/**
 * Variant A: each move plays an instrument (see src/config/instrumentMapping.ts).
 * Every bound part runs through its own gate → filter → crush chain. A hit plays an accent
 * in the part's voice; a miss mutes or glitches the part until that action's next cue.
 * The lead is voiced live by the player's wavetable patch, so synth settings change how
 * SLASH sounds.
 */
export const instrumentLayer: MusicLayerFactory = ({ ctx, engine, chart, session }) => {
  const spb = 60 / chart.tempo.bpmAtBeat(0);
  const gates = new PartGates(INSTRUMENT_BINDINGS, T.maxMuteBars * spb * chart.beatsPerBar);
  const chains = new Map<string, PartChain>();
  const songEv = songEvents(chart.file.audio.procedural);
  const fallbackPart = engine.parts.has('mix') ? 'mix' : null;

  const chainFor = (name: string): PartChain | null => {
    const existing = chains.get(name);
    if (existing) return existing;
    const part = engine.parts.get(name);
    if (!part) return null;
    const input = ctx.createGain();
    const gate = ctx.createGain();
    const dry = ctx.createGain();
    const crush = ctx.createGain();
    crush.gain.value = 0;
    const shaper = ctx.createWaveShaper();
    shaper.curve = crushCurve();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 20000;
    part.disconnect();
    part.connect(input);
    input.connect(gate);
    gate.connect(dry).connect(filter);
    gate.connect(shaper).connect(crush).connect(filter);
    filter.connect(engine.musicBus);
    const c = { input, gate, dry, crush, filter };
    chains.set(name, c);
    return c;
  };
  for (const b of Object.values(INSTRUMENT_BINDINGS)) chainFor(b.part);
  if (fallbackPart) chainFor(fallbackPart);

  // the live lead replaces the rendered lead stem
  const leadPart = INSTRUMENT_BINDINGS.slash.part;
  const liveLead = T.liveLead && songEv !== null && chains.has(leadPart);
  const leadByBar: CompEvent[][] =
    liveLead && songEv ? leadNotesByBar(songEv, chart.beatsPerBar) : [];
  if (liveLead) engine.parts.get(leadPart)!.gain.value = 0;
  const scheduledPlays = new Set<string>();

  const chainOfAction = (a: Action) =>
    chains.get(INSTRUMENT_BINDINGS[a].part) ?? (fallbackPart ? chains.get(fallbackPart)! : null);

  const reopen = (c: PartChain, when: number) => {
    for (const p of [c.gate.gain, c.dry.gain, c.crush.gain, c.filter.frequency])
      p.cancelScheduledValues(when);
    c.gate.gain.setTargetAtTime(1, when, 0.008);
    c.dry.gain.setValueAtTime(1, when);
    c.crush.gain.setValueAtTime(0, when);
    c.filter.frequency.setValueAtTime(20000, when);
  };

  const knockOut = (a: Action, t: number) => {
    const c = chainOfAction(a);
    if (!c) return;
    const now = ctx.currentTime;
    const mode = INSTRUMENT_BINDINGS[a].onMiss;
    const step = spb / 8;
    const g = c.gate.gain;
    g.cancelScheduledValues(now);
    if (!chains.has(INSTRUMENT_BINDINGS[a].part)) {
      // audio-file map: a short stutter on the whole mix
      for (let k = 0; k < 4; k++) g.setValueAtTime(k % 2 ? 1 : 0.2, now + k * step);
      g.setValueAtTime(1, now + 4 * step);
      return;
    }
    gates.miss(a, t);
    let at = now;
    let on = false;
    const stutterEnd = now + T.stutterSeconds;
    while (at < stutterEnd) {
      g.setValueAtTime(on ? 1 : 0, at);
      on = !on;
      at += step;
    }
    if (mode === 'mute') {
      g.setValueAtTime(0, stutterEnd);
    } else {
      g.setValueAtTime(T.glitchLevel, stutterEnd);
      c.dry.gain.setValueAtTime(1 - T.glitchCrush, now);
      c.crush.gain.setValueAtTime(T.glitchCrush, now);
      c.filter.frequency.setValueAtTime(20000, now);
      c.filter.frequency.exponentialRampToValueAtTime(T.glitchFilterHz, now + 0.2);
    }
  };

  const accent = (a: Action, t: number) => {
    const c = chainOfAction(a);
    if (!c) return;
    const now = ctx.currentTime;
    const bar = session.conductor.playAt(t)?.bar ?? 0;
    const h = songEv
      ? demoHarmony(bar)
      : { root808: 38, leadTones: [74, 78, 81, 86], chord: [62, 66, 69, 74] };
    const top = Math.max(...h.chord);
    const lvl = T.accentLevel;
    switch (INSTRUMENT_BINDINGS[a].accent) {
      case 'boom808':
        boom808(ctx, c.input, now, h.root808 + 12, lvl);
        break;
      case 'leadPluck':
        for (const o of playLeadNote(
          ctx,
          c.input,
          now,
          h.leadTones[3] ?? 81,
          spb * 0.5,
          lvl * 1.4,
          session.patch,
        )) {
          engine.connectBend(o.detune);
        }
        break;
      case 'hatRoll':
        hatRoll(ctx, c.input, now, spb / 8, lvl);
        break;
      case 'vocalChop':
        vocalChop(ctx, c.input, now, top + 12, lvl, 'a');
        break;
    }
  };

  const off = [
    session.bus.on('action', (a) => {
      if (a.hit) {
        if (a.kind === 'holdEnd') return;
        const c = chainOfAction(a.action);
        if (c && gates.cue(a.action, a.time)) reopen(c, ctx.currentTime);
        accent(a.action, a.time);
      } else {
        knockOut(a.action, a.time);
      }
    }),
  ];

  return {
    update(t) {
      // a knocked-out part comes back on its action's next cue, right on time
      for (const c of session.cuesBetween(t, t + 0.15)) {
        if (c.time <= t) continue;
        const part = gates.cue(c.action, c.time);
        const chain = part ? chains.get(part) : null;
        if (chain) reopen(chain, engine.ctxTimeFor(c.time - 0.004));
      }
      for (const part of gates.expire(t)) {
        const chain = chains.get(part);
        if (chain) reopen(chain, ctx.currentTime);
      }
      if (!liveLead) return;
      const lead = chains.get(leadPart)!;
      for (const p of session.conductor.plays) {
        if (p.start > t + 0.2) break;
        const key = `${p.index}:${p.bar}:${p.attempt}`;
        if (p.start + p.dur < t || scheduledPlays.has(key)) continue;
        scheduledPlays.add(key);
        const barStart = chart.bars[p.bar]!.startBeat;
        for (const e of leadByBar[p.bar] ?? []) {
          const at = p.start + (e.beat - barStart) * spb;
          if (at < t) continue;
          for (const o of playLeadNote(
            ctx,
            lead.input,
            engine.ctxTimeFor(at),
            e.midi[0]!,
            e.len * spb,
            e.vel,
            session.patch,
          )) {
            engine.connectBend(o.detune);
          }
        }
      }
    },
    dispose() {
      off.forEach((f) => f());
    },
  };
};
