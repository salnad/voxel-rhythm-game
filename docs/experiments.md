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
     the key boxes, `enemyIcon: false` hides the next-action icon, `judgementHud: false` hides the
     judgement text and combo counter beside the lanes (draw your own at the fight), `windows`
     widens or narrows the judgement windows, `musicMapping` forces a mapping, `approachSeconds`
     sets cue lead time, `keys` overrides the lane keys, `altKeys` adds a second key per lane (e.g.
     arrows), `keyLegend` labels them on the how-to card.
   - `chart()`: return a `ChartFile` (default: the Lab chart).
   - `create(ctx)`: build the per-run runtime. `ctx` has the Three.js `scene` and `camera`, the
     `arena` (`enemyRig()`, `heroRig`, `toScreen()`, `highway`, `onBeforeRender()`), the `session`
     (bus events: `input`, `judgement`, `action`, `duel`, `combo`, `cues`, `measure`), the
     `chart`, the music `engine`, the `audio` context and `sfx`. Return any of:
     - `mapInput(input, t)`: remap or swallow keyboard/pointer inputs before the judge,
     - `update(t, dt, approach)`: per frame, after the scene is posed and before it renders,
     - `drawHud(ctx2d, t, w, h)`: per frame, after the HUD,
     - `dispose()`: remove meshes, listeners and audio nodes.
       Optional `arena` hooks (set in `create`, reset in `dispose`; the defaults are the normal game):
     - `arena.view = { position, lookAt, fov? }`: camera placement override (`null` = `CAMERA`).
     - `arena.telegraph = (encounter, encounterStart, cues, t) => Telegraph`: replaces the enemy's
       wind-up timing (default `telegraphAt` with DUEL's lead); `next: null` keeps it in idle.
     - `arena.duelEffects = false`: turns off the built-in hit/miss juice (world labels, debris,
       rings, shake, hurt reaction) so the experiment can draw its own.
     - `arena.pressMove = (lane) => Action | null`: which hero move a key press plays (default: the
       lane's action; `null` plays none).
     - `arena.playHeroMove(action, t?)`: play a hero move now as if it connected (e.g. a riposte).
     - `arena.hitStop(seconds, at?)`: freeze the hero's and enemy's poses (impact hit-stop).
     - `arena.setHeroLean(yaw, pitch)`: turn / tilt the hero's whole body (0, 0 = rest).
     - `arena.hurtHero(t?)`: the hero's flinch and knockback (useful with `duelEffects = false`).
     - `arena.enemyRig(true)`: also return the rig while it's hidden (e.g. after defeat).
2. Add it to `EXPERIMENTS` in `src/experiments/registry.ts`.
3. `tests/experiments.test.ts` checks every registered experiment automatically (metadata, chart
   validity and length, an autoplay pass). Add unit tests for any pure logic you write.

Rules of thumb:

- Treat session state as read-only; react to bus events. Experiment-specific game rules go in the
  experiment module, not in core files. If you need a new core hook, keep it small, optional and
  documented here.
- No DOM, canvas or WebGL work at module top level (the hub lists experiments in Node).
- Dispose everything you add to the scene or audio graph.

## Enemy-anchored cue kit

`src/experiments/enemyCues/` holds what the lane-less presentations (`one-lane`, `one-lane-strip`,
`converge`, `approach-ring`) share, and any experiment can reuse it:

- `logic.ts` (pure, unit-tested in `tests/enemyCues.test.ts`): which cues to draw and in what stage
  (`stageCues`: incoming, holding, hit, miss, voided, with ages for burst/crack animations), ghost
  emphasis for the next cues, approach-ring / strip / converge-path timing maps, wrong-key
  detection (a press right on another lane's cue), kick and hit-stop envelopes.
- `stage.ts` (`EnemyCueStage`): bus wiring (outcomes, voided cues, key legend state), a swing sound
  on every key press, a camera shot override (`DUEL_CLOSEUP`, applied after the arena poses its
  camera, keeping its shake and FOV pulse), a camera punch and impact-frame flash on hits, world
  spots on the enemy (`weapon`, `slash`, `core`, `chest`, `feet`) projected to the screen,
  judgement pops and a combo counter at the fight.
- `draw.ts`: cue badges (one shape + colour + icon per action, key chip, wrong-key shake), the
  compact key legend that replaces the lane labels, impact lines and screen-space shards.

## Optional core hooks

Small hooks experiments added to shared code. All are opt-in; the normal game never uses them.

- `options.musicMapping: NO_MUSIC_LAYER` (`'none'`, `src/experiments/types.ts`): run without any
  mix-wide music layer, for experiments that drive the music themselves (keysound,
  call-and-response). The settings panel shows it as EXPERIMENT AUDIO.
- `arena.setEnemyPoseFilter(fn | null)` (`src/render/arenaView.ts`): rewrite the pose input of the
  front enemy each frame before `poseEnemy` (for example to play a pose the chart doesn't
  schedule, or to hide the wind-up). Clear it in `dispose()`.
- `CompEvent.cueBeat` (`src/audio/demo/composition.ts`): `composeSong` tags every note a charted
  cue sounds (808, cue lead notes, snares, roll hats, vocal chops and the crash) with the cue's
  beat. `withoutCues()` / `cueGroups()` (`src/audio/demo/keysounds.ts`) split a song into the
  backing stems and one note group per cue.
- `renderOneShots(groups, bpm)` (`src/audio/demo/render.ts`): render note groups to one-shot
  buffers through the same instruments and bus effects as `renderSongStems`, whose output is
  unchanged.
