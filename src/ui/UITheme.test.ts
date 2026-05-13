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
