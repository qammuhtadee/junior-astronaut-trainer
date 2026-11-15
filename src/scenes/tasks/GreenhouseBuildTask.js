import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENES } from '../../config/constants.js';
import { gameState } from '../../state/GameState.js';

const PARTS = [
  { id: 'dome', label: 'UV Pressure Dome', slotY: -96, color: 0x22c55e },
  { id: 'led', label: 'LED Grow Array', slotY: -32, color: 0xf472b6 },
  { id: 'tray', label: 'Hydroponic Root Bed', slotY: 32, color: 0x38bdf8 },
  { id: 'seal', label: 'Co2 / Valve Lock', slotY: 96, color: 0xf59e0b },
];

/**
 * Day 6 Mini-game: Assemble the Modular Mars Greenhouse (Drag & Drop or Click).
 * Preserves progress in gameState.d6GreenhousePlacedParts if closed mid-task.
 */
export class GreenhouseBuildTask extends Phaser.Scene {
  constructor() {
    super('GreenhouseBuildTask');
  }

  create() {
    this.closing = false;
    this.completed = false;
    if (!gameState.d6GreenhousePlacedParts || typeof gameState.d6GreenhousePlacedParts !== 'object') {
      gameState.d6GreenhousePlacedParts = {};
    }

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const panelW = 600;
    const panelH = 510;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.78).setOrigin(0);
    this.modal = this.add.container(cx, GAME_HEIGHT + 320);

    // Chassis
    const chassis = this.add.graphics();
    chassis.fillStyle(0x161b24, 1);
    chassis.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    chassis.lineStyle(3, 0x3b4459, 1);
    chassis.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    chassis.fillStyle(0x15803d, 1);
    chassis.fillRoundedRect(-panelW / 2 + 6, -panelH / 2 + 6, panelW - 12, 42, {
      tl: 10,
      tr: 10,
      bl: 0,
      br: 0,
    });
    this.modal.add(chassis);

    this.modal.add(
      this.add
        .text(0, -panelH / 2 + 27, 'ASSEMBLE MARS GREENHOUSE', {
          fontFamily: 'monospace',
          fontSize: '16px',
          fontStyle: 'bold',
          color: '#ffffff',
        })
        .setOrigin(0.5)
    );

    const closeBtn = this.add
      .text(panelW / 2 - 30, -panelH / 2 + 27, '[X]', {
        fontFamily: 'monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#fecaca',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.closeTask());
    this.modal.add(closeBtn);

    this.statusText = this.add
      .text(0, -panelH / 2 + 68, 'DRAG OR CLICK EACH MODULE INTO ITS GREENHOUSE SLOT (HURRY!)', {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffd166',
      })
      .setOrigin(0.5);
    this.modal.add(this.statusText);

    // Right: Blueprint frame
    const slotX = 125;
    const blueprint = this.add.graphics();
    blueprint.fillStyle(0x0f172a, 0.96);
    blueprint.fillRoundedRect(slotX - 120, -148, 240, 300, 10);
    blueprint.lineStyle(2, 0x4ade80, 0.7);
    blueprint.strokeRoundedRect(slotX - 120, -148, 240, 300, 10);
    this.modal.add(blueprint);

    this.slotViews = {};
    this.partCards = {};

    let order = [0, 1, 2, 3];
    Phaser.Utils.Array.Shuffle(order);
    if (order[0] === 0 && order[1] === 1 && order[2] === 2 && order[3] === 3) {
      order = [2, 3, 0, 1];
    }

    PARTS.forEach((part, idx) => {
      const slotBg = this.add
        .rectangle(slotX, part.slotY, 200, 50, 0x1e293b, 0.9)
        .setStrokeStyle(2, 0x475569, 0.9);
      const slotLbl = this.add
        .text(slotX, part.slotY, `SLOT: ${part.label}`, {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#94a3b8',
        })
        .setOrigin(0.5);
      this.modal.add([slotBg, slotLbl]);
      this.slotViews[part.id] = { x: slotX, y: part.slotY, bg: slotBg, lbl: slotLbl, part };

      const startX = -155;
      const startY = -96 + order[idx] * 64;
      const card = this.add.container(startX, startY);
      const cardBg = this.add.rectangle(0, 0, 210, 48, 0x1e293b, 1).setStrokeStyle(2, part.color, 1);
      const cardTxt = this.add
        .text(0, 0, part.label, {
          fontFamily: 'monospace',
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#f8fafc',
        })
        .setOrigin(0.5);
      card.add([cardBg, cardTxt]);
      card.homeX = startX;
      card.homeY = startY;
      card.part = part;
      card.cardBg = cardBg;
      card.placed = false;

      if (gameState.d6GreenhousePlacedParts[part.id]) {
        this.lockPartIntoSlot(card, this.slotViews[part.id], true);
      } else {
        card.setSize(210, 48);
        card.setInteractive({ useHandCursor: true, draggable: true });
        this.input.setDraggable(card);

        card.on('drag', (_ptr, dragX, dragY) => {
          if (card.placed || this.closing || this.completed) return;
          card.setPosition(dragX, dragY);
        });

        card.on('dragend', () => {
          if (card.placed || this.closing || this.completed) return;
          const targetSlot = this.slotViews[part.id];
          const dist = Phaser.Math.Distance.Between(card.x, card.y, targetSlot.x, targetSlot.y);
          if (dist <= 95) {
            this.lockPartIntoSlot(card, targetSlot, false);
          } else {
            this.tweens.add({
              targets: card,
              x: card.homeX,
              y: card.homeY,
              duration: 180,
              ease: 'Power2',
            });
          }
        });

        card.on('pointerup', (ptr) => {
          if (card.placed || this.closing || this.completed) return;
          if (ptr.getDistance() > 14) return;
          this.lockPartIntoSlot(card, this.slotViews[part.id], false);
        });
      }

      this.partCards[part.id] = card;
      this.modal.add(card);
    });

    this.modal.add(
      this.add
        .text(0, panelH / 2 - 44, 'Compact closed-loop hydroponics grow fresh crops far from Earth resupply.', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#86efac',
          align: 'center',
        })
        .setOrigin(0.5)
    );

    this.tweens.add({
      targets: this.modal,
      y: cy,
      duration: 360,
      ease: 'Back.easeOut',
    });

    this.checkAllPlaced(true);
  }

  lockPartIntoSlot(card, slot, instant) {
    card.placed = true;
    card.disableInteractive();
    gameState.d6GreenhousePlacedParts[card.part.id] = true;

    slot.bg.setFillStyle(0x14532d, 0.9);
    slot.bg.setStrokeStyle(2, 0x4ade80, 1);
    slot.lbl.setColor('#bbf7d0');
    card.cardBg.setFillStyle(0x166534, 1);

    if (instant) {
      card.setPosition(slot.x, slot.y);
    } else {
      this.tweens.add({
        targets: card,
        x: slot.x,
        y: slot.y,
        duration: 180,
        ease: 'Back.easeOut',
        onComplete: () => this.checkAllPlaced(false),
      });
    }
  }

  checkAllPlaced(fromInit) {
    const allDone = PARTS.every((p) => gameState.d6GreenhousePlacedParts[p.id]);
    if (!allDone) return;

    this.completed = true;
    gameState.d6GreenhouseBuilt = true;
    this.statusText.setText('GREENHOUSE ASSEMBLED & SEALED!').setColor('#34d399');
    if (!fromInit) {
      this.cameras.main.flash(260, 74, 222, 128);
      this.time.delayedCall(750, () => this.closeTask());
    }
  }

  closeTask() {
    if (this.closing) return;
    this.closing = true;
    const wasCompleted = this.completed;

    this.tweens.add({
      targets: this.modal,
      y: GAME_HEIGHT + 350,
      duration: 300,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.scene.stop();
        this.scene.resume(SCENES.SURFACE);
        if (wasCompleted) {
          this.game.events.emit('d6:greenhouse-built');
        }
      },
    });
  }
}
