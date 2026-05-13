// src/ui/StepIndicator.ts
import Phaser from 'phaser';

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
      const bg = scene.add.rectangle(i * cellW, 0, cellW - 1, 26, 0x0d0d18)
        .setOrigin(0, 0).setStrokeStyle(1, 0x1a1a2a);
      const label = scene.add.text(i * cellW + cellW / 2, 13, STEP_LABELS[step], {
        fontFamily: '"Courier New", monospace', fontSize: '11px', color: '#444',
      }).setOrigin(0.5, 0.5);
      this.cells.set(step, { bg, label });
      this.add([bg, label]);
    });

    this.bonusText = scene.add.text(width - 4, 13, '', {
      fontFamily: '"Courier New", monospace', fontSize: '10px', color: '#ffd060',
    }).setOrigin(1, 0.5);
    this.add(this.bonusText);
  }

  setStep(active: Step, completedBonus?: number): void {
    const activeIdx = STEP_ORDER.indexOf(active);
    STEP_ORDER.forEach((step, i) => {
      const { bg, label } = this.cells.get(step)!;
      if (i < activeIdx) {
        bg.setFillStyle(0x0a1a0a);
        label.setColor('#5fcf6f').setText(STEP_LABELS[step] + ' ✓');
      } else if (i === activeIdx) {
        bg.setFillStyle(0x1a1400);
        label.setColor('#ffd060').setText(STEP_LABELS[step] + ' ✏');
      } else {
        bg.setFillStyle(0x0d0d18);
        label.setColor('#444').setText(STEP_LABELS[step]);
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
