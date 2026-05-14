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
  const no = bt + 3;
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
