import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { gameState } from '../state/GameState.js';
import { PillMeter } from '../ui/PillMeter.js';

/**
 * Always-on overlay scene: capsule pill meters, "Press SPACE" prompt, day badge.
 * Runs in parallel with whichever room is active, so it survives airlock transitions.
 */
export class HudScene extends Phaser.Scene {
  constructor() {
    super(SCENES.HUD);
  }

  create() {
    const font = { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' };

    // Day Display (Top-left, matching sketch)
    this.dayText = this.add.text(24, 18, 'Day 1', {
      fontFamily: 'monospace',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffd166',
    });

    // 4 Pill Meters (stacked neatly in top-left)
    this.powerMeter = new PillMeter(this, 24, 54, {
      type: 'power',
      label: 'Power',
      color: 0xffd166,
      width: 170,
      height: 30,
    });

    this.oxygenMeter = new PillMeter(this, 24, 92, {
      type: 'oxygen',
      label: 'Oxygen',
      color: 0x6fc3df,
      width: 170,
      height: 30,
    });

    this.waterMeter = new PillMeter(this, 24, 130, {
      type: 'water',
      label: 'Water',
      color: 0x4a90e2,
      width: 170,
      height: 30,
    });

    this.radiationMeter = new PillMeter(this, 24, 168, {
      type: 'radiation',
      label: 'Radiation',
      color: 0x50fa7b,
      width: 170,
      height: 30,
    });

    // Top Header: Title, Logbook, and Pause Button
    this.createTitleBanner();
    this.createLogbookButton();
    this.createPauseButton();
    this.createPauseOverlay();

    // Floating interaction prompt
    this.prompt = this.add
      .text(GAME_WIDTH / 2, 120, '', { ...font, fontSize: '20px', backgroundColor: '#000c', padding: { x: 14, y: 7 } })
      .setOrigin(0.5)
      .setVisible(false);

    this.toast = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 30, '', { ...font, color: '#ffd166' })
      .setOrigin(0.5);

    const unsub = [
      gameState.on('meters', () => this.refresh()),
      gameState.on('step', () => this.refresh()),
    ];
    this.game.events.on('prompt', this.showPrompt, this);
    this.game.events.on('station:interact', this.onInteract, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      unsub.forEach((fn) => fn());
      this.game.events.off('prompt', this.showPrompt, this);
      this.game.events.off('station:interact', this.onInteract, this);
    });

    this.refresh();
  }

  refresh() {
    this.dayText.setText(`Day ${gameState.day}`);
    this.powerMeter.setValue(gameState.meters.power);
    this.oxygenMeter.setValue(gameState.meters.oxygen);
    this.waterMeter.setValue(gameState.meters.water);
    this.radiationMeter.setValue(gameState.meters.radiation);
  }

  showPrompt(label) {
    this.prompt.setVisible(!!label);
    if (label) this.prompt.setText(`${label}  -  Press SPACE / tap`);
  }

  onInteract({ station }) {
    this.toast.setText(`[${station}] mini-game not built yet`);
    this.time.delayedCall(1500, () => this.toast.setText(''));
  }

  createTitleBanner() {
    const cx = GAME_WIDTH / 2;
    const cy = 28;
    const w = 410;
    const h = 34;

    const banner = this.add.container(cx, cy);

    // Decorative plate
    const plate = this.add.graphics();
    plate.fillStyle(0x131722, 0.88);
    plate.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    plate.lineStyle(1.5, 0x334155, 1);
    plate.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);

    // Cyan sci-fi corner brackets
    plate.lineStyle(2, 0x38bdf8, 1);
    const cSize = 6;
    // Top-left
    plate.lineBetween(-w / 2, -h / 2 + cSize, -w / 2, -h / 2);
    plate.lineBetween(-w / 2, -h / 2, -w / 2 + cSize, -h / 2);
    // Top-right
    plate.lineBetween(w / 2, -h / 2 + cSize, w / 2, -h / 2);
    plate.lineBetween(w / 2, -h / 2, w / 2 - cSize, -h / 2);
    // Bottom-left
    plate.lineBetween(-w / 2, h / 2 - cSize, -w / 2, h / 2);
    plate.lineBetween(-w / 2, h / 2, -w / 2 + cSize, h / 2);
    // Bottom-right
    plate.lineBetween(w / 2, h / 2 - cSize, w / 2, h / 2);
    plate.lineBetween(w / 2, h / 2, w / 2 - cSize, h / 2);

    // Subtle bottom glow line
    plate.lineStyle(2, 0xf97316, 0.8);
    plate.lineBetween(-w / 4, h / 2, w / 4, h / 2);

    banner.add(plate);

    // Title Text
    const titleText = this.add
      .text(0, 0, 'STRANDED ON MARS: SEVEN SOLS', {
        fontFamily: 'monospace',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#f1f5f9',
      })
      .setOrigin(0.5);
    banner.add(titleText);
  }

  createLogbookButton() {
    const bx = GAME_WIDTH / 2 + 236;
    const by = 28;
    const btn = this.add.container(bx, by);

    const bg = this.add.graphics();
    const drawBg = (hover = false) => {
      bg.clear();
      bg.fillStyle(hover ? 0x273142 : 0x181f2c, 0.9);
      bg.fillRoundedRect(-17, -17, 34, 34, 6);
      bg.lineStyle(1.5, hover ? 0x38bdf8 : 0x475569, 1);
      bg.strokeRoundedRect(-17, -17, 34, 34, 6);

      // Open Book Icon
      bg.fillStyle(0xf8fafc, 1);
      // Left Page
      bg.beginPath();
      bg.moveTo(-1, -7);
      bg.lineTo(-10, -9);
      bg.lineTo(-10, 6);
      bg.lineTo(-1, 8);
      bg.closePath();
      bg.fillPath();

      // Right Page
      bg.beginPath();
      bg.moveTo(1, -7);
      bg.lineTo(10, -9);
      bg.lineTo(10, 6);
      bg.lineTo(1, 8);
      bg.closePath();
      bg.fillPath();

      // Spine & Ribbon
      bg.lineStyle(1.5, 0x0f172a, 1);
      bg.lineBetween(0, -7, 0, 8);
      bg.fillStyle(0xf59e0b, 1);
      bg.fillRect(2, -8, 2, 7);
    };

    drawBg(false);
    btn.add(bg);

    const hit = this.add.rectangle(0, 0, 34, 34, 0x000000, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => drawBg(true));
    hit.on('pointerout', () => drawBg(false));
    hit.on('pointerdown', () => {
      this.toast.setText('LOGBOOK: Sol 1 recorded. NASA archives synced.');
      this.time.delayedCall(2000, () => this.toast.setText(''));
    });
    btn.add(hit);
  }

  createPauseButton() {
    const px = GAME_WIDTH - 36;
    const py = 28;
    const btn = this.add.container(px, py);

    const bg = this.add.graphics();
    const drawPause = (hover = false) => {
      bg.clear();
      bg.fillStyle(hover ? 0x273142 : 0x181f2c, 0.9);
      bg.fillRoundedRect(-17, -17, 34, 34, 6);
      bg.lineStyle(1.5, hover ? 0xf43f5e : 0x475569, 1);
      bg.strokeRoundedRect(-17, -17, 34, 34, 6);

      // Two vertical pause bars ||
      bg.fillStyle(0xffffff, 1);
      bg.fillRoundedRect(-6, -7, 4, 14, 2);
      bg.fillRoundedRect(2, -7, 4, 14, 2);
    };

    drawPause(false);
    btn.add(bg);

    const hit = this.add.rectangle(0, 0, 34, 34, 0x000000, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => drawPause(true));
    hit.on('pointerout', () => drawPause(false));
    hit.on('pointerdown', () => this.togglePause());
    btn.add(hit);

    this.input.keyboard.on('keydown-P', () => this.togglePause());
  }

  createPauseOverlay() {
    this.isPaused = false;
    this.pauseContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setVisible(false);

    const backdrop = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75);
    const box = this.add.graphics();
    box.fillStyle(0x111827, 0.95);
    box.fillRoundedRect(-180, -100, 360, 200, 12);
    box.lineStyle(2, 0x64748b, 1);
    box.strokeRoundedRect(-180, -100, 360, 200, 12);

    const title = this.add
      .text(0, -45, 'SIMULATION PAUSED', {
        fontFamily: 'monospace',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffd166',
      })
      .setOrigin(0.5);

    const hint = this.add
      .text(0, 5, 'Press [P] or click Resume to continue', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    const resumeBtn = this.add.container(0, 50);
    const rBg = this.add.graphics();
    rBg.fillStyle(0x2563eb, 1);
    rBg.fillRoundedRect(-70, -16, 140, 32, 6);
    const rText = this.add
      .text(0, 0, 'RESUME', {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    resumeBtn.add([rBg, rText]);
    resumeBtn.setSize(140, 32);
    resumeBtn.setInteractive({ useHandCursor: true });
    resumeBtn.on('pointerdown', () => this.togglePause());

    this.pauseContainer.add([backdrop, box, title, hint, resumeBtn]);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.pauseContainer.setVisible(this.isPaused);

    const activeRoom = gameState.room === 'surface' ? 'Surface' : 'Outpost';
    if (this.isPaused) {
      this.scene.pause(activeRoom);
    } else {
      this.scene.resume(activeRoom);
    }
  }
}
