// src/ui/DialogueBox.ts
import Phaser from 'phaser';
import type { Question, TextChunk } from '../logic/types';
import { KeywordValidator } from '../logic/KeywordValidator';
import { FONT, FONT_GOLD, FONT_GREY } from '../config';

const CHUNK_PAD_X = 10;
const CHUNK_PAD_Y = 6;

export class DialogueBox extends Phaser.GameObjects.Container {
  private circledIds: string[] = [];
  private question!: Question;
  private bgRect!: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number) {
    super(scene, x, y);
    this.bgRect = scene.add.rectangle(0, 0, width, 200, 0x0c0c18)
      .setOrigin(0, 0).setStrokeStyle(1, 0x1a1a2a);
    this.add(this.bgRect);
    scene.add.existing(this);
  }

  load(question: Question): void {
    this.question = question;
    this.circledIds = [];
    // Remove all children except background
    while (this.list.length > 1) {
      (this.list[1] as Phaser.GameObjects.GameObject).destroy();
    }

    let cursorX = 10;
    let cursorY = 12;
    const maxWidth = this.bgRect.width * 0.95;

    for (const chk of question.chunks) {
      const chunkContainer = this.buildChunk(chk);
      const chunkWidth = (chunkContainer as unknown as { chunkWidth: number }).chunkWidth;

      if (cursorX + chunkWidth > maxWidth && cursorX > 10) {
        cursorX = 10;
        cursorY += 62;
      }

      chunkContainer.setPosition(cursorX, cursorY);
      this.add(chunkContainer);
      cursorX += chunkWidth + 3;
    }

    // Resize bg to fit content
    const newHeight = Math.max(80, cursorY + 40);
    this.bgRect.setSize(this.bgRect.width, newHeight);
  }

  private buildChunk(chk: TextChunk): Phaser.GameObjects.Container {
    const scene = this.scene;
    const style = chk.clickable ? FONT : FONT_GREY;
    const label = scene.add.text(CHUNK_PAD_X, CHUNK_PAD_Y, chk.text, {
      ...style, fontSize: '26px',
    });
    const w = label.width + CHUNK_PAD_X * 2;
    const h = label.height + CHUNK_PAD_Y * 2;

    const bg = scene.add.rectangle(0, 0, w, h,
      chk.clickable ? 0x111122 : 0x0a0a14)
      .setOrigin(0, 0)
      .setStrokeStyle(1, chk.clickable ? 0x2a2a3a : 0x111111);

    const container = scene.add.container(0, 0, [bg, label]);
    // Store width for cursor arithmetic
    (container as unknown as { chunkWidth: number }).chunkWidth = w;

    if (chk.clickable) {
      bg.setInteractive({ useHandCursor: true })
        .on('pointerup', () => this.onChunkTap(chk, bg, label));
    }

    return container;
  }

  private onChunkTap(
    chk: TextChunk,
    bg: Phaser.GameObjects.Rectangle,
    label: Phaser.GameObjects.Text,
  ): void {
    if (this.circledIds.includes(chk.id)) return;

    if (KeywordValidator.isValidKeyword(this.question, chk.id)) {
      this.circledIds.push(chk.id);
      bg.setFillStyle(0x2a1a00).setStrokeStyle(2, 0xc89020);
      label.setStyle({ ...FONT_GOLD, fontSize: '26px' });
      this.scene.events.emit('keyword_circled', chk.id);

      if (KeywordValidator.allCircled(this.question, this.circledIds)) {
        this.scene.events.emit('all_keywords_done');
      }
    } else {
      // Shake feedback, no penalty
      this.scene.tweens.add({
        targets: bg,
        x: { from: -3, to: 3 },
        yoyo: true, repeat: 2, duration: 40,
        onComplete: () => bg.setX(0),
      });
    }
  }

  showHardBadge(): void {
    const badge = this.scene.add.text(4, -38, '⚡ 超难题！', {
      ...FONT, color: '#ffd060', fontSize: '20px',
      backgroundColor: '#1a1200', padding: { x: 8, y: 4 },
    });
    this.add(badge);
  }
}
