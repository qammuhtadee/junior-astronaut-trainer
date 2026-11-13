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

    // Default switch states
    this.switches = [
      { id: 'light', label: 'HAB LIGHTING', desc: 'Main habitat illumination', on: true, load: 15 },
      { id: 'oxygen', label: 'O2 GENERATOR', desc: 'Life support water splitting', on: true, load: 35 },
      { id: 'water', label: 'WATER PURIFIER', desc: 'Filtration and melting pumps', on: false, load: 20 },
      { id: 'battery', label: 'BATTERY STORAGE', desc: 'Outpost emergency reserve buffer', on: true, load: 15 },
      { id: 'safemode', label: 'SAFE MODE', desc: 'Cut non-essential auxiliary draw', on: false, load: -15 },
    ];

    // Render 5 switch rows
    const startY = -panelH / 2 + 115;
    const rowGap = 56;

    this.switchViews = [];

    this.switches.forEach((sw, idx) => {
      const rowY = startY + idx * rowGap;
      const rowContainer = this.add.container(0, rowY);

      // Row background plate
      const rowBg = this.add.graphics();
      rowBg.fillStyle(0x13151a, 0.9);
      rowBg.fillRoundedRect(-panelW / 2 + 20, -22, panelW - 40, 48, 8);
      rowBg.lineStyle(1.5, 0x2e3442, 1);
      rowBg.strokeRoundedRect(-panelW / 2 + 20, -22, panelW - 40, 48, 8);
      rowContainer.add(rowBg);

      // Label & Description
      const labelText = this.add.text(-panelW / 2 + 36, -14, sw.label, {
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

      // Toggle Switch (Track & Knob)
      const trackX = panelW / 2 - 80;
      const track = this.add.graphics();
      const knob = this.add.graphics();
      const statusPill = this.add
        .text(trackX + 38, 0, sw.on ? 'ON' : 'OFF', {
          fontFamily: 'monospace',
          fontSize: '12px',
          fontStyle: 'bold',
          color: sw.on ? '#50fa7b' : '#6e7681',
        })
        .setOrigin(0, 0.5);

      rowContainer.add([track, knob, statusPill]);

      const updateSwitchVisual = (isOn) => {
        track.clear();
        track.fillStyle(isOn ? 0x1d4ed8 : 0x262b36, 1);
        track.fillRoundedRect(trackX - 22, -12, 44, 24, 12);
        track.lineStyle(1.5, isOn ? 0x60a5fa : 0x3d4452, 1);
        track.strokeRoundedRect(trackX - 22, -12, 44, 24, 12);

        knob.clear();
        const knobX = isOn ? trackX + 8 : trackX - 8;
        knob.fillStyle(0xffffff, 1);
        knob.fillCircle(knobX, 0, 9);

        statusPill.setText(isOn ? 'ON' : 'OFF');
        statusPill.setColor(isOn ? '#50fa7b' : '#6e7681');
      };

      updateSwitchVisual(sw.on);

      // Interactive hit area on the toggle
      const hitArea = this.add
        .rectangle(trackX, 0, 90, 40, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        sw.on = !sw.on;
        updateSwitchVisual(sw.on);
        this.updateLoad();
      });
      rowContainer.add(hitArea);

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
    this.input.keyboard.on('keydown-ESC', () => this.closeTask());
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
    // If Day 1 night or Day 2 night choices
    this.closeTask();
  }

  closeTask() {
    this.tweens.add({
      targets: this.modal,
      y: GAME_HEIGHT + 350,
      duration: 300,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.scene.stop();
        const activeRoom = gameState.room === 'surface' ? 'Surface' : 'Outpost';
        this.scene.resume(activeRoom);
      },
    });
  }
}
