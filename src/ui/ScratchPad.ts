// src/ui/ScratchPad.ts
import Phaser from 'phaser';
import { FONT_GREY, COLOR_STR, COLORS, SPACING, drawWoodFrame } from './UITheme';

export class ScratchPad {
  private rt: Phaser.GameObjects.RenderTexture;
  private brush: Phaser.GameObjects.Graphics;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;
  private readonly innerX: number;
  private readonly innerY: number;
  private readonly innerW: number;
  private readonly innerH: number;

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number) {
    const bt = SPACING.borderThick;
    const p  = SPACING.panelPad;
    const labelRowH = 44;

    this.innerX = x + bt + p;
    this.innerY = y + bt + p + labelRowH;
    this.innerW = w - (bt + p) * 2;
    this.innerH = h - (bt + p) * 2 - labelRowH;

    // Wood frame
    const frameG = scene.add.graphics();
    drawWoodFrame(frameG, x, y, w, h);

    // Label
    scene.add.text(x + bt + p, y + bt + p + 6, '✏ 草稿区', {
      ...FONT_GREY, fontSize: '20px',
    });

    // Clear button
    const clearBtn = scene.add.text(x + w - bt - p, y + bt + p + 6, '🗑 清空', {
      ...FONT_GREY, fontSize: '18px',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    clearBtn.on('pointerover', () => {
      clearBtn.setColor(COLOR_STR.inkDark);
      scene.game.canvas.style.cursor = 'pointer';
    });
    clearBtn.on('pointerout', () => {
      clearBtn.setColor(COLOR_STR.inkLight);
      scene.game.canvas.style.cursor = 'default';
    });
    clearBtn.on('pointerup', () => this.clear());

    // Drawing surface (RenderTexture)
    this.rt = scene.add.renderTexture(this.innerX, this.innerY, this.innerW, this.innerH)
      .setOrigin(0, 0);
    this.rt.fill(COLORS.parchmentTop, 1);

    // Inner border
    const borderG = scene.add.graphics();
    borderG.lineStyle(1, 0xd4b870);
    borderG.strokeRect(this.innerX, this.innerY, this.innerW, this.innerH);

    // Reusable brush (never added to scene, only stamped into rt)
    this.brush = scene.add.graphics().setVisible(false);

    // Input — scene-level so fast strokes aren't missed
    scene.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (this.hit(ptr.worldX, ptr.worldY)) {
        this.isDrawing = true;
        this.lastX = ptr.worldX - this.innerX;
        this.lastY = ptr.worldY - this.innerY;
      }
    });

    scene.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!this.isDrawing) return;
      const nx = ptr.worldX - this.innerX;
      const ny = ptr.worldY - this.innerY;
      this.stroke(this.lastX, this.lastY, nx, ny);
      this.lastX = nx;
      this.lastY = ny;
    });

    scene.input.on('pointerup', () => {
      this.isDrawing = false;
    });
  }

  private hit(wx: number, wy: number): boolean {
    return (
      wx >= this.innerX && wx <= this.innerX + this.innerW &&
      wy >= this.innerY && wy <= this.innerY + this.innerH
    );
  }

  private stroke(x1: number, y1: number, x2: number, y2: number): void {
    this.brush.clear();
    this.brush.fillStyle(0x3a2010);
    this.brush.fillCircle(x1, y1, 3);
    this.brush.lineStyle(5, 0x3a2010, 1);
    this.brush.beginPath();
    this.brush.moveTo(x1, y1);
    this.brush.lineTo(x2, y2);
    this.brush.strokePath();
    this.rt.draw(this.brush, 0, 0);
    this.brush.clear();
  }

  clear(): void {
    this.rt.clear();
    this.rt.fill(COLORS.parchmentTop, 1);
  }
}
