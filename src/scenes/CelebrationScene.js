import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, HORIZON_Y, COLORS, DEPTH, LANE } from '../config/constants.js';
import { Astronaut } from '../objects/Astronaut.js';
import { DialogueBox } from '../ui/DialogueBox.js';
import { gameState } from '../state/GameState.js';

/**
 * Day 7 Ending Celebration Scene.
 * Muntasir and Maisha celebrate mastering Martian survival before the final completion card.
 */
export class CelebrationScene extends Phaser.Scene {
  constructor() {
    super(SCENES.CELEBRATION);
  }

  create() {
    this.cameras.main.fadeIn(600, 0, 0, 0);

    // Background habitat outpost interior
    if (this.textures.exists('bg-outpost')) {
      this.add.image(0, 0, 'bg-outpost').setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(DEPTH.BACKGROUND);
    }

    // Interior life-support stations cleanly rendered on the celebration stage
    const backY = LANE.top + 10;
    if (this.textures.exists('station-power')) {
      const power = this.add.image(380, backY, 'station-power').setOrigin(0.5, 1).setDepth(DEPTH.WORLD_MIN + 10);
      power.setScale(120 / power.height);
    }
    if (this.textures.exists('station-oxygen')) {
      const oxygen = this.add.image(625, backY, 'station-oxygen').setOrigin(0.5, 1).setDepth(DEPTH.WORLD_MIN + 10);
      oxygen.setScale(128 / oxygen.height);
    }
    if (this.textures.exists('station-water')) {
      const water = this.add.image(870, backY, 'station-water').setOrigin(0.5, 1).setDepth(DEPTH.WORLD_MIN + 10);
      water.setScale(96 / water.height);
    }

    // Astronauts center stage
    this.muntasir = new Astronaut(this, GAME_WIDTH / 2 - 90, LANE.top + 80, {
      name: 'Muntasir',
      color: COLORS.muntasir,
    });
    this.maisha = new Astronaut(this, GAME_WIDTH / 2 + 90, LANE.top + 80, {
      name: 'Maisha',
      color: COLORS.maisha,
    });
    this.maisha.body_.setFlipX(true);

    // Subtle celebration star sparkles
    for (let i = 0; i < 24; i++) {
      const star = this.add
        .star(
          Phaser.Math.Between(80, GAME_WIDTH - 80),
          Phaser.Math.Between(60, HORIZON_Y - 20),
          5,
          3,
          7,
          Phaser.Utils.Array.GetRandom([0xfacc15, 0x38bdf8, 0x4ade80, 0xf472b6]),
          0.9
        )
        .setDepth(DEPTH.WORLD_MIN + 20);
      this.tweens.add({
        targets: star,
        y: star.y - 24,
        alpha: 0.25,
        yoyo: true,
        repeat: -1,
        duration: Phaser.Math.Between(900, 1700),
        delay: Phaser.Math.Between(0, 700),
      });
    }

    // Cheer hops while talking
    [this.muntasir, this.maisha].forEach((actor, idx) => {
      this.tweens.add({
        targets: actor,
        y: actor.y - 16,
        duration: 420,
        yoyo: true,
        repeat: 4,
        delay: idx * 140,
        ease: 'Sine.easeOut',
      });
    });

    this.dialogueBox = new DialogueBox(this);
    this.time.delayedCall(600, () => {
      this.dialogueBox.showSequence(
        [
          {
            speaker: 'Muntasir',
            text: 'Hurray! We harvested fresh Martian crops, refilled our water and oxygen to 100%, and fortified our outdoor stations with water-bag radiation shields!',
            target: this.muntasir,
            exclamation: true,
          },
          {
            speaker: 'Maisha',
            text: 'Finally, we have figured out the complete process of survival! If we continue mining for more ice, harvesting food, and keeping track of our oxygen, water, and radiation levels every week, we can keep surviving for the next few weeks!',
            target: this.maisha,
          },
          {
            speaker: 'Muntasir',
            text: 'The rescue mission from Earth will need quite a lot of time to reach us—on the count of months—so we must properly manage every resource we have and keep our radio charged for any further storm forecasts!',
            target: this.muntasir,
          },
          {
            speaker: 'Maisha',
            text: 'Hurray! We survived 7 Sols and built a sustainable home on Mars!',
            target: this.maisha,
            exclamation: true,
          },
        ],
        () => this.showCompletionBanner()
      );
    });
  }

  showCompletionBanner() {
    if (this.scene.isActive(SCENES.HUD)) {
      this.scene.setVisible(false, SCENES.HUD);
    }
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const fadeBg = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0).setOrigin(0).setDepth(3000);
    this.tweens.add({
      targets: fadeBg,
      fillAlpha: 0.88,
      duration: 850,
    });

    const card = this.add.container(cx, cy).setDepth(3001).setAlpha(0);
    const gfx = this.add.graphics();
    gfx.fillStyle(0x0f172a, 0.97);
    gfx.fillRoundedRect(-330, -170, 660, 340, 18);
    gfx.lineStyle(3, 0xfacc15, 0.95);
    gfx.strokeRoundedRect(-330, -170, 660, 340, 18);

    const title = this.add
      .text(0, -108, 'COMPLETE! CONGRATULATIONS!', {
        fontFamily: 'monospace',
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#facc15',
      })
      .setOrigin(0.5);

    const subtitle = this.add
      .text(
        0,
        -24,
        'Muntasir & Maisha stabilized Ares Outpost across 7 Sols!\n\n' +
          '✓ Solar Arrays & Kilopower Nuclear Power Online\n' +
          '✓ Subsurface Ice Drilled: 100% Oxygen & Clean Water\n' +
          '✓ Water-Bag Radiation Shields & Solar Storm Safe Mode\n' +
          '✓ Sustainable Mars Greenhouse Harvested (NASA & CSA Data)',
        {
          fontFamily: 'monospace',
          fontSize: '13px',
          lineSpacing: 6,
          color: '#e2e8f0',
          align: 'center',
        }
      )
      .setOrigin(0.5);

    const btnBg = this.add.rectangle(0, 114, 240, 48, 0x16a34a, 1).setStrokeStyle(2, 0x86efac, 1);
    const btnTxt = this.add
      .text(0, 114, 'PLAY AGAIN', {
        fontFamily: 'monospace',
        fontSize: '17px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const btnZone = this.add
      .zone(0, 114, 240, 48)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => btnBg.setFillStyle(0x22c55e, 1))
      .on('pointerout', () => btnBg.setFillStyle(0x16a34a, 1))
      .on('pointerdown', () => {
        this.sound.stopAll();
        gameState.reset();
        this.scene.stop(SCENES.HUD);
        this.scene.start(SCENES.INTRO);
      });

    card.add([gfx, title, subtitle, btnBg, btnTxt, btnZone]);
    this.tweens.add({
      targets: card,
      alpha: 1,
      duration: 700,
      delay: 450,
    });
  }
}
