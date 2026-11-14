import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/constants.js';
import { gameState } from '../../state/GameState.js';

/**
 * Clean the Solar Panel mini-game (4x4 swipe grid).
 * Preserves progress in gameState.d2CleanProgress if closed mid-task.
 */
export class SolarCleanTask extends Phaser.Scene {
  constructor() {
    super('SolarCleanTask');
  }

  create() {
    this.completed = false;
    this.closing = false;

    if (!Array.isArray(gameState.d2CleanProgress) || gameState.d2CleanProgress.length !== 16) {
      gameState.d2CleanProgress = new Array(16).fill(false);
    }

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const panelW = 540;
    const panelH = 500;

    // Dimmed overlay
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75).setOrigin(0);

    // Modal container sliding up from bottom
    this.modal = this.add.container(cx, GAME_HEIGHT + 300);

    // Chassis
    const chassis = this.add.graphics();
    chassis.fillStyle(0x161b24, 1);
    chassis.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    chassis.lineStyle(3, 0x3b4459, 1);
    chassis.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    chassis.fillStyle(0xb45309, 1);
    chassis.fillRoundedRect(-panelW / 2 + 6, -panelH / 2 + 6, panelW - 12, 42, { tl: 10, tr: 10, bl: 0, br: 0 });
    this.modal.add(chassis);

    const title = this.add
      .text(0, -panelH / 2 + 27, 'CLEAN SOLAR ARRAY (4x4 SWIPE)', {
        fontFamily: 'monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.modal.add(title);

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
      .text(0, -panelH / 2 + 66, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ffd166',
      })
      .setOrigin(0.5);
    this.modal.add(this.statusText);

    // 4x4 Solar Grid Frame
    const cellSize = 72;
    const gap = 8;
    const gridTotal = cellSize * 4 + gap * 3;
    const gridStartX = -gridTotal / 2;
    const gridStartY = -gridTotal / 2 + 12;

    const frameGfx = this.add.graphics();
    frameGfx.fillStyle(0x0f172a, 1);
    frameGfx.fillRoundedRect(gridStartX - 14, gridStartY - 14, gridTotal + 28, gridTotal + 28, 10);
    frameGfx.lineStyle(2, 0x475569, 1);
    frameGfx.strokeRoundedRect(gridStartX - 14, gridStartY - 14, gridTotal + 28, gridTotal + 28, 10);
    this.modal.add(frameGfx);

    this.cells = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const idx = row * 4 + col;
        const x = gridStartX + col * (cellSize + gap);
        const y = gridStartY + row * (cellSize + gap);

        const gfx = this.add.graphics();
        this.modal.add(gfx);

        const hit = this.add
          .rectangle(x + cellSize / 2, y + cellSize / 2, cellSize, cellSize, 0x000000, 0)
          .setInteractive({ useHandCursor: true });

        hit.on('pointerdown', () => this.cleanCell(idx));
        hit.on('pointerover', (pointer) => {
          if (pointer.isDown) this.cleanCell(idx);
        });
        this.modal.add(hit);

        this.cells.push({ idx, x, y, size: cellSize, gfx });
        this.drawCell(idx);
      }
    }

    // Hint bar
    this.hintText = this.add
      .text(0, panelH / 2 - 28, 'Click or swipe across the dusty tiles to clean all 16!', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);
    this.modal.add(this.hintText);

    // Quick wipe button / brush indicator or Space bar sweeps next dusty cell
    this.updateStatus();

    const onEsc = () => this.closeTask();
    this.input.keyboard.on('keydown-ESC', onEsc);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.input?.keyboard) this.input.keyboard.off('keydown-ESC', onEsc);
    });

    // Check if already all clean (edge case)
    if (gameState.d2CleanProgress.every(Boolean)) {
      this.onAllCleaned();
    }

    // Slide up from bottom
    this.tweens.add({
      targets: this.modal,
      y: cy,
      duration: 380,
      ease: 'Back.easeOut',
    });
  }

  drawCell(idx) {
    const cell = this.cells[idx];
    const isClean = !!gameState.d2CleanProgress[idx];
    const g = cell.gfx;
    g.clear();

    // Base blue photovoltaic cell
    g.fillStyle(isClean ? 0x1d4ed8 : 0x1e293b, 1);
    g.fillRoundedRect(cell.x, cell.y, cell.size, cell.size, 6);
    g.lineStyle(1, isClean ? 0x60a5fa : 0x334155, 0.8);
    g.strokeRoundedRect(cell.x, cell.y, cell.size, cell.size, 6);

    // Silicon wafer lines
    g.lineStyle(1, 0x93c5fd, isClean ? 0.45 : 0.15);
    g.lineBetween(cell.x + cell.size * 0.5, cell.y + 6, cell.x + cell.size * 0.5, cell.y + cell.size - 6);
    g.lineBetween(cell.x + 6, cell.y + cell.size * 0.5, cell.x + cell.size - 6, cell.y + cell.size * 0.5);

    if (!isClean) {
      // Martian red-brown dust layer
      g.fillStyle(0x9a3412, 0.86);
      g.fillRoundedRect(cell.x + 2, cell.y + 2, cell.size - 4, cell.size - 4, 5);
      g.fillStyle(0xc2410c, 0.75);
      g.fillCircle(cell.x + 22, cell.y + 26, 12);
      g.fillCircle(cell.x + 48, cell.y + 44, 14);
      g.fillStyle(0x7c2d12, 0.65);
      g.fillCircle(cell.x + 46, cell.y + 20, 8);
    } else {
      // Clean sheen highlight
      g.fillStyle(0xffffff, 0.16);
      g.fillTriangle(
        cell.x + 6,
        cell.y + 6,
        cell.x + 34,
        cell.y + 6,
        cell.x + 6,
        cell.y + 34
      );
    }
  }

  cleanCell(idx) {
    if (this.completed || gameState.d2CleanProgress[idx]) return;
    gameState.d2CleanProgress[idx] = true;
    this.drawCell(idx);
    this.updateStatus();

    // Small sparkle flash on cleaned cell
    const cell = this.cells[idx];
    const spark = this.add
      .text(cell.x + cell.size / 2, cell.y + cell.size / 2, '✦', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#fef08a',
      })
      .setOrigin(0.5);
    this.modal.add(spark);
    this.tweens.add({
      targets: spark,
      scale: 1.5,
      alpha: 0,
      duration: 280,
      onComplete: () => spark.destroy(),
    });

    if (gameState.d2CleanProgress.every(Boolean)) {
      this.onAllCleaned();
    }
  }

  updateStatus() {
    const cleaned = gameState.d2CleanProgress.filter(Boolean).length;
    this.statusText.setText(`DUST WIPED: ${cleaned} / 16 PANELS CLEAN`);
  }

  onAllCleaned() {
    if (this.completed) return;
    this.completed = true;

    this.statusText.setText('SOLAR ARRAY CLEANED! RECHARGING BATTERY...').setColor('#34d399');
    this.hintText.setText('Sunlight harvesting restored to 100%!').setColor('#86efac');

    gameState.d2PanelCleaned = true;
    gameState.stepId = 'd2_panel_cleaned';
    gameState.checkpointId = 'd2_panel_cleaned';
    this.game.events.emit('power:stop-dust-drain');
    this.game.events.emit('power:gradual-charge-from');

    this.time.delayedCall(750, () => this.closeTask());
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
        const activeRoom = gameState.room === 'surface' ? 'Surface' : 'Outpost';
        this.scene.resume(activeRoom);
        if (wasCompleted) {
          this.game.events.emit('d2:panel-cleaned');
        }
      },
    });
  }
}
