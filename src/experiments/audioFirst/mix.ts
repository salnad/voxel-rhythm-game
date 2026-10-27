import type { MusicEngine } from '../../audio/musicEngine';
import type { Sfx } from '../../audio/sfx';

/**
 * A safety limiter in front of the speakers for experiments that add their own sounds to the
 * mix (keysounds, count-ins): the music engine's output (and the move sounds, when `sfx` is
 * given) run through it. Fast and transparent below -3 dBFS, so the extra voices can be loud
 * enough to read without clipping the master. Call before the run starts; dispose puts the
 * move sounds back on the speakers (the engine disconnects its own output when the run stops).
 */
export function insertMasterLimiter(
  engine: MusicEngine,
  ctx: AudioContext,
  sfx?: Sfx,
): { dispose(): void } {
  const lim = ctx.createDynamicsCompressor();
  lim.threshold.value = -3;
  lim.knee.value = 0;
  lim.ratio.value = 20;
  lim.attack.value = 0.001;
  lim.release.value = 0.1;
  engine.output.disconnect();
  engine.output.connect(lim).connect(ctx.destination);
  if (sfx) {
    sfx.output.disconnect();
    sfx.output.connect(lim);
  }
  if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__vrMaster = lim;
  return {
    dispose: () => {
      if (sfx) {
        sfx.output.disconnect();
        sfx.output.connect(ctx.destination);
      }
      lim.disconnect();
      if (import.meta.env.DEV) delete (window as unknown as Record<string, unknown>).__vrMaster;
    },
  };
}
