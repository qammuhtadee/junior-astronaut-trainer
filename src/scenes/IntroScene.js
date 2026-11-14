import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

/**
 * Opening screen on a dark background where lines transition one by one as the player taps.
 * 1: "This is Seven Sols."
 * 2: "Something unexpected has just happened!"
 * 3: Fades into the Mars surface crash scene.
 */
export class IntroScene extends Phaser.Scene {
  constructor() {
    super(SCENES.INTRO);
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Dark background
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x050811).setOrigin(0);

    // Subtle stars
    const starsGfx = this.add.graphics();
    starsGfx.fillStyle(0xffffff, 0.55);
    for (let i = 0; i < 55; i++) {
      starsGfx.fillCircle(
        Phaser.Math.Between(20, GAME_WIDTH - 20),
        Phaser.Math.Between(20, GAME_HEIGHT - 20),
        Phaser.Math.Between(1, 2)
      );
    }

    this.lines = [
      { text: 'This is Seven Sols.', color: '#f8fafc', size: '28px' },
      { text: 'Something unexpected has just happened!', color: '#ffd166', size: '24px' },
    ];
    this.lineIndex = 0;
    this.transitioning = false;

    this.centerText = this.add
      .text(cx, cy - 10, '', {
        fontFamily: 'monospace',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#f8fafc',
        align: 'center',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.promptText = this.add
      .text(cx, GAME_HEIGHT - 90, 'Tap or press SPACE to continue', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: this.promptText,
      alpha: { from: 0.3, to: 1 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.showLine(0);

    const advance = () => {
      if (this.transitioning) return;
      this.lineIndex++;
      if (this.lineIndex < this.lines.length) {
        this.showLine(this.lineIndex);
      } else {
        this.startMainScene();
      }
    };

    this.input.on('pointerdown', advance);
    this.input.keyboard.on('keydown-SPACE', advance);
  }

  showLine(idx) {
    this.transitioning = true;
    const item = this.lines[idx];

    this.tweens.add({
      targets: this.centerText,
      alpha: 0,
      duration: idx === 0 ? 10 : 280,
      onComplete: () => {
        this.centerText.setText(item.text);
        this.centerText.setColor(item.color);
        this.centerText.setFontSize(item.size);
        this.centerText.setY(GAME_HEIGHT / 2 + 8);

        this.tweens.add({
          targets: this.centerText,
          alpha: 1,
          y: GAME_HEIGHT / 2 - 10,
          duration: 450,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            this.transitioning = false;
          },
        });
      },
    });
  }

  startMainScene() {
    this.transitioning = true;
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SCENES.SURFACE, { isCrashIntro: true });
      this.scene.launch(SCENES.HUD);
    });
  }
}
