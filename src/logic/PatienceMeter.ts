import type { PatiencePhase } from './types';

// Drain rates: % per second
const DRAIN_RATES: Record<PatiencePhase, number> = {
  reading: 0.25,            // -1% per 4s
  answering: 0.5,           // -1% per 2s
  answering_overtime: 1.5,  // -3% per 2s
};

// Instant deductions per wrong-answer attempt
const WRONG_DEDUCTIONS: Record<number, number> = { 1: 15, 2: 25, 3: 35 };

export class PatienceMeter {
  private _value = 100;
  private _phase: PatiencePhase = 'reading';

  get value(): number { return this._value; }
  get isDepleted(): boolean { return this._value <= 0; }

  setPhase(phase: PatiencePhase): void {
    this._phase = phase;
  }

  /** Call every game frame. deltaSeconds = elapsed time in seconds since last call. */
  tick(deltaSeconds: number): void {
    this._value = Math.max(0, this._value - DRAIN_RATES[this._phase] * deltaSeconds);
  }

  /** attemptNumber: 1, 2, or 3 */
  onWrongAnswer(attemptNumber: number): void {
    const deduction = WRONG_DEDUCTIONS[Math.min(attemptNumber, 3)] ?? 35;
    this._value = Math.max(0, this._value - deduction);
  }

  reset(): void {
    this._value = 100;
    this._phase = 'reading';
  }
}
