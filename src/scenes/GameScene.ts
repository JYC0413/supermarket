// src/scenes/GameScene.ts
import Phaser from 'phaser';
export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }
  create(): void { this.add.text(20, 20, 'GameScene — stub', { color: '#fff' }); }
}
