# UI 视觉重设计实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将游戏 UI 从暗色 demo 风格改造为星露谷物语式暖色木质风格，分三阶段推进，每阶段完成即可运行。

**Architecture:** Phase 1 新建 `UITheme.ts` 统一所有颜色/字体 token，各 UI 文件切换引用；Phase 2 逐个组件改造为 C 型木框 + 立体按钮；Phase 3 添加 tween 动效。所有改动在现有 Phaser Container 架构上叠加，不改逻辑代码。

**Tech Stack:** Phaser 3.90, TypeScript, Vite, Vitest, Google Fonts (Noto Serif SC)

---

## 文件结构

| 操作 | 文件 | 变更内容 |
|---|---|---|
| 新建 | `src/ui/UITheme.ts` | 全部颜色/字体 token + `drawWoodFrame` 工具函数 |
| 新建 | `src/ui/UITheme.test.ts` | UITheme 单元测试 |
| 修改 | `index.html` | 预加载 Noto Serif SC |
| 修改 | `src/config.ts` | 删除 COLORS/FONT* 常量，保留 DEFAULT_SETTINGS |
| 修改 | `src/scenes/ConfigScene.ts` | 引用 UITheme |
| 修改 | `src/scenes/HUDScene.ts` | 引用 UITheme（Phase 1 颜色；Phase 2 完整重绘） |
| 修改 | `src/ui/PatienceBar.ts` | 引用 UITheme（Phase 1 颜色；Phase 2 凹陷轨道） |
| 修改 | `src/ui/StepIndicator.ts` | 引用 UITheme（Phase 1 颜色；Phase 2 tab 凸起样式） |
| 修改 | `src/ui/DialogueBox.ts` | Phase 1 颜色；Phase 2 木框 + 铆钉 + 新 chunk 样式 |
| 修改 | `src/ui/NumPad.ts` | Phase 1 颜色；Phase 2 木框 + 立体按钮 + 按压 tween |
| 修改 | `src/scenes/GameScene.ts` | Phase 1 颜色；Phase 3 动效调用 |

---

## ─── PHASE 1：地基 ───

### Task 1：新建 UITheme.ts

**Files:**
- Create: `src/ui/UITheme.ts`
- Create: `src/ui/UITheme.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
// src/ui/UITheme.test.ts
import { describe, it, expect, vi } from 'vitest';
import { COLORS, COLOR_STR, FONT, SPACING, drawWoodFrame } from './UITheme';
import type { GameObjects } from 'phaser';

describe('UITheme', () => {
  it('COLORS contains all required tokens', () => {
    expect(COLORS.bgWarm).toBeDefined();
    expect(COLORS.woodDark).toBeDefined();
    expect(COLORS.nail).toBeDefined();
    expect(COLORS.hudBgTop).toBeDefined();
    expect(COLORS.keywordBg).toBeDefined();
  });

  it('FONT uses Noto Serif SC', () => {
    expect(FONT.fontFamily).toContain('Noto Serif SC');
  });

  it('SPACING has required fields', () => {
    expect(SPACING.borderThick).toBe(4);
    expect(SPACING.nailSize).toBe(7);
    expect(SPACING.panelPad).toBe(10);
  });

  it('drawWoodFrame calls graphics primitives without throwing', () => {
    const g = {
      fillStyle: vi.fn(),
      fillRect: vi.fn(),
      lineStyle: vi.fn(),
      lineBetween: vi.fn(),
      fillRoundedRect: vi.fn(),
    } as unknown as GameObjects.Graphics;
    expect(() => drawWoodFrame(g, 0, 0, 200, 100)).not.toThrow();
    expect(g.fillRect).toHaveBeenCalledTimes(2); // outer + inner
    expect(g.fillRoundedRect).toHaveBeenCalledTimes(4); // 4 nails
  });
});
```

- [ ] **Step 2: 运行确认失败**

```bash
npm run test:run -- src/ui/UITheme.test.ts
```
预期：FAIL（模块不存在）

- [ ] **Step 3: 创建 UITheme.ts**

```typescript
// src/ui/UITheme.ts
import type Phaser from 'phaser';

// ── 数字颜色（Phaser fillStyle 用） ──────────────────────────
export const COLORS = {
  bgWarm:        0xfdf6e8,
  woodDark:      0x7a4018,
  woodMid:       0xc07830,
  woodLight:     0xf0d8a0,
  woodShadow:    0x7a4818,
  woodHighlight: 0xf8eecc,
  parchmentTop:  0xfffcf0,
  parchmentBot:  0xfdf4d8,
  inkDark:       0x3a2010,
  inkMid:        0x7a5a30,
  inkLight:      0xb09060,
  goldNum:       0xffd060,
  goldBorder:    0xd4900a,
  keywordBg:     0xfff3a0,
  green:         0x70b030,
  greenLight:    0xb0e070,
  red:           0xcc4040,
  hudBgTop:      0x3d1f00,
  hudBgBot:      0x2a1200,
  hudBorder:     0x6b3a1a,
  nail:          0x4a2800,
  timerBg:       0x5a2800,
  timerBorder:   0xc8860a,
  displayBg:     0x3a1800,
  displayBorder: 0x6a3010,
} as const;

// ── 字符串颜色（Phaser Text style 用） ──────────────────────
export const COLOR_STR = {
  inkDark:  '#3a2010',
  inkMid:   '#7a5a30',
  inkLight: '#b09060',
  gold:     '#ffd060',
  green:    '#a8e87a',
  warmWhite:'#ffe0a0',
  red:      '#e06050',
  timerStr: '#ffe080',
} as const;

// ── 字体 ────────────────────────────────────────────────────
export const FONT = {
  fontFamily: '"Noto Serif SC", serif',
  color: COLOR_STR.inkDark,
} as const;

export const FONT_GOLD  = { ...FONT, color: COLOR_STR.gold     } as const;
export const FONT_GREEN = { ...FONT, color: COLOR_STR.green    } as const;
export const FONT_GREY  = { ...FONT, color: COLOR_STR.inkLight } as const;
export const FONT_WARM  = { ...FONT, color: COLOR_STR.warmWhite} as const;

// ── 尺寸 ────────────────────────────────────────────────────
export const SPACING = {
  panelPad:    10,
  nailSize:    7,
  borderThick: 4,
} as const;

// ── 工具：画木框 ─────────────────────────────────────────────
// 在 Graphics 对象上绘制 C 型木框（含四角铆钉）
// 调用方负责创建 Graphics 并 add 到场景
export function drawWoodFrame(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
): void {
  const bt = SPACING.borderThick;
  const ns = SPACING.nailSize;

  // 外层木色
  g.fillStyle(COLORS.woodDark);
  g.fillRect(x, y, w, h);

  // 内层羊皮纸底色
  g.fillStyle(COLORS.parchmentTop);
  g.fillRect(x + bt, y + bt, w - bt * 2, h - bt * 2);

  // 内边高光（左上）
  g.lineStyle(1, 0xe8d090, 1);
  g.lineBetween(x + bt, y + bt,     x + w - bt, y + bt);
  g.lineBetween(x + bt, y + bt,     x + bt,     y + h - bt);

  // 内边阴影（右下）
  g.lineStyle(1, 0xc8a060, 1);
  g.lineBetween(x + bt,     y + h - bt, x + w - bt, y + h - bt);
  g.lineBetween(x + w - bt, y + bt,     x + w - bt, y + h - bt);

  // 四角铆钉
  g.fillStyle(COLORS.nail);
  const no = bt + 3; // nail offset from edge
  const nails: [number, number][] = [
    [x + no,         y + no        ],
    [x + w - no - ns, y + no        ],
    [x + no,         y + h - no - ns],
    [x + w - no - ns, y + h - no - ns],
  ];
  for (const [nx, ny] of nails) {
    g.fillRoundedRect(nx, ny, ns, ns, 2);
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npm run test:run -- src/ui/UITheme.test.ts
```
预期：全部 PASS

- [ ] **Step 5: 提交**

```bash
git add src/ui/UITheme.ts src/ui/UITheme.test.ts
git commit -m "feat: add UITheme design tokens and drawWoodFrame utility"
```

---

### Task 2：更新 index.html 预加载字体

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 在 `<head>` 第一行之后插入以下两行**

找到：
```html
<head>
```

改为：
```html
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap" rel="stylesheet">
```

- [ ] **Step 2: 运行 dev server 确认字体加载**

```bash
npm run dev
```
打开浏览器，打开 DevTools → Network，过滤 `fonts.googleapis`，确认请求 200。

- [ ] **Step 3: 提交**

```bash
git add index.html
git commit -m "feat: preload Noto Serif SC from Google Fonts"
```

---

### Task 3：清理 config.ts，各文件切换到 UITheme

**Files:**
- Modify: `src/config.ts`
- Modify: `src/scenes/ConfigScene.ts`
- Modify: `src/scenes/HUDScene.ts`
- Modify: `src/ui/PatienceBar.ts`
- Modify: `src/ui/StepIndicator.ts`
- Modify: `src/ui/DialogueBox.ts`
- Modify: `src/ui/NumPad.ts`
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: 替换 config.ts**

```typescript
// src/config.ts
import type { GameSettings } from './logic/types';

export const DEFAULT_SETTINGS: GameSettings = {
  roundDuration: 300,
  customerCount: 8,
};
```

（删除原有 COLORS、FONT、FONT_GOLD、FONT_GREEN、FONT_GREY 常量——它们已迁入 UITheme.ts）

- [ ] **Step 2: 更新 ConfigScene.ts 导入**

将文件顶部：
```typescript
import { DEFAULT_SETTINGS, FONT, FONT_GOLD, FONT_GREEN } from '../config';
```
改为：
```typescript
import { DEFAULT_SETTINGS } from '../config';
import { FONT, FONT_GOLD, FONT_GREEN, COLORS } from '../ui/UITheme';
```

同时将 `create()` 里的背景矩形颜色 `0x0a0a1a` 改为 `COLORS.hudBgTop`：
```typescript
this.add.rectangle(0, 0, W, H, COLORS.hudBgTop).setOrigin(0, 0);
```

- [ ] **Step 3: 更新 HUDScene.ts 导入**

将：
```typescript
import { FONT_GOLD, FONT_GREEN, FONT_GREY } from '../config';
```
改为：
```typescript
import { FONT_GOLD, FONT_GREEN, FONT_GREY, COLORS } from '../ui/UITheme';
```

将 HUD 背景矩形颜色 `0x080812` 改为 `COLORS.hudBgTop`：
```typescript
this.add.rectangle(0, 0, W, 52, COLORS.hudBgTop).setOrigin(0, 0);
```

将计时器 `backgroundColor: '#1a1200'` 改为 `backgroundColor: '#5a2800'`（使用 `COLOR_STR` 暂不需要，直接写）。

- [ ] **Step 4: 更新 PatienceBar.ts 导入**

将：
```typescript
import { FONT_GREY } from '../config';
```
改为：
```typescript
import { FONT_GREY, COLORS } from './UITheme';
```

将 track 颜色 `0x1a1a1a` 改为 `COLORS.woodDark`，fill 颜色保留（update() 里已经按逻辑设置颜色，暂不变）。

- [ ] **Step 5: 更新 StepIndicator.ts 导入**

将文件顶部：
```typescript
import Phaser from 'phaser';
```
后加：
```typescript
import { FONT, COLORS, COLOR_STR } from './UITheme';
```

替换全部 `fontFamily: '"Courier New", monospace'` 为 `...FONT`。

将背景颜色 `0x1a120a` → `COLORS.bgWarm`，`0x0a1a0a` → `0xf0f8e8`，`0x1a1400` → `COLORS.goldNum`（用作激活 tab 背景），并更新对应文字颜色：
- 已完成：`'#5fcf6f'` → `COLOR_STR.green`
- 激活：`'#ffd060'` → `COLOR_STR.gold`
- 未到达：`'#444'` → `COLOR_STR.inkLight`

- [ ] **Step 6: 更新 DialogueBox.ts 导入**

将：
```typescript
import { FONT, FONT_GOLD, FONT_GREY } from '../config';
```
改为：
```typescript
import { FONT, FONT_GOLD, FONT_GREY, COLORS } from './UITheme';
```

将背景矩形颜色 `0x1a120a` → `COLORS.parchmentTop`，stroke `0x3a2a18` → `COLORS.woodDark`。

将 chunk 正常背景 `0x181818` → `COLORS.bgWarm`，stroke `0x333344` → `0xd4b870`。

将 chunk 灰色背景 `0x101008` → `0xf5edd8`，stroke `0x1a1a10` → `0xe8d8a0`。

将圈选后背景 `0x2a1a00` → `COLORS.keywordBg`，stroke 已正确为 `0xc89020`，保留。

- [ ] **Step 7: 更新 NumPad.ts 导入**

将：
```typescript
import { FONT } from '../config';
```
改为：
```typescript
import { FONT, FONT_WARM, COLORS, COLOR_STR } from './UITheme';
```

将 display panel 背景 `0x1a120a` → `COLORS.displayBg`，stroke `0x5a4030` → `COLORS.displayBorder`。

将按键背景 `0x1a1a2e` → `COLORS.bgWarm`，border `0x2a2a4a` → `0xc8a060`，文字颜色 `'#9f9fff'` → `COLOR_STR.inkDark`。

将删除键背景 `0x2a1a1a` → `0xf0c8b0`，border `0x4a2a2a` → `0xc07050`，文字 `'#cf6f6f'` → `COLOR_STR.red`。

将确认键背景 `0x1a3a1a` → `COLORS.green`，border `0x3a6a3a` → `0x3a6010`，文字 `'#6fcf6f'` → `'#1a4000'`。

将 displayText（输入值）颜色 `'#ffffff'` → `COLOR_STR.warmWhite`，promptText 颜色 `'#c8a070'` → `COLOR_STR.inkMid`。

- [ ] **Step 8: 更新 GameScene.ts 背景颜色**

将：
```typescript
this.add.rectangle(0, 0, W, H, 0x1a120a).setOrigin(0, 0);
```
改为：
```typescript
this.add.rectangle(0, 0, W, H, COLORS.bgWarm).setOrigin(0, 0);
```

（在文件顶部加 `import { COLORS, FONT, FONT_GOLD, COLOR_STR } from '../ui/UITheme';`，同时删除原 config.ts 里 FONT*/COLORS 相关导入）

将分隔条颜色 `0x5a3a10` → `COLORS.woodDark`。

将 `endRound()` 里 overlay 背景 `0x08080f` → `COLORS.hudBgTop`，stroke `0x2a2a4a` → `COLORS.woodDark`；`titleTxt` 颜色 `'#666'` → `COLOR_STR.inkLight`；按钮背景/颜色参考 ConfigScene 同款处理（暖色）。

将 `showFloat()` 里 fontFamily 改为 `FONT.fontFamily`。

- [ ] **Step 9: 运行游戏确认视觉变化**

```bash
npm run dev
```
打开浏览器，验证：
- 游戏背景变暖色
- 所有文字变成宋体（Noto Serif SC）
- 无控制台报错

- [ ] **Step 10: 提交**

```bash
git add src/config.ts src/scenes/ConfigScene.ts src/scenes/HUDScene.ts \
        src/scenes/GameScene.ts src/ui/PatienceBar.ts \
        src/ui/StepIndicator.ts src/ui/DialogueBox.ts src/ui/NumPad.ts
git commit -m "feat(phase1): apply warm color palette and Noto Serif SC across all UI"
```

---

## ─── PHASE 2：C 型木框组件改造 ───

### Task 4：改造 DialogueBox（木框 + 铆钉 + 新 chunk 样式）

**Files:**
- Modify: `src/ui/DialogueBox.ts`

- [ ] **Step 1: 完整替换 DialogueBox.ts**

```typescript
// src/ui/DialogueBox.ts
import Phaser from 'phaser';
import type { Question, TextChunk } from '../logic/types';
import { KeywordValidator } from '../logic/KeywordValidator';
import { FONT, FONT_GREY, COLORS, COLOR_STR, SPACING, drawWoodFrame } from './UITheme';

const FONT_SIZE   = '24px';
const FIXED_CHUNK_H = 58;
const CHUNK_PAD_X   = 10;
const CHUNK_PAD_Y   = 10;

export class DialogueBox extends Phaser.GameObjects.Container {
  private circledIds: string[] = [];
  private question!: Question;
  private frameGraphics!: Phaser.GameObjects.Graphics;
  private boxW: number;
  private boxH = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number) {
    super(scene, x, y);
    this.boxW = width;
    this.frameGraphics = scene.add.graphics();
    this.add(this.frameGraphics);
    scene.add.existing(this);
  }

  load(question: Question): void {
    this.question = question;
    this.circledIds = [];

    // 清除旧 chunk（保留 frameGraphics）
    while (this.list.length > 1) {
      (this.list[1] as Phaser.GameObjects.GameObject).destroy();
    }

    const bt = SPACING.borderThick;
    const innerX = bt + SPACING.panelPad;
    let startY = bt + SPACING.panelPad;

    // 超难题 badge
    if (question.isHard) {
      const badge = this.scene.add.text(innerX, startY, '⚡ 超难题！', {
        ...FONT, fontSize: '18px', color: '#ffc060',
        backgroundColor: '#5a1a00', padding: { x: 8, y: 4 },
      });
      this.add(badge);
      startY += 38;
    }

    // "顾客说：" 标签
    const speakerLabel = this.scene.add.text(innerX, startY, '💬 顾客说：', {
      ...FONT_GREY, fontSize: '14px',
    });
    this.add(speakerLabel);
    startY += 26;

    // chunk 布局
    let cursorX = innerX;
    let cursorY = startY;
    const maxWidth = this.boxW - bt * 2 - SPACING.panelPad * 2;

    for (const chk of question.chunks) {
      const chunkContainer = this.buildChunk(chk);
      const chunkW = (chunkContainer as unknown as { chunkWidth: number }).chunkWidth;

      if (cursorX + chunkW > innerX + maxWidth && cursorX > innerX) {
        cursorX = innerX;
        cursorY += FIXED_CHUNK_H + 6;
      }

      chunkContainer.setPosition(cursorX, cursorY);
      this.add(chunkContainer);
      cursorX += chunkW + 3;
    }

    const totalH = Math.max(120, cursorY - bt - SPACING.panelPad + FIXED_CHUNK_H + bt + SPACING.panelPad + 8);
    this.boxH = totalH;
    this.redrawFrame();
  }

  private redrawFrame(): void {
    this.frameGraphics.clear();
    drawWoodFrame(this.frameGraphics, 0, 0, this.boxW, this.boxH);
  }

  private buildChunk(chk: TextChunk): Phaser.GameObjects.Container {
    const scene = this.scene;
    const isClickable = chk.clickable;
    const label = scene.add.text(CHUNK_PAD_X, 0, chk.text, {
      ...(isClickable ? FONT : FONT_GREY), fontSize: FONT_SIZE,
    });

    const w = label.width + CHUNK_PAD_X * 2;
    const h = FIXED_CHUNK_H;
    label.setY((h - label.height) / 2);

    const g = scene.add.graphics();
    if (isClickable) {
      // 未圈选：浅木色底 + 细边
      g.fillStyle(COLORS.bgWarm);
      g.fillRect(0, 0, w, h);
      g.lineStyle(1, 0xd4b870);
      g.strokeRect(0, 0, w, h);
    } else {
      // 非关键词：更浅的底
      g.fillStyle(0xf5edd8);
      g.fillRect(0, 0, w, h);
    }

    const container = scene.add.container(0, 0, [g, label]);
    (container as unknown as { chunkWidth: number }).chunkWidth = w;

    if (isClickable) {
      g.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
      g.on('pointerup', () => this.onChunkTap(chk, g, label, container, w, h));
    }
    return container;
  }

  private onChunkTap(
    chk: TextChunk,
    g: Phaser.GameObjects.Graphics,
    label: Phaser.GameObjects.Text,
    container: Phaser.GameObjects.Container,
    w: number, h: number,
  ): void {
    if (this.circledIds.includes(chk.id)) return;

    if (KeywordValidator.isValidKeyword(this.question, chk.id)) {
      this.circledIds.push(chk.id);

      // 圈选样式：黄色底 + 立体边框
      g.clear();
      g.fillStyle(COLORS.keywordBg);
      g.fillRect(0, 0, w, h);
      // 高光（左上）
      g.lineStyle(2, 0xf0d860);
      g.lineBetween(0, 0, w, 0);
      g.lineBetween(0, 0, 0, h);
      // 阴影（右下）
      g.lineStyle(2, 0xb89020);
      g.lineBetween(0, h - 1, w, h - 1);
      g.lineBetween(w - 1, 0, w - 1, h);
      // drop shadow offset
      g.fillStyle(COLORS.nail, 0.25);
      g.fillRect(2, h, w, 2);

      label.setStyle({ ...FONT, fontSize: FONT_SIZE, color: COLOR_STR.inkDark, fontStyle: 'bold' });

      // 弹跳动画
      this.scene.tweens.add({
        targets: container,
        scaleX: { from: 1, to: 1.12 },
        scaleY: { from: 1, to: 1.12 },
        yoyo: true, duration: 100, ease: 'Back.easeOut',
      });

      this.scene.events.emit('keyword_circled', chk.id);

      if (KeywordValidator.allCircled(this.question, this.circledIds)) {
        this.scene.events.emit('all_keywords_done');
      }
    } else {
      // 误点：左右抖动
      this.scene.tweens.add({
        targets: g,
        x: { from: -4, to: 4 },
        yoyo: true, repeat: 2, duration: 40,
        onComplete: () => g.setX(0),
      });
    }
  }

  showHardBadge(): void { /* handled in load() */ }
}
```

- [ ] **Step 2: 运行游戏确认 DialogueBox 显示正确**

```bash
npm run dev
```
进入游戏，确认对话框有木框、铆钉，关键词点击后变金黄并弹跳，非关键词左右抖动。

- [ ] **Step 3: 提交**

```bash
git add src/ui/DialogueBox.ts
git commit -m "feat(phase2): rebuild DialogueBox with wood frame, nail corners, 3D keyword chips"
```

---

### Task 5：改造 NumPad（木框 + 立体按钮 + 按压动画）

**Files:**
- Modify: `src/ui/NumPad.ts`

- [ ] **Step 1: 完整替换 NumPad.ts**

```typescript
// src/ui/NumPad.ts
import Phaser from 'phaser';
import { FONT, FONT_WARM, FONT_GREY, COLORS, COLOR_STR, SPACING, drawWoodFrame } from './UITheme';

const KEY_W = 62;
const KEY_H = 50;
const GAP   = 6;
const KEY_LAYOUT = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['0', '',  '⌫'],
] as const;

export class NumPad extends Phaser.GameObjects.Container {
  private _value = '';
  private displayValueText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private _locked = false;
  private frameG!: Phaser.GameObjects.Graphics;

  // 缓存每个按键容器，用于 locked 状态视觉
  private keyContainers: Phaser.GameObjects.Container[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);

    const totalW = KEY_W * 3 + GAP * 2 + SPACING.borderThick * 2 + SPACING.panelPad * 2;
    const totalH = this.calcTotalHeight();

    this.frameG = scene.add.graphics();
    drawWoodFrame(this.frameG, 0, 0, totalW, totalH);
    this.add(this.frameG);

    const inner = SPACING.borderThick + SPACING.panelPad;
    this.buildDisplay(inner, inner, KEY_W * 3 + GAP * 2);
    this.buildKeys(inner, inner + 86 + GAP);
    this.buildConfirmKey(inner, inner + 86 + GAP + (KEY_H + GAP) * 4);
  }

  private calcTotalHeight(): number {
    const inner = SPACING.borderThick + SPACING.panelPad;
    return inner * 2 + 86 + GAP + (KEY_H + GAP) * 5 + KEY_H;
  }

  private buildDisplay(x: number, y: number, w: number): void {
    // 凹陷显示框
    const bg = this.scene.add.graphics();
    bg.fillStyle(COLORS.displayBg);
    bg.fillRect(x, y, w, 80);
    // 凹陷感：左/上暗，右/下亮
    bg.lineStyle(2, COLORS.displayBorder);
    bg.lineBetween(x, y,     x + w, y);
    bg.lineBetween(x, y,     x,     y + 80);
    bg.lineStyle(2, 0x8a5030);
    bg.lineBetween(x, y + 80, x + w, y + 80);
    bg.lineBetween(x + w, y, x + w, y + 80);
    this.add(bg);

    this.promptText = this.scene.add.text(x + 8, y + 8, '', {
      ...FONT_GREY, fontSize: '14px', color: COLOR_STR.inkLight,
    });
    const divider = this.scene.add.graphics();
    divider.lineStyle(1, COLORS.displayBorder);
    divider.lineBetween(x + 4, y + 34, x + w - 4, y + 34);

    this.displayValueText = this.scene.add.text(x + 8, y + 38, '_', {
      ...FONT_WARM, fontSize: '30px',
    });
    this.add([this.promptText, divider, this.displayValueText]);
  }

  private buildKeys(startX: number, startY: number): void {
    KEY_LAYOUT.forEach((row, ri) => {
      row.forEach((key, ci) => {
        if (key === '') return;
        const isWide = key === '0';
        const w  = isWide ? KEY_W * 2 + GAP : KEY_W;
        const kx = isWide ? startX : startX + ci * (KEY_W + GAP);
        const ky = startY + ri * (KEY_H + GAP);
        const c  = this.buildKey3D(kx, ky, w, KEY_H, key, key === '⌫', false);
        this.keyContainers.push(c);
        this.add(c);
      });
    });
  }

  private buildConfirmKey(startX: number, startY: number): void {
    const w = KEY_W * 3 + GAP * 2;
    const c = this.buildKey3D(startX, startY, w, KEY_H, '✓ 确认', false, true);
    this.keyContainers.push(c);
    this.add(c);
  }

  private buildKey3D(
    kx: number, ky: number, w: number, h: number,
    label: string, isDelete: boolean, isConfirm: boolean,
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(kx, ky);

    const g = this.scene.add.graphics();

    // 阴影（右下偏移 2px）
    const shadowColor = isConfirm ? 0x1a3000 : isDelete ? 0x3a1000 : 0x3a1800;
    g.fillStyle(shadowColor);
    g.fillRect(2, 2, w, h);

    // 键体
    const bodyColor = isConfirm ? COLORS.green : isDelete ? 0xc07850 : 0xd4b070;
    g.fillStyle(bodyColor);
    g.fillRect(0, 0, w, h);

    // 高光（左上）
    const hlColor = isConfirm ? COLORS.greenLight : isDelete ? 0xf0c8a8 : COLORS.woodHighlight;
    g.lineStyle(2, hlColor);
    g.lineBetween(0, 0, w - 1, 0);
    g.lineBetween(0, 0, 0, h - 1);

    // 阴影边（右下）
    const sdColor = isConfirm ? 0x3a6010 : isDelete ? 0x7a3818 : COLORS.woodShadow;
    g.lineStyle(2, sdColor);
    g.lineBetween(0, h - 1, w, h - 1);
    g.lineBetween(w - 1, 0, w - 1, h);

    const textColor = isConfirm ? '#1a4000' : isDelete ? '#5a1800' : COLOR_STR.inkDark;
    const text = this.scene.add.text(w / 2, h / 2, label, {
      ...FONT, fontSize: isConfirm ? '20px' : '22px',
      color: textColor, fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([g, text]);

    // 交互
    g.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, w, h),
      Phaser.Geom.Rectangle.Contains,
    );
    g.on('pointerdown', () => {
      if (this._locked) return;
      this.scene.tweens.add({ targets: container, y: ky + 2, duration: 50, ease: 'Linear' });
    });
    g.on('pointerup', () => {
      if (this._locked) return;
      this.scene.tweens.add({ targets: container, y: ky, duration: 60, ease: 'Linear' });
      this.handleKey(label);
    });
    g.on('pointerout', () => {
      this.scene.tweens.add({ targets: container, y: ky, duration: 60, ease: 'Linear' });
    });

    return container;
  }

  private handleKey(key: string): void {
    if (key === '⌫') {
      this._value = this._value.slice(0, -1);
    } else if (key === '✓ 确认') {
      this.confirmCurrentValue();
      return;
    } else if (this._value.length < 4) {
      this._value += key;
    }
    this.refreshDisplay();
  }

  private confirmCurrentValue(): void {
    const num = parseInt(this._value, 10);
    if (!isNaN(num) && this._value.length > 0) {
      this.scene.events.emit('numpad_confirm', num);
    }
  }

  setPrompt(text: string): void {
    this.promptText.setText(text);
  }

  reset(): void {
    this._value = '';
    this.refreshDisplay();
  }

  setLocked(locked: boolean): void {
    this._locked = locked;
    this.setAlpha(locked ? 0.28 : 1);
  }

  private refreshDisplay(): void {
    this.displayValueText.setText(this._value.length > 0 ? this._value : '_');
  }
}
```

- [ ] **Step 2: 运行游戏确认 NumPad**

```bash
npm run dev
```
验证：数字键有立体感，点击有下压动画，确认键绿色，删除键暖红色，整体在木框内。

- [ ] **Step 3: 提交**

```bash
git add src/ui/NumPad.ts
git commit -m "feat(phase2): rebuild NumPad with wood frame and 3D press buttons"
```

---

### Task 6：改造 HUDScene（暖色深棕顶栏）

**Files:**
- Modify: `src/scenes/HUDScene.ts`

- [ ] **Step 1: 完整替换 HUDScene.ts**

```typescript
// src/scenes/HUDScene.ts
import Phaser from 'phaser';
import { FONT, FONT_GOLD, FONT_GREEN, FONT_GREY, COLORS, COLOR_STR } from '../ui/UITheme';

export class HUDScene extends Phaser.Scene {
  private classText!:     Phaser.GameObjects.Text;
  private timerText!:     Phaser.GameObjects.Text;
  private progressText!:  Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'HUDScene' }); }

  create(): void {
    const W = this.scale.width;

    // 顶栏背景（深棕渐变用两层矩形近似）
    this.add.rectangle(0, 0, W, 52, COLORS.hudBgTop).setOrigin(0, 0);
    this.add.rectangle(0, 40, W, 12, COLORS.hudBgBot).setOrigin(0, 0);
    // 底边装饰线
    this.add.rectangle(0, 51, W, 3, COLORS.hudBorder).setOrigin(0, 0);

    this.classText = this.add.text(16, 26, '🪙 班级: ¥0', { ...FONT_GOLD, fontSize: '20px' })
      .setOrigin(0, 0.5);

    // 计时器：凹陷显示框
    const timerBg = this.add.graphics();
    timerBg.fillStyle(COLORS.timerBg);
    timerBg.fillRect(W / 2 - 56, 10, 112, 32);
    timerBg.lineStyle(2, COLORS.timerBorder);
    timerBg.strokeRect(W / 2 - 56, 10, 112, 32);
    this.timerText = this.add.text(W / 2, 26, '⏱ 5:00', {
      ...FONT_GOLD, fontSize: '22px', color: COLOR_STR.timerStr,
    }).setOrigin(0.5, 0.5);

    this.progressText = this.add.text(W * 0.72, 26, '👥 0/8', {
      ...FONT_GREY, fontSize: '18px', color: COLOR_STR.inkLight,
    }).setOrigin(0, 0.5);

    this.highScoreText = this.add.text(W - 16, 26, '🏆 最高: ¥0', {
      ...FONT_GREEN, fontSize: '20px',
    }).setOrigin(1, 0.5);

    this.scene.get('GameScene').events.on('hud_update', this.onUpdate, this);
  }

  private onUpdate(data: {
    classTotal:    number;
    secondsLeft:   number;
    customerIndex: number;
    customerCount: number;
    highScore:     number;
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

- [ ] **Step 2: 运行游戏确认 HUD**

```bash
npm run dev
```
验证：顶栏深棕色，计时器有金色边框凹陷框，整体温暖。

- [ ] **Step 3: 提交**

```bash
git add src/scenes/HUDScene.ts
git commit -m "feat(phase2): warm dark-brown HUD with framed timer"
```

---

### Task 7：改造 PatienceBar（凹陷轨道 + 渐变填充）

**Files:**
- Modify: `src/ui/PatienceBar.ts`

- [ ] **Step 1: 完整替换 PatienceBar.ts**

```typescript
// src/ui/PatienceBar.ts
import Phaser from 'phaser';
import { FONT_GREY, COLORS, COLOR_STR } from './UITheme';

export class PatienceBar extends Phaser.GameObjects.Container {
  private fill:  Phaser.GameObjects.Rectangle;
  private track: Phaser.GameObjects.Rectangle;
  private trackW: number;
  private emoji: Phaser.GameObjects.Text;
  private _currentFill = COLORS.green;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number) {
    super(scene, x, y);
    scene.add.existing(this);

    // 暖色容器底
    const rowBg = scene.add.rectangle(0, 0, width, 32, 0xfdf0d8)
      .setOrigin(0, 0.5);
    // 底边分隔线
    const sep = scene.add.rectangle(0, 16, width, 2, 0xd4b870).setOrigin(0, 0.5);

    this.emoji = scene.add.text(6, 0, '😊', { fontSize: '22px' }).setOrigin(0, 0.5);
    scene.add.text(34, 0, '顾客耐心', { ...FONT_GREY, fontSize: '16px' }).setOrigin(0, 0.5);

    const trackX = 120;
    this.trackW = width - trackX - 8;

    // 凹陷感：用 Graphics 绘制轨道
    const trackG = scene.add.graphics();
    trackG.fillStyle(0xe0c898);
    trackG.fillRect(trackX, -7, this.trackW, 14);
    trackG.lineStyle(2, 0xb09060);
    trackG.lineBetween(trackX, -7, trackX + this.trackW, -7);
    trackG.lineBetween(trackX, -7, trackX, 7);
    trackG.lineStyle(2, 0xe8d8a8);
    trackG.lineBetween(trackX, 7, trackX + this.trackW, 7);
    trackG.lineBetween(trackX + this.trackW, -7, trackX + this.trackW, 7);

    this.track = scene.add.rectangle(trackX, 0, this.trackW, 14, 0xe0c898)
      .setOrigin(0, 0.5);
    this.fill = scene.add.rectangle(trackX, 0, this.trackW, 12, COLORS.green)
      .setOrigin(0, 0.5);

    this.add([rowBg, sep, this.emoji, this.track, trackG, this.fill]);
  }

  update(value: number): void {
    const pct = Math.max(0, Math.min(100, value)) / 100;
    this.fill.setSize(this.trackW * pct, 12);

    if (pct > 0.5) {
      this._currentFill = COLORS.green;
      this.fill.setFillStyle(COLORS.green);
      this.emoji.setText('😊');
    } else if (pct > 0.25) {
      this._currentFill = 0xd4a020;
      this.fill.setFillStyle(0xd4a020);
      this.emoji.setText('😐');
    } else {
      this._currentFill = COLORS.red;
      this.fill.setFillStyle(COLORS.red);
      this.emoji.setText('😤');
    }
  }

  flashRed(): void {
    const original = this._currentFill;
    this.fill.setFillStyle(COLORS.red);
    this.scene.tweens.add({
      targets: this.fill,
      alpha: { from: 0.4, to: 1 },
      yoyo: true, repeat: 1, duration: 180,
      onComplete: () => this.fill.setFillStyle(original),
    });
  }
}
```

- [ ] **Step 2: 更新 GameScene.ts 调用 flashRed**

在 `handleWrongAnswer()` 里，在 `this.patienceBar.update(this.patience.value)` 之后加一行：
```typescript
this.patienceBar.flashRed();
```

- [ ] **Step 3: 运行游戏验证**

```bash
npm run dev
```
答错时确认耐心条有闪红效果。

- [ ] **Step 4: 提交**

```bash
git add src/ui/PatienceBar.ts src/scenes/GameScene.ts
git commit -m "feat(phase2): rebuild PatienceBar with inset track and flashRed animation"
```

---

### Task 8：改造 StepIndicator（凸起激活 tab 样式）

**Files:**
- Modify: `src/ui/StepIndicator.ts`

- [ ] **Step 1: 完整替换 StepIndicator.ts**

```typescript
// src/ui/StepIndicator.ts
import Phaser from 'phaser';
import { FONT, COLORS, COLOR_STR } from './UITheme';

type Step = 'reading' | 'keyword' | 'answer';

const STEP_LABELS: Record<Step, string> = {
  reading: '① 读题',
  keyword: '② 圈关键词',
  answer:  '③ 答题',
};
const STEP_ORDER: Step[] = ['reading', 'keyword', 'answer'];
const CELL_H = 44;

export class StepIndicator extends Phaser.GameObjects.Container {
  private cells = new Map<Step, {
    bg:    Phaser.GameObjects.Rectangle;
    label: Phaser.GameObjects.Text;
  }>();
  private bonusText: Phaser.GameObjects.Text;
  private rowBg: Phaser.GameObjects.Rectangle;
  private width: number;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number) {
    super(scene, x, y);
    this.width = width;
    scene.add.existing(this);

    // 奶油底
    this.rowBg = scene.add.rectangle(0, 0, width, CELL_H, 0xf5e8cc).setOrigin(0, 0);
    this.add(this.rowBg);
    // 底边线
    const sep = scene.add.rectangle(0, CELL_H, width, 2, 0xc8a060).setOrigin(0, 0);
    this.add(sep);

    const cellW = Math.floor(width / 3);
    STEP_ORDER.forEach((step, i) => {
      const bg = scene.add.rectangle(i * cellW, 0, cellW - 1, CELL_H, 0xf5e8cc)
        .setOrigin(0, 0);
      const label = scene.add.text(i * cellW + cellW / 2, CELL_H / 2, STEP_LABELS[step], {
        ...FONT, fontSize: '17px', color: COLOR_STR.inkLight,
      }).setOrigin(0.5, 0.5);
      this.cells.set(step, { bg, label });
      this.add([bg, label]);
    });

    this.bonusText = scene.add.text(width - 8, CELL_H / 2, '', {
      ...FONT, fontSize: '16px', color: COLOR_STR.gold,
    }).setOrigin(1, 0.5);
    this.add(this.bonusText);
  }

  setStep(active: Step, completedBonus?: number): void {
    const activeIdx = STEP_ORDER.indexOf(active);

    STEP_ORDER.forEach((step, i) => {
      const { bg, label } = this.cells.get(step)!;
      if (i < activeIdx) {
        // 已完成：浅绿底 + 勾
        bg.setFillStyle(0xeaf8e0).setSize(bg.width, CELL_H);
        bg.setY(0);
        label.setColor(COLOR_STR.green).setText(STEP_LABELS[step] + ' ✓');
      } else if (i === activeIdx) {
        // 激活：金黄底 + 上移 2px 视觉凸起
        bg.setFillStyle(COLORS.goldNum).setSize(bg.width, CELL_H + 2);
        bg.setY(-2);
        label.setColor(COLOR_STR.inkDark).setStyle({ ...FONT, fontSize: '17px', fontStyle: 'bold' })
          .setText(STEP_LABELS[step] + ' ✏');
      } else {
        // 未到达
        bg.setFillStyle(0xf5e8cc).setSize(bg.width, CELL_H);
        bg.setY(0);
        label.setColor(COLOR_STR.inkLight).setStyle({ ...FONT, fontSize: '17px', fontStyle: 'normal' })
          .setText(STEP_LABELS[step]);
      }
    });

    if (completedBonus !== undefined && completedBonus > 0) {
      this.bonusText.setText(`+¥${completedBonus}`);
    }
  }

  clearBonus(): void {
    this.bonusText.setText('');
  }
}
```

- [ ] **Step 2: 运行游戏确认 StepIndicator**

```bash
npm run dev
```
验证：激活步骤呈金黄凸起，完成步骤呈浅绿，未到达呈浅色。

- [ ] **Step 3: 提交**

```bash
git add src/ui/StepIndicator.ts
git commit -m "feat(phase2): rebuild StepIndicator with raised active tab style"
```

---

## ─── PHASE 3：动效 ───

### Task 9：金币飞出动效（答对后）

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/scenes/PreloadScene.ts`（确认 emote_cash 帧号）

- [ ] **Step 1: 确认 emote_cash 帧号**

```bash
# 用浏览器打开 dev server，在控制台执行：
# this.textures.get('emotes').getFrameNames()
# 或直接数格子：pixel_style1.png 是 16px 格，cash 图标在哪行哪列
npm run dev
```

打开 `http://localhost:5173`，在浏览器 Console 中执行（Phaser 场景启动后）：
```javascript
// 在任意 Phaser Scene 的 create() 里临时加，或在 Console 里找 game 对象
const frames = game.textures.get('emotes').getFrameNames();
console.log(frames); // 查找 cash 相关帧，或按索引逐一测试
```

若帧是数字索引，`emote_cash.png` 在 Kenney pixel_style1 中约为第 **5** 帧（$符号图标，第一行第6个，0-indexed = 5）。**实际值以目视确认为准，下方代码中用常量 `CASH_FRAME` 记录。**

- [ ] **Step 2: 在 GameScene.ts 顶部加常量和 flyCoins 方法**

在 `GameScene` class 内加：

```typescript
// emote_cash 帧号（需要运行时确认）
private static readonly CASH_FRAME = 5;

private flyCoins(fromX: number, fromY: number): void {
  const hudCoinX = 60;   // HUD 班级文字大致 x
  const hudCoinY = 26;   // HUD 高度中心

  const offsets = [
    { dx: -12, dy: 0  },
    { dx:   0, dy: -8 },
    { dx:  12, dy: 4  },
  ];

  offsets.forEach(({ dx, dy }, i) => {
    const coin = this.add.image(fromX + dx, fromY + dy, 'emotes', GameScene.CASH_FRAME)
      .setScale(3);
    this.tweens.add({
      targets: coin,
      x: hudCoinX, y: hudCoinY,
      scale: 1,
      delay: i * 100,
      duration: 550,
      ease: 'Quad.easeIn',
      onComplete: () => coin.destroy(),
    });
  });
}
```

- [ ] **Step 3: 在 handleCorrectStep 里调用 flyCoins**

找到 `handleCorrectStep` 里 `this.customer.setMood('happy')` 那行，在其后加：
```typescript
this.flyCoins(this.scale.width * 0.65, this.scale.height * 0.38);
```

- [ ] **Step 4: 运行游戏确认金币飞出**

```bash
npm run dev
```
答对一题后，3 枚金币从顾客区域飞向左上角 HUD。如果帧号不对，调整 `CASH_FRAME` 常量。

- [ ] **Step 5: 提交**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat(phase3): add coin-fly animation on correct answer"
```

---

### Task 10：连胜火焰特效

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: 在 GameScene 中添加 streak 相关字段和方法**

在 class 字段区加：
```typescript
private streakContainer?: Phaser.GameObjects.Container;
```

添加 `updateStreakFire` 方法：
```typescript
private updateStreakFire(streak: number): void {
  this.streakContainer?.destroy();
  this.streakContainer = undefined;

  if (streak < 3) return;

  const is5 = streak >= 5;
  const x = this.scale.width - 80;
  const y = this.scale.height * 0.60;

  this.streakContainer = this.add.container(x, y);

  const count = is5 ? 3 : 1;
  const size  = is5 ? 3.5 : 2.5;

  for (let i = 0; i < count; i++) {
    // 用 emote_star 帧近似火焰（或用 emote_anger）
    // Kenney pixel_style1: star ≈ frame 13, anger ≈ frame 2
    const FLAME_FRAME = is5 ? 13 : 2;
    const flame = this.add.image((i - (count - 1) / 2) * 20, 0, 'emotes', FLAME_FRAME)
      .setScale(size);
    this.streakContainer.add(flame);

    // flicker tween
    this.tweens.add({
      targets: flame,
      scaleY: size * 1.12,
      scaleX: size * 0.92,
      yoyo: true, repeat: -1,
      duration: 280 + i * 40,
      ease: 'Sine.easeInOut',
    });
  }

  const label = this.add.text(0, -28,
    is5 ? '5连胜！！' : '3连胜！',
    { ...FONT_GOLD, fontSize: is5 ? '20px' : '17px' },
  ).setOrigin(0.5);
  this.streakContainer.add(label);

  // 出现动画
  this.streakContainer.setScale(0.3);
  this.tweens.add({
    targets: this.streakContainer,
    scale: 1, duration: 350, ease: 'Back.easeOut',
  });
}
```

（需要在文件顶部加 `import { FONT_GOLD } from '../ui/UITheme';` 如果还没加的话）

- [ ] **Step 2: 在 handleCorrectStep 里触发**

在 `this.score.onCorrectAnswer()` 之后加：
```typescript
this.updateStreakFire(this.score.currentStreak);
```

（`ScoreManager` 需要暴露 `currentStreak` getter，见下一步）

- [ ] **Step 3: 在 ScoreManager 添加 currentStreak getter**

打开 `src/logic/ScoreManager.ts`，找到连胜相关字段（应有 streak 计数），添加：
```typescript
get currentStreak(): number {
  return this._streak; // 字段名以实际代码为准
}
```

- [ ] **Step 4: 运行游戏确认**

```bash
npm run dev
```
连续答对 3 题后，画面右侧出现火焰 + 文字；5 连胜时变为 3 个更大的火焰。

- [ ] **Step 5: 提交**

```bash
git add src/scenes/GameScene.ts src/logic/ScoreManager.ts
git commit -m "feat(phase3): add streak fire effect at 3 and 5 consecutive correct answers"
```

---

### Task 11：答对结算徽章

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: 将 showFloat 替换为更精美的 showCorrectBadge**

在 `GameScene` 内添加方法：
```typescript
private showCorrectBadge(amount: number): void {
  const cx = this.scale.width * 0.50;
  const cy = this.scale.height * 0.32;

  const g = this.add.graphics();
  g.fillStyle(COLORS.green);
  g.fillRoundedRect(cx - 80, cy - 28, 160, 56, 8);
  g.lineStyle(3, COLORS.greenLight);
  g.strokeRoundedRect(cx - 80, cy - 28, 160, 56, 8);
  // drop shadow
  g.fillStyle(0x1a3000, 0.4);
  g.fillRoundedRect(cx - 78, cy + 30, 160, 4, 2);

  const t = this.add.text(cx, cy, `✓  +¥${amount}`, {
    ...FONT_GOLD, fontSize: '26px', color: '#1a4000', fontStyle: 'bold',
  }).setOrigin(0.5);

  // 弹出 + 淡出
  g.setScale(0.4); t.setScale(0.4); g.setAlpha(0); t.setAlpha(0);
  this.tweens.add({
    targets: [g, t],
    scale: 1, alpha: 1,
    duration: 300, ease: 'Back.easeOut',
    onComplete: () => {
      this.tweens.add({
        targets: [g, t],
        alpha: 0, delay: 700, duration: 300,
        onComplete: () => { g.destroy(); t.destroy(); },
      });
    },
  });
}
```

（在文件顶部确保已导入 `COLORS, FONT_GOLD` from UITheme）

- [ ] **Step 2: 在 handleCorrectStep 里替换原 showFloat 调用**

将：
```typescript
this.showFloat(
  this.scale.width * 0.5, this.scale.height * 0.35,
  `¥${this.score.turnTotal}`, '#6fcf6f',
);
```
改为：
```typescript
this.showCorrectBadge(this.score.turnTotal);
```

- [ ] **Step 3: 运行游戏确认徽章效果**

```bash
npm run dev
```
答对后出现绿色圆角徽章，弹跳出现，停留约 700ms 后淡出。

- [ ] **Step 4: 提交**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat(phase3): replace float text with animated correct-answer badge"
```

---

## 自查清单

**Spec coverage 核对：**

| 设计要求 | 对应 Task |
|---|---|
| UITheme + drawWoodFrame | Task 1 |
| Google Fonts 预加载 | Task 2 |
| 全面切换配色 + 字体 | Task 3 |
| DialogueBox 木框 + 铆钉 + chunk 样式 | Task 4 |
| NumPad 木框 + 立体按钮 + 按压 tween | Task 5 |
| HUD 暖色顶栏 + 凹陷计时器 | Task 6 |
| PatienceBar 凹陷轨道 + flashRed | Task 7 |
| StepIndicator 凸起激活 tab | Task 8 |
| 金币飞出动效 | Task 9 |
| 连胜火焰特效 | Task 10 |
| 答对结算徽章 | Task 11 |
| 答错耐心条闪红 | Task 7（flashRed 在 Phase 2 即实现）|

**不在范围（spec §5 明确排除）：** 商店背景、音效、开始/结束界面、顾客多样性。
