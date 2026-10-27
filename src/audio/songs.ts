/**
 * Built-in procedural songs by `audio.procedural` name. Each is a composition of the digicore
 * instruments, so action-music layers that perform parts (live lead, accents in key) work on
 * all of them.
 */
import {
  composeDemo,
  composeSong,
  DEMO_BPM,
  DEMO_LENGTH_BEATS,
  type CompEvent,
} from './demo/composition';
import { LAB_BPM, LAB_LENGTH_BEATS, LAB_SONG } from './demo/labSong';

export interface ProceduralSong {
  title: string;
  bpm: number;
  lengthBeats: number;
  compose(): CompEvent[];
}

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
