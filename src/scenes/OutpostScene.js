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

    this.oxDottedBox = null;
    this.oxBuildGuide = null;
    this.waterDottedBox = null;
    this.waterBuildGuide = null;
    this.waterHopperGuide = null;
    this.dialogueBox = new DialogueBox(this);

    // Setup full-screen darkness & vignette around astronauts
    this.initDarkness();

    const powerStation = this.stations.find((s) => s.def.id === 'power_panel');
    const oxStation = this.stations.find((s) => s.def.id === 'oxygen_maker');
    const waterStation = this.stations.find((s) => s.def.id === 'water_station');
    const bedStation = this.stations.find((s) => s.def.id === 'bed');

    if (bedStation && (gameState.day >= 6 || (gameState.day === 5 && gameState.d5BunksBagged))) {
      bedStation.setWaterBagShield(true);
    }

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
    } else if (gameState.day === 2) {
      if (oxStation && !gameState.d2OxBuilt) oxStation.setVisible(false);
      this.initDay2Outpost();
      if (gameState.d2OxBuilt && !gameState.d2OxLoaded) {
        if (oxStation) oxStation.setVisible(true);
        this.createIceHopperGuide();
      }
    } else if (gameState.day === 3) {
      if (waterStation && !gameState.d3WaterBuilt) waterStation.setVisible(false);
      this.initDay3Outpost();
    } else if (gameState.day === 4) {
      this.initDay4Outpost();
    } else if (gameState.day === 5) {
      this.initDay5Outpost();
    } else if (gameState.day === 6) {
      this.initDay6Outpost();
    } else if (gameState.day === 7) {
      this.initDay7Outpost();
    } else {
      this.initStandardOutpost();
    }

    this.game.events.on('lights:restored', this.onLightsRestored, this);
    this.game.events.on('lights:turned-off', this.onLightsTurnedOff, this);
    this.game.events.on('lights:sync', this.syncLightsLayer, this);
    this.game.events.on('d2:oxygen-built', this.onDay2OxygenBuilt, this);
    this.game.events.on('d2:ice-loaded', this.onDay2IceLoaded, this);
    this.game.events.on('d3:water-built', this.onDay3WaterBuilt, this);
    this.game.events.on('d3:water-ice-loaded', this.onDay3WaterIceLoaded, this);
    this.game.events.on('d3:ox-ice-loaded', this.onDay3OxIceLoaded, this);
    this.game.events.on('d4:water-turned-off', this.onDay4WaterTurnedOff, this);
    this.game.events.on('d4:safe-mode-enabled', this.onDay4SafeModeEnabled, this);
    this.game.events.on('d5:bunks-bagged', this.onDay5BunksBagged, this);
    this.game.events.on('d7:water-ice-loaded', this.onDay7WaterIceLoaded, this);
    this.game.events.on('d7:ox-ice-loaded', this.onDay7OxIceLoaded, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('lights:restored', this.onLightsRestored, this);
      this.game.events.off('lights:turned-off', this.onLightsTurnedOff, this);
      this.game.events.off('lights:sync', this.syncLightsLayer, this);
      this.game.events.off('d2:oxygen-built', this.onDay2OxygenBuilt, this);
      this.game.events.off('d2:ice-loaded', this.onDay2IceLoaded, this);
      this.game.events.off('d3:water-built', this.onDay3WaterBuilt, this);
      this.game.events.off('d3:water-ice-loaded', this.onDay3WaterIceLoaded, this);
      this.game.events.off('d3:ox-ice-loaded', this.onDay3OxIceLoaded, this);
      this.game.events.off('d4:water-turned-off', this.onDay4WaterTurnedOff, this);
      this.game.events.off('d4:safe-mode-enabled', this.onDay4SafeModeEnabled, this);
      this.game.events.off('d5:bunks-bagged', this.onDay5BunksBagged, this);
      this.game.events.off('d7:water-ice-loaded', this.onDay7WaterIceLoaded, this);
      this.game.events.off('d7:ox-ice-loaded', this.onDay7OxIceLoaded, this);
      if (this.drainTimer) this.drainTimer.remove();
    });
  }

  drawBackground() {
    this.add.image(0, 0, 'bg-outpost').setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(DEPTH.BACKGROUND);
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

    if (gameState.habLightsOn || gameState.day > 2) {
      this.darknessLayer.setVisible(false);
    }
  }

  syncLightsLayer() {
    if (!this.darknessLayer) return;
    this.tweens.killTweensOf(this.darknessLayer);
    this.darknessLayer.setVisible(!gameState.habLightsOn).setAlpha(gameState.habLightsOn ? 0 : 1);
    this.lastDarkKey = null;
    if (!gameState.habLightsOn) this.redrawDarkness();
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
    if (gameState.solarDeployed || gameState.day >= 2) {
      const pp = this.stations.find((s) => s.def.id === 'power_panel');
      if (pp && pp.visible) {
        this.darknessLayer.erase(this.spotlightImg, pp.def.x, pp.def.y - 60);
      }
      const bed = this.stations.find((s) => s.def.id === 'bed');
      if (bed && bed.visible) {
        this.darknessLayer.erase(this.spotlightImg, bed.def.x, bed.def.y - 40);
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
      if (!gameState.seenLightsThought) {
        gameState.seenLightsThought = true;
        this.transitioning = true;
        this.time.delayedCall(300, () => {
          this.dialogueBox.showSequence(
            [
              {
                speaker: 'Maisha',
                isThought: true,
                target: this.player,
                text: 'Muntasir connected the solar array! I should walk over to the Power Panel and flip the breaker switch to turn on the habitat lights.',
              },
            ],
            () => {
              this.transitioning = false;
            }
          );
        });
      }
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

  createPowerPanelGuide(labelText = 'Turn on lights') {
    const pp = this.stations.find((s) => s.def.id === 'power_panel');
    if (!pp) return;

    if (this.powerHighlight) {
      this.powerHighlight.destroy();
      this.powerHighlight = null;
    }
    if (this.powerGuide) {
      this.powerGuide.destroy();
      this.powerGuide = null;
    }

    // Highlight box around the power panel
    this.powerHighlight = this.add.graphics().setDepth(850);
    this.powerHighlight.lineStyle(3, 0xffd166, 0.95);
    this.powerHighlight.strokeRect(
      pp.def.x - pp.def.w / 2 - 6,
      pp.def.y - pp.def.h - 6,
      pp.def.w + 12,
      pp.def.h + 12
    );

    // Indication arrow on the Power Panel
    this.powerGuide = this.add.container(pp.def.x, pp.def.y - pp.def.h - 32).setDepth(900);
    const label = this.add
      .text(0, -22, labelText, {
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

    if (gameState.day === 1 && !gameState.lightsIntroDone) {
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
            },
            {
              speaker: 'Muntasir',
              text: "Seems like we are both tired. Let's have some rest on our bunks.",
              target: this.companion,
            },
          ],
          () => {
            this.game.events.emit(
              'fact:show',
              'Fact: Mars surface has about 43% light level of earth, so its also harder for solar panels to recharge there'
            );
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
    if (this.powerGuide) {
      this.powerGuide.destroy();
      this.powerGuide = null;
    }
    if (this.powerHighlight) {
      this.powerHighlight.destroy();
      this.powerHighlight = null;
    }

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

  // ==========================================
  // DAY 2: DUST AND AIR
  // ==========================================
  initDay2Outpost() {
    this.syncLightsLayer();

    // Phase 1: Morning wake-up (dust on solar array)
    if (!gameState.d2IntroDone) {
      gameState.d2IntroDone = true;
      gameState.habLightsOn = true;
      this.syncLightsLayer();
      this.game.events.emit('power:start-dust-drain');

      this.player.body_.setFlipX(true);
      this.companion = new Astronaut(this, 500, LANE.top + 42, {
        name: 'Maisha',
        color: COLORS.maisha,
      });
      this.companion.body_.setFlipX(false);

      this.transitioning = true;
      this.time.delayedCall(350, () => {
        this.dialogueBox.showSequence(
          [
            {
              speaker: 'Maisha',
              text: "Good morning, Muntasir! Look at our Power meter—it's shaking and dropping slowly!",
              target: this.companion,
            },
            {
              speaker: 'Muntasir',
              text: 'An overnight Martian dust storm must have coated our solar array outside!',
              target: this.player,
            },
            {
              speaker: 'Muntasir',
              text: 'I should go outside through the Airlock and wipe the dust off the solar panel.',
              target: this.player,
              isThought: true,
            },
          ],
          () => {
            this.transitioning = false;
            this.game.events.emit(
              'fact:show',
              "Fact: NASA's Mars Exploration Rover Opportunity went silent in the global Martian dust storm of June 2018, and its mission was declared over in February 2019."
            );
          }
        );
      });
      return;
    }

    // Phase 2: Maisha returned with ice core, ready to build Oxygen Maker
    if (gameState.d2IceDrilled && !gameState.d2OxBuilt) {
      this.companion = new Astronaut(this, 185, LANE.top + 42, {
        name: 'Muntasir',
        color: COLORS.muntasir,
      });
      this.companion.body_.setFlipX(false);

      this.createOxygenBuildGuide();

      if (!gameState.d2BuildThoughtDone) {
        gameState.d2BuildThoughtDone = true;
        this.transitioning = true;
        this.time.delayedCall(250, () => {
          this.dialogueBox.showSequence(
            [
              {
                speaker: 'Maisha',
                text: 'Muntasir drilled the Martian ice! I can assemble the Oxygen Maker right here and split the water into breathable O2.',
                target: this.player,
                isThought: true,
              },
            ],
            () => {
              this.transitioning = false;
            }
          );
        });
      }
      return;
    }

    // Before ice is drilled (returning briefly): Muntasir still needs to go outside
    if (!gameState.d2IceDrilled) {
      this.companion = new Astronaut(this, 500, LANE.top + 42, {
        name: 'Maisha',
        color: COLORS.maisha,
      });
      this.companion.body_.setFlipX(false);
    }
  }

  createOxygenBuildGuide() {
    const ox = this.stations.find((s) => s.def.id === 'oxygen_maker');
    if (!ox) return;

    ox.setVisible(false);
    ox.allowBuildInteract = true;
    ox.customPromptLabel = 'Build Oxygen Maker';

    const bx = ox.def.x - ox.def.w / 2;
    const by = ox.def.y - ox.def.h;
    this.oxDottedBox = this.add.graphics().setDepth(DEPTH.WORLD_MIN + ox.def.y - 1);
    this.oxDottedBox.fillStyle(0x38bdf8, 0.14);
    this.oxDottedBox.fillRect(bx, by, ox.def.w, ox.def.h);
    this.oxDottedBox.lineStyle(2.5, 0x38bdf8, 0.95);
    this.oxDottedBox.strokeRect(bx, by, ox.def.w, ox.def.h);

    this.oxBuildGuide = this.add.container(ox.def.x, by - 28).setDepth(900);
    const label = this.add
      .text(0, -22, 'Build Oxygen Maker', {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        backgroundColor: '#38bdf8',
        color: '#0f172a',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5);
    const arrow = this.add
      .text(0, 2, '▼', {
        fontFamily: 'monospace',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#7dd3fc',
      })
      .setOrigin(0.5);
    this.oxBuildGuide.add([label, arrow]);

    this.tweens.add({
      targets: this.oxBuildGuide,
      y: by - 42,
      duration: 550,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  createIceHopperGuide() {
    const ox = this.stations.find((s) => s.def.id === 'oxygen_maker');
    if (!ox) return;

    ox.setVisible(true);
    ox.allowBuildInteract = true;
    ox.customPromptLabel = 'Load Ice into Hopper';

    if (this.hopperGuide) {
      this.hopperGuide.destroy();
      this.hopperGuide = null;
    }

    const by = ox.def.y - ox.def.h;
    this.hopperGuide = this.add.container(ox.def.x, by - 28).setDepth(900);
    const label = this.add
      .text(0, -22, 'Load Ice into Hopper', {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        backgroundColor: '#38bdf8',
        color: '#0f172a',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5);
    const arrow = this.add
      .text(0, 2, '▼', {
        fontFamily: 'monospace',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#7dd3fc',
      })
      .setOrigin(0.5);
    this.hopperGuide.add([label, arrow]);

    this.tweens.add({
      targets: this.hopperGuide,
      y: by - 42,
      duration: 550,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  onDay2OxygenBuilt() {
    if (this.oxDottedBox) {
      this.oxDottedBox.destroy();
      this.oxDottedBox = null;
    }
    if (this.oxBuildGuide) {
      this.oxBuildGuide.destroy();
      this.oxBuildGuide = null;
    }

    this.createIceHopperGuide();

    this.transitioning = true;
    this.time.delayedCall(350, () => {
      this.dialogueBox.showSequence(
        [
          {
            speaker: 'Maisha',
            text: 'Great! The Oxygen Maker is assembled and wired into the habitat power grid.',
            target: this.player,
          },
          {
            speaker: 'Muntasir',
            text: 'Now we need to feed our harvested Martian ice blocks into its top Hopper so it can melt the ice and produce breathable air.',
            target: this.companion,
          },
          {
            speaker: 'Maisha',
            text: 'I should walk up to the Oxygen Maker and load the ice blocks into the Hopper.',
            target: this.player,
            isThought: true,
          },
        ],
        () => {
          this.transitioning = false;
        }
      );
    });
  }

  onDay2IceLoaded() {
    if (this.hopperGuide) {
      this.hopperGuide.destroy();
      this.hopperGuide = null;
    }

    const ox = this.stations.find((s) => s.def.id === 'oxygen_maker');
    if (ox) {
      ox.allowBuildInteract = false;
      ox.customPromptLabel = null;
      ox.setVisible(true);
    }

    if (!gameState.d2NightIntroDone) {
      gameState.d2NightIntroDone = true;
      gameState.saveCheckpoint('d2_night_ready');
      if (gameState.snapshots?.d2_night_ready?.meters) {
        gameState.snapshots.d2_night_ready.meters.oxygen = 100;
      }

      this.transitioning = true;
      this.time.delayedCall(350, () => {
        this.dialogueBox.showSequence(
          [
            {
              speaker: 'Maisha',
              text: 'The ice is melting inside the Hopper! Fresh breathable oxygen is flowing into the habitat now.',
              target: this.player,
            },
            {
              speaker: 'Muntasir',
              text: 'Night has fallen and the solar panels cannot charge in the dark, so keeping both the lights and the Oxygen Maker running all night will drain our battery.',
              target: this.companion,
              onStart: () => {
                this.startNightDrain();
              },
            },
            {
              speaker: 'Maisha',
              text: 'I should open the Power Panel and turn off the habitat lights to save power for the Oxygen Maker before we rest on the bunks.',
              target: this.player,
              isThought: true,
            },
          ],
          () => {
            this.game.events.emit(
              'fact:show',
              "Fact: On Mars, splitting water with electricity makes O2 just like on the ISS. Perseverance's MOXIE also made ~122g of oxygen from Martian CO2 air. One person needs ~0.84 kg O2/day."
            );
            this.muntasirRestAtBunks();
          }
        );
      });
    }
  }

  // ==========================================
  // DAY 3: WATER RECOVERY & ICE PIPELINE
  // ==========================================
  initDay3Outpost() {
    this.syncLightsLayer();

    // Phase 1: Morning wake-up (thirst & water station salvage)
    if (!gameState.d3IntroDone) {
      gameState.d3IntroDone = true;
      gameState.habLightsOn = true;
      this.syncLightsLayer();

      this.player.body_.setFlipX(true);
      this.companion = new Astronaut(this, 500, LANE.top + 42, {
        name: 'Muntasir',
        color: COLORS.muntasir,
      });
      this.companion.body_.setFlipX(false);

      this.transitioning = true;
      this.time.delayedCall(350, () => {
        this.dialogueBox.showSequence(
          [
            {
              speaker: 'Muntasir',
              text: "For the past 2 days, we didn't have water. I only had a little bit of food. I'm really hungry and dehydrated.",
              target: this.companion,
            },
            {
              speaker: 'Maisha',
              text: 'I think we have enough dried foods to last a few days.',
              target: this.player,
            },
            {
              speaker: 'Muntasir',
              text: 'But water is scarce out here on Mars, and we only have the ice which we can drill again, and use it to get water.',
              target: this.companion,
            },
            {
              speaker: 'Maisha',
              text: 'I think we can salvage the water station from our spacecraft and use it to melt and purify the ice. Let’s go get some ice from the pile outside!',
              target: this.player,
            },
          ],
          () => {
            this.transitioning = false;
            this.game.events.emit(
              'fact:show',
              "Fact: Liquid water cannot stay on Mars's low-pressure surface, so astronauts must drill buried water ice—mapped globally by NASA's Mars Reconnaissance Orbiter."
            );
          }
        );
      });
      return;
    }

    // Before outside ice is drilled
    if (!gameState.d3IceDrilled) {
      this.companion = new Astronaut(this, 500, LANE.top + 42, {
        name: 'Muntasir',
        color: COLORS.muntasir,
      });
      this.companion.body_.setFlipX(false);
      return;
    }

    // Phase 2: Ice drilled -> build 5-part connect-the-pipes Water Station
    if (!gameState.d3WaterBuilt) {
      this.companion = new Astronaut(this, 185, LANE.top + 42, {
        name: 'Muntasir',
        color: COLORS.muntasir,
      });
      this.companion.body_.setFlipX(false);

      this.createWaterBuildGuide();

      if (!gameState.d3BuildThoughtDone) {
        gameState.d3BuildThoughtDone = true;
        this.transitioning = true;
        this.time.delayedCall(250, () => {
          this.dialogueBox.showSequence(
            [
              {
                speaker: 'Maisha',
                text: 'Got the ice core! I salvaged the Water Station parts from our spacecraft—let’s connect the pipes and build it.',
                target: this.player,
                isThought: true,
              },
            ],
            () => {
              this.transitioning = false;
            }
          );
        });
      }
      return;
    }

    // Phase 3: Water Station built -> load ice into Water Station hopper
    if (!gameState.d3WaterIceLoaded) {
      this.companion = new Astronaut(this, 185, LANE.top + 42, {
        name: 'Muntasir',
        color: COLORS.muntasir,
      });
      this.companion.body_.setFlipX(false);
      this.createWaterHopperGuide();
      return;
    }

    // Phase 4: Water loaded -> Oxygen depleting -> load remaining ice into Oxygen Maker
    if (!gameState.d3OxIceLoaded) {
      this.companion = new Astronaut(this, 185, LANE.top + 42, {
        name: 'Muntasir',
        color: COLORS.muntasir,
      });
      this.companion.body_.setFlipX(false);
      this.createDay3OxHopperGuide();
      return;
    }

    // Phase 5: Nighttime checks (after rewind or re-entry)
    this.startNightDrain();
    if (gameState.habLightsOn) {
      this.createPowerPanelGuide('Turn off lights');
    }
  }

  createWaterBuildGuide() {
    const ws = this.stations.find((s) => s.def.id === 'water_station');
    if (!ws) return;

    ws.setVisible(false);
    ws.allowBuildInteract = true;
    ws.customPromptLabel = 'Build Water Station';

    if (this.waterDottedBox) {
      this.waterDottedBox.destroy();
      this.waterDottedBox = null;
    }
    if (this.waterBuildGuide) {
      this.waterBuildGuide.destroy();
      this.waterBuildGuide = null;
    }

    const bx = ws.def.x - ws.def.w / 2;
    const by = ws.def.y - ws.def.h;
    this.waterDottedBox = this.add.graphics().setDepth(DEPTH.WORLD_MIN + ws.def.y - 1);
    this.waterDottedBox.fillStyle(0x38bdf8, 0.14);
    this.waterDottedBox.fillRect(bx, by, ws.def.w, ws.def.h);
    this.waterDottedBox.lineStyle(2.5, 0x38bdf8, 0.95);
    this.waterDottedBox.strokeRect(bx, by, ws.def.w, ws.def.h);

    this.waterBuildGuide = this.add.container(ws.def.x, by - 28).setDepth(900);
    const label = this.add
      .text(0, -22, 'Build Water Station', {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        backgroundColor: '#38bdf8',
        color: '#0f172a',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5);
    const arrow = this.add
      .text(0, 2, '▼', {
        fontFamily: 'monospace',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#7dd3fc',
      })
      .setOrigin(0.5);
    this.waterBuildGuide.add([label, arrow]);

    this.tweens.add({
      targets: this.waterBuildGuide,
      y: by - 42,
      duration: 550,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  createWaterHopperGuide() {
    const ws = this.stations.find((s) => s.def.id === 'water_station');
    if (!ws) return;

    ws.setVisible(true);
    ws.allowBuildInteract = true;
    ws.customPromptLabel = 'Load Ice into Water Station';

    if (this.waterHopperGuide) {
      this.waterHopperGuide.destroy();
      this.waterHopperGuide = null;
    }

    const by = ws.def.y - ws.def.h;
    this.waterHopperGuide = this.add.container(ws.def.x, by - 28).setDepth(900);
    const label = this.add
      .text(0, -22, 'Load Ice into Water Station', {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        backgroundColor: '#38bdf8',
        color: '#0f172a',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5);
    const arrow = this.add
      .text(0, 2, '▼', {
        fontFamily: 'monospace',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#7dd3fc',
      })
      .setOrigin(0.5);
    this.waterHopperGuide.add([label, arrow]);

    this.tweens.add({
      targets: this.waterHopperGuide,
      y: by - 42,
      duration: 550,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  createDay3OxHopperGuide() {
    const ox = this.stations.find((s) => s.def.id === 'oxygen_maker');
    if (!ox) return;

    ox.setVisible(true);
    ox.allowBuildInteract = true;
    ox.customPromptLabel = 'Load Ice into Oxygen Maker';

    if (this.hopperGuide) {
      this.hopperGuide.destroy();
      this.hopperGuide = null;
    }

    const by = ox.def.y - ox.def.h;
    this.hopperGuide = this.add.container(ox.def.x, by - 28).setDepth(900);
    const label = this.add
      .text(0, -22, 'Refill O2 with Ice', {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        backgroundColor: '#38bdf8',
        color: '#0f172a',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5);
    const arrow = this.add
      .text(0, 2, '▼', {
        fontFamily: 'monospace',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#7dd3fc',
      })
      .setOrigin(0.5);
    this.hopperGuide.add([label, arrow]);

    this.tweens.add({
      targets: this.hopperGuide,
      y: by - 42,
      duration: 550,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  onDay3WaterBuilt() {
    if (this.waterDottedBox) {
      this.waterDottedBox.destroy();
      this.waterDottedBox = null;
    }
    if (this.waterBuildGuide) {
      this.waterBuildGuide.destroy();
      this.waterBuildGuide = null;
    }

    this.createWaterHopperGuide();

    this.transitioning = true;
    this.time.delayedCall(300, () => {
      this.dialogueBox.showSequence(
        [
          {
            speaker: 'Maisha',
            text: 'Now we can get fresh water here! Running the heater and filter draws extra power from our grid, though—a fair trade to stay hydrated.',
            target: this.player,
          },
          {
            speaker: 'Maisha',
            text: 'Let’s drop the Martian ice blocks into the Water Station hopper to melt and purify it!',
            target: this.player,
            isThought: true,
          },
        ],
        () => {
          this.transitioning = false;
        }
      );
    });
  }

  onDay3WaterIceLoaded() {
    if (this.waterHopperGuide) {
      this.waterHopperGuide.destroy();
      this.waterHopperGuide = null;
    }

    const ws = this.stations.find((s) => s.def.id === 'water_station');
    if (ws) {
      ws.allowBuildInteract = false;
      ws.customPromptLabel = null;
    }

    this.nearby = null;
    this.game.events.emit('prompt', null);
    this.game.events.emit('water:gradual-charge');

    this.createDay3OxHopperGuide();

    this.transitioning = true;
    this.time.delayedCall(400, () => {
      this.dialogueBox.showSequence(
        [
          {
            speaker: 'Maisha',
            text: 'Fresh purified water is filling our outpost storage tank! Wait—hear that alert chime?',
            target: this.player,
          },
          {
            speaker: 'Muntasir',
            text: 'Our oxygen meter is also depleting! Let’s put the rest of the ice on the Oxygen Maker production and call it a day.',
            target: this.companion,
            onStart: () => {
              this.game.events.emit('oxygen:start-day3-deplete');
            },
          },
          {
            speaker: 'Maisha',
            text: 'Walk over to the Oxygen Maker and load the rest of our harvested ice!',
            target: this.player,
            isThought: true,
          },
        ],
        () => {
          this.transitioning = false;
          this.game.events.emit(
            'fact:show',
            'Fact: On the International Space Station, NASA recycles ~98% of all water using heat, distillation, and filtration beds so crews never run dry!'
          );
        }
      );
    });
  }

  onDay3OxIceLoaded() {
    if (this.hopperGuide) {
      this.hopperGuide.destroy();
      this.hopperGuide = null;
    }

    const ox = this.stations.find((s) => s.def.id === 'oxygen_maker');
    if (ox) {
      ox.allowBuildInteract = false;
      ox.customPromptLabel = null;
    }

    this.nearby = null;
    this.game.events.emit('prompt', null);
    this.game.events.emit('oxygen:gradual-charge');

    this.transitioning = true;
    this.time.delayedCall(400, () => {
      this.dialogueBox.showSequence(
        [
          {
            speaker: 'Maisha',
            text: 'Nighttime is hitting again, and the power is going out faster now with both Water and Oxygen life support active.',
            target: this.player,
            onStart: () => {
              const curWater = gameState.meters.water ?? 100;
              gameState.setMeters({ power: 40, oxygen: 100, water: curWater });
              this.startNightDrain();
              gameState.saveCheckpoint('d3_night_ready');
            },
          },
          {
            speaker: 'Muntasir',
            text: 'It is more important we keep the habitat lights OFF before sleeping—while leaving Oxygen and Water production running!',
            target: this.companion,
          },
          {
            speaker: 'Maisha',
            text: 'Switch off ONLY the lights at the Power Breaker Board, then get some rest in the Bunks.',
            target: this.player,
            isThought: true,
          },
        ],
        () => {
          this.createPowerPanelGuide('Turn off lights');
          this.muntasirRestAtBunks();
        }
      );
    });
  }

  // ==========================================
  // DAY 4: SECOND DUST STORM & KILOPOWER
  // ==========================================
  initDay4Outpost() {
    this.syncLightsLayer();

    // Phase 1: Morning 2nd dust storm crisis -> pause Water Station to save power
    if (!gameState.d4IntroDone) {
      gameState.d4IntroDone = true;
      gameState.habLightsOn = true;
      this.syncLightsLayer();
      gameState.setMeters({ power: 20 });
      this.game.events.emit('power:start-dust-drain');

      this.player.body_.setFlipX(true);
      this.companion = new Astronaut(this, 500, LANE.top + 42, {
        name: 'Muntasir',
        color: COLORS.muntasir,
      });
      this.companion.body_.setFlipX(false);

      this.transitioning = true;
      this.time.delayedCall(350, () => {
        this.dialogueBox.showSequence(
          [
            {
              speaker: 'Muntasir',
              text: 'Seems like a second dust storm hit the solar panels overnight! Our power has gone down to dangerous levels.',
              target: this.companion,
              exclamation: true,
            },
            {
              speaker: 'Maisha',
              text: 'We can turn off the Water Station for now since we have enough stored to last a while, and save up on emergency power!',
              target: this.player,
            },
            {
              speaker: 'Muntasir',
              text: "I'm gonna go outside and fix the panels up once you pause the water pump.",
              target: this.companion,
            },
            {
              speaker: 'Maisha',
              text: 'Use the Power Breaker Board to switch OFF only the Water Station for now.',
              target: this.player,
              isThought: true,
            },
          ],
          () => {
            this.transitioning = false;
            this.createPowerPanelGuide('Turn off Water');
          }
        );
      });
      return;
    }

    if (!gameState.d4WaterTurnedOff) {
      this.companion = new Astronaut(this, 500, LANE.top + 42, {
        name: 'Muntasir',
        color: COLORS.muntasir,
      });
      this.companion.body_.setFlipX(false);
      this.createPowerPanelGuide('Turn off Water');
      return;
    }

    // Returning inside after Kilopower Nuclear Reactor is online outside
    if (gameState.d4ReactorBuilt) {
      this.game.events.emit('power:stop-dust-drain');
      this.game.events.emit('water:stop-day4-decay');
      gameState.habLightsOn = true;
      gameState.d2OxSwitchOn = true;
      gameState.d3WaterSwitchOn = true;
      this.syncLightsLayer();

      // Supply reliable nuclear power & keep Radiation Meter visible without altering Water reserve
      gameState.setMeters({ power: 100, radiation: 100 });
      this.ensureCommsStation();

      if (!gameState.d4CommsDone) {
        this.companion = new Astronaut(this, 500, LANE.top + 42, {
          name: 'Maisha',
          color: COLORS.maisha,
        });
        this.companion.body_.setFlipX(true);

        const commsTarget = { x: 235, y: LANE.top + 8 };
        this.transitioning = true;
        this.time.delayedCall(350, () => {
          this.dialogueBox.showSequence(
            [
              {
                speaker: 'Muntasir',
                text: 'Kilopower is online and supplying steady power! Both life support systems are running safely.',
                target: this.player,
              },
              {
                speaker: 'Maisha',
                text: 'Wait—do you hear that chime? Our Deep Space Comms console inside the bunker just locked onto a signal from Earth!',
                target: this.companion,
                exclamation: true,
              },
              {
                speaker: 'Comms (NASA DSN)',
                isRadio: true,
                target: commsTarget,
                text: '—SIGNAL LOCKED— NASA Deep Space Network to Ares Outpost: X-class solar flare observed on solar limb. Severe Coronal Mass Ejection and Solar Particle Event forecast to strike Mars tonight at 22:40 MST.',
              },
              {
                speaker: 'Maisha',
                text: "We finally heard back from Comms—and it's an urgent space-weather alert! A heavy solar storm is going to hit Mars tonight!",
                target: this.companion,
                exclamation: true,
              },
              {
                speaker: 'Muntasir',
                text: "Whoa—what is a solar storm, Maisha? Why did Comms warn us if we're already inside the habitat?",
                target: this.player,
              },
              {
                speaker: 'Maisha',
                text: 'In my academy, I learned that massive solar eruptions fire radiation and charged plasma straight into Mars, threatening any exposed or unshielded electronics!',
                target: this.companion,
              },
              {
                isFactReveal: true,
                text: 'NASA Fact — Solar Storms on Mars: A solar storm (CME & Solar Energetic Particle event) blasts high-energy radiation and plasma across space. Unlike Earth, Mars has no global magnetic field and just ~1% of Earth’s atmosphere, so particles strike directly—causing radiation spikes and voltage surges in unshielded electronics. Major events like the May 2024 X-class storm triggered global Mars auroras and Curiosity RAD alerts. (Refs: NASA DONKI; NASA MAVEN & Curiosity RAD; NASA OSDR RadLab)',
              },
              {
                speaker: 'Maisha',
                text: 'We must therefore turn off non-essential electronics around here, or switch the habitat grid into Safe Mode before sleeping!',
                target: this.companion,
              },
              {
                isFactReveal: true,
                text: 'NASA Fact — Habitat & Spacecraft Safe Mode: When a solar particle storm hits, NASA flight controllers place rovers and habitats into Safe Mode—isolating vulnerable electronic buses through surge-protection relays so induced currents cannot fry hardware, while preserving vital life-support loops. (Refs: NASA JPL Fault Protection Guide; NASA Goddard Space Weather Center)',
              },
              {
                speaker: 'Muntasir',
                text: 'Head to the Power Breaker Board and switch on SAFE MODE! Leaving electronics unprotected tonight could fry the entire bunker.',
                target: this.player,
                isThought: true,
              },
            ],
            () => {
              gameState.d4CommsDone = true;
              gameState.d4EveningDone = true;
              gameState.saveCheckpoint('d4_before_safe_mode');
              this.transitioning = false;
              this.createPowerPanelGuide('Enable Safe Mode');
            }
          );
        });
      } else if (!gameState.d4SafeModeOn) {
        this.companion = new Astronaut(this, 500, LANE.top + 42, {
          name: 'Maisha',
          color: COLORS.maisha,
        });
        this.companion.body_.setFlipX(true);
        this.transitioning = false;
        this.createPowerPanelGuide('Enable Safe Mode');
      } else if (!gameState.d4SafeModeDone) {
        this.onDay4SafeModeEnabled();
      }
      return;
    }

    // After Maisha pauses Water inside on Sol 4, Muntasir holds player control indoors to exit via Airlock
    gameState.activeAstronaut = 'muntasir';
    this.player.setIdentity('Muntasir', COLORS.muntasir);
    this.companion = new Astronaut(this, 390, LANE.top + 42, {
      name: 'Maisha',
      color: COLORS.maisha,
    });
    this.companion.body_.setFlipX(false);
    this.createStationGuide('airlock', 'Head Out: Fix Solar Panels', '#ffd166');
  }

  onDay4WaterTurnedOff() {
    if (this.powerGuide) {
      this.powerGuide.destroy();
      this.powerGuide = null;
    }
    if (this.powerHighlight) {
      this.powerHighlight.destroy();
      this.powerHighlight = null;
    }

    // Immediately swap control to Muntasir inside the Outpost while Maisha stays indoors by the panel
    gameState.activeAstronaut = 'muntasir';
    const maishaX = this.player.x;
    const maishaY = this.player.y;
    const muntX = this.companion ? this.companion.x : 500;
    const muntY = this.companion ? this.companion.y : LANE.top + 42;

    this.player.setIdentity('Muntasir', COLORS.muntasir);
    this.player.setPosition(muntX, muntY);
    this.player.body_.setFlipX(false);
    this.player.syncDepth();

    if (!this.companion) {
      this.companion = new Astronaut(this, maishaX, maishaY, {
        name: 'Maisha',
        color: COLORS.maisha,
      });
    } else {
      this.companion.setIdentity('Maisha', COLORS.maisha);
      this.companion.setPosition(maishaX, maishaY);
    }
    this.companion.body_.setFlipX(false);
    this.companion.syncDepth();

    this.transitioning = true;
    this.time.delayedCall(250, () => {
      this.dialogueBox.showSequence(
        [
          {
            speaker: 'Maisha',
            text: "Water Station paused and emergency power boosted! Head outside through the Airlock, Muntasir—I'll monitor life support from inside.",
            target: this.companion,
          },
          {
            speaker: 'Muntasir',
            text: "Got it! I'll head out through the Airlock now to clean and realign the solar panels.",
            target: this.player,
            isThought: true,
          },
        ],
        () => {
          this.transitioning = false;
          this.createStationGuide('airlock', 'Head Out: Fix Solar Panels', '#ffd166');
        }
      );
    });
  }

  ensureCommsStation() {
    if (this.commsConsole) return;
    const x = 235;
    const y = LANE.top + 10;
    const c = this.add.container(x, y).setDepth(DEPTH.STATIONS);
    const panel = this.add.rectangle(0, -45, 76, 86, 0x1e293b).setStrokeStyle(2, 0x64748b);
    const screen = this.add.rectangle(0, -56, 56, 30, 0x082f49).setStrokeStyle(1, 0x38bdf8);
    const wave = this.add.graphics().lineStyle(2, 0x38bdf8, 0.9);
    wave.moveTo(-22, -56).lineTo(-10, -64).lineTo(-2, -48).lineTo(8, -62).lineTo(20, -56);
    wave.strokePath();
    const antenna = this.add.rectangle(24, -104, 4, 34, 0x94a3b8);
    const led = this.add.circle(24, -122, 5, gameState.d4SafeModeOn ? 0x50fa7b : 0xf59e0b);
    this.commsLed = led;
    this.tweens.add({
      targets: led,
      alpha: 0.25,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
    const label = this.add
      .text(0, -18, 'COMMS', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#38bdf8',
      })
      .setOrigin(0.5);
    c.add([panel, screen, wave, antenna, led, label]);
    this.commsConsole = c;
  }

  onDay4SafeModeEnabled() {
    if (this.powerGuide) {
      this.powerGuide.destroy();
      this.powerGuide = null;
    }
    if (this.powerHighlight) {
      this.powerHighlight.destroy();
      this.powerHighlight = null;
    }
    if (this.commsLed) {
      this.commsLed.setFillStyle(0x50fa7b);
    }
    if (gameState.d4SafeModeDone) return;
    gameState.d4SafeModeDone = true;

    if (!this.companion) {
      this.companion = new Astronaut(this, 500, LANE.top + 42, {
        name: 'Maisha',
        color: COLORS.maisha,
      });
      this.companion.body_.setFlipX(true);
    }

    this.transitioning = true;
    this.time.delayedCall(250, () => {
      this.dialogueBox.showSequence(
        [
          {
            speaker: 'Muntasir',
            text: 'SAFE MODE is locked in! Look at that shielding halo on our power monitor—the habitat circuits are surge-protected.',
            target: this.player,
          },
          {
            speaker: 'Maisha',
            text: 'And with Kilopower running underground, our Oxygen, Water, and thermal loops stay shielded and online all through the solar storm!',
            target: this.companion,
          },
          {
            speaker: 'Muntasir',
            text: "Even better—Earth Control knows we're alive and safe on Mars. Let's finally get some rest on the bunks.",
            target: this.player,
          },
          {
            speaker: 'Maisha',
            text: 'Right behind you—see you tomorrow morning, Commander!',
            target: this.companion,
          },
        ],
        () => {
          this.muntasirRestAtBunks();
        }
      );
    });
  }

  createStationGuide(stationId, labelText, bgColor = '#38bdf8') {
    this.clearOutpostStationGuide();
    const st = this.stations.find((s) => s.def.id === stationId);
    if (!st) return;

    const gx = st.def.x;
    const gy = st.def.y - st.def.h - 32;
    const guide = this.add.container(gx, gy).setDepth(900);
    const label = this.add
      .text(0, -18, labelText, {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#0f172a',
        backgroundColor: bgColor,
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5);
    const arrow = this.add
      .text(0, 4, '▼', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: bgColor,
      })
      .setOrigin(0.5);
    guide.add([label, arrow]);
    this.tweens.add({
      targets: guide,
      y: gy + 10,
      duration: 550,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.outpostStationGuide = guide;
  }

  clearOutpostStationGuide() {
    if (this.outpostStationGuide) {
      this.outpostStationGuide.destroy();
      this.outpostStationGuide = null;
    }
  }

  // ==========================================
  // DAY 5: SOLAR STORM SHELTER & WATER-BAG BUNKS
  // ==========================================
  initDay5Outpost() {
    if (this.darknessLayer) this.darknessLayer.setVisible(false);
    this.ensureCommsStation();

    gameState.habLightsOn = true;
    gameState.d2OxSwitchOn = true;
    gameState.d3WaterSwitchOn = true;
    gameState.d4SafeModeOn = true;

    this.game.events.emit('lifesupport:start-d5-moderate');

    if (!gameState.d5IntroDone) {
      gameState.d5IntroDone = true;
      gameState.saveCheckpoint('d5_storm_start');

      this.companion = new Astronaut(this, 500, LANE.top + 42, {
        name: 'Muntasir',
        color: COLORS.muntasir,
      });
      this.companion.body_.setFlipX(false);

      this.transitioning = true;
      this.time.delayedCall(350, () => {
        this.game.events.emit('radiation:start-d5-decay');
        this.dialogueBox.showSequence(
          [
            {
              speaker: 'Muntasir',
              text: 'Listen to that solar storm howling outside! Even with SAFE MODE protecting our electronics, gamma rays and solar particles are creeping through the bunker walls!',
              target: this.companion,
              exclamation: true,
            },
            {
              speaker: 'Maisha',
              text: 'Oxygen and water are draining normally as we breathe and drink, while our Radiation Meter is dipping. Whatever happens—DO NOT go outside through the Airlock today!',
              target: this.player,
            },
            {
              speaker: 'Muntasir',
              text: "Agreed—EVA right now would be lethal! How do we shield our Bunks before tonight's storm wave?",
              target: this.companion,
            },
            {
              speaker: 'Maisha',
              text: 'Let’s stack sealed bags of drinking water against our bunk walls! Hydrogen-rich H2O absorbs particle radiation—and because the water stays sealed, zero drinking water is wasted!',
              target: this.player,
            },
            {
              isFactReveal: true,
              text: 'NASA Fact — Mars Solar Storm & Water-Bag Shielding: In May 2024, NASA Curiosity RAD recorded a Mars peak of 303.99 uGy/hr (vs 7.83 uGy/hr normal). Hydrogen-rich water slows cosmic & solar protons without wasting mass—astronauts can even drink the sealed shielding water later! (Refs: NASA OSDR RadLab Mars-May2024; NASA JPL)',
            },
            {
              speaker: 'Maisha',
              text: 'Walk over to the Bunks and deploy all 5 H2O shield bags right now!',
              target: this.player,
              isThought: true,
            },
          ],
          () => {
            this.transitioning = false;
            this.createStationGuide('bed', 'Shield Bunks (Water Bags)', '#38bdf8');
          }
        );
      });
    } else if (!gameState.d5BunksBagged) {
      this.companion = new Astronaut(this, 500, LANE.top + 42, {
        name: 'Muntasir',
        color: COLORS.muntasir,
      });
      this.companion.body_.setFlipX(false);
      this.game.events.emit('radiation:start-d5-decay');
      this.createStationGuide('bed', 'Shield Bunks (Water Bags)', '#38bdf8');
    }
  }

  onDay5BunksBagged() {
    this.clearOutpostStationGuide();
    const bedStation = this.stations.find((s) => s.def.id === 'bed');
    if (bedStation) bedStation.setWaterBagShield(true);

    if (gameState.d5EveningDone) return;
    gameState.d5EveningDone = true;

    this.transitioning = true;
    this.time.delayedCall(280, () => {
      this.dialogueBox.showSequence(
        [
          {
            speaker: 'Muntasir',
            text: 'All 5 drinkable H2O bags are locked into our sleeping walls—look, our bunk Radiation Protection stabilized right at 95%!',
            target: this.companion || this.player,
          },
          {
            isFactReveal: true,
            text: 'NASA Fact — Low-Dose Radiation Biology (OSD-360): Even small cumulative radiation doses caused measurable tissue responses 1–4 months later in space studies—making bunk H2O shielding vital whenever solar storms hit Mars. (Refs: NASA OSDR Study OSD-360)',
          },
          {
            speaker: 'Maisha',
            text: 'Safe Mode stays locked for tonight so circuits stay safe, and our shielded bunks are ready. Rest at the Bunks until tomorrow!',
            target: this.player,
          },
        ],
        () => {
          this.muntasirRestAtBunks();
        }
      );
    });
  }

  // ==========================================
  // DAY 6: FOOD CRISIS & RADIATION SHOWER COMMS
  // ==========================================
  initDay6Outpost() {
    if (this.darknessLayer) this.darknessLayer.setVisible(false);
    this.ensureCommsStation();

    const commsTarget = { x: 235, y: LANE.top + 8 };

    if (!gameState.d6IntroDone) {
      gameState.d6IntroDone = true;
      gameState.activeAstronaut = 'muntasir';
      this.player.setIdentity('Muntasir', COLORS.muntasir);

      this.companion = new Astronaut(this, 500, LANE.top + 42, {
        name: 'Maisha',
        color: COLORS.maisha,
      });
      this.companion.body_.setFlipX(true);

      this.transitioning = true;
      this.time.delayedCall(350, () => {
        this.dialogueBox.showSequence(
          [
            {
              speaker: 'Maisha',
              text: 'Good morning! The solar storm roar outside has finally quieted down—what a relief after yesterday.',
              target: this.companion,
            },
            {
              speaker: 'Comms (NASA DSN)',
              isRadio: true,
              target: commsTarget,
              text: '—SOLAR ADVISORY— Main flare peak has subsided, but an elevated particle radiation shower (12.47–21.08 uGy/hr bursts) persists on the Martian surface. Work fast on any EVA!',
            },
            {
              speaker: 'Muntasir',
              text: 'Wait—we also have a huge problem inside! Our dry food rations are completely on the brink of finishing today!',
              target: this.player,
              exclamation: true,
            },
            {
              speaker: 'Maisha',
              text: 'Resupply from Earth takes months! Using our compact space-botany seeds from CSA and NASA OSDR research, we can assemble a closed-loop Greenhouse on the surface right now and grow fast crops!',
              target: this.companion,
            },
            {
              isFactReveal: true,
              text: 'NASA & CSA Space Food Data: Astronauts need 1,900–3,200 kcal/day, and Earth deliveries are impossible on Mars. Hydroponic studies like Arabidopsis (NASA OSDR OSD-38, OSD-16, OSD-120), dwarf wheat, lettuce & radishes provide sustainable nutrition—even inspiring northern Earth farming! (Refs: CSA Food Facts; NASA OSDR OSD-38/16/120)',
            },
            {
              speaker: 'Muntasir',
              text: "Let's head out fast through the Airlock—every second outside counts on our Radiation Meter!",
              target: this.player,
              isThought: true,
            },
          ],
          () => {
            this.transitioning = false;
            this.createStationGuide('airlock', 'Head Out: Build Greenhouse', '#4ade80');
          }
        );
      });
      return;
    }

    if (gameState.d6CropsPlanted && !gameState.d6EveningDone) {
      gameState.d6EveningDone = true;
      this.companion = new Astronaut(this, 500, LANE.top + 42, {
        name: 'Muntasir',
        color: COLORS.muntasir,
      });
      this.companion.body_.setFlipX(false);

      this.transitioning = true;
      this.time.delayedCall(320, () => {
        this.dialogueBox.showSequence(
          [
            {
              speaker: 'Muntasir',
              text: 'The radiation outside now is lethal—we have to do something about it before harvesting.',
              target: this.companion,
            },
            {
              speaker: 'Maisha',
              text: 'I think tomorrow we can deploy some water bags around the greenhouses just like we did with our bunks!',
              target: this.player,
            },
            {
              speaker: 'Muntasir',
              text: 'Hmm, water is liquid and can act like particle-slowing walls so our workstations will stay shielded the day after.',
              target: this.companion,
            },
            {
              speaker: 'Maisha',
              text: "Let's sleep for today and recover inside!",
              target: this.player,
            },
          ],
          () => {
            this.muntasirRestAtBunks();
          }
        );
      });
    }
  }

  // ==========================================
  // DAY 7: OPTIMIZATION, ICE REFILL & WATER BAGS
  // ==========================================
  initDay7Outpost() {
    if (this.darknessLayer) this.darknessLayer.setVisible(false);
    this.ensureCommsStation();

    if (!gameState.d7IntroDone) {
      gameState.d7IntroDone = true;
      gameState.activeAstronaut = 'maisha';
      this.player.setIdentity('Maisha', COLORS.maisha);

      this.companion = new Astronaut(this, 500, LANE.top + 42, {
        name: 'Muntasir',
        color: COLORS.muntasir,
      });
      this.companion.body_.setFlipX(false);

      this.transitioning = true;
      this.time.delayedCall(320, () => {
        this.dialogueBox.showSequence(
          [
            {
              speaker: 'Maisha',
              text: 'Good morning!',
              target: this.player,
            },
            {
              speaker: 'Muntasir',
              text: 'Today is our optimization day—let’s fix whatever we can so this base is completely self-sustaining!',
              target: this.companion,
            },
            {
              speaker: 'Maisha',
              text: 'We have to deploy water bags around the Greenhouse and by the Ice Drilling Site.',
              target: this.player,
            },
            {
              speaker: 'Muntasir',
              text: "Our Oxygen and Water are depleting! Let's first bring in fresh ice, because we won't have enough water for the shielding bags too.",
              target: this.companion,
            },
            {
              speaker: 'Maisha',
              text: "Let's go! I'll drill fresh subsurface ice outside, and Muntasir can load it into our stations inside!",
              target: this.player,
            },
          ],
          () => {
            this.transitioning = false;
            this.createStationGuide('airlock', 'Head Out: Drill Ice', '#38bdf8');
          }
        );
      });
      return;
    }

    if (gameState.d7IceDrilled && !gameState.d7OxIceLoaded) {
      // Maisha hands ice over at the Airlock; Muntasir loads both stations inside to 100%
      gameState.activeAstronaut = 'muntasir';
      this.player.setIdentity('Muntasir', COLORS.muntasir);
      this.companion = new Astronaut(this, 500, LANE.top + 42, {
        name: 'Maisha',
        color: COLORS.maisha,
      });
      this.companion.body_.setFlipX(true);

      if (!gameState.d7ReturnInsideIntroDone) {
        gameState.d7ReturnInsideIntroDone = true;
        this.transitioning = true;
        this.time.delayedCall(280, () => {
          this.dialogueBox.showSequence(
            [
              {
                speaker: 'Maisha',
                text: 'Here are the fresh ice cores from outside, Muntasir! Load them into our Water Station and Oxygen Maker to refill both to 100%!',
                target: this.companion,
              },
            ],
            () => {
              this.transitioning = false;
              this.createStationGuide('water_station', 'Load Ice -> 100% Water', '#38bdf8');
            }
          );
        });
      } else if (!gameState.d7WaterIceLoaded) {
        this.createStationGuide('water_station', 'Load Ice -> 100% Water', '#38bdf8');
      } else {
        this.createStationGuide('oxygen_maker', 'Load Ice -> 100% Oxygen', '#6fc3df');
      }
      return;
    }

    if (gameState.d7OxIceLoaded) {
      this.createStationGuide('airlock', 'Head Out: Shields & Harvest', '#4ade80');
    }
  }

  onDay7WaterIceLoaded() {
    this.createStationGuide('oxygen_maker', 'Load Ice -> 100% Oxygen', '#6fc3df');
    this.game.events.emit('toast', 'Water at 100%! Now load remaining ice into the Oxygen Maker.');
  }

  onDay7OxIceLoaded() {
    this.clearOutpostStationGuide();
    this.transitioning = true;
    this.time.delayedCall(280, () => {
      this.dialogueBox.showSequence(
        [
          {
            speaker: 'Muntasir',
            text: "Oxygen and Water are both back at 100%! Let's now deploy the water bags outside around the Ice Site and Greenhouse, and then we can harvest the food and call it a day!",
            target: this.player,
          },
        ],
        () => {
          this.transitioning = false;
          this.createStationGuide('airlock', 'Head Out: Deploy Shields & Harvest', '#4ade80');
        }
      );
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
