import {
  CHART_FORMAT_ID,
  CHART_FORMAT_VERSION,
  type ChartFile,
  type ChartNote,
  type BpmChange,
} from './types';

export const LANE_NAME_PATTERN = /^[a-z][a-z0-9_-]{0,23}$/;
export const MIN_LANES = 1;
export const MAX_LANES = 8;
/** Two notes in one lane closer than this (in beats) are treated as duplicates. */
const DUPLICATE_EPSILON_BEATS = 1 / 96;

export type ValidationResult =
  | { ok: true; chart: ChartFile; warnings: string[] }
  | { ok: false; errors: string[]; warnings: string[] };

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const describe = (v: unknown): string =>
  v === undefined ? 'missing' : `${JSON.stringify(v)} (${Array.isArray(v) ? 'array' : typeof v})`;

/**
 * Validate an already-parsed JSON value as a chart. Errors name the exact path
 * (e.g. `notes[12].lane`) and say what was expected, so an LLM can fix them.
 * Notes are returned sorted by beat; unsorted input is only a warning.
 */
export function validateChart(input: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const err = (path: string, msg: string) => errors.push(`${path}: ${msg}`);

  if (!isObj(input)) {
    return { ok: false, errors: [`(root): expected a JSON object, got ${describe(input)}`], warnings };
  }

  const known = new Set(['$schema', 'format', 'version', 'meta', 'audio', 'timing', 'lanes', 'notes']);
  for (const k of Object.keys(input)) {
    if (!known.has(k)) warnings.push(`${k}: unknown top-level field is ignored`);
  }

  if (input.format !== CHART_FORMAT_ID) {
    err('format', `must be "${CHART_FORMAT_ID}", got ${describe(input.format)}`);
  }
  if (input.version !== CHART_FORMAT_VERSION) {
    err('version', `must be ${CHART_FORMAT_VERSION}, got ${describe(input.version)}`);
  }

  // meta
  const meta = input.meta;
  if (!isObj(meta)) {
    err('meta', `must be an object like {"title": "My Song"}, got ${describe(meta)}`);
  } else {
    if (typeof meta.title !== 'string' || meta.title.trim() === '') {
      err('meta.title', `must be a non-empty string, got ${describe(meta.title)}`);
    }
    for (const k of ['artist', 'charter', 'difficulty', 'description']) {
      if (meta[k] !== undefined && typeof meta[k] !== 'string') {
        err(`meta.${k}`, `must be a string if present, got ${describe(meta[k])}`);
      }
    }
  }

  // audio
  const audio = input.audio;
  if (!isObj(audio)) {
    err('audio', `must be an object like {"file": "song.mp3"}, got ${describe(audio)}`);
  } else {
    const hasFile = audio.file !== undefined;
    const hasProc = audio.procedural !== undefined;
    if (hasFile === hasProc) {
      err('audio', 'must have exactly one of "file" (audio path) or "procedural" (built-in song name)');
    }
    if (hasFile && (typeof audio.file !== 'string' || audio.file === '')) {
      err('audio.file', `must be a non-empty string path, got ${describe(audio.file)}`);
    }
    if (hasProc && (typeof audio.procedural !== 'string' || audio.procedural === '')) {
      err('audio.procedural', `must be a non-empty string, got ${describe(audio.procedural)}`);
    }
    if (audio.lengthBeats !== undefined && (!isNum(audio.lengthBeats) || audio.lengthBeats <= 0)) {
      err('audio.lengthBeats', `must be a positive number if present, got ${describe(audio.lengthBeats)}`);
    }
  }

  // timing
  const timing = input.timing;
  if (!isObj(timing)) {
    err('timing', `must be an object like {"bpm": 160, "offsetMs": 0}, got ${describe(timing)}`);
  } else {
    if (!isNum(timing.bpm) || timing.bpm < 20 || timing.bpm > 400) {
      err('timing.bpm', `must be a number between 20 and 400, got ${describe(timing.bpm)}`);
    }
    if (!isNum(timing.offsetMs)) {
      err('timing.offsetMs', `must be a number (milliseconds into the audio where beat 0 is), got ${describe(timing.offsetMs)}`);
    }
    if (
      timing.beatsPerBar !== undefined &&
      (!Number.isInteger(timing.beatsPerBar) || (timing.beatsPerBar as number) < 1 || (timing.beatsPerBar as number) > 16)
    ) {
      err('timing.beatsPerBar', `must be an integer 1-16 if present, got ${describe(timing.beatsPerBar)}`);
    }
    if (timing.bpmChanges !== undefined) {
      if (!Array.isArray(timing.bpmChanges)) {
        err('timing.bpmChanges', `must be an array of {"beat", "bpm"}, got ${describe(timing.bpmChanges)}`);
      } else {
        let last = 0;
        timing.bpmChanges.forEach((c: unknown, i) => {
          const p = `timing.bpmChanges[${i}]`;
          if (!isObj(c)) return err(p, `must be an object {"beat": number, "bpm": number}, got ${describe(c)}`);
          if (!isNum(c.beat) || c.beat <= 0) err(`${p}.beat`, `must be a number > 0, got ${describe(c.beat)}`);
          else if (c.beat <= last) err(`${p}.beat`, `must be greater than the previous change (${last})`);
          else last = c.beat;
          if (!isNum(c.bpm) || c.bpm < 20 || c.bpm > 400) err(`${p}.bpm`, `must be 20-400, got ${describe(c.bpm)}`);
        });
      }
    }
  }

  // lanes
  const lanes = input.lanes;
  let laneSet = new Set<string>();
  if (!Array.isArray(lanes)) {
    err('lanes', `must be an array of lane names like ["kick", "perc", "bass", "synth"], got ${describe(lanes)}`);
  } else {
    if (lanes.length < MIN_LANES || lanes.length > MAX_LANES) {
      err('lanes', `must have ${MIN_LANES}-${MAX_LANES} lanes, got ${lanes.length}`);
    }
    lanes.forEach((l: unknown, i) => {
      if (typeof l !== 'string' || !LANE_NAME_PATTERN.test(l)) {
        err(`lanes[${i}]`, `must be a lowercase name (letters, digits, - or _; starts with a letter), got ${describe(l)}`);
      } else if (laneSet.has(l)) {
        err(`lanes[${i}]`, `duplicate lane name "${l}"`);
      } else {
        laneSet.add(l);
      }
    });
  }

  // notes
  const notes = input.notes;
  const outNotes: ChartNote[] = [];
  if (!Array.isArray(notes)) {
    err('notes', `must be an array of {"beat": number, "lane": string}, got ${describe(notes)}`);
  } else {
    if (notes.length === 0) warnings.push('notes: chart has no notes');
    const laneList = [...laneSet].join(', ');
    let prevBeat = -Infinity;
    let unsorted = false;
    notes.forEach((n: unknown, i) => {
      const p = `notes[${i}]`;
      if (!isObj(n)) return err(p, `must be an object like {"beat": 4, "lane": "kick"}, got ${describe(n)}`);
      for (const k of Object.keys(n)) {
        if (k !== 'beat' && k !== 'lane' && k !== 'length') {
          warnings.push(`${p}.${k}: unknown note field is ignored`);
        }
      }
      let ok = true;
      if (!isNum(n.beat) || n.beat < 0) {
        err(`${p}.beat`, `must be a number >= 0 (beats from beat 0; 0.5 = an eighth note later), got ${describe(n.beat)}`);
        ok = false;
      }
      if (typeof n.lane !== 'string' || !laneSet.has(n.lane)) {
        err(`${p}.lane`, `${describe(n.lane)} is not one of the lanes [${laneList}]`);
        ok = false;
      }
      if (n.length !== undefined && (!isNum(n.length) || n.length < 0)) {
        err(`${p}.length`, `must be a number of beats >= 0 if present (hold length), got ${describe(n.length)}`);
        ok = false;
      }
      if (!ok) return;
      const note: ChartNote = { beat: n.beat as number, lane: n.lane as string };
      if (isNum(n.length) && n.length > 0) note.length = n.length;
      if (note.beat < prevBeat) unsorted = true;
      prevBeat = note.beat;
      outNotes.push(note);
    });
    if (unsorted) warnings.push('notes: not sorted by beat (they were sorted automatically)');

    // overlap checks per lane, on sorted notes
    const indexed = outNotes.map((n, idx) => ({ n, idx }));
    indexed.sort((a, b) => a.n.beat - b.n.beat);
    const lastByLane = new Map<string, { beat: number; end: number }>();
    for (const { n } of indexed) {
      const prev = lastByLane.get(n.lane);
      if (prev) {
        if (Math.abs(n.beat - prev.beat) < DUPLICATE_EPSILON_BEATS) {
          err('notes', `duplicate note in lane "${n.lane}" at beat ${n.beat}`);
        } else if (n.beat < prev.end - 1e-9) {
          err('notes', `note in lane "${n.lane}" at beat ${n.beat} starts inside the hold that runs from beat ${prev.beat} to ${prev.end}`);
        }
      }
      lastByLane.set(n.lane, { beat: n.beat, end: n.beat + (n.length ?? 0) });
    }
    outNotes.sort((a, b) => a.beat - b.beat || a.lane.localeCompare(b.lane));

    if (isObj(audio) && isNum(audio.lengthBeats)) {
      const last = outNotes.reduce((m, n) => Math.max(m, n.beat + (n.length ?? 0)), 0);
      if (last > audio.lengthBeats) {
        warnings.push(`notes: last note ends at beat ${last}, after audio.lengthBeats (${audio.lengthBeats})`);
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors, warnings };

  const t = timing as Obj;
  const chart: ChartFile = {
    format: CHART_FORMAT_ID,
    version: CHART_FORMAT_VERSION,
    meta: meta as unknown as ChartFile['meta'],
    audio: audio as ChartFile['audio'],
    timing: {
      bpm: t.bpm as number,
      offsetMs: t.offsetMs as number,
      ...(t.beatsPerBar !== undefined ? { beatsPerBar: t.beatsPerBar as number } : {}),
      ...(t.bpmChanges !== undefined ? { bpmChanges: t.bpmChanges as BpmChange[] } : {}),
    },
    lanes: lanes as string[],
    notes: outNotes,
  };
  return { ok: true, chart, warnings };
}

/** Parse JSON text then validate. JSON syntax errors are reported with line/column. */
export function parseChartText(text: string): ValidationResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const posMatch = /position (\d+)/.exec(msg);
    let where = '';
    if (posMatch && !/line \d+/.test(msg)) {
      const pos = Number(posMatch[1]);
      const before = text.slice(0, pos);
      const line = before.split('\n').length;
      const col = pos - before.lastIndexOf('\n');
      where = ` (line ${line}, column ${col})`;
    }
    return { ok: false, errors: [`(json): invalid JSON: ${msg}${where}`], warnings: [] };
  }
  return validateChart(value);
}
