// src/ui/DialogueBox.ts
import Phaser from 'phaser';
import type { Question, TextChunk } from '../logic/types';
import { KeywordValidator } from '../logic/KeywordValidator';
import { FONT, FONT_GOLD, FONT_GREY, COLORS } from './UITheme';

const CHUNK_PAD_X = 12;
const CHUNK_PAD_Y = 12;
const FONT_SIZE   = '26px';
// CJK 字符实际渲染高度约 34px，加上上下各 14px 安全边距 = 62px
// 不依赖 Phaser 测量，直接用固定高度
const FIXED_CHUNK_H = 62;

export class DialogueBox extends Phaser.GameObjects.Container {
  private circledIds: string[] = [];
  private question!: Question;
  private bgRect!: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number) {
    super(scene, x, y);
    this.bgRect = scene.add.rectangle(0, 0, width, 260, COLORS.parchmentTop)
      .setOrigin(0, 0).setStrokeStyle(1, COLORS.woodDark);
    this.add(this.bgRect);
    scene.add.existing(this);
  }

  load(question: Question): void {
    this.question = question;
    this.circledIds = [];
    while (this.list.length > 1) {
      (this.list[1] as Phaser.GameObjects.GameObject).destroy();
    }

    // Hard-question badge at top of box (not above it)
    let startY = 20;
    if (question.isHard) {
      const badge = this.scene.add.text(14, 14, '⚡ 超难题！', {
        ...FONT, color: '#ffd060', fontSize: '20px',
        backgroundColor: '#1a1200', padding: { x: 8, y: 4 },
      });
      this.add(badge);
      startY = 66;
    }

    let cursorX = 14;
    let cursorY = startY;
    const maxWidth = this.bgRect.width * 0.97;

    for (const chk of question.chunks) {
      const chunkContainer = this.buildChunk(chk);
      const chunkWidth = (chunkContainer as unknown as { chunkWidth: number }).chunkWidth;

      if (cursorX + chunkWidth > maxWidth && cursorX > 14) {
        cursorX = 14;
        cursorY += FIXED_CHUNK_H + 8;
      }

      chunkContainer.setPosition(cursorX, cursorY);
      this.add(chunkContainer);
      cursorX += chunkWidth + 4;
    }

    const newHeight = Math.max(100, cursorY + 70);
    this.bgRect.setSize(this.bgRect.width, newHeight);
  }

  private buildChunk(chk: TextChunk): Phaser.GameObjects.Container {
    const scene = this.scene;
    const style = chk.clickable ? FONT : FONT_GREY;
    const label = scene.add.text(CHUNK_PAD_X, CHUNK_PAD_Y, chk.text, {
      ...style, fontSize: FONT_SIZE,
    });
    const w = label.width + CHUNK_PAD_X * 2;
    const h = FIXED_CHUNK_H;
    // 文字垂直居中于固定高度框内
    label.setY((h - label.height) / 2);

    const bg = scene.add.rectangle(0, 0, w, h,
      chk.clickable ? COLORS.bgWarm : 0xf5edd8)
      .setOrigin(0, 0)
      .setStrokeStyle(1, chk.clickable ? 0xd4b870 : 0xe8d8a0);

    const container = scene.add.container(0, 0, [bg, label]);
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
      bg.setFillStyle(COLORS.keywordBg).setStrokeStyle(2, 0xc89020);
      label.setStyle({ ...FONT_GOLD, fontSize: FONT_SIZE });
      this.scene.events.emit('keyword_circled', chk.id);
      if (KeywordValidator.allCircled(this.question, this.circledIds)) {
        this.scene.events.emit('all_keywords_done');
      }
    } else {
      this.scene.tweens.add({
        targets: bg,
        x: { from: -3, to: 3 },
        yoyo: true, repeat: 2, duration: 40,
        onComplete: () => bg.setX(0),
      });
    }
  }

  // Kept for API compatibility but now handled inside load()
  showHardBadge(): void { /* badge is now set in load() */ }
}
