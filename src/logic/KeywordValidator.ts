// src/logic/KeywordValidator.ts
import type { Question } from './types';

export class KeywordValidator {
  static isValidKeyword(question: Question, chunkId: string): boolean {
    return question.requiredKeywordIds.includes(chunkId);
  }

  static allCircled(question: Question, circledIds: string[]): boolean {
    return question.requiredKeywordIds.every(id => circledIds.includes(id));
  }
}
