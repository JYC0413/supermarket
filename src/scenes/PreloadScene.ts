// src/scenes/PreloadScene.ts
import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloadScene' }); }

  create(): void {
    const make = (key: string, color: number, w: number, h: number) => {
      const g = this.make.graphics({}, false);
      g.fillStyle(color).fillRect(0, 0, w, h);
      g.generateTexture(key, w, h);
      g.destroy();
    };
    make('cashier', 0x4a6ab0, 16, 28);
    make('customer_idle', 0xb06a4a, 14, 26);
    make('customer_happy', 0x60aa60, 14, 26);
    make('customer_angry', 0xaa3030, 14, 26);
    make('counter', 0x5a3a10, 130, 24);
    make('shelf', 0x3a2a10, 52, 40);
    this.scene.start('GameScene');
  }
}
