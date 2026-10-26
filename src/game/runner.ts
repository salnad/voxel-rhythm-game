import type { SongPlayer } from '../audio/songPlayer';
import type { Sfx } from '../audio/sfx';
import type { Action } from '../chart/types';
import { APPROACH_SECONDS, AUTOPLAY } from '../config/gameplay';
import { CAMERA } from '../config/visuals';
import type { Settings } from '../core/settings';
import { ArenaView } from '../render/arenaView';
import { HudOverlay } from '../render/hudOverlay';
import type { DigitalRain } from '../render/rain';
import { autoplayInputs, KeyboardLanes, type LaneInput } from '../rhythm/input';
import type { SynthPatch } from '../synth/patch';
import type { LoadedMap } from './maps';
import { GameSession } from './session';

/** Seconds of lead-in before audio position 0. */
const LEAD_IN = 2.5;
/** Seconds after the last note before results. */
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

/** Drives one play: clock → inputs → session → views, once per animation frame. */
export class PlayRunner {
  readonly session: GameSession;
  private readonly arena: ArenaView;
  private readonly hud: HudOverlay;
  private readonly keyboard: KeyboardLanes;
  private autoQueue: LaneInput[] = [];
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
    private readonly map: LoadedMap,
    private readonly player: SongPlayer,
    private readonly sfx: Sfx,
    private readonly rain: DigitalRain,
    private settings: Settings,
    patch: SynthPatch,
    private readonly autoplay: boolean,
    private readonly hooks: RunnerHooks,
  ) {
    const chart = map.chart;
    this.session = new GameSession(chart, { noFail: settings.noFail, patch });
    const keys = settings.keys4;
    this.keyboard = new KeyboardLanes((perf) => this.player.songTimeAt(perf));
    this.keyboard.setKeys(autoplay ? [] : keys);
    this.arena = new ArenaView(els.arenaCanvas, els.labelLayer, chart, this.session);
    this.hud = new HudOverlay(els.hudCanvas, chart, this.session, this.arena, keys);
    if (autoplay)
      this.autoQueue = autoplayInputs(
        chart.notes,
        AUTOPLAY.jitter,
        AUTOPLAY.missRate,
        AUTOPLAY.seed,
      );

    this.session.bus.on('input', (i) => {
      if (i.down) this.sfx.swing(chart.lanes[i.lane] as Action);
    });
    this.session.bus.on('action', (a) => {
      if (a.hit && a.kind !== 'holdEnd') this.sfx.hit(a.action, a.judgement === 'perfect');
      if (a.hit && a.action === 'block') this.rain.pulse(0.6);
      if (a.hit && a.action === 'flourish') this.rain.pulse(1);
    });
    this.session.bus.on('duel', (d) => {
      if (d.type === 'playerHit') {
        this.sfx.hurt();
        glitch();
      } else if (d.type === 'recovered') {
        this.sfx.clank();
      } else if (d.type === 'defeated') {
        this.sfx.shatter();
      }
    });
    window.addEventListener('resize', this.onResize);
    els.hudCanvas.addEventListener('pointerdown', this.onPointer);
    els.hudCanvas.addEventListener('pointerup', this.onPointer);
  }

  start(): void {
    this.player.setBuffer(this.map.audio);
    this.applySettings(this.settings);
    this.player.play(-LEAD_IN);
    this.lastPerf = performance.now();
    this.raf = requestAnimationFrame(this.frame);
    if (import.meta.env.DEV) {
      // Dev-only hook for automated playtests (scripts/ or CDP).
      (window as unknown as Record<string, unknown>).__vr = {
        songTime: () => this.player.songTimeAt(performance.now()),
        session: this.session,
        camera: CAMERA,
      };
    }
  }

  applySettings(s: Settings): void {
    this.settings = s;
    this.player.userOffsetSec = s.audioOffsetMs / 1000;
    this.player.output.gain.cancelScheduledValues(0);
    this.player.output.gain.value = s.musicVolume;
    this.sfx.volume = s.hitsoundVolume;
  }

  setPatch(p: SynthPatch): void {
    this.session.setPatch(p);
  }

  get paused(): boolean {
    return !this.player.playing;
  }

  pause(): void {
    this.player.pause();
  }

  resume(): void {
    this.player.resume();
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    this.player.stop();
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
    this.player.sampleClock(now);
    const t = this.player.songTimeAt(now);
    if (this.player.playing) {
      const inputs = this.keyboard.drain();
      while (this.autoQueue.length && this.autoQueue[0]!.time <= t)
        inputs.push(this.autoQueue.shift()!);
      inputs.sort((a, b) => a.time - b.time);
      this.session.step(inputs, t);
    }
    const drawT = t + this.settings.visualOffsetMs / 1000;
    const approach = APPROACH_SECONDS / Math.max(0.25, this.settings.scrollSpeed);
    this.arena.update(drawT, this.player.playing ? dt : 0, realDt, approach);
    this.hud.draw(drawT);
    this.rain.update(dt);
    this.hooks.onFrame(this.session, t);

    if (this.ended) return;
    if (this.session.duel.down) {
      this.downAt ??= now;
      this.player.output.gain.value *= 0.95;
      if (now - this.downAt > 1500) this.finish(true);
    } else if (this.session.judge.finished && t > this.map.chart.lastNoteTime + OUTRO) {
      this.finish(false);
    }
  };

  private finish(failed: boolean): void {
    this.ended = true;
    const g = this.player.output.gain;
    g.setTargetAtTime(0, this.player.ctx.currentTime, 0.3);
    this.hooks.onEnd(this.session, failed);
  }

  /** Touch/click: the nearest lane label or lane at the pointer's x. */
  private pointerLane(e: PointerEvent): void {
    if (this.autoplay) return;
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
