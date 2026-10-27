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
  skin: '#f4d6bf',
  hair: '#f7da5e',
  hairShade: '#d9a933',
  outfit: '#565c9e',
  outfitDark: '#343873',
  leather: '#a8744a',
  metal: '#a9b2bc',
  metalDark: '#555c66',
  eyes: '#3fb8a8',
  blade: '#c3cbd4',
  /** Materia slots on the sword. */
  materia: '#39ff6a',
  scale: 0.92,
};

/**
 * Sword effects. The synth still shapes the sword, but every effect is scaled down so the
 * blade and the moves stay readable. 0 removes an effect; 1 is the raw synth amount.
 */
export const SWORD_FX = {
  /** Blade glow flash on a connect (emissive intensity), and its decay (s). Nothing glows at rest. */
  hitGlow: 0.35,
  hitGlowDecay: 0.12,
  /** Materia slot glow at rest, and how much CUTOFF adds. */
  materiaGlow: 0.2,
  materiaCutoffGlow: 0.5,
  /** How much of the synth's reach (CUTOFF) reaches the blade length. */
  reachAmount: 0.25,
  /** How much WT POS widens or narrows slash and flourish arcs. */
  arcAmount: 0.3,
  /** How much WT POS changes follow-through speed (saw snappy, sine smooth). */
  followAmount: 1,
  /** How much CUTOFF changes the stab lunge. */
  lungeAmount: 0.4,
  /** UNISON echo afterimages: at most this many, this opaque, only around the strike. */
  echoMax: 3,
  echoOpacity: 0.16,
  /** Echo spread (DETUNE) and delay scale. */
  echoSpreadAmount: 0.35,
  echoDelayAmount: 0.6,
  /** Blade-lock grinding sparks per second. */
  grindSparks: 10,
};

/** Enemy reaction to a landed hit. */
export const ENEMY_REACT = {
  /** Freeze on contact (s), matching the hero's hit-stop, with a shudder (rad). */
  hitStop: 0.05,
  shudder: 0.05,
  /** Knockback time (s) and overshoot (back-ease constant). */
  knockback: 0.09,
  overshoot: 1.4,
  /** Body flash intensity and decay (s). */
  flash: 0.5,
  flashDecay: 0.14,
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
  lifetime: 0.13,
  maxSamples: 48,
  opacity: 0.32,
  /** Ribbon starts this far along the blade (0 = guard, 1 = tip): a thin arc near the tip. */
  innerEdge: 0.45,
  /** WT POS "stepped" jitter (world units at full square wave). */
  jitter: 0.03,
  /** Smear samples drawn between the coil and the contact frame on a key press. */
  smearSamples: 10,
};

export const RENDER = {
  /** 3D view resolution scale bounds; adapts to hold frame rate. */
  initialScale: 1,
  minScale: 0.5,
  maxScale: 1,
  lowFps: 48,
  highFps: 58,
};
