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

    this.maishaActor = null;
    this.spacecraft = null;
    this.craterShadow = null;
    this.dottedBox = null;
    this.buildGuide = null;
    this.solarDustOverlay = null;
    this.solarCleanGuide = null;
    this.solarAlignGuide = null;
    this.iceDottedBox = null;
    this.iceDrillGuide = null;
    this.reactorDottedBox = null;
    this.reactorBuildGuide = null;
    this.onSolarUnfurlStart = null;
    this.dialogueBox = new DialogueBox(this);

    // Hide solar panel station until it is actually unfurled by the player
    const solarStation = this.stations.find((s) => s.def.id === 'solar_panel');
    if (solarStation && !gameState.solarUnfurled) {
      solarStation.setVisible(false);
    }

    const iceStation = this.stations.find((s) => s.def.id === 'ice_site');
    if (
      iceStation &&
      (gameState.day < 2 ||
        (gameState.day >= 4 && gameState.day < 7) ||
        (gameState.day === 2 && !gameState.d2PanelCleaned))
    ) {
      iceStation.setVisible(false);
    }
    if (iceStation && gameState.day === 7 && gameState.d7IceSiteBagged) {
      iceStation.setWaterBagShield(true);
    }

    const ghStation = this.stations.find((s) => s.def.id === 'greenhouse');
    if (ghStation) {
      if (gameState.day < 6 || (gameState.day === 6 && !gameState.d6GreenhouseBuilt)) {
        ghStation.setVisible(false);
      }
      if (gameState.day === 7 && gameState.d7GreenhouseBagged) {
        ghStation.setWaterBagShield(true);
      }
    }

    const reactorStation = this.stations.find((s) => s.def.id === 'reactor');
    if (reactorStation && (gameState.day < 4 || !gameState.d4ReactorBuilt)) {
      reactorStation.setVisible(false);
    }

    this.game.events.on('solar:aligned', this.runPowerChargeUp, this);
    this.game.events.on('d2:panel-cleaned', this.onDay2PanelCleaned, this);
    this.game.events.on('d2:ice-drilled', this.onDay2IceDrilled, this);
    this.game.events.on('d3:ice-drilled', this.onDay3IceDrilled, this);
    this.game.events.on('d4:panel-cleaned', this.onDay4PanelCleaned, this);
    this.game.events.on('d4:panel-aligned', this.onDay4PanelAligned, this);
    this.game.events.on('d4:reactor-built', this.onDay4ReactorBuilt, this);
    this.game.events.on('d6:greenhouse-built', this.onDay6GreenhouseBuilt, this);
    this.game.events.on('d6:crops-planted', this.onDay6CropsPlanted, this);
    this.game.events.on('d6:prompt-swap', this.showDay6SwapChoice, this);
    this.game.events.on('d7:ice-drilled', this.onDay7IceDrilled, this);
    this.game.events.on('d7:ice-bagged', this.onDay7IceBagged, this);
    this.game.events.on('d7:greenhouse-bagged', this.onDay7GreenhouseBagged, this);
    this.game.events.on('d7:crops-harvested', this.onDay7CropsHarvested, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('solar:aligned', this.runPowerChargeUp, this);
      this.game.events.off('d2:panel-cleaned', this.onDay2PanelCleaned, this);
      this.game.events.off('d2:ice-drilled', this.onDay2IceDrilled, this);
      this.game.events.off('d3:ice-drilled', this.onDay3IceDrilled, this);
      this.game.events.off('d4:panel-cleaned', this.onDay4PanelCleaned, this);
      this.game.events.off('d4:panel-aligned', this.onDay4PanelAligned, this);
      this.game.events.off('d4:reactor-built', this.onDay4ReactorBuilt, this);
      this.game.events.off('d6:greenhouse-built', this.onDay6GreenhouseBuilt, this);
      this.game.events.off('d6:crops-planted', this.onDay6CropsPlanted, this);
      this.game.events.off('d6:prompt-swap', this.showDay6SwapChoice, this);
      this.game.events.off('d7:ice-drilled', this.onDay7IceDrilled, this);
      this.game.events.off('d7:ice-bagged', this.onDay7IceBagged, this);
      this.game.events.off('d7:greenhouse-bagged', this.onDay7GreenhouseBagged, this);
      this.game.events.off('d7:crops-harvested', this.onDay7CropsHarvested, this);
      if (this.landingSound) {
        this.landingSound.stop();
        this.sound.remove(this.landingSound);
        this.landingSound = null;
      }
    });

    const isCrashIntro = data.isCrashIntro || (!gameState.hasSeenCrash && gameState.day === 1);

    if (isCrashIntro) {
      this.initCrashCutscene();
    } else if (gameState.day === 2) {
      this.initDay2Surface();
    } else if (gameState.day === 3) {
      this.initDay3Surface();
    } else if (gameState.day === 4) {
      this.initDay4Surface();
    } else if (gameState.day === 6) {
      this.initDay6Surface();
    } else if (gameState.day === 7) {
      this.initDay7Surface();
    } else {
      this.initSurfacePostCrash();
    }
  }

  drawBackground() {
    // Draw main background plus a seamless left extension so camera pan (-220 -> 0) never shows black void
    this.add.image(-260, 0, 'bg-surface').setOrigin(0).setFlipX(true).setDepth(DEPTH.BACKGROUND);
    this.add.image(0, 0, 'bg-surface').setOrigin(0).setDepth(DEPTH.BACKGROUND);
  }

  update(time, delta) {
    super.update(time, delta);
    if (this.player && this.spacecraft && this.player.x < 215 && this.player.y < 525) {
      this.player.y = 525;
      this.player.syncDepth();
    }
  }

  spawnGroundedSpacecraft(x = -10, y = 425) {
    if (!this.craterShadow) {
      this.craterShadow = this.add
        .ellipse(x, y + 42, 430, 58, 0x1c0f0a, 0.65)
        .setDepth(DEPTH.WORLD_MIN + 20);
    }
    if (!this.spacecraft) {
      this.spacecraft = this.add
        .sprite(x, y, 'spacecraft-damaged', 0)
        .setScale(2.8)
        .setDepth(DEPTH.WORLD_MIN + 45);
      this.spacecraft.play('anim-spacecraft-smoke');
    }
    return this.spacecraft;
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
    const scScale = 2.8;
    this.spacecraft = this.add
      .sprite(-420, 110, 'spacecraft-damaged', 0)
      .setScale(scScale)
      .setRotation(Phaser.Math.DegToRad(18))
      .setDepth(DEPTH.WORLD_MIN + 45);

    this.landingSound = null;
    const landVol = gameState.getEffectiveVolume('sfx', 0.65);
    if (landVol > 0 && this.cache.audio.exists('sfx-landing')) {
      this.landingSound = this.sound.add('sfx-landing', { volume: landVol });
      this.landingSound.play({ seek: 4, volume: landVol });
    }

    // Diagonal crash into Martian soil, straightening horizontally
    this.tweens.add({
      targets: this.spacecraft,
      x: -55,
      y: 425,
      rotation: 0,
      duration: 850,
      ease: 'Quad.easeIn',
      onComplete: () => {
        // Moderate scene vibration for grittiness + impact boom
        this.cameras.main.shake(650, 0.015);
        const boomVol = gameState.getEffectiveVolume('sfx', 0.85);
        if (boomVol > 0 && this.cache.audio.exists('sfx-crash-boom')) {
          this.sound.play('sfx-crash-boom', { volume: boomVol });
        }

        // Dark impact crater shadow beneath the grounded hull
        this.craterShadow = this.add
          .ellipse(-10, 467, 430, 58, 0x1c0f0a, 0.65)
          .setDepth(DEPTH.WORLD_MIN + 20);

        // Multi-frame explosion sprite at impact point
        const explosion = this.add.sprite(-30, 430, 'explosion', 0).setScale(2.5).setDepth(160);
        explosion.play('anim-explosion');
        explosion.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => explosion.destroy());

        // Slip and decelerate horizontally onto the upper-left ridge without clipping
        this.tweens.add({
          targets: this.spacecraft,
          x: -10,
          duration: 650,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            if (this.landingSound && this.landingSound.isPlaying) {
              this.tweens.add({
                targets: this.landingSound,
                volume: 0,
                duration: 600,
                onComplete: () => {
                  if (this.landingSound) {
                    this.landingSound.stop();
                    this.sound.remove(this.landingSound);
                    this.landingSound = null;
                  }
                },
              });
            }
            this.spacecraft.play('anim-spacecraft-smoke');
            this.time.delayedCall(650, () => this.popOutAstronauts());
          },
        });
      },
    });
  }

  popOutAstronauts() {
    // Both astronauts eject forward onto solid flat Martian soil clear of the hull
    this.player.setPosition(175, 470).setScale(0).setVisible(true).setDepth(DEPTH.WORLD_MIN + 555);

    this.maishaActor = new Astronaut(this, 145, 485, {
      name: 'Maisha',
      color: COLORS.maisha,
    });
    this.maishaActor.setScale(0).setDepth(DEPTH.WORLD_MIN + 585);

    // Front astronaut lands solidly on terrain
    this.tweens.add({
      targets: this.player,
      scale: 1,
      x: 275,
      y: 555,
      duration: 380,
      ease: 'Back.easeOut',
    });

    // Companion lands beside him on flat soil
    this.tweens.add({
      targets: this.maishaActor,
      scale: 1,
      x: 195,
      y: 585,
      duration: 380,
      delay: 120,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Wait for tap to continue after they pop out onto the ground
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

    // Both move forward across flat open terrain and face each other
    this.walkActorTo(this.player, 330, 555, 310, checkDone);
    this.walkActorTo(this.maishaActor, 485, 555, 310, checkDone);
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
        isFactReveal: true,
        text: 'Fact: depending on relative position of earth to mars, it can take from 3-22 minutes to send a message and get a response back between earth and mars due to the vast distance it has to cover.',
      },
      {
        speaker: 'Muntasir',
        text: 'How are we going to keep track of all these NASA facts and mission telemetry?',
        target: this.player,
      },
      {
        speaker: 'Maisha',
        text: "I'm keeping track of everything we learn in our Mission Logbook! Every task and NASA fact gets recorded live at the top of our screen.",
        target: this.maishaActor,
        onAfterLine: (resume) => {
          if (!gameState.tutorialLogbookDone) {
            gameState.tutorialLogbookDone = true;
            this.game.events.emit('tutorial:logbook', resume);
          } else {
            resume();
          }
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
        isFactReveal: true,
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

      if (!gameState.tutorialMoveDone) {
        gameState.tutorialMoveDone = true;
        this.game.events.emit('tutorial:move');
      }
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

    // Do NOT spawn an idle companion on the surface (prevents duplicate Maisha outside)
    // If returning from the dark Outpost on Day 1 before building the solar panel
    if (gameState.visitedDarkOutpost && !gameState.solarUnfurled) {
      this.createSolarBuildGuide();

      if (!gameState.seenSolarThought) {
        gameState.seenSolarThought = true;
        this.transitioning = true;
        this.time.delayedCall(250, () => {
          this.dialogueBox.showSequence(
            [
              {
                speaker: 'Muntasir',
                text: 'We can build a solar panel right there, so that we can harvest light energy and turn it into electricity.',
                target: this.player,
                isThought: true,
              },
            ],
            () => {
              this.game.events.emit(
                'fact:show',
                'Fact: NASA uses solar cells and panels on spacecraft to make them navigate on space where other manners of electricity production is impractical'
              );
              this.transitioning = false;
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
    gameState.solarDeployed = true;

    // Bug 2 & 3 fix: Muntasir walks independently under player control immediately after aligning
    // the solar panel while the power meter charges from 0% to 100% in HudScene.
    this.transitioning = false;
    this.game.events.emit('toast', 'Power restored! Walk to the Airlock to go inside.');
  }

  // ==========================================
  // DAY 2: DUST AND AIR
  // ==========================================
  initDay2Surface() {
    this.cameras.main.scrollX = 0;

    const solarStation = this.stations.find((s) => s.def.id === 'solar_panel');
    if (solarStation) solarStation.setVisible(true);

    if (!gameState.d2PanelCleaned) {
      this.game.events.emit('power:start-dust-drain');
      this.createSolarCleanGuide();
    } else if (!gameState.d2IceDrilled) {
      const iceStation = this.stations.find((s) => s.def.id === 'ice_site');
      if (iceStation) iceStation.setVisible(true);
      this.createIceDrillGuide();
      if (!this.companion) {
        this.companion = new Astronaut(this, 760, LANE.top + 48, {
          name: 'Maisha',
          color: COLORS.maisha,
        });
        this.companion.body_.setFlipX(true);
      }
    }
  }

  createSolarCleanGuide() {
    const solarStation = this.stations.find((s) => s.def.id === 'solar_panel');
    if (!solarStation) return;
    solarStation.customPromptLabel = 'Clean Solar Panel';

    if (this.solarDustOverlay) {
      this.solarDustOverlay.destroy();
      this.solarDustOverlay = null;
    }
    if (this.solarCleanGuide) {
      this.solarCleanGuide.destroy();
      this.solarCleanGuide = null;
    }

    const { x, y, w, h } = solarStation.def;
    const left = x - w / 2;
    const top = y - h;

    const dustGfx = this.add.graphics().setDepth(solarStation.depth + 1);
    dustGfx.fillStyle(0x9a3412, 0.72);
    dustGfx.fillRect(left + 4, top + 4, w - 8, h - 8);
    dustGfx.fillStyle(0xc2410c, 0.78);
    dustGfx.fillCircle(left + w * 0.25, top + h * 0.4, 22);
    dustGfx.fillCircle(left + w * 0.65, top + h * 0.55, 26);
    dustGfx.fillCircle(left + w * 0.45, top + h * 0.3, 18);
    dustGfx.fillStyle(0x7c2d12, 0.7);
    dustGfx.fillCircle(left + w * 0.8, top + h * 0.32, 16);
    this.solarDustOverlay = dustGfx;

    const guide = this.add.container(x, top - 34).setDepth(1300);
    const label = this.add
      .text(0, -18, 'Clean Solar Panel', {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#ffd166',
        backgroundColor: '#000c',
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5);
    const arrow = this.add
      .text(0, 4, '▼', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffd166',
      })
      .setOrigin(0.5);
    guide.add([label, arrow]);
    this.tweens.add({
      targets: guide,
      y: top - 24,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.solarCleanGuide = guide;
  }

  createIceDrillGuide() {
    const iceStation = this.stations.find((s) => s.def.id === 'ice_site');
    if (!iceStation) return;
    iceStation.allowBuildInteract = true;
    iceStation.customPromptLabel = 'Drill for Ice';

    if (this.iceDottedBox) {
      this.iceDottedBox.destroy();
      this.iceDottedBox = null;
    }
    if (this.iceDrillGuide) {
      this.iceDrillGuide.destroy();
      this.iceDrillGuide = null;
    }

    const { x, y, w, h } = iceStation.def;
    const left = x - w / 2 - 6;
    const top = y - h - 6;
    const gfx = this.add.graphics().setDepth(iceStation.depth + 1);
    this.drawDashedRect(gfx, left, top, w + 12, h + 12, 0x38bdf8, 2, 8, 6);
    this.iceDottedBox = gfx;

    const guide = this.add.container(x, top - 30).setDepth(1300);
    const label = this.add
      .text(0, -18, 'Drill for Ice', {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#7dd3fc',
        backgroundColor: '#000c',
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5);
    const arrow = this.add
      .text(0, 4, '▼', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#7dd3fc',
      })
      .setOrigin(0.5);
    guide.add([label, arrow]);
    this.tweens.add({
      targets: guide,
      y: top - 20,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.iceDrillGuide = guide;
  }

  onDay2PanelCleaned() {
    if (this.solarDustOverlay) {
      this.solarDustOverlay.destroy();
      this.solarDustOverlay = null;
    }
    if (this.solarCleanGuide) {
      this.solarCleanGuide.destroy();
      this.solarCleanGuide = null;
    }

    const solarStation = this.stations.find((s) => s.def.id === 'solar_panel');
    if (solarStation) solarStation.customPromptLabel = null;

    const iceStation = this.stations.find((s) => s.def.id === 'ice_site');
    if (iceStation) iceStation.setVisible(true);
    this.createIceDrillGuide();

    this.nearby = null;
    this.game.events.emit('prompt', null);

    if (!gameState.d2OxygenIntroDone) {
      gameState.d2OxygenIntroDone = true;
      gameState.stepId = 'd2_oxygen_low';
      gameState.setMeters({ oxygen: 20 });

      if (!this.companion) {
        this.companion = new Astronaut(this, GAME_WIDTH - 120, LANE.top + 45, {
          name: 'Maisha',
          color: COLORS.maisha,
        });
      }

      this.transitioning = true;
      this.walkActorTo(this.companion, 760, LANE.top + 48, 300, () => {
        this.companion.body_.setFlipX(true);
        this.player.body_.setFlipX(false);

        const lines = [
          {
            speaker: 'Maisha',
            text: 'Muntasir! I just checked the life support console—our habitat oxygen reserves are getting dangerously low!',
            target: this.companion,
            exclamation: true,
          },
          {
            speaker: 'Muntasir',
            text: 'We can melt subsurface Martian ice and split water with electricity to make oxygen, just like the ISS!',
            target: this.player,
          },
          {
            speaker: 'Maisha',
            text: 'Look over there—the surface scanner found subsurface ice! Drill a core sample while I prepare the outpost.',
            target: this.companion,
          },
        ];

        this.dialogueBox.showSequence(lines, () => {
          this.transitioning = false;
          this.game.events.emit(
            'fact:show',
            "Fact: Just like the ISS Oxygen Generation System (OGS) splits water into hydrogen and breathable oxygen via electrolysis, NASA's MOXIE experiment on Perseverance proved we can generate oxygen on Mars—producing 122 grams of pure oxygen."
          );
          if (this.companion && this.companion.active) {
            this.walkActorTo(this.companion, GAME_WIDTH - 120, LANE.top + 45, 310, () => {
              if (this.companion) this.companion.setVisible(false);
            });
          }
        });
      });
    } else {
      this.transitioning = false;
    }
  }

  onDay2IceDrilled() {
    if (this.iceDottedBox) {
      this.iceDottedBox.destroy();
      this.iceDottedBox = null;
    }
    if (this.iceDrillGuide) {
      this.iceDrillGuide.destroy();
      this.iceDrillGuide = null;
    }

    const iceStation = this.stations.find((s) => s.def.id === 'ice_site');
    if (iceStation) {
      iceStation.customPromptLabel = null;
      iceStation.allowBuildInteract = false;
    }

    this.nearby = null;
    this.game.events.emit('prompt', null);
    this.transitioning = true;

    this.dialogueBox.showSequence(
      [
        {
          speaker: 'Muntasir',
          isThought: true,
          target: this.player,
          text: "Got the Martian ice core! Let's head back inside so Maisha can build the Oxygen Maker.",
        },
      ],
      () => {
        this.transitioning = false;
      }
    );
  }

  // ==========================================
  // DAY 3: SUBSURFACE ICE DRILLING
  // ==========================================
  initDay3Surface() {
    this.cameras.main.scrollX = 0;

    const solarStation = this.stations.find((s) => s.def.id === 'solar_panel');
    if (solarStation) {
      solarStation.setVisible(true);
      solarStation.customPromptLabel = null;
    }

    const iceStation = this.stations.find((s) => s.def.id === 'ice_site');
    if (iceStation) {
      iceStation.setVisible(true);
      if (!gameState.d3IceDrilled) {
        this.createIceDrillGuide();
      } else {
        iceStation.customPromptLabel = null;
        iceStation.allowBuildInteract = false;
      }
    }
  }

  onDay3IceDrilled() {
    if (this.iceDottedBox) {
      this.iceDottedBox.destroy();
      this.iceDottedBox = null;
    }
    if (this.iceDrillGuide) {
      this.iceDrillGuide.destroy();
      this.iceDrillGuide = null;
    }

    const iceStation = this.stations.find((s) => s.def.id === 'ice_site');
    if (iceStation) {
      iceStation.customPromptLabel = null;
      iceStation.allowBuildInteract = false;
    }

    this.nearby = null;
    this.game.events.emit('prompt', null);

    this.transitioning = true;
    this.time.delayedCall(250, () => {
      this.dialogueBox.showSequence(
        [
          {
            speaker: 'Maisha',
            text: 'Harvested plenty of subsurface Martian ice! Let’s head back inside through the Airlock and salvage our Water Station.',
            target: this.player,
            isThought: true,
          },
        ],
        () => {
          this.transitioning = false;
          this.game.events.emit(
            'fact:show',
            "Fact: NASA's Phoenix lander uncovered bright subsurface water ice just centimeters beneath Martian soil in 2008—confirming astronauts can harvest local ice!"
          );
        }
      );
    });
  }

  // ==========================================
  // DAY 4: SOLAR CRISIS & KILOPOWER REACTOR
  // ==========================================
  initDay4Surface() {
    this.cameras.main.scrollX = 0;
    gameState.activeAstronaut = 'muntasir';
    this.player.setIdentity('Muntasir', COLORS.muntasir);

    const solarStation = this.stations.find((s) => s.def.id === 'solar_panel');
    if (solarStation) solarStation.setVisible(true);

    const iceStation = this.stations.find((s) => s.def.id === 'ice_site');
    if (iceStation) iceStation.setVisible(false);

    const reactorStation = this.stations.find((s) => s.def.id === 'reactor');

    if (!gameState.d4PanelCleaned) {
      this.game.events.emit('power:start-dust-drain');
      this.createSolarCleanGuide();
    } else if (!gameState.d4PanelAligned) {
      this.createDay4SolarAlignGuide();
    } else if (!gameState.d4ReactorBuilt) {
      if (!this.companion) {
        this.companion = new Astronaut(this, 690, LANE.top + 48, {
          name: 'Maisha',
          color: COLORS.maisha,
        });
        this.companion.body_.setFlipX(false);
      }
      this.createReactorBuildGuide();
    } else if (reactorStation) {
      reactorStation.setVisible(true);
      reactorStation.allowBuildInteract = false;
      reactorStation.customPromptLabel = 'Kilopower Reactor (Online)';
    }
  }

  createDay4SolarAlignGuide() {
    const solarStation = this.stations.find((s) => s.def.id === 'solar_panel');
    if (!solarStation) return;
    solarStation.customPromptLabel = 'Realign Solar Panel';

    if (this.solarAlignGuide) {
      this.solarAlignGuide.destroy();
      this.solarAlignGuide = null;
    }

    const { x, y, h } = solarStation.def;
    const top = y - h;
    const guide = this.add.container(x, top - 34).setDepth(1300);
    const label = this.add
      .text(0, -18, 'Realign Solar Panel', {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#ffd166',
        backgroundColor: '#000c',
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5);
    const arrow = this.add
      .text(0, 4, '▼', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffd166',
      })
      .setOrigin(0.5);
    guide.add([label, arrow]);
    this.tweens.add({
      targets: guide,
      y: top - 24,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.solarAlignGuide = guide;
  }

  createReactorBuildGuide() {
    const rs = this.stations.find((s) => s.def.id === 'reactor');
    if (!rs) return;

    rs.setVisible(false);
    rs.allowBuildInteract = true;
    rs.customPromptLabel = 'Build Kilopower Reactor';

    if (this.reactorDottedBox) {
      this.reactorDottedBox.destroy();
      this.reactorDottedBox = null;
    }
    if (this.reactorBuildGuide) {
      this.reactorBuildGuide.destroy();
      this.reactorBuildGuide = null;
    }

    const bx = rs.def.x - rs.def.w / 2;
    const by = rs.def.y - rs.def.h;
    this.reactorDottedBox = this.add.graphics().setDepth(DEPTH.WORLD_MIN + rs.def.y - 1);
    this.reactorDottedBox.fillStyle(0x22d3ee, 0.14);
    this.reactorDottedBox.fillRect(bx, by, rs.def.w, rs.def.h);
    this.drawDashedRect(this.reactorDottedBox, bx, by, rs.def.w, rs.def.h, 0x22d3ee, 3, 8, 6);

    this.reactorBuildGuide = this.add.container(rs.def.x, by - 28).setDepth(900);
    const label = this.add
      .text(0, -22, 'Build Nuclear Reactor', {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        backgroundColor: '#06b6d4',
        color: '#0f172a',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5);
    const arrow = this.add
      .text(0, 2, '▼', {
        fontFamily: 'monospace',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#67e8f9',
      })
      .setOrigin(0.5);
    this.reactorBuildGuide.add([label, arrow]);

    this.tweens.add({
      targets: this.reactorBuildGuide,
      y: by - 42,
      duration: 550,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  onDay4PanelCleaned() {
    if (this.solarDustOverlay) {
      this.solarDustOverlay.destroy();
      this.solarDustOverlay = null;
    }
    if (this.solarCleanGuide) {
      this.solarCleanGuide.destroy();
      this.solarCleanGuide = null;
    }

    const solarStation = this.stations.find((s) => s.def.id === 'solar_panel');
    if (solarStation) solarStation.customPromptLabel = 'Realign Solar Panel';

    this.createDay4SolarAlignGuide();
    this.nearby = null;
    this.game.events.emit('prompt', null);

    // Storm also knocked the panel off-angle: auto-launch alignment mini-game once resumed
    this.time.delayedCall(220, () => {
      if (!gameState.d4PanelAligned) {
        this.scene.pause();
        this.scene.launch('SolarAlignTask');
      }
    });
  }

  onDay4PanelAligned() {
    if (this.solarAlignGuide) {
      this.solarAlignGuide.destroy();
      this.solarAlignGuide = null;
    }

    const solarStation = this.stations.find((s) => s.def.id === 'solar_panel');
    if (solarStation) solarStation.customPromptLabel = null;

    this.nearby = null;
    this.game.events.emit('prompt', null);

    if (!gameState.d4ReactorIntroDone) {
      gameState.d4ReactorIntroDone = true;
      gameState.stepId = 'd4_reactor';

      if (!this.companion) {
        this.companion = new Astronaut(this, GAME_WIDTH - 120, LANE.top + 46, {
          name: 'Maisha',
          color: COLORS.maisha,
        });
      }

      this.transitioning = true;
      this.walkActorTo(this.companion, 690, LANE.top + 48, 300, () => {
        this.companion.body_.setFlipX(false);
        this.player.body_.setFlipX(true);

        this.dialogueBox.showSequence(
          [
            {
              speaker: 'Muntasir',
              text: 'This is frustrating and dangerous for us to have such limited power options that do not work at night and get knocked out by frequent dust storms!',
              target: this.player,
            },
            {
              speaker: 'Muntasir',
              text: 'Also, sunlight on Mars is much weaker than on Earth, so solar panels alone cannot generate enough steady electricity.',
              target: this.player,
            },
            {
              speaker: 'Maisha',
              text: 'We must find a better, reliable, safe, always-on alternative power source. Do you have any idea?',
              target: this.companion,
            },
            {
              speaker: 'Muntasir',
              text: 'We have very limited options out here for continuous power—I suggest nuclear fission power!',
              target: this.player,
            },
            {
              speaker: 'Maisha',
              text: 'Yes! We can build a compact nuclear power station right outside here so storms and darkness never stop us.',
              target: this.companion,
            },
            {
              speaker: 'Muntasir',
              text: 'Let’s build it! Walk up to the reactor plot beside us to assemble and stabilize the Kilopower core.',
              target: this.player,
            },
          ],
          () => {
            this.transitioning = false;
            this.createReactorBuildGuide();
            this.game.events.emit(
              'fact:show',
              "Fact: At ~43% of Earth's sunlight, Martian solar power delivers under 1 kW on dusty days and 0 kW at night. NASA's Kilopower nuclear reactor produces 10–40 kW non-stop—40 kW powers ~33 average American homes (U.S. EIA avg ~1.2 kW/home)!"
            );
          }
        );
      });
    } else {
      this.createReactorBuildGuide();
      this.transitioning = false;
    }
  }

  onDay4ReactorBuilt() {
    if (this.reactorDottedBox) {
      this.reactorDottedBox.destroy();
      this.reactorDottedBox = null;
    }
    if (this.reactorBuildGuide) {
      this.reactorBuildGuide.destroy();
      this.reactorBuildGuide = null;
    }

    const rs = this.stations.find((s) => s.def.id === 'reactor');
    if (rs) {
      rs.setVisible(true);
      rs.allowBuildInteract = false;
      rs.customPromptLabel = 'Kilopower Reactor (Online)';
    }

    this.nearby = null;
    this.game.events.emit('prompt', null);

    if (!this.companion) {
      this.companion = new Astronaut(this, 690, LANE.top + 48, {
        name: 'Maisha',
        color: COLORS.maisha,
      });
      this.companion.body_.setFlipX(false);
    }

    this.transitioning = true;
    this.time.delayedCall(350, () => {
      // Introduce the Geiger counter readout + Radiation Meter at 100% (safe Martian background)
      gameState.setMeters({ power: 100, radiation: 100 });
      this.createGeigerBadge('GEIGER: 7.83 uGy/hr (SAFE — 100%)', 0x50fa7b);

      this.dialogueBox.showSequence(
        [
          {
            speaker: 'Muntasir',
            text: 'We now have continuous power all the time—without worrying about dust storms, nighttime darkness, or growing equipment demands as our survival needs expand!',
            target: this.player,
          },
          {
            speaker: 'Muntasir',
            text: "Wait—hear that faint clicking on our reactor's built-in Geiger counter? Is Mars radioactive right now?",
            target: this.player,
            exclamation: true,
          },
          {
            speaker: 'Maisha',
            text: "Don't worry! That's just Mars's normal natural background radiation—about 7.83 micrograys per hour (0.188 mGy/day). I've brought up our Radiation Safety Meter at a full 100% safe level so we can monitor any spikes!",
            target: this.companion,
          },
          {
            isFactReveal: true,
            text: 'NASA Fact — Mars Surface Background Radiation: Measurements from NASA Curiosity MSL-RAD (274,998 archived readings in NASA OSDR RadLab) show an average Mars surface background of ~7.83 uGy/hr (0.188 mGy/day)—totally non-lethal over short EVAs, though astronauts track cumulative exposure closely. (Refs: NASA OSDR RadLab / Curiosity MSL-RAD)',
          },
          {
            speaker: 'Maisha',
            text: "Since our Radiation Meter is steady at 100% and we're safe right now, let's head back inside to check our console and get some rest!",
            target: this.companion,
          },
        ],
        () => {
          this.transitioning = false;
          this.game.events.emit('toast', 'Kilopower Reactor online & Radiation Meter active (100% Safe)! Return inside.');
          if (this.companion && this.companion.active) {
            this.walkActorTo(this.companion, GAME_WIDTH - 120, LANE.top + 46, 320, () => {
              if (this.companion) this.companion.setVisible(false);
            });
          }
        }
      );
    });
  }

  createGeigerBadge(text, strokeColor = 0x50fa7b) {
    if (this.geigerBadge) {
      this.geigerBadge.destroy();
      this.geigerBadge = null;
    }
    const c = this.add.container(GAME_WIDTH / 2, 160).setDepth(1600);
    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.92);
    bg.fillRoundedRect(-200, -16, 400, 32, 8);
    bg.lineStyle(2, strokeColor, 0.95);
    bg.strokeRoundedRect(-200, -16, 400, 32, 8);
    const lbl = this.add
      .text(0, 0, text, {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#86efac',
      })
      .setOrigin(0.5);
    c.add([bg, lbl]);
    this.geigerBadge = c;
  }

  // ==========================================
  // DAY 6: MARS GREENHOUSE & CREW ROTATION
  // ==========================================
  initDay6Surface() {
    this.cameras.main.scrollX = 0;

    ['solar_panel', 'reactor'].forEach((id) => {
      const st = this.stations.find((s) => s.def.id === id);
      if (st) st.setVisible(true);
    });
    const iceStation = this.stations.find((s) => s.def.id === 'ice_site');
    if (iceStation) iceStation.setVisible(false);

    const ghStation = this.stations.find((s) => s.def.id === 'greenhouse');
    if (ghStation) {
      ghStation.setVisible(!!gameState.d6GreenhouseBuilt);
    }

    this.createGeigerBadge('GEIGER ALERT: 21.08 uGy/hr — LIMIT EVA TIME!', 0xfbbf24);

    if (!gameState.d6GreenhouseBuilt) {
      this.createSurfaceGuide(ghStation, 'Build Greenhouse', 0x22c55e, true);
    } else if (gameState.d6SwappedToMaisha && !gameState.d6CropsPlanted) {
      this.createSurfaceGuide(ghStation, 'Plant Crops', 0x4ade80, false);
    }

    if (!gameState.d6SurfaceIntroDone) {
      gameState.d6SurfaceIntroDone = true;
      gameState.saveCheckpoint('d6_surface_entry');
      this.transitioning = true;
      this.time.delayedCall(250, () => {
        this.dialogueBox.showSequence(
          [
            {
              speaker: 'Muntasir',
              text: "The Geiger counter is climbing fast out here! Let's hurry to the Greenhouse plot, assemble the dome quickly, and minimize our exposure!",
              target: this.player,
            },
          ],
          () => {
            this.transitioning = false;
            this.game.events.emit('radiation:start-d6-surface');
          }
        );
      });
    } else if (!gameState.d6CropsPlanted) {
      this.game.events.emit('radiation:start-d6-surface');
      if (gameState.d6GreenhouseBuilt && !gameState.d6SwappedToMaisha) {
        this.time.delayedCall(250, () => this.showDay6SwapChoice());
      }
    }
  }

  createSurfaceGuide(station, labelText, colorHex = 0x22c55e, dotted = false) {
    if (!station) return;
    station.allowBuildInteract = dotted;
    station.customPromptLabel = labelText;

    if (this.surfaceDottedBox) {
      this.surfaceDottedBox.destroy();
      this.surfaceDottedBox = null;
    }
    if (this.surfaceGuide) {
      this.surfaceGuide.destroy();
      this.surfaceGuide = null;
    }

    const { x, y, w, h } = station.def;
    const by = y - h;
    if (dotted) {
      this.surfaceDottedBox = this.add.graphics().setDepth(DEPTH.WORLD_MIN + y - 1);
      this.surfaceDottedBox.fillStyle(colorHex, 0.16);
      this.surfaceDottedBox.fillRect(x - w / 2, by, w, h);
      this.drawDashedRect(this.surfaceDottedBox, x - w / 2, by, w, h, colorHex, 3, 8, 6);
    }

    const guide = this.add.container(x, by - 34).setDepth(900);
    const label = this.add
      .text(0, -18, labelText, {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#0f172a',
        backgroundColor: colorHex === 0x38bdf8 ? '#38bdf8' : '#4ade80',
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5);
    const arrow = this.add
      .text(0, 4, '▼', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: colorHex === 0x38bdf8 ? '#7dd3fc' : '#86efac',
      })
      .setOrigin(0.5);
    guide.add([label, arrow]);
    this.tweens.add({
      targets: guide,
      y: by - 24,
      duration: 550,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.surfaceGuide = guide;
  }

  clearSurfaceGuide() {
    if (this.surfaceDottedBox) {
      this.surfaceDottedBox.destroy();
      this.surfaceDottedBox = null;
    }
    if (this.surfaceGuide) {
      this.surfaceGuide.destroy();
      this.surfaceGuide = null;
    }
  }

  onDay6GreenhouseBuilt() {
    this.clearSurfaceGuide();
    this.game.events.emit('radiation:stop-d6-surface');

    const ghStation = this.stations.find((s) => s.def.id === 'greenhouse');
    if (ghStation) {
      ghStation.setVisible(true);
      ghStation.allowBuildInteract = false;
      ghStation.customPromptLabel = 'Plant Space Crops';
    }

    gameState.setMeters({ radiation: 52 });
    gameState.saveCheckpoint('d6_after_greenhouse');

    if (!this.companion) {
      this.companion = new Astronaut(this, GAME_WIDTH - 120, LANE.top + 48, {
        name: 'Maisha',
        color: COLORS.maisha,
      });
    }

    this.transitioning = true;
    this.walkActorTo(this.companion, 820, LANE.top + 52, 310, () => {
      this.companion.body_.setFlipX(true);
      this.dialogueBox.showSequence(
        [
          {
            speaker: 'Muntasir',
            text: "Ugh... the greenhouse frame is up, but my radiation dosimeter is flashing red! I'm feeling dizzy from radiation sickness!",
            target: this.player,
            exclamation: true,
          },
          {
            speaker: 'Maisha',
            text: "Stop right there, Muntasir! Your exposure dropped to half—if you stay out to farm the seeds, it will hit dangerous biological limits. Let's swap shifts right now!",
            target: this.companion,
          },
        ],
        () => {
          this.showDay6SwapChoice();
        }
      );
    });
  }

  showDay6SwapChoice() {
    if (this.swapModal) {
      this.swapModal.destroy();
      this.swapModal = null;
    }
    this.transitioning = true;
    this.game.events.emit('radiation:stop-d6-surface');

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const modal = this.add.container(cx, cy).setDepth(2300);

    const dim = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72).setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(0x0f172a, 0.97);
    panel.fillRoundedRect(-280, -145, 560, 290, 14);
    panel.lineStyle(3, 0xfbbf24, 1);
    panel.strokeRoundedRect(-280, -145, 560, 290, 14);

    const title = this.add
      .text(0, -104, 'CREW RADIATION EXPOSURE CHOICE', {
        fontFamily: 'monospace',
        fontSize: '17px',
        fontStyle: 'bold',
        color: '#ffd166',
      })
      .setOrigin(0.5);

    const desc = this.add
      .text(
        0,
        -48,
        "Muntasir's Radiation Meter dropped to 52% while assembling the greenhouse.\nWho should farm and seed the hydroponic crops now?",
        {
          fontFamily: 'monospace',
          fontSize: '12px',
          align: 'center',
          lineSpacing: 5,
          color: '#e2e8f0',
          wordWrap: { width: 510 },
        }
      )
      .setOrigin(0.5);

    // Choice 1 (Canon): Swap with Maisha
    const swapBtnBg = this.add.rectangle(0, 28, 440, 44, 0x16a34a, 1).setStrokeStyle(2, 0x86efac, 1);
    const swapBtnTxt = this.add
      .text(0, 28, 'SWAP WITH MAISHA (ROTATE EXPOSURE & FARM CROPS)', {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    const swapZone = this.add
      .zone(0, 28, 440, 44)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        modal.destroy();
        this.swapModal = null;
        this.executeSwapToMaisha();
      });

    // Choice 2 (Non-canon): Stay as Muntasir -> Rewind
    const stayBtnBg = this.add.rectangle(0, 88, 440, 44, 0x991b1b, 1).setStrokeStyle(2, 0xf87171, 1);
    const stayBtnTxt = this.add
      .text(0, 88, 'KEEP WORKING AS MUNTASIR (IGNORE RADIATION ALERT)', {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#fecaca',
      })
      .setOrigin(0.5);
    const stayZone = this.add
      .zone(0, 88, 440, 44)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        modal.destroy();
        this.swapModal = null;
        gameState.setMeters({ radiation: 15 });
        this.transitioning = false;
        this.game.events.emit('warning:show', {
          text: 'RADIATION SICKNESS: Pushing Muntasir past safe dose limits risks severe radiation injury! Rewind and swap with Maisha to rotate crew exposure.',
          rewindEvent: 'checkpoint:rewind-d6-swap',
        });
      });

    modal.add([dim, panel, title, desc, swapBtnBg, swapBtnTxt, swapZone, stayBtnBg, stayBtnTxt, stayZone]);
    this.swapModal = modal;
  }

  executeSwapToMaisha() {
    gameState.activeAstronaut = 'maisha';
    gameState.d6SwappedToMaisha = true;
    gameState.setMeters({ radiation: 85 });

    this.player.setIdentity('Maisha', COLORS.maisha);
    if (!this.companion) {
      this.companion = new Astronaut(this, this.player.x + 80, this.player.y + 8, {
        name: 'Muntasir',
        color: COLORS.muntasir,
      });
    } else {
      this.companion.setIdentity('Muntasir', COLORS.muntasir);
    }

    const ghStation = this.stations.find((s) => s.def.id === 'greenhouse');
    this.createSurfaceGuide(ghStation, 'Plant Crops', 0x4ade80, false);

    this.walkActorTo(this.companion, GAME_WIDTH - 135, LANE.top + 38, 300, () => {
      if (this.companion) {
        this.companion.setVisible(false);
      }
      this.transitioning = false;
      this.game.events.emit('radiation:start-d6-surface');
      this.game.events.emit('toast', 'Crew rotated! Maisha is active—plant the space crops quickly!');
    });
  }

  onDay6CropsPlanted() {
    this.clearSurfaceGuide();
    this.game.events.emit('radiation:stop-d6-surface');

    const ghStation = this.stations.find((s) => s.def.id === 'greenhouse');
    if (ghStation) {
      ghStation.customPromptLabel = 'Greenhouse (Crops Seeding)';
    }

    this.transitioning = true;
    this.time.delayedCall(250, () => {
      this.dialogueBox.showSequence(
        [
          {
            speaker: 'Maisha',
            text: 'All 4 space-crop varieties are seeded and misting! Let’s get back inside the bunker right now before the solar shower climbs any higher.',
            target: this.player,
            isThought: true,
          },
        ],
        () => {
          this.transitioning = false;
          this.game.events.emit('toast', 'Crops planted! Return inside through the Airlock.');
        }
      );
    });
  }

  // ==========================================
  // DAY 7: OPTIMIZATION, WATER-BAG SHIELDS & HARVEST
  // ==========================================
  initDay7Surface() {
    this.cameras.main.scrollX = 0;

    ['solar_panel', 'reactor', 'ice_site', 'greenhouse'].forEach((id) => {
      const st = this.stations.find((s) => s.def.id === id);
      if (st) st.setVisible(true);
    });

    const iceStation = this.stations.find((s) => s.def.id === 'ice_site');
    const ghStation = this.stations.find((s) => s.def.id === 'greenhouse');
    if (iceStation && gameState.d7IceSiteBagged) iceStation.setWaterBagShield(true);
    if (ghStation && gameState.d7GreenhouseBagged) ghStation.setWaterBagShield(true);

    if (gameState.d7OxIceLoaded && !gameState.d7GreenhouseBagged) {
      this.game.events.emit('radiation:start-d7-surface');
    }
    this.updateDay7SurfaceGuides();
  }

  updateDay7SurfaceGuides() {
    this.clearSurfaceGuide();
    const iceStation = this.stations.find((s) => s.def.id === 'ice_site');
    const ghStation = this.stations.find((s) => s.def.id === 'greenhouse');

    if (!gameState.d7IceDrilled) {
      this.createSurfaceGuide(iceStation, 'Drill Ice First', 0x38bdf8, false);
    } else if (!gameState.d7OxIceLoaded) {
      if (iceStation) iceStation.customPromptLabel = 'Ice Ready — Head Inside!';
    } else if (!gameState.d7IceSiteBagged) {
      this.createSurfaceGuide(iceStation, 'Shield Ice Site (Water Bags)', 0x38bdf8, false);
    } else if (!gameState.d7GreenhouseBagged) {
      this.createSurfaceGuide(ghStation, 'Shield Greenhouse (Water Bags)', 0x38bdf8, false);
    } else if (!gameState.d7CropsHarvested) {
      this.createSurfaceGuide(ghStation, 'Harvest Fresh Crops!', 0x4ade80, false);
    }
  }

  onDay7IceDrilled() {
    this.updateDay7SurfaceGuides();
    this.transitioning = true;
    this.time.delayedCall(250, () => {
      this.dialogueBox.showSequence(
        [
          {
            speaker: 'Maisha',
            text: 'Fresh ice core harvested! I’ll pass these ice crates inside so Muntasir can top up our Water and Oxygen tanks to 100% before we deploy the shielding bags.',
            target: this.player,
            isThought: true,
          },
        ],
        () => {
          this.transitioning = false;
          this.game.events.emit('toast', 'Ice drilled! Head inside through the Airlock to refill Water & O2.');
        }
      );
    });
  }

  onDay7IceBagged() {
    const iceStation = this.stations.find((s) => s.def.id === 'ice_site');
    if (iceStation) {
      iceStation.setWaterBagShield(true);
      iceStation.customPromptLabel = 'Ice Drill Site (Shielded)';
    }
    this.updateDay7SurfaceGuides();
    this.game.events.emit('toast', 'Ice Drill Site shielded! Now deploy water bags around the Greenhouse.');
  }

  onDay7GreenhouseBagged() {
    const ghStation = this.stations.find((s) => s.def.id === 'greenhouse');
    if (ghStation) {
      ghStation.setWaterBagShield(true);
    }
    this.updateDay7SurfaceGuides();
    this.game.events.emit('toast', 'Greenhouse shielded (Radiation 95%)! Harvest the fresh crops now!');
  }

  onDay7CropsHarvested() {
    this.clearSurfaceGuide();
    this.game.events.emit('radiation:stop-d7-surface');
    this.transitioning = true;
    this.time.delayedCall(450, () => {
      this.cameras.main.fadeOut(650, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(SCENES.CELEBRATION);
      });
    });
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
