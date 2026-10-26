/** Visual tuning: palette, camera, highway layout, effects. */

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

export const HIGHWAY = {
  maxLaneWidth: 104,
  /** Fraction of panel height above the bottom where the judgement line sits. */
  judgeLineFromBottom: 0.16,
  noteHeight: 26,
  /** Seconds judgement text stays visible. */
  judgementTextLife: 0.45,
  laneFlashLife: 0.15,
};

export const CAMERA = {
  fov: 50,
  position: [-6.2, 7.6, 2.4] as [number, number, number],
  lookAt: [6.5, -0.4, -0.2] as [number, number, number],
  shakeOnHit: 0.25,
  kickPulseFov: 1.6,
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
  opacity: 0.7,
  /** Echo-slash trails relative to the main trail. */
  ghostAlpha: 0.22,
};

export const RENDER = {
  /** 3D view resolution scale bounds; adapts to hold frame rate. */
  initialScale: 1,
  minScale: 0.5,
  maxScale: 1,
  lowFps: 48,
  highFps: 58,
};
