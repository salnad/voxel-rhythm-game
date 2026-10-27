import { parseLabState, type LabState } from './plan';

const KEY = 'voxel-rhythm.lab.v1';

export function loadLab(): LabState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? parseLabState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveLab(s: LabState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable */
  }
}

export function clearLab(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}
