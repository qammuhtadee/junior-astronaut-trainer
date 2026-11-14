import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/constants.js';
import { gameState } from '../../state/GameState.js';

const TOTAL_ICE_BLOCKS = 4;

/**
 * Separate kid-friendly mini-game for loading harvested Martian subsurface ice
 * into the Oxygen Maker's top Hopper funnel to start electrolysis.
 */
export class IceLoadTask extends Phaser.Scene {
  constructor() {
    super('IceLoadTask');
  }

  create() {
    this.completed = false;
    this.closing = false;
    this.loadedCount = Phaser.Math.Clamp(gameState.d2IceLoadedCount || 0, 0, TOTAL_ICE_BLOCKS);
    this.bubbles = [];

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const panelW = 580;
    const panelH = 500;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.78).setOrigin(0);
    this.modal = this.add.container(cx, GAME_HEIGHT + 320);

    // Main chassis
    const chassis = this.add.graphics();
    chassis.fillStyle(0x161b24, 1);
    chassis.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    chassis.lineStyle(3, 0x3b4459, 1);
    chassis.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    chassis.fillStyle(0x0284c7, 1);
    chassis.fillRoundedRect(-panelW / 2 + 6, -panelH / 2 + 6, panelW - 12, 42, {
      tl: 10,
      tr: 10,
      bl: 0,
      br: 0,
    });
    this.modal.add(chassis);

    this.modal.add(
      this.add
        .text(0, -panelH / 2 + 27, 'ICE HOPPER & ELECTROLYSIS LOADER', {
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
      .text(0, -panelH / 2 + 68, 'DRAG MARTIAN ICE BLOCKS INTO THE TOP HOPPER!', {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffd166',
      })
      .setOrigin(0.5);
    this.modal.add(this.statusText);

    // ─── Left: Subsurface Ice Core Crate ────────────────────────────────────
    const crateX = -145;
    const crateY = 12;
    const crateW = 220;
    const crateH = 310;

    const crateGfx = this.add.graphics();
    crateGfx.fillStyle(0x0f172a, 0.96);
    crateGfx.fillRoundedRect(crateX - crateW / 2, crateY - crateH / 2, crateW, crateH, 12);
    crateGfx.lineStyle(2, 0x38bdf8, 0.6);
    crateGfx.strokeRoundedRect(crateX - crateW / 2, crateY - crateH / 2, crateW, crateH, 12);
    crateGfx.fillStyle(0x1e293b, 0.9);
    crateGfx.fillRoundedRect(crateX - crateW / 2 + 12, crateY - crateH / 2 + 36, crateW - 24, crateH - 48, 8);
    this.modal.add(crateGfx);

    this.modal.add(
      this.add
        .text(crateX, crateY - crateH / 2 + 18, 'ICE CORE CRATE', {
          fontFamily: 'monospace',
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#7dd3fc',
        })
        .setOrigin(0.5)
    );

    // ─── Right: Top Hopper Funnel & Electrolysis Water Tank ──────────────────
    this.hopperX = 115;
    this.hopperY = -85;
    this.tankX = 115;
    this.tankY = 55;

    const machineGfx = this.add.graphics();
    // Right stage frame
    machineGfx.fillStyle(0x0f172a, 0.95);
    machineGfx.fillRoundedRect(-5, -142, 240, 310, 12);
    machineGfx.lineStyle(2, 0x334155, 1);
    machineGfx.strokeRoundedRect(-5, -142, 240, 310, 12);

    // Pipe from funnel neck into tank
    machineGfx.fillStyle(0x475569, 1);
    machineGfx.fillRect(this.hopperX - 16, this.hopperY + 26, 32, 34);
    machineGfx.lineStyle(2, 0x94a3b8, 0.8);
    machineGfx.strokeRect(this.hopperX - 16, this.hopperY + 26, 32, 34);

    // Trapezoid Hopper Funnel
    machineGfx.fillStyle(0x334155, 1);
    machineGfx.fillPoints(
      [
        { x: this.hopperX - 66, y: this.hopperY - 26 },
        { x: this.hopperX + 66, y: this.hopperY - 26 },
        { x: this.hopperX + 20, y: this.hopperY + 28 },
        { x: this.hopperX - 20, y: this.hopperY + 28 },
      ],
      true
    );
    machineGfx.lineStyle(2.5, 0x38bdf8, 1);
    machineGfx.strokePoints(
      [
        { x: this.hopperX - 66, y: this.hopperY - 26 },
        { x: this.hopperX + 66, y: this.hopperY - 26 },
        { x: this.hopperX + 20, y: this.hopperY + 28 },
        { x: this.hopperX - 20, y: this.hopperY + 28 },
      ],
      true
    );
    // Funnel opening lip
    machineGfx.fillStyle(0x082f49, 1);
    machineGfx.fillEllipse(this.hopperX, this.hopperY - 26, 130, 18);
    machineGfx.lineStyle(2, 0x7dd3fc, 0.9);
    machineGfx.strokeEllipse(this.hopperX, this.hopperY - 26, 130, 18);
    this.modal.add(machineGfx);

    // Pulsing Hopper drop guide ring
    this.hopperRing = this.add.circle(this.hopperX, this.hopperY - 6, 48, 0x38bdf8, 0.14);
    this.hopperRing.setStrokeStyle(2, 0x7dd3fc, 0.85);
    this.modal.add(this.hopperRing);
    this.tweens.add({
      targets: this.hopperRing,
      scaleX: 1.08,
      scaleY: 1.08,
      alpha: 0.35,
      yoyo: true,
      repeat: -1,
      duration: 750,
      ease: 'Sine.easeInOut',
    });

    this.modal.add(
      this.add
        .text(this.hopperX, this.hopperY - 46, '▼ TOP ICE HOPPER ▼', {
          fontFamily: 'monospace',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#7dd3fc',
        })
        .setOrigin(0.5)
    );

    // Tank dynamic water/ice/bubbles graphics layer
    this.tankDynamicGfx = this.add.graphics();
    this.modal.add(this.tankDynamicGfx);

    // Electrolysis Tank glass outline
    const tankFrame = this.add.graphics();
    tankFrame.lineStyle(3, 0x64748b, 1);
    tankFrame.strokeRoundedRect(this.tankX - 66, this.tankY - 76, 132, 138, 10);
    tankFrame.lineStyle(1.5, 0x94a3b8, 0.45);
    tankFrame.lineBetween(this.tankX - 54, this.tankY - 64, this.tankX - 54, this.tankY + 50);
    this.modal.add(tankFrame);

    this.tankLabel = this.add
      .text(this.tankX, this.tankY - 58, 'H2O → O2 TANK', {
        fontFamily: 'monospace',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#bae6fd',
      })
      .setOrigin(0.5);
    this.modal.add(this.tankLabel);

    this.o2Badge = this.add
      .text(this.tankX, this.tankY + 42, 'O2 OUTPUT: 0%', {
        fontFamily: 'monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#34d399',
        backgroundColor: '#022c22',
        padding: { x: 6, y: 2 },
      })
      .setOrigin(0.5);
    this.modal.add(this.o2Badge);

    this.counterText = this.add
      .text(this.tankX, 146, `ICE LOADED: ${this.loadedCount} / ${TOTAL_ICE_BLOCKS}`, {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#e0f2fe',
      })
      .setOrigin(0.5);
    this.modal.add(this.counterText);

    this.modal.add(
      this.add
        .text(0, panelH / 2 - 30, 'Melted Martian water ice splits into pure Oxygen (O2) & Hydrogen (H2)!', {
          fontFamily: 'sans-serif',
          fontSize: '12px',
          color: '#cbd5e1',
          backgroundColor: '#0f172a',
          padding: { x: 10, y: 5 },
        })
        .setOrigin(0.5)
    );

    // Spawn remaining draggable Martian ice chunks at randomized crate positions
    this.spawnIceBlocks(crateX, crateY);
    this.refreshTankVisuals();

    // Drag handlers
    this.input.on('dragstart', (pointer, obj) => {
      if (this.completed || this.closing || !obj.getData('isIceBlock')) return;
      this.modal.bringToTop(obj);
      obj.setScale(1.1);
    });

    this.input.on('drag', (pointer, obj, dragX, dragY) => {
      if (this.completed || this.closing || !obj.getData('isIceBlock')) return;
      obj.x = dragX;
      obj.y = dragY;
      const nearHopper =
        Phaser.Math.Distance.Between(obj.x, obj.y, this.hopperX, this.hopperY - 8) < 95;
      this.hopperRing.setFillStyle(nearHopper ? 0x34d399 : 0x38bdf8, nearHopper ? 0.35 : 0.14);
      this.hopperRing.setStrokeStyle(2.5, nearHopper ? 0x34d399 : 0x7dd3fc, 0.95);
    });

    this.input.on('dragend', (pointer, obj) => {
      if (!obj.getData('isIceBlock')) return;
      obj.setScale(1);
      this.hopperRing.setFillStyle(0x38bdf8, 0.14);
      this.hopperRing.setStrokeStyle(2, 0x7dd3fc, 0.85);

      if (this.completed || this.closing) return;

      const dist = Phaser.Math.Distance.Between(obj.x, obj.y, this.hopperX, this.hopperY - 8);
      if (dist < 95) {
        this.dropIceIntoHopper(obj);
      } else {
        this.statusText
          .setText('DROP THE ICE BLOCK DIRECTLY INTO THE TOP HOPPER!')
          .setColor('#ffd166');
        this.tweens.add({
          targets: obj,
          x: obj.getData('homeX'),
          y: obj.getData('homeY'),
          duration: 220,
          ease: 'Back.easeOut',
        });
      }
    });

    // Bubble emitter timer for electrolysis visual feedback
    this.bubbleTimer = this.time.addEvent({
      delay: 140,
      loop: true,
      callback: () => this.tickBubbles(),
    });

    // Slide in modal
    this.tweens.add({
      targets: this.modal,
      y: cy,
      duration: 320,
      ease: 'Back.easeOut',
    });

    // ESC closes task safely while preserving loaded progress
    this.input.keyboard.once('keydown-ESC', () => this.closeTask());

    // Edge case: if opened when already 4/4 loaded, complete cleanly
    if (this.loadedCount >= TOTAL_ICE_BLOCKS) {
      this.completeLoading();
    }
  }

  spawnIceBlocks(crateX, crateY) {
    const baseOffsets = Phaser.Utils.Array.Shuffle([
      { dx: -44, dy: -66 },
      { dx: 44, dy: -52 },
      { dx: -42, dy: 44 },
      { dx: 44, dy: 62 },
    ]);

    const remaining = TOTAL_ICE_BLOCKS - this.loadedCount;
    for (let i = 0; i < remaining; i++) {
      const slot = baseOffsets[i];
      const homeX = crateX + slot.dx + Phaser.Math.Between(-8, 8);
      const homeY = crateY + slot.dy + Phaser.Math.Between(-8, 8);

      const chunk = this.add.container(homeX, homeY);
      const g = this.add.graphics();

      // Faceted crystalline ice polygon
      const r1 = Phaser.Math.Between(-4, 4);
      const r2 = Phaser.Math.Between(-4, 4);
      g.fillStyle(0x38bdf8, 0.92);
      g.fillPoints(
        [
          { x: -28 + r1, y: -12 },
          { x: -10, y: -26 + r2 },
          { x: 24, y: -18 },
          { x: 30 + r1, y: 10 },
          { x: 8, y: 26 },
          { x: -24, y: 18 + r2 },
        ],
        true
      );
      g.fillStyle(0xbae6fd, 0.55);
      g.fillTriangle(-14, -22, 18, -14, -2, 4);
      g.lineStyle(2, 0xe0f2fe, 0.95);
      g.strokePoints(
        [
          { x: -28 + r1, y: -12 },
          { x: -10, y: -26 + r2 },
          { x: 24, y: -18 },
          { x: 30 + r1, y: 10 },
          { x: 8, y: 26 },
          { x: -24, y: 18 + r2 },
        ],
        true
      );

      // Martian regolith dust fleck
      g.fillStyle(0xb45309, 0.45);
      g.fillCircle(-10, 10, 4);
      g.fillCircle(12, 6, 3);

      const lbl = this.add
        .text(0, 0, 'H2O ICE', {
          fontFamily: 'monospace',
          fontSize: '10px',
          fontStyle: 'bold',
          color: '#082f49',
        })
        .setOrigin(0.5);

      chunk.add([g, lbl]);
      chunk.setSize(68, 58);
      chunk.setInteractive({ useHandCursor: true, draggable: true });
      this.input.setDraggable(chunk);
      chunk.setData('isIceBlock', true);
      chunk.setData('homeX', homeX);
      chunk.setData('homeY', homeY);

      this.modal.add(chunk);
    }
  }

  dropIceIntoHopper(chunk) {
    chunk.disableInteractive();
    chunk.setData('isIceBlock', false);

    this.tweens.add({
      targets: chunk,
      x: this.hopperX,
      y: this.hopperY + 12,
      scaleX: 0.25,
      scaleY: 0.25,
      alpha: 0,
      duration: 240,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        chunk.destroy();
        this.loadedCount = Math.min(TOTAL_ICE_BLOCKS, this.loadedCount + 1);
        gameState.d2IceLoadedCount = this.loadedCount;
        this.refreshTankVisuals();

        if (this.loadedCount >= TOTAL_ICE_BLOCKS) {
          this.completeLoading();
        } else {
          const left = TOTAL_ICE_BLOCKS - this.loadedCount;
          this.statusText
            .setText(`ICE SPLASHED IN! ${left} MORE BLOCK${left > 1 ? 'S' : ''} TO GO!`)
            .setColor('#7dd3fc');
        }
      },
    });
  }

  refreshTankVisuals() {
    const pct = Math.round((this.loadedCount / TOTAL_ICE_BLOCKS) * 100);
    this.counterText.setText(`ICE LOADED: ${this.loadedCount} / ${TOTAL_ICE_BLOCKS}`);
    this.o2Badge.setText(`O2 OUTPUT: ${pct}%`);
    this.drawTankContents();
  }

  tickBubbles() {
    if (!this.scene.isActive() || this.closing) return;

    if (this.loadedCount > 0 && this.bubbles.length < 18) {
      const tankBottom = this.tankY + 60;
      const waterH = 124 * (this.loadedCount / TOTAL_ICE_BLOCKS);
      const waterTop = tankBottom - waterH;
      this.bubbles.push({
        x: this.tankX + Phaser.Math.Between(-50, 50),
        y: tankBottom - 6,
        top: waterTop + 6,
        r: Phaser.Math.Between(2, 5),
        speed: Phaser.Math.FloatBetween(1.8, 3.6),
      });
    }

    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      this.bubbles[i].y -= this.bubbles[i].speed;
      if (this.bubbles[i].y <= this.bubbles[i].top) {
        this.bubbles.splice(i, 1);
      }
    }

    this.drawTankContents();
  }

  drawTankContents() {
    this.tankDynamicGfx.clear();
    if (this.loadedCount <= 0) return;

    const tankLeft = this.tankX - 63;
    const tankW = 126;
    const tankBottom = this.tankY + 60;
    const waterH = Math.max(18, 122 * (this.loadedCount / TOTAL_ICE_BLOCKS));
    const waterTop = tankBottom - waterH;

    // Liquid water column
    this.tankDynamicGfx.fillStyle(0x0284c7, 0.58);
    this.tankDynamicGfx.fillRoundedRect(tankLeft, waterTop, tankW, waterH, {
      tl: 4,
      tr: 4,
      bl: 8,
      br: 8,
    });
    // Water surface wave highlight
    this.tankDynamicGfx.fillStyle(0x7dd3fc, 0.45);
    this.tankDynamicGfx.fillRect(tankLeft + 4, waterTop, tankW - 8, 5);

    // Floating mini ice cubes in tank
    for (let i = 0; i < this.loadedCount; i++) {
      const ix = this.tankX - 38 + i * 24;
      const iy = waterTop + 10;
      this.tankDynamicGfx.fillStyle(0xe0f2fe, 0.85);
      this.tankDynamicGfx.fillRoundedRect(ix - 8, iy - 6, 16, 12, 3);
    }

    // Rising O2 bubbles
    for (const b of this.bubbles) {
      this.tankDynamicGfx.fillStyle(0xa7f3d0, 0.85);
      this.tankDynamicGfx.fillCircle(b.x, b.y, b.r);
    }
  }

  completeLoading() {
    if (this.completed) return;
    this.completed = true;
    gameState.d2IceLoadedCount = TOTAL_ICE_BLOCKS;
    gameState.d2OxLoaded = true;
    gameState.d2OxSwitchOn = true;
    gameState.stepId = 'd2_oxygen_maker';
    gameState.checkpointId = 'd2_oxygen_maker';

    this.cameras.main.flash(300, 52, 211, 153);
    this.statusText
      .setText('HOPPER FULL! ELECTROLYSIS PRODUCING BREATHABLE OXYGEN!')
      .setColor('#34d399');

    this.game.events.emit('oxygen:gradual-charge');
    this.time.delayedCall(900, () => this.closeTask());
  }

  closeTask() {
    if (this.closing) return;
    this.closing = true;
    const wasCompleted = this.completed;

    if (this.bubbleTimer) {
      this.bubbleTimer.remove();
      this.bubbleTimer = null;
    }

    this.tweens.add({
      targets: this.modal,
      y: GAME_HEIGHT + 350,
      duration: 300,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.scene.stop();
        this.scene.resume('Outpost');
        if (wasCompleted) {
          this.game.events.emit('d2:ice-loaded');
        }
      },
    });
  }
}
