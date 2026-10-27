# Gameplay experiments and the Playtest Lab

Each experiment is one hypothesis about what makes the duel fun, built as a switchable mode on top
of the normal pipeline (conductor → judge → duel → music engine → arena). They are playable:

- from the main menu (GAMEPLAY EXPERIMENTS),
- with `?exp=<key>` (a 10-second how-to card first; `&autostart=1` skips it, `&autoplay=1` lets the
  bot play),
- in the **Playtest Lab** (`?lab=1` or the PLAYTEST LAB button): every experiment once, baseline
  first, the rest in a fresh random order, each followed by four 1-5 ratings (fun, control,
  readability, music connection) and an optional note. Results save in localStorage and export as
  compact JSON (COPY RESULTS).
- on the playtest hub, where each version lists a chip per experiment plus the Lab.

## The shared test song

`LAB.EXE` (`src/audio/demo/labSong.ts`, 140 BPM, about 57 s) uses the demo's digicore instruments,
and `buildLabChart()` (`src/chart/labChart.ts`) charts its onsets: 808 = block, lead = slash,
snare/hats = stab, vocal chop + crash = flourish. Four enemies; boss combos on bars 18-21.
Experiments should play this chart (or a transform of it) so ratings compare mechanics, not songs.
A different chart is fine when the mechanic needs it (for example call-and-response needs gaps):
build it from a `SongSpec` with `composeSong`, register the song in `src/audio/songs.ts`, and keep
it 45-90 s.

## Adding an experiment

1. Write `src/experiments/<key>.ts` exporting an `Experiment` (`src/experiments/types.ts`):
   - `key` (permanent kebab-case), `label`, `tagline`, `hypothesis`, `inspiration`, and a 2-4 line
     `howTo` that teaches the mode in 10 seconds.
   - `options`: static switches. `highway: false` hides the floor lanes, `laneLabels: false` hides
     the key boxes, `enemyIcon: false` hides the next-action icon, `windows` widens or narrows the
     judgement windows, `musicMapping` forces a mapping, `approachSeconds` sets cue lead time,
     `keys` overrides the lane keys, `keyLegend` labels them on the how-to card.
   - `chart()`: return a `ChartFile` (default: the Lab chart).
   - `create(ctx)`: build the per-run runtime. `ctx` has the Three.js `scene` and `camera`, the
     `arena` (`enemyRig()`, `heroRig`, `toScreen()`, `highway`, `onBeforeRender()`), the `session`
     (bus events: `input`, `judgement`, `action`, `duel`, `combo`, `cues`, `measure`), the
     `chart`, the music `engine`, the `audio` context and `sfx`. Return any of:
     - `mapInput(input, t)`: remap or swallow keyboard/pointer inputs before the judge,
     - `update(t, dt, approach)`: per frame, after the scene is posed and before it renders,
     - `drawHud(ctx2d, t, w, h)`: per frame, after the HUD,
     - `dispose()`: remove meshes, listeners and audio nodes.
2. Add it to `EXPERIMENTS` in `src/experiments/registry.ts`.
3. `tests/experiments.test.ts` checks every registered experiment automatically (metadata, chart
   validity and length, an autoplay pass). Add unit tests for any pure logic you write.

Rules of thumb:

- Treat session state as read-only; react to bus events. Experiment-specific game rules go in the
  experiment module, not in core files. If you need a new core hook, keep it small, optional and
  documented here.
- No DOM, canvas or WebGL work at module top level (the hub lists experiments in Node).
- Dispose everything you add to the scene or audio graph.
