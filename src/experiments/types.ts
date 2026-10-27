import type * as THREE from 'three';
import type { MusicEngine } from '../audio/musicEngine';
import type { Sfx } from '../audio/sfx';
import type { Chart } from '../chart/build';
import type { ChartFile } from '../chart/types';
import type { JudgementWindows } from '../config/gameplay';
import type { Settings } from '../core/settings';
import type { GameSession } from '../game/session';
import type { ArenaView } from '../render/arenaView';
import type { LaneInput } from '../rhythm/input';

/**
 * A gameplay experiment: one hypothesis about what makes the duel fun, playable as a switchable
 * mode (menu, `?exp=<key>`, Playtest Lab). Experiments reuse the whole pipeline (conductor,
 * judge, duel, music engine, arena) and change it through the options and runtime hooks below,
 * so each one is a small module in src/experiments/ plus a line in the registry.
 */
export interface Experiment {
  /** URL key (`?exp=<key>`), lowercase kebab-case. Never rename one that shipped. */
  key: string;
  /** Short name on menus and the Lab. */
  label: string;
  /** One line: what is different. */
  tagline: string;
  /** The hypothesis being tested, as a falsifiable sentence. Not shown during the Lab trial. */
  hypothesis: string;
  /** Games the idea comes from. */
  inspiration: string[];
  /** The 10-second how-to shown before a trial: 2 to 4 short lines. */
  howTo: string[];
  /** Static switches applied before the run starts. */
  options?: ExperimentOptions;
  /** The test chart. Defaults to the shared Lab chart (LAB.EXE). */
  chart?(): ChartFile;
  /** Build the per-run runtime (custom cue views, input remaps, audio). */
  create?(ctx: ExperimentContext): ExperimentRuntime;
}

export interface ExperimentOptions {
  /** The 4-lane floor highway (cues, receptors, beat lines, combo rails). Default true. */
  highway?: boolean;
  /** The key/action boxes along the bottom of the screen. Default true. */
  laneLabels?: boolean;
  /** The next-action icon over the enemy's head. Default true. */
  enemyIcon?: boolean;
  /**
   * The HUD's judgement text and combo counter (placed beside the lanes). Default true; turn it
   * off when the experiment draws its own at the fight.
   */
  judgementHud?: boolean;
  /** Tutorial prompts from the chart. Default true. */
  prompts?: boolean;
  /** Judgement window overrides (half-widths in seconds). */
  windows?: Partial<JudgementWindows>;
  /** Force an action → music mapping (a MUSIC_MAPPINGS key) instead of the player's choice. */
  musicMapping?: string;
  /** Cue lead time in seconds at cue speed 1.0 (default APPROACH_SECONDS). */
  approachSeconds?: number;
  /** Key codes for the 4 lanes, overriding the player's preset (e.g. arrows). */
  keys?: string[];
  /** A second key code per lane that also works (e.g. arrows next to A S D F). */
  altKeys?: string[];
  /** Short key legend shown in the how-to card, e.g. "A S D F" or "SPACE". */
  keyLegend?: string;
}

/** What an experiment's runtime can reach. Treat session state as read-only. */
export interface ExperimentContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  arena: ArenaView;
  session: GameSession;
  chart: Chart;
  engine: MusicEngine;
  audio: AudioContext;
  sfx: Sfx;
  settings: Settings;
  /** The effective lane keys (after `options.keys`). */
  keys: readonly string[];
  autoplay: boolean;
}

export interface ExperimentRuntime {
  /**
   * Remap a keyboard/pointer input before it reaches the judge (e.g. any key → the lane of the
   * nearest cue). Return null to swallow it. Autoplay inputs bypass this.
   */
  mapInput?(input: LaneInput, t: number): LaneInput | null;
  /** Every frame, after the arena has posed the scene and before it renders. */
  update?(t: number, dt: number, approach: number): void;
  /** Every frame, after the HUD overlay has drawn (CSS pixel coordinates). */
  drawHud?(ctx: CanvasRenderingContext2D, t: number, w: number, h: number): void;
  dispose?(): void;
}
