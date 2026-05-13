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
} as const;

export const FONT = { fontFamily: '"Courier New", monospace', color: '#dddddd' } as const;
export const FONT_GOLD = { ...FONT, color: '#ffd060' } as const;
export const FONT_GREEN = { ...FONT, color: '#6fcf6f' } as const;
export const FONT_GREY = { ...FONT, color: '#888888' } as const;
