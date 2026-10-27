import { MIX } from '../config/mix';

/**
 * The one output stage per AudioContext: music and sound effects connect to `input`, which
 * runs through a brick-wall-ish limiter, a trim and a soft clip that is transparent below
 * MIX.softKnee, so the summed output stays below full scale.
 */
export class MasterBus {
  readonly input: GainNode;
  /** Final signal (for taps such as a recorder). */
  readonly output: AudioNode;

  constructor(ctx: BaseAudioContext) {
    this.input = ctx.createGain();
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = MIX.limiter.threshold;
    lim.knee.value = 0;
    lim.ratio.value = 20;
    lim.attack.value = 0.001;
    lim.release.value = MIX.limiter.release;
    const trim = ctx.createGain();
    trim.gain.value = MIX.trim;
    const clip = ctx.createWaveShaper();
    clip.curve = softClipCurve(MIX.softKnee);
    clip.oversample = '2x';
    this.input.connect(lim).connect(trim).connect(clip).connect(ctx.destination);
    this.output = clip;
  }
}

/** Identity below `knee`, then a tanh shoulder that approaches (never reaches) ±0.99. */
export function softClipCurve(knee: number, n = 2049): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(n);
  const room = 0.99 - knee;
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    const a = Math.abs(x);
    const y = a <= knee ? a : knee + room * Math.tanh((a - knee) / room);
    curve[i] = Math.sign(x) * y;
  }
  return curve;
}

const buses = new WeakMap<BaseAudioContext, MasterBus>();

export function masterBus(ctx: BaseAudioContext): MasterBus {
  let bus = buses.get(ctx);
  if (!bus) {
    bus = new MasterBus(ctx);
    buses.set(ctx, bus);
  }
  return bus;
}
