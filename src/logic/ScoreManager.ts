const BASE_REWARD = 30;
const KEYWORD_BONUS = 8;
const STREAK_BONUSES: Record<number, number> = { 3: 15, 5: 25 };

export class ScoreManager {
  private _turnTotal = 0;
  private _stagedBonus = 0;
  private _streak = 0;
  private _classTotal: number;
  private _sessionHighScore: number;

  constructor(classTotal = 0, sessionHighScore = 0) {
    this._classTotal = classTotal;
    this._sessionHighScore = sessionHighScore;
  }

  get turnTotal(): number { return this._turnTotal; }
  get stagedBonus(): number { return this._stagedBonus; }
  get streak(): number { return this._streak; }
  get classTotal(): number { return this._classTotal; }
  get sessionHighScore(): number { return this._sessionHighScore; }

  /** Call each time a keyword is correctly circled. Staged — not committed until correct answer. */
  stageKeywordBonus(): void {
    this._stagedBonus += KEYWORD_BONUS;
  }

  /** Call when the student answers correctly. Commits staged bonus + base reward. */
  onCorrectAnswer(): void {
    this._turnTotal += this._stagedBonus + BASE_REWARD;
    this._stagedBonus = 0;
    this._streak++;
    const streakBonus = STREAK_BONUSES[this._streak] ?? 0;
    this._turnTotal += streakBonus;
  }

  /** Call on any wrong answer attempt. Resets streak. */
  onWrongAnswer(): void {
    this._streak = 0;
  }

  /** Call when patience depletes and customer leaves without a correct answer. */
  onCustomerLeft(): void {
    this._stagedBonus = 0;
    this._streak = 0;
  }

  /** Call when all customers served before time. remainingSeconds: seconds left on clock. */
  onSpeedBonus(remainingSeconds: number): void {
    this._turnTotal += Math.floor(remainingSeconds / 10) * 10;
  }

  /** Call at end of a student's round. Adds turn total to class total, updates high score. */
  finalizeRound(): void {
    this._classTotal += this._turnTotal;
    if (this._turnTotal > this._sessionHighScore) {
      this._sessionHighScore = this._turnTotal;
    }
    this._turnTotal = 0;
    this._streak = 0;
    this._stagedBonus = 0;
  }
}
