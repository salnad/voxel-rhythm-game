import type { SongPlayer } from '../audio/songPlayer';
import type { Sfx } from '../audio/sfx';
import { AUTOPLAY } from '../config/gameplay';
import { keysForLaneCount, type Settings } from '../core/settings';
import { CombatView } from '../render/combatView';
import { HighwayView } from '../render/highway';
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
  combatCanvas: HTMLCanvasElement;
  highwayCanvas: HTMLCanvasElement;
  labelLayer: HTMLElement;
}

export interface RunnerHooks {
  onFrame(session: GameSession, songTime: number): void;
  onEnd(session: GameSession, failed: boolean): void;
}

/** Drives one play: clock → inputs → session → views, once per animation frame. */
export class PlayRunner {
  readonly session: GameSession;
  private readonly highway: HighwayView;
  private readonly combat: CombatView;
  private readonly keyboard: KeyboardLanes;
  private autoQueue: LaneInput[] = [];
  private raf = 0;
  private lastPerf = 0;
  private ended = false;
  private downAt: number | null = null;
  private readonly onResize = () => {
    this.highway.resize();
    this.combat.resize();
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
    const keys = keysForLaneCount(settings, chart.lanes.length);
    this.keyboard = new KeyboardLanes((perf) => this.player.songTimeAt(perf));
    this.keyboard.setKeys(autoplay ? [] : keys);
    this.highway = new HighwayView(els.highwayCanvas, chart, this.session, keys);
    this.combat = new CombatView(els.combatCanvas, els.labelLayer, chart, this.session);
    if (autoplay)
      this.autoQueue = autoplayInputs(
        chart.notes,
        AUTOPLAY.jitter,
        AUTOPLAY.missRate,
        AUTOPLAY.seed,
      );

    this.session.bus.on('judgement', (j) => {
      if (j.judgement !== 'miss' && j.kind !== 'holdEnd')
        this.sfx.hit(j.lane, j.judgement === 'perfect');
      if (j.judgement !== 'miss' && chart.lanes[j.lane] === 'kick') this.rain.pulse(0.6);
    });
    this.session.bus.on('combat', (c) => {
      if (c.type === 'playerHit') {
        this.sfx.hurt();
        glitch();
      }
    });
    window.addEventListener('resize', this.onResize);
    els.highwayCanvas.addEventListener('pointerdown', this.onPointer);
    els.highwayCanvas.addEventListener('pointerup', this.onPointer);
  }

  start(): void {
    this.player.setBuffer(this.map.audio);
    this.applySettings(this.settings);
    this.player.play(-LEAD_IN);
    this.lastPerf = performance.now();
    this.raf = requestAnimationFrame(this.frame);
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
    this.combat.dispose();
    window.removeEventListener('resize', this.onResize);
    this.els.highwayCanvas.removeEventListener('pointerdown', this.onPointer);
    this.els.highwayCanvas.removeEventListener('pointerup', this.onPointer);
    this.session.bus.clear();
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
    this.highway.draw(drawT, this.settings.scrollSpeed);
    this.combat.update(drawT, this.player.playing ? dt : 0, realDt);
    this.rain.update(dt);
    this.hooks.onFrame(this.session, t);

    if (this.ended) return;
    if (this.session.sim.down) {
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

  private pointerLane(e: PointerEvent): void {
    if (this.autoplay) return;
    const rect = this.els.highwayCanvas.getBoundingClientRect();
    const n = this.map.chart.lanes.length;
    const laneW = Math.min(104, (rect.width * 0.86) / n);
    const x0 = rect.left + (rect.width - laneW * n) / 2;
    const lane = Math.floor((e.clientX - x0) / laneW);
    if (lane < 0 || lane >= n) return;
    this.keyboard.push(lane, e.type === 'pointerdown', e.timeStamp);
  }
}

function glitch(): void {
  const app = document.getElementById('app');
  if (!app) return;
  app.classList.remove('glitch');
  void app.offsetWidth;
  app.classList.add('glitch');
}
