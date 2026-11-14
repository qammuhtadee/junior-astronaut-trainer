import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/constants.js';
import { gameState } from '../../state/GameState.js';

const PARTS = [
  { id: 'hopper', label: 'Ice Melter Hopper', slotY: -88, color: 0x38bdf8 },
  { id: 'electrolysis', label: 'Electrolysis Chamber', slotY: 2, color: 0xf59e0b },
  { id: 'valve', label: 'O2 Pressure Valve', slotY: 92, color: 0x10b981 },
];

/**
 * Build the Oxygen Maker mini-game (Drag & Place + Power Allocation Choice).
 * Preserves placed modules in gameState.d2OxPlacedParts if closed mid-task.
 */
export class OxygenBuildTask extends Phaser.Scene {
  constructor() {
    super('OxygenBuildTask');
  }

  create() {
    this.closing = false;
    this.choiceResult = null;
    if (!gameState.d2OxPlacedParts || typeof gameState.d2OxPlacedParts !== 'object') {
      gameState.d2OxPlacedParts = {};
    }

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const panelW = 580;
    const panelH = 500;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75).setOrigin(0);
    this.modal = this.add.container(cx, GAME_HEIGHT + 300);

    // Chassis
    const chassis = this.add.graphics();
    chassis.fillStyle(0x161b24, 1);
    chassis.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    chassis.lineStyle(3, 0x3b4459, 1);
    chassis.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    chassis.fillStyle(0x0369a1, 1);
    chassis.fillRoundedRect(-panelW / 2 + 6, -panelH / 2 + 6, panelW - 12, 42, { tl: 10, tr: 10, bl: 0, br: 0 });
    this.modal.add(chassis);

    this.modal.add(
      this.add
        .text(0, -panelH / 2 + 27, 'ASSEMBLE OXYGEN MAKER', {
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
      .text(0, -panelH / 2 + 66, 'DRAG OR CLICK EACH MODULE INTO ITS BLUEPRINT SLOT', {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffd166',
      })
      .setOrigin(0.5);
    this.modal.add(this.statusText);

    // Blueprint Frame on Right
    const slotX = 115;
    const blueprint = this.add.graphics();
    blueprint.fillStyle(0x0f172a, 0.95);
    blueprint.fillRoundedRect(slotX - 115, -142, 230, 294, 10);
    blueprint.lineStyle(2, 0x38bdf8, 0.7);
    blueprint.strokeRoundedRect(slotX - 115, -142, 230, 294, 10);
    this.modal.add(blueprint);

    this.slotViews = {};
    this.partCards = {};

    // Randomize card positions so players must match each module to its matching blueprint slot
    let order = [0, 1, 2];
    Phaser.Utils.Array.Shuffle(order);
    if (order[0] === 0 && order[1] === 1 && order[2] === 2) {
      order = [2, 0, 1];
    }
    const shuffledYSlots = [-88, 2, 92];

    PARTS.forEach((part, idx) => {
      const sy = part.slotY;
      const isPlaced = !!gameState.d2OxPlacedParts[part.id];

      // Target Slot on Right
      const slotGfx = this.add.graphics();
      const slotLabel = this.add
        .text(slotX, sy, isPlaced ? `✔ ${part.label}` : `DROP: ${part.label}`, {
          fontFamily: 'monospace',
          fontSize: '11px',
          fontStyle: 'bold',
          color: isPlaced ? '#ffffff' : '#64748b',
        })
        .setOrigin(0.5);
      this.modal.add([slotGfx, slotLabel]);
      this.slotViews[part.id] = { gfx: slotGfx, label: slotLabel, x: slotX, y: sy, color: part.color, name: part.label };
      this.drawSlot(part.id, isPlaced);

      // Draggable Component on Left in scrambled order (if not already placed)
      if (!isPlaced) {
        const homeX = -150;
        const homeY = shuffledYSlots[order[idx]];
        const card = this.add.container(homeX, homeY);
        const bg = this.add.graphics();
        bg.fillStyle(0x1e293b, 1);
        bg.fillRoundedRect(-96, -28, 192, 56, 8);
        bg.lineStyle(2, part.color, 0.95);
        bg.strokeRoundedRect(-96, -28, 192, 56, 8);
        const text = this.add
          .text(0, 0, part.label, {
            fontFamily: 'monospace',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#f8fafc',
          })
          .setOrigin(0.5);
        card.add([bg, text]);
        card.setSize(192, 56);
        card.setInteractive({ useHandCursor: true, draggable: true });
        this.input.setDraggable(card);

        let wasDragged = false;
        card.on('dragstart', () => {
          wasDragged = false;
          this.modal.bringToTop(card);
        });
        card.on('drag', (_pointer, dragX, dragY) => {
          wasDragged = true;
          card.setPosition(dragX, dragY);
        });
        card.on('dragend', () => {
          const dist = Phaser.Math.Distance.Between(card.x, card.y, slotX, sy);
          if (dist < 85) {
            this.placePart(part.id, card);
          } else {
            if (this.statusText) {
              this.statusText
                .setText(`Drag ${part.label || part.name || 'this module'} to its matching slot on the right!`)
                .setColor('#ffd166');
            }
            this.tweens.add({ targets: card, x: homeX, y: homeY, duration: 200, ease: 'Back.easeOut' });
          }
        });
        card.on('pointerup', () => {
          if (!wasDragged && !gameState.d2OxPlacedParts[part.id]) {
            this.placePart(part.id, card);
          }
        });

        this.modal.add(card);
        this.partCards[part.id] = card;
      }
    });

    // Power Allocation Choice Box (hidden until all 3 parts are placed)
    this.choicePanel = this.add.container(0, 14).setVisible(false);
    const cBg = this.add.graphics();
    cBg.fillStyle(0x0f172a, 0.97);
    cBg.fillRoundedRect(-235, -110, 470, 230, 12);
    cBg.lineStyle(2.5, 0x38bdf8, 1);
    cBg.strokeRoundedRect(-235, -110, 470, 230, 12);

    const cTitle = this.add
      .text(0, -76, 'OXYGEN MAKER ASSEMBLED!\nALLOCATE 40% POWER FOR ELECTROLYSIS?', {
        fontFamily: 'monospace',
        fontSize: '15px',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 6,
        color: '#38bdf8',
      })
      .setOrigin(0.5);

    const cDesc = this.add
      .text(0, -18, 'Splitting water ice requires 40% power (Power: 100% -> 60%).\nOxygen will refill to 100%!', {
        fontFamily: 'monospace',
        fontSize: '11px',
        align: 'center',
        lineSpacing: 4,
        color: '#cbd5e1',
      })
      .setOrigin(0.5);

    const allocBtn = this.makeButton(0, 40, '[ ⚡ ALLOCATE 40% POWER ]', 0x059669, 0x34d399, () => {
      this.choiceResult = 'allocated';
      gameState.d2OxBuilt = true;
      gameState.d2OxSwitchOn = true;
      const curPower = typeof gameState.meters?.power === 'number' ? gameState.meters.power : 100;
      gameState.setMeters({ power: Math.max(10, curPower - 40) });
      gameState.unlockFact?.('human_o2_consumption');
      gameState.stepId = 'd2_oxygen_maker';
      gameState.checkpointId = 'd2_oxygen_maker';
      this.closeTask();
    });

    const refuseBtn = this.makeButton(0, 88, '[ ✖ REFUSE POWER ]', 0x991b1b, 0xf87171, () => {
      this.choiceResult = 'refused';
      this.closeTask();
    });

    this.choicePanel.add([cBg, cTitle, cDesc, allocBtn, refuseBtn]);
    this.modal.add(this.choicePanel);

    if (PARTS.every((p) => !!gameState.d2OxPlacedParts[p.id])) {
      this.showPowerChoice();
    }

    const onEsc = () => this.closeTask();
    this.input.keyboard.on('keydown-ESC', onEsc);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.input?.keyboard) this.input.keyboard.off('keydown-ESC', onEsc);
    });

    // Slide up from bottom
    this.tweens.add({
      targets: this.modal,
      y: cy,
      duration: 380,
      ease: 'Back.easeOut',
    });
  }

  makeButton(x, y, text, fillColor, strokeColor, onClick) {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(fillColor, 1);
    bg.fillRoundedRect(-165, -18, 330, 36, 8);
    bg.lineStyle(2, strokeColor, 1);
    bg.strokeRoundedRect(-165, -18, 330, 36, 8);
    const label = this.add
      .text(0, 0, text, {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    btn.add([bg, label]);
    btn.setSize(330, 36);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', onClick);
    return btn;
  }

  drawSlot(partId, placed) {
    const slot = this.slotViews[partId];
    slot.gfx.clear();
    slot.gfx.fillStyle(placed ? slot.color : 0x131926, placed ? 0.3 : 0.9);
    slot.gfx.fillRoundedRect(slot.x - 98, slot.y - 30, 196, 60, 8);
    slot.gfx.lineStyle(2, placed ? slot.color : 0x475569, 1);
    slot.gfx.strokeRoundedRect(slot.x - 98, slot.y - 30, 196, 60, 8);
    slot.label.setText(placed ? `✔ ${slot.name}` : `DROP: ${slot.name}`);
    slot.label.setColor(placed ? '#ffffff' : '#64748b');
  }

  placePart(partId, card) {
    if (gameState.d2OxPlacedParts[partId]) return;
    gameState.d2OxPlacedParts[partId] = true;
    const slot = this.slotViews[partId];
    card.disableInteractive();

    this.tweens.add({
      targets: card,
      x: slot.x,
      y: slot.y,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        card.destroy();
        this.drawSlot(partId, true);
        if (PARTS.every((p) => !!gameState.d2OxPlacedParts[p.id])) {
          this.showPowerChoice();
        }
      },
    });
  }

  showPowerChoice() {
    this.statusText.setText('UNIT ASSEMBLED — CHOOSE POWER ALLOCATION').setColor('#34d399');
    this.choicePanel.setVisible(true);
    this.modal.bringToTop(this.choicePanel);
  }

  closeTask() {
    if (this.closing) return;
    this.closing = true;
    const result = this.choiceResult;

    this.tweens.add({
      targets: this.modal,
      y: GAME_HEIGHT + 350,
      duration: 300,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.scene.stop();
        const activeRoom = gameState.room === 'surface' ? 'Surface' : 'Outpost';
        this.scene.resume(activeRoom);
        if (result === 'allocated') {
          this.game.events.emit('warning:hide');
          this.game.events.emit('d2:oxygen-built');
        } else if (result === 'refused') {
          this.game.events.emit('warning:show', {
            text: "You can't survive without oxygen! One astronaut needs about 0.84 kg of oxygen a day. Allocate power to the Oxygen Maker!",
            rewindEvent: 'checkpoint:rewind-d2-oxygen',
          });
        }
      },
    });
  }
}
