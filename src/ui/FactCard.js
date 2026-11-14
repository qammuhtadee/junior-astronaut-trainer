import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants.js';

/**
 * Curved-edge rectangular paper note on the almost top-right side.
 * Breathes up and down gently, fades in, and types out the NASA fact onto the paper.
 */
export class FactCard extends Phaser.GameObjects.Container {
  constructor(scene, x = GAME_WIDTH - 360, y = 62) {
    super(scene, x, y);

    this.baseY = y;
    this.cardWidth = 335;
    this.cardHeight = 135;
    this.visible = false;
    this.isTyping = false;
    this.fullText = '';
    this.setDepth(2000);

    // 1. Paper Note Background Graphics
    this.bg = scene.add.graphics();
    this.add(this.bg);

    // 2. Top Paper Header
    this.headerText = scene.add.text(14, 10, 'NOTE // FACT CHECK', {
      fontFamily: 'monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#92400e',
    });
    this.add(this.headerText);

    // 3. Typed Fact Text on Paper
    this.bodyText = scene.add.text(14, 30, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#1e293b',
      lineSpacing: 4,
      wordWrap: { width: this.cardWidth - 28 },
    });
    this.add(this.bodyText);

    // 4. Tap prompt at bottom right
    this.dismissPrompt = scene.add
      .text(this.cardWidth - 14, this.cardHeight - 10, '▶ TAP / SPACE', {
        fontFamily: 'monospace',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#b45309',
      })
      .setOrigin(1, 1);
    this.add(this.dismissPrompt);

    this.redrawCard(this.cardHeight);

    // Gentle breathing up and down tween
    scene.tweens.add({
      targets: this,
      y: y + 7,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    scene.add.existing(this);
  }

  redrawCard(height) {
    this.cardHeight = height;
    this.bg.clear();

    // Soft drop shadow
    this.bg.fillStyle(0x000000, 0.35);
    this.bg.fillRoundedRect(4, 5, this.cardWidth, height, 14);

    // Warm paper body with curved edges
    this.bg.fillStyle(0xfef9c3, 0.97);
    this.bg.fillRoundedRect(0, 0, this.cardWidth, height, 14);

    // Subtle ruled paper lines
    this.bg.lineStyle(1, 0xfde68a, 0.7);
    for (let ly = 46; ly < height - 20; ly += 18) {
      this.bg.lineBetween(12, ly, this.cardWidth - 12, ly);
    }

    // Paper border
    this.bg.lineStyle(2, 0xd97706, 0.85);
    this.bg.strokeRoundedRect(0, 0, this.cardWidth, height, 14);

    this.dismissPrompt.setY(height - 10);
  }

  show(text, { duration = 0 } = {}) {
    if (this.typeTimer) this.typeTimer.remove();
    if (this.autoDismissTimer) this.autoDismissTimer.remove();

    this.fullText = text;
    this.isTyping = true;
    this.bodyText.setText('');
    this.setVisible(true);
    this.setAlpha(0);

    // Measure height required for text
    const dummy = this.scene.add
      .text(0, 0, text, {
        fontFamily: 'monospace',
        fontSize: '12px',
        lineSpacing: 4,
        wordWrap: { width: this.cardWidth - 28 },
      })
      .setVisible(false);

    const neededHeight = Math.max(115, dummy.height + 54);
    dummy.destroy();
    this.redrawCard(neededHeight);

    // Fade in
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 350,
      ease: 'Cubic.easeOut',
    });

    // Typewriter effect onto paper
    let charIdx = 0;
    this.typeTimer = this.scene.time.addEvent({
      delay: 18,
      repeat: text.length - 1,
      callback: () => {
        charIdx++;
        this.bodyText.setText(text.substring(0, charIdx));
        if (charIdx >= text.length) {
          this.isTyping = false;
        }
      },
    });

    if (duration > 0) {
      this.autoDismissTimer = this.scene.time.delayedCall(duration, () => {
        this.hide();
      });
    }
  }

  completeTyping() {
    if (!this.isTyping) return false;
    if (this.typeTimer) this.typeTimer.remove();
    this.bodyText.setText(this.fullText);
    this.isTyping = false;
    return true;
  }

  hide() {
    if (!this.visible) return;
    if (this.typeTimer) this.typeTimer.remove();
    if (this.autoDismissTimer) this.autoDismissTimer.remove();
    this.isTyping = false;

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
