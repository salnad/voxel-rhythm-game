/**
 * The procedural demo song "DAEMON.EXE": digicore at 155 BPM in D major
 * (Dmaj9 - A/C# - Bm7 - Gmaj7). Distorted 808s, glitchy hat rolls, a bright pluck lead,
 * pitched-up formant vocal chops, bitcrush, half-time verse and break.
 *
 * Pure data: the same event list drives the Web Audio renderer (render.ts), the live lead
 * (leadVoice.ts) and the demo charts (src/chart/demoChart.ts), so they can never drift.
 * The song is split into parts that the player's actions can perform (see
 * src/config/musicMapping.ts): every cue is an onset in its part.
 */
import type { Action } from '../../chart/types';

/** Song parts. Each renders to its own stem (the lead is played live). */
export const PARTS = ['k808', 'lead', 'perc', 'vox', 'backing'] as const;
export type Part = (typeof PARTS)[number];

export type Instrument =
  | 'k808'
  | 'hat'
  | 'openHat'
  | 'snare'
  | 'blip'
  | 'lead'
  | 'chop'
  | 'pad'
  | 'bell'
  | 'riser'
  | 'impact'
  | 'glitch';

export type Vowel = 'a' | 'e' | 'i' | 'o' | 'u';

export interface CompEvent {
  inst: Instrument;
  part: Part;
  beat: number;
  /** Length in beats. */
  len: number;
  /** MIDI note(s). */
  midi: number[];
  vel: number;
  /** 808 glide source note. */
  glideFrom?: number;
  vowel?: Vowel;
  /** Set on cue onsets: the action, hold length, and whether easy keeps it. */
  chart?: { action: Action; length?: number; easy: boolean };
}

export const DEMO_BPM = 155;
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

const HALF_TIME: readonly Section[] = ['verse', 'break'];

/**
 * Cue patterns, one string per bar, one character per eighth note:
 * B 808 note (block) · S lead note (slash) · T snare or hat roll (stab) · F vocal chop
 * phrase + crash (flourish) · `-` holds the previous cue another eighth · `.` rest.
 * Each entry is [normal, easy]; easy must only use hits that normal has. Combo bars (C)
 * leave their last beat empty.
 */
type BarPattern = readonly [normal: string, easy: string];
const R = '........';
const P = {
  rest: [R, R],
  block: ['B.......', 'B.......'],
  blockSlash: ['B...S...', 'B...S...'],
  // verse: stab arrives on the half-time snare
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
  roll: ['B.T.TTTT', 'B.T.T.T.'],
  // drop 1 (snares on 2 and 4)
  walk1: ['F.....B.', 'F.......'],
  g1: ['B.TS.BT.', 'B.T...T.'],
  g2: ['BST.B.TS', 'B.T.B...'],
  g3: ['B.T.SBT.', 'B...S.T.'],
  g4: ['B.TSB.T.', 'B.T.B...'],
  g5: ['B.TS.BTT', 'B.T...T.'],
  // break: first boss combos (half-time), blade lock on the held 808
  k1: ['B...T...', 'B...T...'],
  k2: ['B.S.T...', 'B...T...'],
  k3: ['B--.T.S.', 'B...T...'],
  k4: ['S.S.T.B.', 'S...T...'],
  k5: ['B.S.T.S.', 'B...T.S.'],
  k6: ['B.T.F...', 'B...F...'],
  // drop 2
  walk2: ['F...B.T.', 'F.....T.'],
  h1: ['BTSTB.TS', 'B.S...T.'],
  h2: ['B.STBTS.', 'B...B.S.'],
  h3: ['BTS.BTST', 'B.S..T..'],
  // the DAEMON: a combo every measure
  c1: ['BTSTB.T.', 'B.S.B...'],
  c2: ['B.STBTS.', 'B...B.S.'],
  c3: ['BTS.BTS.', 'B.S..T..'],
  c4: ['B.SSB.T.', 'B.S.B...'],
  c5: ['BTSTB.F.', 'B.S.B.F.'],
  c7: ['BTSTB.T.', 'B.S.B.T.'],
} satisfies Record<string, BarPattern>;

/** The whole song, bar by bar. */
// prettier-ignore
const BARS: readonly BarPattern[] = [
  // intro (0-9): BLOCK alone on the 808, then BLOCK + SLASH (the lead enters)
  P.rest, P.rest, P.block, P.block, P.block, P.block,
  P.blockSlash, P.blockSlash, P.blockSlash, P.blockSlash,
  // verse (10-15, half-time): STAB joins on the snare
  P.block, P.v1, P.v1, P.v2, P.v3, P.v4,
  // build (16-23): FLOURISH on the vocal chops finishes each enemy
  P.finish, P.b1, P.b2, P.b3, P.finish, P.b4, P.b5, P.roll,
  // drop 1 (24-39)
  P.walk1, P.g1, P.g1, P.g2,
  P.walk1, P.g1, P.g2, P.g3,
  P.walk1, P.g2, P.g3, P.g4,
  P.walk1, P.g3, P.g4, P.g5,
  // break (40-47, half-time): combos 41-46
  P.finish, P.k1, P.k2, P.k3, P.k4, P.k5, P.k6, P.roll,
  // drop 2 (48-63): combos 57-63 against the DAEMON
  P.walk2, P.h1, P.h2, P.h1,
  P.walk2, P.h2, P.h3, P.h2,
  P.walk2, P.c1, P.c2, P.c3,
  P.c4, P.c5, P.c2, P.c7,
  // outro (64-65)
  P.finish, P.rest,
];

/** Boss combo ranges (bars). Every measure in a range is a combo. */
export const DEMO_COMBOS = [
  { fromBar: 41, toBar: 46 },
  { fromBar: 57, toBar: 63 },
] as const;

export interface PatternHit {
  beat: number;
  char: string;
  length: number;
}

const CUE_CHARS: Record<string, Action> = { B: 'block', S: 'slash', T: 'stab', F: 'flourish' };

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
    if (!CUE_CHARS[c]) throw new Error(`pattern "${p}": unknown character "${c}"`);
    hits.push({ beat: i * 0.5, char: c, length: 0 });
  }
  return hits;
}

const CHORDS: number[][] = [
  [62, 66, 69, 73, 76], // Dmaj9
  [61, 64, 69, 73], // A/C#
  [59, 62, 66, 69], // Bm7
  [55, 59, 62, 66], // Gmaj7
];
const ROOTS_808 = [38, 37, 35, 31];
/** Lead ladder per chord (chord tones, D5 up), and the contour it climbs. */
const LEAD_TONES: number[][] = [
  [74, 76, 78, 81, 85, 86],
  [73, 76, 78, 81, 85, 88],
  [71, 74, 78, 81, 83, 86],
  [71, 74, 78, 79, 83, 86],
];
const CONTOUR = [3, 2, 4, 3, 5, 4, 2, 3, 1, 2, 3, 4];
/** Lead rhythm per section (eighth-note onsets, 'x'); cue positions are added on top. */
const LEAD_RHYTHM: Partial<Record<Section, string>> = {
  verse: 'x...x...',
  build: 'x.x.x.x.',
  drop1: 'x.xx.xx.',
  break: 'x...x.x.',
  drop2: 'xxx.x.xx',
};

/** A vocal chop phrase: [beat offset, length, chord tone index from the top, vowel]. */
const CHOP_PHRASE: Array<[number, number, number, Vowel]> = [
  [0, 0.2, 0, 'a'],
  [0.25, 0.2, 0, 'a'],
  [0.5, 0.2, 1, 'e'],
  [0.75, 0.7, 0, 'o'],
];

export function composeDemo(): CompEvent[] {
  const ev: CompEvent[] = [];
  const add = (e: CompEvent) => ev.push(e);
  let prev808: number | null = null;

  for (let bar = 0; bar < DEMO_BARS; bar++) {
    const s = sectionOfBar(bar);
    const b0 = bar * 4;
    const ci = bar % 4;
    const chord = CHORDS[ci]!;
    const half = HALF_TIME.includes(s);
    const isDrop = s === 'drop1' || s === 'drop2';

    const [normal, easy] = BARS[bar] ?? P.rest;
    const hits = parsePattern(normal);
    const easyHits = parsePattern(easy);
    for (const e of easyHits) {
      if (!hits.some((h) => h.beat === e.beat && h.char === e.char)) {
        throw new Error(
          `bar ${bar}: easy hit "${e.char}" at ${e.beat} is not in the normal pattern`,
        );
      }
    }
    const cueFor = (h: PatternHit) => ({
      action: CUE_CHARS[h.char]!,
      ...(h.length > 0 ? { length: h.length } : {}),
      easy: easyHits.some((e) => e.beat === h.beat && e.char === h.char),
    });

    // ---- 808 (part k808): one note per B cue, sustaining until the next, gliding between roots
    const k808 = hits.filter((h) => h.char === 'B');
    k808.forEach((h, i) => {
      const nextBeat = k808[i + 1]?.beat ?? 4;
      const root = ROOTS_808[ci]! + (isDrop && i % 3 === 2 ? 12 : 0);
      add({
        inst: 'k808',
        part: 'k808',
        beat: b0 + h.beat,
        len: Math.min(4, nextBeat - h.beat + (i === k808.length - 1 ? 0.5 : 0)),
        midi: [root],
        vel: s === 'intro' ? 0.85 : 1,
        ...(prev808 !== null && prev808 !== root && (isDrop || i === 0)
          ? { glideFrom: prev808 }
          : {}),
        chart: cueFor(h),
      });
      prev808 = root;
    });

    // ---- lead (part lead): section rhythm plus every S cue; pitches climb the chord ladder
    const leadOn = new Set<number>();
    const rhythm = bar >= 6 ? LEAD_RHYTHM[s] : undefined;
    if (rhythm) for (let i = 0; i < 8; i++) if (rhythm[i] === 'x') leadOn.add(i * 0.5);
    for (const h of hits) if (h.char === 'S') leadOn.add(h.beat);
    const onsets = [...leadOn].sort((a, b) => a - b);
    onsets.forEach((beat, i) => {
      const tone = LEAD_TONES[ci]![CONTOUR[(bar * 3 + i) % CONTOUR.length]!]!;
      const next = onsets[i + 1] ?? 4;
      const cue = hits.find((h) => h.char === 'S' && h.beat === beat);
      add({
        inst: 'lead',
        part: 'lead',
        beat: b0 + beat,
        len: Math.min(1, next - beat) * 0.9,
        midi: [tone + (s === 'drop2' && bar >= 56 ? 12 : 0)],
        vel: cue ? 0.95 : 0.7,
        ...(cue ? { chart: cueFor(cue) } : {}),
      });
    });

    // ---- perc (part perc): steady hats (audio only), and a snare or hat roll per T cue
    if (s !== 'intro' && s !== 'outro') {
      const step = isDrop ? 0.25 : 0.5;
      for (let h = 0; h < 4; h += step) {
        if (isDrop && h % 1 === 0.75 && bar % 2 === 0) continue;
        add({
          inst: 'hat',
          part: 'perc',
          beat: b0 + h,
          len: 0.1,
          midi: [],
          vel: (h % 1 === 0.5 ? 0.6 : 0.38) * (s === 'verse' ? 0.75 : 1),
        });
      }
      if (half && bar % 2 === 1)
        add({ inst: 'openHat', part: 'perc', beat: b0 + 3.5, len: 0.5, midi: [], vel: 0.4 });
    }
    for (const h of hits.filter((x) => x.char === 'T')) {
      const pos = h.beat * 2;
      const backbeat = half ? pos === 4 : pos === 2 || pos === 6;
      if (backbeat) {
        add({
          inst: 'snare',
          part: 'perc',
          beat: b0 + h.beat,
          len: 0.5,
          midi: [],
          vel: 1,
          chart: cueFor(h),
        });
      } else {
        // glitchy roll: 32nds (or triplet 16ths in the drops) rising in velocity and pitch
        const n = isDrop && bar % 2 === 1 ? 3 : 4;
        const d = 0.5 / n;
        for (let k = 0; k < n; k++) {
          add({
            inst: 'hat',
            part: 'perc',
            beat: b0 + h.beat + k * d,
            len: 0.06,
            midi: [k],
            vel: 0.55 + (k / n) * 0.45,
            ...(k === 0 ? { chart: cueFor(h) } : {}),
          });
        }
        add({ inst: 'blip', part: 'perc', beat: b0 + h.beat, len: 0.1, midi: [96 + ci], vel: 0.6 });
      }
    }

    // ---- vocal chops (part vox) + crash (backing) per F cue
    for (const h of hits.filter((x) => x.char === 'F')) {
      const top = [...chord].sort((a, b) => b - a);
      CHOP_PHRASE.forEach(([off, len, idx, vowel], k) => {
        add({
          inst: 'chop',
          part: 'vox',
          beat: b0 + h.beat + off,
          len,
          midi: [top[idx]! + 12],
          vel: k === 3 ? 1 : 0.85,
          vowel,
          ...(k === 0 ? { chart: cueFor(h) } : {}),
        });
      });
      add({ inst: 'impact', part: 'backing', beat: b0 + h.beat, len: 4, midi: [], vel: 0.9 });
    }

    // ---- backing: pads, glassy bell arp, risers, glitch fills
    if (s !== 'drop1' && s !== 'drop2') {
      add({
        inst: 'pad',
        part: 'backing',
        beat: b0,
        len: 4,
        midi: chord,
        vel: s === 'intro' ? 0.55 : 0.65,
      });
    } else {
      add({ inst: 'pad', part: 'backing', beat: b0, len: 4, midi: chord.slice(0, 4), vel: 0.35 });
    }
    if (s === 'intro' || s === 'verse' || s === 'break' || isDrop) {
      const arp = [...chord].sort((a, b) => a - b);
      for (let i = 0; i < 8; i++) {
        add({
          inst: 'bell',
          part: 'backing',
          beat: b0 + i * 0.5,
          len: 0.4,
          midi: [arp[(i * 2 + (i >> 2)) % arp.length]! + 12],
          vel: (isDrop ? 0.3 : 0.5) * (i % 2 === 0 ? 1 : 0.7),
        });
      }
    }
    if (bar === 22 || bar === 46)
      add({ inst: 'riser', part: 'backing', beat: b0, len: 8, midi: [], vel: 0.8 });
    if (isDrop && bar % 4 === 3) {
      for (const g of [3.5, 3.625, 3.75, 3.875]) {
        add({
          inst: 'glitch',
          part: 'backing',
          beat: b0 + g,
          len: 0.1,
          midi: [84 + ((g * 8) % 12)],
          vel: 0.45,
        });
      }
    }
  }

  // final chord under the last crash
  add({ inst: 'pad', part: 'backing', beat: 64 * 4, len: 6, midi: CHORDS[0]!, vel: 0.8 });
  add({ inst: 'lead', part: 'lead', beat: 64 * 4, len: 2, midi: [86], vel: 0.8 });

  ev.sort((a, b) => a.beat - b.beat);
  return ev;
}

/** Lead notes of one bar (beats relative to the bar), for live scheduling. */
export function leadNotesByBar(events: readonly CompEvent[], bpb = 4): CompEvent[][] {
  const out: CompEvent[][] = [];
  for (const e of events) {
    if (e.part !== 'lead') continue;
    const bar = Math.floor(e.beat / bpb + 1e-9);
    (out[bar] ??= []).push(e);
  }
  return out;
}
