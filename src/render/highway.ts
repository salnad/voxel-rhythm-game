import type { Chart } from '../chart/build';
import { laneStyle } from '../config/combat';
import { HIGHWAY, PALETTE } from '../config/visuals';
import type { GameSession } from '../game/session';
import type { Judgement, JudgementEvent } from '../rhythm/judge';

const LABEL: Record<Judgement, string> = {
  perfect: 'PERFECT',
  great: 'GREAT',
  good: 'GOOD',
  miss: 'MISS',
};

function keyLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code === 'Space') return '␣';
  if (code === 'Semicolon') return ';';
  return code;
}

/** osu!mania-style vertical highway on a 2D canvas. Reads session state; owns only effects. */
export class HighwayView {
  private readonly ctx: CanvasRenderingContext2D;
  private judgementText: { j: Judgement; offset: number; at: number } | null = null;
  private laneFlash: number[] = [];
  private held: boolean[] = [];
  private now = 0;
  private dpr = 1;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly chart: Chart,
    private readonly session: GameSession,
    private readonly keys: string[],
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.laneFlash = chart.lanes.map(() => -1);
    this.held = chart.lanes.map(() => false);
    session.bus.on('judgement', (e) => this.onJudgement(e));
    session.bus.on('input', (i) => {
      this.held[i.lane] = i.down;
    });
    this.resize();
  }

  resize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(this.canvas.clientWidth * this.dpr);
    this.canvas.height = Math.floor(this.canvas.clientHeight * this.dpr);
  }

  private onJudgement(e: JudgementEvent): void {
    if (e.kind === 'holdEnd' && e.judgement !== 'miss') return;
    this.judgementText = { j: e.judgement, offset: e.offset, at: this.now };
    if (e.judgement !== 'miss') this.laneFlash[e.lane] = this.now;
  }

  draw(songTime: number, scrollSpeed: number): void {
    this.now = songTime;
    const { ctx, chart, session } = this;
    const W = this.canvas.width / this.dpr;
    const H = this.canvas.height / this.dpr;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const n = chart.lanes.length;
    const laneW = Math.min(HIGHWAY.maxLaneWidth, (W * 0.86) / n);
    const totalW = laneW * n;
    const x0 = (W - totalW) / 2;
    const judgeY = H * (1 - HIGHWAY.judgeLineFromBottom);
    const pxPerSec = scrollSpeed * H;
    const yOf = (t: number) => judgeY - (t - songTime) * pxPerSec;
    const visibleAhead = judgeY / pxPerSec;

    // lane backgrounds
    ctx.fillStyle = 'rgba(0, 10, 3, 0.82)';
    ctx.fillRect(x0, 0, totalW, H);
    for (let i = 0; i < n; i++) {
      const style = laneStyle(chart.lanes[i]!, i);
      const lx = x0 + i * laneW;
      const flashAge = songTime - this.laneFlash[i]!;
      if (this.held[i] || (flashAge >= 0 && flashAge < HIGHWAY.laneFlashLife)) {
        const a = this.held[i] ? 0.16 : 0.35 * (1 - flashAge / HIGHWAY.laneFlashLife);
        const g = ctx.createLinearGradient(0, judgeY, 0, judgeY - H * 0.5);
        g.addColorStop(0, hexA(style.color, a));
        g.addColorStop(1, hexA(style.color, 0));
        ctx.fillStyle = g;
        ctx.fillRect(lx, 0, laneW, judgeY);
      }
      ctx.strokeStyle = 'rgba(57,255,106,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lx + 0.5, 0);
      ctx.lineTo(lx + 0.5, H);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(57,255,106,0.4)';
    ctx.strokeRect(x0 + 0.5, -1, totalW - 1, H + 2);

    // beat / bar lines
    const tempo = chart.tempo;
    const firstBeat = Math.ceil(tempo.secToBeat(songTime - 0.3));
    const lastBeat = Math.floor(tempo.secToBeat(songTime + visibleAhead));
    for (let b = firstBeat; b <= lastBeat; b++) {
      const y = yOf(tempo.beatToSec(b));
      const bar = b % chart.beatsPerBar === 0;
      ctx.fillStyle = bar ? 'rgba(57,255,106,0.28)' : 'rgba(57,255,106,0.08)';
      ctx.fillRect(x0, y, totalW, bar ? 2 : 1);
    }

    // notes (draw back to front)
    const noteH = HIGHWAY.noteHeight;
    ctx.font = `bold ${Math.round(noteH * 0.7)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const note of chart.notes) {
      if (note.time > songTime + visibleAhead + 0.1) break;
      const pending = session.judge.isPending(note.id);
      const holding = session.judge.isHolding(note.id);
      if (!pending && !holding) continue;
      const style = laneStyle(note.laneName, note.lane);
      const lx = x0 + note.lane * laneW + 4;
      const w = laneW - 8;
      let headY = yOf(note.time);
      if (holding) headY = judgeY;
      if (note.endTime !== null) {
        const tailY = yOf(note.endTime);
        if (tailY < headY) {
          ctx.fillStyle = hexA(style.color, holding ? 0.55 : 0.3);
          ctx.fillRect(lx + w * 0.22, tailY, w * 0.56, headY - tailY);
          ctx.fillStyle = hexA(style.color, 0.8);
          ctx.fillRect(lx + w * 0.22, tailY - 3, w * 0.56, 6);
        }
      }
      if (headY < -noteH || headY > H + noteH) continue;
      const late = !holding && songTime > note.time;
      ctx.fillStyle = hexA(style.color, 0.18);
      ctx.fillRect(lx - 3, headY - noteH / 2 - 3, w + 6, noteH + 6);
      ctx.fillStyle = late ? hexA(style.color, 0.6) : style.color;
      roundRect(ctx, lx, headY - noteH / 2, w, noteH, 5);
      ctx.fill();
      ctx.fillStyle = '#001a08';
      ctx.fillText(style.glyph, lx + w / 2, headY + 1);
    }

    // judgement line + receptors
    ctx.fillStyle = PALETTE.green;
    ctx.shadowColor = PALETTE.green;
    ctx.shadowBlur = 10;
    ctx.fillRect(x0, judgeY - 1, totalW, 2);
    ctx.shadowBlur = 0;
    ctx.font = 'bold 15px monospace';
    for (let i = 0; i < n; i++) {
      const style = laneStyle(chart.lanes[i]!, i);
      const lx = x0 + i * laneW + 4;
      ctx.strokeStyle = this.held[i] ? PALETTE.white : hexA(style.color, 0.7);
      ctx.lineWidth = this.held[i] ? 3 : 1.5;
      roundRect(ctx, lx, judgeY - noteH / 2, laneW - 8, noteH, 5);
      ctx.stroke();
      ctx.fillStyle = hexA(style.color, 0.9);
      ctx.fillText(keyLabel(this.keys[i] ?? ''), lx + (laneW - 8) / 2, judgeY + noteH + 6);
      ctx.fillStyle = hexA(style.color, 0.55);
      ctx.font = '11px monospace';
      ctx.fillText(chart.lanes[i]!.toUpperCase(), lx + (laneW - 8) / 2, judgeY + noteH + 24);
      ctx.font = 'bold 15px monospace';
    }

    // timing error bar
    const barY = H - 14;
    const barW = Math.min(totalW, 220);
    const bx = W / 2;
    ctx.fillStyle = 'rgba(57,255,106,0.15)';
    ctx.fillRect(bx - barW / 2, barY - 1, barW, 2);
    ctx.fillStyle = PALETTE.white;
    ctx.fillRect(bx - 1, barY - 6, 2, 12);
    const offsets = session.score.recentOffsets;
    offsets.forEach((o, i) => {
      const a = (i + 1) / offsets.length;
      const x = bx + Math.max(-1, Math.min(1, o / 0.12)) * (barW / 2);
      ctx.fillStyle = hexA(Math.abs(o) < 0.04 ? PALETTE.white : PALETTE.green, a * 0.8);
      ctx.fillRect(x - 1, barY - 4, 2, 8);
    });

    // combo + judgement text
    const combo = session.score.combo;
    if (combo >= 4) {
      ctx.fillStyle = 'rgba(57,255,106,0.25)';
      ctx.font = `bold ${Math.round(Math.min(72, laneW * 0.9))}px monospace`;
      ctx.fillText(String(combo), W / 2, H * 0.38);
    }
    const jt = this.judgementText;
    if (jt) {
      const age = songTime - jt.at;
      if (age >= 0 && age < HIGHWAY.judgementTextLife) {
        const k = 1 - age / HIGHWAY.judgementTextLife;
        ctx.globalAlpha = Math.min(1, k * 2);
        ctx.fillStyle = PALETTE.judgement[jt.j];
        ctx.font = `bold ${Math.round(30 + 8 * k)}px monospace`;
        ctx.shadowColor = PALETTE.judgement[jt.j];
        ctx.shadowBlur = 16;
        ctx.fillText(LABEL[jt.j], W / 2, judgeY - H * 0.2);
        ctx.shadowBlur = 0;
        if (jt.j !== 'miss' && jt.j !== 'perfect' && jt.offset !== 0) {
          ctx.font = '13px monospace';
          ctx.fillText(jt.offset < 0 ? 'EARLY' : 'LATE', W / 2, judgeY - H * 0.2 + 28);
        }
        ctx.globalAlpha = 1;
      }
    }

    // progress
    const p = Math.max(0, Math.min(1, songTime / Math.max(1, chart.lastNoteTime)));
    ctx.fillStyle = 'rgba(57,255,106,0.2)';
    ctx.fillRect(x0, 0, totalW, 3);
    ctx.fillStyle = PALETTE.green;
    ctx.fillRect(x0, 0, totalW * p, 3);
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function hexA(hex: string, a: number): string {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${Math.max(0, Math.min(1, a))})`;
}
