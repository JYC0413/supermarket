// src/audio/AudioManager.ts
import Phaser from 'phaser';

export type SoundKey =
  | 'keyword_circle'
  | 'correct'
  | 'customer_happy'
  | 'wrong'
  | 'customer_angry'
  | 'coins'
  | 'streak_3'
  | 'streak_5'
  | 'round_complete'
  | 'key_press';

const BGM_VOLUME = 0.05; // 极小声，只作背景氛围
// BGM: "Wallpaper" by Kevin MacLeod (incompetech.com)
// Licensed under Creative Commons: By Attribution 4.0 — http://creativecommons.org/licenses/by/4.0/

const VOLUMES: Record<SoundKey, number> = {
  keyword_circle: 0.55,
  correct:        0.70,
  customer_happy: 0.60,
  wrong:          0.65,
  customer_angry: 0.55,
  coins:          0.50,
  streak_3:       0.75,
  streak_5:       0.85,
  round_complete: 0.80,
  key_press:      0.35,
};

export class AudioManager {
  private scene: Phaser.Scene;
  private bgm?: Phaser.Sound.BaseSound;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  play(key: SoundKey, extra?: Phaser.Types.Sound.SoundConfig): void {
    const vol = VOLUMES[key];
    this.scene.sound.play(key, { volume: vol, ...extra });
  }

  startBgm(): void {
    if (this.bgm) return; // 已在播放
    this.bgm = this.scene.sound.add('bgm', { loop: true, volume: BGM_VOLUME });
    this.bgm.play();
  }

  stopBgm(): void {
    this.bgm?.stop();
    this.bgm = undefined;
  }

  // Preload helper — call from PreloadScene
  static preload(scene: Phaser.Scene): void {
    const keys: SoundKey[] = [
      'keyword_circle', 'correct', 'customer_happy',
      'wrong', 'customer_angry', 'coins',
      'streak_3', 'streak_5', 'round_complete', 'key_press',
    ];
    for (const k of keys) {
      scene.load.audio(k, `assets/sounds/${k}.ogg`);
    }
    scene.load.audio('bgm', 'assets/sounds/bgm.mp3');
  }
}
