import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { gameState } from '../state/GameState.js';
import { PillMeter } from '../ui/PillMeter.js';
import { FactCard } from '../ui/FactCard.js';
import { WarningCard } from '../ui/WarningCard.js';

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

    // 4 Pill Meters (2x2 grid in top-left)
    // Row 1: Power & Oxygen
    this.powerMeter = new PillMeter(this, 24, 52, {
      type: 'power',
      label: 'Power',
      color: 0xffd166,
      width: 170,
      height: 30,
    });

    this.oxygenMeter = new PillMeter(this, 206, 52, {
      type: 'oxygen',
      label: 'Oxygen',
      color: 0x6fc3df,
      width: 170,
      height: 30,
    });

    // Row 2: Water & Radiation
    this.waterMeter = new PillMeter(this, 24, 88, {
      type: 'water',
      label: 'Water',
      color: 0x4a90e2,
      width: 170,
      height: 30,
    });

    this.radiationMeter = new PillMeter(this, 206, 88, {
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

    // Floating NASA Fact Card (stays visible until manually closed by the user)
    this.factCard = new FactCard(this, GAME_WIDTH - 360, 62);

    // Floating Side Warning Card (shows wrong decisions with Rewind to Checkpoint)
    this.warningCard = new WarningCard(this, 24, 136);

    // Floating interaction prompt
    this.prompt = this.add
      .text(GAME_WIDTH / 2, 120, '', { ...font, fontSize: '20px', backgroundColor: '#000c', padding: { x: 14, y: 7 } })
      .setOrigin(0.5)
      .setVisible(false);

    this.toast = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 30, '', {
        ...font,
        color: '#ffd166',
        backgroundColor: '#0f172acc',
        padding: { x: 14, y: 6 },
      })
      .setOrigin(0.5)
      .setVisible(false);

    const unsub = [
      gameState.on('meters', () => this.refresh()),
      gameState.on('step', () => this.refresh()),
    ];
    this.game.events.on('prompt', this.showPrompt, this);
    this.game.events.on('toast', this.showToast, this);
    this.game.events.on('station:interact', this.onInteract, this);
    this.game.events.on('fact:show', this.onShowFact, this);
    this.game.events.on('fact:hide', this.onHideFact, this);
    this.game.events.on('warning:show', this.onShowWarning, this);
    this.game.events.on('warning:hide', this.onHideWarning, this);
    this.game.events.on('checkpoint:rewind-lights', this.onRewindLightsCheckpoint, this);
    this.game.events.on('power:gradual-charge', this.startGradualPowerCharge, this);
    this.game.events.on('power:start-night-drain', this.startNightDrain, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      unsub.forEach((fn) => fn());
      this.game.events.off('prompt', this.showPrompt, this);
      this.game.events.off('toast', this.showToast, this);
      this.game.events.off('station:interact', this.onInteract, this);
      this.game.events.off('fact:show', this.onShowFact, this);
      this.game.events.off('fact:hide', this.onHideFact, this);
      this.game.events.off('warning:show', this.onShowWarning, this);
      this.game.events.off('warning:hide', this.onHideWarning, this);
      this.game.events.off('checkpoint:rewind-lights', this.onRewindLightsCheckpoint, this);
      this.game.events.off('power:gradual-charge', this.startGradualPowerCharge, this);
      this.game.events.off('power:start-night-drain', this.startNightDrain, this);
    });

    this.refresh();

    if (this.cache.audio.exists('bgm-main')) {
      const bgm = this.sound.get('bgm-main');
      if (!bgm) {
        this.sound.add('bgm-main', { loop: true, volume: 0.35 }).play();
      } else if (!bgm.isPlaying) {
        bgm.play({ loop: true, volume: 0.35 });
      }
    }
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

  showToast(message) {
    if (this.toastTimer) this.toastTimer.remove();
    this.toast.setText(message);
    this.toast.setVisible(true);
    this.toastTimer = this.time.delayedCall(2200, () => {
      this.toast.setVisible(false);
    });
  }

  onInteract({ station }) {
    this.showToast(`[${station}] mini-game not built yet`);
  }

  onShowFact(payload) {
    const text = typeof payload === 'string' ? payload : payload.text;
    this.factCard.show(text);
  }

  onHideFact() {
    this.factCard.hide();
  }

  onShowWarning(payload) {
    const text = typeof payload === 'string' ? payload : payload?.text;
    this.warningCard.show(text);
  }

  onHideWarning() {
    this.warningCard.hide();
  }

  onRewindLightsCheckpoint() {
    this.warningCard.hide();
    if (this.chargeEvent) {
      this.chargeEvent.remove();
      this.chargeEvent = null;
    }

    // Restore first checkpoint state (d1_panel_built: Power 100%, lights about to turn on at Power Panel)
    gameState.habLightsOn = false;
    gameState.setMeters({ power: 100 });

    if (this.scene.isActive('PowerPanelTask')) {
      this.scene.stop('PowerPanelTask');
    }

    this.game.events.emit('lights:turned-off', { silentWarning: true });

    if (this.scene.isActive(SCENES.OUTPOST)) {
      this.scene.pause(SCENES.OUTPOST);
    }

    this.scene.launch('PowerPanelTask', { autoTurnOnLight: true });
  }

  startGradualPowerCharge() {
    if (this.chargeEvent) this.chargeEvent.remove();
    gameState.setMeters({ power: 0 });

    // Charge smoothly from 0% to 100% over 6 seconds (60 ticks at 100ms each)
    let current = 0;
    this.chargeEvent = this.time.addEvent({
      delay: 60,
      repeat: 99,
      callback: () => {
        // Stop charging if lights were already turned on
        if (gameState.habLightsOn) {
          this.chargeEvent.remove();
          return;
        }
        current = Math.min(100, current + 1);
        gameState.setMeters({ power: current });
      },
    });
  }

  startNightDrain() {
    gameState.nightDrainActive = true;
    if (this.nightDrainEvent) return;

    // Drain 1% every 5 seconds while night drain is active on Day 1
    this.nightDrainEvent = this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => {
        if (!gameState.nightDrainActive || gameState.day > 1) return;
        if (gameState.meters.power !== null && gameState.meters.power > 10) {
          gameState.setMeters({ power: gameState.meters.power - 1 });
        }
      },
    });
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
