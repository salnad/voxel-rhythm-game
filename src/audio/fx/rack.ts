import type { Action } from '../../chart/types';
import { LIFT, PUMP, STUTTER, SWEEP, type FxKind } from '../../config/productionFx';
import type { Judgement } from '../../rhythm/judge';
import type { MusicLayerFactory } from '../musicLayers';
import { directFx, type FxCommand } from './director';
import {
  clipShape,
  joinTail,
  liftFumbleShapes,
  liftShapes,
  pumpDelay,
  pumpFumbleShape,
  pumpHoldShape,
  pumpReleaseShape,
  pumpShape,
  scaleDuck,
  shifterSemis,
  stutterFumblePlan,
  stutterPlan,
  SWEEP_ATTACK_END,
  sweepFumbleShapes,
  sweepShapes,
  warpShape,
  type Shape,
  type StutterPlan,
} from './plan';
import { Trace, type FxMeter } from './trace';

/** Shortest ramp into a new effect (s), so retriggers don't click. */
const DECLICK = 0.004;
/** Scheduling headroom past currentTime (s). */
const HEADROOM = 0.003;
/** Traces forget automation older than this (s). */
const TRACE_KEEP = 4;

/** An AudioParam plus a Trace of everything scheduled on it. */
class Auto {
  readonly trace: Trace;

  constructor(readonly param: AudioParam) {
    this.trace = new Trace(param.value);
  }

  /** Freeze at the current value from `at`, dropping later automation. */
  hold(at: number): void {
    this.trace.prune(at - TRACE_KEEP);
    const p = this.param;
    if (typeof p.cancelAndHoldAtTime === 'function') {
      p.cancelAndHoldAtTime(at);
    } else {
      p.cancelScheduledValues(at);
      p.setValueAtTime(this.trace.valueAt(at), at);
    }
    this.trace.hold(at);
  }

  cancel(at: number): void {
    this.param.cancelScheduledValues(at);
    this.trace.cancel(at);
  }

  set(v: number, t: number): void {
    this.param.setValueAtTime(v, t);
    this.trace.set(v, t);
  }

  ramp(v: number, t: number): void {
    this.param.linearRampToValueAtTime(v, t);
    this.trace.ramp(v, t);
  }

  /** Follow `shape` anchored at `anchor`, starting no earlier than `now`. */
  play(shape: Shape, anchor: number, now: number): void {
    this.hold(now);
    clipShape(shape, anchor, now).forEach((pt, i) => {
      this.ramp(pt.value, i === 0 ? Math.max(pt.time, now + DECLICK) : pt.time);
    });
  }

  at(t: number): number {
    return this.trace.valueAt(t);
  }
}

/**
 * Delay-line pitch shifter: two taps whose delay falls along a sawtooth, crossfaded so each
 * tap is silent when its delay wraps. Pitch ratio = 1 + window × rate, so automating `rate`
 * (one ConstantSource driving all three oscillators, which keeps them phase-locked) sweeps
 * the pitch. Negative rates pitch down.
 */
class PitchShifter {
  readonly input: GainNode;
  readonly output: GainNode;
  readonly rate: AudioParam;
  private readonly sources: AudioScheduledSourceNode[] = [];

  constructor(ctx: BaseAudioContext, window: number) {
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    const rate = ctx.createConstantSource();
    rate.offset.value = 0;
    this.rate = rate.offset;
    const harmonics = 48;
    const real = new Float32Array(harmonics + 1);
    const sawA = new Float32Array(harmonics + 1);
    const sawB = new Float32Array(harmonics + 1);
    for (let n = 1; n <= harmonics; n++) {
      // saw(x) rises -1 → 1 and wraps at x = π; sawB is the same shifted by π (wraps at 0)
      sawA[n] = ((2 / Math.PI) * (n % 2 === 1 ? 1 : -1)) / n;
      sawB[n] = -(2 / Math.PI) / n;
    }
    const cosWave = new Float32Array(harmonics + 1);
    cosWave[1] = 1;
    const opts = { disableNormalization: true };
    const osc = (re: Float32Array, im: Float32Array) => {
      const o = ctx.createOscillator();
      o.setPeriodicWave(ctx.createPeriodicWave(re, im, opts));
      o.frequency.value = 0;
      rate.connect(o.frequency);
      this.sources.push(o);
      return o;
    };
    const cos = osc(cosWave, new Float32Array(harmonics + 1));
    const taps: Array<[OscillatorNode, number]> = [
      [osc(real, sawA), 0.5],
      [osc(real, sawB), -0.5],
    ];
    for (const [saw, sign] of taps) {
      const delay = ctx.createDelay(window * 2);
      delay.delayTime.value = window / 2;
      const depth = ctx.createGain();
      depth.gain.value = -window / 2;
      saw.connect(depth).connect(delay.delayTime);
      const win = ctx.createGain();
      win.gain.value = 0.5;
      const winDepth = ctx.createGain();
      winDepth.gain.value = sign;
      cos.connect(winDepth).connect(win.gain);
      this.input.connect(delay).connect(win).connect(this.output);
    }
    this.sources.push(rate);
    const t = ctx.currentTime;
    for (const s of this.sources) s.start(t);
  }

  dispose(): void {
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }
  }
}

interface Trigger {
  at: number;
  judgement: Judgement;
}

/**
 * The effects chain, spliced between the song's stems and the engine's music bus:
 *
 *   stems ─ pump ─┬─ low-pass → high-pass → (dry | pitch shifter) → (dry | beat-repeat) → gap → music bus
 *   exempt ─ pump tail ─┘
 *
 * Pump-exempt stems (the demo's 808) skip the main duck, so the kick drives it, and only their
 * tail ducks (PUMP.exemptDepth). The noise riser goes straight to the music bus.
 */
export class FxRack {
  readonly input: GainNode;
  readonly exempt: GainNode;
  readonly output: GainNode;
  private readonly pump: Auto;
  private readonly exemptPump: Auto;
  private readonly lpFreq: Auto;
  private readonly lpQ: Auto;
  private readonly hpFreq: Auto;
  private readonly liftDry: Auto;
  private readonly liftWet: Auto;
  private readonly liftRate: Auto;
  private readonly riser: Auto;
  private readonly riserHz: Auto;
  private readonly gap: Auto;
  private readonly shifter: PitchShifter;
  private readonly stutDry: Auto;
  private readonly stutDelay: AudioParam;
  private readonly stutTone: Auto;
  private readonly stutGate: Auto;
  private readonly noise: AudioBufferSourceNode;
  private stutterEnd = 0;
  private stutters: Array<StutterPlan & { id: number; unit: number }> = [];
  private nextStutter = 1;
  private readonly last: Record<FxKind, Trigger | null> = {
    pump: null,
    sweep: null,
    stutter: null,
    lift: null,
  };

  constructor(
    private readonly ctx: BaseAudioContext,
    riserOut: AudioNode,
  ) {
    const gain = (v = 1) => {
      const g = ctx.createGain();
      g.gain.value = v;
      return g;
    };
    this.input = gain();
    this.exempt = gain();
    const pump = gain();
    const exemptPump = gain();
    this.pump = new Auto(pump.gain);
    this.exemptPump = new Auto(exemptPump.gain);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = SWEEP.openHz;
    lp.Q.value = 0.7;
    this.lpFreq = new Auto(lp.frequency);
    this.lpQ = new Auto(lp.Q);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 20;
    hp.Q.value = 0.9;
    this.hpFreq = new Auto(hp.frequency);
    this.input.connect(pump).connect(lp);
    this.exempt.connect(exemptPump).connect(lp);
    lp.connect(hp);

    const mid = gain();
    const liftDry = gain();
    const liftWet = gain(0);
    this.liftDry = new Auto(liftDry.gain);
    this.liftWet = new Auto(liftWet.gain);
    this.shifter = new PitchShifter(ctx, LIFT.windowSec);
    this.liftRate = new Auto(this.shifter.rate);
    hp.connect(liftDry).connect(mid);
    hp.connect(this.shifter.input);
    this.shifter.output.connect(liftWet).connect(mid);

    const gapNode = gain();
    this.gap = new Auto(gapNode.gain);
    this.output = gapNode;
    const stutDry = gain();
    this.stutDry = new Auto(stutDry.gain);
    const stutDelay = ctx.createDelay(2);
    stutDelay.delayTime.value = 0;
    this.stutDelay = stutDelay.delayTime;
    const stutTone = ctx.createBiquadFilter();
    stutTone.type = 'lowpass';
    stutTone.frequency.value = 20000;
    this.stutTone = new Auto(stutTone.frequency);
    const stutGate = gain(0);
    this.stutGate = new Auto(stutGate.gain);
    mid.connect(stutDry).connect(gapNode);
    mid.connect(stutDelay).connect(stutTone).connect(stutGate).connect(gapNode);

    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noise = ctx.createBufferSource();
    this.noise.buffer = buf;
    this.noise.loop = true;
    const riserBp = ctx.createBiquadFilter();
    riserBp.type = 'bandpass';
    riserBp.Q.value = 2.5;
    this.riserHz = new Auto(riserBp.frequency);
    const riser = gain(0);
    this.riser = new Auto(riser.gain);
    this.noise.connect(riserBp).connect(riser).connect(riserOut);
    this.noise.start();
  }

  private get now(): number {
    return this.ctx.currentTime + HEADROOM;
  }

  /** `toCtx` maps game time to context time. */
  run(c: FxCommand, toCtx: (t: number) => number): void {
    const now = this.now;
    if (c.type === 'release') {
      if (c.fx === 'pump') {
        const s = pumpReleaseShape(c.beat, c.fumble);
        this.pump.play(s, now, now);
        this.exemptPump.play(scaleDuck(s, PUMP.exemptDepth / PUMP.depth), now, now);
      }
      return;
    }
    const anchor = toCtx(c.anchor);
    const lag = now - anchor;
    const tail = joinTail(c.beat);
    this.last[c.fx] = { at: Math.max(now, anchor), judgement: c.judgement };
    switch (c.fx) {
      case 'pump': {
        const delay = pumpDelay(lag);
        const base = c.fumble
          ? pumpFumbleShape(c.beat)
          : c.sustain
            ? pumpHoldShape(c.amount, delay)
            : pumpShape(c.amount, c.beat, delay);
        const s = warpShape(base, lag, delay + PUMP.attack, tail);
        this.pump.play(s, anchor, now);
        this.exemptPump.play(scaleDuck(s, PUMP.exemptDepth / PUMP.depth), anchor, now);
        break;
      }
      case 'sweep': {
        const s = c.fumble ? sweepFumbleShapes(c.beat) : sweepShapes(c.amount, c.beat);
        const end = c.fumble ? 0.06 : SWEEP_ATTACK_END;
        this.lpFreq.play(warpShape(s.freq, lag, end, tail), anchor, now);
        this.lpQ.play(warpShape(s.q, lag, end, tail), anchor, now);
        break;
      }
      case 'stutter': {
        const plan =
          c.judgement === 'miss'
            ? stutterFumblePlan(now, c.beat)
            : stutterPlan(anchor, now, c.beat, c.judgement);
        if (plan) this.stutter(plan, now, STUTTER.sliceBeats * c.beat);
        break;
      }
      case 'lift': {
        const span = toCtx(c.target ?? c.anchor + 4 * c.beat) - anchor;
        const s = c.fumble ? liftFumbleShapes(span) : liftShapes(c.amount, span, c.beat);
        this.liftRate.play(s.rate, anchor, now);
        this.liftWet.play(s.wet, anchor, now);
        this.liftDry.play(s.dry, anchor, now);
        this.riser.play(s.riser, anchor, now);
        this.riserHz.play(s.riserHz, anchor, now);
        this.hpFreq.play(s.hp, anchor, now);
        this.gap.play(s.gap, anchor, now);
        break;
      }
    }
  }

  private stutter(plan: StutterPlan, now: number, unit: number): void {
    const first = plan.slices[0];
    if (!first) return;
    // a new stutter takes over from one still repeating
    const gate = this.stutGate;
    gate.hold(now);
    gate.ramp(0, now + DECLICK);
    this.stutDelay.cancelScheduledValues(now + DECLICK);
    this.stutTone.play(plan.tone, first.start, now);
    const dry = this.stutDry;
    dry.hold(now);
    if (this.stutterEnd <= now) dry.set(1, Math.max(now, first.start - DECLICK));
    dry.ramp(0, Math.max(now + DECLICK, first.start));
    for (const s of plan.slices) {
      const open = Math.max(s.start, now + DECLICK);
      this.stutDelay.setValueAtTime(s.delay, open);
      gate.set(0, open);
      gate.ramp(s.gain, open + 0.002);
      const close = open + Math.max(0.006, s.len * STUTTER.duty);
      gate.set(s.gain, close - 0.003);
      gate.ramp(0, close);
    }
    dry.set(0, plan.end - DECLICK);
    dry.ramp(1, plan.end);
    this.stutterEnd = plan.end;
    // a takeover cuts the previous stutter short
    this.stutters = this.stutters
      .filter((p) => p.end > now - TRACE_KEEP)
      .map((p) => (p.end > now ? { ...p, end: now } : p));
    this.stutters.push({ ...plan, id: this.nextStutter++, unit });
  }

  /** What the effects are doing at context time `t` (use the time the player hears). */
  meter(t: number): FxMeter {
    const duck = Math.max(0, Math.min(1, 1 - this.pump.at(t)));
    const cutoffHz = this.lpFreq.at(t);
    const closed = Math.max(
      0,
      Math.min(1, Math.log(SWEEP.openHz / cutoffHz) / Math.log(SWEEP.openHz / SWEEP.lowHz)),
    );
    const repeat: FxMeter['repeat'] = { id: 0, slice: -1, of: 0, open: false, beats: 0 };
    const plan = [...this.stutters].reverse().find((p) => p.slices[0]!.start <= t && t < p.end);
    if (plan) {
      const i = plan.slices.findIndex((s) => t >= s.start && t < s.start + s.len);
      const s = plan.slices[i];
      repeat.id = plan.id;
      repeat.slice = i;
      repeat.of = plan.slices.length;
      repeat.open = !!s && t < s.start + Math.max(0.006, s.len * STUTTER.duty);
      repeat.beats = s ? (STUTTER.sliceBeats * s.len) / plan.unit : 0;
    }
    const wet = this.liftWet.at(t);
    const semis = wet > 0.05 ? shifterSemis(this.liftRate.at(t), LIFT.windowSec) : 0;
    const age = (k: FxKind) => {
      const l = this.last[k];
      return l && t >= l.at ? { age: t - l.at, judgement: l.judgement } : null;
    };
    return {
      duck,
      cutoffHz,
      closed,
      repeat,
      semis,
      lift: Math.max(0, Math.min(1, semis / LIFT.semis)),
      gap: this.gap.at(t) < 0.5,
      last: { pump: age('pump'), sweep: age('sweep'), stutter: age('stutter'), lift: age('lift') },
    };
  }

  dispose(): void {
    this.shifter.dispose();
    try {
      this.noise.stop();
    } catch {
      /* already stopped */
    }
    this.output.disconnect();
    this.riser.param.value = 0;
  }
}

/**
 * PRODUCER FX: each move is a mix-wide production effect on the song. BLOCK pumps the mix
 * like a sidechain, SLASH sweeps a resonant filter open, STAB beat-repeats the 1/16 after
 * the cue, FLOURISH pitch-rises the whole mix into the next bar line. Hits lock the effect
 * to the cue's beat (the slam comes with the press); misses play it fumbled (mushy pump,
 * jammed filter, off-grid stutter, a riser that stalls), on top of the engine's wonky measure
 * for failed combos. `meter()` feeds the visuals and the FX RACK readout.
 */
export const productionFxLayer: MusicLayerFactory = ({ ctx, engine, sfx, chart, session }) => {
  const rack = new FxRack(ctx, engine.musicBus);
  const routed: Array<[GainNode, AudioNode]> = [];
  for (const [name, part] of engine.parts) {
    const dest = PUMP.exempt.includes(name) ? rack.exempt : rack.input;
    part.disconnect(engine.musicBus);
    part.connect(dest);
    routed.push([part, dest]);
  }
  rack.output.connect(engine.musicBus);
  const toCtx = (t: number) => engine.ctxTimeFor(t);
  const off = [
    directFx(session, (c) => rack.run(c, toCtx)),
    session.bus.on('input', (i) => {
      if (i.down) sfx.swing(chart.lanes[i.lane] as Action);
    }),
    session.bus.on('duel', (d) => {
      if (d.type === 'recovered') sfx.clank();
      else if (d.type === 'defeated') sfx.shatter();
    }),
  ];
  return {
    meter: (t) => rack.meter(toCtx(t)),
    dispose: () => {
      off.forEach((f) => f());
      for (const [part, dest] of routed) {
        part.disconnect(dest);
        part.connect(engine.musicBus);
      }
      rack.dispose();
    },
  };
};
