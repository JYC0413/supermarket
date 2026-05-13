// src/ui/CustomerSprite.ts
import Phaser from 'phaser';

type CustomerMood = 'idle' | 'happy' | 'angry';

export class CustomerSprite extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Image;
  private _mood: CustomerMood = 'idle';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.sprite = scene.add.image(0, 0, 'customer_idle').setOrigin(0.5, 1);
    this.add(this.sprite);
    scene.add.existing(this);
  }

  setMood(mood: CustomerMood): void {
    if (this._mood === mood) return;
    this._mood = mood;
    this.sprite.setTexture(`customer_${mood}`);
  }

  walkIn(targetX: number, onComplete: () => void): void {
    this.x = targetX + 120;
    this.scene.tweens.add({
      targets: this, x: targetX, duration: 600,
      ease: 'Quad.easeOut', onComplete,
    });
  }

  walkOut(onComplete: () => void): void {
    this.scene.tweens.add({
      targets: this, x: this.x + 150, duration: 500,
      ease: 'Quad.easeIn', onComplete: () => { this.destroy(); onComplete(); },
    });
  }
}
