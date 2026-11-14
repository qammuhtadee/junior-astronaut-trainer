import Phaser from 'phaser';
import { RoomScene } from './RoomScene.js';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, HORIZON_Y, DEPTH, COLORS, LANE } from '../config/constants.js';
import { Astronaut } from '../objects/Astronaut.js';
import { gameState } from '../state/GameState.js';
import { DialogueBox } from '../ui/DialogueBox.js';

/**
 * Inside the Outpost habitat.
 * Features:
 * - Dynamic darkness simulation and astronaut spotlight vignette before lights turn on.
 * - Dialogue sequence on first visit ("no power or lights, let's get out").
 * - Power restoration event: turning on Hab Lighting clears darkness and drops power to 90%.
 * - Real-time night battery drain (1% per 10 seconds).
 * - Companion autonomous bed rest and transition to Day 2.
 */
export class OutpostScene extends RoomScene {
  constructor() {
    super(SCENES.OUTPOST, 'outpost');
  }

  create(data = {}) {
    super.create(data);

    this.dialogueBox = new DialogueBox(this);

    // Setup Darkness & Spotlight vignette
    this.initDarkness();

    // Check narrative phase on Day 1
    if (gameState.day === 1) {
      if (!gameState.solarDeployed) {
        this.initFirstDarkVisit();
      } else if (!gameState.habLightsOn) {
        this.initPowerRestoredDarkVisit();
      } else {
        this.initLitOutpost();
      }
    } else {
      this.initStandardOutpost();
    }

    // Listen for breaker toggle event from PowerPanelTask
    this.game.events.on('lights:restored', this.onLightsRestored, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('lights:restored', this.onLightsRestored, this);
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
    // Generate radial gradient spotlight texture if it doesn't already exist
    if (!this.textures.exists('spotlight-grad')) {
      const canvas = this.textures.createCanvas('spotlight-grad', 280, 280);
      const ctx = canvas.getContext();
      const grad = ctx.createRadialGradient(140, 140, 25, 140, 140, 140);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(140, 140, 140, 0, Math.PI * 2);
      ctx.fill();
      canvas.refresh();
    }

    this.spotlightImg = this.make.image({ key: 'spotlight-grad', add: false });

    // Darkness layer covering the habitat
    this.darknessLayer = this.add.renderTexture(0, 0, GAME_WIDTH, GAME_HEIGHT).setDepth(800);

    if (gameState.habLightsOn) {
      this.darknessLayer.setVisible(false);
    }
  }

  update(time, delta) {
    super.update(time, delta);

    // Update dynamic flashlight spotlight while outpost is unlit
    if (this.darknessLayer && this.darknessLayer.visible && !gameState.habLightsOn) {
      this.darknessLayer.clear();
      this.darknessLayer.fill(0x060912, 0.93);

      if (this.player && this.player.active) {
        this.darknessLayer.erase(this.spotlightImg, this.player.x, this.player.y);
      }
      if (this.companion && this.companion.active) {
        this.darknessLayer.erase(this.spotlightImg, this.companion.x, this.companion.y);
      }
    }
  }

  // ==========================================
  // PHASE 1: First Dark Visit (No power yet)
  // ==========================================
  initFirstDarkVisit() {
    // Muntasir has control
    // Maisha stands near the airlock
    this.companion = new Astronaut(this, 170, LANE.top + 35, {
      name: 'Maisha',
      color: COLORS.maisha,
    });
    this.companion.body_.setFlipX(false);

    this.time.delayedCall(400, () => {
      this.dialogueBox.showSequence(
        [
          {
            speaker: 'Maisha',
            text: "Seems like we don't have any power or lights, we should do something about it. Let's get out.",
            target: this.companion,
          },
        ],
        () => {
          this.game.events.emit('prompt', 'Airlock');
        }
      );
    });
  }

  // ==========================================
  // PHASE 2: Power Restored Visit (Turn on lights)
  // ==========================================
  initPowerRestoredDarkVisit() {
    // Control is Maisha, Muntasir on standby
    this.companion = new Astronaut(this, 160, LANE.top + 35, {
      name: 'Muntasir',
      color: COLORS.muntasir,
    });
    this.companion.body_.setFlipX(false);

    // Highlight power panel station
    this.createPowerPanelGuide();
  }

  createPowerPanelGuide() {
    const pp = this.stations.find((s) => s.def.id === 'power_panel');
    if (!pp) return;

    this.powerGuide = this.add.container(pp.def.x, pp.def.y - 70).setDepth(900);
    const arrow = this.add
      .text(0, 0, '▼ TURN ON LIGHTS', {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        backgroundColor: '#f59e0b',
        color: '#0f172a',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5);
    this.powerGuide.add(arrow);

    this.tweens.add({
      targets: this.powerGuide,
      y: pp.def.y - 82,
      duration: 600,
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

    // Flash and dissolve darkness
    this.cameras.main.flash(400, 255, 240, 200);

    if (this.darknessLayer) {
      this.tweens.add({
        targets: this.darknessLayer,
        alpha: 0,
        duration: 700,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          this.darknessLayer.setVisible(false);
        },
      });
    }

    // Dialogue sequence after lights are on
    this.time.delayedCall(600, () => {
      this.dialogueBox.showSequence(
        [
          {
            speaker: 'Muntasir',
            text: 'Hurray! We can finally see.',
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
                "Fact: Mars surface receives only about 43% of Earth's sunlight due to distance from the Sun. At night, solar panels harvest no energy, making night battery management critical."
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
  }

  startNightDrain() {
    if (this.drainTimer) return;
    // Meter drops by 1% every 10 seconds
    this.drainTimer = this.time.addEvent({
      delay: 10000,
      loop: true,
      callback: () => {
        if (gameState.meters.power > 10) {
          gameState.setMeters({ power: gameState.meters.power - 1 });
        }
      },
    });
  }

  muntasirRestAtBunks() {
    if (!this.companion) return;

    const bunkX = GAME_WIDTH - 140;
    const bunkY = LANE.top + 20;

    // Muntasir walks autonomously over to the bunks and rests (speed: 300)
    this.walkActorTo(this.companion, bunkX - 20, bunkY, 300, () => {
      // Disappear behind bunks
      this.tweens.add({
        targets: this.companion,
        alpha: 0,
        duration: 400,
        onComplete: () => {
          this.companion.destroy();
          this.companion = null;
        },
      });

      // Guide player to bunks to end Day 1
      this.createBedGuide();
    });
  }

  createBedGuide() {
    const bed = this.stations.find((s) => s.def.id === 'bed');
    if (!bed) return;

    this.bedGuide = this.add.container(bed.def.x, bed.def.y - 65).setDepth(300);
    const arrow = this.add
      .text(0, 0, '▼ REST FOR THE NIGHT (SPACE)', {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        backgroundColor: '#7a6a9a',
        color: '#ffffff',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5);
    this.bedGuide.add(arrow);

    this.tweens.add({
      targets: this.bedGuide,
      y: bed.def.y - 75,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  initLitOutpost() {
    // Normal lit room state
    if (this.darknessLayer) this.darknessLayer.setVisible(false);
    this.initStandardOutpost();
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
  // HELPER: Autonomous Movement
  // ==========================================
  walkActorTo(actor, targetX, targetY, speed = 300, onComplete) {
    if (!actor || !actor.active || !actor.body_) return;

    const dx = targetX - actor.x;
    const dy = targetY - actor.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const duration = (dist / speed) * 1000;

    actor.body_.setFlipX(dx < 0);
    actor.body_.play('walk', true);

    this.tweens.add({
      targets: actor,
      x: targetX,
      y: targetY,
      duration,
      ease: 'Linear',
      onComplete: () => {
        if (actor && actor.active && actor.body_) {
          actor.body_.stop();
          actor.body_.setFrame(0);
        }
        if (onComplete) onComplete();
      },
    });
  }
}
