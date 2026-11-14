import Phaser from 'phaser';
import { RoomScene } from './RoomScene.js';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, DEPTH, COLORS, LANE } from '../config/constants.js';
import { Astronaut } from '../objects/Astronaut.js';
import { gameState } from '../state/GameState.js';
import { DialogueBox } from '../ui/DialogueBox.js';

/**
 * Surface Scene: Martian terrain outside the outpost.
 * Handles the cinematic crash landing, autonomous walks, dialogues, and solar panel construction.
 */
export class SurfaceScene extends RoomScene {
  constructor() {
    super(SCENES.SURFACE, 'surface');
  }

  create(data = {}) {
    super.create(data);

    this.dialogueBox = new DialogueBox(this);

    const isCrashIntro = data.isCrashIntro || (!gameState.hasSeenCrash && gameState.day === 1);

    if (isCrashIntro) {
      this.initCrashCutscene();
    } else {
      // Normal surface visit
      this.initSurfacePostCrash();
    }
  }

  drawBackground() {
    this.add.image(0, 0, 'bg-surface').setOrigin(0).setDepth(DEPTH.BACKGROUND);
  }

  // ==========================================
  // DAY 1 CRASH CUTSCENE
  // ==========================================
  initCrashCutscene() {
    this.transitioning = true;
    this.player.setVisible(false);

    // Hide stations until crash and reveal sequence completes
    this.stations.forEach((s) => s.setVisible(false));

    // Spacecraft starting diagonally off-screen top-left
    this.spacecraft = this.add
      .sprite(-140, 160, 'spacecraft-damaged', 0)
      .setScale(1.25)
      .setRotation(Phaser.Math.DegToRad(18))
      .setDepth(150);

    // Diagonal descent into Mars soil
    this.tweens.add({
      targets: this.spacecraft,
      x: 180,
      y: 530,
      rotation: 0,
      duration: 850,
      ease: 'Quad.easeIn',
      onComplete: () => {
        // Impact vibration
        this.cameras.main.shake(650, 0.016);

        // Multi-frame explosion sprite
        const explosion = this.add.sprite(150, 520, 'explosion', 0).setScale(1.4).setDepth(160);
        explosion.play('anim-explosion');
        explosion.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => explosion.destroy());

        // Horizontal skid and deceleration
        this.tweens.add({
          targets: this.spacecraft,
          x: 230,
          duration: 650,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            this.spacecraft.play('anim-spacecraft-smoke');
            this.time.delayedCall(700, () => this.popOutAstronauts());
          },
        });
      },
    });
  }

  popOutAstronauts() {
    // Both astronauts pop out from behind the spacecraft
    this.muntasirActor = new Astronaut(this, 220, 505, {
      name: 'Muntasir',
      color: COLORS.muntasir,
    });
    this.muntasirActor.setScale(0).setDepth(140);

    this.maishaActor = new Astronaut(this, 185, 505, {
      name: 'Maisha',
      color: COLORS.maisha,
    });
    this.maishaActor.setScale(0).setDepth(139);

    // Pop up animation
    this.tweens.add({
      targets: this.muntasirActor,
      scale: 1,
      x: 240,
      y: 540,
      duration: 380,
      ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: this.maishaActor,
      scale: 1,
      x: 200,
      y: 560,
      duration: 380,
      delay: 120,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(600, () => this.stepForwardActors());
      },
    });
  }

  stepForwardActors() {
    // Both move forward into open space
    this.walkActorTo(this.muntasirActor, 320, 540, 160, () => {
      this.muntasirActor.body_.setFlipX(false); // Face right
    });

    this.walkActorTo(this.maishaActor, 440, 540, 160, () => {
      this.maishaActor.body_.setFlipX(true); // Face Muntasir
      this.time.delayedCall(400, () => this.startIntroDialogue());
    });
  }

  startIntroDialogue() {
    const lines = [
      {
        speaker: 'Muntasir',
        text: 'Ah, here we go, the spacecraft went out of orbit and crashed on Mars.',
        target: this.muntasirActor,
        exclamation: true,
      },
      {
        speaker: 'Maisha',
        text: "Thank god, it didn't fall in a bad manner, we got out safe. Is the radio saying anything?",
        target: this.maishaActor,
      },
      {
        speaker: 'Radio',
        isRadio: true,
        text: '[COMM-NET DISPATCH] Orbital telemetry lost during entry deceleration. Emergency frequency 437.1 MHz active. Awaiting transponder confirmation...',
      },
      {
        speaker: 'Muntasir',
        text: "Seems like our base on Earth doesn't know about the crash. We have some facts to check.",
        target: this.muntasirActor,
        onStart: () => {
          this.game.events.emit(
            'fact:show',
            'Fact: Depending on relative position of Earth to Mars, it can take from 3 to 22 minutes to send a message and get a response back between Earth and Mars due to the vast distance it has to cover.'
          );
        },
      },
      {
        speaker: 'Maisha',
        text: 'So we would have to work independently without any help from the base station.',
        target: this.maishaActor,
      },
      {
        speaker: 'Muntasir',
        text: 'Where do we take shelter?',
        target: this.muntasirActor,
        onStart: () => {
          // Camera pan right to reveal the 3D-printed Outpost
          this.stations.forEach((s) => s.setVisible(true));
          this.tweens.add({
            targets: this.cameras.main,
            scrollX: 180,
            duration: 1200,
            ease: 'Cubic.easeInOut',
            yoyo: true,
            hold: 1400,
          });
        },
      },
      {
        speaker: 'Maisha',
        text: 'Seems like we have an outpost already built for living.',
        target: this.maishaActor,
        onStart: () => {
          this.game.events.emit(
            'fact:show',
            'Fact: NASA has plans to build an outpost on Mars surface using regolith, a type of Martian soil that can be compressed into bricks when combined with other chemicals, which will be 3D printed. The Mars Dune Alpha at Johnson Space Center has simulated this building process on Earth.'
          );
        },
      },
      {
        speaker: 'Muntasir',
        text: "Let's go in...",
        target: this.muntasirActor,
      },
    ];

    this.dialogueBox.showSequence(lines, () => {
      this.walkBothToAirlock();
    });
  }

  walkBothToAirlock() {
    const doorX = GAME_WIDTH - 120;
    const doorY = LANE.top + 35;

    // Both walk autonomously to the airlock
    this.walkActorTo(this.muntasirActor, doorX - 40, doorY, 180, () => {
      this.muntasirActor.body_.setFlipX(false);
    });

    this.walkActorTo(this.maishaActor, doorX + 15, doorY + 15, 170, () => {
      this.maishaActor.body_.setFlipX(true);

      // Finish cutscene setup
      gameState.hasSeenCrash = true;
      this.transitioning = false;

      // Sync player astronaut position to Muntasir
      this.player.setPosition(this.muntasirActor.x, this.muntasirActor.y);
      this.player.setVisible(true);
      this.muntasirActor.destroy();
      this.muntasirActor = null;

      // Keep companion actor Maisha waiting by airlock
      this.companion = this.maishaActor;

      this.game.events.emit('prompt', 'Airlock');
    });
  }

  // ==========================================
  // POST-CRASH SURFACE (Solar Panel Loop)
  // ==========================================
  initSurfacePostCrash() {
    // If returning from Outpost before power is restored, trigger Muntasir's thought
    if (gameState.hasSeenCrash && !gameState.solarDeployed && !gameState.solarAligned) {
      // Companion Maisha stands near airlock
      this.companion = new Astronaut(this, GAME_WIDTH - 120, LANE.top + 45, {
        name: 'Maisha',
        color: COLORS.maisha,
      });
      this.companion.body_.setFlipX(true);

      // Highlight the solar panel construction site with bouncing indicator
      this.createSolarBuildGuide();

      this.time.delayedCall(400, () => {
        this.dialogueBox.showSequence(
          [
            {
              speaker: 'Muntasir',
              text: 'We can build a solar panel right there, so that we can harvest light energy and turn it into electricity.',
              target: this.player,
              isThought: true,
              onStart: () => {
                this.game.events.emit(
                  'fact:show',
                  'Fact: NASA uses solar cells and panels on spacecraft and surface missions to generate power where other manners of electricity production is impractical.'
                );
              },
            },
          ],
          () => {}
        );
      });
    } else if (gameState.solarAligned && !gameState.solarDeployed) {
      // Just completed SolarAlignTask! Run gradual charge-up sequence
      this.runPowerChargeUp();
    }
  }

  createSolarBuildGuide() {
    const sp = this.stations.find((s) => s.def.id === 'solar_panel');
    if (!sp) return;

    this.buildGuide = this.add.container(sp.def.x, sp.def.y - 70).setDepth(200);

    // Bouncing downward arrow
    const arrow = this.add.text(0, 0, '▼ BUILD SOLAR PANEL', {
      fontFamily: 'monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      backgroundColor: '#f59e0b',
      color: '#0f172a',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5);
    this.buildGuide.add(arrow);

    this.tweens.add({
      targets: this.buildGuide,
      y: sp.def.y - 82,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  runPowerChargeUp() {
    this.transitioning = true;
    gameState.solarDeployed = true;

    if (this.buildGuide) {
      this.buildGuide.destroy();
      this.buildGuide = null;
    }

    // Companion Maisha is on surface
    if (!this.companion) {
      this.companion = new Astronaut(this, GAME_WIDTH - 120, LANE.top + 45, {
        name: 'Maisha',
        color: COLORS.maisha,
      });
      this.companion.body_.setFlipX(true);
    }

    // Charging ticker banner
    const chargeBanner = this.add
      .text(
        GAME_WIDTH / 2,
        140,
        '⚡ SOLAR ARRAY ONLINE: CHARGING CAPACITORS...\n0%',
        {
          fontFamily: 'monospace',
          fontSize: '16px',
          fontStyle: 'bold',
          align: 'center',
          backgroundColor: '#000c',
          padding: { x: 16, y: 8 },
          color: '#ffd166',
        }
      )
      .setOrigin(0.5)
      .setDepth(1800);

    // Gradually fill power from 0 to 100% over 6 seconds
    this.tweens.addCounter({
      from: 0,
      to: 100,
      duration: 6000,
      ease: 'Linear',
      onUpdate: (tw) => {
        const val = Math.round(tw.getValue());
        gameState.setMeters({ power: val });
        chargeBanner.setText(`⚡ SOLAR ARRAY ONLINE: CHARGING CAPACITORS...\n${val}%`);
      },
      onComplete: () => {
        chargeBanner.setText('⚡ CAPACITORS CHARGED TO 100%!\nHABITAT POWER RESTORED');
        chargeBanner.setColor('#00ff88');

        this.time.delayedCall(1200, () => {
          chargeBanner.destroy();

          // Autonomous dialogue
          this.dialogueBox.showSequence(
            [
              {
                speaker: 'Maisha',
                text: 'Seems like power is restored, we can go inside.',
                target: this.companion,
              },
            ],
            () => {
              this.bothEnterOutpostAfterPower();
            }
          );
        });
      },
    });
  }

  bothEnterOutpostAfterPower() {
    const doorX = GAME_WIDTH - 90;
    const doorY = LANE.top + 35;

    // Both walk autonomously to the airlock door
    this.walkActorTo(this.player, doorX - 35, doorY, 200);
    this.walkActorTo(this.companion, doorX - 10, doorY + 15, 190, () => {
      // Switch active astronaut control to Maisha for Day 1 inside
      gameState.activeAstronaut = 'maisha';
      this.goThroughAirlock('outpost');
    });
  }

  // ==========================================
  // HELPER: Autonomous Actor Movement
  // ==========================================
  walkActorTo(actor, targetX, targetY, speed = 160, onComplete) {
    if (!actor || !actor.active) return;

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
        actor.body_.stop();
        actor.body_.setFrame(0);
        if (onComplete) onComplete();
      },
    });
  }
}
