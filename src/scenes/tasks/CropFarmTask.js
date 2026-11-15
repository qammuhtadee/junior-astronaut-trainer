import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENES } from '../../config/constants.js';
import { gameState } from '../../state/GameState.js';

const CROPS = [
  { id: 'arabidopsis', name: 'Arabidopsis', color: 0x4ade80, stem: 0x16a34a },
  { id: 'wheat', name: 'Space Wheat', color: 0xfacc15, stem: 0xca8a04 },
  { id: 'lettuce', name: 'Red Lettuce', color: 0xf472b6, stem: 0x4ade80 },
  { id: 'radish', name: 'Radish Greens', color: 0x38bdf8, stem: 0x22c55e },
];

const GRID_ROWS = 4;
const GRID_COLS = 4;
const TOTAL_TILES = GRID_ROWS * GRID_COLS;

/**
 * 4x4 (16-tile) Hydroponic Mars Greenhouse Mini-game:
 * - mode === 'plant' (Day 6, Maisha):
 *     1) Click or swipe with the Garden Hoe to prepare all 16 soil tiles.
 *     2) Drag seeds from the Seed Crate (or click/swipe tiles) to plant all 16 tiles.
 *     3) Activate Nutrient Mist to germinate the garden.
 * - mode === 'harvest' (Day 7, Optimization):
 *     Click, swipe, or drag crops from all 16 mature tiles into the Crew Ration Crate.
 */
export class CropFarmTask extends Phaser.Scene {
  constructor() {
    super('CropFarmTask');
  }

  create(data = {}) {
    this.closing = false;
    this.completed = false;
    this.mode = data?.mode || 'plant';
    this.isHarvest = this.mode === 'harvest';

    this.hoedCount = 0;
    this.plantedCount = 0;
    this.harvestedCount = 0;
    this.phase = this.isHarvest ? 'harvest' : 'hoe';
    this.isSwiping = false;
    this.tiles = [];

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const panelW = 680;
    const panelH = 524;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.78).setOrigin(0);
    this.modal = this.add.container(cx, GAME_HEIGHT + 340);

    // Outer chassis
    const chassis = this.add.graphics();
    chassis.fillStyle(0x161b24, 1);
    chassis.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    chassis.lineStyle(3, 0x3b4459, 1);
    chassis.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    chassis.fillStyle(this.isHarvest ? 0xd97706 : 0x16a34a, 1);
    chassis.fillRoundedRect(-panelW / 2 + 6, -panelH / 2 + 6, panelW - 12, 42, {
      tl: 10,
      tr: 10,
      bl: 0,
      br: 0,
    });
    this.modal.add(chassis);

    this.modal.add(
      this.add
        .text(0, -panelH / 2 + 27, this.isHarvest ? 'HARVEST MARS GREENHOUSE CROPS (4x4)' : 'PLANT HYDROPONIC SPACE CROPS (4x4)', {
          fontFamily: 'monospace',
          fontSize: '17px',
          fontStyle: 'bold',
          color: '#ffffff',
        })
        .setOrigin(0.5)
    );

    const closeBtn = this.add
      .text(panelW / 2 - 30, -panelH / 2 + 27, '[X]', {
        fontFamily: 'monospace',
        fontSize: '18px',
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
        this.isHarvest
          ? 'STEP 1: CLICK OR DRAG ALL 16 MATURE CROPS INTO THE CREW RATION CRATE'
          : 'STEP 1: USE THE GARDEN HOE TO TILL ALL 16 SOIL TILES (CLICK OR SWIPE)',
        {
          fontFamily: 'monospace',
          fontSize: '14px',
          fontStyle: 'bold',
          color: '#ffd166',
        }
      )
      .setOrigin(0.5);
    this.modal.add(this.statusText);

    // Left (Tools/Crate) & Right (4x4 Plot) Frames
    const frames = this.add.graphics();
    frames.fillStyle(0x0f172a, 0.96);
    frames.fillRoundedRect(-314, -158, 224, 326, 10);
    frames.lineStyle(2, 0x38bdf8, 0.65);
    frames.strokeRoundedRect(-314, -158, 224, 326, 10);

    frames.fillStyle(0x0f172a, 0.96);
    frames.fillRoundedRect(-72, -158, 386, 326, 10);
    frames.lineStyle(2, 0x4ade80, 0.65);
    frames.strokeRoundedRect(-72, -158, 386, 326, 10);
    this.modal.add(frames);

    // Track pointer swipe state across the 4x4 grid
    this.input.on('pointerdown', () => {
      this.isSwiping = true;
    });
    this.input.on('pointerup', () => {
      this.isSwiping = false;
    });

    this.buildGrid();
    if (!this.isHarvest) {
      this.buildPlantTools();
    } else {
      this.buildHarvestCrate();
    }

    this.modal.add(
      this.add
        .text(
          0,
          panelH / 2 - 28,
          'NASA & CSA Space Food Fact: Astronauts grow fresh veggies like lettuce, wheat & radishes in hydroponic trays with water and plant food!',
          {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#94a3b8',
            align: 'center',
            wordWrap: { width: panelW - 44 },
          }
        )
        .setOrigin(0.5)
    );

    this.tweens.add({
      targets: this.modal,
      y: cy,
      duration: 340,
      ease: 'Back.easeOut',
    });
  }

  buildGrid() {
    const plotCenterX = 121;
    this.plotHeader = this.add
      .text(plotCenterX, -138, this.isHarvest ? 'HARVESTED: 0 / 16' : 'HOED: 0 / 16   |   PLANTED: 0 / 16', {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#a7f3d0',
      })
      .setOrigin(0.5);
    this.modal.add(this.plotHeader);

    const tileSize = 54;
    const step = 64;
    const startX = plotCenterX - ((GRID_COLS - 1) * step) / 2;
    const startY = -82;

    for (let r = 0; r < GRID_ROWS; r += 1) {
      const crop = CROPS[r];
      for (let c = 0; c < GRID_COLS; c += 1) {
        const tx = startX + c * step;
        const ty = startY + r * step;

        const tileContainer = this.add.container(tx, ty);
        const bg = this.add.graphics();
        const detail = this.add.graphics();
        const sprout = this.add.graphics();

        tileContainer.add([bg, detail, sprout]);

        const hitZone = this.add.zone(0, 0, tileSize + 8, tileSize + 8).setInteractive({
          useHandCursor: true,
        });
        tileContainer.add(hitZone);

        const tile = {
          row: r,
          col: c,
          x: tx,
          y: ty,
          crop,
          container: tileContainer,
          bg,
          detail,
          sprout,
          hitZone,
          state: this.isHarvest ? 'mature' : 'raw',
        };

        this.renderTile(tile);

        hitZone.on('pointerover', () => {
          if (this.completed || this.closing) return;
          bg.setAlpha(1);
          if (this.isSwiping) {
            this.handleTileAction(tile);
          }
        });

        hitZone.on('pointerdown', () => {
          if (this.completed || this.closing) return;
          this.isSwiping = true;
          this.handleTileAction(tile);
        });

        this.tiles.push(tile);
        this.modal.add(tileContainer);
      }
    }
  }

  renderTile(tile) {
    const s = 54;
    const half = s / 2;
    tile.bg.clear();
    tile.detail.clear();
    tile.sprout.clear();

    if (tile.state === 'raw') {
      tile.bg.fillStyle(0x5c3a28, 1).fillRoundedRect(-half, -half, s, s, 8);
      tile.bg.lineStyle(2, 0x92400e, 0.9).strokeRoundedRect(-half, -half, s, s, 8);
      tile.detail.fillStyle(0x78350f, 0.7);
      tile.detail.fillCircle(-12, -10, 3);
      tile.detail.fillCircle(10, 8, 2.5);
      tile.detail.fillCircle(8, -14, 2);
    } else if (tile.state === 'hoed') {
      tile.bg.fillStyle(0x3f2314, 1).fillRoundedRect(-half, -half, s, s, 8);
      tile.bg.lineStyle(2, 0x38bdf8, 0.85).strokeRoundedRect(-half, -half, s, s, 8);
      tile.detail.lineStyle(3, 0x78350f, 0.95);
      for (let fy = -14; fy <= 14; fy += 10) {
        tile.detail.lineBetween(-17, fy, 17, fy);
      }
    } else if (tile.state === 'planted') {
      tile.bg.fillStyle(0x2d1d12, 1).fillRoundedRect(-half, -half, s, s, 8);
      tile.bg.lineStyle(2, 0x4ade80, 0.95).strokeRoundedRect(-half, -half, s, s, 8);
      tile.detail.lineStyle(2, 0x6b4423, 0.7);
      for (let fy = -12; fy <= 12; fy += 12) {
        tile.detail.lineBetween(-16, fy, 16, fy);
      }
      // Cute newly planted sprout & seed
      tile.sprout.fillStyle(tile.crop.stem, 1).fillRect(-2, -6, 4, 14);
      tile.sprout.fillStyle(tile.crop.color, 1);
      tile.sprout.fillEllipse(-7, -8, 12, 7);
      tile.sprout.fillEllipse(7, -8, 12, 7);
    } else if (tile.state === 'mature') {
      tile.bg.fillStyle(0x1f2e22, 1).fillRoundedRect(-half, -half, s, s, 8);
      tile.bg.lineStyle(2, tile.crop.color, 0.95).strokeRoundedRect(-half, -half, s, s, 8);
      // Full leafy hydroponic crop canopy
      tile.sprout.fillStyle(tile.crop.stem, 1).fillRect(-3, -4, 6, 18);
      tile.sprout.fillStyle(tile.crop.color, 1);
      tile.sprout.fillCircle(0, -10, 9);
      tile.sprout.fillCircle(-10, -4, 7);
      tile.sprout.fillCircle(10, -4, 7);
      tile.sprout.fillStyle(0x22c55e, 0.9);
      tile.sprout.fillEllipse(-9, 6, 14, 7);
      tile.sprout.fillEllipse(9, 6, 14, 7);
    } else if (tile.state === 'harvested') {
      tile.bg.fillStyle(0x1e293b, 0.9).fillRoundedRect(-half, -half, s, s, 8);
      tile.bg.lineStyle(2, 0x475569, 0.75).strokeRoundedRect(-half, -half, s, s, 8);
      tile.detail.lineStyle(2, 0x334155, 0.9);
      for (let fy = -12; fy <= 12; fy += 12) {
        tile.detail.lineBetween(-15, fy, 15, fy);
      }
      tile.sprout.fillStyle(0x64748b, 0.8).fillRect(-2, 4, 4, 8);
    }
  }

  buildPlantTools() {
    const toolX = -202;

    // 1. GARDEN HOE card
    this.hoeCard = this.add.container(toolX, -98);
    const hoeBg = this.add.graphics();
    hoeBg.fillStyle(0x1e293b, 1).fillRoundedRect(-96, -42, 192, 84, 9);
    hoeBg.lineStyle(2.5, 0x38bdf8, 1).strokeRoundedRect(-96, -42, 192, 84, 9);
    this.hoeBg = hoeBg;

    const hoeTitle = this.add
      .text(0, -24, '1. GARDEN HOE', {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#e0f2fe',
      })
      .setOrigin(0.5);
    this.hoeSub = this.add
      .text(0, 26, 'ACTIVE: CLICK/SWIPE TILES', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#38bdf8',
      })
      .setOrigin(0.5);

    this.hoeCard.add([hoeBg, hoeTitle, this.hoeSub]);
    this.modal.add(this.hoeCard);

    // Draggable Hoe Sprite inside modal
    this.hoeHomeX = toolX;
    this.hoeHomeY = -98;
    const hoeIcon = this.add.container(this.hoeHomeX, this.hoeHomeY);
    const hoeGfx = this.add.graphics();
    hoeGfx.lineStyle(4, 0xd97706, 1).lineBetween(-18, 12, 12, -10);
    hoeGfx.fillStyle(0x94a3b8, 1).fillRoundedRect(8, -16, 16, 10, 2);
    hoeIcon.add(hoeGfx);
    hoeIcon.setSize(68, 44).setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(hoeIcon);
    hoeIcon.on('drag', (_ptr, dragX, dragY) => {
      if (this.phase !== 'hoe' || this.completed || this.closing) return;
      hoeIcon.setPosition(dragX, dragY);
      this.checkToolOverlap(dragX, dragY, 'hoe');
    });
    hoeIcon.on('dragend', () => {
      this.tweens.add({ targets: hoeIcon, x: this.hoeHomeX, y: this.hoeHomeY, duration: 150 });
    });
    this.hoeIcon = hoeIcon;

    // 2. SEED CRATE card
    this.seedCard = this.add.container(toolX, 4);
    this.seedBg = this.add.graphics();
    this.redrawSeedBg(false);
    const seedTitle = this.add
      .text(0, -28, '2. SEED CRATE', {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#dcfce7',
      })
      .setOrigin(0.5);
    this.seedSub = this.add
      .text(0, 28, 'LOCKED — HOE ALL 16 FIRST', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);
    this.seedCard.add([this.seedBg, seedTitle, this.seedSub]);
    this.seedCard.setAlpha(0.5);
    this.modal.add(this.seedCard);

    // Draggable Seed Pouch Sprite
    this.seedHomeX = toolX;
    this.seedHomeY = 4;
    const seedPouch = this.add.container(this.seedHomeX, this.seedHomeY);
    const pouchGfx = this.add.graphics();
    pouchGfx.fillStyle(0x22c55e, 1).fillRoundedRect(-14, -14, 28, 28, 6);
    pouchGfx.lineStyle(2, 0xbbf7d0, 1).strokeRoundedRect(-14, -14, 28, 28, 6);
    pouchGfx.fillStyle(0xfef08a, 1);
    pouchGfx.fillCircle(-4, 0, 3);
    pouchGfx.fillCircle(4, -3, 3);
    pouchGfx.fillCircle(2, 5, 3);
    seedPouch.add(pouchGfx);
    seedPouch.setAlpha(0.45);
    seedPouch.setSize(68, 48).setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(seedPouch);
    seedPouch.on('drag', (_ptr, dragX, dragY) => {
      if (this.phase !== 'seed' || this.completed || this.closing) return;
      seedPouch.setPosition(dragX, dragY);
      this.checkToolOverlap(dragX, dragY, 'seed');
    });
    seedPouch.on('dragend', () => {
      this.tweens.add({ targets: seedPouch, x: this.seedHomeX, y: this.seedHomeY, duration: 150 });
    });
    this.seedPouch = seedPouch;

    // 3. NUTRIENT MIST button
    this.mistBtn = this.add.container(toolX, 108);
    this.mistBg = this.add.graphics();
    this.redrawMistBg(false);
    this.mistLabel = this.add
      .text(0, 0, '3. NUTRIENT MIST\n(Plant all 16 first)', {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#cbd5e1',
        align: 'center',
      })
      .setOrigin(0.5);
    this.mistBtn.add([this.mistBg, this.mistLabel]);
    this.mistBtn.setAlpha(0.45);
    const mistZone = this.add.zone(0, 0, 192, 68).setInteractive({ useHandCursor: true });
    mistZone.on('pointerdown', () => this.activateNutrientMist());
    this.mistBtn.add(mistZone);
    this.modal.add(this.mistBtn);

    // Keep draggable tool icons above cards inside modal
    this.modal.add([this.hoeIcon, this.seedPouch]);
  }

  redrawSeedBg(active) {
    this.seedBg.clear();
    this.seedBg.fillStyle(active ? 0x14532d : 0x1e293b, 1).fillRoundedRect(-96, -44, 192, 88, 9);
    this.seedBg.lineStyle(2.5, active ? 0x4ade80 : 0x475569, 1).strokeRoundedRect(-96, -44, 192, 88, 9);
  }

  redrawMistBg(active) {
    this.mistBg.clear();
    this.mistBg.fillStyle(active ? 0x0284c7 : 0x1e293b, 1).fillRoundedRect(-96, -34, 192, 68, 9);
    this.mistBg.lineStyle(2.5, active ? 0x7dd3fc : 0x475569, 1).strokeRoundedRect(-96, -34, 192, 68, 9);
  }

  checkToolOverlap(x, y, toolPhase) {
    if (this.phase !== toolPhase) return;
    this.tiles.forEach((tile) => {
      if (Math.abs(x - tile.x) <= 32 && Math.abs(y - tile.y) <= 32) {
        this.handleTileAction(tile);
      }
    });
  }

  buildHarvestCrate() {
    this.crateCenterX = -202;
    this.crateCenterY = 0;

    this.crateContainer = this.add.container(this.crateCenterX, this.crateCenterY);
    this.crateBg = this.add.graphics();
    this.crateBg.fillStyle(0x451a03, 1).fillRoundedRect(-96, -124, 192, 248, 12);
    this.crateBg.lineStyle(3, 0xfbbf24, 0.95).strokeRoundedRect(-96, -124, 192, 248, 12);
    this.crateBg.lineStyle(2, 0x92400e, 0.9);
    for (let y = -80; y <= 80; y += 40) {
      this.crateBg.lineBetween(-86, y, 86, y);
    }

    this.crateLabel = this.add
      .text(0, 0, 'CREW RATION CRATE\n\n0 / 16 HARVESTED\n\nCLICK OR SWIPE\nCROPS ON PLOT', {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#fef3c7',
        align: 'center',
      })
      .setOrigin(0.5);

    this.crateContainer.add([this.crateBg, this.crateLabel]);
    this.modal.add(this.crateContainer);
  }

  handleTileAction(tile) {
    if (this.completed || this.closing) return;

    if (!this.isHarvest) {
      if (this.phase === 'hoe' && tile.state === 'raw') {
        tile.state = 'hoed';
        this.hoedCount += 1;
        this.renderTile(tile);
        this.popTile(tile);
        this.updatePlantCounters();

        if (this.hoedCount >= TOTAL_TILES) {
          this.unlockSeedPhase();
        }
      } else if (this.phase === 'seed' && tile.state === 'hoed') {
        tile.state = 'planted';
        this.plantedCount += 1;
        this.renderTile(tile);
        this.popTile(tile);
        this.updatePlantCounters();

        if (this.plantedCount >= TOTAL_TILES) {
          this.unlockMistPhase();
        }
      }
      return;
    }

    // Harvest mode
    if (this.phase === 'harvest' && tile.state === 'mature') {
      tile.state = 'harvested';
      this.harvestedCount += 1;
      this.renderTile(tile);
      this.flyHarvestOrb(tile);

      this.plotHeader.setText(`HARVESTED: ${this.harvestedCount} / ${TOTAL_TILES}`);
      this.crateLabel.setText(
        `CREW RATION CRATE\n\n${this.harvestedCount} / ${TOTAL_TILES} HARVESTED\n\n${
          this.harvestedCount === TOTAL_TILES ? 'FULL NUTRITION ✓' : 'FRESH MARS CROPS'
        }`
      );

      if (this.harvestedCount >= TOTAL_TILES) {
        this.crateBg.clear();
        this.crateBg.fillStyle(0x14532d, 1).fillRoundedRect(-96, -124, 192, 248, 12);
        this.crateBg.lineStyle(3, 0x4ade80, 1).strokeRoundedRect(-96, -124, 192, 248, 12);
        this.finishFarming();
      }
    }
  }

  popTile(tile) {
    tile.container.setScale(0.88);
    this.tweens.add({
      targets: tile.container,
      scale: 1,
      duration: 180,
      ease: 'Back.easeOut',
    });
  }

  flyHarvestOrb(tile) {
    const orb = this.add.circle(tile.x, tile.y, 10, tile.crop.color, 1);
    orb.setStrokeStyle(2, 0xffffff, 0.9);
    this.modal.add(orb);
    this.tweens.add({
      targets: orb,
      x: this.crateCenterX,
      y: this.crateCenterY + Phaser.Math.Between(-35, 35),
      scale: 0.45,
      alpha: 0.25,
      duration: 280,
      ease: 'Cubic.easeIn',
      onComplete: () => orb.destroy(),
    });
  }

  updatePlantCounters() {
    this.plotHeader.setText(`HOED: ${this.hoedCount} / ${TOTAL_TILES}   |   PLANTED: ${this.plantedCount} / ${TOTAL_TILES}`);
  }

  unlockSeedPhase() {
    this.phase = 'seed';
    this.hoeBg.clear();
    this.hoeBg.fillStyle(0x0f172a, 1).fillRoundedRect(-96, -42, 192, 84, 9);
    this.hoeBg.lineStyle(2, 0x4ade80, 0.7).strokeRoundedRect(-96, -42, 192, 84, 9);
    this.hoeSub.setText('HOEING COMPLETE ✓').setColor('#4ade80');
    this.hoeIcon.setAlpha(0.5);

    this.seedCard.setAlpha(1);
    this.seedPouch.setAlpha(1);
    this.redrawSeedBg(true);
    this.seedSub.setText('DRAG POUCH OR CLICK TILES').setColor('#86efac');
    this.statusText.setText('STEP 2: DRAG SEEDS FROM CRATE (OR CLICK/SWIPE TILES) TO PLANT ALL 16');
  }

  unlockMistPhase() {
    this.phase = 'mist';
    this.seedPouch.setAlpha(0.5);
    this.redrawSeedBg(false);
    this.seedSub.setText('ALL 16 PLANTED ✓').setColor('#4ade80');

    this.mistBtn.setAlpha(1);
    this.redrawMistBg(true);
    this.mistLabel.setText('3. ACTIVATE\nNUTRIENT MIST').setColor('#ffffff');
    this.statusText.setText('STEP 3: PRESS [ ACTIVATE NUTRIENT MIST ] TO WATER THE GARDEN!');

    this.tweens.add({
      targets: this.mistBtn,
      scale: 1.04,
      duration: 420,
      yoyo: true,
      repeat: -1,
    });
  }

  activateNutrientMist() {
    if (this.phase !== 'mist' || this.completed || this.closing) return;
    this.phase = 'done';
    this.tweens.killTweensOf(this.mistBtn);
    this.mistBtn.setScale(1);

    // Shimmering mist sweep across all 16 planted tiles
    this.tiles.forEach((tile, i) => {
      const droplet = this.add.circle(tile.x, tile.y - 26, 7, 0x38bdf8, 0.8);
      this.modal.add(droplet);
      this.tweens.add({
        targets: droplet,
        y: tile.y + 8,
        alpha: 0,
        scale: 1.5,
        delay: i * 24,
        duration: 420,
        onComplete: () => droplet.destroy(),
      });
    });

    this.time.delayedCall(460, () => this.finishFarming());
  }

  finishFarming() {
    if (this.completed) return;
    this.completed = true;
    this.cameras.main.flash(300, 74, 222, 128);

    if (this.isHarvest) {
      gameState.d7CropsHarvested = true;
      this.statusText.setText('FRESH MARTIAN HARVEST SECURED FOR THE CREW!').setColor('#34d399');
    } else {
      gameState.d6CropsPlanted = true;
      gameState.d6PlantedCount = TOTAL_TILES;
      this.statusText.setText('NUTRIENT MIST ACTIVE — ALL 16 CROPS GERMINATING!').setColor('#34d399');
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
          this.game.events.emit(this.isHarvest ? 'd7:crops-harvested' : 'd6:crops-planted');
        }
      },
    });
  }
}
