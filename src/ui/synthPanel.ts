import { morphWeights, TABLE_SHAPES } from '../synth/modifiers';
import {
  clampPatch,
  DEFAULT_PATCH,
  PARAM_SPECS,
  PATCH_PRESETS,
  type SynthPatch,
} from '../synth/patch';

const KEY = 'voxel-rhythm.patch.v1';

export function loadPatch(): SynthPatch {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return clampPatch({ ...DEFAULT_PATCH, ...(JSON.parse(raw) as Partial<SynthPatch>) });
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_PATCH };
}

function savePatch(p: SynthPatch): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

const SHAPE_FN: Record<(typeof TABLE_SHAPES)[number], (x: number) => number> = {
  sine: (x) => Math.sin(x * Math.PI * 2),
  triangle: (x) => 1 - 4 * Math.abs(((x + 0.25) % 1) - 0.5),
  saw: (x) => 2 * (x % 1) - 1,
  square: (x) => (x % 1 < 0.5 ? 1 : -1),
};

/** The "WAVETABLE" panel: live-edits the patch that powers the sword. */
export class SynthPanel {
  readonly el: HTMLDivElement;
  private readonly wave: HTMLCanvasElement;
  private readonly inputs = new Map<string, HTMLInputElement>();
  patch: SynthPatch;

  constructor(
    parent: HTMLElement,
    private readonly onChange: (p: SynthPatch) => void,
  ) {
    this.patch = loadPatch();
    this.el = document.createElement('div');
    this.el.className = 'synth-panel';
    this.el.innerHTML = `
      <div class="synth-head"><span>WAVETABLE // SWORD SYNTH</span><span class="hint">[Tab] expand/collapse</span></div>
      <canvas class="synth-wave" width="260" height="70"></canvas>
      <div class="synth-presets"></div>
      <div class="synth-params"></div>`;
    parent.appendChild(this.el);
    this.wave = this.el.querySelector('.synth-wave')!;

    const presets = this.el.querySelector('.synth-presets')!;
    for (const [name, p] of Object.entries(PATCH_PRESETS)) {
      const b = document.createElement('button');
      b.textContent = name;
      b.onclick = () => this.set({ ...this.patch, ...p });
      presets.appendChild(b);
    }

    const params = this.el.querySelector('.synth-params')!;
    for (const spec of PARAM_SPECS) {
      const row = document.createElement('label');
      row.className = 'synth-row' + (spec.live ? '' : ' locked');
      row.title = spec.effect;
      row.innerHTML = `<span class="lbl">${spec.label}</span>`;
      const input = document.createElement('input');
      input.type = 'range';
      input.min = String(spec.min);
      input.max = String(spec.max);
      input.step = String(spec.step);
      input.disabled = !spec.unlocked;
      input.oninput = () => this.set({ ...this.patch, [spec.key]: Number(input.value) });
      input.addEventListener('keydown', (e) => e.preventDefault());
      const fx = document.createElement('span');
      fx.className = 'fx';
      fx.textContent = spec.unlocked ? spec.effect : `LOCKED ${spec.effect}`;
      row.append(input, fx);
      params.appendChild(row);
      this.inputs.set(spec.key, input);
    }
    this.sync();
  }

  set(p: SynthPatch): void {
    this.patch = clampPatch(p);
    savePatch(this.patch);
    this.sync();
    this.onChange(this.patch);
  }

  /** Expand/collapse. Collapsed shows only the header + waveform so it doesn't cover the fight. */
  toggle(force?: boolean): void {
    this.el.classList.toggle('compact', force === undefined ? undefined : !force);
  }

  private sync(): void {
    for (const spec of PARAM_SPECS) {
      const input = this.inputs.get(spec.key)!;
      input.value = String(this.patch[spec.key]);
    }
    this.drawWave();
  }

  private drawWave(): void {
    const c = this.wave.getContext('2d')!;
    const { width: W, height: H } = this.wave;
    c.clearRect(0, 0, W, H);
    c.fillStyle = 'rgba(0,20,6,0.8)';
    c.fillRect(0, 0, W, H);
    const w = morphWeights(this.patch.wtPosition);
    const voices = Math.round(this.patch.unison);
    const smooth = 1 - this.patch.cutoff; // crude "filter" visual
    for (let v = 0; v < voices; v++) {
      const det = voices > 1 ? (v / (voices - 1) - 0.5) * this.patch.detune * 0.12 : 0;
      c.strokeStyle = v === Math.floor(voices / 2) ? '#e6ffe9' : 'rgba(57,255,106,0.55)';
      c.lineWidth = v === Math.floor(voices / 2) ? 2 : 1;
      c.beginPath();
      let prev = 0;
      for (let i = 0; i <= W; i++) {
        const x = (i / W) * 2 * (1 + det);
        let y = 0;
        TABLE_SHAPES.forEach((s, k) => (y += (w[k] ?? 0) * SHAPE_FN[s](x)));
        y = prev + (y - prev) * (1 - smooth * 0.85);
        prev = y;
        const py = H / 2 - y * (H * 0.38);
        if (i === 0) c.moveTo(i, py);
        else c.lineTo(i, py);
      }
      c.stroke();
    }
    c.fillStyle = 'rgba(57,255,106,0.7)';
    c.font = '10px monospace';
    const names = TABLE_SHAPES.map(
      (s, k) => `${s}${(w[k] ?? 0) > 0.01 ? ` ${Math.round((w[k] ?? 0) * 100)}%` : ''}`,
    )
      .filter((_, k) => (w[k] ?? 0) > 0.01)
      .join(' / ');
    c.fillText(names, 4, H - 4);
  }
}
