import type { Chart } from '../chart/build';
import type { Action } from '../chart/types';
import type { GameSession } from '../game/session';
import type { MusicEngine } from './musicEngine';
import type { Sfx } from './sfx';

/** What an action-music layer can reach. */
export interface MusicLayerDeps {
  ctx: AudioContext;
  engine: MusicEngine;
  sfx: Sfx;
  chart: Chart;
  session: GameSession;
}

/**
 * How the player's actions interact with the music. A layer subscribes to the session bus
 * (input, action, combo, duel events) and drives the engine's part gains, its music bus, or
 * its own sounds. Layers are swappable: src/config/musicMapping.ts picks one by name.
 * The core rules (a failed combo makes the rest of its measure wonky and repeats it) live in
 * the runner and engine, so every layer gets them.
 */
export interface ActionMusicLayer {
  /** Called every frame with the game time. */
  update?(t: number): void;
  dispose?(): void;
}

export type MusicLayerFactory = (deps: MusicLayerDeps) => ActionMusicLayer;

export { hybridLayer } from './hybrid/hybridLayer';

/** Minimal layer: moves make sword sounds; the song itself plays untouched. */
export const swordSfxLayer: MusicLayerFactory = ({ session, chart, sfx }) => {
  const off = [
    session.bus.on('input', (i) => {
      if (i.down) sfx.swing(chart.lanes[i.lane] as Action);
    }),
    session.bus.on('action', (a) => {
      if (a.hit && a.kind !== 'holdEnd') sfx.hit(a.action, a.judgement === 'perfect');
    }),
    session.bus.on('duel', (d) => {
      if (d.type === 'recovered') sfx.clank();
      else if (d.type === 'defeated') sfx.shatter();
    }),
  ];
  return { dispose: () => off.forEach((f) => f()) };
};
