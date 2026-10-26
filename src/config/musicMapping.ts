/**
 * Action → music mappings. Each entry is a swappable layer (see src/audio/musicLayers.ts);
 * Settings lists them and the runner instantiates the chosen one. Add a mapping by writing
 * a MusicLayerFactory and registering it here.
 */
import { swordSfxLayer, type MusicLayerFactory } from '../audio/musicLayers';

export interface MusicMapping {
  label: string;
  description: string;
  create: MusicLayerFactory;
}

export const MUSIC_MAPPINGS: Record<string, MusicMapping> = {
  sword: {
    label: 'SWORD SFX',
    description: 'Moves make sword sounds; the song plays as written.',
    create: swordSfxLayer,
  },
};

export const DEFAULT_MUSIC_MAPPING = 'sword';

export function musicMapping(name: string): MusicMapping {
  return MUSIC_MAPPINGS[name] ?? MUSIC_MAPPINGS[DEFAULT_MUSIC_MAPPING]!;
}
