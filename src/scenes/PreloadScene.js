import Phaser from 'phaser';
import { SCENES } from '../config/constants.js';

/** Loads every asset once, then hands off. Scenes never call this.load themselves. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PRELOAD);
  }

  preload() {
    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2 - 200, height / 2, 0, 16, 0xffffff).setOrigin(0, 0.5);
    this.load.on('progress', (p) => (bar.width = 400 * p));

    this.load.image('bg-surface', 'assets/backgrounds/mars-surface.jpg');
  }

  create() {
    this.makePlaceholderTextures();
    this.scene.start(SCENES.OUTPOST);
    this.scene.launch(SCENES.HUD);
  }

  /** White astronaut silhouette; tinted per character. Replace with the real sprite sheet. */
  makePlaceholderTextures() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xffffff).fillRoundedRect(8, 0, 32, 30, 10); // helmet
    g.fillStyle(0x222233).fillRect(14, 8, 20, 12); // visor
    g.fillStyle(0xffffff).fillRoundedRect(4, 30, 40, 44, 8); // suit
    g.fillRect(8, 74, 14, 22).fillRect(26, 74, 14, 22); // legs
    g.generateTexture('astronaut-placeholder', 48, 96);
    g.destroy();
  }
}
