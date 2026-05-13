// src/scenes/GameScene.ts
import Phaser from 'phaser';
import { QuestionBank } from '../logic/QuestionBank';
import { MathEngine } from '../logic/MathEngine';
import { PatienceMeter } from '../logic/PatienceMeter';
import { ScoreManager } from '../logic/ScoreManager';
import { DialogueBox } from '../ui/DialogueBox';
import { NumPad } from '../ui/NumPad';
import { PatienceBar } from '../ui/PatienceBar';
import { StepIndicator } from '../ui/StepIndicator';
import { CustomerSprite } from '../ui/CustomerSprite';
import { DEFAULT_SETTINGS, COLORS } from '../config';
import type { Question, GameSettings } from '../logic/types';

export class GameScene extends Phaser.Scene {
  private settings: GameSettings = { ...DEFAULT_SETTINGS };
  private bank = new QuestionBank();
  private score!: ScoreManager;
  private patience!: PatienceMeter;

  private questions: Question[] = [];
  private currentQuestionIdx = 0;
  private currentSlotIdx = 0;
  private wrongAttempts = 0;
  private answerUnlocked = false;
  private overtimeTimer = 0;
  private roundTimer = 0;
  private roundActive = false;
  private customerExiting = false;

  // UI
  private dialogueBox!: DialogueBox;
  private numPad!: NumPad;
  private patienceBar!: PatienceBar;
  private stepIndicator!: StepIndicator;
  private customer!: CustomerSprite;

  constructor() { super({ key: 'GameScene' }); }

  create(): void {
    const data = this.scene.settings.data as { settings?: GameSettings } | undefined;
    if (data?.settings) this.settings = data.settings;

    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(0, 0, W, H, COLORS.bg).setOrigin(0, 0);
    this.buildStoreScene(W, H);

    this.patienceBar = new PatienceBar(this, 10, H * 0.50, W - 20);
    this.stepIndicator = new StepIndicator(this, 0, H * 0.545, W);
    this.dialogueBox = new DialogueBox(this, 0, H * 0.60, W * 0.60);
    this.numPad = new NumPad(this, W * 0.625, H * 0.595);
    this.numPad.setLocked(true);

    this.events.on('keyword_circled', (_id: string) => this.onKeywordCircled());
    this.events.on('all_keywords_done', () => this.unlockAnswer());
    this.events.on('numpad_confirm', (value: number) => this.onAnswer(value));

    this.score = new ScoreManager();
    this.patience = new PatienceMeter();

    this.scene.launch('HUDScene');
    this.startRound();
  }

  private startRound(): void {
    this.questions = this.bank.buildRound();
    this.roundTimer = this.settings.roundDuration;
    this.currentQuestionIdx = 0;
    this.roundActive = true;
    this.nextCustomer();
  }

  private nextCustomer(): void {
    this.customerExiting = false;
    if (this.currentQuestionIdx >= this.questions.length) {
      this.onAllServed();
      return;
    }

    const q = this.questions[this.currentQuestionIdx];
    this.patience.reset();
    this.patience.setPhase('reading');
    this.wrongAttempts = 0;
    this.answerUnlocked = false;
    this.overtimeTimer = 0;
    this.currentSlotIdx = 0;

    this.numPad.setLocked(true);
    this.numPad.reset();
    this.stepIndicator.setStep('reading');
    this.stepIndicator.clearBonus();
    this.patienceBar.update(100);

    const W = this.scale.width;
    const H = this.scale.height;
    this.customer = new CustomerSprite(this, W * 0.72, H * 0.43);
    this.customer.walkIn(W * 0.62, () => {
      this.dialogueBox.load(q);
      if (q.isHard) this.dialogueBox.showHardBadge();
      this.stepIndicator.setStep('keyword');
    });
  }

  private onKeywordCircled(): void {
    this.score.stageKeywordBonus();
    this.showFloat(this.scale.width * 0.58, this.scale.height * 0.60, '+¥8', '#ffd060');
  }

  private unlockAnswer(): void {
    this.answerUnlocked = true;
    const staged = this.score.stagedBonus;
    this.stepIndicator.setStep('answer', staged);
    this.numPad.setLocked(false);
    const q = this.questions[this.currentQuestionIdx];
    this.numPad.setPrompt(q.slots[this.currentSlotIdx].label);
    this.patience.setPhase('answering');
    this.overtimeTimer = 0;
  }

  private onAnswer(value: number): void {
    const q = this.questions[this.currentQuestionIdx];
    if (MathEngine.check(q, this.currentSlotIdx, value)) {
      this.handleCorrectStep(q);
    } else {
      this.handleWrongAnswer();
    }
  }

  private handleCorrectStep(q: Question): void {
    if (this.currentSlotIdx < q.slots.length - 1) {
      // Division: move to second step (remainder)
      this.currentSlotIdx++;
      this.numPad.reset();
      this.numPad.setPrompt(q.slots[this.currentSlotIdx].label);
      return;
    }
    // All slots answered correctly
    this.score.onCorrectAnswer();
    this.customer.setMood('happy');
    this.showFloat(
      this.scale.width * 0.5, this.scale.height * 0.35,
      `¥${this.score.turnTotal}`, '#6fcf6f',
    );
    this.time.delayedCall(700, () => {
      if (!this.roundActive) return;
      this.customer.walkOut(() => {
        this.currentQuestionIdx++;
        this.nextCustomer();
      });
    });
  }

  private handleWrongAnswer(): void {
    this.wrongAttempts++;
    this.score.onWrongAnswer();
    this.patience.onWrongAnswer(this.wrongAttempts);
    this.patienceBar.update(this.patience.value);
    this.customer.setMood('angry');
    this.numPad.reset();
    this.cameras.main.shake(140, 0.007);

    if (this.patience.isDepleted) {
      this.customerLeave();
    } else {
      this.time.delayedCall(500, () => this.customer.setMood('idle'));
    }
  }

  private customerLeave(): void {
    if (this.customerExiting) return;
    this.customerExiting = true;
    this.score.onCustomerLeft();
    this.numPad.setLocked(true);
    this.customer.walkOut(() => {
      this.currentQuestionIdx++;
      this.nextCustomer();
    });
  }

  private onAllServed(): void {
    this.score.onSpeedBonus(this.roundTimer);
    this.endRound();
  }

  private endRound(): void {
    this.roundActive = false;
    const roundEarned = this.score.turnTotal;
    this.score.finalizeRound();

    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;
    const cy = H / 2;

    const overlayBg = this.add.rectangle(cx, cy, 800, 420, 0x08080f)
      .setOrigin(0.5).setStrokeStyle(3, 0x2a2a4a).setAlpha(0.97);
    const titleTxt = this.add.text(cx, cy - 150, '回合结束', {
      fontFamily: '"Courier New", monospace', fontSize: '30px', color: '#666',
    }).setOrigin(0.5);
    const earningTxt = this.add.text(cx, cy - 65, `本局收入  ¥${roundEarned}`, {
      fontFamily: '"Courier New", monospace', fontSize: '52px', color: '#ffd060',
    }).setOrigin(0.5);
    const classTxt = this.add.text(cx, cy + 20, `班级累计  ¥${this.score.classTotal}`, {
      fontFamily: '"Courier New", monospace', fontSize: '28px', color: '#9f9fff',
    }).setOrigin(0.5);

    const btnNext = this.add.text(cx - 150, cy + 130, '▶  再来一局', {
      fontFamily: '"Courier New", monospace', fontSize: '26px', color: '#6fcf6f',
      backgroundColor: '#0a2a0a', padding: { x: 24, y: 14 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const btnConfig = this.add.text(cx + 150, cy + 130, '⚙  修改设置', {
      fontFamily: '"Courier New", monospace', fontSize: '26px', color: '#aaa',
      backgroundColor: '#111122', padding: { x: 24, y: 14 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btnNext.on('pointerup', () => {
      [overlayBg, titleTxt, earningTxt, classTxt, btnNext, btnConfig]
        .forEach(o => o.destroy());
      this.startRound();
    });
    btnConfig.on('pointerup', () => this.scene.start('ConfigScene'));
  }

  override update(_time: number, delta: number): void {
    if (!this.roundActive) return;

    const dt = delta / 1000;
    this.roundTimer = Math.max(0, this.roundTimer - dt);
    if (this.roundTimer <= 0) {
      this.endRound();
      return;
    }

    this.patience.tick(dt);
    this.patienceBar.update(this.patience.value);

    if (this.patience.isDepleted && !this.customerExiting) {
      this.customerLeave();
      return;
    }

    if (this.answerUnlocked) {
      this.overtimeTimer += dt;
      if (this.overtimeTimer > 20) {
        this.patience.setPhase('answering_overtime');
      }
    }

    this.events.emit('hud_update', {
      classTotal: this.score.classTotal,
      secondsLeft: this.roundTimer,
      customerIndex: this.currentQuestionIdx,
      customerCount: this.questions.length,
      highScore: this.score.sessionHighScore,
    });
  }

  private showFloat(x: number, y: number, text: string, color: string): void {
    const t = this.add.text(x, y, text, {
      fontFamily: '"Courier New", monospace', fontSize: '18px', color,
    }).setOrigin(0.5);
    this.tweens.add({
      targets: t, y: y - 50, alpha: 0, duration: 1000,
      onComplete: () => t.destroy(),
    });
  }

  private buildStoreScene(W: number, H: number): void {
    const S = 6;
    const sceneBot = H * 0.50;
    const floorY   = H * 0.32;
    const counterY = H * 0.43;  // counter top surface y

    // === 后墙 ===
    const g = this.add.graphics();
    g.fillStyle(0x1a0d05);
    g.fillRect(0, 52, W, floorY - 52);

    // === 地板 ===
    g.fillStyle(0xc8a87a);
    g.fillRect(0, floorY, W, sceneBot - floorY);
    // 地板网格线
    g.lineStyle(1, 0xb09060, 0.5);
    const gridSize = 64;
    for (let x = 0; x <= W; x += gridSize)  { g.lineBetween(x, floorY, x, sceneBot); }
    for (let y = floorY; y <= sceneBot; y += gridSize) { g.lineBetween(0, y, W, y); }

    // === 货架（5组，等间距） ===
    const shelfPositions = [0.08, 0.25, 0.50, 0.72, 0.90].map(p => p * W);
    const shelfUnitW = 200;
    const shelfUnitH = 180;
    const shelfTop   = 60;
    const numShelves = 3;
    const shelfColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6,
                         0x1abc9c, 0xe67e22, 0xff69b4, 0x87ceeb, 0xffd700];
    let colorIdx = 0;

    for (const cx of shelfPositions) {
      const sx = cx - shelfUnitW / 2;
      // 货架背板
      g.fillStyle(0x5a3010);
      g.fillRect(sx, shelfTop, shelfUnitW, shelfUnitH);
      // 货架正面边框
      g.lineStyle(3, 0x8b5520);
      g.strokeRect(sx, shelfTop, shelfUnitW, shelfUnitH);
      // 3层层板
      for (let row = 0; row < numShelves; row++) {
        const plankY = shelfTop + (row + 1) * (shelfUnitH / (numShelves + 1));
        // 层板
        g.fillStyle(0x8b5520);
        g.fillRect(sx, plankY - 5, shelfUnitW, 8);
        // 层板上放的商品（小彩色方块）
        const itemsPerRow = 5;
        const itemW = 24, itemH = 28;
        const itemPad = (shelfUnitW - itemsPerRow * itemW) / (itemsPerRow + 1);
        for (let col = 0; col < itemsPerRow; col++) {
          const ix = sx + itemPad + col * (itemW + itemPad);
          const iy = plankY - 5 - itemH - 2;
          const c = shelfColors[colorIdx % shelfColors.length];
          colorIdx++;
          g.fillStyle(c);
          g.fillRect(ix, iy, itemW, itemH);
          // 商品高光
          g.fillStyle(0xffffff, 0.25);
          g.fillRect(ix + 2, iy + 2, itemW - 4, 4);
        }
      }
      // 货架底部支柱
      g.fillStyle(0x6b3a0f);
      g.fillRect(sx + 4, shelfTop + shelfUnitH, 12, 20);
      g.fillRect(sx + shelfUnitW - 16, shelfTop + shelfUnitH, 12, 20);
    }

    // === 收银台 ===
    const counterW  = 900;
    const counterFH = 80;   // 正面高度
    const counterTopH = 18; // 台面高度
    const counterX  = (W - counterW) / 2;
    // 台面
    g.fillStyle(0xa0522d);
    g.fillRect(counterX, counterY - counterTopH, counterW, counterTopH);
    g.fillStyle(0xc47a45);
    g.fillRect(counterX, counterY - counterTopH, counterW, 5); // 台面高光
    // 正面
    g.fillStyle(0x7b3a15);
    g.fillRect(counterX, counterY, counterW, counterFH);
    // 正面板条纹
    g.lineStyle(1, 0x5a2a0a, 0.6);
    for (let x = counterX + 80; x < counterX + counterW; x += 80) {
      g.lineBetween(x, counterY, x, counterY + counterFH);
    }
    // 台面边框
    g.lineStyle(2, 0x8b5520);
    g.strokeRect(counterX, counterY - counterTopH, counterW, counterTopH);
    // 收银机（台面右侧）
    const regX = counterX + counterW - 160;
    const regY = counterY - counterTopH - 50;
    g.fillStyle(0x444444);
    g.fillRect(regX, regY, 70, 50);
    g.fillStyle(0x222222);
    g.fillRect(regX + 5, regY + 5, 60, 28); // 屏幕
    g.fillStyle(0x00aa44);
    g.fillRect(regX + 8, regY + 8, 54, 22); // 屏幕发光
    g.fillStyle(0x666666);
    g.fillRect(regX + 10, regY + 36, 50, 10); // 键盘区

    // === 收银员 tile（仍用 Kenney）===
    this.add.image(W * 0.38, counterY, 'urban', 22).setScale(S).setOrigin(0.5, 1);
  }
}
