// src/logic/MathEngine.ts
import type { Question } from './types';

export class MathEngine {
  /** stepIndex: 0 for first slot, 1 for second (division_remainder only) */
  static check(question: Question, stepIndex: number, value: number): boolean {
    return question.slots[stepIndex].answer === value;
  }
}
