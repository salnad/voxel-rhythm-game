import {
  composeDemo,
  DEMO_BPM,
  DEMO_LANES,
  DEMO_LENGTH_BEATS,
} from '../audio/demo/composition';
import { CHART_FORMAT_ID, CHART_FORMAT_VERSION, type ChartFile, type ChartNote } from './types';

export type DemoDifficulty = 'normal' | 'easy';

/** Build the demo chart from the composition. Written to public/maps/demo by `npm run gen:demo`. */
export function buildDemoChart(difficulty: DemoDifficulty = 'normal'): ChartFile {
  const notes: ChartNote[] = [];
  for (const e of composeDemo()) {
    if (!e.chart) continue;
    if (difficulty === 'easy') {
      // Whole beats only, kick and synth on even beats, claps only.
      if (e.beat % 1 !== 0) continue;
      if (e.chart.lane === 'perc' && (e.inst !== 'clap' || e.vel < 1)) continue;
      if ((e.chart.lane === 'kick' || e.chart.lane === 'synth') && e.beat % 2 !== 0) continue;
    }
    const n: ChartNote = { beat: e.beat, lane: e.chart.lane };
    if (e.chart.length) n.length = e.chart.length;
    notes.push(n);
  }
  // Drop duplicates (same lane & beat) that the composition can produce.
  const seen = new Set<string>();
  const unique = notes.filter((n) => {
    const k = `${n.lane}@${n.beat}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  unique.sort((a, b) => a.beat - b.beat || DEMO_LANES.indexOf(a.lane as never) - DEMO_LANES.indexOf(b.lane as never));
  return {
    format: CHART_FORMAT_ID,
    version: CHART_FORMAT_VERSION,
    meta: {
      title: 'NEON//DAEMON',
      artist: 'procedural (Web Audio)',
      charter: 'voxel-rhythm demo generator',
      difficulty,
      description: 'Hyperpop demo loop generated in the browser. Lanes follow the instruments.',
    },
    audio: { procedural: 'hyperpop-demo', lengthBeats: DEMO_LENGTH_BEATS },
    timing: { bpm: DEMO_BPM, offsetMs: 0, beatsPerBar: 4 },
    lanes: [...DEMO_LANES],
    notes: unique,
  };
}

/** Compact, diff-friendly JSON: one note per line. */
export function formatChartJson(chart: ChartFile, schemaRef?: string): string {
  const { notes, ...rest } = chart;
  const head = JSON.stringify(schemaRef ? { $schema: schemaRef, ...rest } : rest, null, 2);
  const noteLines = notes.map((n) => '    ' + JSON.stringify(n).replace(/,"/g, ', "').replace(/":/g, '": '));
  return `${head.slice(0, -2)},\n  "notes": [\n${noteLines.join(',\n')}\n  ]\n}\n`;
}
