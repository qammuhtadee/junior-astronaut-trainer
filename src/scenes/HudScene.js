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
}
