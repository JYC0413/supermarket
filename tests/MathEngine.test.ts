import { describe, it, expect } from 'vitest';
import { MathEngine } from '../src/logic/MathEngine';
import { QuestionBank } from '../src/logic/QuestionBank';

describe('MathEngine', () => {
  const bank = new QuestionBank();

  it('accepts correct single answer', () => {
    const q = bank.generateMultiplication();
    expect(MathEngine.check(q, 0, q.slots[0].answer)).toBe(true);
  });

  it('rejects wrong single answer', () => {
    const q = bank.generateMultiplication();
    expect(MathEngine.check(q, 0, q.slots[0].answer + 1)).toBe(false);
  });

  it('accepts correct first step of division', () => {
    const q = bank.generateDivisionRemainder();
    expect(MathEngine.check(q, 0, q.slots[0].answer)).toBe(true);
  });

  it('accepts correct second step of division', () => {
    const q = bank.generateDivisionRemainder();
    expect(MathEngine.check(q, 1, q.slots[1].answer)).toBe(true);
  });

  it('rejects wrong second step of division', () => {
    const q = bank.generateDivisionRemainder();
    expect(MathEngine.check(q, 1, q.slots[1].answer + 1)).toBe(false);
  });
});
