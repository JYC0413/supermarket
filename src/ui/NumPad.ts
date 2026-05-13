// src/ui/NumPad.ts
import Phaser from 'phaser';
import { FONT } from '../config';

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
    const bg = this.scene.add.rectangle(0, 0, totalW, 62, 0x1a120a)
      .setOrigin(0, 0).setStrokeStyle(2, 0x5a4030);
    this.displayText = this.scene.add.text(10, 10, '_', {
      ...FONT, fontSize: '32px', color: '#ffffff',
    });
    this.promptText = this.scene.add.text(0, -38, '', {
      ...FONT, fontSize: '18px', color: '#c8a070',
    });
    this.add([bg, this.displayText, this.promptText]);
  }

  private buildKeys(): void {
    KEY_LAYOUT.forEach((row, ri) => {
      row.forEach((key, ci) => {
        if (key === '') return; // skip placeholder in '0' row

        const isWide = key === '0';
        const w = isWide ? KEY_W * 2 + GAP : KEY_W;
        const kx = isWide ? 0 : ci * (KEY_W + GAP);
        const ky = 70 + ri * (KEY_H + GAP);

        const isDelete = key === '⌫';
        const bgColor = isDelete ? 0x2a1a1a : 0x1a1a2e;
        const borderColor = isDelete ? 0x4a2a2a : 0x2a2a4a;
        const labelColor = isDelete ? '#cf6f6f' : '#9f9fff';

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
    const ky = 70 + 4 * (KEY_H + GAP);
    const confirmBg = this.scene.add.rectangle(0, ky, totalW, KEY_H, 0x1a3a1a)
      .setOrigin(0, 0).setStrokeStyle(2, 0x3a6a3a)
      .setInteractive({ useHandCursor: true });
    const confirmLabel = this.scene.add.text(totalW / 2, ky + KEY_H / 2, '✓ 确认', {
      ...FONT, color: '#6fcf6f', fontSize: '24px',
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
