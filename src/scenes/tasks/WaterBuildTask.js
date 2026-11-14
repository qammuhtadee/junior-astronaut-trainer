import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/constants.js';
import { gameState } from '../../state/GameState.js';

const PARTS = [
  { id: 'inlet_hopper', label: 'ICE MELT HOPPER', sub: 'Top intake funnel', slotY: -120, color: 0x38bdf8 },
  { id: 'heater_coil', label: 'THERMAL HEATER PIPE', sub: 'Melts ice core', slotY: -60, color: 0xf97316 },
  { id: 'sediment_trap', label: 'REGOLITH U-FILTER', sub: 'Traps Martian soil', slotY: 0, color: 0xfacc15 },
  { id: 'charcoal_bed', label: 'CARBON PURIFIER PIPE', sub: 'Removes minerals', slotY: 60, color: 0x34d399 },
  { id: 'clean_spigot', label: 'CLEAN WATER MANIFOLD', sub: 'Potable storage tap', slotY: 120, color: 0x60a5fa },
];

/**
 * Water Station Connect-the-Pipes mini-game (5 scrambled pipe parts + Power Choice).
 * Preserves placed pipe segments in gameState.d3WaterPlacedParts if exited early.
 */
export class WaterBuildTask extends Phaser.Scene {
  constructor() {
    super('WaterBuildTask');
  }

  create() {
    this.closing = false;
    this.choiceResult = null;
    if (!gameState.d3WaterPlacedParts || typeof gameState.d3WaterPlacedParts !== 'object') {
      gameState.d3WaterPlacedParts = {};
    }

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const panelW = 600;
    const panelH = 520;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.78).setOrigin(0);
    this.modal = this.add.container(cx, GAME_HEIGHT + 320);

    // Outer chassis
    const chassis = this.add.graphics();
    chassis.fillStyle(0x161b24, 1);
    chassis.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    chassis.lineStyle(3, 0x3b4459, 1);
    chassis.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    chassis.fillStyle(0x1d4ed8, 1);
    chassis.fillRoundedRect(-panelW / 2 + 6, -panelH / 2 + 6, panelW - 12, 42, {
      tl: 10,
      tr: 10,
      bl: 0,
      br: 0,
    });
    this.modal.add(chassis);

    this.modal.add(
      this.add
        .text(0, -panelH / 2 + 27, 'CONNECT WATER STATION PIPES', {
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
      .text(0, -panelH / 2 + 68, 'DRAG EACH SALVAGED PIPE TO ITS MATCHING BLUEPRINT SLOT!', {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffd166',
      })
      .setOrigin(0.5);
    this.modal.add(this.statusText);

    // Blueprint column on right
    const slotX = 135;
    const blueprint = this.add.graphics();
    blueprint.fillStyle(0x0f172a, 0.96);
    blueprint.fillRoundedRect(slotX - 135, -162, 270, 332, 10);
    blueprint.lineStyle(2, 0x38bdf8, 0.75);
    blueprint.strokeRoundedRect(slotX - 135, -162, 270, 332, 10);
    // Vertical backbone spine connecting all 5 pipeline joints
    blueprint.lineStyle(4, 0x1e293b, 1);
    blueprint.lineBetween(slotX - 96, -120, slotX - 96, 120);
    this.modal.add(blueprint);

    this.pipeConnectorGfx = this.add.graphics();
    this.modal.add(this.pipeConnectorGfx);

    this.slotViews = {};
    this.partCards = {};

    // Scramble left part positions so players genuinely connect the jumbled pipes
    const homeYPositions = [-120, -60, 0, 60, 120];
    let order = [0, 1, 2, 3, 4];
    Phaser.Utils.Array.Shuffle(order);
    if (order.every((v, i) => v === i)) {
      order = [2, 4, 1, 0, 3];
    }

    PARTS.forEach((part, idx) => {
      const sy = part.slotY;
      const isPlaced = !!gameState.d3WaterPlacedParts[part.id];

      const slotGfx = this.add.graphics();
      const slotLabel = this.add
        .text(slotX + 8, sy - 7, isPlaced ? `✔ ${part.label}` : `SLOT: ${part.label}`, {
          fontFamily: 'monospace',
          fontSize: '10px',
          fontStyle: 'bold',
          color: isPlaced ? '#ffffff' : '#94a3b8',
        })
        .setOrigin(0.5);
      const slotSub = this.add
        .text(slotX + 8, sy + 9, part.sub, {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: isPlaced ? '#bfdbfe' : '#475569',
        })
        .setOrigin(0.5);
      this.modal.add([slotGfx, slotLabel, slotSub]);

      this.slotViews[part.id] = {
        gfx: slotGfx,
        label: slotLabel,
        subLabel: slotSub,
        x: slotX,
        y: sy,
        color: part.color,
        name: part.label,
      };
      this.drawSlot(part.id, isPlaced);

      if (!isPlaced) {
        const homeX = -155;
        const homeY = homeYPositions[order[idx]];
        const card = this.add.container(homeX, homeY);

        const bg = this.add.graphics();
        bg.fillStyle(0x1e293b, 1);
        bg.fillRoundedRect(-118, -24, 236, 48, 8);
        bg.lineStyle(2, part.color, 0.95);
        bg.strokeRoundedRect(-118, -24, 236, 48, 8);

        const iconGfx = this.add.graphics();
        this.drawPipeIcon(iconGfx, part.id, part.color, -90, 0);

        const text = this.add
          .text(-62, -7, part.label, {
            fontFamily: 'monospace',
            fontSize: '11px',
            fontStyle: 'bold',
            color: '#f8fafc',
          })
          .setOrigin(0, 0.5);
        const subText = this.add
          .text(-62, 9, part.sub, {
            fontFamily: 'monospace',
            fontSize: '9px',
            color: '#94a3b8',
          })
          .setOrigin(0, 0.5);

        card.add([bg, iconGfx, text, subText]);
        card.setSize(236, 48);
        card.setInteractive({ useHandCursor: true, draggable: true });
        this.input.setDraggable(card);

        card.on('dragstart', () => {
          this.modal.bringToTop(card);
          card.setScale(1.04);
        });
        card.on('drag', (_pointer, dragX, dragY) => {
          card.setPosition(dragX, dragY);
        });
        card.on('dragend', () => {
          card.setScale(1);
          const dist = Phaser.Math.Distance.Between(card.x, card.y, slotX, sy);
          if (dist < 80) {
            this.placePart(part.id, card);
          } else {
            this.statusText
              .setText(`Drag ${part.label} to its matching glowing slot on the right!`)
              .setColor('#ffd166');
            this.tweens.add({ targets: card, x: homeX, y: homeY, duration: 200, ease: 'Back.easeOut' });
          }
        });

        this.modal.add(card);
        this.partCards[part.id] = card;
      }
    });

    this.redrawPipeFlow();

    // Power Allocation Choice Box (hidden until all 5 pipes connected)
    this.choicePanel = this.add.container(0, 14).setVisible(false);
    const cBg = this.add.graphics();
    cBg.fillStyle(0x0f172a, 0.97);
    cBg.fillRoundedRect(-245, -112, 490, 232, 12);
    cBg.lineStyle(2.5, 0x38bdf8, 1);
    cBg.strokeRoundedRect(-245, -112, 490, 232, 12);

    const cTitle = this.add
      .text(0, -76, 'WATER PIPELINE CONNECTED!\nALLOCATE POWER TO MELT & PURIFY ICE?', {
        fontFamily: 'monospace',
        fontSize: '15px',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 6,
        color: '#38bdf8',
      })
      .setOrigin(0.5);

    const cDesc = this.add
      .text(0, -18, 'Heating Martian ice and filtering sediment draws extra battery power,\nbut refills clean drinking water for the crew!', {
        fontFamily: 'monospace',
        fontSize: '11px',
        align: 'center',
        lineSpacing: 4,
        color: '#cbd5e1',
      })
      .setOrigin(0.5);

    const allocBtn = this.makeButton(0, 40, '[ ⚡ ALLOCATE POWER FOR WATER ]', 0x059669, 0x34d399, () => {
      this.choiceResult = 'allocated';
      gameState.d3WaterBuilt = true;
      gameState.d3WaterSwitchOn = true;
      const cur = typeof gameState.meters?.power === 'number' ? gameState.meters.power : 60;
      gameState.setMeters({ power: Math.max(10, cur - 20) });
      gameState.stepId = 'd3_water_station';
      gameState.checkpointId = 'd3_water_station';
      this.closeTask();
    });

    const refuseBtn = this.makeButton(0, 88, '[ ✕ DO NOT ALLOCATE POWER ]', 0x991b1b, 0xf87171, () => {
      this.choiceResult = 'refused';
      this.closeTask();
    });

    this.choicePanel.add([cBg, cTitle, cDesc, allocBtn, refuseBtn]);
    this.modal.add(this.choicePanel);

    if (PARTS.every((p) => !!gameState.d3WaterPlacedParts[p.id])) {
      this.showPowerChoice();
    }

    const onEsc = () => this.closeTask();
    this.input.keyboard.on('keydown-ESC', onEsc);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.input?.keyboard) this.input.keyboard.off('keydown-ESC', onEsc);
    });

    this.tweens.add({
      targets: this.modal,
      y: cy,
      duration: 360,
      ease: 'Back.easeOut',
    });
  }

  drawPipeIcon(g, id, color, x, y) {
    g.lineStyle(2.5, color, 1);
    g.fillStyle(color, 0.25);
    if (id === 'inlet_hopper') {
      g.fillTriangle(x - 12, y - 10, x + 12, y - 10, x, y + 10);
      g.strokeTriangle(x - 12, y - 10, x + 12, y - 10, x, y + 10);
    } else if (id === 'heater_coil') {
      g.lineBetween(x - 12, y - 6, x + 12, y - 6);
      g.lineBetween(x + 12, y - 6, x - 12, y + 6);
      g.lineBetween(x - 12, y + 6, x + 12, y + 6);
    } else if (id === 'sediment_trap') {
      g.beginPath();
      g.moveTo(x - 10, y - 9);
      g.lineTo(x - 10, y + 6);
      g.lineTo(x + 10, y + 6);
      g.lineTo(x + 10, y - 9);
      g.strokePath();
    } else if (id === 'charcoal_bed') {
      g.fillRoundedRect(x - 11, y - 8, 22, 16, 4);
      g.strokeRoundedRect(x - 11, y - 8, 22, 16, 4);
      g.fillCircle(x - 4, y, 2);
      g.fillCircle(x + 4, y, 2);
    } else {
      g.lineBetween(x - 12, y - 4, x + 6, y - 4);
      g.lineBetween(x + 6, y - 4, x + 6, y + 8);
      g.fillCircle(x + 6, y + 10, 3);
    }
  }

  drawSlot(partId, placed) {
    const slot = this.slotViews[partId];
    slot.gfx.clear();
    slot.gfx.fillStyle(placed ? slot.color : 0x131926, placed ? 0.28 : 0.9);
    slot.gfx.fillRoundedRect(slot.x - 118, slot.y - 24, 240, 48, 8);
    slot.gfx.lineStyle(2, placed ? slot.color : 0x475569, 1);
    slot.gfx.strokeRoundedRect(slot.x - 118, slot.y - 24, 240, 48, 8);
    slot.label.setText(placed ? `✔ ${slot.name}` : `SLOT: ${slot.name}`);
    slot.label.setColor(placed ? '#ffffff' : '#94a3b8');
    slot.subLabel.setColor(placed ? '#e0f2fe' : '#64748b');
  }

  redrawPipeFlow() {
    this.pipeConnectorGfx.clear();
    for (let i = 0; i < PARTS.length - 1; i++) {
      const a = PARTS[i];
      const b = PARTS[i + 1];
      if (gameState.d3WaterPlacedParts[a.id] && gameState.d3WaterPlacedParts[b.id]) {
        this.pipeConnectorGfx.lineStyle(5, 0x38bdf8, 0.9);
        this.pipeConnectorGfx.lineBetween(39, a.slotY + 12, 39, b.slotY - 12);
      }
    }
  }

  placePart(partId, card) {
    if (gameState.d3WaterPlacedParts[partId]) return;
    gameState.d3WaterPlacedParts[partId] = true;
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
        this.redrawPipeFlow();
        if (PARTS.every((p) => !!gameState.d3WaterPlacedParts[p.id])) {
          this.showPowerChoice();
        }
      },
    });
  }

  showPowerChoice() {
    this.statusText.setText('PIPELINE BUILT — CHOOSE POWER ALLOCATION').setColor('#34d399');
    this.choicePanel.setVisible(true);
    this.modal.bringToTop(this.choicePanel);
  }

  makeButton(x, y, text, fillColor, strokeColor, onClick) {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(fillColor, 1);
    bg.fillRoundedRect(-175, -18, 350, 36, 8);
    bg.lineStyle(2, strokeColor, 1);
    bg.strokeRoundedRect(-175, -18, 350, 36, 8);
    const label = this.add
      .text(0, 0, text, {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    btn.add([bg, label]);
    btn.setSize(350, 36);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', onClick);
    return btn;
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
        this.scene.resume('Outpost');
        if (result === 'allocated') {
          this.game.events.emit('warning:hide');
          this.game.events.emit('d3:water-built');
        } else if (result === 'refused') {
          this.game.events.emit('water:start-rapid-drain');
          this.game.events.emit('warning:show', {
            text: 'Warning: Without power to heat and purify Martian ice, the crew will dehydrate! Humans can survive only about 3 days without water.',
            rewindEvent: 'checkpoint:rewind-d3-water',
          });
        }
      },
    });
  }
}
