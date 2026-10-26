/**
 * The procedural demo song "NEON//DAEMON": hyperpop at 160 BPM in E major (C#m - A - E - B).
 * Pure data: the same event list drives the Web Audio renderer (render.ts) and the demo
 * charts (src/chart/demoChart.ts), so they can never drift.
 *
 * The drums ARE the chart. Every kick is a BLOCK, every clap a SLASH, every rim tick a STAB
 * and every crash a FLOURISH in the normal chart; the easy chart is a subset of those hits.
 * Hats, bass, pads and synths are audio only.
 */
import type { Action } from '../../chart/types';

export type Instrument =
  'kick' | 'clap' | 'rim' | 'impact' | 'hat' | 'bass' | 'lead' | 'arp' | 'stab' | 'pad' | 'riser';

export interface CompEvent {
  inst: Instrument;
  beat: number;
  /** Length in beats. */
  len: number;
  /** MIDI note(s). */
  midi: number[];
  vel: number;
  /** Bass glide source note. */
  glideFrom?: number;
  /** Set on charted drum hits: the action, hold length, and whether easy keeps it. */
  chart?: { action: Action; length?: number; easy: boolean };
}

export const DEMO_BPM = 160;
export const DEMO_BARS = 66;
export const DEMO_LENGTH_BEATS = DEMO_BARS * 4 + 4;

export type Section = 'intro' | 'verse' | 'build' | 'drop1' | 'break' | 'drop2' | 'outro';

export function sectionOfBar(bar: number): Section {
  if (bar < 10) return 'intro';
  if (bar < 16) return 'verse';
  if (bar < 24) return 'build';
  if (bar < 40) return 'drop1';
  if (bar < 48) return 'break';
  if (bar < 64) return 'drop2';
  return 'outro';
}

/**
 * Drum/chart patterns, one string per bar, one character per eighth note:
 * B kick (block) · S clap (slash) · T rim (stab) · F crash (flourish) · `-` holds the
 * previous note another eighth · `.` rest. Each entry is [normal, easy]; easy must only
 * use hits that normal has.
 */
type BarPattern = readonly [normal: string, easy: string];
const R = '........';
const P = {
  rest: [R, R],
  block: ['B.......', 'B.......'],
  blockSlash: ['B...S...', 'B...S...'],
  // verse: stab arrives, then mixing
  v1: ['B...T...', 'B...T...'],
  v2: ['B.S.T...', 'B...T...'],
  v3: ['B.S.T.S.', 'B.....S.'],
  v4: ['B.T.S...', 'B...S...'],
  // build
  finish: ['F.......', 'F.......'],
  b1: ['B.S.B.S.', 'B.....S.'],
  b2: ['B.S.T.S.', 'B.....S.'],
  b3: ['B.T.S.T.', 'B...S.T.'],
  b4: ['B.S.B.ST', 'B...B...'],
  b5: ['B.ST.BS.', 'B.S...S.'],
  roll: ['B.S.SSSS', 'B.S.S.S.'],
  // drop 1
  walk1: ['F.....B.', 'F.......'],
  g1: ['B.ST.BS.', 'B.S...S.'],
  g2: ['BTS.B.ST', 'B.S.B...'],
  g3: ['B.S.TBS.', 'B...T.S.'],
  g4: ['B.STB.S.', 'B.S.B...'],
  g5: ['B.ST.BSS', 'B.S...S.'],
  // break: blade locks (held blocks) on the sustained bass, stabs on the arp
  k1: ['B--...T.', 'B.....T.'],
  k2: ['B--...T.', 'B.......'],
  k3: ['T...T.S.', 'T...T...'],
  k4: ['B--.T.S.', 'B.......'],
  k5: ['T.T.T.S.', 'T...T...'],
  // drop 2
  walk2: ['F...B.S.', 'F.....S.'],
  h1: ['BTSTB.ST', 'B.S...S.'],
  h2: ['B.STBTS.', 'B...B.S.'],
  h3: ['BTS.BTST', 'B.S..T..'],
  h4: ['B.SSB.ST', 'B.S.B...'],
  h5: ['BTSTB.S.', 'B.S.B.S.'],
} satisfies Record<string, BarPattern>;

/** The whole song, bar by bar. */
// prettier-ignore
const BARS: readonly BarPattern[] = [
  // intro (0-9): BLOCK alone, then BLOCK + SLASH
  P.rest, P.rest, P.block, P.block, P.block, P.block,
  P.blockSlash, P.blockSlash, P.blockSlash, P.blockSlash,
  // verse (10-15): STAB joins
  P.rest, P.v1, P.v1, P.v2, P.v3, P.v4,
  // build (16-23): FLOURISH finishes each enemy on the crash
  P.finish, P.b1, P.b2, P.b3, P.finish, P.b4, P.b5, P.roll,
  // drop 1 (24-39)
  P.walk1, P.g1, P.g1, P.g2,
  P.walk1, P.g1, P.g2, P.g3,
  P.walk1, P.g2, P.g3, P.g4,
  P.walk1, P.g3, P.g4, P.g5,
  // break (40-47)
  P.finish, P.k1, P.k2, P.k3, P.k1, P.k4, P.k5, P.roll,
  // drop 2 (48-63)
  P.walk2, P.h1, P.h2, P.h1,
  P.walk2, P.h2, P.h3, P.h2,
  P.walk2, P.h3, P.h4, P.h1,
  P.walk2, P.h4, P.h3, P.h5,
  // outro (64-65)
  P.finish, P.rest,
];

const DRUM: Record<string, { inst: Instrument; action: Action }> = {
  B: { inst: 'kick', action: 'block' },
  S: { inst: 'clap', action: 'slash' },
  T: { inst: 'rim', action: 'stab' },
  F: { inst: 'impact', action: 'flourish' },
};

export interface PatternHit {
  beat: number;
  char: string;
  length: number;
}

/** Parse one bar pattern into hits (beats relative to the bar). */
export function parsePattern(p: string): PatternHit[] {
  if (p.length !== 8) throw new Error(`pattern "${p}" must be 8 eighth notes long`);
  const hits: PatternHit[] = [];
  for (let i = 0; i < 8; i++) {
    const c = p[i]!;
    if (c === '.') continue;
    if (c === '-') {
      const last = hits[hits.length - 1];
      if (!last) throw new Error(`pattern "${p}" starts with a hold`);
      last.length += 0.5;
      continue;
    }
    if (!DRUM[c]) throw new Error(`pattern "${p}": unknown character "${c}"`);
    hits.push({ beat: i * 0.5, char: c, length: 0 });
  }
  return hits;
}

const CHORDS: number[][] = [
  [61, 64, 68, 73], // C#m
  [61, 64, 69, 73], // A
  [59, 64, 68, 71], // E
  [59, 63, 66, 71], // B
];
const BASS_ROOTS = [37, 33, 40, 35];

/** 4-bar lead melody: [beat, len, midi]. */
const MELODY: Array<[number, number, number]> = [
  [0, 0.5, 80],
  [0.5, 0.5, 80],
  [1, 0.5, 83],
  [1.5, 0.5, 80],
  [2, 0.5, 78],
  [2.5, 0.5, 76],
  [3, 1, 73],
  [4, 0.5, 76],
  [4.5, 0.5, 76],
  [5, 0.5, 78],
  [5.5, 0.5, 80],
  [6, 1, 85],
  [7, 1, 83],
  [8, 0.5, 80],
  [8.5, 0.5, 83],
  [9, 1, 88],
  [10, 0.5, 87],
  [10.5, 0.5, 83],
  [11, 1, 80],
  [12, 1.5, 78],
  [13.5, 0.5, 75],
  [14, 0.5, 78],
  [14.5, 0.5, 80],
  [15, 1, 83],
];

export function composeDemo(): CompEvent[] {
  const ev: CompEvent[] = [];
  const add = (e: CompEvent) => ev.push(e);

  for (let bar = 0; bar < DEMO_BARS; bar++) {
    const s = sectionOfBar(bar);
    const b0 = bar * 4;
    const ci = bar % 4;
    const chord = CHORDS[ci]!;
    const root = BASS_ROOTS[ci]!;
    const isDrop = s === 'drop1' || s === 'drop2';

    // ---- charted drums
    const [normal, easy] = BARS[bar] ?? P.rest;
    const easyHits = parsePattern(easy);
    for (const h of parsePattern(normal)) {
      const drum = DRUM[h.char]!;
      const inEasy = easyHits.some((e) => e.beat === h.beat && e.char === h.char);
      add({
        inst: drum.inst,
        beat: b0 + h.beat,
        len: drum.inst === 'impact' ? 4 : 0.5,
        midi: [],
        vel: drum.inst === 'kick' && s === 'intro' ? 0.85 : 1,
        chart: { action: drum.action, ...(h.length > 0 ? { length: h.length } : {}), easy: inEasy },
      });
    }
    for (const e of easyHits) {
      if (!parsePattern(normal).some((h) => h.beat === e.beat && h.char === e.char)) {
        throw new Error(
          `bar ${bar}: easy hit "${e.char}" at ${e.beat} is not in the normal pattern`,
        );
      }
    }

    // ---- hats (audio only)
    if (s === 'verse' || s === 'build' || isDrop) {
      const step = s === 'drop2' ? 0.25 : 0.5;
      for (let h = 0; h < 4; h += step) {
        const accent = h % 1 === 0.5;
        add({
          inst: 'hat',
          beat: b0 + h,
          len: 0.1,
          midi: [],
          vel: (accent ? 0.7 : 0.4) * (s === 'verse' ? 0.7 : 1),
        });
      }
    }

    // ---- arp (intro, verse, break)
    if (s === 'intro' || s === 'verse' || s === 'break') {
      for (let i = 0; i < 16; i++) {
        const midi = chord[i % 4]! + 12 + (i % 8 >= 4 ? 12 : 0);
        add({
          inst: 'arp',
          beat: b0 + i * 0.25,
          len: 0.2,
          midi: [midi],
          vel: (i % 4 === 0 ? 0.8 : 0.5) * (s === 'intro' && bar < 2 ? 0.7 : 1),
        });
      }
    }

    // ---- pad
    if (s === 'intro' || s === 'break' || s === 'outro') {
      add({ inst: 'pad', beat: b0, len: 4, midi: chord, vel: s === 'intro' ? 0.5 : 0.7 });
    }

    // ---- risers into the drops
    if (bar === 22 || bar === 46) add({ inst: 'riser', beat: b0, len: 8, midi: [], vel: 0.8 });

    // ---- bass
    if (s === 'verse' || s === 'build' || s === 'break') {
      add({
        inst: 'bass',
        beat: b0,
        len: 3.75,
        midi: [root],
        vel: s === 'break' ? 0.6 : 0.75,
      });
    } else if (isDrop) {
      const pattern: Array<[number, number]> =
        bar % 2 === 0
          ? [
              [0, 1.5],
              [1.75, 0.75],
              [2.5, 0.5],
              [3, 1],
            ]
          : [
              [0, 2],
              [2.75, 0.75],
              [3.5, 0.5],
            ];
      pattern.forEach(([b, len], i) => {
        add({
          inst: 'bass',
          beat: b0 + b,
          len,
          midi: [i === 2 ? root + 12 : root],
          vel: 0.9,
          ...(i === 1 ? { glideFrom: root + 7 } : {}),
        });
      });
    } else if (s === 'outro' && bar === 64) {
      add({ inst: 'bass', beat: b0, len: 6, midi: [root], vel: 0.9 });
    }

    // ---- drop: supersaw stabs + lead melody
    if (isDrop) {
      for (const st of [0, 1.5, 2.5]) {
        add({ inst: 'stab', beat: b0 + st, len: 0.6, midi: chord, vel: 0.5 });
      }
      const mBar = bar % 4;
      const octave = s === 'drop2' && bar >= 56 ? 12 : 0;
      for (const [mb, len, midi] of MELODY) {
        if (Math.floor(mb / 4) !== mBar) continue;
        const beat = b0 + (mb - mBar * 4);
        add({ inst: 'lead', beat, len, midi: [midi + octave], vel: 0.75 });
        if (s === 'drop2' && len >= 1 && bar % 2 === 1) {
          // hyperpop stutter echoes
          for (let r = 1; r < 4; r++) {
            add({
              inst: 'lead',
              beat: beat + r * 0.25,
              len: 0.15,
              midi: [midi + octave + 12],
              vel: 0.35,
            });
          }
        }
      }
    }
  }

  // final chord under the last crash
  add({ inst: 'stab', beat: 64 * 4, len: 4, midi: CHORDS[0]!, vel: 0.8 });
  add({ inst: 'lead', beat: 64 * 4, len: 3, midi: [85], vel: 0.7 });

  ev.sort((a, b) => a.beat - b.beat);
  return ev;
}
