// src/ui/PatienceBar.ts
import Phaser from 'phaser';
import { FONT_GREY } from '../config';

export class PatienceBar extends Phaser.GameObjects.Container {
  private fill: Phaser.GameObjects.Rectangle;
  private track: Phaser.GameObjects.Rectangle;
  private emoji: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number) {
    super(scene, x, y);
    scene.add.existing(this);

    this.emoji = scene.add.text(0, 0, '😊', { fontSize: '16px' }).setOrigin(0, 0.5);
    scene.add.text(24, 0, '顾客耐心', { ...FONT_GREY, fontSize: '11px' }).setOrigin(0, 0.5);

    const trackX = 80;
    const trackW = width - trackX;
    this.track = scene.add.rectangle(trackX, 0, trackW, 8, 0x1a1a1a)
      .setOrigin(0, 0.5).setStrokeStyle(1, 0x2a2a2a);
    this.fill = scene.add.rectangle(trackX, 0, trackW, 8, 0x5fa05f)
      .setOrigin(0, 0.5);

    this.add([this.emoji, this.track, this.fill]);
  }

  update(value: number): void {
    const pct = Math.max(0, Math.min(100, value)) / 100;
    this.fill.setSize(this.track.width * pct, 8);

    if (pct > 0.5) {
      this.fill.setFillStyle(0x5fa05f);
      this.emoji.setText('😊');
    } else if (pct > 0.25) {
      this.fill.setFillStyle(0xd4c020);
      this.emoji.setText('😐');
    } else {
      this.fill.setFillStyle(0xcf4040);
      this.emoji.setText('😤');
    }
  }
}
