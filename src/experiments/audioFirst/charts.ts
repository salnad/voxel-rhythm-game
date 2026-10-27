/**
 * Charts for the audio-first experiments: LAB.EXE on its keysound backing, LAB.EXE thinned to
 * quarter notes for play-by-ear, and the call-and-response song's answers.
 */
import {
  CR_BPM,
  CR_ENEMIES,
  CR_EXCHANGES,
  CR_INTRO_BARS,
  CR_LENGTH_BEATS,
  CR_SONG_NAME,
  composeCallResponse,
} from '../../audio/demo/callResponseSong';
import { LAB_KEYSOUND_SONG } from '../../audio/songs';
import { buildLabChart } from '../../chart/labChart';
import {
  ACTIONS,
  CHART_FORMAT_ID,
  CHART_FORMAT_VERSION,
  type ChartFile,
  type ChartNote,
} from '../../chart/types';

/** The Lab chart, played over LAB.EXE with its cue notes removed. */
export function keysoundChart(): ChartFile {
  const file = buildLabChart();
  return {
    ...file,
    meta: { ...file.meta, description: 'LAB.EXE without its cue notes: your hits play them.' },
    audio: { ...file.audio, procedural: LAB_KEYSOUND_SONG },
  };
}

/**
 * The Lab chart with every off-beat cue removed, so cues are at least a beat apart and every
 * count-in owns the beat before its cue.
 */
export function byEarChart(): ChartFile {
  const file = buildLabChart();
  return {
    ...file,
    meta: { ...file.meta, description: 'LAB.EXE on quarter notes, cued by sound only.' },
    notes: file.notes.filter((n) => Math.abs(n.beat - Math.round(n.beat)) < 1e-6),
  };
}

/** Call-and-response: the answer bars of ECHO.EXE are the cues; call bars are empty. */
export function callResponseChart(): ChartFile {
  const notes: ChartNote[] = [];
  for (const e of composeCallResponse()) {
    if (!e.chart) continue;
    notes.push({ beat: e.beat, action: e.chart.action });
  }
  notes.sort((a, b) => a.beat - b.beat || ACTIONS.indexOf(a.action) - ACTIONS.indexOf(b.action));
  const firstCall = (k: number) => CR_EXCHANGES.find((x) => x.encounter === k)!.callBar;
  return {
    format: CHART_FORMAT_ID,
    version: CHART_FORMAT_VERSION,
    meta: {
      title: 'ECHO.EXE',
      artist: 'procedural (Web Audio)',
      charter: 'playtest lab generator',
      difficulty: 'lab',
      description: 'Call and response: the enemy plays a bar, you answer it.',
    },
    audio: { procedural: CR_SONG_NAME, lengthBeats: CR_LENGTH_BEATS },
    timing: { bpm: CR_BPM, offsetMs: 0, beatsPerBar: 4 },
    // each enemy walks in on the beat before its first call
    encounters: CR_ENEMIES.map((e, k) => ({
      beat: k === 0 ? 0 : firstCall(k) * 4 - 1,
      enemy: e.enemy,
      name: e.name,
    })),
    prompts: [{ beat: 0, text: 'LISTEN to the enemy, then ANSWER', beats: CR_INTRO_BARS * 4 }],
    notes,
  };
}
