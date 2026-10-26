import { morphWeights } from '../synth/modifiers';
import type { SynthPatch } from '../synth/patch';

const HARMONICS = 40;
const MORPH_STEPS = 13;

/** Fourier sine coefficients of the four table shapes (sine → triangle → saw → square). */
function shapeCoeffs(shape: number, n: number): number {
  switch (shape) {
    case 0:
      return n === 1 ? 1 : 0;
    case 1:
      return n % 2 === 1
        ? (8 / (Math.PI * Math.PI * n * n)) * (((n - 1) / 2) % 2 === 0 ? 1 : -1)
        : 0;
    case 2:
      return (2 / (Math.PI * n)) * (n % 2 === 1 ? 1 : -1);
    default:
      return n % 2 === 1 ? 4 / (Math.PI * n) : 0;
  }
}

const waveCache = new WeakMap<BaseAudioContext, PeriodicWave[]>();

/** PeriodicWaves across the wavetable, so a patch's WT POS can be voiced directly. */
function waves(ctx: BaseAudioContext): PeriodicWave[] {
  let w = waveCache.get(ctx);
  if (!w) {
    w = [];
    for (let s = 0; s < MORPH_STEPS; s++) {
      const weights = morphWeights(s / (MORPH_STEPS - 1));
      const real = new Float32Array(HARMONICS + 1);
      const imag = new Float32Array(HARMONICS + 1);
      for (let n = 1; n <= HARMONICS; n++) {
        let v = 0;
        for (let k = 0; k < 4; k++) v += (weights[k] ?? 0) * shapeCoeffs(k, n);
        imag[n] = v;
      }
      w.push(ctx.createPeriodicWave(real, imag));
    }
    waveCache.set(ctx, w);
  }
  return w;
}

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/**
 * One pluck-lead note voiced by a wavetable patch: WT POS picks the waveform, UNISON and
 * DETUNE stack detuned voices, CUTOFF and RES shape a plucky low-pass. Works on live and
 * offline contexts. Returns the oscillators so callers can bend their pitch.
 */
export function playLeadNote(
  ctx: BaseAudioContext,
  dest: AudioNode,
  t: number,
  midi: number,
  lenSec: number,
  vel: number,
  patch: SynthPatch,
): OscillatorNode[] {
  const wave =
    waves(ctx)[Math.round(Math.min(1, Math.max(0, patch.wtPosition)) * (MORPH_STEPS - 1))]!;
  const voices = Math.max(1, Math.min(7, Math.round(patch.unison)));
  const f = mtof(midi);
  const cutoff = 300 * Math.pow(2, patch.cutoff * 6);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 0.7 + patch.resonance * 9;
  lp.frequency.setValueAtTime(Math.min(18000, cutoff * 2.5), t);
  lp.frequency.exponentialRampToValueAtTime(Math.max(200, cutoff), t + 0.16);
  const g = ctx.createGain();
  const peak = (vel * 0.32) / Math.sqrt(voices);
  const end = t + Math.max(0.05, lenSec);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.004);
  g.gain.exponentialRampToValueAtTime(peak * 0.55, t + 0.14);
  g.gain.setValueAtTime(peak * 0.55, end);
  g.gain.exponentialRampToValueAtTime(0.0001, end + 0.09);
  lp.connect(g).connect(dest);
  const oscs: OscillatorNode[] = [];
  for (let v = 0; v < voices; v++) {
    const spread = voices > 1 ? v / (voices - 1) - 0.5 : 0;
    const o = ctx.createOscillator();
    o.setPeriodicWave(wave);
    o.frequency.value = f;
    o.detune.value = spread * patch.detune * 70;
    const p = ctx.createStereoPanner();
    p.pan.value = spread * 1.2;
    o.connect(p).connect(lp);
    o.start(t);
    o.stop(end + 0.12);
    oscs.push(o);
  }
  return oscs;
}
