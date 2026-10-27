import type { Experiment } from './types';

/** The current game on the Lab chart: the control every other experiment is rated against. */
export const baseline: Experiment = {
  key: 'baseline',
  label: 'BASELINE · 4 LANES',
  tagline: 'The current game: four lanes on the floor, cues scroll to a hit line.',
  hypothesis:
    'Control condition. The 4-lane floor highway with the INSTRUMENTS mapping is the reference every other experiment is rated against.',
  inspiration: ['Guitar Hero', 'Thumper'],
  howTo: [
    'Cues scroll down four lanes toward the line in front of you.',
    'Press the lane’s key as a cue reaches the line: A block · S slash · D stab · F flourish.',
    'Gold measures are boss combos: miss once and the measure repeats.',
  ],
  options: { musicMapping: 'instruments', keyLegend: 'A S D F' },
};
