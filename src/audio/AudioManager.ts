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

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  play(key: SoundKey, extra?: Phaser.Types.Sound.SoundConfig): void {
    const vol = VOLUMES[key];
    this.scene.sound.play(key, { volume: vol, ...extra });
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
  }
}
