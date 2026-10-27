import type { Action } from '../../chart/types';
import type { OneShots } from '../melee/synth';

/**
 * The audible half of each tell, played on the tell's start (one beat before the hit).
 * Pitches sit in the Lab song's D major so they read as part of the groove.
 */
export function playTell(s: OneShots, action: Action, at: number): void {
  switch (action) {
    case 'block': {
      // metal scrape: a blade dragged out of its sheath, rising
      s.noiseBurst(at, 'bandpass', 1500, 6200, 0.32, 0.2, -0.2, 7, 0.025);
      s.noiseBurst(at, 'highpass', 5000, 9000, 0.06, 0.16, -0.2, 1, 0.03);
      s.tone(at, 'sawtooth', 1175, 1245, 0.022, 0.2, -0.2, 0.03);
      s.tone(at, 'square', 1865, 1975, 0.014, 0.18, -0.2, 0.03);
      break;
    }
    case 'slash': {
      // guard-open clack: hard plates knocking apart
      s.tone(at, 'square', 1050, 420, 0.13, 0.045, 0.15);
      s.tone(at, 'triangle', 620, 300, 0.2, 0.06, 0.15);
      s.noiseBurst(at, 'bandpass', 2600, 1600, 0.35, 0.03, 0.15, 2.5);
      break;
    }
    case 'stab': {
      // weak-point glint: a clean high ting
      s.tone(at, 'sine', 3520, 3515, 0.12, 0.38);
      s.tone(at, 'sine', 5274, 5270, 0.045, 0.2);
      s.tone(at, 'triangle', 7040, 7030, 0.015, 0.07);
      break;
    }
    case 'flourish': {
      // dizzy wobble chime: a woozy little falling figure
      const notes = [1760, 1480, 1319, 1480];
      notes.forEach((f, i) => {
        const o = s.tone(at + i * 0.055, 'triangle', f, f * 0.97, 0.075, 0.2);
        const lfo = s.ctx.createOscillator();
        lfo.frequency.value = 11;
        const depth = s.ctx.createGain();
        depth.gain.value = 60;
        lfo.connect(depth).connect(o.detune);
        lfo.start(at + i * 0.055);
        lfo.stop(at + i * 0.055 + 0.24);
      });
      break;
    }
  }
}
