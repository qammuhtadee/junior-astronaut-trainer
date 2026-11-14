import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/constants.js';
import { gameState } from '../../state/GameState.js';

/**
 * Drill for Subsurface Ice mini-game (Hold & Release template).
 * Preserves drill depth in gameState.d2DrillDepth if closed mid-task.
 */
export class IceDrillTask extends Phaser.Scene {
  constructor() {
    super('IceDrillTask');
  }

  create() {
    this.completed = false;
    this.closing = false;
    this.heat = 0;
    this.overheated = false;
    this.isHolding = false;
    this.pointerHolding = false;

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const panelW = 540;
    const panelH = 510;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75).setOrigin(0);
    this.modal = this.add.container(cx, GAME_HEIGHT + 300);

    // Chassis
    const chassis = this.add.graphics();
    chassis.fillStyle(0x161b24, 1);
    chassis.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    chassis.lineStyle(3, 0x3b4459, 1);
    chassis.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    chassis.fillStyle(0x0284c7, 1);
    chassis.fillRoundedRect(-panelW / 2 + 6, -panelH / 2 + 6, panelW - 12, 42, { tl: 10, tr: 10, bl: 0, br: 0 });
    this.modal.add(chassis);

    this.modal.add(
      this.add
        .text(0, -panelH / 2 + 27, 'SUBSURFACE ICE DRILL', {
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
      .text(0, -panelH / 2 + 66, 'HOLD TO DRILL — RELEASE TO COOL BIT', {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#ffd166',
      })
      .setOrigin(0.5);
    this.modal.add(this.statusText);

    // Geological cross-section viewport
    const shaftW = 240;
    const shaftH = 260;
    const shaftX = -130;
    const shaftY = -panelH / 2 + 92;

    const layers = this.add.graphics();
    // Top regolith
    layers.fillStyle(0x7c2d12, 1);
    layers.fillRoundedRect(shaftX, shaftY, shaftW, shaftH * 0.45, { tl: 8, tr: 8, bl: 0, br: 0 });
    // Deep basalt rock
    layers.fillStyle(0x451a03, 1);
    layers.fillRect(shaftX, shaftY + shaftH * 0.45, shaftW, shaftH * 0.35);
    // Glowing blue subsurface ice layer
    layers.fillStyle(0x0ea5e9, 0.9);
    layers.fillRoundedRect(shaftX, shaftY + shaftH * 0.8, shaftW, shaftH * 0.2, { tl: 0, tr: 0, bl: 8, br: 8 });
    layers.fillStyle(0xe0f2fe, 0.45);
    layers.fillRect(shaftX + 12, shaftY + shaftH * 0.82, shaftW - 24, 8);
    // Labels
    layers.lineStyle(2, 0x475569, 1);
    layers.strokeRoundedRect(shaftX, shaftY, shaftW, shaftH, 8);
    this.modal.add(layers);

    this.modal.add(
      this.add
        .text(shaftX + shaftW / 2, shaftY + shaftH * 0.9, 'ICE LAYER TARGET', {
          fontFamily: 'monospace',
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#ffffff',
        })
        .setOrigin(0.5)
    );

    // Drill shaft & bit
    this.drillGfx = this.add.graphics();
    this.modal.add(this.drillGfx);
    this.shaftRect = { x: shaftX, y: shaftY, w: shaftW, h: shaftH };

    // Depth & Heat gauges on the right
    this.gaugeGfx = this.add.graphics();
    this.modal.add(this.gaugeGfx);

    this.depthLabel = this.add.text(142, shaftY, 'DEPTH: 0%', {
      fontFamily: 'monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#38bdf8',
    });
    this.heatLabel = this.add.text(142, shaftY + 128, 'TEMP: 0%', {
      fontFamily: 'monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#50fa7b',
    });
    this.modal.add([this.depthLabel, this.heatLabel]);

    // Hold-to-Drill button at bottom
    const drillBtn = this.add.container(0, panelH / 2 - 64);
    this.drillBtnBg = this.add.graphics();
    this.drawDrillBtn(false);
    const drillBtnText = this.add
      .text(0, 0, '[ HOLD TO DRILL (OR SPACE) ]', {
        fontFamily: 'monospace',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    drillBtn.add([this.drillBtnBg, drillBtnText]);
    drillBtn.setSize(300, 46);
    drillBtn.setInteractive({ useHandCursor: true });

    drillBtn.on('pointerdown', () => {
      this.pointerHolding = true;
      this.drawDrillBtn(true);
    });
    drillBtn.on('pointerup', () => {
      this.pointerHolding = false;
      this.drawDrillBtn(false);
    });
    drillBtn.on('pointerout', () => {
      this.pointerHolding = false;
      this.drawDrillBtn(false);
    });
    this.modal.add(drillBtn);

    // Keyboard support
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    const onEsc = () => this.closeTask();
    this.input.keyboard.on('keydown-ESC', onEsc);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.input?.keyboard) {
        this.input.keyboard.off('keydown-ESC', onEsc);
        this.input.keyboard.removeKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.input.keyboard.removeKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
        this.input.keyboard.removeKey(Phaser.Input.Keyboard.KeyCodes.S);
      }
    });

    this.renderDrill();

    // Slide up from bottom
    this.tweens.add({
      targets: this.modal,
      y: cy,
      duration: 380,
      ease: 'Back.easeOut',
    });
  }

  drawDrillBtn(pressed) {
    this.drillBtnBg.clear();
    this.drillBtnBg.fillStyle(pressed ? 0x0369a1 : 0x0284c7, 1);
    this.drillBtnBg.fillRoundedRect(-150, -23, 300, 46, 10);
    this.drillBtnBg.lineStyle(2, pressed ? 0x7dd3fc : 0x38bdf8, 1);
    this.drillBtnBg.strokeRoundedRect(-150, -23, 300, 46, 10);
  }

  update(_time, delta) {
    if (this.completed || this.closing) return;

    const dt = Math.min(delta / 1000, 0.05);
    const keyHold = this.spaceKey?.isDown || this.downKey?.isDown || this.sKey?.isDown;
    this.isHolding = (this.pointerHolding || keyHold) && !this.overheated;

    if (this.isHolding) {
      gameState.d2DrillDepth = Math.min(100, (gameState.d2DrillDepth || 0) + 23 * dt);
      this.heat = Math.min(100, this.heat + 38 * dt);

      if (this.heat >= 100) {
        this.overheated = true;
        this.statusText.setText('OVERHEATED! RELEASE TO COOL DRILL BIT').setColor('#ef4444');
        this.time.delayedCall(1200, () => {
          if (!this.completed) {
            this.overheated = false;
            this.statusText.setText('HOLD TO DRILL — RELEASE TO COOL BIT').setColor('#ffd166');
          }
        });
      }
    } else {
      this.heat = Math.max(0, this.heat - 45 * dt);
    }

    this.renderDrill();

    if (gameState.d2DrillDepth >= 100) {
      this.onReachedIce();
    }
  }

  renderDrill() {
    const depth = gameState.d2DrillDepth || 0;
    const { x, y, w, h } = this.shaftRect;
    const drillX = x + w / 2 + (this.isHolding ? Phaser.Math.Between(-2, 2) : 0);
    const tipY = y + 24 + (depth / 100) * (h - 46);

    // Cut bore hole + drill rod
    this.drillGfx.clear();
    this.drillGfx.fillStyle(0x0f172a, 0.85);
    this.drillGfx.fillRect(x + w / 2 - 14, y, 28, Math.max(20, tipY - y));

    this.drillGfx.fillStyle(0x94a3b8, 1);
    this.drillGfx.fillRect(drillX - 5, y, 10, tipY - y - 16);

    // Drill bit cone (glows orange-red when hot)
    const bitCol = this.heat > 75 ? 0xf97316 : 0xe2e8f0;
    this.drillGfx.fillStyle(bitCol, 1);
    this.drillGfx.fillTriangle(drillX - 11, tipY - 18, drillX + 11, tipY - 18, drillX, tipY);

    // Side gauges
    this.gaugeGfx.clear();
    const gx = 142;
    const barW = 90;
    const barH = 18;

    // Depth bar
    this.gaugeGfx.fillStyle(0x0f172a, 1);
    this.gaugeGfx.fillRoundedRect(gx, y + 24, barW, barH, 6);
    this.gaugeGfx.fillStyle(0x38bdf8, 1);
    this.gaugeGfx.fillRoundedRect(gx + 2, y + 26, Math.max(4, ((barW - 4) * depth) / 100), barH - 4, 4);
    this.depthLabel.setText(`DEPTH: ${Math.round(depth)}%`);

    // Heat bar
    const heatPct = Math.round(this.heat);
    const heatCol = heatPct > 75 ? 0xef4444 : heatPct > 45 ? 0xf59e0b : 0x50fa7b;
    this.gaugeGfx.fillStyle(0x0f172a, 1);
    this.gaugeGfx.fillRoundedRect(gx, y + 152, barW, barH, 6);
    if (heatPct > 0) {
      this.gaugeGfx.fillStyle(heatCol, 1);
      this.gaugeGfx.fillRoundedRect(gx + 2, y + 154, Math.max(4, ((barW - 4) * heatPct) / 100), barH - 4, 4);
    }
    this.heatLabel
      .setText(`TEMP: ${heatPct}%`)
      .setColor(heatPct > 75 ? '#ef4444' : heatPct > 45 ? '#fbbf24' : '#50fa7b');
  }

  onReachedIce() {
    if (this.completed) return;
    this.completed = true;
    gameState.d2DrillDepth = 100;
    gameState.d2IceDrilled = true;
    gameState.stepId = 'd2_ice_drilled';
    gameState.checkpointId = 'd2_ice_drilled';

    this.cameras.main.flash(300, 125, 211, 252);
    this.statusText.setText('SUBSURFACE ICE CORE HARVESTED!').setColor('#34d399');

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
          this.game.events.emit('d2:ice-drilled');
        }
      },
    });
  }
}
