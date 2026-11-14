import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/constants.js';
import { gameState } from '../../state/GameState.js';

/**
 * Outpost Power Breaker Panel.
 * Controls switches for: Light, Oxygen, Water, Battery, Safe Mode.
 * Slides up smoothly from the bottom.
 */
export class PowerPanelTask extends Phaser.Scene {
  constructor() {
    super('PowerPanelTask');
  }

  create() {
    this.closing = false;
    this.lightsJustRestored = false;

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Dark backdrop
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75).setOrigin(0);

    // Master container for slide-up entrance
    this.modal = this.add.container(cx, GAME_HEIGHT + 300);

    const panelW = 520;
    const panelH = 480;

    // Outer metal chassis
    const chassis = this.add.graphics();
    chassis.fillStyle(0x1e2129, 1);
    chassis.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    chassis.lineStyle(3, 0x4f586d, 1);
    chassis.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);

    // Hazard stripe header
    chassis.fillStyle(0xd97706, 1);
    chassis.fillRoundedRect(-panelW / 2 + 6, -panelH / 2 + 6, panelW - 12, 42, { tl: 10, tr: 10, bl: 0, br: 0 });

    this.modal.add(chassis);

    // Panel Title
    const title = this.add
      .text(0, -panelH / 2 + 27, '⚡ OUTPOST POWER BREAKER BOARD', {
        fontFamily: 'monospace',
        fontSize: '17px',
        fontStyle: 'bold',
        color: '#111827',
      })
      .setOrigin(0.5);
    this.modal.add(title);

    // Subtitle / Status
    this.statusText = this.add
      .text(0, -panelH / 2 + 68, 'TOTAL POWER: 100% | LOAD: BALANCED', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffd166',
      })
      .setOrigin(0.5);
    this.modal.add(this.statusText);

    // Close button (X)
    const closeBtn = this.add
      .text(panelW / 2 - 30, -panelH / 2 + 27, '[X]', {
        fontFamily: 'monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.closeTask());
    this.modal.add(closeBtn);

    // Configure switch list per day / narrative progression
    // On Day 1, only the option of lights is inside the power board
    if (gameState.day === 1) {
      this.switches = [
        {
          id: 'light',
          label: 'LIGHTS',
          desc: 'Main habitat illumination',
          on: gameState.habLightsOn || false,
          load: 10,
          locked: false,
        },
      ];
    } else if (gameState.day === 2) {
      this.switches = [
        { id: 'light', label: 'LIGHTS', desc: 'Main habitat illumination', on: true, load: 15, locked: false },
        { id: 'oxygen', label: 'OXYGEN', desc: 'Life support water splitting', on: true, load: 40, locked: false },
      ];
    } else if (gameState.day === 3) {
      this.switches = [
        { id: 'light', label: 'LIGHTS', desc: 'Main habitat illumination', on: true, load: 15, locked: false },
        { id: 'oxygen', label: 'OXYGEN', desc: 'Life support water splitting', on: true, load: 40, locked: false },
        { id: 'water', label: 'WATER', desc: 'Filtration and melting pumps', on: false, load: 20, locked: false },
      ];
    } else {
      this.switches = [
        { id: 'light', label: 'LIGHTS', desc: 'Main habitat illumination', on: true, load: 15, locked: false },
        { id: 'oxygen', label: 'OXYGEN', desc: 'Life support water splitting', on: true, load: 40, locked: false },
        { id: 'water', label: 'WATER', desc: 'Filtration and melting pumps', on: false, load: 20, locked: false },
        { id: 'safemode', label: 'SAFE MODE', desc: 'Cut non-essential auxiliary draw', on: false, load: -20, locked: false },
      ];
    }

    // Render 4 switch rows with spacious tactile layout
    const startY = -panelH / 2 + 120;
    const rowGap = 66;

    this.switchViews = [];

    this.switches.forEach((sw, idx) => {
      const rowY = startY + idx * rowGap;
      const rowContainer = this.add.container(0, rowY);

      // Row background plate
      const rowBg = this.add.graphics();
      rowBg.fillStyle(0x13151a, 0.95);
      rowBg.fillRoundedRect(-panelW / 2 + 20, -25, panelW - 40, 52, 10);
      rowBg.lineStyle(1.5, 0x2e3442, 1);
      rowBg.strokeRoundedRect(-panelW / 2 + 20, -25, panelW - 40, 52, 10);
      rowContainer.add(rowBg);

      // Label & Description
      const labelText = this.add.text(-panelW / 2 + 36, -16, sw.label, {
        fontFamily: 'monospace',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#ffffff',
      });
      const descText = this.add.text(-panelW / 2 + 36, 6, sw.desc, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#8b949e',
      });
      rowContainer.add([labelText, descText]);

      // Aerospace Tactile Switch (Recessed Track + Beveled Rocker Slider)
      const trackX = panelW / 2 - 85;
      const track = this.add.graphics();
      const knob = this.add.graphics();
      const statusPill = this.add
        .text(trackX + 42, 0, sw.on ? '[ONLINE]' : '[OFFLINE]', {
          fontFamily: 'monospace',
          fontSize: '11px',
          fontStyle: 'bold',
          color: sw.on ? '#06b6d4' : '#64748b',
        })
        .setOrigin(0, 0.5);

      rowContainer.add([track, knob, statusPill]);

      const updateSwitchVisual = (isOn) => {
        track.clear();
        // Recessed outer groove
        track.fillStyle(0x0a0c10, 1);
        track.fillRoundedRect(trackX - 26, -14, 52, 28, 14);
        track.lineStyle(2, isOn ? 0x0284c7 : 0x1e293b, 1);
        track.strokeRoundedRect(trackX - 26, -14, 52, 28, 14);

        // Illuminated active channel when ON
        if (isOn) {
          track.fillStyle(0x0369a1, 0.85);
          track.fillRoundedRect(trackX - 22, -10, 30, 20, 10);
          // Neon power strip indicator
          track.lineStyle(2, 0x38bdf8, 0.9);
          track.lineBetween(trackX - 16, 0, trackX - 4, 0);
        }

        knob.clear();
        const knobX = isOn ? trackX + 11 : trackX - 11;

        // Knob shadow
        knob.fillStyle(0x000000, 0.45);
        knob.fillRoundedRect(knobX - 11, -10, 22, 24, 7);

        // Tactile metallic slider knob body
        knob.fillStyle(isOn ? 0xf1f5f9 : 0x94a3b8, 1);
        knob.fillRoundedRect(knobX - 11, -12, 22, 24, 6);
        knob.lineStyle(1.5, isOn ? 0x38bdf8 : 0x475569, 1);
        knob.strokeRoundedRect(knobX - 11, -12, 22, 24, 6);

        // Tactile grip grooves
        knob.lineStyle(1, 0x475569, 0.8);
        knob.lineBetween(knobX - 3, -6, knobX - 3, 6);
        knob.lineBetween(knobX + 3, -6, knobX + 3, 6);

        // Micro LED status pip on the knob
        knob.fillStyle(isOn ? 0x10b981 : 0xef4444, 1);
        knob.fillCircle(knobX, 0, 3);

        if (sw.locked) {
          statusPill.setText('[OFFLINE]');
          statusPill.setColor('#475569');
        } else {
          statusPill.setText(isOn ? '[ONLINE]' : '[OFFLINE]');
          statusPill.setColor(isOn ? '#06b6d4' : '#64748b');
        }
      };

      if (sw.locked) {
        rowContainer.setAlpha(0.45);
      }

      updateSwitchVisual(sw.on);

      // Interactive hit area on the toggle
      if (!sw.locked) {
        const hitArea = this.add
          .rectangle(trackX, 0, 110, 48, 0x000000, 0)
          .setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', () => {
          sw.on = !sw.on;
          updateSwitchVisual(sw.on);
          this.updateLoad();
        });
        rowContainer.add(hitArea);
      }

      this.modal.add(rowContainer);
      this.switchViews.push({ sw, updateSwitchVisual });
    });

    // Apply & Confirm button
    const applyBtn = this.add.container(0, panelH / 2 - 40);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x059669, 1);
    btnBg.fillRoundedRect(-120, -18, 240, 36, 8);
    btnBg.lineStyle(2, 0x34d399, 1);
    btnBg.strokeRoundedRect(-120, -18, 240, 36, 8);

    const btnText = this.add
      .text(0, 0, 'APPLY CONFIGURATION', {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    applyBtn.add([btnBg, btnText]);
    applyBtn.setSize(240, 36);
    applyBtn.setInteractive({ useHandCursor: true });
    applyBtn.on('pointerdown', () => this.applyAndClose());
    this.modal.add(applyBtn);

    // Slide up from bottom
    this.tweens.add({
      targets: this.modal,
      y: cy,
      duration: 400,
      ease: 'Back.easeOut',
    });

    // Keyboard ESC to close
    const onEsc = () => this.closeTask();
    this.input.keyboard.on('keydown-ESC', onEsc);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.input?.keyboard) this.input.keyboard.off('keydown-ESC', onEsc);
    });
    this.updateLoad();
  }

  updateLoad() {
    let totalLoad = 0;
    this.switches.forEach((sw) => {
      if (sw.on) totalLoad += sw.load;
    });

    const isSafe = this.switches.find((s) => s.id === 'safemode')?.on;
    if (isSafe) {
      this.statusText.setText(`LOAD: ${Math.max(10, totalLoad)}% | SAFE MODE ACTIVE`).setColor('#50fa7b');
    } else {
      this.statusText.setText(`TOTAL ACTIVE LOAD: ${totalLoad}% | STATUS: NORMAL`).setColor('#ffd166');
    }
  }

  applyAndClose() {
    if (gameState.day === 1) {
      const lightSw = this.switches.find((s) => s.id === 'light');
      if (lightSw && lightSw.on && !gameState.habLightsOn) {
        gameState.habLightsOn = true;
        const cur = gameState.meters.power ?? 100;
        gameState.setMeters({ power: Math.max(10, cur > 90 ? 90 : cur - 10) });
        this.lightsJustRestored = true;
      }
    }
    this.closeTask();
  }

  closeTask() {
    if (this.closing) return;
    this.closing = true;
    const restored = this.lightsJustRestored;

    this.tweens.add({
      targets: this.modal,
      y: GAME_HEIGHT + 350,
      duration: 300,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.scene.stop();
        const activeRoom = gameState.room === 'surface' ? 'Surface' : 'Outpost';
        this.scene.resume(activeRoom);
        if (restored) {
          this.game.events.emit('lights:restored');
        }
      },
    });
  }
}
