import { PALETTE, RAIN } from '../config/visuals';

/** Matrix-style digital rain on a 2D canvas. `pulse()` brightens it (e.g. on kicks). */
export class DigitalRain {
  private readonly ctx: CanvasRenderingContext2D;
  private drops: number[] = [];
  private speeds: number[] = [];
  private cols = 0;
  private boost = 0;
  private acc = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  resize(): void {
    const w = (this.canvas.width = Math.floor(this.canvas.clientWidth));
    this.canvas.height = Math.floor(this.canvas.clientHeight);
    this.cols = Math.ceil(w / RAIN.fontSize);
    this.drops = Array.from({ length: this.cols }, () => Math.random() * -50);
    this.speeds = Array.from({ length: this.cols }, () => 0.6 + Math.random() * 0.8);
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  pulse(amount = 1): void {
    this.boost = Math.min(2, this.boost + amount);
  }

  update(dt: number): void {
    const { ctx, canvas } = this;
    this.boost = Math.max(0, this.boost - dt * 4);
    this.acc += dt;
    if (this.acc < 1 / 30) return; // rain at 30 fps is plenty
    const step = this.acc;
    this.acc = 0;
    ctx.fillStyle = `rgba(0,0,0,${0.12 + step})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${RAIN.fontSize}px monospace`;
    const rows = canvas.height / RAIN.fontSize;
    for (let i = 0; i < this.cols; i++) {
      const y = this.drops[i]!;
      const ch = RAIN.glyphs[Math.floor(Math.random() * RAIN.glyphs.length)]!;
      ctx.fillStyle = Math.random() < 0.05 + this.boost * 0.1 ? PALETTE.white : PALETTE.green;
      ctx.fillText(ch, i * RAIN.fontSize, y * RAIN.fontSize);
      this.drops[i] = y + this.speeds[i]! * RAIN.speed * step * (1 + this.boost);
      if (this.drops[i]! > rows && Math.random() > 0.97) this.drops[i] = Math.random() * -20;
    }
  }
}
