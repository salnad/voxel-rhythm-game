import { composeDemo, DEMO_BPM, DEMO_COMBOS, DEMO_LENGTH_BEATS } from '../audio/demo/composition';
import {
  ACTIONS,
  CHART_FORMAT_ID,
  CHART_FORMAT_VERSION,
  type ChartEncounter,
  type ChartFile,
  type ChartNote,
  type ChartPrompt,
} from './types';

export type DemoDifficulty = 'normal' | 'easy';

/**
 * One enemy per musical phrase. Each walks in a beat after the previous one's finisher
 * (the crash on the downbeat), so the next fight starts on the beat.
 */
const ENCOUNTERS: ChartEncounter[] = [
  { beat: 0, enemy: 'grunt', name: 'TRAINING GRUNT' },
  { beat: 65, enemy: 'grunt', name: 'GRUNT' },
  { beat: 81, enemy: 'duelist', name: 'DUELIST' },
  { beat: 97, enemy: 'grunt', name: 'GRUNT' },
  { beat: 113, enemy: 'brute', name: 'BRUTE' },
  { beat: 129, enemy: 'duelist', name: 'DUELIST' },
  { beat: 145, enemy: 'knight', name: 'KNIGHT' },
  { beat: 161, enemy: 'knight', name: 'BLADE KNIGHT' },
  { beat: 193, enemy: 'grunt', name: 'GRUNT' },
  { beat: 209, enemy: 'duelist', name: 'DUELIST' },
  { beat: 225, enemy: 'brute', name: 'DAEMON' },
];

/** Each new action gets a prompt a few beats before its first cue. */
const PROMPTS: ChartPrompt[] = [
  { beat: 0, action: 'block', text: 'When the enemy winds up, BLOCK on the 808', beats: 10 },
  { beat: 18, action: 'slash', text: 'When it opens its guard, SLASH on the lead', beats: 10 },
  { beat: 40, action: 'stab', text: 'Its weak point glows: STAB it on the snare', beats: 8 },
  {
    beat: 56,
    action: 'flourish',
    text: 'It staggers: FLOURISH on the vocal to finish it',
    beats: 9,
  },
  {
    beat: 66,
    text: 'Listen: 808 = BLOCK · lead = SLASH · snare/hats = STAB · vocal = FLOURISH',
    beats: 12,
  },
  {
    beat: 158,
    text: 'BOSS COMBOS: clear the whole measure. One miss and it repeats',
    beats: 10,
  },
  { beat: 168, text: 'Blade lock: HOLD block until the snare', action: 'block', beats: 5 },
  { beat: 222, text: 'The DAEMON: every measure is a combo', beats: 7 },
];

/** Build a demo chart from the composition. Written to public/maps/demo by `npm run gen:demo`. */
export function buildDemoChart(difficulty: DemoDifficulty = 'normal'): ChartFile {
  const notes: ChartNote[] = [];
  for (const e of composeDemo()) {
    if (!e.chart) continue;
    if (difficulty === 'easy' && !e.chart.easy) continue;
    const n: ChartNote = { beat: e.beat, action: e.chart.action };
    if (e.chart.length && difficulty === 'normal') n.length = e.chart.length;
    notes.push(n);
  }
  notes.sort((a, b) => a.beat - b.beat || ACTIONS.indexOf(a.action) - ACTIONS.indexOf(b.action));
  const prompts = PROMPTS.filter(
    (p) => difficulty === 'normal' || !p.text.startsWith('Blade lock'),
  );
  return {
    format: CHART_FORMAT_ID,
    version: CHART_FORMAT_VERSION,
    meta: {
      title: 'NEON//DAEMON',
      artist: 'procedural (Web Audio)',
      charter: 'voxel-rhythm demo generator',
      difficulty,
      description:
        'Digicore duel generated in the browser. 808 = block, lead = slash, snare/hats = stab, vocal chops = flourish. Boss combos in the break and the last drop.',
    },
    audio: { procedural: 'digicore-demo', lengthBeats: DEMO_LENGTH_BEATS },
    timing: { bpm: DEMO_BPM, offsetMs: 0, beatsPerBar: 4 },
    encounters: ENCOUNTERS.map((e) => ({ ...e })),
    prompts: prompts.map((p) => ({ ...p })),
    combos: DEMO_COMBOS.map((c) => ({ ...c })),
    notes,
  };
}

/** Compact, diff-friendly JSON: one note, encounter or prompt per line. */
export function formatChartJson(chart: ChartFile, schemaRef?: string): string {
  const { notes, encounters, prompts, combos, ...rest } = chart;
  const line = (o: object) =>
    '    ' + JSON.stringify(o).replace(/,"/g, ', "').replace(/":/g, '": ');
  const head = JSON.stringify(schemaRef ? { $schema: schemaRef, ...rest } : rest, null, 2);
  const parts = [head.slice(0, -2)];
  if (encounters) parts.push(`  "encounters": [\n${encounters.map(line).join(',\n')}\n  ]`);
  if (prompts) parts.push(`  "prompts": [\n${prompts.map(line).join(',\n')}\n  ]`);
  if (combos) parts.push(`  "combos": [\n${combos.map(line).join(',\n')}\n  ]`);
  parts.push(`  "notes": [\n${notes.map(line).join(',\n')}\n  ]`);
  return `${parts.join(',\n')}\n}\n`;
}
