/** Player settings persisted to localStorage. */
export interface Settings {
  /** Audio offset in ms. Positive if you hit late / hear audio late. */
  audioOffsetMs: number;
  /** Shifts the highway drawing only. Positive draws notes earlier (for laggy displays). */
  visualOffsetMs: number;
  /** Highway scroll speed in screen-heights per second. */
  scrollSpeed: number;
  /** Key codes (KeyboardEvent.code) per lane, for 4-lane charts. Other lane counts use defaults. */
  keys4: string[];
  musicVolume: number;
  hitsoundVolume: number;
  noFail: boolean;
  difficulty: 'normal' | 'easy';
}

export const DEFAULT_SETTINGS: Settings = {
  audioOffsetMs: 0,
  visualOffsetMs: 0,
  scrollSpeed: 1.1,
  keys4: ['KeyD', 'KeyF', 'KeyJ', 'KeyK'],
  musicVolume: 0.8,
  hitsoundVolume: 0.25,
  noFail: true,
  difficulty: 'normal',
};

const KEY = 'voxel-rhythm.settings.v1';

export const DEFAULT_KEYS: Record<number, string[]> = {
  1: ['Space'],
  2: ['KeyF', 'KeyJ'],
  3: ['KeyF', 'Space', 'KeyJ'],
  5: ['KeyD', 'KeyF', 'Space', 'KeyJ', 'KeyK'],
  6: ['KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL'],
  7: ['KeyS', 'KeyD', 'KeyF', 'Space', 'KeyJ', 'KeyK', 'KeyL'],
  8: ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'],
};

export function keysForLaneCount(settings: Settings, n: number): string[] {
  if (n === 4) return settings.keys4;
  return DEFAULT_KEYS[n] ?? settings.keys4.slice(0, n);
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable */
  }
}
