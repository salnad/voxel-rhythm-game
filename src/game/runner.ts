import { masterBus } from '../audio/master';
import { MusicEngine } from '../audio/musicEngine';
import type { ActionMusicLayer } from '../audio/musicLayers';
import type { Sfx } from '../audio/sfx';
import { APPROACH_SECONDS, AUTOPLAY, JUDGEMENT_WINDOWS } from '../config/gameplay';
import { musicMapping } from '../config/musicMapping';
import { CAMERA } from '../config/visuals';
import type { Settings } from '../core/settings';
import { NO_MUSIC_LAYER, type Experiment, type ExperimentRuntime } from '../experiments/types';
import { ArenaView } from '../render/arenaView';
import { FxFeedback } from '../render/fxFeedback';
import { HudOverlay } from '../render/hudOverlay';
import type { DigitalRain } from '../render/rain';
import { AutoPlayer, KeyboardLanes, type LaneInput } from '../rhythm/input';
import type { SynthPatch } from '../synth/patch';
import type { LoadedMap } from './maps';
import { GameSession } from './session';

/** Seconds of lead-in before game time 0. */
const LEAD_IN = 2.5;
/** Seconds after the last cue before results. */
const OUTRO = 2;

export interface RunnerElements {
  arenaCanvas: HTMLCanvasElement;
  hudCanvas: HTMLCanvasElement;
  labelLayer: HTMLElement;
}

export interface RunnerHooks {
  onFrame(session: GameSession, songTime: number): void;
  onEnd(session: GameSession, failed: boolean): void;
}

export interface RunnerOptions {
  autoplay: boolean;
  /** Bars where autoplay misses once on the first try (shows a failed combo + retry). */
  autoplayFailBars?: number[];
  /** Gameplay experiment to run (src/experiments). */
  experiment?: Experiment | null;
}

/** Drives one play: clock → inputs → session → music + views, once per animation frame. */
export class PlayRunner {
  readonly session: GameSession;
  readonly engine: MusicEngine;
  private readonly arena: ArenaView;
  private readonly hud: HudOverlay;
  private readonly keyboard: KeyboardLanes;
  private readonly layer: ActionMusicLayer;
  private readonly fx: FxFeedback | null;
  private readonly auto: AutoPlayer | null;
  private readonly runtime: ExperimentRuntime;
  private readonly approachBase: number;
  private raf = 0;
  private lastPerf = 0;
  private ended = false;
  private downAt: number | null = null;
  private readonly onResize = () => {
    this.arena.resize();
    this.hud.resize();
  };
  private readonly onPointer = (e: PointerEvent) => this.pointerLane(e);

  constructor(
    private readonly els: RunnerElements,
    map: LoadedMap,
    ctx: AudioContext,
    private readonly sfx: Sfx,
    private readonly rain: DigitalRain,
    private settings: Settings,
    patch: SynthPatch,
    private readonly opts: RunnerOptions,
    private readonly hooks: RunnerHooks,
  ) {
    const chart = map.chart;
    const exp = opts.experiment ?? null;
    const xo = exp?.options ?? {};
    this.session = new GameSession(chart, {
      noFail: settings.noFail,
      patch,
      windows: { ...JUDGEMENT_WINDOWS, ...xo.windows },
    });
    this.engine = new MusicEngine(ctx, chart, map.stems);
    const keys = xo.keys ?? settings.keys4;
    this.keyboard = new KeyboardLanes((perf) => this.engine.timeAt(perf));
    this.keyboard.setKeys(opts.autoplay ? [] : [...keys], [...(xo.altKeys ?? [])]);
    this.arena = new ArenaView(els.arenaCanvas, els.labelLayer, chart, this.session, {
      highway: xo.highway ?? true,
      enemyIcon: xo.enemyIcon ?? true,
    });
    this.hud = new HudOverlay(els.hudCanvas, chart, this.session, this.arena, keys, {
      laneLabels: xo.laneLabels ?? true,
      comboTags: xo.highway ?? true,
      judgement: xo.judgementHud ?? true,
      prompts: xo.prompts ?? true,
    });
    this.approachBase = xo.approachSeconds ?? APPROACH_SECONDS;
    const mapping = xo.musicMapping ?? settings.musicMapping;
    this.layer =
      mapping === NO_MUSIC_LAYER
        ? {}
        : musicMapping(mapping).create({
            ctx,
            engine: this.engine,
            sfx,
            chart,
            session: this.session,
          });
    const stage = els.arenaCanvas.parentElement;
    this.fx = this.layer.meter && stage ? new FxFeedback(stage, els.arenaCanvas, keys) : null;

    this.auto = opts.autoplay
      ? new AutoPlayer(
          AUTOPLAY.jitter,
          AUTOPLAY.missRate,
          AUTOPLAY.seed,
          opts.autoplayFailBars ?? [],
        )
      : null;
    if (this.auto) {
      const auto = this.auto;
      this.session.bus.on('cues', (c) => auto.onCues(c));
      this.session.bus.on('cuesDropped', (ids) => auto.onDropped(ids));
    }

    this.session.bus.on('action', (a) => {
      if (a.hit && a.action === 'block') this.rain.pulse(0.6);
      if (a.hit && a.action === 'flourish') this.rain.pulse(1);
    });
    this.session.bus.on('duel', (d) => {
      if (d.type === 'playerHit') {
        this.sfx.hurt();
        glitch();
      }
    });
    this.session.bus.on('combo', (c) => {
      if (c.type === 'failed') {
        this.engine.wonky(c.time, c.until);
        glitch();
      }
    });
    this.runtime =
      exp?.create?.({
        scene: this.arena.scene,
        camera: this.arena.camera,
        arena: this.arena,
        session: this.session,
        chart,
        engine: this.engine,
        audio: ctx,
        sfx,
        settings,
        keys,
        autoplay: opts.autoplay,
      }) ?? {};
    const rt = this.runtime;
    if (rt.update) this.arena.onBeforeRender((t, dt) => rt.update!(t, dt, this.approach()));
    if (rt.drawHud) this.hud.extraDraw = (c, t, w, h) => rt.drawHud!(c, t, w, h);
    window.addEventListener('resize', this.onResize);
    els.hudCanvas.addEventListener('pointerdown', this.onPointer);
    els.hudCanvas.addEventListener('pointerup', this.onPointer);
  }

  start(): void {
    this.applySettings(this.settings);
    this.engine.start(-LEAD_IN);
    this.lastPerf = performance.now();
    this.raf = requestAnimationFrame(this.frame);
    if (import.meta.env.DEV) {
      // Dev-only hook for automated playtests (scripts/ or CDP).
      (window as unknown as Record<string, unknown>).__vr = {
        songTime: () => this.engine.timeAt(performance.now()),
        session: this.session,
        experiment: this.opts.experiment?.key ?? null,
        camera: CAMERA,
        /** What the mix-wide effects are doing now (PRODUCER FX), or undefined. */
        fx: () => this.layer.meter?.(this.engine.timeAt(performance.now())),
        /** Everything the game plays, as a MediaStream (for recording demos without a sound card). */
        tapAudio: () => {
          const dest = this.engine.ctx.createMediaStreamDestination();
          masterBus(this.engine.ctx).output.connect(dest);
          return dest.stream;
        },
      };
    }
  }

  applySettings(s: Settings): void {
    this.settings = s;
    this.engine.userOffsetSec = s.audioOffsetMs / 1000;
    this.arena.visualOffset = s.visualOffsetMs / 1000;
    this.engine.output.gain.cancelScheduledValues(0);
    this.engine.output.gain.value = s.musicVolume;
    this.sfx.volume = s.hitsoundVolume;
  }

  /** Cue lead time (s) at the current cue speed. */
  approach(): number {
    return this.approachBase / Math.max(0.25, this.settings.scrollSpeed);
  }

  setPatch(p: SynthPatch): void {
    this.session.setPatch(p);
  }

  get paused(): boolean {
    return !this.engine.playing;
  }

  pause(): void {
    void this.engine.pause();
  }

  resume(): void {
    void this.engine.resume();
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    this.engine.stop();
    this.runtime.dispose?.();
    this.layer.dispose?.();
    this.fx?.dispose();
    this.keyboard.dispose();
    this.arena.dispose();
    window.removeEventListener('resize', this.onResize);
    this.els.hudCanvas.removeEventListener('pointerdown', this.onPointer);
    this.els.hudCanvas.removeEventListener('pointerup', this.onPointer);
    this.session.bus.clear();
    const ctx = this.els.hudCanvas.getContext('2d');
    ctx?.clearRect(0, 0, this.els.hudCanvas.width, this.els.hudCanvas.height);
  }

  private readonly frame = (now: number): void => {
    this.raf = requestAnimationFrame(this.frame);
    const realDt = (now - this.lastPerf) / 1000;
    const dt = Math.min(0.05, realDt);
    this.lastPerf = now;
    this.engine.sampleClock(now);
    const t = this.engine.timeAt(now);
    if (this.engine.playing) {
      const map = this.runtime.mapInput;
      const inputs: LaneInput[] = [];
      for (const i of this.keyboard.drain()) {
        const m = map ? map(i, t) : i;
        if (m) inputs.push(m);
      }
      if (this.auto) inputs.push(...this.auto.due(t));
      inputs.sort((a, b) => a.time - b.time);
      this.session.step(inputs, t);
      this.engine.schedule(this.session.conductor.plays, t);
      this.layer.update?.(t);
    }
    const drawT = t + this.settings.visualOffsetMs / 1000;
    const approach = this.approach();
    this.arena.update(drawT, this.engine.playing ? dt : 0, realDt, approach);
    if (this.fx && this.layer.meter) this.fx.update(this.layer.meter(drawT), dt);
    this.hud.draw(drawT, approach);
    this.rain.update(dt);
    this.hooks.onFrame(this.session, t);

    if (this.ended) return;
    if (this.session.duel.down) {
      this.downAt ??= now;
      this.engine.output.gain.value *= 0.95;
      if (now - this.downAt > 1500) this.finish(true);
    } else if (this.session.finished && t > this.session.lastCueEnd() + OUTRO) {
      this.finish(false);
    }
  };

  private finish(failed: boolean): void {
    this.ended = true;
    const g = this.engine.output.gain;
    g.setTargetAtTime(0, this.engine.ctx.currentTime, 0.3);
    this.hooks.onEnd(this.session, failed);
  }

  /** Touch/click: the nearest lane label or lane at the pointer's x. */
  private pointerLane(e: PointerEvent): void {
    if (this.opts.autoplay) return;
    const rect = this.els.hudCanvas.getBoundingClientRect();
    const { xs, width } = this.arena.laneScreen();
    const x = e.clientX - rect.left;
    let best = -1;
    let bestD = Infinity;
    xs.forEach((lx, i) => {
      const d = Math.abs(lx - x);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best < 0 || bestD > width * 2) return;
    this.keyboard.push(best, e.type === 'pointerdown', e.timeStamp);
  }
}

function glitch(): void {
  const app = document.getElementById('app');
  if (!app) return;
  app.classList.remove('glitch');
  void app.offsetWidth;
  app.classList.add('glitch');
}
