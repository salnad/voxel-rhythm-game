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
     `arena` (`enemyRig()`, `heroRig`, `toScreen()`, `highway`, `onBeforeRender()`,
     `playMove()`), the `session` (bus events: `input`, `judgement`, `action`, `duel`, `combo`,
     `cues`, `measure`), the `chart`, the music `engine`, the `audio` context, `sfx` and the
     background `rain` (`pulse(amount)`). Return any of:
     - `mapInput(input, t)`: remap or swallow keyboard/pointer inputs before the judge,
     - `pollInputs(t)`: inputs the runtime adds this frame (presses it held back and now releases,
       scripted moves); they reach the judge as-is, sorted in with the keyboard's,
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
     - `arena.setEnemyPoseFilter((pose, encounter) => pose)`: rewrite the front enemy's final pose
       input each frame, after the telegraph (e.g. play poses for notes that aren't chart cues,
       or hide the wind-ups); `null` clears it.
2. Add it to `EXPERIMENTS` in `src/experiments/registry.ts`.
3. `tests/experiments.test.ts` checks every registered experiment automatically (metadata, chart
   validity and length, an autoplay pass). Add unit tests for any pure logic you write.

Hero timing hooks (both optional):

- `LaneInput.moveAt`: song time the hero's move should connect. The judge still grades `time`;
  the arena starts the swing so its contact frame lands on `moveAt` (on-beat holds an early press
  and releases it with `moveAt` = the cue time).
- `arena.playMove(action, contactAt, hit)`: play a hero move outside the judge, for experiments
  that swallow inputs and resolve them themselves (freestyle's free attacks). It connects at
  `contactAt` (input timebase); `hit` adds the impact pose, `false` plays it as a whiff.

`src/experiments/juice/` is a small shared kit: `Juice` (voxel sparks, rings, camera punch and
shake, enemy flinch, hero squash/stretch, screen flashes, world-anchored text pops), `BeatWorld`
(grid, hero beat ring, enemy bob, rain, camera and screen frame pulsing on the beat, with
`intensity` and `color`), `JuiceSounds` (synth draw/impact/drum/whiff/tier sounds into `sfx`)
and beat-phase helpers.

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

## Optional audio hooks

Opt-in hooks for experiments that build their own sound; the normal game never uses them.

- `options.musicMapping: NO_MUSIC_LAYER` (`'none'`, `src/experiments/types.ts`): run without any
  mix-wide music layer, for experiments that drive the music themselves (keysound,
  call-and-response). The settings panel shows it as EXPERIMENT AUDIO.
- `CompEvent.cueBeat` (`src/audio/demo/composition.ts`): `composeSong` tags every note a charted
  cue sounds (808, cue lead notes, snares, roll hats, vocal chops and the crash) with the cue's
  beat. `withoutCues()` / `cueGroups()` (`src/audio/demo/keysounds.ts`) split a song into the
  backing stems and one note group per cue.
- `renderOneShots(groups, bpm)` (`src/audio/demo/render.ts`): render note groups to one-shot
  buffers through the same instruments and bus effects as `renderSongStems`, whose output is
  unchanged.

## Experiments

- `on-beat` (ON-BEAT ASSIST, Hi-Fi Rush): perfect/great/good widen to ±60/110/160 ms. An early
  press that will hit is held (the hero coils, an impact is pre-scheduled on the beat) and
  released at the cue time via `pollInputs` + `moveAt`, so the hit sound, contact frame, sparks,
  enemy reaction and camera punch all land on the beat; a late press resolves at once. Grid, rain,
  enemy, a ring around the hero, the screen frame and a beat meter on the hit line pulse with the
  beat. Same four lanes and keys.
- `two-button` (TWO BUTTONS, Taiko / Rhythm Heaven): one central lane of drums, blue = DEFEND
  (D or F), red = ATTACK (J or K). `mapInput` sends DEFEND to the block lane and ATTACK to the
  lane of the nearest pending offensive cue, so the hero picks slash, stab or the finisher.
  Wrong-button presses pop a hint.
- `freestyle` (FREESTYLE ON THE BEAT, Metal: Hellsinger / NecroDancer): the chart
  (`freestyle/chart.ts`) keeps only LAB.EXE's blocks plus a finisher per enemy (six enemies).
  A blocks through the normal judge and duel; S D F are swallowed in `mapInput` and judged against
  the eighth-note grid (±35 perfect, ±75 good). Hits climb FURY x1/x2/x4/x8/x16 (an off-beat
  swing drops one tier, a missed block two, four idle beats one), deal damage (gently scaled by
  fury, half on the "and"), and play a note in key (S lead, D hats, F vocal chop). Song parts
  layer in with fury on the next beat: 808 + perc, then lead, chops, backing. At 0 HP the enemy
  is BROKEN; its charted finisher then connects (pressing an attack on it, or automatically on
  the beat). An enemy not broken by its finisher escapes. Deviation from "finish on the next
  downbeat": walk-ins stay at the charted phrase boundaries so the duel sim and music stay in
  sync; overkill hits after the break score at the full multiplier. Autoplay runs an internal bot
  that attacks on a fixed eighth pattern clear of the cues.
