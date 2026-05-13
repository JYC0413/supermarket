// src/ui/NumPad.ts
import Phaser from 'phaser';
import { FONT, FONT_WARM, COLORS, COLOR_STR } from './UITheme';

const KEY_LAYOUT = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['0', '', '⌫'],
] as const;

const KEY_W = 66;
const KEY_H = 52;
const GAP = 6;

export class NumPad extends Phaser.GameObjects.Container {
  private _value = '';
  private displayText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private _locked = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);
    this.buildDisplay();
    this.buildKeys();
    this.buildConfirmButton();
  }

  private buildDisplay(): void {
    const totalW = KEY_W * 3 + GAP * 2;
    // 显示框内上半部分显示提示文字，下半部分显示答案
    const bg = this.scene.add.rectangle(0, 0, totalW, 86, COLORS.displayBg)
      .setOrigin(0, 0).setStrokeStyle(2, COLORS.displayBorder);
    // 提示文字：显示框内顶部（不再浮出容器外）
    this.promptText = this.scene.add.text(8, 7, '', {
      ...FONT_WARM, fontSize: '16px', color: COLOR_STR.inkMid,
    });
    // 分隔线
    const line = this.scene.add.rectangle(0, 32, totalW, 1, COLORS.displayBorder).setOrigin(0, 0);
    // 答案输入：显示框内下半部分
    this.displayText = this.scene.add.text(8, 38, '_', {
      ...FONT, fontSize: '34px', color: COLOR_STR.warmWhite,
    });
    this.add([bg, line, this.promptText, this.displayText]);
  }

  private buildKeys(): void {
    KEY_LAYOUT.forEach((row, ri) => {
      row.forEach((key, ci) => {
        if (key === '') return; // skip placeholder in '0' row

        const isWide = key === '0';
        const w = isWide ? KEY_W * 2 + GAP : KEY_W;
        const kx = isWide ? 0 : ci * (KEY_W + GAP);
        const ky = 94 + ri * (KEY_H + GAP);

        const isDelete = key === '⌫';
        const bgColor = isDelete ? 0xf0c8b0 : COLORS.bgWarm;
        const borderColor = isDelete ? 0xc07050 : 0xc8a060;
        const labelColor = isDelete ? COLOR_STR.red : COLOR_STR.inkDark;

        const bg = this.scene.add.rectangle(kx, ky, w, KEY_H, bgColor)
          .setOrigin(0, 0).setStrokeStyle(2, borderColor)
          .setInteractive({ useHandCursor: true });
        const label = this.scene.add.text(kx + w / 2, ky + KEY_H / 2, key, {
          ...FONT, fontSize: '24px', color: labelColor,
        }).setOrigin(0.5, 0.5);

        bg.on('pointerover', () => { if (!this._locked) bg.setFillStyle(isDelete ? 0x3a2a2a : 0x2a2a4e); });
        bg.on('pointerout', () => bg.setFillStyle(bgColor));
        bg.on('pointerup', () => { if (!this._locked) this.handleKey(key); });

        this.add([bg, label]);
      });
    });
  }

  private buildConfirmButton(): void {
    const totalW = KEY_W * 3 + GAP * 2;
    const ky = 94 + 4 * (KEY_H + GAP);
    const confirmBg = this.scene.add.rectangle(0, ky, totalW, KEY_H, COLORS.green)
      .setOrigin(0, 0).setStrokeStyle(2, 0x3a6010)
      .setInteractive({ useHandCursor: true });
    const confirmLabel = this.scene.add.text(totalW / 2, ky + KEY_H / 2, '✓ 确认', {
      ...FONT, color: '#1a4000', fontSize: '24px',
    }).setOrigin(0.5, 0.5);
    confirmBg.on('pointerup', () => { if (!this._locked) this.confirmCurrentValue(); });
    this.add([confirmBg, confirmLabel]);
  }

  private handleKey(key: string): void {
    if (key === '⌫') {
      this._value = this._value.slice(0, -1);
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
    this.setAlpha(locked ? 0.25 : 1);
  }

  private refreshDisplay(): void {
    this.displayText.setText(this._value.length > 0 ? this._value : '_');
  }
}
