import { ACCURACY_WEIGHT, COMBO_MULTIPLIERS, SCORE_PER_JUDGEMENT } from '../config/gameplay';
import type { Judgement, JudgementEvent } from './judge';

export class ScoreKeeper {
  score = 0;
  combo = 0;
  maxCombo = 0;
  counts: Record<Judgement, number> = { perfect: 0, great: 0, good: 0, miss: 0 };
  private weightSum = 0;
  private judged = 0;
  /** Recent hit offsets (s) for the timing error bar. */
  readonly recentOffsets: number[] = [];

  get accuracy(): number {
    return this.judged === 0 ? 1 : this.weightSum / this.judged;
  }

  get multiplier(): number {
    let m = 1;
    for (const [threshold, mult] of COMBO_MULTIPLIERS) if (this.combo >= threshold) m = mult;
    return m;
  }

  /** Mean offset of recent hits in ms (positive = late). Useful for calibration. */
  get meanOffsetMs(): number {
    if (this.recentOffsets.length === 0) return 0;
    return (this.recentOffsets.reduce((a, b) => a + b, 0) / this.recentOffsets.length) * 1000;
  }

  apply(e: JudgementEvent, bonusMultiplier = 1): void {
    this.counts[e.judgement]++;
    this.judged++;
    this.weightSum += ACCURACY_WEIGHT[e.judgement];
    if (e.judgement === 'miss') {
      this.combo = 0;
    } else {
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.score += Math.round(
        SCORE_PER_JUDGEMENT[e.judgement] * this.multiplier * bonusMultiplier,
      );
      if (e.kind !== 'holdEnd') {
        this.recentOffsets.push(e.offset);
        if (this.recentOffsets.length > 40) this.recentOffsets.shift();
      }
    }
  }

  get grade(): string {
    const a = this.accuracy;
    if (this.counts.miss === 0 && a >= 0.98) return 'SS';
    if (a >= 0.95) return 'S';
    if (a >= 0.9) return 'A';
    if (a >= 0.8) return 'B';
    if (a >= 0.7) return 'C';
    return 'D';
  }
}
