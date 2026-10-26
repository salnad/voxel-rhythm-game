/**
 * Action → music mappings. Each entry is a swappable layer (see src/audio/musicLayers.ts);
 * Settings lists them and the runner instantiates the chosen one. Add a mapping by writing
 * a MusicLayerFactory and registering it here.
 */
import { instrumentLayer } from '../audio/instrumentLayer';
import { hybridLayer, swordSfxLayer, type MusicLayerFactory } from '../audio/musicLayers';

export interface MusicMapping {
  label: string;
  description: string;
  create: MusicLayerFactory;
}

export const MUSIC_MAPPINGS: Record<string, MusicMapping> = {
  instruments: {
    label: 'INSTRUMENTS',
    description:
      'Each move plays a part: block = 808, slash = lead (your synth patch), stab = hats/perc, flourish = vocal chops. A miss mutes or glitches that part.',
    create: instrumentLayer,
  },
  sword: {
    label: 'SWORD SFX',
    description: 'Moves make sword sounds; the song plays as written.',
    create: swordSfxLayer,
  },
  hybrid: {
    label: 'C · HYBRID',
    description:
      'Moves play instruments (808, lead, hats, vocal chops); a clean combo measure fires a production flourish at the bar line.',
    create: hybridLayer,
  },
};

export const DEFAULT_MUSIC_MAPPING = 'instruments';

export function musicMapping(name: string): MusicMapping {
  return MUSIC_MAPPINGS[name] ?? MUSIC_MAPPINGS[DEFAULT_MUSIC_MAPPING]!;
}
