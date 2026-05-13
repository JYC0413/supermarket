// src/main.ts
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { ConfigScene } from './scenes/ConfigScene';
import { GameScene } from './scenes/GameScene';
import { HUDScene } from './scenes/HUDScene';

new Phaser.Game({
  type: Phaser.AUTO,
  width: 960,
  height: 600,
  backgroundColor: '#0a0a1a',
  pixelArt: true,
  scene: [BootScene, PreloadScene, ConfigScene, GameScene, HUDScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: { activePointers: 3 },
});
