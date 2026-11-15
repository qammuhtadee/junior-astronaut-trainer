import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { gameState } from '../state/GameState.js';

/**
 * Clean Main Menu followed by the two-line Sol 1 opening transition.
 * Menu buttons: PLAY (functional), ABOUT GAME (placeholder), CREDITS (placeholder).
 */
export class IntroScene extends Phaser.Scene {
  constructor() {
    super(SCENES.INTRO);
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.stopAllAudioChannels();

    // Dark starfield background
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x050811).setOrigin(0);

    const starsGfx = this.add.graphics();
    starsGfx.fillStyle(0xffffff, 0.55);
    for (let i = 0; i < 65; i++) {
      starsGfx.fillCircle(
        Phaser.Math.Between(20, GAME_WIDTH - 20),
        Phaser.Math.Between(20, GAME_HEIGHT - 20),
        Phaser.Math.Between(1, 2)
      );
    }

    // Subtle Martian horizon glow
    const horizon = this.add.graphics();
    horizon.fillStyle(0x7c2d12, 0.35);
    horizon.fillEllipse(cx, GAME_HEIGHT + 90, GAME_WIDTH * 1.35, 340);

    this.menuContainer = this.add.container(cx, cy);

    const titleText = this.add
      .text(0, -148, 'SEVEN SOLS', {
        fontFamily: 'monospace',
        fontSize: '46px',
        fontStyle: 'bold',
        color: '#f8fafc',
      })
      .setOrigin(0.5);

    const subtitleText = this.add
      .text(0, -100, 'Stranded on Mars — Junior Astronaut Adventure', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#ffd166',
      })
      .setOrigin(0.5);

    this.menuContainer.add([titleText, subtitleText]);

    const menuButtons = [
      { label: 'PLAY', y: -8, fill: 0x16a34a, stroke: 0x86efac, textCol: '#ffffff', onClick: () => this.onPlayClicked() },
      { label: 'ABOUT GAME', y: 66, fill: 0x1e293b, stroke: 0x475569, textCol: '#cbd5e1', onClick: null },
      { label: 'CREDITS', y: 140, fill: 0x1e293b, stroke: 0x475569, textCol: '#cbd5e1', onClick: null },
    ];

    menuButtons.forEach((btn) => {
      const bg = this.add.rectangle(0, btn.y, 260, 52, btn.fill, 1).setStrokeStyle(2, btn.stroke, 1);
      const txt = this.add
        .text(0, btn.y, btn.label, {
          fontFamily: 'monospace',
          fontSize: '19px',
          fontStyle: 'bold',
          color: btn.textCol,
        })
        .setOrigin(0.5);

      const zone = this.add
        .zone(0, btn.y, 260, 52)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          bg.setScale(1.03);
          txt.setScale(1.03);
        })
        .on('pointerout', () => {
          bg.setScale(1);
          txt.setScale(1);
        })
        .on('pointerdown', () => {
          this.ensureMenuBgmPlaying();
          if (btn.onClick) btn.onClick();
        });

      this.menuContainer.add([bg, txt, zone]);
    });

    // Intro narration state (activated after clicking PLAY)
    this.inStoryIntro = false;
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
      .setAlpha(0)
      .setVisible(false);

    this.promptText = this.add
      .text(cx, GAME_HEIGHT - 90, 'Tap or press SPACE to continue', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#94a3b8',
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.ensureMenuBgmPlaying();

    const advance = () => {
      if (!this.inStoryIntro || this.transitioning) return;
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

  stopAllAudioChannels() {
    ['bgm-main', 'bgm-day1', 'bgm-day2', 'bgm-day3', 'bgm-day4', 'sfx-storm'].forEach((k) => {
      const s = this.sound.get(k);
      if (s) {
        if (s.isPlaying) s.stop();
        this.sound.remove(s);
      }
    });
  }

  ensureMenuBgmPlaying() {
    const key = 'bgm-main';
    if (!this.cache.audio.exists(key)) return;
    const vol = gameState.getEffectiveVolume('music', 0.35);
    if (vol <= 0) return;
    let existing = this.sound.get(key);
    if (existing && (existing.pendingRemove || !existing.currentConfig)) {
      this.sound.remove(existing);
      existing = null;
    }
    if (existing) {
      if (!existing.isPlaying) existing.play({ loop: false, volume: vol });
      else existing.setVolume(vol);
      return;
    }
    this.sound.add(key, { loop: false, volume: vol }).play();
  }

  onPlayClicked() {
    if (this.inStoryIntro || this.transitioning) return;
    this.inStoryIntro = true;
    this.transitioning = true;

    this.tweens.add({
      targets: this.menuContainer,
      alpha: 0,
      duration: 280,
      onComplete: () => {
        this.menuContainer.setVisible(false);
        this.centerText.setVisible(true);
        this.promptText.setVisible(true);
        this.tweens.add({
          targets: this.promptText,
          alpha: { from: 0.3, to: 1 },
          duration: 700,
          yoyo: true,
          repeat: -1,
        });
        this.showLine(0);
      },
    });
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
    // Stop menu music cleanly before starting Day 1 gameplay
    this.stopAllAudioChannels();
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SCENES.SURFACE, { isCrashIntro: true });
      this.scene.launch(SCENES.HUD);
    });
  }
}
