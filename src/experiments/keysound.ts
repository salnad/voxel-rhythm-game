import { cueGroups } from '../audio/demo/keysounds';
import { songEvents } from '../audio/songs';
import { LAB_SONG_NAME } from '../chart/labChart';
import { ACTIONS } from '../chart/types';
import { ACTION_SPECS } from '../config/actions';
import { hexA } from '../render/icons';
import { keysoundChart } from './audioFirst/charts';
import { Juice } from './audioFirst/juice';
import { KeysoundPlayer } from './audioFirst/keysoundPlayer';
import { onStrayPress } from './audioFirst/presses';
import { punchEnvelope } from './audioFirst/timing';
import { NO_MUSIC_LAYER, type Experiment, type ExperimentContext } from './types';

/** The part each lane plays, shown over its key box. */
const VOICE_TAGS = ['808', 'LEAD', 'SNARE', 'VOX'] as const;
const PUNCH = { perfect: 1, great: 0.7, good: 0.45, miss: 0 } as const;

/**
 * You play the song: LAB.EXE's cue notes are cut from the stems and each hit plays its cue's
 * own sound on the beat. The highway is unchanged, so only the audio differs from baseline.
 */
export const keysound: Experiment = {
  key: 'keysound',
  label: 'KEYSOUND · YOU PLAY THE SONG',
  tagline: 'The cue notes are cut from the song: only your hits play them, on the beat.',
  hypothesis:
    'When the cue notes sound only on your hits (808s, lead notes, snares, vocal chops), every press feels like authorship and the music connection score beats baseline; the "not right" feeling comes from the song playing every cue note whether or not you press.',
  inspiration: ['beatmania IIDX', 'DJMAX', 'Rock Band', 'Hi-Fi Rush'],
  howTo: [
    'The song is missing its 808s, lead notes, snares and vocal chops. You play them.',
    'Same four lanes: A 808 (block) · S lead (slash) · D snare (stab) · F vocals (flourish).',
    'Each hit sounds on the beat, brightest on PERFECT. A miss leaves a hole in the song.',
  ],
  options: { musicMapping: NO_MUSIC_LAYER, keyLegend: 'A S D F' },
  chart: keysoundChart,
  create: (x: ExperimentContext) => {
    const { audio, engine, session, chart, arena, camera } = x;
    const player = new KeysoundPlayer(audio);
    player.bus.connect(engine.musicBus);
    void player.load(
      LAB_SONG_NAME,
      cueGroups(songEvents(LAB_SONG_NAME)!),
      chart.tempo.bpmAtBeat(0),
    );
    const juice = new Juice();
    /** Game time each lane's voice last sounded (for the tag pulse). */
    const voiceAt = ACTIONS.map(() => -10);

    const off = [
      session.bus.on('judgement', (j) => {
        if (j.kind === 'holdEnd') return;
        const cue = session.conductor.cues[j.noteId];
        const note = cue && chart.notes[cue.noteId];
        if (!cue || !note) return;
        if (j.judgement === 'miss') {
          player.thunk();
          return;
        }
        player.hit(note.beat, engine.ctxTimeFor(cue.time), j.judgement);
        const at = Math.max(cue.time, j.time);
        voiceAt[j.lane] = at;
        const strength = PUNCH[j.judgement] * (note.action === 'flourish' ? 1.4 : 1);
        juice.punch(at, strength, ACTION_SPECS[note.action].color);
      }),
      onStrayPress(session, (lane) => player.ghost(ACTIONS[lane] ?? 'block')),
    ];

    return {
      update: (t) => juice.apply(camera, t),
      drawHud: (c, t, w, h) => {
        juice.drawFlash(c, t, w, h);
        const lanes = arena.laneScreen();
        const mid = ((lanes.xs[0] ?? 0) + (lanes.xs[3] ?? 0)) / 2;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        ACTIONS.forEach((a, i) => {
          const lx = lanes.xs[i] ?? 0;
          const xx = lx + (lx - mid) * 0.35;
          const k = punchEnvelope(t - voiceAt[i]!);
          const color = ACTION_SPECS[a].color;
          c.font = `bold ${Math.round(13 + 5 * k)}px monospace`;
          c.fillStyle = hexA(color, 0.55 + 0.45 * k);
          c.shadowColor = color;
          c.shadowBlur = 12 * k;
          c.fillText(VOICE_TAGS[i]!, xx, h - 88 - 4 * k);
          c.shadowBlur = 0;
        });
      },
      dispose: () => {
        off.forEach((f) => f());
        player.dispose();
      },
    };
  },
};
