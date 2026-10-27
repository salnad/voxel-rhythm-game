/**
 * Gain staging for the game's audio. Every stem mixes into the engine's music bus, which runs
 * into a gentle glue compressor; music and sound effects then share one master limiter so the
 * sum never clips (the stems alone used to peak at about +2.6 dBFS).
 */
export const MIX = {
  /** Music bus level into the glue compressor (headroom for effects that add energy). */
  busGain: 0.7,
  /** Glue compressor on the music only. Chrome adds automatic make-up gain to it. */
  glue: { threshold: -14, knee: 8, ratio: 2.5, attack: 0.008, release: 0.18 },
  /** Master limiter for music + sound effects. */
  limiter: { threshold: -4, release: 0.12 },
  /** Level after the limiter, before the final soft clip. */
  trim: 0.92,
  /** The soft clip is linear below this and saturates smoothly towards full scale. */
  softKnee: 0.8,
};
