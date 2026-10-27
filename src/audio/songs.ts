/**
 * Built-in procedural songs by `audio.procedural` name. Each is a composition of the digicore
 * instruments, so action-music layers that perform parts (live lead, accents in key) work on
 * all of them.
 */
import {
  CR_BPM,
  CR_LENGTH_BEATS,
  CR_SONG_NAME,
  composeCallResponse,
} from './demo/callResponseSong';
import {
  composeDemo,
  composeSong,
  DEMO_BPM,
  DEMO_LENGTH_BEATS,
  type CompEvent,
} from './demo/composition';
import { withoutCues } from './demo/keysounds';
import { LAB_BPM, LAB_LENGTH_BEATS, LAB_SONG } from './demo/labSong';

export interface ProceduralSong {
  title: string;
  bpm: number;
  lengthBeats: number;
  compose(): CompEvent[];
}

/** LAB.EXE without its cue notes: the keysound experiment's backing (hits play the notes). */
export const LAB_KEYSOUND_SONG = 'lab-140-keysound';

export const SONGS: Record<string, ProceduralSong> = {
  'digicore-demo': {
    title: 'NEON//DAEMON',
    bpm: DEMO_BPM,
    lengthBeats: DEMO_LENGTH_BEATS,
    compose: composeDemo,
  },
  'lab-140': {
    title: 'LAB.EXE',
    bpm: LAB_BPM,
    lengthBeats: LAB_LENGTH_BEATS,
    compose: () => composeSong(LAB_SONG),
  },
  [LAB_KEYSOUND_SONG]: {
    title: 'LAB.EXE (keysounds)',
    bpm: LAB_BPM,
    lengthBeats: LAB_LENGTH_BEATS,
    compose: () => withoutCues(composeSong(LAB_SONG)),
  },
  [CR_SONG_NAME]: {
    title: 'ECHO.EXE',
    bpm: CR_BPM,
    lengthBeats: CR_LENGTH_BEATS,
    compose: () => withoutCues(composeCallResponse()),
  },
};

const eventCache = new Map<string, CompEvent[]>();

/** The composition behind a procedural song, or null for audio-file maps and unknown names. */
export function songEvents(name: string | undefined): CompEvent[] | null {
  if (!name) return null;
  const song = SONGS[name];
  if (!song) return null;
  let ev = eventCache.get(name);
  if (!ev) {
    ev = song.compose();
    eventCache.set(name, ev);
  }
  return ev;
}
