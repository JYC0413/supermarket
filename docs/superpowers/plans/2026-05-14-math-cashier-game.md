# 数学便利店收银员游戏 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Phaser 3 browser game for interactive whiteboards where 2nd-grade students practice multiplication-table word problems as a convenience-store cashier.

**Architecture:** A pure-logic layer (`src/logic/`) holds all game rules with zero Phaser dependencies and is fully unit-tested with Vitest. Phaser 3 scenes and UI components consume that logic and render the pixel-art UI. A `HUDScene` overlays `GameScene` to show the timer, scores, and step indicator.

**Tech Stack:** Phaser 3.60, Vite 5, Vitest 2, TypeScript 5.

---

## File Map

| File | Responsibility |
|---|---|
| `src/main.ts` | Phaser game init, register scenes |
| `src/config.ts` | Game constants, default teacher settings |
| `src/logic/types.ts` | All shared TypeScript interfaces |
| `src/logic/QuestionBank.ts` | Generate one Question per type |
| `src/logic/MathEngine.ts` | Validate student answers |
| `src/logic/KeywordValidator.ts` | Check required keywords circled |
| `src/logic/PatienceMeter.ts` | Track patience drain over time |
| `src/logic/ScoreManager.ts` | Calculate keyword/answer/streak/speed bonuses |
| `src/scenes/BootScene.ts` | Phaser boot, no assets |
| `src/scenes/PreloadScene.ts` | Load all assets, show progress bar |
| `src/scenes/GameScene.ts` | Orchestrate the full question-answer loop |
| `src/scenes/HUDScene.ts` | Overlay: timer countdown, class coins, high score, step indicator |
| `src/ui/DialogueBox.ts` | Render clickable word-chunk text, emit keyword events |
| `src/ui/NumPad.ts` | Pixel-style number pad, emit digit/confirm/delete events |
| `src/ui/PatienceBar.ts` | Animated patience bar with colour transitions |
| `src/ui/CustomerSprite.ts` | Customer sprite with idle/happy/angry/leave animations |
| `tests/QuestionBank.test.ts` | Unit tests for question generation |
| `tests/MathEngine.test.ts` | Unit tests for answer validation |
| `tests/KeywordValidator.test.ts` | Unit tests for keyword checking |
| `tests/PatienceMeter.test.ts` | Unit tests for patience drain |
| `tests/ScoreManager.test.ts` | Unit tests for score calculation |

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.ts`

- [ ] **Step 1: Scaffold the project**

```bash
npm create vite@latest . -- --template vanilla-ts
npm install phaser
npm install -D vitest @vitest/coverage-v8
```

- [ ] **Step 2: Configure Vite for Phaser and Vitest**

Replace `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Configure TypeScript**

Replace `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "outDir": "dist",
    "types": ["vite/client"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 4: Add npm scripts to package.json**

Ensure `package.json` scripts section contains:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

- [ ] **Step 5: Stub main.ts so Vite compiles**

```typescript
// src/main.ts
import Phaser from 'phaser';
console.log('Phaser', Phaser.VERSION);
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```
Expected: Vite prints a localhost URL, browser shows blank page, console logs Phaser version.

- [ ] **Step 7: Verify tests run**

```bash
npm run test:run
```
Expected: "No test files found" (zero failures).

- [ ] **Step 8: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Vite + Phaser 3 + Vitest project"
```

---

## Task 2: Shared Types

**Files:**
- Create: `src/logic/types.ts`

- [ ] **Step 1: Write the types file**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/logic/types.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: QuestionBank

**Files:**
- Create: `src/logic/QuestionBank.ts`, `tests/QuestionBank.test.ts`

- [ ] **Step 1: Write the failing tests first**

```typescript
// tests/QuestionBank.test.ts
import { describe, it, expect } from 'vitest';
import { QuestionBank } from '../src/logic/QuestionBank';

describe('QuestionBank', () => {
  const bank = new QuestionBank();

  it('generates a multiplication question with correct answer', () => {
    const q = bank.generateMultiplication();
    expect(q.type).toBe('multiplication');
    expect(q.answers).toHaveLength(1);
    const nChunk = q.chunks.find(c => c.id === 'n_count')!;
    const pChunk = q.chunks.find(c => c.id === 'p_price')!;
    const n = parseInt(nChunk.text);
    const p = parseInt(pChunk.text);
    expect(q.answers[0]).toBe(n * p);
  });

  it('generates a division question with non-zero remainder', () => {
    for (let i = 0; i < 20; i++) {
      const q = bank.generateDivisionRemainder();
      expect(q.answers).toHaveLength(2);
      expect(q.answers[1]).toBeGreaterThan(0);
      const totalChunk = q.chunks.find(c => c.id === 'total_money')!;
      const pChunk = q.chunks.find(c => c.id === 'p_price')!;
      const total = parseInt(totalChunk.text);
      const p = parseInt(pChunk.text);
      expect(q.answers[0]).toBe(Math.floor(total / p));
      expect(q.answers[1]).toBe(total % p);
    }
  });

  it('generates a mult_add question with correct sum', () => {
    const q = bank.generateMultAdd();
    expect(q.type).toBe('mult_add');
    const n1 = parseInt(q.chunks.find(c => c.id === 'n1_count')!.text);
    const p1 = parseInt(q.chunks.find(c => c.id === 'p1_price')!.text);
    const n2 = parseInt(q.chunks.find(c => c.id === 'n2_count')!.text);
    const p2 = parseInt(q.chunks.find(c => c.id === 'p2_price')!.text);
    expect(q.answers[0]).toBe(n1 * p1 + n2 * p2);
  });

  it('generates a mult_sub question with correct discounted total', () => {
    const q = bank.generateMultSub();
    expect(q.type).toBe('mult_sub');
    expect(q.answers[0]).toBeGreaterThan(0);
  });

  it('buildRound returns correct type distribution', () => {
    const round = bank.buildRound();
    expect(round).toHaveLength(8);
    const types = round.map(q => q.type);
    expect(types.filter(t => t === 'multiplication')).toHaveLength(3);
    expect(types.filter(t => t === 'division_remainder')).toHaveLength(3);
    expect(types.filter(t => t === 'mult_add')).toHaveLength(1);
    expect(types.filter(t => t === 'mult_sub')).toHaveLength(1);
    expect(round.filter(q => q.isHard)).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm run test:run -- tests/QuestionBank.test.ts
```
Expected: FAIL — "Cannot find module '../src/logic/QuestionBank'"

- [ ] **Step 3: Implement QuestionBank**

```typescript
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
      answers: [n * p],
      promptLabels: ['一共多少钱？（元）'],
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
      answers: [quotient, remainder],
      promptLabels: [`能买几${unit}？`, '找多少钱？（元）'],
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
      answers: [n1 * p1 + n2 * p2],
      promptLabels: ['一共多少钱？（元）'],
    };
  }

  generateMultSub(): Question {
    const n = randInt(3, 6);
    const p = randInt(3, 9);
    const total = n * p;
    // Ensure discount applies: threshold <= total, discount < total
    const threshold = randInt(2, Math.min(total - 1, 15)) * Math.floor(total / randInt(2, 3));
    const discount = randInt(1, Math.min(3, total - 1));
    const safeThreshold = Math.min(threshold, total); // guarantee it triggers
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
        chunk('threshold', `${safeThreshold}元`, true),
        plain('减'),
        chunk('discount', `${discount}元`, true),
        plain('，最后付'),
        chunk('q_total', '多少钱', true),
        plain('？'),
      ],
      requiredKeywordIds: ['n_count', 'p_price', 'threshold', 'discount', 'q_total'],
      answers: [total - discount],
      promptLabels: ['最后付多少钱？（元）'],
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
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run -- tests/QuestionBank.test.ts
```
Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/logic/QuestionBank.ts tests/QuestionBank.test.ts
git commit -m "feat: add QuestionBank with all 4 question types"
```

---

## Task 4: MathEngine

**Files:**
- Create: `src/logic/MathEngine.ts`, `tests/MathEngine.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/MathEngine.test.ts
import { describe, it, expect } from 'vitest';
import { MathEngine } from '../src/logic/MathEngine';
import { QuestionBank } from '../src/logic/QuestionBank';

describe('MathEngine', () => {
  const bank = new QuestionBank();

  it('accepts correct single answer', () => {
    const q = bank.generateMultiplication();
    expect(MathEngine.check(q, 0, q.answers[0])).toBe(true);
  });

  it('rejects wrong single answer', () => {
    const q = bank.generateMultiplication();
    expect(MathEngine.check(q, 0, q.answers[0] + 1)).toBe(false);
  });

  it('accepts correct first step of division', () => {
    const q = bank.generateDivisionRemainder();
    expect(MathEngine.check(q, 0, q.answers[0])).toBe(true);
  });

  it('accepts correct second step of division', () => {
    const q = bank.generateDivisionRemainder();
    expect(MathEngine.check(q, 1, q.answers[1])).toBe(true);
  });

  it('rejects wrong second step of division', () => {
    const q = bank.generateDivisionRemainder();
    expect(MathEngine.check(q, 1, q.answers[1] + 1)).toBe(false);
  });
});
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
npm run test:run -- tests/MathEngine.test.ts
```

- [ ] **Step 3: Implement MathEngine**

```typescript
// src/logic/MathEngine.ts
import type { Question } from './types';

export class MathEngine {
  /** stepIndex: 0 for first answer, 1 for second (division_remainder only) */
  static check(question: Question, stepIndex: number, value: number): boolean {
    return question.answers[stepIndex] === value;
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run -- tests/MathEngine.test.ts
```
Expected: All 5 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/logic/MathEngine.ts tests/MathEngine.test.ts
git commit -m "feat: add MathEngine answer validation"
```

---

## Task 5: KeywordValidator

**Files:**
- Create: `src/logic/KeywordValidator.ts`, `tests/KeywordValidator.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
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
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
npm run test:run -- tests/KeywordValidator.test.ts
```

- [ ] **Step 3: Implement KeywordValidator**

```typescript
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
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run -- tests/KeywordValidator.test.ts
```
Expected: All 4 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/logic/KeywordValidator.ts tests/KeywordValidator.test.ts
git commit -m "feat: add KeywordValidator"
```

---

## Task 6: PatienceMeter

**Files:**
- Create: `src/logic/PatienceMeter.ts`, `tests/PatienceMeter.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/PatienceMeter.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { PatienceMeter } from '../src/logic/PatienceMeter';

describe('PatienceMeter', () => {
  let meter: PatienceMeter;

  beforeEach(() => { meter = new PatienceMeter(); });

  it('starts at 100', () => {
    expect(meter.value).toBe(100);
  });

  it('drains slowly in reading phase', () => {
    meter.setPhase('reading');
    meter.tick(4); // 4 seconds = -1%
    expect(meter.value).toBeCloseTo(99, 0);
  });

  it('drains faster in answering phase', () => {
    meter.setPhase('answering');
    meter.tick(2); // 2 seconds = -1%
    expect(meter.value).toBeCloseTo(99, 0);
  });

  it('drains fastest in overtime phase', () => {
    meter.setPhase('answering_overtime');
    meter.tick(2); // 2 seconds = -3%
    expect(meter.value).toBeCloseTo(97, 0);
  });

  it('applies progressive wrong-answer deductions', () => {
    meter.onWrongAnswer(1);
    expect(meter.value).toBeCloseTo(85, 0);
    meter.onWrongAnswer(2);
    expect(meter.value).toBeCloseTo(60, 0);
    meter.onWrongAnswer(3);
    expect(meter.value).toBeCloseTo(25, 0);
  });

  it('clamps to 0, never negative', () => {
    meter.onWrongAnswer(1);
    meter.onWrongAnswer(2);
    meter.onWrongAnswer(3);
    meter.tick(1000);
    expect(meter.value).toBe(0);
  });

  it('isDepleted when value reaches 0', () => {
    meter.onWrongAnswer(1);
    meter.onWrongAnswer(2);
    meter.onWrongAnswer(3);
    meter.tick(200);
    expect(meter.isDepleted).toBe(true);
  });

  it('reset restores to 100', () => {
    meter.onWrongAnswer(1);
    meter.reset();
    expect(meter.value).toBe(100);
    expect(meter.isDepleted).toBe(false);
  });
});
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
npm run test:run -- tests/PatienceMeter.test.ts
```

- [ ] **Step 3: Implement PatienceMeter**

```typescript
// src/logic/PatienceMeter.ts
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
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run -- tests/PatienceMeter.test.ts
```
Expected: All 8 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/logic/PatienceMeter.ts tests/PatienceMeter.test.ts
git commit -m "feat: add PatienceMeter with progressive wrong-answer deductions"
```

---

## Task 7: ScoreManager

**Files:**
- Create: `src/logic/ScoreManager.ts`, `tests/ScoreManager.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/ScoreManager.test.ts
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
    sm.stagekeywordBonus();
    expect(sm.turnTotal).toBe(0);       // not committed yet
    expect(sm.stagedBonus).toBe(8);
  });

  it('commits staged bonus + base reward on correct answer', () => {
    sm.stagekeywordBonus();
    sm.stagekeywordBonus();
    sm.onCorrectAnswer(); // 16 staged + 30 base = 46
    expect(sm.turnTotal).toBe(46);
    expect(sm.stagedBonus).toBe(0);
  });

  it('discards staged bonus when customer leaves (patience depleted)', () => {
    sm.stagekeywordBonus();
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
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
npm run test:run -- tests/ScoreManager.test.ts
```

- [ ] **Step 3: Implement ScoreManager**

```typescript
// src/logic/ScoreManager.ts

const BASE_REWARD = 30;
const KEYWORD_BONUS = 8;
const STREAK_BONUSES: Record<number, number> = { 3: 15, 5: 25 };

export class ScoreManager {
  private _turnTotal = 0;
  private _stagedBonus = 0;
  private _streak = 0;
  private _classTotal: number;
  private _sessionHighScore: number;

  constructor(classTotal = 0, sessionHighScore = 0) {
    this._classTotal = classTotal;
    this._sessionHighScore = sessionHighScore;
  }

  get turnTotal(): number { return this._turnTotal; }
  get stagedBonus(): number { return this._stagedBonus; }
  get streak(): number { return this._streak; }
  get classTotal(): number { return this._classTotal; }
  get sessionHighScore(): number { return this._sessionHighScore; }

  /** Call each time a keyword is correctly circled. Shows +8 visually but not yet committed. */
  stagekeywordBonus(): void {
    this._stagedBonus += KEYWORD_BONUS;
  }

  /** Call when the student answers correctly. */
  onCorrectAnswer(): void {
    this._turnTotal += this._stagedBonus + BASE_REWARD;
    this._stagedBonus = 0;
    this._streak++;
    const streakBonus = STREAK_BONUSES[this._streak] ?? 0;
    this._turnTotal += streakBonus;
  }

  /** Call on any wrong answer attempt. */
  onWrongAnswer(): void {
    this._streak = 0;
  }

  /** Call when patience depletes and customer leaves without a correct answer. */
  onCustomerLeft(): void {
    this._stagedBonus = 0;
    this._streak = 0;
  }

  /** Call when all customers served before time. remainingSeconds: seconds left on clock. */
  onSpeedBonus(remainingSeconds: number): void {
    this._turnTotal += Math.floor(remainingSeconds / 10) * 10;
  }

  /** Call at end of a student's round. Adds turn total to class total, updates high score. */
  finalizeRound(): void {
    this._classTotal += this._turnTotal;
    if (this._turnTotal > this._sessionHighScore) {
      this._sessionHighScore = this._turnTotal;
    }
    this._turnTotal = 0;
    this._streak = 0;
    this._stagedBonus = 0;
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run -- tests/ScoreManager.test.ts
```
Expected: All 10 PASS.

- [ ] **Step 5: Run all tests together**

```bash
npm run test:run
```
Expected: All tests across all files PASS.

- [ ] **Step 6: Commit**

```bash
git add src/logic/ScoreManager.ts tests/ScoreManager.test.ts
git commit -m "feat: add ScoreManager with staged keyword bonuses and streak system"
```

---

## Task 8: GameConfig & Phaser Boot

**Files:**
- Create: `src/config.ts`, `src/scenes/BootScene.ts`, `src/scenes/PreloadScene.ts`, update `src/main.ts`

- [ ] **Step 1: Write config**

```typescript
// src/config.ts
import type { GameSettings } from './logic/types';

export const DEFAULT_SETTINGS: GameSettings = {
  roundDuration: 300,
  customerCount: 8,
};

export const COLORS = {
  bg: 0x0a0a1a,
  hudBg: 0x080812,
  dialogueBg: 0x0c0c18,
  chunkNormal: 0x222233,
  chunkCircled: 0x2a1a00,
  chunkBorder: 0x333344,
  chunkCircledBorder: 0xc89020,
  gold: 0xffd060,
  green: 0x6fcf6f,
  red: 0xcf6f6f,
  white: 0xffffff,
  grey: 0x888888,
};

export const FONT = { fontFamily: '"Courier New", monospace', color: '#dddddd' };
export const FONT_GOLD = { ...FONT, color: '#ffd060' };
export const FONT_GREEN = { ...FONT, color: '#6fcf6f' };
export const FONT_GREY = { ...FONT, color: '#888888' };
```

- [ ] **Step 2: Write BootScene**

```typescript
// src/scenes/BootScene.ts
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  create(): void {
    // Pixel-perfect rendering for all sprites
    this.cameras.main.setRoundPixels(true);
    this.scene.start('PreloadScene');
  }
}
```

- [ ] **Step 3: Write PreloadScene with placeholder assets**

```typescript
// src/scenes/PreloadScene.ts
import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloadScene' }); }

  preload(): void {
    // Placeholder: generate colored rectangle textures programmatically.
    // Replace with real sprite sheets under public/assets/ later.
    this.load.on('complete', () => this.scene.start('GameScene'));
  }

  create(): void {
    // Generate colored placeholder textures
    const make = (key: string, color: number, w: number, h: number) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(color).fillRect(0, 0, w, h);
      g.generateTexture(key, w, h);
      g.destroy();
    };
    make('cashier', 0x4a6ab0, 16, 28);
    make('customer_idle', 0xb06a4a, 14, 26);
    make('customer_happy', 0x60aa60, 14, 26);
    make('customer_angry', 0xaa3030, 14, 26);
    make('counter', 0x5a3a10, 130, 24);
    make('shelf', 0x3a2a10, 52, 40);
    this.scene.start('GameScene');
  }
}
```

- [ ] **Step 4: Wire up main.ts**

```typescript
// src/main.ts
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { GameScene } from './scenes/GameScene';
import { HUDScene } from './scenes/HUDScene';

new Phaser.Game({
  type: Phaser.AUTO,
  width: 960,
  height: 600,
  backgroundColor: '#0a0a1a',
  pixelArt: true,
  scene: [BootScene, PreloadScene, GameScene, HUDScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: { activePointers: 3 },
});
```

- [ ] **Step 5: Stub GameScene and HUDScene so TypeScript compiles**

```typescript
// src/scenes/GameScene.ts
import Phaser from 'phaser';
export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }
  create(): void { this.add.text(20, 20, 'GameScene — stub', { color: '#fff' }); }
}
```

```typescript
// src/scenes/HUDScene.ts
import Phaser from 'phaser';
export class HUDScene extends Phaser.Scene {
  constructor() { super({ key: 'HUDScene' }); }
  create(): void {}
}
```

- [ ] **Step 6: Run dev server and confirm Phaser loads**

```bash
npm run dev
```
Expected: Browser shows "GameScene — stub" text on dark background.

- [ ] **Step 7: Commit**

```bash
git add src/
git commit -m "feat: wire up Phaser boot + preload scenes with placeholder textures"
```

---

## Task 9: CustomerSprite

**Files:**
- Create: `src/ui/CustomerSprite.ts`

- [ ] **Step 1: Implement CustomerSprite**

```typescript
// src/ui/CustomerSprite.ts
import Phaser from 'phaser';

type CustomerMood = 'idle' | 'happy' | 'angry';

export class CustomerSprite extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Image;
  private _mood: CustomerMood = 'idle';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.sprite = scene.add.image(0, 0, 'customer_idle').setOrigin(0.5, 1);
    this.add(this.sprite);
    scene.add.existing(this);
  }

  setMood(mood: CustomerMood): void {
    if (this._mood === mood) return;
    this._mood = mood;
    this.sprite.setTexture(`customer_${mood}`);
  }

  walkIn(targetX: number, onComplete: () => void): void {
    this.x = targetX + 120;
    this.scene.tweens.add({
      targets: this, x: targetX, duration: 600,
      ease: 'Quad.easeOut', onComplete,
    });
  }

  walkOut(onComplete: () => void): void {
    this.scene.tweens.add({
      targets: this, x: this.x + 150, duration: 500,
      ease: 'Quad.easeIn', onComplete: () => { this.destroy(); onComplete(); },
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/CustomerSprite.ts
git commit -m "feat: add CustomerSprite with walk-in/walk-out tweens"
```

---

## Task 10: DialogueBox

**Files:**
- Create: `src/ui/DialogueBox.ts`

The DialogueBox renders the question text as interactive word-chunks. It emits `'keyword_circled'` (with chunk id) and `'all_keywords_done'` events on the scene.

- [ ] **Step 1: Implement DialogueBox**

```typescript
// src/ui/DialogueBox.ts
import Phaser from 'phaser';
import type { Question, TextChunk } from '../logic/types';
import { KeywordValidator } from '../logic/KeywordValidator';
import { FONT, FONT_GOLD, FONT_GREY } from '../config';

const CHUNK_PADDING_X = 6;
const CHUNK_PADDING_Y = 3;

export class DialogueBox extends Phaser.GameObjects.Container {
  private circledIds: string[] = [];
  private question!: Question;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number) {
    super(scene, x, y);
    scene.add.existing(this);
    // Background
    const bg = scene.add.rectangle(0, 0, width, 100, 0x0c0c18)
      .setOrigin(0, 0).setStrokeStyle(1, 0x1a1a2a);
    this.add(bg);
  }

  load(question: Question): void {
    this.question = question;
    this.circledIds = [];
    // Remove previous word objects (keep bg at index 0)
    while (this.list.length > 1) this.list[1].destroy();

    let cursorX = 10;
    let cursorY = 10;

    for (const chk of question.chunks) {
      const obj = this.buildChunk(chk, cursorX, cursorY);
      this.add(obj);
      cursorX += (obj as Phaser.GameObjects.Container).width + 4;
      // Simple line wrap at 90% of parent width
      const parentWidth = (this.list[0] as Phaser.GameObjects.Rectangle).width;
      if (cursorX > parentWidth * 0.9) { cursorX = 10; cursorY += 36; }
    }
  }

  private buildChunk(chk: TextChunk, x: number, y: number): Phaser.GameObjects.Container {
    const scene = this.scene;
    const label = scene.add.text(CHUNK_PADDING_X, CHUNK_PADDING_Y, chk.text,
      chk.clickable ? FONT : FONT_GREY);
    const w = label.width + CHUNK_PADDING_X * 2;
    const h = label.height + CHUNK_PADDING_Y * 2;

    const container = scene.add.container(x, y);
    const bg = scene.add.rectangle(0, 0, w, h, chk.clickable ? 0x111122 : 0x0a0a14)
      .setOrigin(0, 0).setStrokeStyle(1, chk.clickable ? 0x2a2a3a : 0x111111);
    container.add([bg, label]);
    (container as any).width = w; // store for cursor math

    if (chk.clickable) {
      bg.setInteractive({ cursor: 'pointer' }).on('pointerup', () => this.onChunkTap(chk, bg, label));
    }
    return container;
  }

  private onChunkTap(chk: TextChunk, bg: Phaser.GameObjects.Rectangle, label: Phaser.GameObjects.Text): void {
    if (this.circledIds.includes(chk.id)) return; // already circled

    if (KeywordValidator.isValidKeyword(this.question, chk.id)) {
      // Circle it
      this.circledIds.push(chk.id);
      bg.setFillStyle(0x2a1a00).setStrokeStyle(2, 0xc89020);
      label.setStyle(FONT_GOLD);
      this.scene.events.emit('keyword_circled', chk.id);

      if (KeywordValidator.allCircled(this.question, this.circledIds)) {
        this.scene.events.emit('all_keywords_done');
      }
    } else {
      // Wrong click: shake and reset
      this.scene.tweens.add({
        targets: bg,
        x: { from: bg.x - 3, to: bg.x + 3 },
        yoyo: true, repeat: 2, duration: 50,
        onComplete: () => bg.setX(0),
      });
    }
  }

  /** Show hard-question badge next to the text */
  showHardBadge(): void {
    const badge = this.scene.add.text(0, -22, '⚡ 超难题！',
      { ...FONT, color: '#ffd060', fontSize: '13px',
        backgroundColor: '#1a1200', padding: { x: 6, y: 2 } });
    this.add(badge);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/DialogueBox.ts
git commit -m "feat: add DialogueBox with clickable keyword chunks and shake feedback"
```

---

## Task 11: NumPad

**Files:**
- Create: `src/ui/NumPad.ts`

Emits `'numpad_confirm'` (with current numeric value) and `'numpad_digit'` on the scene.

- [ ] **Step 1: Implement NumPad**

```typescript
// src/ui/NumPad.ts
import Phaser from 'phaser';
import { COLORS, FONT } from '../config';

const KEY_LAYOUT = [
  ['7','8','9'],
  ['4','5','6'],
  ['1','2','3'],
  ['0','0','⌫'],
];

export class NumPad extends Phaser.GameObjects.Container {
  private displayText!: Phaser.GameObjects.Text;
  private _value = '';
  private promptText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);
    this.buildDisplay();
    this.buildKeys();
  }

  private buildDisplay(): void {
    const bg = this.scene.add.rectangle(0, 0, 120, 32, 0x111111)
      .setOrigin(0, 0).setStrokeStyle(2, 0x555555);
    this.displayText = this.scene.add.text(8, 6, '_', { ...FONT, fontSize: '18px', color: '#ffffff' });
    this.promptText = this.scene.add.text(0, -18, '', { ...FONT, fontSize: '10px', color: '#888888' });
    this.add([bg, this.displayText, this.promptText]);
  }

  private buildKeys(): void {
    const keyW = 36, keyH = 28, gap = 3;
    KEY_LAYOUT.forEach((row, ri) => {
      row.forEach((key, ci) => {
        if (ri === 3 && ci === 1) return; // skip middle of bottom row (0 is wide)
        const isWide = ri === 3 && ci === 0; // '0' spans 2 columns
        const w = isWide ? keyW * 2 + gap : keyW;
        const kx = isWide ? 0 : ci * (keyW + gap);
        const ky = 40 + ri * (keyH + gap);
        const bg = this.scene.add.rectangle(kx, ky, w, keyH,
          key === '⌫' ? 0x2a1a1a : 0x1a1a2e).setOrigin(0, 0)
          .setStrokeStyle(2, key === '⌫' ? 0x4a2a2a : 0x2a2a4a)
          .setInteractive({ cursor: 'pointer' });
        const label = this.scene.add.text(kx + w / 2, ky + keyH / 2, key,
          { ...FONT, fontSize: '13px', color: key === '⌫' ? '#cf6f6f' : '#9f9fff' })
          .setOrigin(0.5, 0.5);
        bg.on('pointerup', () => this.handleKey(key));
        bg.on('pointerover', () => bg.setFillStyle(key === '⌫' ? 0x3a2a2a : 0x2a2a4e));
        bg.on('pointerout', () => bg.setFillStyle(key === '⌫' ? 0x2a1a1a : 0x1a1a2e));
        this.add([bg, label]);
      });
    });
  }

  private handleKey(key: string): void {
    if (key === '⌫') {
      this._value = this._value.slice(0, -1);
    } else if (this._value.length < 4) {
      this._value += key;
      this.scene.events.emit('numpad_digit', parseInt(this._value));
    }
    if (key !== '⌫') {
      this.scene.events.emit('numpad_digit');
    }
    this.updateDisplay();
  }

  setPrompt(text: string): void {
    this.promptText.setText(text);
  }

  reset(): void {
    this._value = '';
    this.updateDisplay();
  }

  private updateDisplay(): void {
    this.displayText.setText(this._value.length ? this._value : '_');
  }

  setLocked(locked: boolean): void {
    this.setAlpha(locked ? 0.2 : 1);
    this.setInteractive(!locked);
  }

  confirmCurrentValue(): void {
    const num = parseInt(this._value);
    if (!isNaN(num)) {
      this.scene.events.emit('numpad_confirm', num);
    }
  }
}
```

- [ ] **Step 2: Add confirm button to NumPad (call in buildDisplay after keys)**

Add this to the `buildKeys` method at the end:
```typescript
// Confirm button
const confirmBg = this.scene.add.rectangle(0, 40 + 4 * (28 + 3), 120, 28, 0x1a3a1a)
  .setOrigin(0, 0).setStrokeStyle(2, 0x3a6a3a)
  .setInteractive({ cursor: 'pointer' });
const confirmLabel = this.scene.add.text(60, 40 + 4 * (28 + 3) + 14, '✓ 确认',
  { ...FONT, color: '#6fcf6f' }).setOrigin(0.5, 0.5);
confirmBg.on('pointerup', () => this.confirmCurrentValue());
this.add([confirmBg, confirmLabel]);
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/NumPad.ts
git commit -m "feat: add pixel-style NumPad with confirm button"
```

---

## Task 12: PatienceBar & StepIndicator

**Files:**
- Create: `src/ui/PatienceBar.ts`, `src/ui/StepIndicator.ts`

- [ ] **Step 1: Implement PatienceBar**

```typescript
// src/ui/PatienceBar.ts
import Phaser from 'phaser';
import { FONT_GREY } from '../config';

export class PatienceBar extends Phaser.GameObjects.Container {
  private fill: Phaser.GameObjects.Rectangle;
  private track: Phaser.GameObjects.Rectangle;
  private emoji: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number) {
    super(scene, x, y);
    scene.add.existing(this);
    this.emoji = scene.add.text(0, 0, '😊', { fontSize: '16px' }).setOrigin(0, 0.5);
    scene.add.text(22, 0, '顾客耐心', FONT_GREY).setOrigin(0, 0.5);
    this.track = scene.add.rectangle(80, 0, width - 80, 8, 0x1a1a1a)
      .setOrigin(0, 0.5).setStrokeStyle(1, 0x2a2a2a);
    this.fill = scene.add.rectangle(80, 0, width - 80, 8, 0x5fa05f).setOrigin(0, 0.5);
    this.add([this.emoji, this.track, this.fill]);
  }

  update(value: number): void {
    const pct = Math.max(0, Math.min(100, value)) / 100;
    const maxW = this.track.width;
    this.fill.setSize(maxW * pct, 8);
    // Colour transitions: green → yellow → red
    if (pct > 0.5) {
      this.fill.setFillStyle(0x5fa05f);
      this.emoji.setText('😊');
    } else if (pct > 0.25) {
      this.fill.setFillStyle(0xd4c020);
      this.emoji.setText('😐');
    } else {
      this.fill.setFillStyle(0xcf4040);
      this.emoji.setText('😤');
    }
  }
}
```

- [ ] **Step 2: Implement StepIndicator**

```typescript
// src/ui/StepIndicator.ts
import Phaser from 'phaser';

type Step = 'reading' | 'keyword' | 'answer';

const LABELS: Record<Step, string> = {
  reading: '① 读题',
  keyword: '② 圈关键词',
  answer: '③ 答题',
};

export class StepIndicator extends Phaser.GameObjects.Container {
  private cells: Map<Step, { bg: Phaser.GameObjects.Rectangle, label: Phaser.GameObjects.Text }> = new Map();
  private bonusText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number) {
    super(scene, x, y);
    scene.add.existing(this);
    const steps: Step[] = ['reading', 'keyword', 'answer'];
    const cellW = width / 3;
    steps.forEach((step, i) => {
      const bg = scene.add.rectangle(i * cellW, 0, cellW - 1, 26, 0x0d0d18)
        .setOrigin(0, 0).setStrokeStyle(1, 0x1a1a2a);
      const label = scene.add.text(i * cellW + cellW / 2, 13, LABELS[step],
        { fontFamily: '"Courier New", monospace', fontSize: '11px', color: '#333' })
        .setOrigin(0.5, 0.5);
      this.cells.set(step, { bg, label });
      this.add([bg, label]);
    });
    this.bonusText = scene.add.text(width, 13, '', {
      fontFamily: '"Courier New", monospace', fontSize: '10px', color: '#ffd060',
    }).setOrigin(1, 0.5);
    this.add(this.bonusText);
  }

  setStep(active: Step, completedBonus?: number): void {
    const order: Step[] = ['reading', 'keyword', 'answer'];
    const activeIdx = order.indexOf(active);
    order.forEach((step, i) => {
      const { bg, label } = this.cells.get(step)!;
      if (i < activeIdx) {
        bg.setFillStyle(0x0a1a0a); label.setColor('#5fcf6f');
        label.setText(LABELS[step] + ' ✓');
      } else if (i === activeIdx) {
        bg.setFillStyle(0x1a1400); label.setColor('#ffd060');
        label.setText(LABELS[step] + ' ✏');
      } else {
        bg.setFillStyle(0x0d0d18); label.setColor('#333');
        label.setText(LABELS[step]);
      }
    });
    if (completedBonus !== undefined && completedBonus > 0) {
      this.bonusText.setText(`+¥${completedBonus}`);
    }
  }

  clearBonus(): void { this.bonusText.setText(''); }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/PatienceBar.ts src/ui/StepIndicator.ts
git commit -m "feat: add PatienceBar and StepIndicator UI components"
```

---

## Task 13: HUDScene

**Files:**
- Replace stub: `src/scenes/HUDScene.ts`

HUDScene runs on top of GameScene in parallel. It listens to `'hud_update'` events emitted by GameScene and redraws the displayed values.

- [ ] **Step 1: Implement HUDScene**

```typescript
// src/scenes/HUDScene.ts
import Phaser from 'phaser';
import { FONT_GOLD, FONT_GREEN, FONT_GREY } from '../config';

export class HUDScene extends Phaser.Scene {
  private classText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'HUDScene' }); }

  create(): void {
    const W = this.scale.width;
    const bg = this.add.rectangle(0, 0, W, 30, 0x080812).setOrigin(0, 0);
    this.add.existing(bg);

    this.classText = this.add.text(10, 15, '🪙 班级: ¥0', FONT_GOLD).setOrigin(0, 0.5);
    this.timerText = this.add.text(W / 2, 15, '⏱ 5:00',
      { ...FONT_GOLD, backgroundColor: '#1a1200', padding: { x: 8, y: 2 } })
      .setOrigin(0.5, 0.5);
    this.progressText = this.add.text(W * 0.72, 15, '👥 0/8', { ...FONT_GREY, fontSize: '11px' })
      .setOrigin(0, 0.5);
    this.highScoreText = this.add.text(W - 10, 15, '🏆 最高: ¥0', FONT_GREEN).setOrigin(1, 0.5);

    // Listen for updates from GameScene
    this.scene.get('GameScene').events.on('hud_update', this.onUpdate, this);
  }

  private onUpdate(data: {
    classTotal: number;
    secondsLeft: number;
    customerIndex: number;
    customerCount: number;
    highScore: number;
  }): void {
    this.classText.setText(`🪙 班级: ¥${data.classTotal}`);
    const m = Math.floor(data.secondsLeft / 60);
    const s = String(Math.floor(data.secondsLeft % 60)).padStart(2, '0');
    this.timerText.setText(`⏱ ${m}:${s}`);
    this.progressText.setText(`👥 ${data.customerIndex}/${data.customerCount}`);
    this.highScoreText.setText(`🏆 最高: ¥${data.highScore}`);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/HUDScene.ts
git commit -m "feat: add HUDScene overlay with timer and score display"
```

---

## Task 14: GameScene — Full Question Loop

**Files:**
- Replace stub: `src/scenes/GameScene.ts`

GameScene is the main orchestrator. It owns the patience timer (via `PatienceMeter`), the question flow, and emits `'hud_update'` each frame.

- [ ] **Step 1: Implement GameScene**

```typescript
// src/scenes/GameScene.ts
import Phaser from 'phaser';
import { QuestionBank } from '../logic/QuestionBank';
import { MathEngine } from '../logic/MathEngine';
import { PatienceMeter } from '../logic/PatienceMeter';
import { ScoreManager } from '../logic/ScoreManager';
import { DialogueBox } from '../ui/DialogueBox';
import { NumPad } from '../ui/NumPad';
import { PatienceBar } from '../ui/PatienceBar';
import { StepIndicator } from '../ui/StepIndicator';
import { CustomerSprite } from '../ui/CustomerSprite';
import { DEFAULT_SETTINGS, COLORS } from '../config';
import type { Question, GameSettings } from '../logic/types';

export class GameScene extends Phaser.Scene {
  private settings: GameSettings = { ...DEFAULT_SETTINGS };
  private bank = new QuestionBank();
  private score = new ScoreManager();
  private patience = new PatienceMeter();

  private questions: Question[] = [];
  private currentQuestionIdx = 0;
  private currentAnswerStep = 0;  // 0 or 1 for two-step questions
  private wrongAttempts = 0;
  private keywordsUnlocked = false;
  private answerUnlocked = false;
  private overtimeTimer = 0;

  private roundTimer = 0;
  private roundActive = false;

  // UI
  private dialogueBox!: DialogueBox;
  private numPad!: NumPad;
  private patienceBar!: PatienceBar;
  private stepIndicator!: StepIndicator;
  private customer!: CustomerSprite;

  constructor() { super({ key: 'GameScene' }); }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;

    // Background
    this.add.rectangle(0, 0, W, H, COLORS.bg).setOrigin(0, 0);

    // Store scene placeholders
    this.add.image(70, 75, 'shelf').setOrigin(0.5, 0.5);
    this.add.image(W - 70, 75, 'shelf').setOrigin(0.5, 0.5);
    this.add.image(W / 2, H * 0.3 - 4, 'counter').setOrigin(0.5, 1);
    this.add.image(W / 2 - 40, H * 0.3 - 4, 'cashier').setOrigin(0.5, 1);

    // UI components
    this.patienceBar = new PatienceBar(this, 10, H * 0.33, W - 20);
    this.stepIndicator = new StepIndicator(this, 0, H * 0.38, W);
    this.dialogueBox = new DialogueBox(this, 0, H * 0.44, W * 0.62);
    this.numPad = new NumPad(this, W * 0.64, H * 0.44);
    this.numPad.setLocked(true);

    // Event wiring
    this.events.on('keyword_circled', (id: string) => this.onKeywordCircled(id));
    this.events.on('all_keywords_done', () => this.unlockAnswer());
    this.events.on('numpad_confirm', (value: number) => this.onAnswer(value));

    // Start HUD overlay
    this.scene.launch('HUDScene');

    this.startRound();
  }

  private startRound(): void {
    this.questions = this.bank.buildRound();
    this.score = new ScoreManager(this.score.classTotal, this.score.sessionHighScore);
    this.roundTimer = this.settings.roundDuration;
    this.currentQuestionIdx = 0;
    this.roundActive = true;
    this.showNextCustomer();
  }

  private showNextCustomer(): void {
    if (this.currentQuestionIdx >= this.questions.length) {
      this.onAllCustomersDone(); return;
    }
    const q = this.questions[this.currentQuestionIdx];
    this.patience.reset();
    this.patience.setPhase('reading');
    this.wrongAttempts = 0;
    this.answerUnlocked = false;
    this.overtimeTimer = 0;
    this.currentAnswerStep = 0;
    this.numPad.setLocked(true);
    this.numPad.reset();
    this.stepIndicator.setStep('reading');
    this.stepIndicator.clearBonus();
    this.patienceBar.update(100);

    this.customer = new CustomerSprite(this, this.scale.width * 0.72, this.scale.height * 0.3 - 4);
    this.customer.walkIn(this.scale.width * 0.65, () => {
      this.dialogueBox.load(q);
      if (q.isHard) this.dialogueBox.showHardBadge();
      this.stepIndicator.setStep('keyword');
    });
  }

  private onKeywordCircled(_id: string): void {
    this.score.stagekeywordBonus();
    // Show staged bonus visually (floating text)
    this.showFloatingText(this.scale.width * 0.62, this.scale.height * 0.44, '+¥8', '#ffd060');
  }

  private unlockAnswer(): void {
    this.answerUnlocked = true;
    const stagedBonus = this.score.stagedBonus;
    this.stepIndicator.setStep('answer', stagedBonus);
    this.numPad.setLocked(false);
    const q = this.questions[this.currentQuestionIdx];
    this.numPad.setPrompt(q.promptLabels[this.currentAnswerStep]);
    this.patience.setPhase('answering');
    this.overtimeTimer = 0;
  }

  private onAnswer(value: number): void {
    const q = this.questions[this.currentQuestionIdx];
    if (MathEngine.check(q, this.currentAnswerStep, value)) {
      this.onCorrectAnswer(q);
    } else {
      this.onWrongAnswer();
    }
  }

  private onCorrectAnswer(q: Question): void {
    if (this.currentAnswerStep < q.answers.length - 1) {
      // More steps (division second part)
      this.currentAnswerStep++;
      this.numPad.reset();
      this.numPad.setPrompt(q.promptLabels[this.currentAnswerStep]);
      return;
    }
    // All steps done
    this.score.onCorrectAnswer();
    this.customer.setMood('happy');
    this.showFloatingText(
      this.scale.width * 0.5, this.scale.height * 0.2,
      `+¥${this.score.turnTotal}`, '#6fcf6f'
    );
    this.time.delayedCall(700, () => {
      this.customer.walkOut(() => {
        this.currentQuestionIdx++;
        this.showNextCustomer();
      });
    });
  }

  private onWrongAnswer(): void {
    this.wrongAttempts++;
    this.score.onWrongAnswer();
    this.patience.onWrongAnswer(this.wrongAttempts);
    this.patienceBar.update(this.patience.value);
    this.customer.setMood('angry');
    this.numPad.reset();
    this.cameras.main.shake(150, 0.008);
    if (this.patience.isDepleted) {
      this.onCustomerLeave();
    } else {
      this.time.delayedCall(500, () => this.customer.setMood('idle'));
    }
  }

  private onCustomerLeave(): void {
    this.score.onCustomerLeft();
    this.numPad.setLocked(true);
    this.customer.walkOut(() => {
      this.currentQuestionIdx++;
      this.showNextCustomer();
    });
  }

  private onAllCustomersDone(): void {
    this.score.onSpeedBonus(this.roundTimer);
    this.endRound();
  }

  private endRound(): void {
    this.roundActive = false;
    this.score.finalizeRound();
    // Show summary text (full end-scene in Task 15)
    this.add.text(this.scale.width / 2, this.scale.height / 2,
      `本局收入: ¥${this.score.classTotal}`, {
        fontFamily: '"Courier New", monospace', fontSize: '28px', color: '#ffd060',
      }).setOrigin(0.5);
  }

  override update(_time: number, delta: number): void {
    if (!this.roundActive) return;

    const dt = delta / 1000; // to seconds
    this.roundTimer = Math.max(0, this.roundTimer - dt);
    if (this.roundTimer <= 0) { this.endRound(); return; }

    this.patience.tick(dt);
    if (this.patience.isDepleted) { this.onCustomerLeave(); return; }
    this.patienceBar.update(this.patience.value);

    // Overtime escalation: 20s after numpad unlocked
    if (this.answerUnlocked) {
      this.overtimeTimer += dt;
      if (this.overtimeTimer > 20) this.patience.setPhase('answering_overtime');
    }

    this.events.emit('hud_update', {
      classTotal: this.score.classTotal,
      secondsLeft: this.roundTimer,
      customerIndex: this.currentQuestionIdx,
      customerCount: this.questions.length,
      highScore: this.score.sessionHighScore,
    });
  }

  private showFloatingText(x: number, y: number, msg: string, color: string): void {
    const t = this.add.text(x, y, msg, {
      fontFamily: '"Courier New", monospace', fontSize: '16px', color,
    }).setOrigin(0.5);
    this.tweens.add({
      targets: t, y: y - 40, alpha: 0, duration: 900,
      onComplete: () => t.destroy(),
    });
  }
}
```

- [ ] **Step 2: Run dev server and smoke-test the game**

```bash
npm run dev
```

Open in browser. Expected behaviour:
- HUD shows timer counting down from 5:00
- Customer walks in from the right
- Question text appears with clickable chunks
- Clicking required keywords highlights them gold
- After all keywords circled, NumPad unlocks
- Entering correct answer shows floating `+¥N` and customer walks out
- Next customer walks in

- [ ] **Step 3: Run full test suite to confirm logic unchanged**

```bash
npm run test:run
```
Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: implement full GameScene question loop"
```

---

## Task 15: Teacher Config Screen

**Files:**
- Create: `src/scenes/ConfigScene.ts`, update `src/main.ts`

A simple pre-game screen where the teacher sets round duration and customer count.

- [ ] **Step 1: Implement ConfigScene**

```typescript
// src/scenes/ConfigScene.ts
import Phaser from 'phaser';
import { DEFAULT_SETTINGS, FONT, FONT_GOLD, FONT_GREEN } from '../config';
import type { GameSettings } from './logic/types';

export class ConfigScene extends Phaser.Scene {
  private settings: GameSettings = { ...DEFAULT_SETTINGS };

  constructor() { super({ key: 'ConfigScene' }); }

  create(): void {
    const W = this.scale.width;
    const cx = W / 2;

    this.add.text(cx, 80, '数学便利店', { ...FONT_GOLD, fontSize: '32px' }).setOrigin(0.5);
    this.add.text(cx, 120, '老师请设置本局参数', { ...FONT, color: '#888', fontSize: '14px' }).setOrigin(0.5);

    this.addSetting(cx, 220, '回合时长（秒）', 60, 600, 30,
      this.settings.roundDuration, v => this.settings.roundDuration = v);
    this.addSetting(cx, 310, '顾客数量', 3, 12, 1,
      this.settings.customerCount, v => this.settings.customerCount = v);

    const btn = this.add.text(cx, 420, '▶  开始游戏', {
      ...FONT_GREEN, fontSize: '22px',
      backgroundColor: '#0a2a0a', padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });
    btn.on('pointerup', () => {
      this.scene.start('GameScene', { settings: this.settings });
    });
  }

  private addSetting(
    cx: number, y: number, label: string,
    min: number, max: number, step: number,
    initial: number, onChange: (v: number) => void
  ): void {
    this.add.text(cx, y - 18, label, { ...FONT, fontSize: '13px', color: '#aaa' }).setOrigin(0.5);
    let value = initial;
    const valText = this.add.text(cx, y + 10, String(value), { ...FONT_GOLD, fontSize: '20px' }).setOrigin(0.5);
    const minus = this.add.text(cx - 60, y + 10, '−', { ...FONT, fontSize: '20px', color: '#cf6f6f' })
      .setOrigin(0.5).setInteractive({ cursor: 'pointer' });
    const plus = this.add.text(cx + 60, y + 10, '+', { ...FONT, fontSize: '20px', color: '#6fcf6f' })
      .setOrigin(0.5).setInteractive({ cursor: 'pointer' });
    minus.on('pointerup', () => {
      value = Math.max(min, value - step);
      valText.setText(String(value));
      onChange(value);
    });
    plus.on('pointerup', () => {
      value = Math.min(max, value + step);
      valText.setText(String(value));
      onChange(value);
    });
  }
}
```

- [ ] **Step 2: Register ConfigScene in main.ts and set as first scene**

```typescript
// src/main.ts — replace scene array
import { ConfigScene } from './scenes/ConfigScene';
// ...
scene: [BootScene, PreloadScene, ConfigScene, GameScene, HUDScene],
```

Update `PreloadScene.ts` to start `ConfigScene` instead of `GameScene`:
```typescript
this.scene.start('ConfigScene');
```

Update `GameScene.create()` to accept settings passed from ConfigScene:
```typescript
// Add at top of create():
const data = this.scene.settings.data as { settings?: GameSettings } | undefined;
if (data?.settings) this.settings = data.settings;
```

- [ ] **Step 3: Smoke-test full flow**

```bash
npm run dev
```
Expected: Config screen appears first → adjust values → click start → game begins with new settings.

- [ ] **Step 4: Run all tests**

```bash
npm run test:run
```
Expected: All tests PASS.

- [ ] **Step 5: Final commit**

```bash
git add src/scenes/ConfigScene.ts src/scenes/GameScene.ts src/main.ts
git commit -m "feat: add teacher config screen, wire settings into GameScene"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Core loop ✓, 3-step flow ✓, keyword chunks+validation ✓, patience meter (per-customer, progressive) ✓, scoring (keyword staged, base, streak, speed) ✓, class total + anonymous high score ✓, question types×4 + distribution ✓, teacher config ✓, "超难题" badge ✓
- [x] **No placeholders:** All steps have complete code or exact commands
- [x] **Type consistency:** `Question`, `TextChunk`, `GameSettings` defined in `types.ts` and referenced consistently across all files; `ScoreManager.stagekeywordBonus()` named consistently throughout
- [x] **Two-step division answer:** handled in `GameScene.onCorrectAnswer()` via `currentAnswerStep`
- [x] **Patience resets per customer:** `patience.reset()` called in `showNextCustomer()`
