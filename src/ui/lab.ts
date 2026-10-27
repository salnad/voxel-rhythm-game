import { experimentSeconds } from '../experiments/load';
import { BASELINE_KEY, EXPERIMENTS, experimentByKey } from '../experiments/registry';
import type { Experiment } from '../experiments/types';
import type { GameSession } from '../game/session';
import {
  currentTrial,
  isComplete,
  newLabState,
  overall,
  RATINGS,
  recordTrial,
  resultsJson,
  skipTrial,
  type LabState,
  type Ratings,
  type TrialStats,
} from '../lab/plan';
import { clearLab, loadLab, saveLab } from '../lab/store';

/** What the Lab needs from the app shell. */
export interface LabHost {
  show(html: string): HTMLElement;
  /** Mark the app as on a non-play screen (so global keys like R/Esc don't fire). */
  offScreen(): void;
  /** Show the how-to card for `exp`, then play it. The shell calls `lab.trialEnded` at the end. */
  runTrial(exp: Experiment, header: string, onBack: () => void): void;
  menu(): void;
  calibrate(): void;
  build: string;
}

const sameKeys = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((k) => b.includes(k));

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/** Seconds per trial spent outside play: the how-to card plus rating. */
const OVERHEAD_S = 10 + 25;

/**
 * The Playtest Lab: runs every experiment once in a counterbalanced order, each with a
 * 10-second how-to, then asks for four 1-5 ratings and an optional note. Progress is saved in
 * localStorage after every trial; the results screen copies compact JSON for chat.
 */
export class PlaytestLab {
  private state: LabState | null = loadLab();
  /** True while a Lab trial is being played (the shell routes the end of play here). */
  active = false;
  private plays = 0;
  private lastStats: TrialStats | null = null;
  private draft: { ratings: Partial<Ratings>; note: string } = { ratings: {}, note: '' };

  constructor(private readonly host: LabHost) {}

  private keys(): string[] {
    return EXPERIMENTS.map((e) => e.key);
  }

  private estimateMinutes(order: readonly string[]): number {
    const s = order.reduce((sum, k) => {
      const e = experimentByKey(k);
      return sum + (e ? experimentSeconds(e) + OVERHEAD_S : 0);
    }, 0);
    return Math.max(1, Math.round(s / 60));
  }

  home(): void {
    this.active = false;
    this.host.offScreen();
    const st = this.state;
    const stale = !!st && !sameKeys(st.order, this.keys());
    const inProgress = !!st && !stale && !isComplete(st);
    const done = st?.trials.length ?? 0;
    const order = st && !stale ? st.order : this.keys();
    const el = this.host.show(`
      <h1>PLAYTEST LAB</h1>
      <div class="sub">${EXPERIMENTS.length} gameplay experiments, one short trial each, about ${this.estimateMinutes(order)} minutes in total.</div>
      <div class="lab-box">
        <ol>
          <li>Each trial starts with a <b>10-second how-to</b> (press <kbd>Space</kbd> to skip it).</li>
          <li>Play the trial (about a minute, no-fail is on). Just play naturally.</li>
          <li>Rate it 1-5 on <b>fun</b>, <b>control</b>, <b>readability</b> and <b>music connection</b>, and add a one-line note if something stood out.</li>
        </ol>
        <div class="help">The baseline (the current game) always comes first as your reference; the rest are shuffled. Headphones help. Progress saves after every trial, so you can stop and resume.
        At the end, <b>COPY RESULTS</b> and paste the JSON into chat.</div>
      </div>
      ${inProgress ? `<div class="sub">In progress: trial ${st.index + 1} of ${st.order.length} (${done} rated).</div>` : ''}
      ${stale ? `<div class="sub">Your saved run (${done} rated) is from a version with different experiments. RESULTS still shows it; START begins a new run with all ${EXPERIMENTS.length}.</div>` : ''}
      <div style="margin-top:12px">
        ${inProgress ? '<button class="big" id="l-resume">RESUME</button>' : ''}
        <button class="big" id="l-start">${st && !stale ? 'START OVER' : 'START'}</button>
        ${done ? '<button class="big" id="l-results">RESULTS</button>' : ''}
        <button class="big" id="l-cal">CALIBRATE OFFSET</button>
        <button class="big" id="l-back">BACK</button>
      </div>`);
    el.querySelector<HTMLButtonElement>('#l-resume')?.addEventListener('click', () => this.next());
    el.querySelector<HTMLButtonElement>('#l-start')!.onclick = () => {
      if (
        st &&
        st.trials.length &&
        !confirm(
          'Start a new run? Your saved Lab ratings will be cleared (copy them from RESULTS first).',
        )
      )
        return;
      clearLab();
      this.state = newLabState(
        this.keys(),
        (Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0,
        this.host.build,
        BASELINE_KEY,
      );
      saveLab(this.state);
      this.next();
    };
    el.querySelector<HTMLButtonElement>('#l-results')?.addEventListener('click', () =>
      this.results(),
    );
    el.querySelector<HTMLButtonElement>('#l-cal')!.onclick = () => this.host.calibrate();
    el.querySelector<HTMLButtonElement>('#l-back')!.onclick = () => this.host.menu();
  }

  /** Run the current trial (or show results when every trial is done). */
  private next(): void {
    const st = this.state;
    if (!st) return this.home();
    const key = currentTrial(st);
    if (key === null) return this.results();
    const exp = experimentByKey(key);
    if (!exp) {
      this.state = skipTrial(st);
      saveLab(this.state);
      return this.next();
    }
    this.plays = 0;
    this.lastStats = null;
    this.draft = { ratings: {}, note: '' };
    this.play(exp);
  }

  private play(exp: Experiment): void {
    const st = this.state!;
    this.active = true;
    this.plays++;
    this.host.runTrial(exp, `PLAYTEST LAB · TRIAL ${st.index + 1} / ${st.order.length}`, () =>
      this.home(),
    );
  }

  /** The shell calls this when a Lab trial's play ends (instead of its results screen). */
  trialEnded(s: GameSession): void {
    this.active = false;
    const sc = s.score;
    this.lastStats = {
      acc: sc.accuracy,
      perfect: sc.counts.perfect,
      great: sc.counts.great,
      good: sc.counts.good,
      miss: sc.counts.miss,
      offsetMs: sc.meanOffsetMs,
      hitsTaken: s.duel.hitsTaken,
      combosCleared: s.combosCleared,
      combosFailed: s.combosFailed,
      defeated: s.duel.defeated,
      enemies: s.chart.encounters.length,
    };
    this.rate();
  }

  /** Abandon the trial mid-play (quit from pause): back to the rating screen if played once. */
  trialQuit(): void {
    this.active = false;
    this.rate();
  }

  private rate(): void {
    const st = this.state!;
    const key = currentTrial(st)!;
    const exp = experimentByKey(key)!;
    this.host.offScreen();
    const stats = this.lastStats;
    let focus = RATINGS.findIndex((r) => this.draft.ratings[r.key] === undefined);
    if (focus < 0) focus = 0;
    const el = this.host.show(`
      <div class="sub">PLAYTEST LAB · TRIAL ${st.index + 1} / ${st.order.length}</div>
      <h2>RATE: ${esc(exp.label)}</h2>
      ${stats ? `<div class="sub">accuracy ${(stats.acc * 100).toFixed(1)}% · ${stats.miss} missed · ${stats.hitsTaken} hits taken</div>` : ''}
      <div class="lab-rate">${RATINGS.map(
        (r, i) => `<div class="lab-row" data-row="${i}">
          <div class="lab-q"><b>${r.label}</b><span>${esc(r.ask)}</span></div>
          <div class="lab-opts">${[1, 2, 3, 4, 5]
            .map(
              (v) =>
                `<button class="lab-opt" data-k="${r.key}" data-v="${v}" aria-pressed="false">${v}</button>`,
            )
            .join('')}</div></div>`,
      ).join('')}</div>
      <div class="help">Keys: <kbd>1</kbd>-<kbd>5</kbd> rate the highlighted row (1 = bad, 5 = great), <kbd>↑</kbd> <kbd>↓</kbd> move. <kbd>Enter</kbd> saves.</div>
      <input id="l-note" class="lab-note" maxlength="160" placeholder="optional one-line note (what felt good or wrong?)" value="${esc(this.draft.note)}">
      <div style="margin-top:12px">
        <button class="big" id="l-save" disabled>SAVE &amp; NEXT</button>
        <button class="big" id="l-again">PLAY AGAIN</button>
        <button class="big" id="l-skip">SKIP</button>
        <button class="big" id="l-quit">PAUSE LAB</button>
      </div>`);
    const note = el.querySelector<HTMLInputElement>('#l-note')!;
    const save = el.querySelector<HTMLButtonElement>('#l-save')!;
    const refresh = () => {
      el.querySelectorAll<HTMLButtonElement>('.lab-opt').forEach((b) => {
        const on = this.draft.ratings[b.dataset.k as keyof Ratings] === Number(b.dataset.v);
        b.setAttribute('aria-pressed', String(on));
      });
      el.querySelectorAll<HTMLElement>('.lab-row').forEach((row) =>
        row.classList.toggle('focus', Number(row.dataset.row) === focus),
      );
      save.disabled = RATINGS.some((r) => this.draft.ratings[r.key] === undefined);
    };
    const set = (k: keyof Ratings, v: number) => {
      this.draft.ratings[k] = v;
      const i = RATINGS.findIndex((r) => r.key === k);
      focus = Math.min(RATINGS.length - 1, i + 1);
      refresh();
    };
    el.querySelectorAll<HTMLButtonElement>('.lab-opt').forEach((b) => {
      b.onclick = () => set(b.dataset.k as keyof Ratings, Number(b.dataset.v));
    });
    note.oninput = () => (this.draft.note = note.value);
    const onKey = (e: KeyboardEvent) => {
      if (!el.isConnected) return window.removeEventListener('keydown', onKey);
      if (document.activeElement === note) {
        if (e.key === 'Enter') {
          note.blur();
          if (!save.disabled) save.click();
        }
        return;
      }
      if (/^Digit[1-5]$/.test(e.code) || /^Numpad[1-5]$/.test(e.code)) {
        e.preventDefault();
        set(RATINGS[focus]!.key, Number(e.code.slice(-1)));
      } else if (e.code === 'ArrowDown') {
        focus = Math.min(RATINGS.length - 1, focus + 1);
        refresh();
      } else if (e.code === 'ArrowUp') {
        focus = Math.max(0, focus - 1);
        refresh();
      } else if (e.code === 'Enter' && !save.disabled) {
        save.click();
      }
    };
    window.addEventListener('keydown', onKey);
    const leave = () => window.removeEventListener('keydown', onKey);
    save.onclick = () => {
      leave();
      this.state = recordTrial(st, {
        exp: key,
        ratings: this.draft.ratings as Ratings,
        note: this.draft.note.trim(),
        plays: this.plays,
        stats: this.lastStats,
        at: new Date().toISOString(),
      });
      saveLab(this.state);
      this.next();
    };
    el.querySelector<HTMLButtonElement>('#l-again')!.onclick = () => {
      leave();
      this.play(exp);
    };
    el.querySelector<HTMLButtonElement>('#l-skip')!.onclick = () => {
      leave();
      this.state = skipTrial(st);
      saveLab(this.state);
      this.next();
    };
    el.querySelector<HTMLButtonElement>('#l-quit')!.onclick = () => {
      leave();
      this.home();
    };
    refresh();
  }

  results(): void {
    this.active = false;
    this.host.offScreen();
    const st = this.state;
    if (!st) return this.home();
    const json = resultsJson(st);
    const rows = st.order
      .map((k) => ({ k, t: st.trials.find((x) => x.exp === k), e: experimentByKey(k) }))
      .filter((r) => r.t);
    const el = this.host.show(`
      <h2>LAB RESULTS</h2>
      <div class="sub">${st.trials.length} of ${st.order.length} trials rated${isComplete(st) ? ' · complete' : ''}</div>
      <table class="lab-table">
        <tr><th>experiment</th>${RATINGS.map((r) => `<th>${r.label}</th>`).join('')}<th>avg</th><th>note</th></tr>
        ${rows
          .map(
            ({ k, t, e }) =>
              `<tr><td>${esc(e?.label ?? k)}</td>${RATINGS.map((r) => `<td>${t!.ratings[r.key]}</td>`).join('')}<td><b>${overall(t!.ratings).toFixed(1)}</b></td><td class="lab-n">${esc(t!.note)}</td></tr>`,
          )
          .join('')}
      </table>
      <div style="margin-top:12px">
        <button class="big" id="l-copy">COPY RESULTS</button>
        <button class="big" id="l-dl">DOWNLOAD .json</button>
        ${isComplete(st) ? '' : '<button class="big" id="l-resume">RESUME</button>'}
        <button class="big" id="l-home">LAB HOME</button>
      </div>
      <div class="help">Paste the copied JSON into chat. If copying is blocked, select the text below.</div>
      <textarea id="l-json" class="lab-json" readonly rows="8">${esc(json)}</textarea>`);
    const ta = el.querySelector<HTMLTextAreaElement>('#l-json')!;
    const copyBtn = el.querySelector<HTMLButtonElement>('#l-copy')!;
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(json);
      } catch {
        ta.select();
        document.execCommand('copy');
      }
      copyBtn.textContent = 'COPIED ✓';
    };
    el.querySelector<HTMLButtonElement>('#l-dl')!.onclick = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      a.download = `voxel-lab-${st.startedAt.slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    };
    el.querySelector<HTMLButtonElement>('#l-resume')?.addEventListener('click', () => this.next());
    el.querySelector<HTMLButtonElement>('#l-home')!.onclick = () => this.home();
  }
}
