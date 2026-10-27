import * as THREE from 'three';
import type { Chart } from '../chart/build';
import { ACTIONS } from '../chart/types';
import { ACTION_SPECS } from '../config/actions';
import { HUD, PALETTE } from '../config/visuals';
import { keyLabel } from '../core/settings';
import type { ComboEvent, GameSession } from '../game/session';
import type { Judgement, JudgementEvent } from '../rhythm/judge';
import type { ArenaView } from './arenaView';
import { COMBO_COLOR, RETRY_COLOR } from './highway3d';
import { drawActionIcon, hexA } from './icons';

const LABEL: Record<Judgement, string> = {
  perfect: 'PERFECT',
  great: 'GREAT',
  good: 'GOOD',
  miss: 'MISS',
};

/** HUD switches (experiments turn parts of the default HUD off). */
export interface HudOptions {
  /** Key/action boxes along the bottom. Default true. */
  laneLabels?: boolean;
  /** Judgement text and combo counter beside the lanes. Default true. */
  judgement?: boolean;
  /** COMBO / RETRY tags drawn on the highway. Default true. */
  comboTags?: boolean;
  /** Chart prompts. Default true. */
  prompts?: boolean;
}

/** Screen-space layer over the arena: lane key labels, judgement, combo, prompts, banners. */
export class HudOverlay {
  /** Extra drawing after the HUD each frame (CSS pixels). */
  extraDraw: ((ctx: CanvasRenderingContext2D, t: number, w: number, h: number) => void) | null =
    null;
  private readonly ctx: CanvasRenderingContext2D;
  private judgementText: { j: Judgement; offset: number; at: number } | null = null;
  private comboBanner: { e: ComboEvent; at: number } | null = null;
  private dpr = 1;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly chart: Chart,
    private readonly session: GameSession,
    private readonly arena: ArenaView,
    private readonly keys: readonly string[],
    private readonly opts: HudOptions = {},
  ) {
    this.ctx = canvas.getContext('2d')!;
    session.bus.on('judgement', (e) => this.onJudgement(e));
    session.bus.on('combo', (e) => (this.comboBanner = { e, at: this.now }));
    this.resize();
  }

  resize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(this.canvas.clientWidth * this.dpr);
    this.canvas.height = Math.floor(this.canvas.clientHeight * this.dpr);
  }

  private now = 0;
  private onJudgement(e: JudgementEvent): void {
    if (e.kind === 'holdEnd' && e.judgement !== 'miss') return;
    this.judgementText = { j: e.judgement, offset: e.offset, at: this.now };
  }

  draw(t: number, approach: number): void {
    this.now = t;
    const { ctx } = this;
    const W = this.canvas.width / this.dpr;
    const H = this.canvas.height / this.dpr;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lanes = this.arena.laneScreen();
    if (this.opts.laneLabels ?? true) this.drawLaneLabels(lanes, W, H);
    if (this.opts.judgement ?? true) {
      this.drawJudgement(t, lanes, W);
      this.drawCombo(lanes, W);
    }
    if (this.opts.comboTags ?? true) this.drawComboTags(t, approach);
    if (this.opts.prompts ?? true) this.drawPrompt(t, W, H);
    this.drawEnemyBanner(t, W);
    this.drawComboBanner(t, W, H);
    this.drawTimingBar(W, H);

    const bars = this.chart.bars;
    const beat = this.session.conductor.beatAt(t);
    const p = Math.max(0, Math.min(1, beat / Math.max(1, bars.length * this.chart.beatsPerBar)));
    ctx.fillStyle = 'rgba(57,255,106,0.18)';
    ctx.fillRect(0, 0, W, 3);
    ctx.fillStyle = PALETTE.green;
    ctx.fillRect(0, 0, W * p, 3);
    this.extraDraw?.(ctx, t, W, H);
  }

  private drawLaneLabels(lanes: { xs: number[]; y: number; width: number }, _W: number, H: number) {
    const { ctx } = this;
    const held = this.arena.heldLanes;
    const w = Math.max(70, Math.min(130, lanes.width * 1.15));
    const y = H - 46;
    ACTIONS.forEach((a, i) => {
      const spec = ACTION_SPECS[a];
      const x = lanes.xs[i]! + (lanes.xs[i]! - (lanes.xs[0]! + lanes.xs[3]!) / 2) * 0.35;
      const on = held[i];
      ctx.fillStyle = on ? hexA(spec.color, 0.35) : 'rgba(0,10,4,0.72)';
      ctx.strokeStyle = hexA(spec.color, on ? 1 : 0.75);
      ctx.lineWidth = on ? 3 : 1.5;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - 26, w, 56, 8);
      ctx.fill();
      ctx.stroke();
      // key cap
      ctx.fillStyle = on ? PALETTE.white : spec.color;
      ctx.font = 'bold 20px monospace';
      ctx.fillText(keyLabel(this.keys[i] ?? ''), x - w / 2 + 20, y - 6);
      drawActionIcon(ctx, a, x + w / 2 - 20, y - 6, 11, spec.color);
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = hexA(spec.color, 0.95);
      ctx.fillText(spec.label, x, y + 17);
    });
  }

  private drawJudgement(t: number, lanes: { xs: number[]; y: number }, _W: number) {
    const jt = this.judgementText;
    if (!jt) return;
    const age = t - jt.at;
    if (age < 0 || age >= HUD.judgementTextLife) return;
    const { ctx } = this;
    const k = 1 - age / HUD.judgementTextLife;
    const x = lanes.xs[3]! + (lanes.xs[3]! - lanes.xs[2]!) * 1.6;
    const y = lanes.y - 30 - (1 - k) * 12;
    ctx.globalAlpha = Math.min(1, k * 2);
    ctx.fillStyle = PALETTE.judgement[jt.j];
    ctx.font = `bold ${Math.round(26 + 6 * k)}px monospace`;
    ctx.shadowColor = PALETTE.judgement[jt.j];
    ctx.shadowBlur = 14;
    ctx.textAlign = 'left';
    ctx.fillText(LABEL[jt.j], x, y);
    ctx.shadowBlur = 0;
    if (jt.j !== 'miss' && jt.j !== 'perfect' && jt.offset !== 0) {
      ctx.font = '13px monospace';
      ctx.fillText(jt.offset < 0 ? 'EARLY' : 'LATE', x, y + 24);
    }
    ctx.textAlign = 'center';
    ctx.globalAlpha = 1;
  }

  private drawCombo(lanes: { xs: number[]; y: number }, _W: number) {
    const combo = this.session.score.combo;
    if (combo < 4) return;
    const { ctx } = this;
    const x = lanes.xs[0]! - (lanes.xs[1]! - lanes.xs[0]!) * 1.6;
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(230,255,233,0.85)';
    ctx.font = 'bold 40px monospace';
    ctx.fillText(String(combo), x, lanes.y - 34);
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(57,255,106,0.8)';
    ctx.fillText('COMBO', x, lanes.y - 6);
    ctx.textAlign = 'center';
  }

  /** "COMBO" / "RETRY 2/3" tags at each combo measure's bar line on the highway. */
  private drawComboTags(t: number, approach: number) {
    const { ctx } = this;
    const hw = this.arena.highway;
    for (const p of this.session.conductor.plays) {
      if (p.start > t + approach) break;
      if (!p.combo || p.start + p.dur < t) continue;
      const z = p.start > t ? hw.cueZ(p.start, t, approach) : hw.hitZ;
      const at = this.arena.toScreen(new THREE.Vector3(hw.laneX(3) + 0.75, 0, z));
      const retry = p.attempt > 1;
      const color = retry || p.status === 'failed' ? RETRY_COLOR : COMBO_COLOR;
      const label =
        p.status === 'failed'
          ? 'FAILED'
          : retry
            ? `RETRY ${p.attempt - 1}/${p.maxAttempts - 1}`
            : 'COMBO';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      const w = ctx.measureText(label).width + 12;
      ctx.fillRect(at.x, at.y - 10, w, 20);
      ctx.fillStyle = color;
      ctx.fillText(label, at.x + 6, at.y + 1);
      ctx.textAlign = 'center';
    }
  }

  private drawComboBanner(t: number, W: number, H: number) {
    const cb = this.comboBanner;
    const { ctx } = this;
    const play = this.session.conductor.playAt(t);
    if (play?.combo) {
      const retry = play.attempt > 1;
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = retry || play.status === 'failed' ? RETRY_COLOR : COMBO_COLOR;
      ctx.fillText(
        play.status === 'failed'
          ? 'COMBO BROKEN'
          : retry
            ? `BOSS COMBO · RETRY ${play.attempt - 1}/${play.maxAttempts - 1}`
            : 'BOSS COMBO · clear the measure',
        W / 2,
        64,
      );
    }
    if (!cb) return;
    const age = t - cb.at;
    const life = cb.e.type === 'failed' ? 1.1 : 0.7;
    if (age < 0 || age > life) return;
    const k = 1 - age / life;
    ctx.globalAlpha = Math.min(1, k * 2.5);
    const failed = cb.e.type === 'failed';
    const color = failed ? RETRY_COLOR : COMBO_COLOR;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.round(34 + 8 * k)}px monospace`;
    const y = H * 0.27;
    ctx.fillText(failed ? 'COMBO FAILED' : 'COMBO CLEAR', W / 2, y);
    ctx.shadowBlur = 0;
    if (cb.e.type === 'failed') {
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = PALETTE.white;
      ctx.fillText(cb.e.retry ? 'again next measure' : 'no retries left: moving on', W / 2, y + 32);
    }
    ctx.globalAlpha = 1;
  }

  private drawPrompt(t: number, W: number, H: number) {
    const ct = this.chart.tempo.beatToSec(this.session.conductor.beatAt(t));
    const active = this.chart.prompts.filter((p) => ct >= p.time && ct < p.endTime);
    const p = active[active.length - 1];
    if (!p) return;
    const { ctx } = this;
    const fade = Math.min(1, (ct - p.time) / 0.25, (p.endTime - ct) / 0.35);
    const color = p.action ? ACTION_SPECS[p.action].color : PALETTE.white;
    ctx.font = 'bold 20px monospace';
    const textW = ctx.measureText(p.text).width;
    const iconW = p.action ? 92 : 0;
    const boxW = Math.min(W - 40, textW + iconW + 48);
    const x0 = (W - boxW) / 2;
    const y0 = H * 0.13;
    ctx.globalAlpha = fade;
    ctx.fillStyle = 'rgba(0,8,3,0.82)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.roundRect(x0, y0, boxW, 56, 10);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    if (p.action) {
      const lane = ACTIONS.indexOf(p.action);
      drawActionIcon(ctx, p.action, x0 + 34, y0 + 28, 15, color);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x0 + 56, y0 + 12, 32, 32, 5);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = 'bold 18px monospace';
      ctx.fillText(keyLabel(this.keys[lane] ?? ''), x0 + 72, y0 + 29);
    }
    ctx.fillStyle = PALETTE.white;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(p.text, x0 + 24 + iconW, y0 + 29, boxW - iconW - 40);
    ctx.textAlign = 'center';
    ctx.globalAlpha = 1;
  }

  private drawEnemyBanner(t: number, W: number) {
    const duel = this.session.duel;
    const k = duel.activeEncounter(t);
    if (k === null) return;
    const enc = this.chart.encounters[k]!;
    const st = duel.enemies[k]!;
    const { ctx } = this;
    const y = 30;
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = PALETTE.white;
    const status =
      st.state === 'defeated' ? ' · DEFEATED' : st.state === 'escaped' ? ' · ESCAPED' : '';
    ctx.fillText(`ENEMY ${k + 1}/${this.chart.encounters.length} · ${enc.name}${status}`, W / 2, y);
    // guard pips: offensive cues left to land
    const n = st.guardMax;
    if (n > 0) {
      const pw = Math.min(14, 260 / n);
      const total = pw * n;
      for (let i = 0; i < n; i++) {
        const filled = i < st.guard && st.state !== 'defeated';
        ctx.fillStyle = filled ? PALETTE.danger : 'rgba(255,59,92,0.18)';
        ctx.fillRect(W / 2 - total / 2 + i * pw + 1, y + 13, pw - 2, 6);
      }
    }
  }

  private drawTimingBar(W: number, H: number) {
    const { ctx } = this;
    const barY = H - 8;
    const barW = 220;
    const bx = W / 2;
    ctx.fillStyle = 'rgba(57,255,106,0.15)';
    ctx.fillRect(bx - barW / 2, barY - 1, barW, 2);
    ctx.fillStyle = PALETTE.white;
    ctx.fillRect(bx - 1, barY - 5, 2, 10);
    const offsets = this.session.score.recentOffsets;
    offsets.forEach((o, i) => {
      const a = (i + 1) / offsets.length;
      const x = bx + Math.max(-1, Math.min(1, o / 0.12)) * (barW / 2);
      ctx.fillStyle = hexA(Math.abs(o) < 0.04 ? PALETTE.white : PALETTE.green, a * 0.8);
      ctx.fillRect(x - 1, barY - 4, 2, 8);
    });
  }
}
