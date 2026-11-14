import Phaser from 'phaser';
import { SCENES } from '../config/constants.js';

/** Loads every asset once, then hands off. Scenes never call this.load themselves. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PRELOAD);
  }

  preload() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    // 1. Mars Mission Loading Backdrop
    this.add.rectangle(0, 0, width, height, 0x070a12).setOrigin(0);

    // Starfield
    const stars = this.add.graphics();
    stars.fillStyle(0xffffff, 0.7);
    for (let i = 0; i < 85; i++) {
      stars.fillCircle(
        Phaser.Math.Between(16, width - 16),
        Phaser.Math.Between(16, Math.round(height * 0.7)),
        Phaser.Math.Between(1, 2)
      );
    }

    // Martian horizon glow at bottom
    const horizon = this.add.graphics();
    horizon.fillStyle(0x7c2d12, 0.35);
    horizon.fillEllipse(cx, height + 80, width * 1.35, 360);
    horizon.fillStyle(0x9a3412, 0.25);
    horizon.fillEllipse(cx, height + 110, width * 1.15, 290);
    horizon.lineStyle(2, 0xf97316, 0.45);
    horizon.lineBetween(80, height - 56, width - 80, height - 56);

    // Outer telemetry frame corners
    const frame = this.add.graphics();
    frame.lineStyle(2, 0x38bdf8, 0.55);
    const m = 34;
    const arm = 26;
    frame.lineBetween(m, m + arm, m, m).lineBetween(m, m, m + arm, m);
    frame.lineBetween(width - m - arm, m, width - m, m).lineBetween(width - m, m, width - m, m + arm);
    frame.lineBetween(m, height - m - arm, m, height - m).lineBetween(m, height - m, m + arm, height - m);
    frame.lineBetween(width - m - arm, height - m, width - m, height - m).lineBetween(width - m, height - m, width - m, height - m - arm);

    // Title Banner & Subtitle
    this.add
      .text(cx, cy - 115, 'STRANDED ON MARS: SEVEN SOLS', {
        fontFamily: 'monospace',
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#f8fafc',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 72, 'JUNIOR ASTRONAUT MISSION TRAINER  //  SOL Telemetry Boot', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#38bdf8',
      })
      .setOrigin(0.5);

    // Loading Bar Track
    const barW = 440;
    const barH = 22;
    const barX = cx - barW / 2;
    const barY = cy + 6;

    const track = this.add.graphics();
    track.fillStyle(0x111827, 0.95);
    track.fillRoundedRect(barX, barY, barW, barH, 11);
    track.lineStyle(2, 0x334155, 1);
    track.strokeRoundedRect(barX, barY, barW, barH, 11);

    const fill = this.add.graphics();

    const pctText = this.add
      .text(cx, barY + barH + 22, '0%', {
        fontFamily: 'monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffd166',
      })
      .setOrigin(0.5);

    const statusText = this.add
      .text(cx, barY - 22, 'INITIALIZING MISSION TELEMETRY...', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    this.load.on('progress', (p) => {
      const pct = Math.round(p * 100);
      fill.clear();
      const innerW = Math.max(12, (barW - 8) * p);
      if (p > 0) {
        fill.fillStyle(0xf59e0b, 1);
        fill.fillRoundedRect(barX + 4, barY + 4, innerW, barH - 8, 7);
        fill.fillStyle(0xfef08a, 0.45);
        fill.fillRoundedRect(barX + 6, barY + 5, Math.max(4, innerW - 4), 4, 2);
      }
      pctText.setText(`${pct}%`);
      if (p < 0.35) statusText.setText('INITIALIZING MISSION TELEMETRY...');
      else if (p < 0.7) statusText.setText('LOADING MARTIAN TERRAIN & OUTPOST...');
      else if (p < 0.98) statusText.setText('BOOTING LIFE SUPPORT AUDIO...');
      else statusText.setText('SYSTEMS READY');
    });

    this.load.image('bg-surface', 'assets/backgrounds/mars-surface-1280.jpg');
    this.load.image('bg-outpost', 'assets/backgrounds/outpost-interior.jpg');
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
