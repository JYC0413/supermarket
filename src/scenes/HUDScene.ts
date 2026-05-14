// src/scenes/HUDScene.ts
import Phaser from 'phaser';
import { FONT_GOLD, FONT_GREEN, FONT_GREY, COLORS, COLOR_STR } from '../ui/UITheme';

export class HUDScene extends Phaser.Scene {
  private classText!:     Phaser.GameObjects.Text;
  private timerText!:     Phaser.GameObjects.Text;
  private progressText!:  Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'HUDScene' }); }

  create(): void {
    const W = this.scale.width;

    // 顶栏背景（深棕渐变用两层矩形近似）
    this.add.rectangle(0, 0, W, 52, COLORS.hudBgTop).setOrigin(0, 0);
    this.add.rectangle(0, 40, W, 12, COLORS.hudBgBot).setOrigin(0, 0);
    // 底边装饰线
    this.add.rectangle(0, 51, W, 3, COLORS.hudBorder).setOrigin(0, 0);

    this.classText = this.add.text(16, 26, '🪙 班级: ¥0', { ...FONT_GOLD, fontSize: '20px' })
      .setOrigin(0, 0.5);

    // 计时器：凹陷显示框
    const timerBg = this.add.graphics();
    timerBg.fillStyle(COLORS.timerBg);
    timerBg.fillRect(W / 2 - 56, 10, 112, 32);
    timerBg.lineStyle(2, COLORS.timerBorder);
    timerBg.strokeRect(W / 2 - 56, 10, 112, 32);
    this.timerText = this.add.text(W / 2, 26, '⏱ 5:00', {
      ...FONT_GOLD, fontSize: '22px', color: COLOR_STR.timerStr,
    }).setOrigin(0.5, 0.5);

    this.progressText = this.add.text(W * 0.72, 26, '👥 0/8', {
      ...FONT_GREY, fontSize: '18px', color: COLOR_STR.inkLight,
    }).setOrigin(0, 0.5);

    this.highScoreText = this.add.text(W - 16, 26, '🏆 最高: ¥0', {
      ...FONT_GREEN, fontSize: '20px',
    }).setOrigin(1, 0.5);

    this.scene.get('GameScene').events.on('hud_update', this.onUpdate, this);
  }

  private onUpdate(data: {
    classTotal:    number;
    secondsLeft:   number;
    customerIndex: number;
    customerCount: number;
    highScore:     number;
  }): void {
    this.classText.setText(`🪙 班级: ¥${data.classTotal}`);
    const m = Math.floor(data.secondsLeft / 60);
    const s = String(Math.floor(data.secondsLeft % 60)).padStart(2, '0');
    this.timerText.setText(`⏱ ${m}:${s}`);
    this.progressText.setText(`👥 ${data.customerIndex}/${data.customerCount}`);
    this.highScoreText.setText(`🏆 最高: ¥${data.highScore}`);
  }
}
