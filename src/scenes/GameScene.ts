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
import { DEFAULT_SETTINGS } from '../config';
import { COLORS, FONT, FONT_GOLD, FONT_GREEN, FONT_GREY, COLOR_STR } from '../ui/UITheme';
import { AudioManager } from '../audio/AudioManager';
import type { Question, GameSettings } from '../logic/types';

export class GameScene extends Phaser.Scene {
  private static readonly CASH_FRAME = 5; // emote_cash in pixel_style1.png spritesheet; verify visually

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
  private streakContainer?: Phaser.GameObjects.Container;
  private audio!: AudioManager;

  constructor() { super({ key: 'GameScene' }); }

  create(): void {
    const data = this.scene.settings.data as { settings?: GameSettings } | undefined;
    if (data?.settings) this.settings = data.settings;

    const W = this.scale.width;
    const H = this.scale.height;

    // UI 区背景色（温暖深棕，不是冷黑）
    this.add.rectangle(0, 0, W, H, COLORS.bgWarm).setOrigin(0, 0);
    this.buildStoreScene(W, H);

    // 场景底线分隔条
    this.add.rectangle(0, H * 0.52, W, 4, COLORS.woodDark).setOrigin(0, 0);

    this.patienceBar    = new PatienceBar(this, 20, H * 0.535, W - 40);
    this.stepIndicator  = new StepIndicator(this, 0, H * 0.583, W);
    // 对话框：从 W*0.03 开始（留左边距），宽 W*0.56，数字盘在右侧
    this.dialogueBox    = new DialogueBox(this, W * 0.03, H * 0.633, W * 0.59);
    this.numPad         = new NumPad(this, W * 0.650, H * 0.633);
    this.numPad.setLocked(true);

    this.events.on('keyword_circled', (_id: string) => this.onKeywordCircled());
    this.events.on('all_keywords_done', () => this.unlockAnswer());
    this.events.on('numpad_confirm', (value: number) => this.onAnswer(value));

    this.score = new ScoreManager();
    this.patience = new PatienceMeter();
    this.audio = new AudioManager(this);

    this.scene.launch('HUDScene');
    this.startRound();
  }

  private startRound(): void {
    this.questions = this.bank.buildRound();
    this.roundTimer = this.settings.roundDuration;
    this.currentQuestionIdx = 0;
    this.roundActive = true;
    this.audio.startBgm();
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
    this.customer = new CustomerSprite(this, W * 0.85, H * 0.48);
    this.customer.walkIn(W * 0.60, () => {
      this.dialogueBox.load(q);
      if (q.isHard) this.dialogueBox.showHardBadge();
      this.stepIndicator.setStep('keyword');
    });
  }

  private onKeywordCircled(): void {
    this.score.stageKeywordBonus();
    this.audio.play('keyword_circle');
    this.showFloat(this.scale.width * 0.57, this.scale.height * 0.625, '+¥8', '#ffd060');
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
    this.audio.play('correct');
    const streak = this.score.streak;
    this.updateStreakFire(streak);
    if (streak >= 5) this.spawnConfetti(this.scale.width / 2, this.scale.height * 0.4, 80);
    this.customer.setMood('happy');
    this.flyCoins(this.scale.width * 0.65, this.scale.height * 0.38);
    this.showCorrectBadge(this.score.turnTotal);
    this.time.delayedCall(700, () => {
      if (!this.roundActive) return;
      this.audio.play('customer_happy');
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
    this.patienceBar.flashRed();
    this.audio.play('wrong');
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
    this.audio.play('customer_angry');
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
    if (this.streakContainer) {
      this.streakContainer.each((child: Phaser.GameObjects.GameObject) => {
        this.tweens.killTweensOf(child);
      });
      this.streakContainer.destroy();
      this.streakContainer = undefined;
    }
    this.roundActive = false;
    this.audio.play('round_complete');
    this.spawnConfetti(this.scale.width / 2, this.scale.height * 0.3, 60);
    const roundEarned = this.score.turnTotal;
    this.score.finalizeRound();

    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;
    const cy = H / 2;

    const overlayBg = this.add.rectangle(cx, cy, 800, 420, COLORS.hudBgTop)
      .setOrigin(0.5).setStrokeStyle(3, COLORS.woodDark).setAlpha(0.97);
    const titleTxt = this.add.text(cx, cy - 150, '回合结束', {
      ...FONT, fontSize: '30px', color: COLOR_STR.inkLight,
    }).setOrigin(0.5);
    const earningTxt = this.add.text(cx, cy - 65, `本局收入  ¥${roundEarned}`, {
      ...FONT_GOLD, fontSize: '52px',
    }).setOrigin(0.5);
    const classTxt = this.add.text(cx, cy + 20, `班级累计  ¥${this.score.classTotal}`, {
      ...FONT, fontSize: '28px', color: '#c0a8ff',
    }).setOrigin(0.5);

    const btnNext = this.add.text(cx - 150, cy + 130, '▶  再来一局', {
      ...FONT_GREEN, fontSize: '26px',
      backgroundColor: '#0a2a0a', padding: { x: 24, y: 14 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const btnConfig = this.add.text(cx + 150, cy + 130, '⚙  修改设置', {
      ...FONT_GREY, fontSize: '26px',
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

  private showCorrectBadge(amount: number): void {
    const cx = this.scale.width * 0.50;
    const cy = this.scale.height * 0.32;

    const g = this.add.graphics();
    g.fillStyle(COLORS.green);
    g.fillRoundedRect(cx - 80, cy - 28, 160, 56, 8);
    g.lineStyle(3, COLORS.greenLight);
    g.strokeRoundedRect(cx - 80, cy - 28, 160, 56, 8);
    g.fillStyle(0x1a3000, 0.4);
    g.fillRoundedRect(cx - 80, cy + 32, 160, 4, 2);

    const t = this.add.text(cx, cy, `✓  +¥${amount}`, {
      ...FONT_GOLD, fontSize: '26px', color: '#1a4000', fontStyle: 'bold',
    }).setOrigin(0.5);

    g.setScale(0.4); t.setScale(0.4); g.setAlpha(0); t.setAlpha(0);
    this.tweens.add({
      targets: [g, t],
      scale: 1, alpha: 1,
      duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: [g, t],
          alpha: 0, delay: 700, duration: 300,
          onComplete: () => { g.destroy(); t.destroy(); },
        });
      },
    });
  }

  private spawnConfetti(cx: number, cy: number, count = 50): void {
    const cols = [
      0xff6b6b, 0xfeca57, 0x48dbfb, 0xff9ff3,
      0x54a0ff, 0xa8e87a, 0xffd060, 0xff8c00,
    ];
    for (let i = 0; i < count; i++) {
      const x = cx + (Math.random() - 0.5) * this.scale.width * 0.7;
      const g = this.add.graphics();
      g.fillStyle(cols[Math.floor(Math.random() * cols.length)]);
      g.fillRect(0, 0, 10 + Math.random() * 12, 7 + Math.random() * 9);
      g.setPosition(x, cy - 40).setDepth(200);
      this.tweens.add({
        targets: g,
        x: x + (Math.random() - 0.5) * 320,
        y: cy + this.scale.height * 0.6 + Math.random() * 200,
        rotation: Math.PI * 4 * (Math.random() > 0.5 ? 1 : -1),
        duration: 1400 + Math.random() * 800,
        delay: Math.random() * 350,
        ease: 'Quad.easeIn',
        onComplete: () => g.destroy(),
      });
    }
  }

  private showFloat(x: number, y: number, text: string, color: string): void {
    const t = this.add.text(x, y, text, {
      fontFamily: FONT.fontFamily, fontSize: '18px', color,
    }).setOrigin(0.5);
    this.tweens.add({
      targets: t, y: y - 50, alpha: 0, duration: 1000,
      onComplete: () => t.destroy(),
    });
  }

  private updateStreakFire(streak: number): void {
    if (this.streakContainer) {
      this.streakContainer.each((child: Phaser.GameObjects.GameObject) => {
        this.tweens.killTweensOf(child);
      });
      this.streakContainer.destroy();
      this.streakContainer = undefined;
    }

    if (streak < 3) return;

    if (streak >= 5) this.audio.play('streak_5');
    else this.audio.play('streak_3');

    const is5 = streak >= 5;
    const x = this.scale.width - 80;
    const y = this.scale.height * 0.60;

    this.streakContainer = this.add.container(x, y);

    const count    = is5 ? 3 : 1;
    const fontSize = is5 ? '72px' : '56px';

    for (let i = 0; i < count; i++) {
      const flame = this.add.text((i - (count - 1) / 2) * 56, 0, '🔥', { fontSize })
        .setOrigin(0.5, 1);
      this.streakContainer.add(flame);

      this.tweens.add({
        targets: flame,
        scaleY: 1.15,
        scaleX: 0.88,
        yoyo: true, repeat: -1,
        duration: 260 + i * 50,
        ease: 'Sine.easeInOut',
      });
    }

    const labelSize = is5 ? '32px' : '26px';
    const label = this.add.text(0, -(is5 ? 80 : 66),
      is5 ? '🔥 5连胜！！ 🔥' : '🔥 3连胜！',
      { ...FONT_GOLD, fontSize: labelSize },
    ).setOrigin(0.5);
    this.streakContainer.add(label);

    this.streakContainer.setScale(0.3);
    this.tweens.add({
      targets: this.streakContainer,
      scale: 1, duration: 350, ease: 'Back.easeOut',
    });
  }

  private flyCoins(fromX: number, fromY: number): void {
    this.audio.play('coins');
    const hudCoinX = 60;
    const hudCoinY = 26;

    const offsets = [
      { dx: -12, dy: 0  },
      { dx:   0, dy: -8 },
      { dx:  12, dy: 4  },
    ];

    offsets.forEach(({ dx, dy }, i) => {
      const coin = this.add.image(fromX + dx, fromY + dy, 'emotes', GameScene.CASH_FRAME)
        .setScale(3);
      this.tweens.add({
        targets: coin,
        x: hudCoinX, y: hudCoinY,
        scale: 1,
        delay: i * 100,
        duration: 550,
        ease: 'Quad.easeIn',
        onComplete: () => coin.destroy(),
      });
    });
  }

  private buildStoreScene(W: number, H: number): void {
    const S        = 8;           // 角色缩放 8x
    const sceneBot = H * 0.52;
    const floorY   = H * 0.30;
    const counterY = H * 0.48;   // 柜台台面顶部（降低，让角色露出更多）
    const counterW = 680;
    const counterH = 68;
    const counterTopH = 16;
    const counterX = (W - counterW) / 2;

    // ── 1. 背景层 ────────────────────────────────────────
    const gBg = this.add.graphics();

    // 后墙（温暖米白）
    gBg.fillStyle(0xf5e6d0);
    gBg.fillRect(0, 52, W, floorY - 52);

    // 墙上护墙板
    gBg.fillStyle(0xd4a870);
    gBg.fillRect(0, floorY - 36, W, 36);
    gBg.lineStyle(2, 0xb8854a);
    gBg.lineBetween(0, floorY - 36, W, floorY - 36);

    // 地板（暖木色）
    gBg.fillStyle(0xf2dbb5);
    gBg.fillRect(0, floorY, W, sceneBot - floorY);
    gBg.lineStyle(1, 0xe8cc9a, 0.7);
    const gs = 64;
    for (let x = 0; x <= W; x += gs) gBg.lineBetween(x, floorY, x, sceneBot);
    for (let y = floorY; y <= sceneBot; y += gs) gBg.lineBetween(0, y, W, y);

    // ── 2. 货架（3 组，在后墙上）────────────────────────
    const shelfPositions = [W * 0.18, W * 0.50, W * 0.82];
    const shelfUnitW = 240, shelfUnitH = 200;
    const shelfTop   = 56;
    const productColors = [
      0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6,
      0x1abc9c, 0xe67e22, 0xff69b4, 0x87ceeb, 0xffd700,
    ];
    let ci = 0;
    for (const cx of shelfPositions) {
      const sx = cx - shelfUnitW / 2;
      gBg.fillStyle(0x7a4a2a);
      gBg.fillRect(sx, shelfTop, shelfUnitW, shelfUnitH);
      gBg.fillStyle(0xd4926a);
      gBg.fillRect(sx + 6, shelfTop + 6, shelfUnitW - 12, shelfUnitH - 12);
      for (let row = 0; row < 3; row++) {
        const plankY = shelfTop + (row + 1) * (shelfUnitH / 4);
        gBg.fillStyle(0x7a4a2a);
        gBg.fillRect(sx, plankY - 5, shelfUnitW, 9);
        const iW = 28, iH = 32, nItems = 6;
        const pad = (shelfUnitW - nItems * iW) / (nItems + 1);
        for (let col = 0; col < nItems; col++) {
          const ix = sx + pad + col * (iW + pad);
          const iy = plankY - 5 - iH;
          gBg.fillStyle(productColors[ci++ % productColors.length]);
          gBg.fillRect(ix, iy, iW, iH);
          gBg.fillStyle(0xffffff, 0.22);
          gBg.fillRect(ix + 2, iy + 2, iW - 4, 5);
        }
      }
      gBg.lineStyle(2, 0x5a3010);
      gBg.strokeRect(sx, shelfTop, shelfUnitW, shelfUnitH);
    }

    // ── 3. 收银员（先于柜台画，柜台会盖住下半身）────────
    this.add.image(W * 0.40, counterY, 'urban', 22).setScale(S).setOrigin(0.5, 1);

    // ── 4. 收银台（画在收银员之后，遮住下半身）───────────
    const gCounter = this.add.graphics();
    // 台面
    gCounter.fillStyle(0xc4863c);
    gCounter.fillRect(counterX, counterY - counterTopH, counterW, counterTopH);
    gCounter.fillStyle(0xdea050);
    gCounter.fillRect(counterX + 2, counterY - counterTopH + 2, counterW - 4, 5);
    // 正面
    gCounter.fillStyle(0x9b5a28);
    gCounter.fillRect(counterX, counterY, counterW, counterH);
    gCounter.lineStyle(1, 0x7a3e14, 0.7);
    for (let x = counterX + 80; x < counterX + counterW; x += 80)
      gCounter.lineBetween(x, counterY, x, counterY + counterH);
    gCounter.lineStyle(2, 0xb07030);
    gCounter.strokeRect(counterX, counterY - counterTopH, counterW, counterTopH + counterH);
    // 收银机
    const regX = counterX + 60;
    const regY = counterY - counterTopH - 54;
    gCounter.fillStyle(0x55514e);
    gCounter.fillRect(regX, regY, 80, 54);
    gCounter.fillStyle(0x1a1a1a);
    gCounter.fillRect(regX + 5, regY + 5, 70, 32);
    gCounter.fillStyle(0x22cc55);
    gCounter.fillRect(regX + 8, regY + 8, 64, 26);
    gCounter.fillStyle(0x665544);
    gCounter.fillRect(regX + 8, regY + 40, 64, 10);
  }
}
