import { describe, it, expect, beforeEach } from 'vitest';
import { ScoreManager } from '../src/logic/ScoreManager';

describe('ScoreManager', () => {
  let sm: ScoreManager;

  beforeEach(() => { sm = new ScoreManager(); });

  it('starts at zero', () => {
    expect(sm.turnTotal).toBe(0);
    expect(sm.streak).toBe(0);
  });

  it('adds keyword bonus immediately (staged)', () => {
    sm.stageKeywordBonus();
    expect(sm.turnTotal).toBe(0);       // not committed yet
    expect(sm.stagedBonus).toBe(8);
  });

  it('commits staged bonus + base reward on correct answer', () => {
    sm.stageKeywordBonus();
    sm.stageKeywordBonus();
    sm.onCorrectAnswer(); // 16 staged + 30 base = 46
    expect(sm.turnTotal).toBe(46);
    expect(sm.stagedBonus).toBe(0);
  });

  it('discards staged bonus when customer leaves (patience depleted)', () => {
    sm.stageKeywordBonus();
    sm.onCustomerLeft();
    expect(sm.turnTotal).toBe(0);
    expect(sm.stagedBonus).toBe(0);
  });

  it('awards streak bonus at 3 consecutive correct', () => {
    sm.onCorrectAnswer();
    sm.onCorrectAnswer();
    sm.onCorrectAnswer(); // 3-streak: +15
    expect(sm.turnTotal).toBe(30 * 3 + 15);
    expect(sm.streak).toBe(3);
  });

  it('awards cumulative streak bonus at 5 consecutive correct', () => {
    for (let i = 0; i < 5; i++) sm.onCorrectAnswer();
    // 5 × 30 base + 15 (3-streak) + 25 (5-streak) = 190
    expect(sm.turnTotal).toBe(5 * 30 + 15 + 25);
  });

  it('resets streak on wrong answer', () => {
    sm.onCorrectAnswer();
    sm.onCorrectAnswer();
    sm.onWrongAnswer();
    expect(sm.streak).toBe(0);
  });

  it('adds speed bonus correctly', () => {
    sm.onSpeedBonus(63); // 63 seconds remaining = 6 × 10 = 60
    expect(sm.turnTotal).toBe(60);
  });

  it('finalizeRound commits turn total to class total', () => {
    sm.onCorrectAnswer();
    sm.finalizeRound();
    expect(sm.classTotal).toBe(30);
    expect(sm.sessionHighScore).toBe(30);
  });

  it('updates high score only if beaten', () => {
    sm.onCorrectAnswer();
    sm.finalizeRound();
    const newSm = new ScoreManager(sm.classTotal, sm.sessionHighScore);
    newSm.finalizeRound(); // turn total = 0, doesn't beat 30
    expect(newSm.sessionHighScore).toBe(30);
  });
});
