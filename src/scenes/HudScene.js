import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { gameState } from '../state/GameState.js';
import { PillMeter } from '../ui/PillMeter.js';
import { FactCard } from '../ui/FactCard.js';
import { WarningCard } from '../ui/WarningCard.js';
import { LogbookModal } from '../ui/LogbookModal.js';
import { matchLogbookEntry } from '../data/logbookData.js';

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

    // Floating NASA Fact Card (shifted left so it never covers the Airlock, larger for legibility)
    this.factCard = new FactCard(this, GAME_WIDTH - 595, 58);

    // Floating Side Warning Card (shows wrong decisions with Rewind to Checkpoint)
    this.warningCard = new WarningCard(this, 24, 136);

    // Live Two-Page Astronaut Mission Logbook modal
    this.logbookModal = new LogbookModal(this);

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
      gameState.on('logbook', () => this.syncLogbookDot()),
    ];
    this.game.events.on('prompt', this.showPrompt, this);
    this.game.events.on('toast', this.showToast, this);
    this.game.events.on('station:interact', this.onInteract, this);
    this.game.events.on('fact:show', this.onShowFact, this);
    this.game.events.on('fact:hide', this.onHideFact, this);
    this.game.events.on('logbook:unlock', this.onUnlockFact, this);
    this.game.events.on('tutorial:logbook', this.showLogbookTutorial, this);
    this.game.events.on('tutorial:move', this.showMoveTutorial, this);
    this.game.events.on('warning:show', this.onShowWarning, this);
    this.game.events.on('warning:hide', this.onHideWarning, this);
    this.game.events.on('checkpoint:rewind-lights', this.onRewindLightsCheckpoint, this);
    this.game.events.on('checkpoint:rewind-d2-oxygen', this.onRewindD2Oxygen, this);
    this.game.events.on('checkpoint:rewind-d2-night', this.onRewindD2Night, this);
    this.game.events.on('power:gradual-charge', this.startGradualPowerCharge, this);
    this.game.events.on('power:gradual-charge-from', this.startGradualPowerFromCurrent, this);
    this.game.events.on('power:start-night-drain', this.startNightDrain, this);
    this.game.events.on('power:start-dust-drain', this.startDustDrain, this);
    this.game.events.on('power:stop-dust-drain', this.stopDustDrain, this);
    this.game.events.on('oxygen:gradual-charge', this.startGradualOxygenCharge, this);
    this.game.events.on('oxygen:start-rapid-drain', this.startRapidOxygenDrain, this);
    this.game.events.on('oxygen:stop-rapid-drain', this.stopRapidOxygenDrain, this);
    this.game.events.on('lights:restored', this.stopInitialPowerCharge, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      unsub.forEach((fn) => fn());
      this.game.events.off('prompt', this.showPrompt, this);
      this.game.events.off('toast', this.showToast, this);
      this.game.events.off('station:interact', this.onInteract, this);
      this.game.events.off('fact:show', this.onShowFact, this);
      this.game.events.off('fact:hide', this.onHideFact, this);
      this.game.events.off('logbook:unlock', this.onUnlockFact, this);
      this.game.events.off('tutorial:logbook', this.showLogbookTutorial, this);
      this.game.events.off('tutorial:move', this.showMoveTutorial, this);
      this.game.events.off('warning:show', this.onShowWarning, this);
      this.game.events.off('warning:hide', this.onHideWarning, this);
      this.game.events.off('checkpoint:rewind-lights', this.onRewindLightsCheckpoint, this);
      this.game.events.off('checkpoint:rewind-d2-oxygen', this.onRewindD2Oxygen, this);
      this.game.events.off('checkpoint:rewind-d2-night', this.onRewindD2Night, this);
      this.game.events.off('power:gradual-charge', this.startGradualPowerCharge, this);
      this.game.events.off('power:gradual-charge-from', this.startGradualPowerFromCurrent, this);
      this.game.events.off('power:start-night-drain', this.startNightDrain, this);
      this.game.events.off('power:start-dust-drain', this.startDustDrain, this);
      this.game.events.off('power:stop-dust-drain', this.stopDustDrain, this);
      this.game.events.off('oxygen:gradual-charge', this.startGradualOxygenCharge, this);
    this.game.events.off('oxygen:start-rapid-drain', this.startRapidOxygenDrain, this);
    this.game.events.off('oxygen:stop-rapid-drain', this.stopRapidOxygenDrain, this);
      this.game.events.off('lights:restored', this.stopInitialPowerCharge, this);
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
    const matchedId = (typeof payload === 'object' && payload?.id) || matchLogbookEntry(text);
    if (matchedId) {
      gameState.unlockFact(matchedId);
    }
    this.factCard.show(text);
  }

  onUnlockFact(factId) {
    const resolved = matchLogbookEntry(factId) || factId;
    gameState.unlockFact(resolved);
  }

  onHideFact(immediate = true) {
    this.factCard.hide(immediate);
  }

  onShowWarning(payload) {
    const msg = typeof payload === 'string' ? payload : payload?.text;
    if (msg && msg.includes('0.84 kg')) {
      gameState.unlockFact('human_o2_consumption');
    }
    this.warningCard.show(payload);
  }

  onHideWarning() {
    this.warningCard.hide();
  }

  onRewindLightsCheckpoint() {
    this.warningCard.hide();
    this.stopInitialPowerCharge();

    // Restore lights-off checkpoint state without resetting drained battery power back to 100%
    gameState.habLightsOn = false;

    if (this.scene.isActive('PowerPanelTask')) {
      this.scene.stop('PowerPanelTask');
    }

    this.game.events.emit('lights:turned-off', { silentWarning: true });

    if (this.scene.isActive(SCENES.OUTPOST)) {
      this.scene.pause(SCENES.OUTPOST);
    }

    this.scene.launch('PowerPanelTask', { autoTurnOnLight: true });
  }

  onRewindD2Oxygen() {
    this.stopRapidOxygenDrain();
    this.warningCard.hide();
    if (this.oxygenChargeEvent) {
      this.oxygenChargeEvent.remove();
      this.oxygenChargeEvent = null;
    }

    // Restore d2_ice_drilled checkpoint (Power: 100%, Oxygen: 20%) and keep assembled parts
    gameState.d2OxBuilt = false;
    gameState.d2OxLoaded = false;
    gameState.d2OxSwitchOn = true;
    gameState.d2OxPlacedParts = { hopper: true, electrolysis: true, valve: true };
    gameState.stepId = 'd2_ice_drilled';
    gameState.checkpointId = 'd2_ice_drilled';
    gameState.setMeters({ power: 100, oxygen: 20 });

    if (this.scene.isActive('OxygenBuildTask')) {
      this.scene.stop('OxygenBuildTask');
    }
    if (this.scene.isActive(SCENES.OUTPOST)) {
      this.scene.pause(SCENES.OUTPOST);
    }

    this.scene.launch('OxygenBuildTask');
  }

  onRewindD2Night() {
    this.stopRapidOxygenDrain();
    this.warningCard.hide();
    if (this.oxygenChargeEvent) {
      this.oxygenChargeEvent.remove();
      this.oxygenChargeEvent = null;
    }

    // Time-travel rewind back to snapshot saved right before evening switch decisions
    const restored = gameState.restoreCheckpoint('d2_night_ready');
    if (!restored) {
      gameState.d2OxBuilt = true;
      gameState.d2OxLoaded = true;
      gameState.d2OxSwitchOn = true;
      gameState.habLightsOn = true;
      gameState.d2NightModeSet = false;
      gameState.setMeters({ power: 60, oxygen: 100 });
    }
    this.game.events.emit('lights:sync');

    if (this.scene.isActive('PowerPanelTask')) {
      this.scene.stop('PowerPanelTask');
    }
    if (this.scene.isActive(SCENES.OUTPOST)) {
      this.scene.pause(SCENES.OUTPOST);
    }

    this.scene.launch('PowerPanelTask', { autoSetDay2Night: true });
  }

  startDustDrain() {
    this.powerMeter.setShaking(true);
    if (this.dustDrainEvent) return;

    this.dustDrainEvent = this.time.addEvent({
      delay: 6000,
      loop: true,
      callback: () => {
        if (gameState.d2PanelCleaned || gameState.day !== 2) {
          this.stopDustDrain();
          return;
        }
        if (gameState.meters.power !== null && gameState.meters.power > 50) {
          gameState.setMeters({ power: gameState.meters.power - 1 });
        }
      },
    });
  }

  stopDustDrain() {
    if (this.dustDrainEvent) {
      this.dustDrainEvent.remove();
      this.dustDrainEvent = null;
    }
    this.powerMeter.setShaking(false);
  }

  startGradualPowerFromCurrent() {
    gameState.unlockFact('opportunity_dust_2018');
    this.stopDustDrain();
    if (this.chargeFromEvent) {
      this.chargeFromEvent.remove();
      this.chargeFromEvent = null;
    }

    let current = gameState.meters.power ?? 75;
    if (current >= 100) {
      gameState.setMeters({ power: 100 });
      return;
    }

    this.chargeFromEvent = this.time.addEvent({
      delay: 55,
      loop: true,
      callback: () => {
        if (gameState.day !== 2 || gameState.d2OxBuilt) {
          this.chargeFromEvent.remove();
          this.chargeFromEvent = null;
          return;
        }
        current = Math.min(100, current + 1);
        gameState.setMeters({ power: current });
        if (current >= 100) {
          this.chargeFromEvent.remove();
          this.chargeFromEvent = null;
        }
      },
    });
  }

  startRapidOxygenDrain() {
    this.oxygenMeter?.setShaking(true);
    if (this.oxygenChargeEvent) {
      this.oxygenChargeEvent.remove();
      this.oxygenChargeEvent = null;
    }
    if (this.rapidOxDrainEvent) return;

    this.rapidOxDrainEvent = this.time.addEvent({
      delay: 350,
      loop: true,
      callback: () => {
        if (gameState.day !== 2 || gameState.d2OxSwitchOn) {
          this.stopRapidOxygenDrain();
          return;
        }
        const cur = gameState.meters.oxygen ?? 100;
        const next = Math.max(0, cur - 2);
        gameState.setMeters({ oxygen: next });
        if (next <= 0) {
          this.stopRapidOxygenDrain();
          this.warningCard.show({
            text: 'CRITICAL: Habitat Oxygen hit 0%! Turn OXYGEN MAKER back ON or rewind!',
            rewindEvent: 'checkpoint:rewind-d2-night',
          });
        }
      },
    });
  }

  stopRapidOxygenDrain() {
    if (this.rapidOxDrainEvent) {
      this.rapidOxDrainEvent.remove();
      this.rapidOxDrainEvent = null;
    }
    this.oxygenMeter?.setShaking(false);
  }

  startGradualOxygenCharge() {
    this.stopRapidOxygenDrain();
    gameState.unlockFact('human_o2_consumption');
    if (this.chargeFromEvent) {
      this.chargeFromEvent.remove();
      this.chargeFromEvent = null;
    }
    if (this.oxygenChargeEvent) {
      this.oxygenChargeEvent.remove();
      this.oxygenChargeEvent = null;
    }

    let current = gameState.meters.oxygen ?? 20;

    this.oxygenChargeEvent = this.time.addEvent({
      delay: 40,
      loop: true,
      callback: () => {
        if (gameState.day !== 2 || !gameState.d2OxSwitchOn) {
          this.oxygenChargeEvent.remove();
          this.oxygenChargeEvent = null;
          return;
        }
        current = Math.min(100, current + 2);
        gameState.setMeters({ oxygen: current });
        if (current >= 100) {
          this.oxygenChargeEvent.remove();
          this.oxygenChargeEvent = null;
        }
      },
    });
  }

  stopInitialPowerCharge() {
    if (this.chargeEvent) {
      this.chargeEvent.remove();
      this.chargeEvent = null;
    }
  }

  startGradualPowerCharge() {
    gameState.unlockFact('solar_arrays');
    this.stopInitialPowerCharge();
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
        if (!gameState.nightDrainActive || gameState.day > 2) return;
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

    this.logbookRedDot = this.add
      .circle(13, -13, 6, 0xef4444)
      .setStrokeStyle(2, 0xffffff)
      .setVisible(!!gameState.hasUnreadLogbook);
    btn.add(this.logbookRedDot);

    this.tweens.add({
      targets: this.logbookRedDot,
      scale: 1.25,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    const hit = this.add.rectangle(0, 0, 34, 34, 0x000000, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => drawBg(true));
    hit.on('pointerout', () => drawBg(false));
    hit.on('pointerdown', (_p, _lx, _ly, event) => {
      if (event) event.stopPropagation();
      this.logbookModal.openLatest();
    });
    btn.add(hit);
  }

  syncLogbookDot() {
    if (this.logbookRedDot) {
      this.logbookRedDot.setVisible(!!gameState.hasUnreadLogbook);
    }
  }

  drawKeyCap(parent, x, y, label, w = 46, h = 46) {
    const g = this.add.graphics();
    g.fillStyle(0x1e293b, 1);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    g.lineStyle(2, 0x38bdf8, 0.95);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    const t = this.add
      .text(x, y, label, {
        fontFamily: 'monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#f8fafc',
      })
      .setOrigin(0.5);
    parent.add([g, t]);
  }

  showLogbookTutorial(onComplete) {
    const bx = GAME_WIDTH / 2 + 236;
    const by = 28;
    const overlay = this.add.container(0, 0).setDepth(2450);

    // Full-screen dim hue overlay that absorbs clicks
    const hue = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x060b19, 0.84).setOrigin(0).setInteractive();
    hue.on('pointerdown', (_p, _lx, _ly, event) => {
      if (event) event.stopPropagation();
    });
    overlay.add(hue);

    // Spotlight halo + highlighted Logbook icon replica
    const halo = this.add.graphics();
    halo.fillStyle(0x38bdf8, 0.16);
    halo.fillCircle(bx, by, 34);
    halo.lineStyle(3, 0xffd166, 1);
    halo.strokeCircle(bx, by, 26);

    halo.fillStyle(0x273142, 1);
    halo.fillRoundedRect(bx - 17, by - 17, 34, 34, 6);
    halo.lineStyle(2, 0x38bdf8, 1);
    halo.strokeRoundedRect(bx - 17, by - 17, 34, 34, 6);
    halo.fillStyle(0xf8fafc, 1);
    halo.fillRect(bx - 10, by - 8, 9, 15);
    halo.fillRect(bx + 1, by - 8, 9, 15);
    halo.fillStyle(0xef4444, 1);
    halo.fillCircle(bx + 13, by - 13, 6);
    overlay.add(halo);

    // Upward bouncing arrow pointing to Logbook button
    const arrow = this.add
      .text(bx, by + 44, '▲', {
        fontFamily: 'monospace',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#ffd166',
      })
      .setOrigin(0.5);
    overlay.add(arrow);
    this.tweens.add({
      targets: arrow,
      y: by + 34,
      duration: 450,
      yoyo: true,
      repeat: -1,
    });

    // Callout Tutorial Box
    const cardW = 540;
    const cardH = 220;
    const cardX = GAME_WIDTH / 2;
    const cardY = 230;
    const card = this.add.graphics();
    card.fillStyle(0x0f172a, 0.96);
    card.fillRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 14);
    card.lineStyle(2.5, 0x38bdf8, 1);
    card.strokeRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 14);
    overlay.add(card);

    overlay.add(
      this.add
        .text(
          cardX,
          cardY - 12,
          'MISSION LOGBOOK UPDATED!\n\nMaisha records every NASA fact, mission photo, and reference\nin this open 2-page journal.\n\nWhenever you see the RED DOT on the Logbook icon above,\na new discovery has been added. Click it anytime to flip pages!',
          {
            fontFamily: 'monospace',
            fontSize: '14px',
            align: 'center',
            lineSpacing: 6,
            color: '#f8fafc',
          }
        )
        .setOrigin(0.5)
    );

    overlay.add(
      this.add
        .text(cardX, cardY + 84, '▶ TAP / PRESS SPACE TO CONTINUE', {
          fontFamily: 'monospace',
          fontSize: '13px',
          fontStyle: 'bold',
          color: '#ffd166',
        })
        .setOrigin(0.5)
    );

    let done = false;
    const dismiss = () => {
      if (done) return;
      done = true;
      hue.off('pointerdown', dismiss);
      this.input.keyboard.off('keydown-SPACE', dismiss);
      overlay.destroy();
      if (onComplete) {
        this.time.delayedCall(30, onComplete);
      }
    };

    this.time.delayedCall(220, () => {
      if (done) return;
      hue.on('pointerdown', dismiss);
      this.input.keyboard.on('keydown-SPACE', dismiss);
    });
  }

  showMoveTutorial(onComplete) {
    const activeRoom = gameState.room === 'surface' ? SCENES.SURFACE : SCENES.OUTPOST;
    let pausedRoom = null;
    if (this.scene.isActive(activeRoom) && !this.isPaused) {
      this.scene.pause(activeRoom);
      pausedRoom = activeRoom;
    }

    const overlay = this.add.container(0, 0).setDepth(2450);
    const hue = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x060b19, 0.8).setOrigin(0).setInteractive();
    hue.on('pointerdown', (_p, _lx, _ly, event) => {
      if (event) event.stopPropagation();
    });
    overlay.add(hue);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const cardW = 580;
    const cardH = 310;

    const card = this.add.graphics();
    card.fillStyle(0x0f172a, 0.96);
    card.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 16);
    card.lineStyle(2.5, 0xffd166, 1);
    card.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 16);
    overlay.add(card);

    overlay.add(
      this.add
        .text(cx, cy - 118, 'MISSION CONTROLS TUTORIAL', {
          fontFamily: 'monospace',
          fontSize: '18px',
          fontStyle: 'bold',
          color: '#ffd166',
        })
        .setOrigin(0.5)
    );

    // Drawn Arrow Key cluster (left) & SPACE / TAP badge (right)
    this.drawKeyCap(overlay, cx - 125, cy - 52, '▲');
    this.drawKeyCap(overlay, cx - 177, cy + 2, '◄');
    this.drawKeyCap(overlay, cx - 125, cy + 2, '▼');
    this.drawKeyCap(overlay, cx - 73, cy + 2, '►');
    this.drawKeyCap(overlay, cx + 115, cy - 22, 'SPACE / TAP', 175, 48);

    overlay.add(
      this.add
        .text(
          cx,
          cy + 68,
          '• Use ARROW KEYS (◄ ▲ ▼ ►) to walk around the Martian surface & outpost.\n• Stand near any glowing station or Airlock and press SPACE (or TAP) to interact.',
          {
            fontFamily: 'monospace',
            fontSize: '13px',
            align: 'center',
            lineSpacing: 6,
            color: '#e2e8f0',
          }
        )
        .setOrigin(0.5)
    );

    overlay.add(
      this.add
        .text(cx, cy + 124, '▶ TAP / PRESS SPACE OR ARROW KEYS TO BEGIN', {
          fontFamily: 'monospace',
          fontSize: '13px',
          fontStyle: 'bold',
          color: '#34d399',
        })
        .setOrigin(0.5)
    );

    let done = false;
    const dismiss = () => {
      if (done) return;
      done = true;
      hue.off('pointerdown', dismiss);
      this.input.keyboard.off('keydown-SPACE', dismiss);
      this.input.keyboard.off('keydown-LEFT', dismiss);
      this.input.keyboard.off('keydown-RIGHT', dismiss);
      this.input.keyboard.off('keydown-UP', dismiss);
      this.input.keyboard.off('keydown-DOWN', dismiss);
      overlay.destroy();
      if (pausedRoom) {
        this.time.delayedCall(30, () => {
          this.scene.resume(pausedRoom);
          if (onComplete) onComplete();
        });
      } else if (onComplete) {
        this.time.delayedCall(30, onComplete);
      }
    };

    this.time.delayedCall(220, () => {
      if (done) return;
      hue.on('pointerdown', dismiss);
      this.input.keyboard.on('keydown-SPACE', dismiss);
      this.input.keyboard.on('keydown-LEFT', dismiss);
      this.input.keyboard.on('keydown-RIGHT', dismiss);
      this.input.keyboard.on('keydown-UP', dismiss);
      this.input.keyboard.on('keydown-DOWN', dismiss);
    });
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
