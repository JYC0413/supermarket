// tests/QuestionBank.test.ts
import { describe, it, expect } from 'vitest';
import { QuestionBank } from '../src/logic/QuestionBank';

describe('QuestionBank', () => {
  const bank = new QuestionBank();

  it('generates a multiplication question with correct answer', () => {
    const q = bank.generateMultiplication();
    expect(q.type).toBe('multiplication');
    expect(q.slots).toHaveLength(1);
    const nChunk = q.chunks.find(c => c.id === 'n_count')!;
    const pChunk = q.chunks.find(c => c.id === 'p_price')!;
    const n = parseInt(nChunk.text);
    const p = parseInt(pChunk.text);
    expect(q.slots[0].answer).toBe(n * p);
  });

  it('generates a division question with non-zero remainder', () => {
    for (let i = 0; i < 20; i++) {
      const q = bank.generateDivisionRemainder();
      expect(q.slots).toHaveLength(2);
      expect(q.slots[1].answer).toBeGreaterThan(0);
      const totalChunk = q.chunks.find(c => c.id === 'total_money')!;
      const pChunk = q.chunks.find(c => c.id === 'p_price')!;
      const total = parseInt(totalChunk.text);
      const p = parseInt(pChunk.text);
      expect(q.slots[0].answer).toBe(Math.floor(total / p));
      expect(q.slots[1].answer).toBe(total % p);
    }
  });

  it('generates a mult_add question with correct sum', () => {
    const q = bank.generateMultAdd();
    expect(q.type).toBe('mult_add');
    const n1 = parseInt(q.chunks.find(c => c.id === 'n1_count')!.text);
    const p1 = parseInt(q.chunks.find(c => c.id === 'p1_price')!.text);
    const n2 = parseInt(q.chunks.find(c => c.id === 'n2_count')!.text);
    const p2 = parseInt(q.chunks.find(c => c.id === 'p2_price')!.text);
    expect(q.slots[0].answer).toBe(n1 * p1 + n2 * p2);
  });

  it('generates a mult_sub question with correct discounted total', () => {
    const q = bank.generateMultSub();
    expect(q.type).toBe('mult_sub');
    expect(q.slots[0].answer).toBeGreaterThan(0);
  });

  it('buildRound returns correct type distribution', () => {
    const round = bank.buildRound();
    expect(round).toHaveLength(8);
    const types = round.map(q => q.type);
    expect(types.filter(t => t === 'multiplication')).toHaveLength(3);
    const divCount = types.filter(t => t === 'division_remainder' || t === 'division_exact').length;
    expect(divCount).toBe(3);
    expect(types.filter(t => t === 'mult_add')).toHaveLength(1);
    expect(types.filter(t => t === 'mult_sub')).toHaveLength(1);
    expect(round.filter(q => q.isHard)).toHaveLength(2);
  });
});
