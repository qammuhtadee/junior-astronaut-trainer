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
    this.iceDottedBox = null;
    this.iceDrillGuide = null;
    this.onSolarUnfurlStart = null;
    this.dialogueBox = new DialogueBox(this);

    // Hide solar panel station until it is actually unfurled by the player
    const solarStation = this.stations.find((s) => s.def.id === 'solar_panel');
    if (solarStation && !gameState.solarUnfurled) {
      solarStation.setVisible(false);
    }

    const iceStation = this.stations.find((s) => s.def.id === 'ice_site');
    if (iceStation && (gameState.day < 2 || !gameState.d2PanelCleaned)) {
      iceStation.setVisible(false);
    }

    this.game.events.on('solar:aligned', this.runPowerChargeUp, this);
    this.game.events.on('d2:panel-cleaned', this.onDay2PanelCleaned, this);
    this.game.events.on('d2:ice-drilled', this.onDay2IceDrilled, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('solar:aligned', this.runPowerChargeUp, this);
      this.game.events.off('d2:panel-cleaned', this.onDay2PanelCleaned, this);
      this.game.events.off('d2:ice-drilled', this.onDay2IceDrilled, this);
    });

    const isCrashIntro = data.isCrashIntro || (!gameState.hasSeenCrash && gameState.day === 1);

    if (isCrashIntro) {
      this.initCrashCutscene();
    } else if (gameState.day === 2) {
      this.initDay2Surface();
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

    // Diagonal crash into Martian soil, straightening horizontally
    this.tweens.add({
      targets: this.spacecraft,
      x: -55,
      y: 425,
      rotation: 0,
      duration: 850,
      ease: 'Quad.easeIn',
      onComplete: () => {
        // Moderate scene vibration for grittiness
        this.cameras.main.shake(650, 0.015);

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
    if (!this.spacecraft) this.spawnGroundedSpacecraft(-10, 425);

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
    if (!this.spacecraft) this.spawnGroundedSpacecraft(-10, 425);

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
            text: 'Muntasir! I just checked the life support logs—our oxygen tanks are down to 20%!',
            target: this.companion,
            exclamation: true,
          },
          {
            speaker: 'Muntasir',
            text: 'We can melt subsurface Martian ice and split water with electricity to make oxygen, just like the ISS!',
            target: this.player,
          },
          {
            isFactReveal: true,
            text: "Fact: Just like the ISS Oxygen Generation System (OGS) splits water into hydrogen and breathable oxygen via electrolysis, NASA's MOXIE experiment on Perseverance proved we can generate oxygen on Mars—producing 122 grams of pure oxygen.",
          },
          {
            speaker: 'Maisha',
            text: 'Look over there—the surface scanner found subsurface ice! Drill a core sample while I prepare the outpost.',
            target: this.companion,
          },
        ];

        this.dialogueBox.showSequence(lines, () => {
          this.transitioning = false;
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
