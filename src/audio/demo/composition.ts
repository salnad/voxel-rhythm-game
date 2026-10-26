/**
 * The procedural demo song "NEON//DAEMON": a hyperpop loop at 160 BPM in E major
 * (C#m - A - E - B). Pure data: the same event list drives the Web Audio renderer
 * (render.ts) and the demo chart (src/chart/demoChart.ts), so they can never drift.
 */

export type Instrument =
  'kick' | 'clap' | 'hat' | 'bass' | 'lead' | 'arp' | 'stab' | 'pad' | 'riser';

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
  /** Whether this event becomes a chart note, and in which lane / with what hold length. */
  chart?: { lane: DemoLane; length?: number };
}

export type DemoLane = 'kick' | 'perc' | 'bass' | 'synth';
export const DEMO_LANES: DemoLane[] = ['kick', 'perc', 'bass', 'synth'];
export const DEMO_BPM = 160;
export const DEMO_BARS = 54;
export const DEMO_LENGTH_BEATS = DEMO_BARS * 4 + 4;

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

type Section = 'intro' | 'build' | 'drop1' | 'break' | 'drop2' | 'outro';

export function sectionOfBar(bar: number): Section {
  if (bar < 4) return 'intro';
  if (bar < 12) return 'build';
  if (bar < 28) return 'drop1';
  if (bar < 36) return 'break';
  if (bar < 52) return 'drop2';
  return 'outro';
}

export function composeDemo(): CompEvent[] {
  const ev: CompEvent[] = [];
  const add = (e: CompEvent) => ev.push(e);

  for (let bar = 0; bar < DEMO_BARS; bar++) {
    const s = sectionOfBar(bar);
    const b0 = bar * 4;
    const ci = bar % 4;
    const chord = CHORDS[ci]!;
    const root = BASS_ROOTS[ci]!;
    const phraseEnd = bar % 4 === 3;
    const isDrop = s === 'drop1' || s === 'drop2';

    // ---- arp (intro, build, break): 16ths of chord tones, charted on quarter notes
    if (s === 'intro' || s === 'build' || s === 'break') {
      for (let i = 0; i < 16; i++) {
        const midi = chord[i % 4]! + 12 + (i % 8 >= 4 ? 12 : 0);
        add({
          inst: 'arp',
          beat: b0 + i * 0.25,
          len: 0.2,
          midi: [midi],
          vel: i % 4 === 0 ? 0.9 : 0.55,
          ...(i % 4 === 0 && !(s === 'build' && bar >= 8)
            ? { chart: { lane: 'synth' as const } }
            : {}),
        });
      }
    }

    // ---- pad (break, outro)
    if (s === 'break' || s === 'outro') {
      add({ inst: 'pad', beat: b0, len: 4, midi: chord, vel: 0.7 });
    }

    // ---- kick
    let kicks: number[] = [];
    if (s === 'build') kicks = bar < 8 ? [0, 2] : bar === 11 ? [0, 1] : [0, 1, 2, 3];
    if (isDrop) kicks = bar % 2 === 0 ? [0, 1, 1.75, 2.5, 3] : [0, 1, 2, 2.75, 3.5];
    if (s === 'outro' && bar === 52) kicks = [0];
    for (const k of kicks)
      add({ inst: 'kick', beat: b0 + k, len: 0.5, midi: [], vel: 1, chart: { lane: 'kick' } });

    // ---- claps
    let claps: number[] = [];
    if (s === 'build') claps = bar < 8 ? [3] : [1, 3];
    if (isDrop) claps = [1, 3];
    if (s === 'break' && bar % 2 === 1) claps = [3];
    for (const c of claps)
      add({ inst: 'clap', beat: b0 + c, len: 0.5, midi: [], vel: 1, chart: { lane: 'perc' } });

    // ---- build-up snare roll on the last build bar + riser
    if (bar === 11 || bar === 35) {
      for (let i = 0; i < 16; i++) {
        const beat = b0 + i * 0.25;
        if (beat === b0 + 1 || beat === b0 + 3) continue; // claps already here in bar 11
        const onEighth = i % 2 === 0;
        add({
          inst: 'clap',
          beat,
          len: 0.25,
          midi: [],
          vel: 0.35 + (i / 16) * 0.6,
          ...(onEighth && i >= 8 ? { chart: { lane: 'perc' as const } } : {}),
        });
      }
    }
    if (bar === 10 || bar === 34) add({ inst: 'riser', beat: b0, len: 8, midi: [], vel: 0.8 });

    // ---- hats
    if (s === 'build' || isDrop) {
      const step = s === 'drop2' ? 0.25 : 0.5;
      for (let h = 0; h < 4; h += step) {
        const accent = h % 1 === 0.5;
        // phrase-end hat fills get charted on 8ths
        const charted = phraseEnd && isDrop && h >= 2 && h % 0.5 === 0 && h !== 3;
        add({
          inst: 'hat',
          beat: b0 + h,
          len: 0.1,
          midi: [],
          vel: accent ? 0.8 : 0.45,
          ...(charted ? { chart: { lane: 'perc' as const } } : {}),
        });
      }
    }

    // ---- bass
    if (s === 'build') {
      add({
        inst: 'bass',
        beat: b0,
        len: 3.5,
        midi: [root],
        vel: 0.8,
        chart: { lane: 'bass', length: 3 },
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
        const midi = i === 2 ? root + 12 : root;
        add({
          inst: 'bass',
          beat: b0 + b,
          len,
          midi: [midi],
          vel: 0.9,
          ...(i === 1 ? { glideFrom: root + 7 } : {}),
          chart: len >= 2 ? { lane: 'bass', length: len - 0.5 } : { lane: 'bass' },
        });
      });
    } else if (s === 'break') {
      add({
        inst: 'bass',
        beat: b0,
        len: 3.75,
        midi: [root],
        vel: 0.6,
        chart: { lane: 'bass', length: 3 },
      });
    } else if (s === 'outro') {
      if (bar === 52)
        add({
          inst: 'bass',
          beat: b0,
          len: 6,
          midi: [root],
          vel: 0.9,
          chart: { lane: 'bass', length: 4 },
        });
    }

    // ---- drop: supersaw stabs + lead melody
    if (isDrop) {
      for (const st of [0, 1.5, 2.5]) {
        add({ inst: 'stab', beat: b0 + st, len: 0.6, midi: chord, vel: 0.55 });
      }
      const mBar = bar % 4;
      const octave = s === 'drop2' && bar >= 44 ? 12 : 0;
      for (const [mb, len, midi] of MELODY) {
        if (Math.floor(mb / 4) !== mBar) continue;
        const beat = b0 + (mb - mBar * 4);
        const chartIt = len >= 0.5;
        add({
          inst: 'lead',
          beat,
          len,
          midi: [midi + octave],
          vel: 0.8,
          ...(chartIt
            ? {
                chart:
                  len >= 1.5
                    ? { lane: 'synth' as const, length: len - 0.5 }
                    : { lane: 'synth' as const },
              }
            : {}),
        });
        if (s === 'drop2' && len >= 1 && bar % 2 === 1) {
          // hyperpop stutter echoes (audio only)
          for (let r = 1; r < 4; r++) {
            add({
              inst: 'lead',
              beat: beat + r * 0.25,
              len: 0.15,
              midi: [midi + octave + 12],
              vel: 0.4,
            });
          }
        }
      }
    }
  }

  // final chord
  add({ inst: 'stab', beat: 52 * 4, len: 4, midi: CHORDS[0]!, vel: 0.8 });
  add({
    inst: 'lead',
    beat: 52 * 4,
    len: 3,
    midi: [85],
    vel: 0.7,
    chart: { lane: 'synth', length: 2 },
  });

  ev.sort((a, b) => a.beat - b.beat);
  return ev;
}
