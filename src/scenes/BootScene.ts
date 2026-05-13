// src/scenes/BootScene.ts
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  create(): void {
    this.cameras.main.setRoundPixels(true);
    this.scene.start('PreloadScene');
  }
}
