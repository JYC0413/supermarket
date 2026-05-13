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

/**
 * A fully generated question.
 * answers has one element for single-step questions,
 * two elements [quotient, remainder] for division_remainder.
 * promptLabels matches answers in length ("一共多少钱？" / "买几根？" + "找多少钱？").
 */
export interface Question {
  id: string;
  type: QuestionType;
  isHard: boolean;
  chunks: TextChunk[];
  requiredKeywordIds: string[];
  answers: number[];
  promptLabels: string[];
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
