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

    this.load.image('bg-surface', 'assets/backgrounds/mars-surface-1280.jpg');
    this.load.spritesheet('astronaut-walk', 'assets/sprites/astronaut-walk.png', {
      frameWidth: 200,
      frameHeight: 341,
    });
    this.load.spritesheet('spacecraft-damaged', 'assets/sprites/spacecraft-damaged.png', {
      frameWidth: 170,
      frameHeight: 80,
    });
    this.load.spritesheet('explosion', 'assets/sprites/explosion.png', {
      frameWidth: 100,
      frameHeight: 100,
    });
    this.load.spritesheet('radio', 'assets/sprites/radio.png', {
      frameWidth: 129,
      frameHeight: 129,
    });

    this.load.audio('bgm-main', 'assets/audio/bgm/main-theme.mp3');
    this.load.audio('sfx-airlock', 'assets/audio/sfx/airlock.wav');
    this.load.audio('sfx-footstep', 'assets/audio/sfx/footstep.wav');
    this.load.audio('sfx-radio', 'assets/audio/sfx/radio.ogg');
    this.load.audio('voice-talk', 'assets/audio/voice/talking.mp3');
  }

  create() {
    this.makePlaceholderTextures();
    this.createCutsceneAnimations();
    this.scene.start(SCENES.INTRO);
  }

  createCutsceneAnimations() {
    if (!this.anims.exists('anim-spacecraft-smoke')) {
      this.anims.create({
        key: 'anim-spacecraft-smoke',
        frames: this.anims.generateFrameNumbers('spacecraft-damaged', { start: 0, end: 5 }),
        frameRate: 6,
        repeat: -1,
      });
    }

    if (!this.anims.exists('anim-explosion')) {
      this.anims.create({
        key: 'anim-explosion',
        frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 47 }),
        frameRate: 24,
        repeat: 0,
      });
    }

    if (!this.anims.exists('anim-radio')) {
      this.anims.create({
        key: 'anim-radio',
        frames: this.anims.generateFrameNumbers('radio', { start: 0, end: 15 }),
        frameRate: 8,
        repeat: -1,
      });
    }
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
