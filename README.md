# VOXEL//RHYTHM

A browser rhythm duel. A low-poly chibi swordfighter faces **one enemy at a time**, and the
four lanes are four sword moves: **BLOCK, SLASH, STAB, FLOURISH**. The enemy telegraphs on
the beat (it winds up an attack, opens its guard, shows a weak point, staggers), and each
telegraph has a matching cue on the action highway. Press the move as the cue reaches the
hit line and the hero does it immediately. Your sword is powered by a **wavetable synth**,
and its settings change how your moves look and behave.

Everything happens in one 3D view seen from behind the hero: the four lanes are a
translucent highway on the arena floor that runs from the distance, through the enemy, to a
hit line just in front of the hero. Cue, telegraph and sword sit in the same small part of
the screen, so your eyes never leave the fight.

Boss phrases are **measure-based combos**: miss once inside a combo measure and you take damage,
the music glitches out for the rest of the measure, and the same measure repeats so you can try
again. The song's timeline is adaptive: the music is scheduled measure by measure.

Prototype stage. Matrix green-on-black styling, procedural digicore demo song (distorted 808s,
glitchy hat rolls, pluck lead, formant vocal chops, bitcrush), no copyrighted audio.

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

URL flags (handy for demos and tests): `?map=demo&autostart=1` starts the demo straight away
(easy chart; `&diff=normal` for normal), and `&autoplay=1` lets a bot play through the real judge.
`?map=editor` plays the chart handed off from the editor. `?mapping=<key>` picks an action →
music mapping from `MUSIC_MAPPINGS` for that page load without changing the saved choice (the
main menu's ACTIONS → MUSIC selector saves it).

## Gameplay experiments and the Playtest Lab

The main menu lists **gameplay experiments**: alternative mechanics and presentations (no lanes,
cues on the enemy, audio-only cues, on-beat assist and more), each a switchable mode on the same
pipeline, playing the same short test song (`LAB.EXE`, 140 BPM, about a minute). Open one with
`?exp=<key>`. The **PLAYTEST LAB** (`?lab=1`) runs every experiment once (baseline first, the rest
shuffled), each after a 10-second how-to, and asks for four 1-5 ratings plus a note; COPY RESULTS
exports compact JSON. See [docs/experiments.md](docs/experiments.md) for how to add one.

## Playtest hub

Every version is playable in the browser at **https://salnad.github.io/voxel-rhythm-game/**:
`main/`, one `pr-<n>/` per open pull request (with its number, title and link), and the most
recently merged PRs. Each entry shows its commit, build time and a link per music mapping.

`.github/workflows/playtest-hub.yml` rebuilds `main` on every push to main and a PR's build on
every push to its branch, using Vite's `base` so each version lives under its own path. When a PR
merges, its build moves to "recently merged" (newest 8 kept). When a PR closes without merging,
its build is deleted. The builds live on the `gh-pages` branch, kept as a single commit;
`scripts/hub/site.ts` plans the builds and writes the index. Run the workflow by hand
(Actions → Playtest hub → Run workflow) to rebuild everything.

One-time setup: Settings → Pages → Build and deployment → Source "Deploy from a branch",
branch `gh-pages`, folder `/ (root)`.

## Controls

| Key             | Action                                                                    |
| --------------- | ------------------------------------------------------------------------- |
| `A` `S` `D` `F` | BLOCK / SLASH / STAB / FLOURISH. Hold for long cues (blade locks).        |
| presets         | `F G H J`, arrows `← ↓ ↑ →`, or `D F J K` in Settings; or rebind each key |
| click/touch     | the lane nearest the pointer                                              |
| `Esc`           | pause / resume                                                            |
| `Tab`           | expand / collapse the sword synth panel                                   |
| `R`             | retry from the results screen                                             |

Every key press plays its move on the hero, cue or not. A press that lands on a cue connects
(sparks, damage, the enemy reacts). Misses have the matching consequence: a missed block means
the enemy's attack hits you, a missed slash or stab lets the enemy recover its guard, and
missing an enemy's last cue lets it escape. Inside a boss combo (gold rails on the highway) any
miss costs HP, voids the rest of the measure, makes the music wonky until the bar line, and the
measure repeats (up to 2 retries; the rails turn red and read RETRY 1/2).

Before playing seriously, run **Calibrate offset** from the menu (tap Space to a metronome). The results
screen also suggests an offset from your average hit timing.

## How it fits together

```
   Conductor (game/conductor.ts)  pure; plans measure plays ahead, re-plans a failed combo as a retry
        │  Cue {chart note × measure play, game times}
        ▼
keyboard / touch / autoplay
        │  LaneInput {lane, down, time}   ← time converted from event.timeStamp via the audio clock
        ▼
   Judge (rhythm/judge.ts)        pure; cues are added as measures are planned, voided on a failed combo
        │  JudgementEvent {noteId, lane, kind: tap|holdStart|holdEnd, judgement, offset}
        ▼
   resolveJudgement (combat/director.ts) + AttackModifiers (synth/modifiers.ts ← synth/patch.ts)
        │  DuelAction {action: block|slash|stab|flourish, hit, hold, final, crit, mods}
        ▼
   DuelSim (combat/duel.ts)       one enemy per encounter, HP, guard pips, echo-parry charges
        │  DuelEvent {enemyEnter | blocked | struck | released | playerHit | parry | recovered | defeated | escaped}
        ▼
   GameSession.bus  →  ArenaView (Three.js: hero, enemy, 3D highway) · HudOverlay (2D) · DOM HUD
                    →  MusicEngine (stems, measure scheduler, wonky FX) · action-music layer (swappable)

   telegraphAt (combat/telegraph.ts): pure; which cue the enemy is winding up for, and how far along
```

- **Adaptive timeline** (`game/conductor.ts`). The chart is a list of measures. The conductor plans
  measure plays a few seconds ahead, assuming success, and instantiates each measure's notes as cues
  with game times. When a combo measure fails, everything planned after it is dropped and the same
  measure is planned again (retry cap per combo, default 2). Game time equals chart time until the
  first retry. Combo measures keep their last beat empty, so the decision is always made before
  the music has to be committed (150 ms lookahead).
- **Music engine** (`audio/musicEngine.ts`). Plays the map as stems (the demo renders 808, lead, perc,
  vocal and backing stems; audio-file maps are one "mix" stem), each through its own gain node.
  Stems play continuously while measures follow each other, and crossfade-jump to a measure's offset
  when it repeats. A failed combo triggers the wonky FX (bitcrush, pitch wobble, stutter gate,
  tape-stop) until the bar line; the next measure always resyncs. Music and sound effects share one
  master limiter with a soft clip (`audio/master.ts`, gain staging in `config/mix.ts`), so the sum
  never clips.
- **Action → music layer** (`audio/musicLayers.ts`, registry in `config/musicMapping.ts`). How moves
  interact with the song is a swappable layer that listens to session events and drives the engine's
  part gains, its music bus or its own sounds. Settings → "actions → music" picks one:
  - **INSTRUMENTS** (default, `audio/instrumentLayer.ts`, data in `config/instrumentMapping.ts`):
    each move plays a part. BLOCK = 808, SLASH = lead, STAB = hats/perc, FLOURISH = vocal chops.
    A hit plays an accent in that part's voice; a miss stutters the part, then mutes it (808, perc)
    or glitches it (lead, vocals: chopped, low-passed, crushed) until that action's next cue. The
    lead is synthesized live by your wavetable patch, so synth settings change how SLASH sounds.
  - **SWORD SFX**: moves make sword sounds and the song plays as written.
  - **B · PRODUCER FX** (`?mapping=fx`, `audio/fx/`, tuning in `config/productionFx.ts`): each move is a mix-wide
    effect, locked to the cue's beat. BLOCK pumps the mix like a sidechain (-20 dB, recovering across
    the beat), SLASH slams a resonant low-pass shut and sweeps it open over 1.5 beats, STAB
    beat-repeats the 1/16 after the cue as a roll that accelerates into the next beat, FLOURISH
    pitch-rises the whole mix up to an octave (plus a noise riser and a high-pass) and drops out for a
    1/16 just before the bar line. The slam comes with the key press even though the audio is heard
    late; the release stays on the grid. A miss plays the effect fumbled: a mushy double duck, a
    jammed honking filter, off-grid decaying repeats, a riser that stalls. You see it too
    (`render/fxFeedback.ts`, drawn from the same envelopes the audio follows): the arena and highway
    pump and dim with the duck, blur and close behind an iris with the filter, repeat the frame on
    every stutter slice, and lift and glow gold with the riser, flashing on the snap. The FX RACK
    (bottom right) shows each effect's key, its live value and the grade of the move that fired it.
    `node scripts/fx-audit/run.mjs` (with `npm run dev` and Chrome on port 9222) renders the demo
    offline and measures how long and how deep each effect changes the music against the dry song.
- **Audio clock** (`audio/musicEngine.ts`, `core/clockSync.ts`). Game time is the timeline position
  the player is _hearing_: AudioContext time (via `getOutputTimestamp`, falling back to
  `currentTime - outputLatency`), smoothed against `performance.now()`, minus the user's audio offset.
  Inputs are timestamped from `KeyboardEvent.timeStamp`, so judgement precision doesn't depend on
  frame rate. Charts, the judge, and the visuals all use this one time domain.
- **GameSession** (`game/session.ts`) owns the whole pipeline with no DOM and no clock. It takes inputs
  plus a time, which is why the pipeline is unit-tested end to end (including an autoplay clear of
  both demo charts that defeats every enemy).
- **Telegraphs are logic, not art.** `telegraphAt` decides which cue the enemy is preparing and the
  wind-up progress (0 to 1, peaking exactly on the cue). It starts after the previous cue's outcome
  has played out, at most `DUEL.telegraphLead` early. The renderer only turns that into a pose.
- **Rendering is reactive.** The views read session state and subscribe to bus events. They never
  change game state. `render/heroAnimator.ts` plays a move on every key press;
  `render/enemy.ts` poses the enemy from the telegraph; `render/highway3d.ts` draws the lanes.
- **Hero animation is keyframe data** (`src/config/heroAnimation.ts`, sampled by `render/heroPose.ts`).
  Each move is a clip timed from its contact frame: t = 0 is the key press (stamped with the input's
  own time), so the strike lands exactly on input and the swing that led there is drawn as a smear.
  Keys before 0 are the anticipation, which the hero coils into while the next cue approaches on the
  highway; keys after 0 are follow-through and recovery. A connect adds a short hit-stop (the enemy
  freezes and shudders too). A new press interrupts the current move: the blade snaps to the new
  contact frame while the body blends. Slashes alternate forehand and backhand, and fast chains shrink
  the hit-stop and arcs so 16ths read as a flurry. The rig (`render/character.ts`) is a low-poly chibi
  with two-bone IK arms and legs, so poses are hand and blade targets rather than joint angles.
- **Tuning is data.** `src/config/gameplay.ts` holds judgement windows, scoring, HP and duel timing.
  `src/config/actions.ts` holds the action colours and labels and enemy types.
  `src/config/heroAnimation.ts` holds the hero's move clips, hit reaction and blend timings.
  `src/config/visuals.ts` holds the palette, arena layout, camera, trails, sword effect amounts
  (`SWORD_FX`), enemy hit reactions and render scaling.
- **The demo song** (`audio/demo/composition.ts`) is pure data, and its drums are the chart:
  every kick is a BLOCK, every clap a SLASH, every rim tick a STAB and every crash a FLOURISH in the
  normal chart, and the easy chart is a subset of those hits. The same event list renders the audio
  (`audio/demo/render.ts`) and generates the charts (`chart/demoChart.ts`). Tests check that the
  committed chart JSON matches, that easy is a subset of normal, and that the ramp holds.

```
src/
  audio/        MusicEngine (clock + adaptive scheduler), action-music layers, lead voice, Sfx,
                SongPlayer (editor/calibration), demo/ composition + stem renderer
  chart/        types, tempo map, validation, runtime build (encounters, prompts), demo chart generator
  combat/       director (judgement → duel action), duel (enemies, HP, consequences), telegraph
  config/       gameplay / actions / visuals tuning
  core/         event bus, clock sync, settings (key presets)
  game/         conductor (adaptive measure plan), session (pipeline), runner (frame loop), maps
  render/       arena view, 3D highway, hero animator, enemy rig, HUD overlay, effects, icons, rain
  rhythm/       judge, score, input (keyboard + autoplay)
  synth/        patch (data model), modifiers (patch → move modifiers)
  ui/           synth panel
  editor/       map editor page
schema/         chart.schema.json
docs/           map-format.md
public/maps/    demo map + index.json
tests/          vitest
```

## The demo map's ramp

`DAEMON.EXE` (digicore, 155 BPM, about 104 s without retries) is arranged around the tutorial.
Each action is tied to a part: 808 = BLOCK, lead = SLASH, snare/hat rolls = STAB, vocal chops =
FLOURISH. Every cue is an onset in its part, and easy is a subset of normal:

| Bars  | Section | What you learn                                                                       |
| ----- | ------- | ------------------------------------------------------------------------------------ |
| 0-9   | intro   | BLOCK alone on the 808, one per bar; then BLOCK + SLASH (lead) every 2 beats         |
| 10-15 | verse   | STAB (snare) joins, half-time; light mixing                                          |
| 16    | build   | first FLOURISH on the crash finishes the training grunt                              |
| 16-23 | build   | two short duels mixing all four on quarter notes (normal adds a few eighths)         |
| 24-39 | drop 1  | four enemies, 4 bars each, each finished on the downbeat crash                       |
| 40-47 | break   | half-time; first BOSS COMBOS (bars 41-46) against a knight; normal adds a blade lock |
| 48-63 | drop 2  | densest section; the DAEMON fights in combos every measure (bars 57-63)              |

Easy never puts two cues closer than a beat. Normal peaks around 4 to 5 cues per second
(playtest 1's normal chart was about 8). `?failbars=41,57` with `&autoplay=1` makes the bot fumble
those combos once, to watch the retry loop.

## Maps

See [docs/map-format.md](docs/map-format.md). In short: human-readable JSON with times in beats, a BPM,
and an offset, plus one cue per line (`{"beat": 4.5, "action": "block"}`, with `"length"` for holds),
optional `encounters` (one enemy each) and optional tutorial `prompts`.
Load your own from the menu (CUSTOM MAP: chart + audio file), or build one in the editor at
`/editor.html`. The editor lets you click to place cues, drag to make holds, play from the cursor, edit
or paste the JSON with live validation, and playtest in the game.

## Synth → sword

| Synth param | Effect (live in this build)                                                                                                             |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| WT POS      | slightly widens or narrows SLASH and FLOURISH arcs and sets the follow-through snap (saw snappy, sine smooth) and trail jitter (square) |
| UNISON      | faint echo afterimages of the blade around each strike. Builds ECHO PARRY charges: one charge saves you from one missed block           |
| DETUNE      | spreads the echo afterimages in angle and time, and boosts parry charge gain                                                            |
| CUTOFF      | slight blade length, materia-slot glow, and STAB lunge distance                                                                         |
| RES         | crit score bonus on PERFECT slashes, stabs and flourishes                                                                               |
| (music)     | with the INSTRUMENTS mapping the same patch voices the song's lead and the SLASH accent                                                 |
| LFO / ENV   | data model only, not wired up yet                                                                                                       |

Presets are on the panel. The patch persists in localStorage. Every visual effect is scaled by
`SWORD_FX` in `src/config/visuals.ts`, so the sword stays readable; the blade itself only glows on a
connect.

## Stack notes

Vite + TypeScript (strict, `noUncheckedIndexedAccess`) + Three.js + Web Audio, Vitest, ESLint and
Prettier. The highway lives in the Three.js scene; cue tiles, receptors and the hit line draw on top
of the fighters (no depth test) so they're never hidden. Text (key labels, prompts, judgements) is a
2D canvas overlay positioned from the 3D camera. The 3D view adapts its render resolution to hold
frame rate, which matters on machines with software WebGL.
