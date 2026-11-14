import Phaser from 'phaser';
import { RoomScene } from './RoomScene.js';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, HORIZON_Y, DEPTH, COLORS, LANE } from '../config/constants.js';
import { Astronaut } from '../objects/Astronaut.js';
import { gameState } from '../state/GameState.js';
import { DialogueBox } from '../ui/DialogueBox.js';

/**
 * Inside the Outpost habitat.
 * Matches the Day 1 darkness vignette, progressive equipment introduction,
 * lighting restoration, night battery drain, and bunk rest sequence 1-to-1.
 */
export class OutpostScene extends RoomScene {
  constructor() {
    super(SCENES.OUTPOST, 'outpost');
  }

  create(data = {}) {
    super.create(data);

    this.dialogueBox = new DialogueBox(this);

    // Setup full-screen darkness & vignette around astronauts
    this.initDarkness();

    const powerStation = this.stations.find((s) => s.def.id === 'power_panel');
    const bedStation = this.stations.find((s) => s.def.id === 'bed');

    if (gameState.day === 1) {
      if (!gameState.solarDeployed) {
        // Visit 1: Pitch dark, no power panel or bunks visible yet
        if (powerStation) powerStation.setVisible(false);
        if (bedStation) bedStation.setVisible(false);
        this.initFirstDarkVisit();
      } else {
        // Visit 2+: Power restored outside; allow toggling lights freely inside
        if (powerStation) powerStation.setVisible(true);
        if (bedStation) bedStation.setVisible(gameState.habLightsOn || gameState.lightsIntroDone);
        this.initPowerRestoredVisit();
      }
    } else {
      this.initStandardOutpost();
    }

    this.game.events.on('lights:restored', this.onLightsRestored, this);
    this.game.events.on('lights:turned-off', this.onLightsTurnedOff, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('lights:restored', this.onLightsRestored, this);
      this.game.events.off('lights:turned-off', this.onLightsTurnedOff, this);
      if (this.drainTimer) this.drainTimer.remove();
    });
  }

  drawBackground() {
    this.add.rectangle(0, 0, GAME_WIDTH, HORIZON_Y, 0x3b3f4a).setOrigin(0).setDepth(DEPTH.BACKGROUND);
    this.add
      .rectangle(0, HORIZON_Y, GAME_WIDTH, GAME_HEIGHT - HORIZON_Y, 0x5a5048)
      .setOrigin(0)
      .setDepth(DEPTH.BACKGROUND);
  }

  initDarkness() {
    if (!this.textures.exists('spotlight-grad')) {
      const canvas = this.textures.createCanvas('spotlight-grad', 300, 300);
      const ctx = canvas.getContext();
      const grad = ctx.createRadialGradient(150, 150, 25, 150, 150, 150);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.65)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(150, 150, 150, 0, Math.PI * 2);
      ctx.fill();
      canvas.refresh();
    }

    this.spotlightImg = this.make.image({ key: 'spotlight-grad', add: false }).setOrigin(0.5, 0.5);

    // Crucial: setOrigin(0, 0) so the RenderTexture covers the entire 1280x720 room
    this.darknessLayer = this.add
      .renderTexture(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .setOrigin(0, 0)
      .setDepth(800);

    if (gameState.habLightsOn || gameState.day > 1) {
      this.darknessLayer.setVisible(false);
    }
  }

  update(time, delta) {
    super.update(time, delta);

    if (this.darknessLayer && this.darknessLayer.visible && !gameState.habLightsOn) {
      const px = this.player?.active ? Math.round(this.player.x) : -1;
      const py = this.player?.active ? Math.round(this.player.y) : -1;
      const cx = this.companion?.active ? Math.round(this.companion.x) : -1;
      const cy = this.companion?.active ? Math.round(this.companion.y) : -1;
      const darkKey = `${px},${py},${cx},${cy},${gameState.solarDeployed}`;
      if (this.lastDarkKey === darkKey) return;
      this.lastDarkKey = darkKey;
      this.redrawDarkness();
    }
  }

  redrawDarkness() {
    if (!this.darknessLayer) return;
    this.darknessLayer.clear();
    this.darknessLayer.fill(0x03050a, 0.96);

    if (this.player && this.player.active) {
      this.darknessLayer.erase(this.spotlightImg, this.player.x, this.player.y - 50);
    }
    if (this.companion && this.companion.active) {
      this.darknessLayer.erase(this.spotlightImg, this.companion.x, this.companion.y - 50);
    }
    if (gameState.solarDeployed) {
      const pp = this.stations.find((s) => s.def.id === 'power_panel');
      if (pp && pp.visible) {
        this.darknessLayer.erase(this.spotlightImg, pp.def.x, pp.def.y - 60);
      }
    }
  }

  // ==========================================
  // VISIT 1: Dark Outpost (No power yet)
  // ==========================================
  initFirstDarkVisit() {
    // Maisha stands near the airlock, Muntasir has player control
    this.companion = new Astronaut(this, 185, LANE.top + 42, {
      name: 'Maisha',
      color: COLORS.maisha,
    });
    this.companion.body_.setFlipX(true);

    if (!gameState.visitedDarkOutpost) {
      gameState.visitedDarkOutpost = true;
      this.transitioning = true;

      this.time.delayedCall(350, () => {
        this.dialogueBox.showSequence(
          [
            {
              speaker: 'Maisha',
              text: "Seems like we don't have any power or lights, we should do something about it. Let's get out.",
              target: this.companion,
            },
          ],
          () => {
            this.transitioning = false;
            this.game.events.emit('prompt', 'Airlock');
          }
        );
      });
    }
  }

  // ==========================================
  // VISIT 2+: Power Restored Outside, Independent Lights
  // ==========================================
  initPowerRestoredVisit() {
    // Only spawn Muntasir near the airlock if he hasn't walked to rest on the bunks yet
    if (!gameState.muntasirResting) {
      this.companion = new Astronaut(this, 175, LANE.top + 42, {
        name: 'Muntasir',
        color: COLORS.muntasir,
      });
      this.companion.body_.setFlipX(false);
    }

    if (!gameState.lightsIntroDone && !gameState.habLightsOn) {
      this.createPowerPanelGuide();
    }

    if (this.darknessLayer) {
      this.darknessLayer.setVisible(!gameState.habLightsOn);
      this.darknessLayer.setAlpha(gameState.habLightsOn ? 0 : 1);
      this.lastDarkKey = null;
    }

    if (gameState.lightsIntroDone) {
      this.startNightDrain();
    }
  }

  createPowerPanelGuide() {
    const pp = this.stations.find((s) => s.def.id === 'power_panel');
    if (!pp) return;

    // Highlight box around the power panel
    this.powerHighlight = this.add.graphics().setDepth(850);
    this.powerHighlight.lineStyle(3, 0xffd166, 0.95);
    this.powerHighlight.strokeRect(
      pp.def.x - pp.def.w / 2 - 6,
      pp.def.y - pp.def.h - 6,
      pp.def.w + 12,
      pp.def.h + 12
    );

    // Indication arrow of turning on the lights
    this.powerGuide = this.add.container(pp.def.x, pp.def.y - pp.def.h - 32).setDepth(900);
    const label = this.add
      .text(0, -22, 'Turn on lights', {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        backgroundColor: '#f59e0b',
        color: '#0f172a',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5);

    const arrow = this.add
      .text(0, 2, '▼', {
        fontFamily: 'monospace',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ffd166',
      })
      .setOrigin(0.5);

    this.powerGuide.add([label, arrow]);

    this.tweens.add({
      targets: this.powerGuide,
      y: pp.def.y - pp.def.h - 46,
      duration: 550,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  onLightsRestored() {
    if (this.powerGuide) {
      this.powerGuide.destroy();
      this.powerGuide = null;
    }
    if (this.powerHighlight) {
      this.powerHighlight.destroy();
      this.powerHighlight = null;
    }

    // Reveal the bunks now that the room is lit
    const bedStation = this.stations.find((s) => s.def.id === 'bed');
    if (bedStation) bedStation.setVisible(true);

    // Outpost lights up!
    this.cameras.main.flash(350, 255, 245, 210);
    if (this.darknessLayer) {
      this.tweens.killTweensOf(this.darknessLayer);
      this.tweens.add({
        targets: this.darknessLayer,
        alpha: 0,
        duration: 500,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          this.darknessLayer.setVisible(false);
        },
      });
    }

    if (!gameState.lightsIntroDone) {
      gameState.lightsIntroDone = true;
      gameState.muntasirResting = true;
      this.transitioning = true;
      this.game.events.emit('prompt', null);

      this.time.delayedCall(500, () => {
        this.dialogueBox.showSequence(
          [
            {
              speaker: 'Muntasir',
              text: 'Hurray. We can finally see.',
              target: this.companion,
            },
            {
              speaker: 'Maisha',
              text: "It's night-time, and seems like the battery isn't charging.",
              target: this.player,
              onStart: () => {
                this.startNightDrain();
              },
            },
            {
              speaker: 'Muntasir',
              text: 'At night there is no sun, so there is no natural light for the solar panels to be powered up, we have to be careful about energy consumption soon.',
              target: this.companion,
              onStart: () => {
                this.game.events.emit(
                  'fact:show',
                  'Fact: Mars surface has about 43% light level of earth, so its also harder for solar panels to recharge there'
                );
              },
            },
            {
              speaker: 'Muntasir',
              text: "Seems like we are both tired. Let's have some rest on our bunks.",
              target: this.companion,
            },
          ],
          () => {
            this.muntasirRestAtBunks();
          }
        );
      });
    } else {
      this.transitioning = false;
      this.game.events.emit('toast', 'Habitat lights online.');
    }
  }

  onLightsTurnedOff(payload = {}) {
    if (this.darknessLayer) {
      this.tweens.killTweensOf(this.darknessLayer);
      this.darknessLayer.setVisible(true).setAlpha(1);
      this.lastDarkKey = null;
      this.redrawDarkness();
    }

    if (!payload?.silentWarning) {
      this.game.events.emit(
        'warning:show',
        "You can't navigate around without lights! Turn on the lights at the Power Panel or rewind to the checkpoint."
      );
    }
  }

  startNightDrain() {
    this.game.events.emit('power:start-night-drain');
  }

  muntasirRestAtBunks() {
    // Immediately restore player control to Maisha so she can move freely while Muntasir approaches the bunk!
    this.transitioning = false;

    if (!this.companion) {
      return;
    }

    const bunkX = GAME_WIDTH - 140;
    const bunkY = LANE.top + 15;

    // Muntasir walks behind the bunks autonomously and disappears
    this.walkActorTo(this.companion, bunkX, bunkY, 320, () => {
      this.tweens.add({
        targets: this.companion,
        alpha: 0,
        duration: 350,
        onComplete: () => {
          if (this.companion) {
            this.companion.destroy();
            this.companion = null;
          }
        },
      });
    });
  }

  initStandardOutpost() {
    if (this.darknessLayer) this.darknessLayer.setVisible(false);
    if (gameState.activeAstronaut === 'muntasir') {
      this.companion = new Astronaut(this, GAME_WIDTH - 220, 440, {
        name: 'Maisha',
        color: COLORS.maisha,
      });
      this.companion.body_.setFlipX(true);
    }
  }

  // ==========================================
  // HELPER: Autonomous Actor Movement
  // ==========================================
  walkActorTo(actor, targetX, targetY, speed = 320, onComplete) {
    if (!actor || !actor.active || !actor.body_) return;

    const dx = targetX - actor.x;
    const dy = targetY - actor.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const duration = Math.max(100, (dist / speed) * 1000);

    actor.isAutoWalking = true;
    actor.body_.setFlipX(dx < 0);
    actor.body_.play('walk', true);

    this.tweens.add({
      targets: actor,
      x: targetX,
      y: targetY,
      duration,
      ease: 'Linear',
      onUpdate: () => {
        if (actor && actor.active) actor.syncDepth();
      },
      onComplete: () => {
        if (actor && actor.active && actor.body_) {
          actor.isAutoWalking = false;
          actor.body_.stop();
          actor.body_.setFrame(0);
        }
        if (onComplete) onComplete();
      },
    });
  }
}
