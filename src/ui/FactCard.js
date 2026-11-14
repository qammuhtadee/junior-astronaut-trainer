import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants.js';

/**
 * Independent curved-edge rectangular paper note on the almost top-right side.
 * Breathes up and down gently, fades in with the fact typed on the paper,
 * and stays visible until manually closed by the player (never blocks movement or dialogue).
 */
export class FactCard extends Phaser.GameObjects.Container {
  constructor(scene, x = GAME_WIDTH - 595, y = 58) {
    super(scene, x, y);

    this.baseY = y;
    this.cardWidth = 410;
    this.cardHeight = 160;
    this.visible = false;
    this.isTyping = false;
    this.fullText = '';
    this.autoCloseTimer = null;
    this.fadeTween = null;
    this.setDepth(2000);

    // 1. Paper Note Background Graphics
    this.bg = scene.add.graphics();
    this.add(this.bg);

    // 2. Top Paper Header
    this.headerText = scene.add.text(16, 11, '📌 NASA FACT // LOGBOOK UPDATED', {
      fontFamily: 'monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#92400e',
    });
    this.add(this.headerText);

    // 3. Manual Close [X] button at top-right of the note
    this.closeBtn = scene.add
      .text(this.cardWidth - 14, 11, '[X]', {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#b45309',
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    this.closeBtn.on('pointerdown', (_pointer, _localX, _localY, event) => {
      if (event) event.stopPropagation();
      this.hide();
    });
    this.add(this.closeBtn);

    // 4. Typed Fact Text on Paper
    this.bodyText = scene.add.text(16, 36, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#1e293b',
      lineSpacing: 5,
      wordWrap: { width: this.cardWidth - 32 },
    });
    this.add(this.bodyText);

    // 5. Subtle manual dismiss hint at bottom right
    this.dismissPrompt = scene.add
      .text(this.cardWidth - 14, this.cardHeight - 10, 'Click [X] to close', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#92400e',
      })
      .setOrigin(1, 1);
    this.add(this.dismissPrompt);

    // Clicking anywhere on the card Either completes typing or closes it manually
    this.hitZone = scene.add
      .rectangle(0, 0, this.cardWidth, this.cardHeight, 0x000000, 0)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });
    this.hitZone.on('pointerdown', (_pointer, _localX, _localY, event) => {
      if (event) event.stopPropagation();
      if (!this.completeTyping()) {
        this.hide();
      }
    });
    this.addAt(this.hitZone, 1);

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

    this.hitZone.setSize(this.cardWidth, height);
    this.dismissPrompt.setY(height - 10);
  }

  show(text) {
    if (this.typeTimer) this.typeTimer.remove();

    this.fullText = text;
    this.isTyping = true;
    this.bodyText.setText('');
    this.setVisible(true);
    this.setAlpha(0);

    // Measure height required for text
    const dummy = this.scene.add
      .text(0, 0, text, {
        fontFamily: 'monospace',
        fontSize: '14px',
        lineSpacing: 5,
        wordWrap: { width: this.cardWidth - 32 },
      })
      .setVisible(false);

    const neededHeight = Math.max(145, dummy.height + 64);
    dummy.destroy();
    this.redrawCard(neededHeight);

    // Auto-close after 15 seconds if player hasn't manually dismissed it
    if (this.autoCloseTimer) {
      this.autoCloseTimer.remove();
      this.autoCloseTimer = null;
    }
    this.autoCloseTimer = this.scene.time.delayedCall(15000, () => {
      this.hide(false);
    });

    // Fade in
    if (this.fadeTween) this.fadeTween.stop();
    this.fadeTween = this.scene.tweens.add({
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
  }

  completeTyping() {
    if (!this.isTyping) return false;
    if (this.typeTimer) this.typeTimer.remove();
    this.bodyText.setText(this.fullText);
    this.isTyping = false;
    return true;
  }

  hide(immediate = false) {
    if (this.typeTimer) {
      this.typeTimer.remove();
      this.typeTimer = null;
    }
    if (this.autoCloseTimer) {
      this.autoCloseTimer.remove();
      this.autoCloseTimer = null;
    }
    if (this.fadeTween) {
      this.fadeTween.stop();
      this.fadeTween = null;
    }
    this.isTyping = false;

    if (!this.visible) return;

    if (immediate) {
      this.alpha = 0;
      this.setVisible(false);
      return;
    }

    this.fadeTween = this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 250,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.setVisible(false);
        this.fadeTween = null;
      },
    });
  }
}
