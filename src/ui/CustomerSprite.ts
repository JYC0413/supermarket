// src/ui/CustomerSprite.ts
import Phaser from 'phaser';

const SCALE = 6; // 16px tile → 96px display

const CUSTOMER_TYPES = [
  { idle: 47, walk: [48, 49] },
  { idle: 72, walk: [73, 74] },
  { idle: 97, walk: [98, 99] },
  { idle: 122, walk: [123, 124] },
  { idle: 147, walk: [148, 149] },
  { idle: 172, walk: [173, 174] },
] as const;

const EMOTE = { idle: 0, happy: 2, angry: 7 } as const;

export class CustomerSprite extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Image;
  private emoteImg: Phaser.GameObjects.Image;
  private typeData: { idle: number; walk: readonly number[] };
  private walkTimer?: Phaser.Time.TimerEvent;
  private walkFrame = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    const type = CUSTOMER_TYPES[Math.floor(Math.random() * CUSTOMER_TYPES.length)];
    this.typeData = type;

    this.sprite = scene.add.image(0, 0, 'urban', type.idle)
      .setScale(SCALE)
      .setOrigin(0.5, 1);

    this.emoteImg = scene.add.image(SCALE * 10, -SCALE * 18, 'emotes', EMOTE.idle)
      .setScale(3)
      .setVisible(false);

    this.add([this.sprite, this.emoteImg]);
    scene.add.existing(this);
  }

  setMood(mood: 'idle' | 'happy' | 'angry'): void {
    if (mood === 'idle') {
      this.emoteImg.setVisible(false);
    } else {
      this.emoteImg.setFrame(EMOTE[mood]).setVisible(true);
    }
    this.sprite.setFrame(this.typeData.idle);
  }

  walkIn(targetX: number, onComplete: () => void): void {
    this.x = targetX + 220;
    this.startWalk();
    this.scene.tweens.add({
      targets: this, x: targetX, duration: 700,
      ease: 'Quad.easeOut',
      onComplete: () => { this.stopWalk(); onComplete(); },
    });
  }

  walkOut(onComplete: () => void): void {
    this.startWalk();
    this.scene.tweens.add({
      targets: this, x: this.x + 280, duration: 550,
      ease: 'Quad.easeIn',
      onComplete: () => { this.destroy(); onComplete(); },
    });
  }

  private startWalk(): void {
    this.walkFrame = 0;
    const allFrames = [this.typeData.idle, ...this.typeData.walk];
    this.walkTimer = this.scene.time.addEvent({
      delay: 130,
      callback: () => {
        this.walkFrame = (this.walkFrame + 1) % allFrames.length;
        this.sprite.setFrame(allFrames[this.walkFrame]);
      },
      loop: true,
    });
  }

  private stopWalk(): void {
    this.walkTimer?.remove();
    this.sprite.setFrame(this.typeData.idle);
  }
}
