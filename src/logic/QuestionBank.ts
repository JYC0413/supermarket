// src/logic/QuestionBank.ts
import type { Question, TextChunk } from './types';

const ITEMS = ['面包', '苹果', '铅笔', '本子', '橡皮', '尺子', '糖果', '饼干'];
const UNITS: Record<string, string> = {
  面包: '个', 苹果: '个', 铅笔: '支', 本子: '本',
  橡皮: '块', 尺子: '把', 糖果: '颗', 饼干: '块',
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function chunk(id: string, text: string, isKeyword: boolean, clickable = true): TextChunk {
  return { id, text, clickable, isKeyword };
}
function plain(text: string): TextChunk {
  return { id: '', text, clickable: false, isKeyword: false };
}

export class QuestionBank {
  generateMultiplication(): Question {
    const n = randInt(2, 9);
    const p = randInt(2, 9);
    const item = randItem(ITEMS);
    return {
      id: `mult_${Date.now()}_${Math.random()}`,
      type: 'multiplication',
      isHard: false,
      chunks: [
        plain('我买了'),
        chunk('n_count', `${n}个`, true),
        chunk('item', item, false),
        plain('，每个'),
        chunk('p_price', `${p}元`, true),
        plain('，一共要付'),
        chunk('q_total', '多少钱', true),
        plain('？'),
      ],
      requiredKeywordIds: ['n_count', 'p_price', 'q_total'],
      slots: [{ label: '一共多少钱？（元）', answer: n * p }],
    };
  }

  generateDivisionRemainder(): Question {
    const p = randInt(3, 9);
    const quotient = randInt(2, 6);
    const remainder = randInt(1, p - 1);
    const total = quotient * p + remainder;
    const item = randItem(ITEMS);
    const unit = UNITS[item];
    return {
      id: `div_${Date.now()}_${Math.random()}`,
      type: 'division_remainder',
      isHard: false,
      chunks: [
        plain('我有'),
        chunk('total_money', `${total}块钱`, true),
        plain('，一'),
        chunk('item', item, false),
        chunk('p_price', `${p}元`, true),
        plain('，能买几'),
        chunk('q_count', unit, true),
        plain('？找'),
        chunk('q_change', '多少钱', true),
        plain('？'),
      ],
      requiredKeywordIds: ['total_money', 'p_price', 'q_count', 'q_change'],
      slots: [
        { label: `能买几${unit}？`, answer: quotient },
        { label: '找多少钱？（元）', answer: remainder },
      ],
    };
  }

  generateMultAdd(): Question {
    const item1 = randItem(ITEMS);
    let item2 = randItem(ITEMS);
    while (item2 === item1) item2 = randItem(ITEMS);
    const n1 = randInt(2, 6);
    const p1 = randInt(2, 9);
    const n2 = randInt(2, 6);
    const p2 = randInt(2, 9);
    return {
      id: `multadd_${Date.now()}_${Math.random()}`,
      type: 'mult_add',
      isHard: true,
      chunks: [
        plain('我买了'),
        chunk('n1_count', `${n1}个`, true),
        chunk('item1', item1, false),
        plain('和'),
        chunk('n2_count', `${n2}个`, true),
        chunk('item2', item2, false),
        plain('，'),
        chunk('item1_label', item1, false),
        chunk('p1_price', `${p1}元`, true),
        plain('一个，'),
        chunk('item2_label', item2, false),
        chunk('p2_price', `${p2}元`, true),
        plain('一个，一共'),
        chunk('q_total', '多少钱', true),
        plain('？'),
      ],
      requiredKeywordIds: ['n1_count', 'p1_price', 'n2_count', 'p2_price', 'q_total'],
      slots: [{ label: '一共多少钱？（元）', answer: n1 * p1 + n2 * p2 }],
    };
  }

  generateMultSub(): Question {
    const n = randInt(3, 6);
    const p = randInt(3, 9);
    const total = n * p;
    const threshold = Math.min(Math.floor(total * 0.7), total - 1);
    const discount = randInt(1, Math.min(3, total - 1));
    const item = randItem(ITEMS);
    return {
      id: `multsub_${Date.now()}_${Math.random()}`,
      type: 'mult_sub',
      isHard: true,
      chunks: [
        plain('我买了'),
        chunk('n_count', `${n}个`, true),
        chunk('item', item, false),
        plain('，每个'),
        chunk('p_price', `${p}元`, true),
        plain('，满'),
        chunk('threshold', `${threshold}元`, true),
        plain('减'),
        chunk('discount', `${discount}元`, true),
        plain('，最后付'),
        chunk('q_total', '多少钱', true),
        plain('？'),
      ],
      requiredKeywordIds: ['n_count', 'p_price', 'threshold', 'discount', 'q_total'],
      slots: [{ label: '最后付多少钱？（元）', answer: total - discount }],
    };
  }

  /** Returns 8 questions in random order: 3 mult + 3 div + 1 mult_add + 1 mult_sub */
  buildRound(): Question[] {
    const questions: Question[] = [
      this.generateMultiplication(),
      this.generateMultiplication(),
      this.generateMultiplication(),
      this.generateDivisionRemainder(),
      this.generateDivisionRemainder(),
      this.generateDivisionRemainder(),
      this.generateMultAdd(),
      this.generateMultSub(),
    ];
    // Fisher-Yates shuffle
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    return questions;
  }
}
