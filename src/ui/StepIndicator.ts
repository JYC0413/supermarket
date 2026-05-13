// src/ui/StepIndicator.ts
import Phaser from 'phaser';
import { FONT, COLORS, COLOR_STR } from './UITheme';

type Step = 'reading' | 'keyword' | 'answer';

const STEP_LABELS: Record<Step, string> = {
  reading: '① 读题',
  keyword: '② 圈关键词',
  answer: '③ 答题',
};
const STEP_ORDER: Step[] = ['reading', 'keyword', 'answer'];

export class StepIndicator extends Phaser.GameObjects.Container {
  private cells = new Map<Step, {
    bg: Phaser.GameObjects.Rectangle;
    label: Phaser.GameObjects.Text;
  }>();
  private bonusText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number) {
    super(scene, x, y);
    scene.add.existing(this);

    const cellW = Math.floor(width / 3);

    STEP_ORDER.forEach((step, i) => {
      const bg = scene.add.rectangle(i * cellW, 0, cellW - 1, 46, COLORS.bgWarm)
        .setOrigin(0, 0).setStrokeStyle(1, 0x3a2a18);
      const label = scene.add.text(i * cellW + cellW / 2, 23, STEP_LABELS[step], {
        ...FONT, fontSize: '19px', color: COLOR_STR.inkLight,
      }).setOrigin(0.5, 0.5);
      this.cells.set(step, { bg, label });
      this.add([bg, label]);
    });

    this.bonusText = scene.add.text(width - 6, 23, '', {
      ...FONT, fontSize: '18px', color: COLOR_STR.gold,
    }).setOrigin(1, 0.5);
    this.add(this.bonusText);
  }

  setStep(active: Step, completedBonus?: number): void {
    const activeIdx = STEP_ORDER.indexOf(active);
    STEP_ORDER.forEach((step, i) => {
      const { bg, label } = this.cells.get(step)!;
      if (i < activeIdx) {
        bg.setFillStyle(0xeaf8e0);
        label.setColor(COLOR_STR.green).setText(STEP_LABELS[step] + ' ✓');
      } else if (i === activeIdx) {
        bg.setFillStyle(COLORS.goldNum);
        label.setColor(COLOR_STR.gold).setText(STEP_LABELS[step] + ' ✏');
      } else {
        bg.setFillStyle(COLORS.bgWarm);
        label.setColor(COLOR_STR.inkLight).setText(STEP_LABELS[step]);
      }
    });
    if (completedBonus !== undefined && completedBonus > 0) {
      this.bonusText.setText(`+¥${completedBonus}`);
    }
  }

  clearBonus(): void {
    this.bonusText.setText('');
  }
}
