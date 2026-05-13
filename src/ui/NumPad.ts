// src/ui/NumPad.ts
import Phaser from 'phaser';
import { FONT, FONT_WARM, COLORS, COLOR_STR, SPACING, drawWoodFrame } from './UITheme';

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
      ...FONT, fontSize: '14px', color: COLOR_STR.inkLight,
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
        this.add(c);
      });
    });
  }

  private buildConfirmKey(startX: number, startY: number): void {
    const w = KEY_W * 3 + GAP * 2;
    const c = this.buildKey3D(startX, startY, w, KEY_H, '✓ 确认', false, true);
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
    g.on('pointerover', () => {
      if (!this._locked) this.scene.game.canvas.style.cursor = 'pointer';
    });
    g.on('pointerout', () => {
      this.scene.game.canvas.style.cursor = 'default';
    });
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
