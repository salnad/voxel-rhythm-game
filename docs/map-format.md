# Map format (chart v1)

A **map** is an audio file plus a **chart**: a plain JSON file listing notes per lane.
This page is written so a person or an LLM can chart a song from scratch.

- Schema: [`schema/chart.schema.json`](../schema/chart.schema.json)
- Validate: `npm run validate-chart -- path/to/chart.json`. The in-game loader and the editor
  (`/editor.html`) use the same validator and show the same errors.
- Example: [`public/maps/demo/chart.json`](../public/maps/demo/chart.json)

## Minimal example

```json
{
  "format": "voxel-rhythm-chart",
  "version": 1,
  "meta": { "title": "My Song", "artist": "Someone", "charter": "me", "difficulty": "normal" },
  "audio": { "file": "song.mp3" },
  "timing": { "bpm": 150, "offsetMs": 230, "beatsPerBar": 4 },
  "lanes": ["kick", "perc", "bass", "synth"],
  "notes": [
    { "beat": 0, "lane": "kick" },
    { "beat": 0, "lane": "bass", "length": 1.5 },
    { "beat": 1, "lane": "perc" },
    { "beat": 1.5, "lane": "synth" },
    { "beat": 2, "lane": "kick" }
  ]
}
```

## Fields

| Field                | Required | Meaning                                                                                          |
| -------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `format`             | yes      | Always `"voxel-rhythm-chart"`.                                                                   |
| `version`            | yes      | Always `1`.                                                                                      |
| `meta.title`         | yes      | Song title. `artist`, `charter`, `difficulty`, `description` are optional strings.               |
| `audio.file`         | one of   | Audio path relative to the chart file (mp3, ogg, wav: anything the browser decodes).             |
| `audio.procedural`   | one of   | A built-in generated song instead of a file. Currently only `"hyperpop-demo"`.                   |
| `audio.lengthBeats`  | no       | Song length in beats. Used only for a warning if notes run past it.                              |
| `timing.bpm`         | yes      | Tempo, 20 to 400.                                                                                |
| `timing.offsetMs`    | yes      | Milliseconds into the audio where **beat 0** falls (the first downbeat you chart against).       |
| `timing.beatsPerBar` | no       | Default 4. Only affects bar lines.                                                               |
| `timing.bpmChanges`  | no       | `[{ "beat": 64, "bpm": 170 }]`. Each change applies from that beat on. Beats must increase.      |
| `lanes`              | yes      | 1 to 8 lane names, left to right. Lowercase letters, digits, `-` or `_`, starting with a letter. |
| `notes`              | yes      | Array of notes (see below). Order doesn't matter (they get sorted, with a warning).              |

### Notes

```json
{ "beat": 12.5, "lane": "synth" }
{ "beat": 16, "lane": "bass", "length": 2 }
```

- `beat`: position in beats from beat 0. Use decimals for subdivisions:
  `0.5` = eighth note, `0.25` = sixteenth, `0.333`/`0.667` = triplets.
- `lane`: must exactly match one of `lanes`.
- `length` (optional): makes a **hold** note, in beats. The player presses at `beat` and holds until
  `beat + length`.

Errors (the chart is rejected):

- a `lane` that is not in `lanes`
- negative `beat`, or a `length` that isn't a number
- two notes in the same lane at the same beat
- a note that starts inside a hold in the same lane

## How beats become time

```
seconds = offsetMs / 1000 + beat * 60 / bpm
```

With `bpmChanges` the formula applies piecewise. Notes can't sit before beat 0, so put beat 0 at or
before the first note you chart.

## Lanes are song elements

Each lane follows one element of the music and drives one attack:

| Lane name              | Attack                                      | Enemy |
| ---------------------- | ------------------------------------------- | ----- |
| `kick`                 | overhead SLAM                               | brute |
| `perc`, `snare`, `hat` | quick FLICK                                 | imp   |
| `bass`                 | wide SWEEP                                  | wall  |
| `synth`, `lead`        | PIERCE thrust                               | drone |
| anything else          | cycles through the four above by lane index |       |

A hold becomes a grind (the enemy is pinned) followed by a FINISHER when you release on time.
The mapping lives in `src/config/combat.ts`.

## Charting a song (checklist for LLMs)

1. Find the **BPM** and the time of the first strong downbeat. That time in ms is `offsetMs`, and
   it is beat 0.
2. Choose 4 lanes after the song's main elements, usually `["kick", "perc", "bass", "synth"]`.
3. Go bar by bar (bar `n` starts at beat `4 * n` in 4/4) and add a note wherever that element hits:
   - `kick`: kick drum hits.
   - `perc`: snares, claps, and the hi-hats or fills that stand out.
   - `bass`: bass note onsets. Make sustained bass notes holds (`length` = duration minus about
     0.5 beat, so the player can release before the next note).
   - `synth`: lead melody or vocal onsets. Make long notes holds.
4. Keep it playable. Within one lane, notes should be at least 0.25 beats apart (0.5 or more for easy
   charts), avoid more than 3 simultaneous notes, and thin out dense hi-hats.
5. Validate with `npm run validate-chart -- chart.json`, fix every error by its path
   (e.g. `notes[12].lane: "kik" is not one of the lanes [kick, perc, bass, synth]`), then playtest.
   Use the editor to nudge `offsetMs` if every note feels uniformly early or late.

## Shipping a map

Put `chart.json` and the audio in `public/maps/<id>/`, then add an entry to `public/maps/index.json`:

```json
{
  "id": "my-song",
  "title": "My Song",
  "artist": "Someone",
  "charts": [{ "difficulty": "normal", "file": "chart.json" }]
}
```

Players can also skip this. From the menu, CUSTOM MAP takes a chart file plus an audio file.
