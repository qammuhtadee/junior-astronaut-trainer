import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { METER_KEYS } from '../data/meterScript.js';
import { gameState } from '../state/GameState.js';

const LABELS = { power: 'Power', oxygen: 'Oxygen', water: 'Water', radiation: 'Radiation protection' };

/**
 * Always-on overlay scene: meters, "Press SPACE" prompt, day label.
 * Runs in parallel with whichever room is active, so it survives airlock transitions.
 */
export class HudScene extends Phaser.Scene {
  constructor() {
    super(SCENES.HUD);
  }

  create() {
    const font = { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' };

    this.dayText = this.add.text(GAME_WIDTH - 20, 16, '', font).setOrigin(1, 0);
    this.meterText = this.add.text(20, 16, '', { ...font, lineSpacing: 6 });
    this.prompt = this.add
      .text(GAME_WIDTH / 2, 120, '', { ...font, fontSize: '22px', backgroundColor: '#000a', padding: { x: 12, y: 6 } })
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
    const lines = METER_KEYS.filter((k) => gameState.meters[k] !== null).map(
      (k) => `${LABELS[k]}: ${Math.round(gameState.meters[k])}%`,
    );
    this.meterText.setText(lines.join('\n'));
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
