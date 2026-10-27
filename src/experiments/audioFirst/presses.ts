import type { GameSession } from '../../game/session';

/**
 * Calls `fn` for every key press that the judge ignored (no cue in reach), once the session
 * step that carried it has finished. Returns an unsubscribe function.
 */
export function onStrayPress(
  session: GameSession,
  fn: (lane: number, time: number) => void,
): () => void {
  let pending: { lane: number; time: number; judged: boolean } | null = null;
  const offInput = session.bus.on('input', (i) => {
    if (!i.down) return;
    const press = { lane: i.lane, time: i.time, judged: false };
    pending = press;
    queueMicrotask(() => {
      if (!press.judged) fn(press.lane, press.time);
    });
  });
  const offJudge = session.bus.on('judgement', (j) => {
    if (pending && pending.lane === j.lane && j.kind !== 'holdEnd') pending.judged = true;
  });
  return () => {
    offInput();
    offJudge();
  };
}
