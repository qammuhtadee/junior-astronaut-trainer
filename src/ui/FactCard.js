import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants.js';

/**
 * Animated NASA Fact Card that appears in the top-right corner.
 * Features:
 * - Curved edge rectangular card with glowing sci-fi border.
 * - Breathing / floating up-and-down tween.
 * - Typewriter text effect.
 * - Auto-fades or tap to dismiss.
 */
export class FactCard extends Phaser.GameObjects.Container {
  constructor(scene, x = GAME_WIDTH - 340, y = 30) {
    super(scene, x, y);

    this.cardWidth = 315;
    this.cardHeight = 135;
    this.visible = false;
    this.setDepth(2000);

    // 1. Background Card Graphics
    this.bg = scene.add.graphics();
    this.add(this.bg);

    // 2. NASA Header Pill
    this.headerBg = scene.add.graphics();
    this.add(this.headerBg);

    this.headerText = scene.add.text(12, 10, '🛰️ NASA MISSION FACT', {
      fontFamily: 'monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#38bdf8',
    });
    this.add(this.headerText);

    // 3. Body Text (typewriter target)
    this.bodyText = scene.add.text(12, 34, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#e2e8f0',
      lineSpacing: 4,
      wordWrap: { width: this.cardWidth - 24 },
    });
    this.add(this.bodyText);

    // 4. Subtle tap prompt at bottom right
    this.dismissPrompt = scene.add
      .text(this.cardWidth - 12, this.cardHeight - 12, '[TAP TO DISMISS]', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#64748b',
      })
      .setOrigin(1, 1);
    this.add(this.dismissPrompt);

    // Interactive hit area to dismiss
    this.setSize(this.cardWidth, this.cardHeight);
    this.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, this.cardWidth, this.cardHeight),
      Phaser.Geom.Rectangle.Contains
    );
    this.on('pointerdown', () => this.hide());

    this.redrawCard(this.cardHeight);

    // Breathing float tween
    scene.tweens.add({
      targets: this,
      y: y + 6,
      duration: 2200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    scene.add.existing(this);
  }

  redrawCard(height) {
    this.cardHeight = height;
    this.bg.clear();

    // Dark glass background
    this.bg.fillStyle(0x0a101d, 0.92);
    this.bg.fillRoundedRect(0, 0, this.cardWidth, height, 12);

    // Sleek border
    this.bg.lineStyle(2, 0x38bdf8, 0.7);
    this.bg.strokeRoundedRect(0, 0, this.cardWidth, height, 12);

    // Accent line on top
    this.bg.lineStyle(3, 0xf59e0b, 0.9);
    this.bg.lineBetween(16, 0, 70, 0);

    // Header plate background
    this.headerBg.clear();
    this.headerBg.fillStyle(0x1e293b, 0.85);
    this.headerBg.fillRoundedRect(8, 6, 175, 20, 6);

    this.dismissPrompt.setY(height - 8);
  }

  show(text, { duration = 14000 } = {}) {
    if (this.typeTimer) this.typeTimer.remove();
    if (this.autoDismissTimer) this.autoDismissTimer.remove();

    this.fullText = text;
    this.bodyText.setText('');
    this.setVisible(true);
    this.setAlpha(0);

    // Measure required height
    const dummy = this.scene.add
      .text(0, 0, text, {
        fontFamily: 'monospace',
        fontSize: '11px',
        lineSpacing: 4,
        wordWrap: { width: this.cardWidth - 24 },
      })
      .setVisible(false);

    const neededHeight = Math.max(120, dummy.height + 56);
    dummy.destroy();
    this.redrawCard(neededHeight);

    // Fade in
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 350,
      ease: 'Cubic.easeOut',
    });

    // Typewriter effect
    let charIdx = 0;
    this.typeTimer = this.scene.time.addEvent({
      delay: 18,
      repeat: text.length - 1,
      callback: () => {
        charIdx++;
        this.bodyText.setText(text.substring(0, charIdx));
      },
    });

    if (duration > 0) {
      this.autoDismissTimer = this.scene.time.delayedCall(duration, () => {
        this.hide();
      });
    }
  }

  hide() {
    if (!this.visible) return;
    if (this.typeTimer) this.typeTimer.remove();
    if (this.autoDismissTimer) this.autoDismissTimer.remove();

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 300,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.setVisible(false);
      },
    });
  }
}
