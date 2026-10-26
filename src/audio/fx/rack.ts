import type { Action } from '../../chart/types';
import { LIFT, PUMP, STUTTER } from '../../config/productionFx';
import type { MusicLayerFactory } from '../musicLayers';
import { directFx, type FxCommand } from './director';
import {
  clipShape,
  liftFumbleShapes,
  liftShapes,
  pumpFumbleShape,
  pumpHoldShape,
  pumpReleaseShape,
  pumpShape,
  stutterFumblePlan,
  stutterPlan,
  sweepFumbleShapes,
  sweepShapes,
  type Shape,
  type StutterPlan,
} from './plan';

/** Shortest ramp into a new effect (s), so retriggers don't click. */
const DECLICK = 0.004;
/** Scheduling headroom past currentTime (s). */
const HEADROOM = 0.003;

/** Freeze a param at its current value from `at`, dropping later automation. */
function hold(p: AudioParam, at: number): void {
  if (typeof p.cancelAndHoldAtTime === 'function') {
    p.cancelAndHoldAtTime(at);
  } else {
    p.cancelScheduledValues(at);
    p.setValueAtTime(p.value, at);
  }
}

/** Automate `p` along `shape` anchored at `anchor`, starting no earlier than `now`. */
function play(p: AudioParam, shape: Shape, anchor: number, now: number): void {
  hold(p, now);
  const pts = clipShape(shape, anchor, now);
  pts.forEach((pt, i) => {
    p.linearRampToValueAtTime(pt.value, i === 0 ? Math.max(pt.time, now + DECLICK) : pt.time);
  });
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

  constructor(ctx: AudioContext, window: number) {
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

/**
 * The effects chain, spliced between the song's stems and the engine's music bus:
 *
 *   stems → pump → low-pass → (dry | pitch shifter) → (dry | beat-repeat) → music bus
 *
 * Pump-exempt stems (the demo's 808) join after the pump, so the kick drives the duck instead of
 * ducking under it. The noise riser goes straight to the music bus.
 */
export class FxRack {
  readonly input: GainNode;
  readonly postPump: GainNode;
  readonly output: GainNode;
  private readonly pump: GainNode;
  private readonly lp: BiquadFilterNode;
  private readonly liftDry: GainNode;
  private readonly liftWet: GainNode;
  private readonly shifter: PitchShifter;
  private readonly stutDry: GainNode;
  private readonly stutDelay: DelayNode;
  private readonly stutTone: BiquadFilterNode;
  private readonly stutGate: GainNode;
  private readonly riser: GainNode;
  private readonly riserBp: BiquadFilterNode;
  private readonly noise: AudioBufferSourceNode;
  private stutterEnd = 0;

  constructor(
    private readonly ctx: AudioContext,
    riserOut: AudioNode,
  ) {
    this.input = ctx.createGain();
    this.pump = ctx.createGain();
    this.postPump = ctx.createGain();
    this.lp = ctx.createBiquadFilter();
    this.lp.type = 'lowpass';
    this.lp.frequency.value = 20000;
    this.lp.Q.value = 0.7;
    this.input.connect(this.pump).connect(this.postPump).connect(this.lp);

    const mid = ctx.createGain();
    this.liftDry = ctx.createGain();
    this.liftWet = ctx.createGain();
    this.liftWet.gain.value = 0;
    this.shifter = new PitchShifter(ctx, LIFT.windowSec);
    this.lp.connect(this.liftDry).connect(mid);
    this.lp.connect(this.shifter.input);
    this.shifter.output.connect(this.liftWet).connect(mid);

    this.output = ctx.createGain();
    this.stutDry = ctx.createGain();
    this.stutDelay = ctx.createDelay(2);
    this.stutDelay.delayTime.value = 0;
    this.stutTone = ctx.createBiquadFilter();
    this.stutTone.type = 'lowpass';
    this.stutTone.frequency.value = 20000;
    this.stutGate = ctx.createGain();
    this.stutGate.gain.value = 0;
    mid.connect(this.stutDry).connect(this.output);
    mid.connect(this.stutDelay).connect(this.stutTone).connect(this.stutGate).connect(this.output);

    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noise = ctx.createBufferSource();
    this.noise.buffer = buf;
    this.noise.loop = true;
    this.riserBp = ctx.createBiquadFilter();
    this.riserBp.type = 'bandpass';
    this.riserBp.Q.value = 2.5;
    this.riser = ctx.createGain();
    this.riser.gain.value = 0;
    this.noise.connect(this.riserBp).connect(this.riser).connect(riserOut);
    this.noise.start();
  }

  private get now(): number {
    return this.ctx.currentTime + HEADROOM;
  }

  /** `toCtx` maps game time to context time. */
  run(c: FxCommand, toCtx: (t: number) => number): void {
    const now = this.now;
    if (c.type === 'release') {
      if (c.fx === 'pump') play(this.pump.gain, pumpReleaseShape(c.beat, c.fumble), now, now);
      return;
    }
    const anchor = toCtx(c.anchor);
    switch (c.fx) {
      case 'pump':
        play(
          this.pump.gain,
          c.fumble
            ? pumpFumbleShape(c.beat)
            : c.sustain
              ? pumpHoldShape(c.amount)
              : pumpShape(c.amount, c.beat),
          anchor,
          now,
        );
        break;
      case 'sweep': {
        const s = c.fumble ? sweepFumbleShapes(c.beat) : sweepShapes(c.amount, c.beat);
        play(this.lp.frequency, s.freq, anchor, now);
        play(this.lp.Q, s.q, anchor, now);
        break;
      }
      case 'stutter': {
        const plan =
          c.judgement === 'miss'
            ? stutterFumblePlan(now, c.beat)
            : stutterPlan(anchor, now, c.beat, c.judgement);
        if (plan) this.stutter(plan, now);
        break;
      }
      case 'lift': {
        const span = toCtx(c.target ?? c.anchor + 4 * c.beat) - anchor;
        const s = c.fumble ? liftFumbleShapes(span) : liftShapes(c.amount, span);
        play(this.shifter.rate, s.rate, anchor, now);
        play(this.liftWet.gain, s.wet, anchor, now);
        play(this.liftDry.gain, s.dry, anchor, now);
        play(this.riser.gain, s.riser, anchor, now);
        play(this.riserBp.frequency, s.riserHz, anchor, now);
        break;
      }
    }
  }

  private stutter(plan: StutterPlan, now: number): void {
    const first = plan.slices[0];
    if (!first) return;
    // a new stutter takes over from one still repeating
    const gate = this.stutGate.gain;
    const delay = this.stutDelay.delayTime;
    hold(gate, now);
    gate.linearRampToValueAtTime(0, now + DECLICK);
    delay.cancelScheduledValues(now + DECLICK);
    play(this.stutTone.frequency, plan.tone, first.start, now);
    const dry = this.stutDry.gain;
    hold(dry, now);
    if (this.stutterEnd <= now) dry.setValueAtTime(1, Math.max(now, first.start - DECLICK));
    dry.linearRampToValueAtTime(0, Math.max(now + DECLICK, first.start));
    for (const s of plan.slices) {
      const open = Math.max(s.start, now + DECLICK);
      delay.setValueAtTime(s.delay, open);
      gate.setValueAtTime(0, open);
      gate.linearRampToValueAtTime(s.gain, open + 0.002);
      const close = open + Math.max(0.006, s.len * STUTTER.duty);
      gate.setValueAtTime(s.gain, close - 0.003);
      gate.linearRampToValueAtTime(0, close);
    }
    dry.setValueAtTime(0, plan.end - DECLICK);
    dry.linearRampToValueAtTime(1, plan.end);
    this.stutterEnd = plan.end;
  }

  dispose(): void {
    this.shifter.dispose();
    try {
      this.noise.stop();
    } catch {
      /* already stopped */
    }
    this.output.disconnect();
    this.riser.disconnect();
  }
}

/**
 * PRODUCER FX: each move is a mix-wide production effect on the song. BLOCK pumps the mix
 * like a sidechain, SLASH sweeps a resonant filter open, STAB beat-repeats the 1/16 after
 * the cue, FLOURISH pitch-rises the whole mix into the next bar line. Hits lock the effect
 * to the cue's beat; misses play it fumbled (mushy pump, jammed filter, off-grid stutter,
 * a riser that stalls), on top of the engine's wonky measure for failed combos.
 */
export const productionFxLayer: MusicLayerFactory = ({ ctx, engine, sfx, chart, session }) => {
  const rack = new FxRack(ctx, engine.musicBus);
  const routed: Array<[GainNode, AudioNode]> = [];
  for (const [name, part] of engine.parts) {
    const dest = PUMP.exempt.includes(name) ? rack.postPump : rack.input;
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
