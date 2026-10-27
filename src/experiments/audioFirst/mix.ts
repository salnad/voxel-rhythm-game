import type { MusicEngine } from '../../audio/musicEngine';

/**
 * A safety limiter between the music engine's output and the speakers, for experiments that
 * add their own sounds to the mix (keysounds, count-ins). Fast and transparent below -3 dBFS,
 * so the extra voices can be loud enough to read without clipping the master.
 * Call before the run starts; dispose restores nothing (the engine disconnects its output when
 * the run stops).
 */
export function insertMasterLimiter(engine: MusicEngine, ctx: AudioContext): { dispose(): void } {
  const lim = ctx.createDynamicsCompressor();
  lim.threshold.value = -3;
  lim.knee.value = 0;
  lim.ratio.value = 20;
  lim.attack.value = 0.001;
  lim.release.value = 0.1;
  engine.output.disconnect();
  engine.output.connect(lim).connect(ctx.destination);
  if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__vrMaster = lim;
  return { dispose: () => lim.disconnect() };
}
