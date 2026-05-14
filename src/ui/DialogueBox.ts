// src/ui/DialogueBox.ts
import Phaser from 'phaser';
import type { Question, TextChunk } from '../logic/types';
import { KeywordValidator } from '../logic/KeywordValidator';
import { FONT, FONT_GREY, COLORS, COLOR_STR, SPACING, drawWoodFrame } from './UITheme';

const FONT_SIZE   = '24px';
const FIXED_CHUNK_H = 58;
const CHUNK_PAD_X   = 10;

export class DialogueBox extends Phaser.GameObjects.Container {
  private circledIds: string[] = [];
  private question!: Question;
  private frameGraphics!: Phaser.GameObjects.Graphics;
  private boxW: number;
  private boxH = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number) {
    super(scene, x, y);
    this.boxW = width;
    this.frameGraphics = scene.add.graphics();
    this.add(this.frameGraphics);
    scene.add.existing(this);
  }

  load(question: Question): void {
    this.question = question;
    this.circledIds = [];

    // 清除旧 chunk（保留 frameGraphics）
    while (this.list.length > 1) {
      (this.list[1] as Phaser.GameObjects.GameObject).destroy();
    }

    const bt = SPACING.borderThick;
    const innerX = bt + SPACING.panelPad;
    let startY = bt + SPACING.panelPad;

    // 超难题 badge
    if (question.isHard) {
      const badge = this.scene.add.text(innerX, startY, '⚡ 超难题！', {
        ...FONT, fontSize: '18px', color: '#ffc060',
        backgroundColor: '#5a1a00', padding: { x: 8, y: 4 },
      });
      this.add(badge);
      startY += 38;
    }

    // "顾客说：" 标签
    const speakerLabel = this.scene.add.text(innerX, startY, '💬 顾客说：', {
      ...FONT_GREY, fontSize: '22px',
    });
    this.add(speakerLabel);
    startY += 26;

    // chunk 布局
    let cursorX = innerX;
    let cursorY = startY;
    const maxWidth = this.boxW - bt * 2 - SPACING.panelPad * 2;

    for (const chk of question.chunks) {
      const chunkContainer = this.buildChunk(chk);
      const chunkW = (chunkContainer as unknown as { chunkWidth: number }).chunkWidth;

      if (cursorX + chunkW > innerX + maxWidth && cursorX > innerX) {
        cursorX = innerX;
        cursorY += FIXED_CHUNK_H + 6;
      }

      chunkContainer.setPosition(cursorX, cursorY);
      this.add(chunkContainer);
      cursorX += chunkW + 3;
    }

    const totalH = Math.max(390, cursorY - bt - SPACING.panelPad + FIXED_CHUNK_H + bt + SPACING.panelPad + 8);
    this.boxH = totalH;
    this.redrawFrame();
  }

  private redrawFrame(): void {
    this.frameGraphics.clear();
    drawWoodFrame(this.frameGraphics, 0, 0, this.boxW, this.boxH);
  }

  private buildChunk(chk: TextChunk): Phaser.GameObjects.Container {
    const scene = this.scene;
    const isClickable = chk.clickable;
    const label = scene.add.text(CHUNK_PAD_X, 0, chk.text, {
      ...(isClickable ? FONT : FONT_GREY), fontSize: FONT_SIZE,
    });

    const w = label.width + CHUNK_PAD_X * 2;
    const h = FIXED_CHUNK_H;
    label.setY((h - label.height) / 2);

    const g = scene.add.graphics();
    if (isClickable) {
      // 未圈选：浅木色底 + 细边
      g.fillStyle(COLORS.bgWarm);
      g.fillRect(0, 0, w, h);
      g.lineStyle(1, 0xd4b870);
      g.strokeRect(0, 0, w, h);
    } else {
      // 非关键词：更浅的底
      g.fillStyle(0xf5edd8);
      g.fillRect(0, 0, w, h);
    }

    const container = scene.add.container(0, 0, [g, label]);
    (container as unknown as { chunkWidth: number }).chunkWidth = w;

    if (isClickable) {
      g.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
      g.on('pointerover', () => { this.scene.game.canvas.style.cursor = 'pointer'; });
      g.on('pointerout',  () => { this.scene.game.canvas.style.cursor = 'default'; });
      g.on('pointerup', () => this.onChunkTap(chk, g, label, container, w, h));
    }
    return container;
  }

  private onChunkTap(
    chk: TextChunk,
    g: Phaser.GameObjects.Graphics,
    label: Phaser.GameObjects.Text,
    container: Phaser.GameObjects.Container,
    w: number, h: number,
  ): void {
    if (this.circledIds.includes(chk.id)) return;

    if (KeywordValidator.isValidKeyword(this.question, chk.id)) {
      this.circledIds.push(chk.id);

      // 圈选样式：黄色底 + 立体边框
      g.clear();
      g.fillStyle(COLORS.keywordBg);
      g.fillRect(0, 0, w, h);
      // 高光（左上）
      g.lineStyle(2, 0xf0d860);
      g.lineBetween(0, 0, w, 0);
      g.lineBetween(0, 0, 0, h);
      // 阴影（右下）
      g.lineStyle(2, 0xb89020);
      g.lineBetween(0, h - 1, w, h - 1);
      g.lineBetween(w - 1, 0, w - 1, h);

      label.setStyle({ ...FONT, fontSize: FONT_SIZE, color: COLOR_STR.inkDark, fontStyle: 'bold' });

      // 弹跳动画
      this.scene.tweens.add({
        targets: container,
        scaleX: { from: 1, to: 1.12 },
        scaleY: { from: 1, to: 1.12 },
        yoyo: true, duration: 100, ease: 'Back.easeOut',
      });

      this.scene.events.emit('keyword_circled', chk.id);

      if (KeywordValidator.allCircled(this.question, this.circledIds)) {
        this.scene.events.emit('all_keywords_done');
      }
    } else {
      // 误点：左右抖动
      this.scene.tweens.add({
        targets: g,
        x: { from: -4, to: 4 },
        yoyo: true, repeat: 2, duration: 40,
        onComplete: () => g.setX(0),
      });
    }
  }

  showHardBadge(): void { /* handled in load() */ }
}
