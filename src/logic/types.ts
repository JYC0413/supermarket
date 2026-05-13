// src/logic/types.ts

export type QuestionType =
  | 'multiplication'
  | 'division_remainder'
  | 'mult_add'
  | 'mult_sub';

/** One word-chunk in the dialogue. Non-clickable chunks have clickable=false. */
export interface TextChunk {
  id: string;
  text: string;
  clickable: boolean;
  isKeyword: boolean;
}

/** One answer step: the label shown to the student and the correct numeric value. */
export interface AnswerSlot {
  label: string;    // e.g. "一共多少钱？（元）" or "找多少钱？（元）"
  answer: number;
}

/**
 * A fully generated question.
 * slots has one entry for single-step questions,
 * two entries [quotient, remainder] for division_remainder.
 */
export interface Question {
  id: string;
  type: QuestionType;
  isHard: boolean;
  chunks: TextChunk[];
  requiredKeywordIds: string[];
  slots: AnswerSlot[];
}

export interface GameSettings {
  roundDuration: number;   // seconds, default 300
  customerCount: number;   // per round, default 8
}

export type PatiencePhase = 'reading' | 'answering' | 'answering_overtime';

export interface RoundResult {
  keywordBonus: number;
  baseReward: number;
  streakBonus: number;
  total: number;
}
