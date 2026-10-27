import type { FxMeter } from '../audio/fx/trace';
import { ACTIONS, type Action } from '../chart/types';
import { ACTION_SPECS } from '../config/actions';
import { FX_FOR_ACTION, FX_VISUALS, type FxKind } from '../config/productionFx';
import { keyLabel } from '../core/settings';

const FX_LABEL: Record<FxKind, string> = {
  pump: 'PUMP',
  sweep: 'FILTER',
  stutter: 'REPEAT',
  lift: 'LIFT',
};

const GRADE: Record<string, string> = {
  perfect: 'PERFECT',
  great: 'GREAT',
  good: 'GOOD',
  miss: 'FUMBLE',
};

interface Module {
  el: HTMLElement;
  fill: HTMLElement;
  val: HTMLElement;
  grade: HTMLElement;
  leds: HTMLElement;
  text: string;
  gradeText: string;
}

/**
 * Shows what the PRODUCER FX effects are doing to the mix, from the same envelopes the audio
 * follows (FxMeter): the arena and highway shrink and dim with the pump, the arena blurs, drains and an
 * iris closes with the filter, the frame at the cue repeats on every beat-repeat slice, and the
 * camera and colour lift with the riser, flashing on the snap. A small FX RACK readout names
 * each effect, its key, its current value and the grade of the move that fired it.
 * Purely visual: it reads the meter and never touches game state.
 */
export class FxFeedback {
  private readonly iris: HTMLDivElement;
  private readonly freeze: HTMLCanvasElement;
  private readonly flash: HTMLDivElement;
  private readonly rack: HTMLDivElement;
  private readonly modules = new Map<FxKind, Module>();
  private frozenId = 0;
  private flashLevel = 0;
  private wasGap = false;

  constructor(
    stage: HTMLElement,
    private readonly arena: HTMLCanvasElement,
    keys: readonly string[],
  ) {
    const div = (cls: string) => {
      const d = document.createElement('div');
      d.className = cls;
      return d;
    };
    this.freeze = document.createElement('canvas');
    this.freeze.className = 'fx-freeze';
    this.iris = div('fx-iris');
    this.flash = div('fx-flash');
    arena.after(this.freeze, this.iris, this.flash);

    this.rack = div('fx-rack');
    this.rack.innerHTML = '<div class="fx-head">FX RACK</div>';
    ACTIONS.forEach((a: Action, i) => {
      const fx = FX_FOR_ACTION[a];
      const el = div('fx-mod');
      el.style.setProperty('--c', ACTION_SPECS[a].color);
      el.innerHTML = `<div class="fx-name"><kbd>${keyLabel(keys[i] ?? '')}</kbd>${FX_LABEL[fx]}</div>
        <div class="fx-meter"><div class="fx-fill"></div></div>
        <div class="fx-leds"></div><div class="fx-val">-</div><div class="fx-grade"></div>`;
      const q = (s: string) => el.querySelector(s) as HTMLElement;
      this.modules.set(fx, {
        el,
        fill: q('.fx-fill'),
        val: q('.fx-val'),
        grade: q('.fx-grade'),
        leds: q('.fx-leds'),
        text: '',
        gradeText: '',
      });
      this.rack.appendChild(el);
    });
    stage.appendChild(this.rack);
  }

  /** `dt`: seconds since the last frame (0 while paused). */
  update(m: FxMeter, dt: number): void {
    const k = FX_VISUALS.intensity;
    const V = FX_VISUALS;
    this.updateRack(m);

    // FLOURISH: dark in the pre-bar gap, a flash as the bar line snaps back
    if (this.wasGap && !m.gap) this.flashLevel = V.lift.flash;
    this.wasGap = m.gap;
    this.flashLevel = Math.max(0, this.flashLevel - dt * 3.5);

    const scale = 1 - V.pump.scale * m.duck * k + V.lift.zoom * m.lift * k;
    const rise = V.lift.risePx * m.lift * k;
    const stutterOn = m.repeat.slice >= 0;
    const jitter =
      stutterOn && m.repeat.open ? V.stutter.jitterPx * k * (m.repeat.slice % 2 === 0 ? 1 : -1) : 0;
    const transform =
      scale === 1 && rise === 0 && jitter === 0
        ? ''
        : `translate(${jitter.toFixed(1)}px, ${(-rise).toFixed(1)}px) scale(${scale.toFixed(4)})`;
    this.arena.style.transform = transform;
    this.freeze.style.transform = transform;

    // no hue shifts: the lanes' colours have to stay readable
    const blur = V.sweep.blurPx * m.closed * k;
    const sat = Math.max(0, 1 - V.sweep.desaturate * m.closed * k + 0.6 * m.lift * k);
    const gapDark = m.gap ? 0.35 : 1;
    const chopDark = stutterOn && !m.repeat.open ? 0.6 : 1;
    const bright =
      Math.max(0.1, 1 - V.pump.dim * m.duck * k + V.lift.bright * m.lift * k) * gapDark * chopDark;
    const idle = blur < 0.05 && Math.abs(sat - 1) < 0.01 && Math.abs(bright - 1) < 0.01;
    this.arena.style.filter = idle
      ? ''
      : `blur(${blur.toFixed(2)}px) saturate(${sat.toFixed(3)}) brightness(${bright.toFixed(3)})`;

    const iris = m.closed * V.sweep.iris * k;
    this.iris.style.opacity = iris.toFixed(3);
    this.iris.style.setProperty('--r', `${(72 - 52 * m.closed).toFixed(1)}%`);
    const glow = Math.max(this.flashLevel, V.lift.tint * m.lift);
    this.flash.style.opacity = (glow * k).toFixed(3);

    // STAB: repeat the frame at the start of the roll on every open slice
    if (stutterOn && m.repeat.id !== this.frozenId) {
      this.frozenId = m.repeat.id;
      this.grab();
    }
    const showFreeze = stutterOn && m.repeat.open && k > 0;
    this.freeze.style.opacity = showFreeze ? String(V.stutter.freezeOpacity) : '0';
    if (showFreeze) {
      const dir = m.repeat.slice % 2 === 0 ? 1 : -1;
      this.freeze.style.translate = `${(-2 * dir * V.stutter.jitterPx * k).toFixed(1)}px 0`;
    }
  }

  private grab(): void {
    const c = this.freeze;
    const w = Math.max(1, Math.round(this.arena.width / 2));
    const h = Math.max(1, Math.round(this.arena.height / 2));
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    c.getContext('2d')?.drawImage(this.arena, 0, 0, w, h);
  }

  private updateRack(m: FxMeter): void {
    const set = (fx: FxKind, on: boolean, fill: number, text: string) => {
      const mod = this.modules.get(fx)!;
      mod.el.classList.toggle('on', on);
      mod.fill.style.width = `${Math.round(Math.max(0, Math.min(1, fill)) * 100)}%`;
      if (mod.text !== text) {
        mod.text = text;
        mod.val.textContent = text;
      }
      const last = m.last[fx];
      const lit = !!last && last.age < FX_VISUALS.rackFlash;
      const grade = lit ? GRADE[last.judgement]! : '';
      mod.el.classList.toggle('hit', lit);
      mod.el.classList.toggle('fumble', lit && last.judgement === 'miss');
      if (mod.gradeText !== grade) {
        mod.gradeText = grade;
        mod.grade.textContent = grade;
      }
    };
    const db = 20 * Math.log10(Math.max(1e-3, 1 - m.duck));
    set('pump', m.duck > 0.06, m.duck, m.duck > 0.06 ? `${db.toFixed(0)} dB` : '0 dB');
    const hz =
      m.cutoffHz >= 1000 ? `${(m.cutoffHz / 1000).toFixed(1)} kHz` : `${m.cutoffHz.toFixed(0)} Hz`;
    set('sweep', m.closed > 0.05, m.closed, m.closed > 0.05 ? hz : 'OPEN');
    const r = m.repeat;
    set(
      'stutter',
      r.slice >= 0,
      r.of ? (r.slice + 1) / r.of : 0,
      r.slice >= 0 ? `1/${Math.round(4 / r.beats)}` : 'OFF',
    );
    const leds = this.modules.get('stutter')!.leds;
    const ledHtml =
      r.slice >= 0
        ? Array.from(
            { length: r.of },
            (_, i) => `<i class="${i <= r.slice ? 'lit' : ''}"></i>`,
          ).join('')
        : '';
    if (leds.innerHTML !== ledHtml) leds.innerHTML = ledHtml;
    set(
      'lift',
      m.lift > 0.02 || m.gap,
      m.gap ? 1 : m.lift,
      m.gap ? 'DROP' : m.lift > 0.02 ? `+${m.semis.toFixed(1)} st` : '0 st',
    );
  }

  dispose(): void {
    this.arena.style.transform = '';
    this.arena.style.filter = '';
    this.freeze.remove();
    this.iris.remove();
    this.flash.remove();
    this.rack.remove();
  }
}
