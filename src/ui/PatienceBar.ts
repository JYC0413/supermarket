// src/ui/PatienceBar.ts
import Phaser from 'phaser';
import { FONT_GREY, COLORS } from './UITheme';

export class PatienceBar extends Phaser.GameObjects.Container {
  private fill:  Phaser.GameObjects.Rectangle;
  private trackW: number;
  private emoji: Phaser.GameObjects.Text;
  private _currentFill: number = COLORS.green;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number) {
    super(scene, x, y);
    scene.add.existing(this);

    // 暖色容器底
    const rowBg = scene.add.rectangle(0, 0, width, 32, 0xfdf0d8)
      .setOrigin(0, 0.5);
    // 底边分隔线
    const sep = scene.add.rectangle(0, 16, width, 2, 0xd4b870).setOrigin(0, 0.5);

    this.emoji = scene.add.text(6, 0, '😊', { fontSize: '22px' }).setOrigin(0, 0.5);
    const label = scene.add.text(34, 0, '顾客耐心', { ...FONT_GREY, fontSize: '16px' }).setOrigin(0, 0.5);

    const trackX = 120;
    this.trackW = width - trackX - 8;

    // 凹陷感轨道
    const trackG = scene.add.graphics();
    trackG.fillStyle(0xe0c898);
    trackG.fillRect(trackX, -7, this.trackW, 14);
    trackG.lineStyle(2, 0xb09060);
    trackG.lineBetween(trackX, -7, trackX + this.trackW, -7);
    trackG.lineBetween(trackX, -7, trackX, 7);
    trackG.lineStyle(2, 0xe8d8a8);
    trackG.lineBetween(trackX, 7, trackX + this.trackW, 7);
    trackG.lineBetween(trackX + this.trackW, -7, trackX + this.trackW, 7);

    this.fill = scene.add.rectangle(trackX, 0, this.trackW, 12, COLORS.green)
      .setOrigin(0, 0.5);

    this.add([rowBg, sep, this.emoji, label, trackG, this.fill]);
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
      yoyo: true, repeat: 0, duration: 180,
      onComplete: () => this.fill.setFillStyle(original),
    });
  }
}
