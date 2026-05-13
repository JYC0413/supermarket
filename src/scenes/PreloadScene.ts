// src/scenes/PreloadScene.ts
import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloadScene' }); }

  preload(): void {
    this.load.spritesheet('urban', 'assets/rpg-urban/Tilemap/tilemap_packed.png', {
      frameWidth: 16,
      frameHeight: 16,
      spacing: 1,
    });
    this.load.spritesheet('emotes', 'assets/emotes/Tilesheets/pixel_style1.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
  }

  create(): void {
    this.scene.start('ConfigScene');
  }
}
