import {
  ACTIONS,
  CHART_FORMAT_ID,
  CHART_FORMAT_VERSION,
  ENEMY_KINDS,
  type Action,
  type BpmChange,
  type ChartCombo,
  type ChartEncounter,
  type ChartFile,
  type ChartNote,
  type ChartPrompt,
  type EnemyKind,
} from './types';

/** Two notes closer than this (in beats) count as simultaneous. */
const SAME_BEAT_EPSILON = 1 / 96;
/** An enemy needs this many beats between walking in and its first cue. */
export const MIN_WALK_IN_BEATS = 1;
/** Retries per combo measure when a combo range doesn't say. */
export const DEFAULT_COMBO_RETRIES = 2;
export const MAX_COMBO_RETRIES = 5;
/** Combos need the last beat of the measure free and at least this long (s) to decide a retry. */
const MIN_DECISION_SECONDS = 0.3;

export type ValidationResult =
  | { ok: true; chart: ChartFile; warnings: string[] }
  | { ok: false; errors: string[]; warnings: string[] };

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const describe = (v: unknown): string =>
  v === undefined ? 'missing' : `${JSON.stringify(v)} (${Array.isArray(v) ? 'array' : typeof v})`;
const isAction = (v: unknown): v is Action => ACTIONS.includes(v as Action);
const isEnemy = (v: unknown): v is EnemyKind => ENEMY_KINDS.includes(v as EnemyKind);
const ACTION_LIST = ACTIONS.join(', ');
const ENEMY_LIST = ENEMY_KINDS.join(', ');

/**
 * Validate an already-parsed JSON value as a chart. Errors name the exact path
 * (e.g. `notes[12].action`) and say what was expected, so an LLM can fix them.
 * Notes are returned sorted by beat; unsorted input is only a warning.
 */
export function validateChart(input: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const err = (path: string, msg: string) => errors.push(`${path}: ${msg}`);

  if (!isObj(input)) {
    return {
      ok: false,
      errors: [`(root): expected a JSON object, got ${describe(input)}`],
      warnings,
    };
  }

  const known = new Set([
    '$schema',
    'format',
    'version',
    'meta',
    'audio',
    'timing',
    'encounters',
    'prompts',
    'combos',
    'notes',
  ]);
  for (const k of Object.keys(input)) {
    if (k === 'lanes') {
      err(
        'lanes',
        `was removed in version 2. Every chart has the same four action lanes [${ACTION_LIST}]; give each note an "action" instead`,
      );
    } else if (!known.has(k)) warnings.push(`${k}: unknown top-level field is ignored`);
  }

  if (input.format !== CHART_FORMAT_ID) {
    err('format', `must be "${CHART_FORMAT_ID}", got ${describe(input.format)}`);
  }
  if (input.version !== CHART_FORMAT_VERSION) {
    err(
      'version',
      `must be ${CHART_FORMAT_VERSION}, got ${describe(input.version)}` +
        (input.version === 1
          ? ' (version 1 used song-element lanes; see docs/map-format.md)'
          : '') +
        (input.version === 2 ? ' (version 3 only adds optional "combos"; bump the number)' : ''),
    );
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
      err(
        'audio',
        'must have exactly one of "file" (audio path) or "procedural" (built-in song name)',
      );
    }
    if (hasFile && (typeof audio.file !== 'string' || audio.file === '')) {
      err('audio.file', `must be a non-empty string path, got ${describe(audio.file)}`);
    }
    if (hasProc && (typeof audio.procedural !== 'string' || audio.procedural === '')) {
      err('audio.procedural', `must be a non-empty string, got ${describe(audio.procedural)}`);
    }
    if (audio.lengthBeats !== undefined && (!isNum(audio.lengthBeats) || audio.lengthBeats <= 0)) {
      err(
        'audio.lengthBeats',
        `must be a positive number if present, got ${describe(audio.lengthBeats)}`,
      );
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
      err(
        'timing.offsetMs',
        `must be a number (milliseconds into the audio where beat 0 is), got ${describe(timing.offsetMs)}`,
      );
    }
    if (
      timing.beatsPerBar !== undefined &&
      (!Number.isInteger(timing.beatsPerBar) ||
        (timing.beatsPerBar as number) < 1 ||
        (timing.beatsPerBar as number) > 16)
    ) {
      err(
        'timing.beatsPerBar',
        `must be an integer 1-16 if present, got ${describe(timing.beatsPerBar)}`,
      );
    }
    if (timing.bpmChanges !== undefined) {
      if (!Array.isArray(timing.bpmChanges)) {
        err(
          'timing.bpmChanges',
          `must be an array of {"beat", "bpm"}, got ${describe(timing.bpmChanges)}`,
        );
      } else {
        let last = 0;
        timing.bpmChanges.forEach((c: unknown, i) => {
          const p = `timing.bpmChanges[${i}]`;
          if (!isObj(c))
            return err(p, `must be an object {"beat": number, "bpm": number}, got ${describe(c)}`);
          if (!isNum(c.beat) || c.beat <= 0)
            err(`${p}.beat`, `must be a number > 0, got ${describe(c.beat)}`);
          else if (c.beat <= last)
            err(`${p}.beat`, `must be greater than the previous change (${last})`);
          else last = c.beat;
          if (!isNum(c.bpm) || c.bpm < 20 || c.bpm > 400)
            err(`${p}.bpm`, `must be 20-400, got ${describe(c.bpm)}`);
        });
      }
    }
  }

  // notes
  const notes = input.notes;
  const outNotes: ChartNote[] = [];
  const srcIndex = new Map<ChartNote, number>();
  if (!Array.isArray(notes)) {
    err('notes', `must be an array of {"beat": number, "action": string}, got ${describe(notes)}`);
  } else {
    if (notes.length === 0) warnings.push('notes: chart has no notes');
    let prevBeat = -Infinity;
    let unsorted = false;
    notes.forEach((n: unknown, i) => {
      const p = `notes[${i}]`;
      if (!isObj(n))
        return err(p, `must be an object like {"beat": 4, "action": "block"}, got ${describe(n)}`);
      for (const k of Object.keys(n)) {
        if (k === 'lane') {
          err(`${p}.lane`, `was removed in version 2; use "action": one of [${ACTION_LIST}]`);
        } else if (k !== 'beat' && k !== 'action' && k !== 'length') {
          warnings.push(`${p}.${k}: unknown note field is ignored`);
        }
      }
      let ok = true;
      if (!isNum(n.beat) || n.beat < 0) {
        err(
          `${p}.beat`,
          `must be a number >= 0 (beats from beat 0; 0.5 = an eighth note later), got ${describe(n.beat)}`,
        );
        ok = false;
      }
      if (!isAction(n.action)) {
        err(`${p}.action`, `${describe(n.action)} is not one of [${ACTION_LIST}]`);
        ok = false;
      }
      if (n.length !== undefined && (!isNum(n.length) || n.length < 0)) {
        err(
          `${p}.length`,
          `must be a number of beats >= 0 if present (hold length), got ${describe(n.length)}`,
        );
        ok = false;
      }
      if (!ok) return;
      const note: ChartNote = { beat: n.beat as number, action: n.action as Action };
      if (isNum(n.length) && n.length > 0) note.length = n.length;
      if (note.beat < prevBeat) unsorted = true;
      prevBeat = note.beat;
      outNotes.push(note);
      srcIndex.set(note, i);
    });
    if (unsorted) warnings.push('notes: not sorted by beat (they were sorted automatically)');

    // One action at a time: no two notes on the same beat, nothing during a hold.
    outNotes.sort(
      (a, b) => a.beat - b.beat || ACTIONS.indexOf(a.action) - ACTIONS.indexOf(b.action),
    );
    let prev: ChartNote | null = null;
    for (const n of outNotes) {
      if (prev) {
        const pi = srcIndex.get(prev)!;
        const ni = srcIndex.get(n)!;
        const prevEnd = prev.beat + (prev.length ?? 0);
        if (Math.abs(n.beat - prev.beat) < SAME_BEAT_EPSILON) {
          err(
            `notes[${ni}]`,
            `is at beat ${n.beat}, the same beat as notes[${pi}] (${prev.action}). Only one action can happen at a time`,
          );
        } else if (n.beat < prevEnd - 1e-9) {
          err(
            `notes[${ni}]`,
            `starts at beat ${n.beat}, inside the ${prev.action} hold notes[${pi}] that runs from beat ${prev.beat} to ${prevEnd}`,
          );
        }
      }
      prev = n;
    }

    if (isObj(audio) && isNum(audio.lengthBeats)) {
      const last = outNotes.reduce((m, n) => Math.max(m, n.beat + (n.length ?? 0)), 0);
      if (last > audio.lengthBeats) {
        warnings.push(
          `notes: last note ends at beat ${last}, after audio.lengthBeats (${audio.lengthBeats})`,
        );
      }
    }
  }

  // encounters
  let outEncounters: ChartEncounter[] | undefined;
  const encounters = input.encounters;
  if (encounters !== undefined) {
    if (!Array.isArray(encounters)) {
      err(
        'encounters',
        `must be an array like [{"beat": 0, "enemy": "grunt"}], got ${describe(encounters)}`,
      );
    } else {
      outEncounters = [];
      let last = -Infinity;
      encounters.forEach((e: unknown, i) => {
        const p = `encounters[${i}]`;
        if (!isObj(e)) return err(p, `must be an object like {"beat": 0}, got ${describe(e)}`);
        for (const k of Object.keys(e)) {
          if (k !== 'beat' && k !== 'enemy' && k !== 'name')
            warnings.push(`${p}.${k}: unknown encounter field is ignored`);
        }
        let ok = true;
        if (!isNum(e.beat) || e.beat < 0) {
          err(`${p}.beat`, `must be a number >= 0, got ${describe(e.beat)}`);
          ok = false;
        } else if (e.beat <= last) {
          err(`${p}.beat`, `must be greater than the previous encounter's beat (${last})`);
          ok = false;
        }
        if (e.enemy !== undefined && !isEnemy(e.enemy)) {
          err(`${p}.enemy`, `${describe(e.enemy)} is not one of [${ENEMY_LIST}]`);
          ok = false;
        }
        if (e.name !== undefined && typeof e.name !== 'string') {
          err(`${p}.name`, `must be a string if present, got ${describe(e.name)}`);
          ok = false;
        }
        if (!ok) return;
        last = e.beat as number;
        const enc: ChartEncounter = { beat: e.beat as number };
        if (e.enemy !== undefined) enc.enemy = e.enemy as EnemyKind;
        if (e.name !== undefined) enc.name = e.name as string;
        outEncounters!.push(enc);
      });
      if (encounters.length === 0) err('encounters', 'must have at least one encounter if present');
      if (outEncounters.length > 0 && outNotes.length > 0) {
        const first = outNotes[0]!;
        if (first.beat < outEncounters[0]!.beat) {
          err(
            'encounters[0].beat',
            `is ${outEncounters[0]!.beat}, after the first note (beat ${first.beat}). Every note needs an enemy: start the first encounter at or before it`,
          );
        }
        outEncounters.forEach((enc, i) => {
          const end = outEncounters![i + 1]?.beat ?? Infinity;
          const inside = outNotes.filter((n) => n.beat >= enc.beat && n.beat < end);
          if (inside.length === 0) {
            err(
              `encounters[${i}]`,
              `starting at beat ${enc.beat} has no notes before the next encounter. Remove it or give it notes`,
            );
            return;
          }
          const gap = inside[0]!.beat - enc.beat;
          if (i > 0 && gap < MIN_WALK_IN_BEATS) {
            warnings.push(
              `encounters[${i}]: first note is ${gap} beats after the enemy walks in (beat ${enc.beat}); leave at least ${MIN_WALK_IN_BEATS}`,
            );
          }
          const lastNote = inside[inside.length - 1]!;
          if (lastNote.action !== 'flourish') {
            warnings.push(
              `encounters[${i}]: ends on a ${lastNote.action} at beat ${lastNote.beat}. End each enemy on a flourish (the finisher)`,
            );
          }
        });
      }
    }
  }

  // prompts
  let outPrompts: ChartPrompt[] | undefined;
  const prompts = input.prompts;
  if (prompts !== undefined) {
    if (!Array.isArray(prompts)) {
      err(
        'prompts',
        `must be an array like [{"beat": 0, "text": "BLOCK the attack"}], got ${describe(prompts)}`,
      );
    } else {
      outPrompts = [];
      prompts.forEach((pr: unknown, i) => {
        const p = `prompts[${i}]`;
        if (!isObj(pr))
          return err(p, `must be an object like {"beat": 0, "text": "..."}, got ${describe(pr)}`);
        let ok = true;
        if (!isNum(pr.beat) || pr.beat < 0) {
          err(`${p}.beat`, `must be a number >= 0, got ${describe(pr.beat)}`);
          ok = false;
        }
        if (typeof pr.text !== 'string' || pr.text.trim() === '') {
          err(`${p}.text`, `must be a non-empty string, got ${describe(pr.text)}`);
          ok = false;
        }
        if (pr.action !== undefined && !isAction(pr.action)) {
          err(`${p}.action`, `${describe(pr.action)} is not one of [${ACTION_LIST}]`);
          ok = false;
        }
        if (pr.beats !== undefined && (!isNum(pr.beats) || pr.beats <= 0)) {
          err(`${p}.beats`, `must be a positive number if present, got ${describe(pr.beats)}`);
          ok = false;
        }
        if (!ok) return;
        const out: ChartPrompt = { beat: pr.beat as number, text: pr.text as string };
        if (pr.action !== undefined) out.action = pr.action as Action;
        if (pr.beats !== undefined) out.beats = pr.beats as number;
        outPrompts!.push(out);
      });
    }
  }

  // combos
  let outCombos: ChartCombo[] | undefined;
  const combos = input.combos;
  if (combos !== undefined) {
    if (!Array.isArray(combos)) {
      err(
        'combos',
        `must be an array like [{"fromBar": 40, "toBar": 47}], got ${describe(combos)}`,
      );
    } else {
      outCombos = [];
      let lastBar = -1;
      combos.forEach((c: unknown, i) => {
        const p = `combos[${i}]`;
        if (!isObj(c)) return err(p, `must be an object like {"fromBar": 40}, got ${describe(c)}`);
        for (const k of Object.keys(c)) {
          if (k !== 'fromBar' && k !== 'toBar' && k !== 'retries')
            warnings.push(`${p}.${k}: unknown combo field is ignored`);
        }
        const isBar = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0;
        let ok = true;
        if (!isBar(c.fromBar)) {
          err(
            `${p}.fromBar`,
            `must be a bar index (integer >= 0; bar n starts at beat n * beatsPerBar), got ${describe(c.fromBar)}`,
          );
          ok = false;
        }
        if (
          c.toBar !== undefined &&
          (!isBar(c.toBar) || (isBar(c.fromBar) && c.toBar < c.fromBar))
        ) {
          err(`${p}.toBar`, `must be an integer >= fromBar if present, got ${describe(c.toBar)}`);
          ok = false;
        }
        if (
          c.retries !== undefined &&
          (!Number.isInteger(c.retries) ||
            (c.retries as number) < 0 ||
            (c.retries as number) > MAX_COMBO_RETRIES)
        ) {
          err(
            `${p}.retries`,
            `must be an integer 0-${MAX_COMBO_RETRIES} if present, got ${describe(c.retries)}`,
          );
          ok = false;
        }
        if (!ok) return;
        const from = c.fromBar as number;
        if (from <= lastBar) {
          err(
            `${p}.fromBar`,
            `overlaps or comes before the previous combo range (which ends at bar ${lastBar})`,
          );
          return;
        }
        const out: ChartCombo = { fromBar: from };
        if (c.toBar !== undefined) out.toBar = c.toBar as number;
        if (c.retries !== undefined) out.retries = c.retries as number;
        lastBar = out.toBar ?? from;
        outCombos!.push(out);
      });

      if (isObj(timing) && isNum(timing.bpm) && outCombos.length > 0 && errors.length === 0) {
        const bpb = (timing.beatsPerBar as number | undefined) ?? 4;
        const bpms = [
          timing.bpm,
          ...((timing.bpmChanges as BpmChange[] | undefined) ?? []).map((b) => b.bpm),
        ];
        if (60 / Math.max(...bpms) < MIN_DECISION_SECONDS) {
          err(
            'combos',
            `need beats of at least ${MIN_DECISION_SECONDS} s (bpm <= ${Math.floor(60 / MIN_DECISION_SECONDS)})`,
          );
        }
        const inCombo = (bar: number) =>
          outCombos!.some((c) => bar >= c.fromBar && bar <= (c.toBar ?? c.fromBar));
        for (const n of outNotes) {
          const bar = Math.floor(n.beat / bpb + 1e-9);
          if (!inCombo(bar)) continue;
          const lastBeat = (bar + 1) * bpb - 1;
          const end = n.beat + (n.length ?? 0);
          if (end > lastBeat + 1e-9) {
            err(
              `notes[${srcIndex.get(n)}]`,
              `${n.action} at beat ${n.beat}${n.length ? ` (held to ${end})` : ''} is in the last beat of combo bar ${bar} (after beat ${lastBeat}). Leave the last beat of a combo measure empty so the game can decide on a retry`,
            );
          }
        }
        const starts = outEncounters ?? [];
        starts.forEach((e, i) => {
          const bar = Math.floor(e.beat / bpb + 1e-9);
          if (inCombo(bar) && e.beat > bar * bpb + 1e-9) {
            err(
              `encounters[${i}].beat`,
              `${e.beat} starts inside combo bar ${bar}. Start encounters on a combo bar's first beat or outside combos`,
            );
          }
        });
        if (
          !outEncounters &&
          outNotes.some(
            (n, i) =>
              i < outNotes.length - 1 &&
              n.action === 'flourish' &&
              inCombo(Math.floor(n.beat / bpb + 1e-9)),
          )
        ) {
          err(
            'encounters',
            'are required when a flourish sits inside a combo (the automatic split would start an enemy mid-measure)',
          );
        }
        for (const c of outCombos) {
          for (let b = c.fromBar; b <= (c.toBar ?? c.fromBar); b++) {
            if (!outNotes.some((n) => Math.floor(n.beat / bpb + 1e-9) === b)) {
              warnings.push(`combos: bar ${b} has no notes, so it is not a combo`);
            }
          }
        }
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
    ...(outEncounters ? { encounters: outEncounters } : {}),
    ...(outPrompts ? { prompts: outPrompts } : {}),
    ...(outCombos ? { combos: outCombos } : {}),
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
