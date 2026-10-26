# VOXEL//RHYTHM

A split-screen browser rhythm game. On the **right** is an osu!mania-style lane highway where each
lane is a song element (kick, perc, bass, synth). On the **left**, a low-poly chibi swordfighter
holds off a rushdown of voxel enemies. Every note is an enemy: hit it on time and the sword cuts it
down, miss it and it gets through. Your sword is powered by a **wavetable synth**, and its settings
change how your attacks look and behave.

Prototype stage. Matrix green-on-black styling, procedural hyperpop demo song, no copyrighted audio.

## Run

```bash
npm install
npm run dev          # http://127.0.0.1:5173  (map editor: /editor.html)
```

Other scripts:

```bash
npm test             # Vitest: timing, judgement, chart validation, combat pipeline
npm run typecheck
npm run lint
npm run build        # production build into dist/
npm run validate-chart -- public/maps/demo/chart.json
npm run gen:demo     # regenerate the demo charts from the song composition
```

URL flags (handy for demos and tests): `?map=demo&autostart=1` starts the demo straight away,
`&diff=easy` picks the easy chart, and `&autoplay=1` lets a bot play through the real judge.
`?map=editor` plays the chart handed off from the editor.

## Controls

| Key               | Action                                                                           |
| ----------------- | -------------------------------------------------------------------------------- |
| `D` `F` `J` `K`   | lanes 1-4 (kick / perc / bass / synth). Hold for long notes. Rebind in Settings. |
| click/touch lanes | also works                                                                       |
| `Esc`             | pause / resume                                                                   |
| `Tab`             | expand / collapse the sword synth panel                                          |
| `R`               | retry from the results screen                                                    |

Before playing seriously, run **Calibrate offset** from the menu (tap Space to a metronome). The results
screen also suggests an offset from your average hit timing.

## How it fits together

```
keyboard / touch / autoplay
        │  LaneInput {lane, down, time}   ← time converted from event.timeStamp via the audio clock
        ▼
   Judge (rhythm/judge.ts)        pure; windows in config/gameplay.ts
        │  JudgementEvent {noteId, lane, kind: tap|holdStart|holdEnd, judgement, offset}
        ▼
   directJudgement (combat/director.ts) + AttackModifiers (synth/modifiers.ts ← synth/patch.ts)
        │  AttackAction {attack: slam|flick|sweep|thrust|finisher, grind, crit, mods}  or letThrough
        ▼
   CombatSim (combat/sim.ts)      one enemy per note, HP, echo-parry charges
        │  CombatEvent {kill | grindStart | playerHit | parry | playerDown}
        ▼
   GameSession.bus  →  HighwayView (Canvas2D) · CombatView (Three.js) · HUD · Sfx
```

- **Audio clock** (`audio/songPlayer.ts`, `core/clockSync.ts`). Song time is the audio-file position
  the player is _hearing_: AudioContext time (via `getOutputTimestamp`, falling back to
  `currentTime - outputLatency`), smoothed against `performance.now()`, minus the user's audio offset.
  Inputs are timestamped from `KeyboardEvent.timeStamp`, so judgement precision doesn't depend on
  frame rate. Charts, the judge, and the visuals all use this one time domain.
- **GameSession** (`game/session.ts`) owns the whole pipeline with no DOM and no clock. It takes inputs
  plus a time, which is why the pipeline is unit-tested end to end (including an autoplay clear of the
  demo chart).
- **Rendering is reactive.** The views read session state and subscribe to bus events. They never
  change game state.
- **Tuning is data.** `src/config/gameplay.ts` holds judgement windows, scoring, HP, and field
  geometry. `src/config/combat.ts` maps lanes to attacks and enemies. `src/config/visuals.ts` holds the
  palette, camera, trails, and render scaling.
- **The demo song** (`audio/demo/composition.ts`) is pure data. The same event list renders the audio
  (`audio/demo/render.ts`, an OfflineAudioContext that renders each unique voice once and then mixes)
  and generates the charts (`chart/demoChart.ts`), so the two never drift apart. A test checks that
  the committed chart JSON matches.

```
src/
  audio/        SongPlayer (clock), Sfx, demo/ composition + renderer
  chart/        types, tempo map, validation, runtime build, demo chart generator
  combat/       director (judgement → action), sim (enemies, HP, parry)
  config/       gameplay / combat / visuals tuning
  core/         event bus, clock sync, settings
  game/         session (pipeline), runner (frame loop), maps (loading + editor handoff)
  render/       highway, combat view, character builder, rain, floating text
  rhythm/       judge, score, input (keyboard + autoplay)
  synth/        patch (data model), modifiers (patch → attack modifiers)
  ui/           synth panel
  editor/       map editor page
schema/         chart.schema.json
docs/           map-format.md
public/maps/    demo map + index.json
tests/          vitest
```

## Maps

See [docs/map-format.md](docs/map-format.md). In short: human-readable JSON with times in beats, a BPM,
and an offset, plus one note per line (`{"beat": 4.5, "lane": "kick"}`, with `"length"` for holds).
Load your own from the menu (CUSTOM MAP: chart + audio file), or build one in the editor at
`/editor.html`. The editor lets you click to place notes, drag to make holds, play from the cursor, edit
or paste the JSON with live validation, and playtest in the game.

## Synth → sword

| Synth param | Effect (live in this build)                                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| WT POS      | morphs the swing arc: sine (smooth) → triangle (linear) → saw (snappy, wide) → square (stepped, glitchy trail). Also shifts the trail color. |
| UNISON      | adds echo slashes (ghost swords) and builds ECHO PARRY charges. Each full charge cancels one enemy that gets through.                        |
| DETUNE      | spreads the echo slashes in angle and time, and boosts parry charge gain                                                                     |
| CUTOFF      | blade reach and glow                                                                                                                         |
| RES         | crit bonus on PERFECT hits (score)                                                                                                           |
| LFO / ENV   | data model only, not wired up yet                                                                                                            |

Presets are on the panel. The patch persists in localStorage.

## Stack notes

Vite + TypeScript (strict, `noUncheckedIndexedAccess`) + Three.js + Web Audio, Vitest, ESLint and
Prettier. The highway is a 2D canvas rather than WebGL because it's crisp text and rects and easy to
read and tweak. The 3D view adapts its render resolution to hold frame rate, which matters on machines
with software WebGL.
