/**
 * "ECHO.EXE": the call-and-response song (124 BPM, about 66 s). Bars alternate: in a call bar
 * the enemy performs a one-bar phrase in its own voice (baked into the stems), and in the next
 * bar the player answers with the same phrase. The answer notes are the hero's voice (the
 * song's 808, lead, snare/hat roll and vocal chop + crash); they are tagged `cueBeat` so the
 * stems leave them out and the experiment plays each one on a hit.
 *
 * Phrases start as one or two quarter notes and grow to three or four with a few eighths; each
 * enemy's last phrase ends on a FLOURISH.
 */
import type { Action, EnemyKind } from '../../chart/types';
import {
  composeSong,
  demoHarmony,
  parsePattern,
  type BarPattern,
  type CompEvent,
  type Section,
  type SongSpec,
} from './composition';

export const CR_BPM = 124;
export const CR_SONG_NAME = 'call-response-124';
/** Count-in bars before the first call. */
export const CR_INTRO_BARS = 2;

export interface CallEnemy {
  enemy: EnemyKind;
  name: string;
  section: Section;
  /** One-bar phrases (8 eighth notes, B S T F like the song patterns), call = response. */
  phrases: readonly string[];
}

// prettier-ignore
export const CR_ENEMIES: readonly CallEnemy[] = [
  { enemy: 'grunt', name: 'GRUNT', section: 'verse',
    phrases: ['B.......', 'B...B...', 'B...S...', 'S...F...'] },
  { enemy: 'duelist', name: 'DUELIST', section: 'build',
    phrases: ['T...T...', 'B.T.B...', 'B.S.T...', 'S.T.F...'] },
  { enemy: 'knight', name: 'KNIGHT', section: 'drop1',
    phrases: ['B.B.S...', 'T.S.B...', 'B..SB.T.', 'S.T.B.F.'] },
  { enemy: 'brute', name: 'DAEMON', section: 'drop2',
    phrases: ['B.STB...', 'S.S.TB..', 'BT.S.B..', 'B.S.T.F.'] },
];

const ACTION_OF: Record<string, Action> = { B: 'block', S: 'slash', T: 'stab', F: 'flourish' };

export interface PhraseNote {
  /** Beat within the bar. */
  beat: number;
  action: Action;
}

export interface CallExchange {
  index: number;
  encounter: number;
  callBar: number;
  responseBar: number;
  pattern: string;
  notes: PhraseNote[];
}

export function phraseNotes(pattern: string): PhraseNote[] {
  return parsePattern(pattern).map((h) => ({ beat: h.beat, action: ACTION_OF[h.char]! }));
}

export const CR_EXCHANGES: readonly CallExchange[] = CR_ENEMIES.flatMap((e, encounter) =>
  e.phrases.map((pattern) => ({ encounter, pattern })),
).map(({ encounter, pattern }, index) => ({
  index,
  encounter,
  callBar: CR_INTRO_BARS + index * 2,
  responseBar: CR_INTRO_BARS + index * 2 + 1,
  pattern,
  notes: phraseNotes(pattern),
}));

const OUTRO_BAR = CR_INTRO_BARS + CR_EXCHANGES.length * 2;
const REST = '........';

const CR_BARS: readonly BarPattern[] = [
  ...Array.from({ length: CR_INTRO_BARS }, (): BarPattern => [REST, REST]),
  ...CR_EXCHANGES.flatMap((x): BarPattern[] => [
    [REST, REST],
    [x.pattern, x.pattern],
  ]),
  [REST, REST],
  [REST, REST],
];

function crSection(bar: number): Section {
  if (bar < CR_INTRO_BARS) return 'intro';
  if (bar >= OUTRO_BAR) return 'outro';
  const x = CR_EXCHANGES[Math.floor((bar - CR_INTRO_BARS) / 2)]!;
  return CR_ENEMIES[x.encounter]!.section;
}

export const CR_SONG: SongSpec = {
  bars: CR_BARS,
  sectionOfBar: crSection,
  // no background lead: the phrases are the melody
  leadFromBar: CR_BARS.length,
  risers: [],
  finalBar: OUTRO_BAR,
};

export const CR_LENGTH_BEATS = CR_BARS.length * 4 + 4;

/**
 * The enemy's voice for one call note: the same instrument family as the hero's answer but a
 * different register and colour, so the two bars read as a duet. BLOCK = a high 808 tom,
 * SLASH = the lead an octave down, STAB = a square chirp plus a tick, FLOURISH = a low
 * "ho-ho-hoo" chop phrase (the crash is saved for the hero).
 */
export function enemyVoice(action: Action, beat: number, bar: number): CompEvent[] {
  const h = demoHarmony(bar);
  const top = [...h.chord].sort((a, b) => b - a);
  switch (action) {
    case 'block':
      return [{ inst: 'k808', part: 'k808', beat, len: 0.45, midi: [h.root808 + 12], vel: 0.95 }];
    case 'slash':
      return [{ inst: 'lead', part: 'lead', beat, len: 0.4, midi: [h.leadTones[2]! - 12], vel: 1 }];
    case 'stab':
      return [
        { inst: 'blip', part: 'perc', beat, len: 0.1, midi: [top[0]! + 12], vel: 1 },
        { inst: 'hat', part: 'perc', beat, len: 0.06, midi: [3], vel: 1 },
      ];
    case 'flourish':
      return [
        { inst: 'chop', part: 'vox', beat, len: 0.2, midi: [top[1]!], vel: 0.9, vowel: 'o' },
        {
          inst: 'chop',
          part: 'vox',
          beat: beat + 0.25,
          len: 0.2,
          midi: [top[1]!],
          vel: 0.85,
          vowel: 'o',
        },
        {
          inst: 'chop',
          part: 'vox',
          beat: beat + 0.5,
          len: 0.45,
          midi: [top[2]!],
          vel: 1,
          vowel: 'u',
        },
      ];
  }
}

/** The whole song: backing, the enemy's calls (in the stems) and the hero's tagged answers. */
export function composeCallResponse(): CompEvent[] {
  const ev = composeSong(CR_SONG);
  for (const x of CR_EXCHANGES)
    for (const n of x.notes) ev.push(...enemyVoice(n.action, x.callBar * 4 + n.beat, x.callBar));
  ev.sort((a, b) => a.beat - b.beat);
  return ev;
}
