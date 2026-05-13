// src/scenes/ConfigScene.ts
import Phaser from 'phaser';
import { DEFAULT_SETTINGS, FONT, FONT_GOLD, FONT_GREEN } from '../config';
import type { GameSettings } from '../logic/types';

export class ConfigScene extends Phaser.Scene {
  private settings: GameSettings = { ...DEFAULT_SETTINGS };

  constructor() { super({ key: 'ConfigScene' }); }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    this.add.rectangle(0, 0, W, H, 0x0a0a1a).setOrigin(0, 0);

    this.add.text(cx, 80, '数学便利店', { ...FONT_GOLD, fontSize: '36px' }).setOrigin(0.5);
    this.add.text(cx, 125, '老师请设置本局参数', { ...FONT, fontSize: '14px', color: '#888' })
      .setOrigin(0.5);

    this.addSetting(cx, 240, '回合时长（秒）', 60, 600, 30,
      this.settings.roundDuration, v => { this.settings.roundDuration = v; });
    this.addSetting(cx, 340, '顾客数量', 3, 12, 1,
      this.settings.customerCount, v => { this.settings.customerCount = v; });

    const btn = this.add.text(cx, 450, '▶  开始游戏', {
      ...FONT_GREEN, fontSize: '24px',
      backgroundColor: '#0a2a0a', padding: { x: 28, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerup', () => this.scene.start('GameScene', { settings: this.settings }));
    btn.on('pointerover', () => btn.setStyle({ color: '#9fcf9f' }));
    btn.on('pointerout', () => btn.setStyle({ color: '#6fcf6f' }));
  }

  private addSetting(
    cx: number, y: number, label: string,
    min: number, max: number, step: number,
    initial: number,
    onChange: (v: number) => void,
  ): void {
    this.add.text(cx, y - 22, label, { ...FONT, fontSize: '13px', color: '#aaa' }).setOrigin(0.5);
    let value = initial;
    const valText = this.add.text(cx, y + 12, String(value), { ...FONT_GOLD, fontSize: '22px' })
      .setOrigin(0.5);

    const minus = this.add.text(cx - 70, y + 12, '−', { ...FONT, fontSize: '22px', color: '#cf6f6f' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    const plus = this.add.text(cx + 70, y + 12, '+', { ...FONT, fontSize: '22px', color: '#6fcf6f' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });

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
