import { DEFAULT_MUSIC_MAPPING } from '../config/musicMapping';

/** Player settings persisted to localStorage. */
export interface Settings {
  /** Audio offset in ms. Positive if you hit late / hear audio late. */
  audioOffsetMs: number;
  /** Shifts the cue drawing only. Positive draws cues earlier (for laggy displays). */
  visualOffsetMs: number;
  /** Cue speed multiplier. 1.0 = cues take APPROACH_SECONDS to travel the highway. */
  scrollSpeed: number;
  /** Key codes (KeyboardEvent.code) for BLOCK, SLASH, STAB, FLOURISH. */
  keys4: string[];
  musicVolume: number;
  hitsoundVolume: number;
  noFail: boolean;
  difficulty: 'normal' | 'easy';
  /** Key into MUSIC_MAPPINGS: how actions interact with the music. */
  musicMapping: string;
}

/** Key presets offered in Settings. The first is the default. */
export const KEY_PRESETS: ReadonlyArray<{ name: string; keys: readonly string[] }> = [
  { name: 'A S D F', keys: ['KeyA', 'KeyS', 'KeyD', 'KeyF'] },
  { name: 'F G H J', keys: ['KeyF', 'KeyG', 'KeyH', 'KeyJ'] },
  { name: 'ARROWS', keys: ['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight'] },
  { name: 'D F J K', keys: ['KeyD', 'KeyF', 'KeyJ', 'KeyK'] },
];

export const DEFAULT_SETTINGS: Settings = {
  audioOffsetMs: 0,
  visualOffsetMs: 0,
  scrollSpeed: 1,
  keys4: [...KEY_PRESETS[0]!.keys],
  musicVolume: 0.8,
  hitsoundVolume: 0.35,
  noFail: true,
  difficulty: 'easy',
  musicMapping: DEFAULT_MUSIC_MAPPING,
};

const KEY = 'voxel-rhythm.settings.v3';

/** Short label for a KeyboardEvent.code, for HUD and menus. */
export function keyLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  const named: Record<string, string> = {
    Space: '␣',
    Semicolon: ';',
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    ArrowDown: '↓',
  };
  return named[code] ?? code;
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const s = { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
    if (!Array.isArray(s.keys4) || s.keys4.length !== 4) s.keys4 = [...DEFAULT_SETTINGS.keys4];
    return s;
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
