import { FX_AMOUNT, FX_FOR_ACTION, type FxKind } from '../../config/productionFx';
import type { GameSession } from '../../game/session';
import type { Judgement } from '../../rhythm/judge';
import { liftTarget } from './plan';

export type FxCommand =
  | {
      type: 'start';
      fx: FxKind;
      /** Game time the effect locks to: the cue's beat for a hit, the judgement for a miss. */
      anchor: number;
      /** Game time of the press (or of the miss timing out). */
      at: number;
      /** Seconds per beat in the cue's measure. */
      beat: number;
      judgement: Judgement;
      amount: number;
      /** A miss: play the effect fumbled. */
      fumble: boolean;
      /** A hit hold head: sustain until the matching release. */
      sustain: boolean;
      /** Bar line a lift rises into (game time); null for other effects. */
      target: number | null;
    }
  | { type: 'release'; fx: FxKind; at: number; beat: number; fumble: boolean };

/**
 * Turns judged moves into production-effect commands. Pure: it only reads the session, so
 * the mapping (what effect, how deep, locked to which beat) is unit-tested without audio.
 */
export function directFx(session: GameSession, out: (c: FxCommand) => void): () => void {
  const { conductor, chart } = session;
  return session.bus.on('action', (a) => {
    const cue = conductor.cues[a.noteId];
    const play = cue ? conductor.plays[cue.play] : undefined;
    if (!cue || !play) return;
    const fx = FX_FOR_ACTION[a.action];
    const beat = play.dur / chart.beatsPerBar;
    if (a.kind === 'holdEnd') {
      out({ type: 'release', fx, at: a.time, beat, fumble: !a.hit });
      return;
    }
    const anchor = a.hit ? cue.time : a.time;
    out({
      type: 'start',
      fx,
      anchor,
      at: a.time,
      beat,
      judgement: a.judgement,
      amount: FX_AMOUNT[a.judgement],
      fumble: !a.hit,
      sustain: a.hold,
      target: fx === 'lift' ? liftTarget(anchor, play.start, play.dur, beat) : null,
    });
  });
}
