// tests/KeywordValidator.test.ts
import { describe, it, expect } from 'vitest';
import { KeywordValidator } from '../src/logic/KeywordValidator';
import { QuestionBank } from '../src/logic/QuestionBank';

describe('KeywordValidator', () => {
  const bank = new QuestionBank();

  it('returns false when no keywords circled', () => {
    const q = bank.generateMultiplication();
    expect(KeywordValidator.allCircled(q, [])).toBe(false);
  });

  it('returns true when all required keywords circled', () => {
    const q = bank.generateMultiplication();
    expect(KeywordValidator.allCircled(q, q.requiredKeywordIds)).toBe(true);
  });

  it('returns false when only some keywords circled', () => {
    const q = bank.generateMultiplication();
    const partial = q.requiredKeywordIds.slice(0, -1);
    expect(KeywordValidator.allCircled(q, partial)).toBe(false);
  });

  it('isValidKeyword returns true for required ids', () => {
    const q = bank.generateMultiplication();
    expect(KeywordValidator.isValidKeyword(q, 'n_count')).toBe(true);
    expect(KeywordValidator.isValidKeyword(q, 'item')).toBe(false);
  });
});
