import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DIRECTIONS,
  LANE_DIRECTION,
  PARRY_ALT_KEYS,
  PARRY_KEYS,
  Posture,
  strikePhase,
  strikeTiming,
  warnProgress,
  type StrikeCue,
} from '../src/experiments/parry/logic';
import { KeyboardLanes } from '../src/rhythm/input';

const strike = (id: number, time: number, lane = 0): StrikeCue => ({ id, lane, time });

describe('parry directions', () => {
  it('A S D F and the arrows read left, low, high, right', () => {
    const dirOf = (code: string) => {
      const lane = Math.max(PARRY_KEYS.indexOf(code), PARRY_ALT_KEYS.indexOf(code));
      return LANE_DIRECTION[lane];
    };
    expect(['KeyA', 'KeyS', 'KeyD', 'KeyF'].map(dirOf)).toEqual(['left', 'low', 'high', 'right']);
    expect(['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight'].map(dirOf)).toEqual([
      'left',
      'low',
      'high',
      'right',
    ]);
  });

  it('clangs pan with the side and pitch rises from low to high', () => {
    expect(DIRECTIONS.left.pan).toBeLessThan(0);
    expect(DIRECTIONS.right.pan).toBeGreaterThan(0);
    expect(DIRECTIONS.low.pitch).toBeLessThan(DIRECTIONS.high.pitch);
  });
});

describe('strike timing', () => {
  const o = strikeTiming(120);

  it('the warning arc closes exactly on the beat', () => {
    expect(warnProgress(4, 4 - o.warn, o.warn)).toBe(0);
    expect(warnProgress(4, 4 - o.warn / 2, o.warn)).toBeCloseTo(0.5);
    expect(warnProgress(4, 4, o.warn)).toBe(1);
    expect(warnProgress(4, 2, o.warn)).toBe(0);
  });

  it('winds up for a beat, then swings to contact on the beat', () => {
    const cues = [strike(1, 4)];
    expect(strikePhase(cues, 4 - o.swing - o.windup - 0.01, o).windup).toBe(0);
    const cocked = strikePhase(cues, 4 - o.swing, o);
    expect(cocked.windup).toBeCloseTo(1);
    expect(cocked.swing).toBe(0);
    expect(strikePhase(cues, 4 - 1e-6, o).swing).toBeCloseTo(1, 4);
    const after = strikePhase(cues, 4.1, o);
    expect(after.next).toBeNull();
    expect(after.last?.id).toBe(1);
    expect(after.lastAge).toBeCloseTo(0.1);
  });

  it('compresses the wind-up between close strikes but still contacts on the beat', () => {
    const cues = [strike(1, 4), strike(2, 4.25)];
    const p = strikePhase(cues, 4 + o.recover, o);
    expect(p.next?.id).toBe(2);
    expect(p.windup).toBe(0);
    expect(strikePhase(cues, 4.25 - o.swing, o).windup).toBeCloseTo(1);
    expect(strikePhase(cues, 4.25 - 1e-6, o).swing).toBeCloseTo(1, 4);
  });
});

describe('posture', () => {
  it('fills with good deflects and drops on a miss', () => {
    const p = new Posture(6);
    expect(p.capacity).toBeCloseTo(4);
    expect(p.apply('perfect')).toBe(false);
    expect(p.apply('miss')).toBe(false);
    expect(p.value).toBeCloseTo(0.25);
    p.apply('perfect');
    p.apply('perfect');
    expect(p.apply('great')).toBe(false);
    expect(p.apply('good')).toBe(false);
    expect(p.apply('great')).toBe(true);
    expect(p.full).toBe(true);
    expect(p.ratio).toBe(1);
    expect(p.apply('perfect')).toBe(false);
  });

  it('a one-strike enemy still has a meter', () => {
    const p = new Posture(1);
    expect(p.capacity).toBe(1);
    expect(p.apply('perfect')).toBe(true);
  });
});

describe('keyboard alt keys', () => {
  afterEach(() => vi.unstubAllGlobals());

  const press = (target: EventTarget, code: string, type = 'keydown') =>
    target.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), { code }));

  it('a second key per lane works like the first', () => {
    const win = new EventTarget();
    vi.stubGlobal('window', win);
    const kb = new KeyboardLanes((ms) => ms / 1000);
    kb.setKeys([...PARRY_KEYS], [...PARRY_ALT_KEYS]);
    press(win, 'ArrowUp');
    press(win, 'ArrowUp', 'keyup');
    press(win, 'KeyD');
    press(win, 'KeyQ');
    expect(kb.drain().map((i) => [i.lane, i.down])).toEqual([
      [3, true],
      [3, false],
      [3, true],
    ]);
    kb.setKeys([]);
    press(win, 'ArrowUp', 'keyup');
    press(win, 'ArrowLeft');
    expect(kb.drain()).toEqual([]);
    kb.dispose();
  });
});
