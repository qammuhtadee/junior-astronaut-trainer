import Phaser from 'phaser';

/**
 * High-visibility side warning note for wrong decisions / unsafe actions.
 * Positioned on the left side below the meters so it stays obvious without overlapping FactCard.
 * Includes a manual [X] dismiss and a prominent Rewind to Checkpoint button.
 */
export class WarningCard extends Phaser.GameObjects.Container {
  constructor(scene, x = 24, y = 136) {
    super(scene, x, y);

    this.baseY = y;
    this.cardWidth = 340;
    this.cardHeight = 148;
    this.visible = false;
    this.setDepth(2100);

    // 1. High-contrast crimson card background & hazard border
    this.bg = scene.add.graphics();
    this.add(this.bg);

    // 2. Warning Header
    this.headerText = scene.add.text(14, 10, '⚠ WARNING // WRONG DECISION', {
      fontFamily: 'monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#fca5a5',
    });
    this.add(this.headerText);

    // 3. Manual Close [X] button
    this.closeBtn = scene.add
      .text(this.cardWidth - 14, 10, '[X]', {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#fca5a5',
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    this.closeBtn.on('pointerdown', (_pointer, _localX, _localY, event) => {
      if (event) event.stopPropagation();
      this.hide();
    });
    this.add(this.closeBtn);

    // 4. Warning Message Body
    this.bodyText = scene.add.text(14, 34, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#fef2f2',
      lineSpacing: 4,
      wordWrap: { width: this.cardWidth - 28 },
    });
    this.add(this.bodyText);

    // 5. Prominent [ REWIND TO CHECKPOINT ] button
    this.rewindBtn = scene.add.container(this.cardWidth / 2, this.cardHeight - 26);
    this.rewindBg = scene.add.graphics();
    this.rewindBg.fillStyle(0xd97706, 1);
    this.rewindBg.fillRoundedRect(-124, -15, 248, 30, 6);
    this.rewindBg.lineStyle(2, 0xfbbf24, 1);
    this.rewindBg.strokeRoundedRect(-124, -15, 248, 30, 6);

    this.rewindText = scene.add
      .text(0, 0, '[ ⏪ REWIND TO CHECKPOINT ]', {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#111827',
      })
      .setOrigin(0.5);

    this.rewindBtn.add([this.rewindBg, this.rewindText]);
    this.rewindBtn.setSize(248, 30);
    this.rewindBtn.setInteractive({ useHandCursor: true });
    this.rewindBtn.on('pointerdown', (_pointer, _localX, _localY, event) => {
      if (event) event.stopPropagation();
      this.hide();
      this.scene.game.events.emit('checkpoint:rewind-lights');
    });
    this.add(this.rewindBtn);

    // Subtle pulsing hazard animation
    scene.tweens.add({
      targets: this,
      y: y + 5,
      duration: 900,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    this.redrawCard(this.cardHeight);
    scene.add.existing(this);
  }

  redrawCard(height) {
    this.cardHeight = height;
    this.bg.clear();

    // Soft drop shadow
    this.bg.fillStyle(0x000000, 0.5);
    this.bg.fillRoundedRect(4, 5, this.cardWidth, height, 12);

    // Dark crimson body
    this.bg.fillStyle(0x280a10, 0.96);
    this.bg.fillRoundedRect(0, 0, this.cardWidth, height, 12);

    // Header highlight stripe
    this.bg.fillStyle(0x7f1d1d, 0.7);
    this.bg.fillRoundedRect(2, 2, this.cardWidth - 4, 24, { tl: 10, tr: 10, bl: 0, br: 0 });

    // Glowing red/amber border
    this.bg.lineStyle(2.5, 0xef4444, 0.95);
    this.bg.strokeRoundedRect(0, 0, this.cardWidth, height, 12);

    this.rewindBtn.setY(height - 26);
  }

  show(text = "You can't navigate around without lights! Operating the outpost in pitch darkness is unsafe.") {
    this.bodyText.setText(text);
    this.setVisible(true);
    this.setAlpha(0);

    const neededHeight = Math.max(138, this.bodyText.height + 92);
    this.redrawCard(neededHeight);

    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 240,
      ease: 'Back.easeOut',
    });
  }

  hide() {
    if (!this.visible) return;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 200,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.setVisible(false);
      },
    });
  }
}
