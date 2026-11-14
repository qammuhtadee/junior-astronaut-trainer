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
              gameState.setMeters({ power: 40, oxygen: 100, water: 100 });
              gameState.saveCheckpoint('d3_night_ready');
              this.startNightDrain();
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

      if (!gameState.d4EveningDone) {
        gameState.d4EveningDone = true;
        gameState.setMeters({ power: 100, oxygen: 100, water: 100 });

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
                speaker: 'Muntasir',
                text: "At least we don't have to worry about turning anything off anymore! Let's keep the lights on and turn the Water Station back ON.",
                target: this.player,
              },
              {
                speaker: 'Maisha',
                text: 'Every life support meter—Power, Oxygen, and Water—is steady at maximum! Let’s rest up in our bunks.',
                target: this.companion,
              },
            ],
            () => {
              this.muntasirRestAtBunks();
            }
          );
        });
      }
      return;
    }

    // Brief stay inside before going out on Sol 4
    this.companion = new Astronaut(this, 500, LANE.top + 42, {
      name: 'Muntasir',
      color: COLORS.muntasir,
    });
    this.companion.body_.setFlipX(false);
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

    this.transitioning = true;
    this.time.delayedCall(250, () => {
      this.dialogueBox.showSequence(
        [
          {
            speaker: 'Maisha',
            text: 'Water Station paused and emergency power boosted! Now Muntasir can head outside through the Airlock to fix the solar panels.',
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
