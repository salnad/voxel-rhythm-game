/** Visual tuning: palette, camera, arena layout, effects. */

export const PALETTE = {
  bg: '#000000',
  green: '#39ff6a',
  greenDim: '#0b3d18',
  greenMid: '#1a8f3c',
  white: '#e6ffe9',
  danger: '#ff3b5c',
  parry: '#7dfcff',
  judgement: {
    perfect: '#e6ffe9',
    great: '#39ff6a',
    good: '#b6ff3b',
    miss: '#ff3b5c',
  },
};

/**
 * One arena, seen from behind the hero. The hero stands at the origin facing -Z; the enemy
 * stands across the hit line; the four action lanes run from far away (-Z), through the
 * enemy, into the hit line in front of the hero. Cues always travel toward the camera.
 */
export const ARENA = {
  laneWidth: 1.05,
  /** The hero stands slightly behind the origin so the camera sees the hit line over its head. */
  heroZ: 0.45,
  /** Distance in front of the hero where cues are judged. */
  hitDistance: 1.6,
  /** Highway length beyond the hit line. Cues spawn at the far end. */
  highwayLength: 17,
  /** Where the enemy stands while dueling. */
  duelDistance: 3.0,
  /** Where an enemy starts its walk-in. */
  enterDistance: 9,
  /** Cue tile depth (world units). */
  cueDepth: 0.5,
  /** Cue tiles tilt toward the camera (degrees from flat) so far cues stay legible. */
  cueTiltDeg: 35,
};

export const CAMERA = {
  fov: 52,
  position: [0, 6.1, 4.4] as [number, number, number],
  lookAt: [0, 0.2, -3.7] as [number, number, number],
  shakeOnHit: 0.25,
  kickPulseFov: 1.4,
};

export const HUD = {
  /** Seconds judgement text stays visible. */
  judgementTextLife: 0.45,
  laneFlashLife: 0.15,
};

export const CHARACTER = {
  /** Colors loosely after the low-poly FF7 chibi reference. */
  skin: '#f2d1b8',
  hair: '#f5d75a',
  outfit: '#4b4f8c',
  outfitDark: '#2f3263',
  leather: '#9b6b45',
  metal: '#9aa3ad',
  metalDark: '#4a5058',
  eyes: '#3fb8a8',
  blade: '#b9c2cc',
  bladeEmissive: '#39ff6a',
  scale: 0.92,
};

export const RAIN = {
  fontSize: 16,
  opacity: 0.22,
  /** Columns move this many cells per second at rest. */
  speed: 14,
  glyphs:
    'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789:.=*+-<>¦',
};

export const TRAIL = {
  lifetime: 0.2,
  maxSamples: 40,
  opacity: 0.75,
  /** Echo-blade trails relative to the main trail. */
  ghostAlpha: 0.25,
};

export const RENDER = {
  /** 3D view resolution scale bounds; adapts to hold frame rate. */
  initialScale: 1,
  minScale: 0.5,
  maxScale: 1,
  lowFps: 48,
  highFps: 58,
};
