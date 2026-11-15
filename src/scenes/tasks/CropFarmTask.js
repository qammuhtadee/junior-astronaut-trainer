import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENES } from '../../config/constants.js';
import { gameState } from '../../state/GameState.js';

const CROPS = [
  { id: 'arabidopsis', name: 'Arabidopsis (OSD-38)', short: 'SEED PACK #1', color: 0x4ade80 },
  { id: 'wheat', name: 'Dwarf Space Wheat', short: 'SEED PACK #2', color: 0xfacc15 },
  { id: 'lettuce', name: 'Red Romaine Lettuce', short: 'SEED PACK #3', color: 0xf472b6 },
  { id: 'radish', name: 'Radish Microgreens', short: 'SEED PACK #4', color: 0x38bdf8 },
];

/**
 * Reusable Hydroponic Crop Farming Mini-game:
 * - mode === 'plant' (Day 6, Maisha): Sow all 4 seed packs into trays & start misting.
 * - mode === 'harvest' (Day 7, Optimization): Harvest all 4 mature crops into Crew Ration Crate.
 */
export class CropFarmTask extends Phaser.Scene {
  constructor() {
    super('CropFarmTask');
  }

  create(data = {}) {
    this.closing = false;
    this.completed = false;
    this.mode = data?.mode || 'plant';
    this.doneCount = 0;

    const isHarvest = this.mode === 'harvest';
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const panelW = 620;
    const panelH = 510;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.78).setOrigin(0);
    this.modal = this.add.container(cx, GAME_HEIGHT + 320);

    const chassis = this.add.graphics();
    chassis.fillStyle(0x161b24, 1);
    chassis.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    chassis.lineStyle(3, 0x3b4459, 1);
    chassis.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    chassis.fillStyle(isHarvest ? 0xd97706 : 0x16a34a, 1);
    chassis.fillRoundedRect(-panelW / 2 + 6, -panelH / 2 + 6, panelW - 12, 42, {
      tl: 10,
      tr: 10,
      bl: 0,
      br: 0,
    });
    this.modal.add(chassis);

    this.modal.add(
      this.add
        .text(0, -panelH / 2 + 27, isHarvest ? 'HARVEST MARS GREENHOUSE CROPS' : 'PLANT HYDROPONIC SPACE CROPS', {
          fontFamily: 'monospace',
          fontSize: '15px',
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
      .text(
        0,
        -panelH / 2 + 68,
        isHarvest
          ? 'DRAG OR CLICK ALL 4 GROWN CROPS INTO THE CREW RATION CRATE'
          : 'DRAG OR CLICK ALL 4 SEED PACKS INTO HYDROPONIC TRAYS',
        {
          fontFamily: 'monospace',
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#ffd166',
        }
      )
      .setOrigin(0.5);
    this.modal.add(this.statusText);

    // Frames
    const leftFrame = this.add.graphics();
    leftFrame.fillStyle(0x0f172a, 0.96);
    leftFrame.fillRoundedRect(-282, -148, 250, 294, 10);
    leftFrame.lineStyle(2, 0x38bdf8, 0.65);
    leftFrame.strokeRoundedRect(-282, -148, 250, 294, 10);
    leftFrame.fillRoundedRect(32, -148, 250, 294, 10);
    leftFrame.lineStyle(2, 0x4ade80, 0.65);
    leftFrame.strokeRoundedRect(32, -148, 250, 294, 10);
    this.modal.add(leftFrame);

    if (!isHarvest) {
      this.buildPlantMode();
    } else {
      this.buildHarvestMode();
    }

    this.modal.add(
      this.add
        .text(
          0,
          panelH / 2 - 34,
          'CSA & NASA OSDR (OSD-38/16/120): Astronauts need 1,900-3,200 kcal/day from compact fresh crops.',
          {
            fontFamily: 'monospace',
            fontSize: '10px',
            color: '#94a3b8',
            align: 'center',
            wordWrap: { width: panelW - 50 },
          }
        )
        .setOrigin(0.5)
    );

    this.tweens.add({
      targets: this.modal,
      y: cy,
      duration: 360,
      ease: 'Back.easeOut',
    });
  }

  buildPlantMode() {
    this.modal.add(
      this.add
        .text(-157, -130, 'NASA / CSA SEED KIT', {
          fontFamily: 'monospace',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#7dd3fc',
        })
        .setOrigin(0.5)
    );
    this.modal.add(
      this.add
        .text(157, -130, 'LED HYDROPONIC TRAYS', {
          fontFamily: 'monospace',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#86efac',
        })
        .setOrigin(0.5)
    );

    this.trays = CROPS.map((crop, i) => {
      const ty = -86 + i * 62;
      const bg = this.add.rectangle(157, ty, 214, 48, 0x1e293b, 0.95).setStrokeStyle(2, 0x475569, 0.9);
      const lbl = this.add
        .text(157, ty, `${crop.name} (Empty)`, {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#94a3b8',
        })
        .setOrigin(0.5);
      this.modal.add([bg, lbl]);
      return { x: 157, y: ty, bg, lbl, filled: false, crop };
    });

    CROPS.forEach((crop, i) => {
      const sx = -157;
      const sy = -86 + i * 62;
      const card = this.add.container(sx, sy);
      const cbg = this.add.rectangle(0, 0, 214, 46, 0x1e293b, 1).setStrokeStyle(2, crop.color, 1);
      const ctx = this.add
        .text(0, 0, crop.name, {
          fontFamily: 'monospace',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#f8fafc',
        })
        .setOrigin(0.5);
      card.add([cbg, ctx]);
      card.homeX = sx;
      card.homeY = sy;
      card.placed = false;
      card.setSize(214, 46);
      card.setInteractive({ useHandCursor: true, draggable: true });
      this.input.setDraggable(card);

      const targetTray = this.trays[i];
      card.on('drag', (_p, dx, dy) => {
        if (!card.placed && !this.completed && !this.closing) card.setPosition(dx, dy);
      });
      card.on('dragend', () => {
        if (card.placed || this.completed || this.closing) return;
        const d = Phaser.Math.Distance.Between(card.x, card.y, targetTray.x, targetTray.y);
        if (d <= 125) {
          this.sowCrop(card, targetTray);
        } else {
          this.tweens.add({ targets: card, x: card.homeX, y: card.homeY, duration: 170 });
        }
      });
      card.on('pointerup', (ptr) => {
        if (card.placed || this.completed || this.closing || ptr.getDistance() > 14) return;
        this.sowCrop(card, targetTray);
      });

      this.modal.add(card);
    });

    // Nutrient Mist activation button
    this.actionBtn = this.add.container(0, 174);
    this.actionBg = this.add.rectangle(0, 0, 320, 42, 0x334155, 1).setStrokeStyle(2, 0x64748b, 1);
    this.actionLbl = this.add
      .text(0, 0, 'SOW ALL 4 CROPS FIRST (0/4)', {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#94a3b8',
      })
      .setOrigin(0.5);
    this.actionBtn.add([this.actionBg, this.actionLbl]);
    this.actionBtn.setSize(320, 42);
    this.actionBtn.setInteractive({ useHandCursor: true });
    this.actionBtn.on('pointerdown', () => {
      if (this.doneCount < CROPS.length || this.completed || this.closing) {
        this.statusText.setText('PLANT ALL 4 SEED PACKS INTO TRAYS BEFORE MISTING!').setColor('#f87171');
        return;
      }
      this.finishFarming();
    });
    this.modal.add(this.actionBtn);
  }

  sowCrop(card, tray) {
    card.placed = true;
    card.disableInteractive();
    tray.filled = true;
    this.doneCount += 1;

    this.tweens.add({
      targets: card,
      x: tray.x,
      y: tray.y,
      duration: 170,
      ease: 'Back.easeOut',
      onComplete: () => {
        card.setVisible(false);
        tray.bg.setFillStyle(0x14532d, 1).setStrokeStyle(2, 0x4ade80, 1);
        tray.lbl.setText(`${tray.crop.name} [SEEDED ✓]`).setColor('#bbf7d0');
      },
    });

    if (this.doneCount < CROPS.length) {
      this.actionLbl.setText(`SOW ALL 4 CROPS FIRST (${this.doneCount}/4)`);
    } else {
      this.actionBg.setFillStyle(0x16a34a, 1).setStrokeStyle(2, 0x86efac, 1);
      this.actionLbl.setText('ACTIVATE NUTRIENT MIST').setColor('#ffffff');
      this.statusText.setText('ALL 4 CROPS PLANTED — CLICK ACTIVATE NUTRIENT MIST!').setColor('#50fa7b');
    }
  }

  buildHarvestMode() {
    this.modal.add(
      this.add
        .text(-157, -130, 'MATURE CROPS (READY!)', {
          fontFamily: 'monospace',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#86efac',
        })
        .setOrigin(0.5)
    );
    this.modal.add(
      this.add
        .text(157, -130, 'CREW CALORIE CRATE', {
          fontFamily: 'monospace',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#fde047',
        })
        .setOrigin(0.5)
    );

    const crateBox = this.add.rectangle(157, 10, 210, 210, 0x1e293b, 0.9).setStrokeStyle(2.5, 0xfbbf24, 0.9);
    this.crateLabel = this.add
      .text(157, 10, 'DROP HARVEST\nHERE\n(0 / 4)\n\n1,900-3,200 kcal/day', {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#fef08a',
        align: 'center',
      })
      .setOrigin(0.5);
    this.modal.add([crateBox, this.crateLabel]);

    CROPS.forEach((crop, i) => {
      const sx = -157;
      const sy = -86 + i * 62;
      const card = this.add.container(sx, sy);
      const cbg = this.add.rectangle(0, 0, 214, 46, 0x14532d, 1).setStrokeStyle(2, 0x4ade80, 1);
      const ctx = this.add
        .text(0, 0, `FRESH ${crop.name}`, {
          fontFamily: 'monospace',
          fontSize: '10px',
          fontStyle: 'bold',
          color: '#dcfce7',
        })
        .setOrigin(0.5);
      card.add([cbg, ctx]);
      card.homeX = sx;
      card.homeY = sy;
      card.harvested = false;
      card.setSize(214, 46);
      card.setInteractive({ useHandCursor: true, draggable: true });
      this.input.setDraggable(card);

      card.on('drag', (_p, dx, dy) => {
        if (!card.harvested && !this.completed && !this.closing) card.setPosition(dx, dy);
      });
      card.on('dragend', () => {
        if (card.harvested || this.completed || this.closing) return;
        const d = Phaser.Math.Distance.Between(card.x, card.y, 157, 10);
        if (d <= 140) {
          this.harvestCrop(card);
        } else {
          this.tweens.add({ targets: card, x: card.homeX, y: card.homeY, duration: 170 });
        }
      });
      card.on('pointerup', (ptr) => {
        if (card.harvested || this.completed || this.closing || ptr.getDistance() > 14) return;
        this.harvestCrop(card);
      });

      this.modal.add(card);
    });
  }

  harvestCrop(card) {
    card.harvested = true;
    card.disableInteractive();
    this.doneCount += 1;

    this.tweens.add({
      targets: card,
      x: 157,
      y: 10,
      scale: 0.4,
      alpha: 0,
      duration: 210,
      onComplete: () => card.setVisible(false),
    });

    this.crateLabel.setText(`CREW FOOD CRATE\n(${this.doneCount} / 4)\n\n${this.doneCount === 4 ? 'FULL NUTRITION ✓' : '1,900-3,200 kcal/day'}`);

    if (this.doneCount >= CROPS.length) {
      this.finishFarming();
    }
  }

  finishFarming() {
    if (this.completed) return;
    this.completed = true;
    this.cameras.main.flash(300, 74, 222, 128);

    if (this.mode === 'harvest') {
      gameState.d7CropsHarvested = true;
      this.statusText.setText('FRESH MARTIAN HARVEST SECURED FOR THE CREW!').setColor('#34d399');
    } else {
      gameState.d6CropsPlanted = true;
      gameState.d6PlantedCount = CROPS.length;
      this.statusText.setText('NUTRIENT MIST ACTIVE — CROPS GERMINATING!').setColor('#34d399');
    }

    this.time.delayedCall(850, () => this.closeTask());
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
          this.game.events.emit(this.mode === 'harvest' ? 'd7:crops-harvested' : 'd6:crops-planted');
        }
      },
    });
  }
}
