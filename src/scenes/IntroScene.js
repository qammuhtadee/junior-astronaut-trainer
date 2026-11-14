import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

/**
 * Atmospheric opening cutscene on dark background.
 * Presents introductory prologue text before the crash-landing on Mars.
 */
export class IntroScene extends Phaser.Scene {
  constructor() {
    super(SCENES.INTRO);
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Dark deep-space background
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x050811).setOrigin(0);

    // Subtle twinkling stars
    const starsGfx = this.add.graphics();
    starsGfx.fillStyle(0xffffff, 0.7);
    for (let i = 0; i < 60; i++) {
      const sx = Phaser.Math.Between(20, GAME_WIDTH - 20);
      const sy = Phaser.Math.Between(20, GAME_HEIGHT - 20);
      const sr = Phaser.Math.Between(1, 2);
      starsGfx.fillCircle(sx, sy, sr);
    }

    // Vignette edges
    const vignette = this.add.graphics();
    vignette.fillStyle(0x000000, 0.5);
    vignette.fillRect(0, 0, GAME_WIDTH, 60);
    vignette.fillRect(0, GAME_HEIGHT - 60, GAME_WIDTH, 60);

    // Title banner
    const titleText = this.add
      .text(cx, cy - 110, 'STRANDED ON MARS', {
        fontFamily: 'monospace',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#f97316',
        letterSpacing: 4,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Prologue lines
    const line1 = this.add
      .text(cx, cy - 30, 'This is Seven Sols.', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#f8fafc',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const line2 = this.add
      .text(cx, cy + 25, 'Something unexpected has just happened!', {
        fontFamily: 'monospace',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ef4444',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const promptText = this.add
      .text(cx, cy + 130, '▶ TAP ANYWHERE OR PRESS SPACE TO START', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#ffd166',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Pulsing prompt
    this.tweens.add({
      targets: promptText,
      alpha: { from: 0.2, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Sequence transition
    this.tweens.add({
      targets: titleText,
      alpha: 1,
      y: cy - 100,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.time.delayedCall(400, () => {
          this.tweens.add({
            targets: line1,
            alpha: 1,
            duration: 600,
            ease: 'Cubic.easeOut',
            onComplete: () => {
              this.time.delayedCall(500, () => {
                this.tweens.add({
                  targets: line2,
                  alpha: 1,
                  scale: { from: 0.9, to: 1 },
                  duration: 600,
                  ease: 'Back.easeOut',
                  onComplete: () => {
                    this.canStart = true;
                    promptText.setAlpha(1);
                  },
                });
              });
            },
          });
        });
      },
    });

    // Fast-start on tap/press if clicked early
    const startMission = () => {
      if (this.started) return;
      this.started = true;
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start(SCENES.SURFACE, { isCrashIntro: true });
        this.scene.launch(SCENES.HUD);
      });
    };

    this.input.on('pointerdown', startMission);
    this.input.keyboard.on('keydown-SPACE', startMission);
  }
}
