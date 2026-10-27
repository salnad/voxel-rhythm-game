/**
 * "LAB.EXE": a short (about 57 s) digicore test song for the Playtest Lab, built from the same
 * instruments and harmony as the demo. Every experiment plays it by default, so ratings compare
 * mechanics on identical music and the same cue rhythm.
 *
 * Cues are mostly quarter notes (at most about 2.5 per second), all four actions appear in the
 * first 20 s, there is one boss-combo section in the break, and each enemy ends on a crash.
 */
import { type BarPattern, type Section, type SongSpec } from './composition';

export const LAB_BPM = 140;

const same = (p: string): BarPattern => [p, p];

// prettier-ignore
const LAB_BARS: readonly BarPattern[] = [
  // intro (0-5): two empty bars of count-in, BLOCK alone, then SLASH joins
  same('........'), same('........'),
  same('B...B...'), same('B...B...'),
  same('B...S...'), same('B.S.B...'),
  // verse (6-8, half-time): STAB on the snare, FLOURISH finishes enemy 1
  same('B...T...'), same('B.S.T...'),
  same('F.......'),
  // drop 1 (9-16): all four, quarter notes
  same('B.S.T.S.'), same('B.T.S.T.'), same('B.S.B.T.'), same('B.S.T...'),
  same('B.T.S.B.'), same('S.S.T.B.'), same('B.S.T.S.'),
  same('F.......'),
  // break (17-22, half-time): boss combos on bars 18-21 (last beat empty)
  same('B...T...'), same('B...T...'), same('B.S.T...'), same('S.S.T...'), same('B.T.S...'),
  same('F.......'),
  // drop 2 (23-30): a few eighths
  same('B.STB.T.'), same('B.S.TBS.'), same('BTS.B.T.'), same('B.S.T.ST'),
  same('B.TSB.T.'), same('BS.TB.S.'), same('B.S.T.S.'), same('B.TS.BT.'),
  // outro (31-32)
  same('F.......'), same('........'),
];

function labSection(bar: number): Section {
  if (bar < 6) return 'intro';
  if (bar < 9) return 'verse';
  if (bar < 17) return 'drop1';
  if (bar < 23) return 'break';
  if (bar < 31) return 'drop2';
  return 'outro';
}

export const LAB_SONG: SongSpec = {
  bars: LAB_BARS,
  sectionOfBar: labSection,
  leadFromBar: 4,
  risers: [15, 21],
  finalBar: 31,
};

export const LAB_BARS_COUNT = LAB_BARS.length;
export const LAB_LENGTH_BEATS = LAB_BARS_COUNT * 4 + 4;
export const LAB_COMBOS = [{ fromBar: 18, toBar: 21 }] as const;
