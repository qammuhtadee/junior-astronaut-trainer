import Phaser from 'phaser';
import { RoomScene } from './RoomScene.js';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, DEPTH, COLORS, LANE } from '../config/constants.js';
import { Astronaut } from '../objects/Astronaut.js';
import { gameState } from '../state/GameState.js';
import { DialogueBox } from '../ui/DialogueBox.js';

/**
 * Surface Scene: Martian terrain outside the outpost.
 * Matches the Day 1 crash landing, dialogue sequence, camera pan, and solar array deployment 1-to-1.
 */
export class SurfaceScene extends RoomScene {
  constructor() {
    super(SCENES.SURFACE, 'surface');
  }

  create(data = {}) {
    super.create(data);

    this.dialogueBox = new DialogueBox(this);

    // Hide solar panel station until it is actually unfurled by the player
    const solarStation = this.stations.find((s) => s.def.id === 'solar_panel');
    if (solarStation && !gameState.solarUnfurled) {
      solarStation.setVisible(false);
    }

    this.game.events.on('solar:aligned', this.runPowerChargeUp, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('solar:aligned', this.runPowerChargeUp, this);
    });

    const isCrashIntro = data.isCrashIntro || (!gameState.hasSeenCrash && gameState.day === 1);

    if (isCrashIntro) {
      this.initCrashCutscene();
    } else {
      this.initSurfacePostCrash();
    }
  }

  drawBackground() {
    // Draw main background plus a seamless left extension so camera pan (-220 -> 0) never shows black void
    this.add.image(-260, 0, 'bg-surface').setOrigin(0).setFlipX(true).setDepth(DEPTH.BACKGROUND);
    this.add.image(0, 0, 'bg-surface').setOrigin(0).setDepth(DEPTH.BACKGROUND);
  }

  // ==========================================
  // DAY 1 CRASH CUTSCENE
  // ==========================================
  initCrashCutscene() {
    this.transitioning = true;
    this.player.setVisible(false);

    // Start camera panned left so the Outpost at x=1190 is completely off-screen to the right
    this.cameras.main.scrollX = -220;

    // Hide all stations initially (no equipment, nothing on screen)
    this.stations.forEach((s) => s.setVisible(false));

    // Spacecraft enters diagonally from top-left, scaled large compared to astronauts
    const scScale = 3.2;
    this.spacecraft = this.add
      .sprite(-420, 110, 'spacecraft-damaged', 0)
      .setScale(scScale)
      .setRotation(Phaser.Math.DegToRad(18))
      .setDepth(150);

    // Diagonal crash into Martian soil, straightening horizontally
    this.tweens.add({
      targets: this.spacecraft,
      x: -20,
      y: 495,
      rotation: 0,
      duration: 850,
      ease: 'Quad.easeIn',
      onComplete: () => {
        // Moderate scene vibration for grittiness
        this.cameras.main.shake(650, 0.015);

        // Multi-frame explosion sprite at impact point
        const explosion = this.add.sprite(-30, 485, 'explosion', 0).setScale(2.5).setDepth(160);
        explosion.play('anim-explosion');
        explosion.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => explosion.destroy());

        // Slip and decelerate horizontally near the left edge of the camera view (-220) without cutting off
        this.tweens.add({
          targets: this.spacecraft,
          x: 55,
          duration: 650,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            this.spacecraft.play('anim-spacecraft-smoke');
            this.time.delayedCall(650, () => this.popOutAstronauts());
          },
        });
      },
    });
  }

  popOutAstronauts() {
    // Both astronauts pop up on the behind side of the spacecraft, one front and one back
    this.player.setPosition(10, 440).setScale(0).setVisible(true).setDepth(145);

    this.maishaActor = new Astronaut(this, -45, 440, {
      name: 'Maisha',
      color: COLORS.maisha,
    });
    this.maishaActor.setScale(0).setDepth(138);

    // Front astronaut pop-up
    this.tweens.add({
      targets: this.player,
      scale: 1,
      x: 35,
      y: 550,
      duration: 380,
      ease: 'Back.easeOut',
    });

    // Back astronaut pop-up
    this.tweens.add({
      targets: this.maishaActor,
      scale: 1,
      x: -25,
      y: 520,
      duration: 380,
      delay: 120,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Wait for tap to continue after they pop out behind the spacecraft
        this.waitForTapToContinue(() => {
          this.stepForwardActors();
        });
      },
    });
  }

  waitForTapToContinue(onTap) {
    const camLeft = this.cameras.main.scrollX;
    const hint = this.add
      .text(camLeft + GAME_WIDTH / 2, GAME_HEIGHT - 45, '▶ TAP / SPACE TO CONTINUE', {
        fontFamily: 'monospace',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#ffd166',
        backgroundColor: '#000c',
        padding: { x: 14, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(1900);

    const pulse = this.tweens.add({
      targets: hint,
      alpha: 0.35,
      duration: 550,
      yoyo: true,
      repeat: -1,
    });

    let triggered = false;
    const trigger = () => {
      if (triggered) return;
      triggered = true;
      pulse.stop();
      hint.destroy();
      this.input.off('pointerdown', trigger);
      this.input.keyboard.off('keydown-SPACE', trigger);
      onTap();
    };

    this.time.delayedCall(150, () => {
      this.input.on('pointerdown', trigger);
      this.input.keyboard.on('keydown-SPACE', trigger);
    });
  }

  stepForwardActors() {
    let doneCount = 0;
    const checkDone = () => {
      doneCount++;
      if (doneCount < 2) return;
      this.player.body_.setFlipX(false); // Muntasir faces right
      this.maishaActor.body_.setFlipX(true); // Maisha faces left toward Muntasir
      this.time.delayedCall(250, () => this.startIntroDialogue());
    };

    // Both move forward; Maisha moves forward to a rather open space and they face each other
    this.walkActorTo(this.player, 210, 540, 310, checkDone);
    this.walkActorTo(this.maishaActor, 380, 540, 310, checkDone);
  }

  startIntroDialogue() {
    const lines = [
      {
        speaker: 'Muntasir',
        text: 'Ah, here we go, the spacecraft went out of orbit and crashed on Mars.',
        target: this.player,
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
        target: this.player,
        text: 'Spacecraft is bound on orbit. Telemetry link severed during atmospheric entry—executing automated orbital relay protocol.',
      },
      {
        speaker: 'Muntasir',
        text: "Seems like our base on earth doesn't know about the crash. We have some facts to check.",
        target: this.player,
      },
      {
        isFact: true,
        text: 'Fact: depending on relative position of earth to mars, it can take from 3-22 minutes to send a message and get a response back between earth and mars due to the vast distance it has to cover.',
      },
      {
        speaker: 'Maisha',
        text: 'So we would have to work independently without any help from the base station.',
        target: this.maishaActor,
      },
      {
        speaker: 'Muntasir',
        text: 'Where do we take shelter?',
        target: this.player,
        onStart: () => {
          // Reveal ONLY the Outpost (airlock) as the camera pans right
          const airlockStation = this.stations.find((s) => s.def.id === 'airlock');
          if (airlockStation) airlockStation.setVisible(true);

          this.tweens.add({
            targets: this.cameras.main,
            scrollX: 0,
            duration: 1200,
            ease: 'Cubic.easeInOut',
          });
        },
      },
      {
        speaker: 'Maisha',
        text: 'Seems like we have an outpost already build for living.',
        target: this.maishaActor,
      },
      {
        isFact: true,
        text: 'Fact: NASA has plans to build an outpost on Mars Surface using regolith, a type of martian soil that can be compressed into bricks when combined with other chemicals, which will be 3D printed. The Mars Dune Alpha at the Johnson Space Centre has already simulated the process of building, on Earth in artificial environments',
      },
      {
        speaker: 'Muntasir',
        text: "Let's go in...",
        target: this.player,
      },
    ];

    this.dialogueBox.showSequence(lines, () => {
      this.walkBothToAirlock();
    });
  }

  walkBothToAirlock() {
    const doorX = GAME_WIDTH - 120;
    const doorY = LANE.top + 35;

    let arrivedCount = 0;
    const onBothArrived = () => {
      arrivedCount++;
      if (arrivedCount < 2) return;

      gameState.hasSeenCrash = true;
      this.transitioning = false;
      this.companion = this.maishaActor;
      this.game.events.emit('prompt', 'Airlock');
    };

    // Both walk autonomously to the outpost airlock at brisk speed
    this.walkActorTo(this.player, doorX - 35, doorY, 340, () => {
      this.player.body_.setFlipX(false);
      onBothArrived();
    });

    this.walkActorTo(this.maishaActor, doorX - 75, doorY + 15, 340, () => {
      this.maishaActor.body_.setFlipX(false);
      onBothArrived();
    });
  }

  // ==========================================
  // POST-CRASH SURFACE (Solar Panel Loop)
  // ==========================================
  initSurfacePostCrash() {
    this.cameras.main.scrollX = 0;

    // Companion Maisha stands outside near the airlock with Muntasir
    if (gameState.day === 1) {
      this.companion = new Astronaut(this, GAME_WIDTH - 165, LANE.top + 48, {
        name: 'Maisha',
        color: COLORS.maisha,
      });
      this.companion.body_.setFlipX(true);
    }

    // If returning from the dark Outpost on Day 1 before building the solar panel
    if (gameState.visitedDarkOutpost && !gameState.solarDeployed && !gameState.solarAligned) {
      if (!gameState.solarUnfurled) {
        this.transitioning = true;
        this.time.delayedCall(350, () => {
          this.dialogueBox.showSequence(
            [
              {
                speaker: 'Muntasir',
                text: 'We can build a solar panel right there, so that we can harvest light energy and turn it into electricity.',
                target: this.player,
                isThought: true,
              },
              {
                isFact: true,
                text: 'Fact: NASA uses solar cells and panels on spacecraft to make them navigate on space where other manners of electricity production is impractical',
              },
            ],
            () => {
              this.transitioning = false;
              this.createSolarBuildGuide();
            }
          );
        });
      }
    }
  }

  createSolarBuildGuide() {
    const sp = this.stations.find((s) => s.def.id === 'solar_panel');
    if (!sp) return;

    // Enable interaction on the dotted build zone while keeping the solid station box hidden until unfurled
    sp.setVisible(false);
    sp.allowBuildInteract = true;
    sp.customPromptLabel = 'Build Solar Panel';

    // Dotted rectangular bound on the ground
    this.dottedBox = this.add.graphics().setDepth(DEPTH.WORLD_MIN + sp.def.y - 1);
    const bx = sp.def.x - sp.def.w / 2;
    const by = sp.def.y - sp.def.h;
    const bw = sp.def.w;
    const bh = sp.def.h;

    this.dottedBox.fillStyle(0xf59e0b, 0.12);
    this.dottedBox.fillRect(bx, by, bw, bh);
    this.drawDashedRect(this.dottedBox, bx, by, bw, bh, 0xffd166, 3, 8, 6);

    // Bouncing arrow pointing downwards: "Build Solar Panel"
    this.buildGuide = this.add.container(sp.def.x, by - 28).setDepth(900);
    const label = this.add
      .text(0, -22, 'Build Solar Panel', {
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

    this.buildGuide.add([label, arrow]);

    this.tweens.add({
      targets: this.buildGuide,
      y: by - 42,
      duration: 550,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.onSolarUnfurlStart = () => {
      if (this.dottedBox) {
        this.dottedBox.destroy();
        this.dottedBox = null;
      }
      if (this.buildGuide) {
        this.buildGuide.destroy();
        this.buildGuide = null;
      }
    };
  }

  drawDashedRect(gfx, x, y, w, h, color, lineWidth, dashLen, gapLen) {
    gfx.lineStyle(lineWidth, color, 0.95);
    const drawSide = (x1, y1, x2, y2) => {
      const dist = Phaser.Math.Distance.Between(x1, y1, x2, y2);
      const angle = Phaser.Math.Angle.Between(x1, y1, x2, y2);
      for (let d = 0; d < dist; d += dashLen + gapLen) {
        const seg = Math.min(dashLen, dist - d);
        gfx.lineBetween(
          x1 + Math.cos(angle) * d,
          y1 + Math.sin(angle) * d,
          x1 + Math.cos(angle) * (d + seg),
          y1 + Math.sin(angle) * (d + seg)
        );
      }
    };
    drawSide(x, y, x + w, y);
    drawSide(x + w, y, x + w, y + h);
    drawSide(x + w, y + h, x, y + h);
    drawSide(x, y + h, x, y);
  }

  runPowerChargeUp() {
    if (gameState.solarDeployed) return;
    this.transitioning = true;
    this.game.events.emit('prompt', null);
    gameState.solarDeployed = true;

    if (!this.companion) {
      this.companion = new Astronaut(this, GAME_WIDTH - 165, LANE.top + 48, {
        name: 'Maisha',
        color: COLORS.maisha,
      });
      this.companion.body_.setFlipX(true);
    }

    // Power pill meter appears at 0% and gradually fills to 100% over 6 seconds
    gameState.setMeters({ power: 0 });

    this.tweens.addCounter({
      from: 0,
      to: 100,
      duration: 6000,
      ease: 'Linear',
      onUpdate: (tw) => {
        const val = Math.round(tw.getValue());
        gameState.setMeters({ power: val });
      },
      onComplete: () => {
        gameState.setMeters({ power: 100 });

        this.time.delayedCall(400, () => {
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

    let arrivedCount = 0;
    const onBothArrived = () => {
      arrivedCount++;
      if (arrivedCount < 2) return;

      // Switch active astronaut control to Maisha for turning on the lights inside
      gameState.activeAstronaut = 'maisha';
      this.goThroughAirlock('outpost');
    };

    this.walkActorTo(this.player, doorX - 35, doorY, 340, onBothArrived);
    this.walkActorTo(this.companion, doorX - 65, doorY + 15, 340, onBothArrived);
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
