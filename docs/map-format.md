# Map format (chart v2: action lanes)

A **map** is an audio file plus a **chart**: a plain JSON file of sword actions in time.
This page is written so a person or an LLM can chart a song from scratch.

- Schema: [`schema/chart.schema.json`](../schema/chart.schema.json)
- Validate: `npm run validate-chart -- path/to/chart.json`. The in-game loader and the editor
  (`/editor.html`) use the same validator and show the same errors.
- Examples: [`public/maps/demo/chart-easy.json`](../public/maps/demo/chart-easy.json) and
  [`public/maps/demo/chart.json`](../public/maps/demo/chart.json)

## The four actions

Every chart has the same four lanes, left to right. Each lane is a sword move and a key.
A cue in a lane means the enemy on stage is doing something that asks for that move.

| Action     | The enemy...                              | If you miss it                                   |
| ---------- | ----------------------------------------- | ------------------------------------------------ |
| `block`    | winds up an attack that lands on the beat | the attack hits you (HP loss)                    |
| `slash`    | opens its guard                           | it recovers its guard (no damage)                |
| `stab`     | shows a glowing weak point                | the weak point closes (no damage)                |
| `flourish` | staggers, offering a finisher             | it recovers (or escapes, if it was the last cue) |

One enemy is on stage at a time. Hit the **last cue of an encounter** and the enemy is
defeated; miss it and the enemy escapes. Either way the next enemy walks in when its
encounter starts. End each encounter on a `flourish`: that's the finisher.

## Minimal example

```json
{
  "format": "voxel-rhythm-chart",
  "version": 2,
  "meta": { "title": "My Song", "artist": "Someone", "charter": "me", "difficulty": "easy" },
  "audio": { "file": "song.mp3" },
  "timing": { "bpm": 120, "offsetMs": 230, "beatsPerBar": 4 },
  "encounters": [
    { "beat": 0, "enemy": "grunt" },
    { "beat": 17, "enemy": "brute", "name": "BIG ONE" }
  ],
  "prompts": [{ "beat": 0, "action": "block", "text": "When it winds up, BLOCK on the kick" }],
  "notes": [
    { "beat": 4, "action": "block" },
    { "beat": 8, "action": "block" },
    { "beat": 10, "action": "slash" },
    { "beat": 12, "action": "stab" },
    { "beat": 16, "action": "flourish" },
    { "beat": 20, "action": "block", "length": 2 },
    { "beat": 24, "action": "flourish" }
  ]
}
```

## Fields

| Field                | Required | Meaning                                                                                     |
| -------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `format`             | yes      | Always `"voxel-rhythm-chart"`.                                                              |
| `version`            | yes      | Always `2`.                                                                                 |
| `meta.title`         | yes      | Song title. `artist`, `charter`, `difficulty`, `description` are optional strings.          |
| `audio.file`         | one of   | Audio path relative to the chart file (mp3, ogg, wav: anything the browser decodes).        |
| `audio.procedural`   | one of   | A built-in generated song instead of a file. Currently only `"hyperpop-demo"`.              |
| `audio.lengthBeats`  | no       | Song length in beats. Used only for a warning if notes run past it.                         |
| `timing.bpm`         | yes      | Tempo, 20 to 400.                                                                           |
| `timing.offsetMs`    | yes      | Milliseconds into the audio where **beat 0** falls (the first downbeat you chart against).  |
| `timing.beatsPerBar` | no       | Default 4. Only affects bar lines.                                                          |
| `timing.bpmChanges`  | no       | `[{ "beat": 64, "bpm": 170 }]`. Each change applies from that beat on. Beats must increase. |
| `encounters`         | no       | The enemies, in order (see below). Omit to start a new enemy right after every `flourish`.  |
| `prompts`            | no       | On-screen tutorial text (see below).                                                        |
| `notes`              | yes      | The cues. Order doesn't matter (they get sorted, with a warning).                           |

There is no `lanes` field any more: the lanes are always `block, slash, stab, flourish`.

### Notes

```json
{ "beat": 12.5, "action": "stab" }
{ "beat": 16, "action": "block", "length": 2 }
```

- `beat`: position in beats from beat 0. Use decimals for subdivisions:
  `0.5` = eighth note, `0.25` = sixteenth, `0.333`/`0.667` = triplets.
- `action`: one of `block`, `slash`, `stab`, `flourish`.
- `length` (optional): makes a **hold**, in beats. Press at `beat`, hold until `beat + length`.
  A held `block` is a blade lock: the enemy presses on your guard, and letting go early means
  you get hit. Use holds sparingly, on sustained sounds.

**One action at a time.** Two cues can't share a beat, and nothing can start during a hold.

### Encounters

```json
{ "beat": 65, "enemy": "duelist", "name": "DUELIST" }
```

- `beat`: when this enemy starts walking in. It duels until the next encounter's `beat`.
  Notes belong to the encounter they fall in.
- `enemy` (optional): `grunt`, `duelist`, `brute` or `knight`. Looks only, except a brute hits
  harder when you miss a block. Defaults cycle through the list.
- `name` (optional): shown in the banner at the top.

The walk-in takes one beat, so leave at least 1 beat between an encounter's `beat` and its
first cue. A good pattern: put the `flourish` on a downbeat (the crash), start the next
encounter 1 beat later, and give the new enemy its first cue 1 to 2 beats after that.

### Prompts

```json
{ "beat": 18, "action": "slash", "text": "When it opens its guard, SLASH on the clap", "beats": 10 }
```

Text shown at the top of the screen from `beat` for `beats` beats (default 8). With
`action`, the prompt shows that action's icon, colour and the player's key.

## How beats become time

```
seconds = offsetMs / 1000 + beat * 60 / bpm
```

With `bpmChanges` the formula applies piecewise. Notes can't sit before beat 0, so put beat 0 at or
before the first note you chart.

## Charting a song (checklist for LLMs)

1. Find the **BPM** and the time of the first strong downbeat. That time in ms is `offsetMs`, and
   it is beat 0.
2. Tie each action to one element of the music, so the player hears what to press:
   - `block` → kick drum (the enemy's heavy attacks land on the kick)
   - `slash` → snare or clap (the backbeat)
   - `stab` → a sharp percussion sound: rim, tick, hi-hat accent, pluck
   - `flourish` → the crash or impact at the end of a phrase
3. Split the song into **encounters** of 4 to 8 bars, usually one per musical phrase. Each
   ends on a `flourish` on the phrase's last downbeat.
4. **Start gently and ramp.** This matters more than anything else:
   - First 8 to 16 bars: one or two actions only, one cue per bar or every 2 beats.
   - Introduce one new action at a time, with a `prompt` 4 to 8 beats before its first cue.
   - Mix actions only after all four are introduced; then add density in the drops.
   - Easy: no two cues closer than 1 beat, no holds. Normal: eighth notes are fine in the
     loud sections; avoid sixteenths.
5. Validate with `npm run validate-chart -- chart.json`, fix every error by its path
   (e.g. `notes[12].action: "kick" (string) is not one of [block, slash, stab, flourish]`), then
   playtest. Use the editor to nudge `offsetMs` if every cue feels uniformly early or late.

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

## Changes from version 1

Version 1 charts had free-form `lanes` named after song elements (`kick`, `perc`, ...) and notes
with `"lane"`. Version 2 replaces them with the four fixed actions: rename `"lane"` to
`"action"`, map each old lane to an action (for example kick → block, perc → slash,
synth → stab), make sure no two notes share a beat, and add a `flourish` at the end of each
phrase. The validator explains each of these if it sees a v1 chart.
