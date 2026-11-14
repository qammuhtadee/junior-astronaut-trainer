import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants.js';
import { FactCard } from './FactCard.js';

/**
 * Story-driven dialogue & fact system.
 * Supports:
 * - Character speech bubbles positioned cleanly above the astronaut's helmet.
 * - Thought bubbles with cloud styling.
 * - Radio comms where Muntasir holds the whirring radio and a radio dialogue box appears.
 * - Top-right breathing paper Fact Notes that type out on screen and advance on tap/SPACE.
 */
export class DialogueBox extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);

    this.scene = scene;
    this.visible = false;
    this.isActive = false;
    this.justClosed = false;
    this.setDepth(1500);

    this.boxWidth = 460;
    this.boxHeight = 110;
    this.isTyping = false;
    this.currentLine = null;
    this.sequence = [];
    this.sequenceIndex = 0;
    this.onSequenceComplete = null;

    // 1. Speech bubble sub-container
    this.bubbleContainer = scene.add.container(0, 0);
    this.add(this.bubbleContainer);

    this.bubbleGfx = scene.add.graphics();
    this.bubbleContainer.add(this.bubbleGfx);

    // 2. Speaker badge
    this.badgeContainer = scene.add.container(0, 0);
    this.badgeBg = scene.add.graphics();
    this.badgeText = scene.add.text(12, 4, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff',
    });
    this.badgeContainer.add([this.badgeBg, this.badgeText]);
    this.bubbleContainer.add(this.badgeContainer);

    // 3. Radio sprite inside dialogue box for comms broadcasts
    this.radioSprite = scene.add.sprite(50, 52, 'radio', 0).setVisible(false).setScale(0.55);
    this.bubbleContainer.add(this.radioSprite);

    // 4. Held radio sprite next to Muntasir's hand when holding the radio
    this.heldRadio = scene.add.sprite(0, 0, 'radio', 0).setVisible(false).setScale(0.32).setDepth(1450);

    // 5. Dialogue content text
    this.dialogueText = scene.add.text(20, 32, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#f8fafc',
      lineSpacing: 5,
      wordWrap: { width: this.boxWidth - 40 },
    });
    this.bubbleContainer.add(this.dialogueText);

    // 6. "Tap to continue" prompt indicator
    this.nextIndicator = scene.add
      .text(this.boxWidth - 18, this.boxHeight - 12, '▶ TAP / SPACE', {
        fontFamily: 'monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#ffd166',
      })
      .setOrigin(1, 1);
    this.bubbleContainer.add(this.nextIndicator);

    scene.tweens.add({
      targets: this.nextIndicator,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // 7. Dedicated top-right Fact Note card (fixed to camera viewport)
    this.factCard = new FactCard(scene, GAME_WIDTH - 360, 62);
    this.factCard.setScrollFactor(0);

    // Tap & Keyboard input to advance
    this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.spaceKey.on('down', () => this.handleAdvance());
    scene.input.on('pointerdown', () => this.handleAdvance());

    scene.add.existing(this);
  }

  handleAdvance() {
    if (!this.isActive || this.waitingForExclamation) return;

    // If current step is a Fact Note
    if (this.currentLine?.isFact) {
      if (this.factCard.completeTyping()) {
        return;
      }
      this.advanceStep();
      return;
    }

    if (this.isTyping) {
      if (this.typeEvent) this.typeEvent.remove();
      this.dialogueText.setText(this.currentLine.text);
      this.isTyping = false;
      this.nextIndicator.setVisible(true);
      return;
    }

    this.advanceStep();
  }

  advanceStep() {
    this.heldRadio.stop();
    this.heldRadio.setVisible(false);

    this.sequenceIndex++;
    if (this.sequenceIndex < this.sequence.length) {
      this.renderCurrentLine();
    } else {
      this.close();
      if (this.onSequenceComplete) {
        const cb = this.onSequenceComplete;
        this.onSequenceComplete = null;
        cb();
      }
    }
  }

  showSequence(lines, onComplete) {
    if (!lines || lines.length === 0) {
      if (onComplete) onComplete();
      return;
    }
    this.sequence = lines;
    this.sequenceIndex = 0;
    this.onSequenceComplete = onComplete;
    this.isActive = true;
    this.setVisible(true);
    this.renderCurrentLine();
  }

  renderCurrentLine() {
    const line = this.sequence[this.sequenceIndex];
    this.currentLine = line;

    if (line.onStart) {
      line.onStart();
    }

    // Fact card step
    if (line.isFact) {
      this.bubbleContainer.setVisible(false);
      this.factCard.show(line.text);
      return;
    }

    if (line.exclamation && line.target) {
      this.waitingForExclamation = true;
      this.bubbleContainer.setVisible(false);
      this.popExclamation(line.target.x, line.target.y, () => {
        this.waitingForExclamation = false;
        this.displayBubble(line);
      });
    } else {
      this.displayBubble(line);
    }
  }

  popExclamation(targetX, targetY, onComplete) {
    const mark = this.scene.add
      .text(targetX, targetY - 140, '!', {
        fontFamily: 'monospace',
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#ffd166',
        backgroundColor: '#1e293b',
        padding: { x: 10, y: 2 },
      })
      .setOrigin(0.5)
      .setScale(0)
      .setDepth(1600);

    this.scene.tweens.add({
      targets: mark,
      scale: 1.3,
      y: targetY - 155,
      duration: 250,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: mark,
          scale: 1,
          duration: 150,
          hold: 350,
          onComplete: () => {
            mark.destroy();
            if (onComplete) onComplete();
          },
        });
      },
    });
  }

  displayBubble(line) {
    this.setVisible(true);
    this.bubbleContainer.setVisible(true);
    this.bubbleContainer.setAlpha(1);

    const isRadio = !!line.isRadio;
    const isThought = !!line.isThought;
    const speaker = line.speaker || 'Radio';

    const camLeft = this.scene.cameras.main.scrollX;
    let bx = camLeft + GAME_WIDTH / 2 - this.boxWidth / 2;
    let by = 130;

    if (isRadio) {
      if (line.target) {
        bx = Phaser.Math.Clamp(line.target.x - this.boxWidth / 2, camLeft + 30, camLeft + GAME_WIDTH - this.boxWidth - 30);
        by = Math.max(20, line.target.y - this.boxHeight - 135);

        // Show Muntasir holding the radio sprite
        this.heldRadio.setPosition(line.target.x + 26, line.target.y - 56);
        this.heldRadio.setVisible(true);
        this.heldRadio.play('anim-radio');
      }
      this.radioSprite.setVisible(true);
      this.radioSprite.play('anim-radio');
      this.dialogueText.setX(100);
      this.dialogueText.setStyle({ wordWrap: { width: this.boxWidth - 120 } });
    } else {
      this.radioSprite.setVisible(false);
      this.radioSprite.stop();
      this.heldRadio.setVisible(false);
      this.heldRadio.stop();
      this.dialogueText.setX(20);
      this.dialogueText.setStyle({ wordWrap: { width: this.boxWidth - 40 } });

      if (line.target) {
        bx = Phaser.Math.Clamp(line.target.x - this.boxWidth / 2, camLeft + 30, camLeft + GAME_WIDTH - this.boxWidth - 30);
        by = Math.max(20, line.target.y - this.boxHeight - 135);
      }
    }

    this.bubbleContainer.setPosition(bx, by);

    // Color theme per speaker
    let themeColor = 0x38bdf8;
    if (speaker.toLowerCase().includes('muntasir')) themeColor = 0xf28c28;
    else if (speaker.toLowerCase().includes('maisha')) themeColor = 0xff69b4;
    else if (isRadio) themeColor = 0x06b6d4;

    this.bubbleGfx.clear();

    // Shadow
    this.bubbleGfx.fillStyle(0x000000, 0.45);
    this.bubbleGfx.fillRoundedRect(4, 4, this.boxWidth, this.boxHeight, 14);

    if (isThought) {
      this.bubbleGfx.fillStyle(0x131926, 0.95);
      this.bubbleGfx.fillRoundedRect(0, 0, this.boxWidth, this.boxHeight, 18);
      this.bubbleGfx.lineStyle(2, 0xa5b4fc, 0.9);
      this.bubbleGfx.strokeRoundedRect(0, 0, this.boxWidth, this.boxHeight, 18);

      // Thought bubble circles leading down to astronaut's head
      if (line.target) {
        const tailX = Phaser.Math.Clamp(line.target.x - bx, 35, this.boxWidth - 35);
        this.bubbleGfx.fillStyle(0x131926, 0.95);
        this.bubbleGfx.lineStyle(2, 0xa5b4fc, 0.9);
        this.bubbleGfx.fillCircle(tailX, this.boxHeight + 8, 5);
        this.bubbleGfx.strokeCircle(tailX, this.boxHeight + 8, 5);
        this.bubbleGfx.fillCircle(tailX, this.boxHeight + 18, 3);
        this.bubbleGfx.strokeCircle(tailX, this.boxHeight + 18, 3);
      }
    } else {
      this.bubbleGfx.fillStyle(0x0f172a, 0.95);
      this.bubbleGfx.fillRoundedRect(0, 0, this.boxWidth, this.boxHeight, 12);
      this.bubbleGfx.lineStyle(2, themeColor, 0.9);
      this.bubbleGfx.strokeRoundedRect(0, 0, this.boxWidth, this.boxHeight, 12);

      // Tail pointing downwards toward astronaut's head
      if (line.target) {
        const tailX = Phaser.Math.Clamp(line.target.x - bx, 35, this.boxWidth - 35);
        this.bubbleGfx.fillStyle(0x0f172a, 1);
        this.bubbleGfx.fillTriangle(tailX - 10, this.boxHeight, tailX + 10, this.boxHeight, tailX, this.boxHeight + 14);
        this.bubbleGfx.lineStyle(2, themeColor, 0.9);
        this.bubbleGfx.lineBetween(tailX - 10, this.boxHeight, tailX, this.boxHeight + 14);
        this.bubbleGfx.lineBetween(tailX + 10, this.boxHeight, tailX, this.boxHeight + 14);
      }
    }

    // Speaker Badge
    this.badgeText.setText(isThought ? `💭 ${speaker} (Thinking)` : isRadio ? '📡 RADIO' : speaker);
    const badgeW = this.badgeText.width + 24;
    this.badgeBg.clear();
    this.badgeBg.fillStyle(themeColor, 1);
    this.badgeBg.fillRoundedRect(0, 0, badgeW, 22, 6);
    this.badgeContainer.setPosition(14, -11);

    // Typewriter
    this.dialogueText.setText('');
    this.isTyping = true;
    this.nextIndicator.setVisible(false);

    let charIdx = 0;
    const fullText = line.text;

    if (this.typeEvent) this.typeEvent.remove();
    this.typeEvent = this.scene.time.addEvent({
      delay: 20,
      repeat: fullText.length - 1,
      callback: () => {
        charIdx++;
        this.dialogueText.setText(fullText.substring(0, charIdx));
        if (charIdx >= fullText.length) {
          this.isTyping = false;
          this.nextIndicator.setVisible(true);
        }
      },
    });

    // Bouncy pop-in
    this.bubbleContainer.setScale(0.88);
    this.scene.tweens.add({
      targets: this.bubbleContainer,
      scale: 1,
      duration: 180,
      ease: 'Back.easeOut',
    });
  }

  close() {
    if (this.typeEvent) this.typeEvent.remove();
    this.isTyping = false;
    this.isActive = false;
    this.justClosed = true;
    this.scene.time.delayedCall(250, () => {
      this.justClosed = false;
    });

    this.radioSprite.stop();
    this.radioSprite.setVisible(false);
    this.heldRadio.stop();
    this.heldRadio.setVisible(false);
    this.factCard.hide();

    this.scene.tweens.add({
      targets: this.bubbleContainer,
      alpha: 0,
      scale: 0.9,
      duration: 150,
      onComplete: () => {
        this.bubbleContainer.setVisible(false);
        this.setVisible(false);
      },
    });
  }

  destroy() {
    if (this.spaceKey) this.spaceKey.destroy();
    super.destroy();
  }
}
