import Phaser from 'phaser';
import { SCENES, LANE, FADE_MS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { STATIONS } from '../data/stations.js';
import { Astronaut } from '../objects/Astronaut.js';
import { Station } from '../objects/Station.js';
import { gameState } from '../state/GameState.js';

const ROOM_TO_SCENE = { outpost: SCENES.OUTPOST, surface: SCENES.SURFACE };

/**
 * Shared behaviour for both single-screen rooms: walking, station proximity, Space to interact,
 * airlock fade. Subclasses only draw their background (drawBackground) and pick a spawn point.
 */
export class RoomScene extends Phaser.Scene {
  constructor(key, roomId) {
    super(key);
    this.roomId = roomId;
  }

  /** data.spawnX & data.spawnY place the astronaut right in front of the doorway. */
  create(data = {}) {
    gameState.room = this.roomId;
    this.companion = null;
    this.dialogueBox = null;
    this.drawBackground();

    // Only show stations that have been introduced by the story up to the current day
    this.stations = STATIONS[this.roomId]
      .filter((def) => !def.day || def.day <= gameState.day)
      .map((def) => new Station(this, def));

    const who = gameState.activeAstronaut;
    const spawnX = data.spawnX ?? this.defaultSpawnX();
    const spawnY = data.spawnY ?? LANE.top + 35;
    this.player = new Astronaut(this, spawnX, spawnY, {
      name: who === 'muntasir' ? 'Muntasir' : 'Maisha',
      color: COLORS[who],
    });

    if (data.facingLeft !== undefined) {
      this.player.body_.setFlipX(data.facingLeft);
    }

    this.cursors = this.input.keyboard.createCursorKeys();
    this.onKeySpace = () => this.tryInteract();
    this.onPointerInteract = () => this.tryInteract();
    this.input.keyboard.on('keydown-SPACE', this.onKeySpace);
    this.input.on('pointerdown', this.onPointerInteract);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.input?.keyboard && this.onKeySpace) {
        this.input.keyboard.off('keydown-SPACE', this.onKeySpace);
      }
      if (this.input && this.onPointerInteract) {
        this.input.off('pointerdown', this.onPointerInteract);
      }
      if (this.dialogueBox) {
        this.dialogueBox.destroy();
        this.dialogueBox = null;
      }
    });

    this.nearby = null;
    this.transitioning = false;
    this.cameras.main.fadeIn(FADE_MS, 0, 0, 0);
  }

  update(_time, delta) {
    if (this.transitioning || this.dialogueBox?.isActive || this.dialogueBox?.justClosed) {
      this.player.move({ x: 0, y: 0 }, delta);
      return;
    }

    const dir = {
      x: (this.cursors.right.isDown ? 1 : 0) - (this.cursors.left.isDown ? 1 : 0),
      y: (this.cursors.down.isDown ? 1 : 0) - (this.cursors.up.isDown ? 1 : 0),
    };
    this.player.move(dir, delta);

    const near =
      this.stations.find((s) => (s.visible || s.allowBuildInteract) && s.isInRange(this.player.x, this.player.y)) ??
      null;
    if (near !== this.nearby) {
      this.nearby = near;
      const label = near ? (near.customPromptLabel ?? near.def.label) : null;
      this.game.events.emit('prompt', label);
    }
  }

  tryInteract() {
    if (!this.nearby || this.transitioning || this.dialogueBox?.isActive || this.dialogueBox?.justClosed) return;
    const def = this.nearby.def;

    if (def.leadsTo) {
      // Restrict unnecessary back-and-forth room transitions on Day 1
      if (gameState.day === 1) {
        if (this.roomId === 'surface' && gameState.visitedDarkOutpost && !gameState.solarAligned) {
          this.game.events.emit('toast', 'Build and align the solar panel first!');
          return;
        }
        if (this.roomId === 'outpost' && gameState.solarDeployed && !gameState.habLightsOn) {
          if (!gameState.lightsIntroDone) {
            this.game.events.emit('toast', 'Turn on the lights at the Power Panel first!');
          } else {
            this.game.events.emit(
              'warning:show',
              "You can't navigate around without lights! Turn on the lights or rewind to the checkpoint."
            );
          }
          return;
        }
      } else if (gameState.day === 2) {
        if (this.roomId === 'surface') {
          if (!gameState.d2PanelCleaned) {
            this.game.events.emit('toast', 'Clean the solar panel first!');
            return;
          }
          if (!gameState.d2IceDrilled) {
            this.game.events.emit('toast', 'Drill for subsurface ice before heading back inside!');
            return;
          }
        }
        if (this.roomId === 'outpost' && gameState.d2IceDrilled && (!gameState.d2OxBuilt || !gameState.d2OxLoaded)) {
          this.game.events.emit(
            'toast',
            !gameState.d2OxBuilt
              ? 'Build the Oxygen Maker inside first!'
              : 'Load Martian ice into the Oxygen Maker Hopper first!'
          );
          return;
        }
      } else if (gameState.day === 3) {
        if (this.roomId === 'surface' && !gameState.d3IceDrilled) {
          this.game.events.emit('toast', 'Drill for subsurface ice before heading back inside!');
          return;
        }
        if (this.roomId === 'outpost' && gameState.d3IceDrilled) {
          if (!gameState.d3WaterBuilt) {
            this.game.events.emit('toast', 'Build the Water Station inside first!');
            return;
          }
          if (!gameState.d3WaterIceLoaded) {
            this.game.events.emit('toast', 'Load Martian ice into the Water Station first!');
            return;
          }
          if (!gameState.d3OxIceLoaded) {
            this.game.events.emit('toast', 'Load the remaining ice into the Oxygen Maker first!');
            return;
          }
        }
      } else if (gameState.day === 4) {
        if (this.roomId === 'outpost' && !gameState.d4WaterTurnedOff) {
          this.game.events.emit('toast', 'Turn off the Water Station at the Power Panel first to save power!');
          return;
        }
        if (this.roomId === 'outpost' && gameState.d4CommsDone && !gameState.d4SafeModeOn) {
          this.game.events.emit('toast', 'Solar storm inbound! Switch on SAFE MODE at the Power Panel before leaving!');
          return;
        }
        if (this.roomId === 'surface') {
          if (!gameState.d4PanelCleaned) {
            this.game.events.emit('toast', 'Clean the dust off the solar panel first!');
            return;
          }
          if (!gameState.d4PanelAligned) {
            this.game.events.emit('toast', 'Realign the solar panel toward the sun first!');
            return;
          }
          if (!gameState.d4ReactorBuilt) {
            this.game.events.emit('toast', 'Build and activate the Kilopower Nuclear Reactor before heading inside!');
            return;
          }
        }
      } else if (gameState.day === 6) {
        if (this.roomId === 'outpost' && gameState.d6CropsPlanted) {
          this.game.events.emit('toast', 'Radiation outside is lethal—rest in the Bunks for tonight!');
          return;
        }
        if (this.roomId === 'surface' && (!gameState.d6GreenhouseBuilt || !gameState.d6CropsPlanted)) {
          this.game.events.emit(
            'toast',
            !gameState.d6GreenhouseBuilt
              ? 'Assemble the Mars Greenhouse quickly before returning!'
              : 'Have Maisha finish planting the crops before going back inside!'
          );
          return;
        }
      } else if (gameState.day === 7) {
        if (this.roomId === 'outpost' && gameState.d7IceDrilled && !gameState.d7OxIceLoaded) {
          this.game.events.emit('toast', 'Load fresh ice into the Water Station and Oxygen Maker inside first!');
          return;
        }
        if (this.roomId === 'surface') {
          if (!gameState.d7IceDrilled) {
            this.game.events.emit('toast', 'Drill fresh Martian ice outside first!');
            return;
          }
          if (
            gameState.d7OxIceLoaded &&
            (!gameState.d7IceSiteBagged || !gameState.d7GreenhouseBagged || !gameState.d7CropsHarvested)
          ) {
            this.game.events.emit('toast', 'Finish deploying both Water-Bag Shields and harvesting crops outside!');
            return;
          }
        }
      }
      return this.goThroughAirlock(def.leadsTo);
    }

    if (def.id === 'solar_panel') {
      if (gameState.day === 2) {
        if (!gameState.d2PanelCleaned) {
          this.scene.pause();
          this.scene.launch('SolarCleanTask');
        } else {
          this.game.events.emit('toast', 'Solar array is clean and operating at 100%.');
        }
        return;
      }

      if (gameState.day === 3) {
        this.game.events.emit('toast', 'Solar array is clear today—focus on water and ice!');
        return;
      }

      if (gameState.day === 4) {
        if (!gameState.d4WaterTurnedOff) {
          this.game.events.emit('toast', 'Pause the Water Station at the Power Panel inside first!');
          return;
        }
        if (!gameState.d4PanelCleaned) {
          this.scene.pause();
          this.scene.launch('SolarCleanTask');
        } else if (!gameState.d4PanelAligned) {
          this.scene.pause();
          this.scene.launch('SolarAlignTask');
        } else {
          this.game.events.emit('toast', 'Solar array repaired, though Martian sunlight alone remains weak.');
        }
        return;
      }

      if (gameState.day >= 5) {
        this.game.events.emit(
          'toast',
          gameState.day === 5
            ? 'Solar array is offline during the solar storm—Kilopower reactor is powering the habitat!'
            : 'Kilopower Reactor is providing full habitat power.'
        );
        return;
      }

      if (!gameState.solarUnfurled) {
        this.unfurlAndAlignSolar(this.nearby);
        return;
      }

      if (gameState.day === 1 && gameState.solarAligned) {
        this.game.events.emit('toast', 'Solar array is aligned and perfectly fine.');
        return;
      }

      this.scene.pause();
      this.scene.launch('SolarAlignTask');
      return;
    }

    if (def.id === 'ice_site') {
      if (gameState.day === 2) {
        if (!gameState.d2PanelCleaned) {
          this.game.events.emit('toast', 'Clean the solar array first!');
        } else if (!gameState.d2IceDrilled) {
          this.scene.pause();
          this.scene.launch('IceDrillTask');
        } else {
          this.game.events.emit('toast', 'Ice core already harvested for today.');
        }
        return;
      }

      if (gameState.day === 3) {
        if (!gameState.d3IceDrilled) {
          this.scene.pause();
          this.scene.launch('IceDrillTask');
        } else {
          this.game.events.emit('toast', 'Ice core already harvested for today.');
        }
        return;
      }

      if (gameState.day >= 4 && gameState.day < 7) {
        this.game.events.emit('toast', 'No ice harvesting needed today.');
        return;
      }

      if (gameState.day === 7) {
        if (!gameState.d7IceDrilled) {
          this.scene.pause();
          this.scene.launch('IceDrillTask');
        } else if (!gameState.d7OxIceLoaded) {
          this.game.events.emit('toast', 'Take the ice inside first so Muntasir can refill Water & Oxygen!');
        } else if (!gameState.d7IceSiteBagged) {
          this.scene.pause();
          this.scene.launch('WaterBagShieldTask', { mode: 'ice_site' });
        } else {
          this.game.events.emit('toast', 'Ice Drill Site is protected with drinkable H2O bags!');
        }
        return;
      }
    }

    if (def.id === 'greenhouse') {
      if (gameState.day < 6) {
        this.game.events.emit('toast', 'No Greenhouse built yet.');
        return;
      }

      if (gameState.day === 6) {
        if (!gameState.d6GreenhouseBuilt) {
          this.scene.pause();
          this.scene.launch('GreenhouseBuildTask');
        } else if (!gameState.d6SwappedToMaisha) {
          this.game.events.emit('d6:prompt-swap');
        } else if (!gameState.d6CropsPlanted) {
          this.scene.pause();
          this.scene.launch('CropFarmTask', { mode: 'plant' });
        } else {
          this.game.events.emit('toast', 'Crops are seeded and germinating inside the Greenhouse!');
        }
        return;
      }

      if (gameState.day === 7) {
        if (!gameState.d7IceDrilled) {
          this.game.events.emit('toast', 'Drill fresh Martian ice at the Ice Site first!');
        } else if (!gameState.d7OxIceLoaded) {
          this.game.events.emit('toast', 'Load ice inside to restore Water and Oxygen to 100% first!');
        } else if (!gameState.d7IceSiteBagged) {
          this.game.events.emit('toast', 'Deploy Water-Bag Radiation Shields at the Ice Drill Site first!');
        } else if (!gameState.d7GreenhouseBagged) {
          this.scene.pause();
          this.scene.launch('WaterBagShieldTask', { mode: 'greenhouse' });
        } else if (!gameState.d7CropsHarvested) {
          this.scene.pause();
          this.scene.launch('CropFarmTask', { mode: 'harvest' });
        } else {
          this.game.events.emit('toast', 'Fresh crops harvested!');
        }
        return;
      }
    }

    if (def.id === 'water_station') {
      if (gameState.day < 3) {
        this.game.events.emit('toast', 'Water Station has not been salvaged yet.');
        return;
      }

      if (gameState.day === 3) {
        if (!gameState.d3IceDrilled) {
          this.game.events.emit('toast', 'Drill Martian ice outside first!');
        } else if (!gameState.d3WaterBuilt) {
          this.scene.pause();
          this.scene.launch('WaterBuildTask');
        } else if (!gameState.d3WaterIceLoaded) {
          this.scene.pause();
          this.scene.launch('IceLoadTask', { mode: 'water' });
        } else {
          this.game.events.emit('toast', 'Water Station is online and purifying Martian water.');
        }
        return;
      }

      if (gameState.day === 7) {
        if (!gameState.d7IceDrilled) {
          this.game.events.emit('toast', 'Maisha needs to drill fresh subsurface ice outside first!');
        } else if (!gameState.d7WaterIceLoaded) {
          this.scene.pause();
          this.scene.launch('IceLoadTask', { mode: 'd7_water' });
        } else {
          this.game.events.emit('toast', 'Water reserve restored cleanly to 100%!');
        }
        return;
      }

      if (gameState.day >= 4) {
        this.game.events.emit(
          'toast',
          !gameState.d3WaterSwitchOn
            ? 'Water Station paused temporarily to conserve emergency power.'
            : 'Water Station running continuously on nuclear power!'
        );
        return;
      }
    }

    if (def.id === 'reactor') {
      if (gameState.day < 4) {
        this.game.events.emit('toast', 'No reactor assembly needed yet.');
        return;
      }

      if (gameState.day === 4) {
        if (!gameState.d4PanelCleaned || !gameState.d4PanelAligned) {
          this.game.events.emit('toast', 'Clean and realign the solar panels first!');
        } else if (!gameState.d4ReactorBuilt) {
          this.scene.pause();
          this.scene.launch('ReactorBuildTask');
        } else {
          this.game.events.emit('toast', 'Kilopower Reactor online—delivering continuous nuclear power!');
        }
        return;
      }

      this.game.events.emit('toast', 'Kilopower Reactor online—delivering continuous nuclear power!');
      return;
    }

    if (def.id === 'oxygen_maker') {
      if (gameState.day < 2) {
        this.game.events.emit('toast', 'Oxygen Maker has not been built yet.');
        return;
      }

      if (gameState.day === 2) {
        if (!gameState.d2PanelCleaned || !gameState.d2IceDrilled) {
          this.game.events.emit('toast', 'Clean the solar array and drill Martian ice outside first!');
        } else if (!gameState.d2OxBuilt) {
          this.scene.pause();
          this.scene.launch('OxygenBuildTask');
        } else if (!gameState.d2OxLoaded) {
          this.scene.pause();
          this.scene.launch('IceLoadTask');
        } else {
          this.game.events.emit('toast', 'Oxygen Maker is online and producing breathable air.');
        }
        return;
      }

      if (gameState.day === 3) {
        if (!gameState.d3WaterIceLoaded) {
          this.game.events.emit('toast', 'Build and supply the Water Station with ice first!');
        } else if (!gameState.d3OxIceLoaded) {
          this.scene.pause();
          this.scene.launch('IceLoadTask', { mode: 'd3_oxygen' });
        } else {
          this.game.events.emit('toast', 'Oxygen Maker is online and producing breathable air.');
        }
        return;
      }

      if (gameState.day === 7) {
        if (!gameState.d7IceDrilled) {
          this.game.events.emit('toast', 'Drill fresh subsurface ice outside first!');
        } else if (!gameState.d7WaterIceLoaded) {
          this.game.events.emit('toast', 'Refill the Water Station with ice first!');
        } else if (!gameState.d7OxIceLoaded) {
          this.scene.pause();
          this.scene.launch('IceLoadTask', { mode: 'd7_oxygen' });
        } else {
          this.game.events.emit('toast', 'Oxygen reserve restored cleanly to 100%!');
        }
        return;
      }

      if (gameState.day >= 4) {
        this.game.events.emit('toast', 'Oxygen Maker is operating continuously.');
        return;
      }
    }

    if (def.id === 'power_panel') {
      if (gameState.day >= 5) {
        this.game.events.emit('toast', 'SAFE MODE is locked ON — power circuits remain surge-protected!');
        return;
      }
      if (gameState.day === 1 && !gameState.solarAligned) {
        this.game.events.emit('toast', 'Unfurl and align the solar panel outside first!');
        return;
      }
      if (gameState.day === 2 && (!gameState.d2OxBuilt || !gameState.d2OxLoaded)) {
        this.game.events.emit(
          'toast',
          !gameState.d2OxBuilt
            ? 'Build the Oxygen Maker first!'
            : 'Load Martian ice into the Oxygen Maker first!'
        );
        return;
      }
      if (
        gameState.day === 3 &&
        (!gameState.d3IceDrilled || !gameState.d3WaterBuilt || !gameState.d3WaterIceLoaded || !gameState.d3OxIceLoaded)
      ) {
        let msg = 'Load the remaining ice into the Oxygen Maker first!';
        if (!gameState.d3IceDrilled) msg = 'Drill Martian ice outside first!';
        else if (!gameState.d3WaterBuilt) msg = 'Build the Water Station first!';
        else if (!gameState.d3WaterIceLoaded) msg = 'Load ice into the Water Station first!';
        this.game.events.emit('toast', msg);
        return;
      }
      if (gameState.day === 4 && gameState.d4WaterTurnedOff) {
        if (gameState.d4CommsDone && !gameState.d4SafeModeOn) {
          this.scene.pause();
          this.scene.launch('PowerPanelTask');
          return;
        }
        this.game.events.emit(
          'toast',
          gameState.d4SafeModeOn
            ? 'Safe Mode is active and shielding all habitat circuits through tonight’s solar storm!'
            : 'Power Breaker Board locked during emergency repair—head outside to fix the solar array!'
        );
        return;
      }
      this.scene.pause();
      this.scene.launch('PowerPanelTask');
      return;
    }

    if (def.id === 'bed') {
      if (gameState.day === 5 && !gameState.d5BunksBagged) {
        this.scene.pause();
        this.scene.launch('WaterBagShieldTask', { mode: 'bunks' });
        return;
      }
      this.handleSleep();
      return;
    }

    this.game.events.emit('station:interact', { room: this.roomId, station: def.id });
  }

  unfurlAndAlignSolar(solarStation) {
    this.transitioning = true;
    this.game.events.emit('prompt', null);
    gameState.solarUnfurled = true;
    solarStation.allowBuildInteract = false;
    solarStation.customPromptLabel = null;

    if (this.onSolarUnfurlStart) {
      this.onSolarUnfurlStart();
    }

    // Flashy unfurling effect
    this.cameras.main.flash(350, 255, 220, 100);
    solarStation.setVisible(true);
    solarStation.setScale(0.05, 1);

    this.tweens.add({
      targets: solarStation,
      scaleX: 1,
      duration: 900,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(350, () => {
          this.transitioning = false;
          this.scene.pause();
          this.scene.launch('SolarAlignTask');
        });
      },
    });
  }

  promptPowerPanelReminder(text, toastFallback) {
    if (this.createStationGuide) {
      this.createStationGuide('power_panel', 'Adjust Power Panel', '#fbbf24');
    }
    const speaker = gameState.activeAstronaut === 'maisha' ? 'Muntasir' : 'Maisha';
    if (this.dialogueBox && !this.transitioning) {
      this.transitioning = true;
      this.dialogueBox.showSequence(
        [
          {
            speaker,
            text,
            target: this.companion || this.player,
          },
        ],
        () => {
          this.transitioning = false;
        }
      );
    } else {
      this.game.events.emit('toast', toastFallback);
    }
  }

  handleSleep() {
    if (gameState.day === 1) {
      if (!gameState.solarAligned) {
        this.game.events.emit('toast', 'Unfurl and align the solar panel outside first!');
        return;
      }

      if (!gameState.habLightsOn) {
        if (!gameState.lightsIntroDone) {
          this.game.events.emit('toast', 'Turn on the lights at the Power Panel first!');
        } else {
          this.game.events.emit(
            'warning:show',
            "You can't navigate around without lights! Turn on the lights before resting."
          );
        }
        return;
      }

      this.runSleepTransition(
        'END OF SOL 1\n\nMuntasir and Maisha rest on their bunks.\nOvernight, a Martian dust storm sweeps across the outpost and coats the solar panels...\n\nSOL 2 BEGINS',
        () => {
          // Advance to Day 2
          gameState.nightDrainActive = false;
          gameState.habLightsOn = true;
          gameState.goTo('d2_dust');
          gameState.activeAstronaut = 'muntasir';
          this.scene.restart();
        },
        true
      );
    } else if (gameState.day === 2) {
      if (!gameState.d2OxBuilt) {
        this.game.events.emit('toast', 'Build the Oxygen Maker first!');
        return;
      }

      if (!gameState.d2OxLoaded) {
        this.game.events.emit('toast', 'Load Martian ice into the Oxygen Maker Hopper first!');
        return;
      }

      if (!gameState.d2OxSwitchOn) {
        this.promptPowerPanelReminder(
          'Hold on! Our Oxygen Maker is switched OFF right now. Go to the Power Panel and flip OXYGEN back ON before we sleep!',
          'Flip OXYGEN back ON at the Power Panel before sleeping!'
        );
        return;
      }

      if (gameState.habLightsOn) {
        this.promptPowerPanelReminder(
          'Wait—the habitat lights are still on! Running the lights and the Oxygen Maker together will drain our battery overnight. Go turn OFF only the Lights at the Power Panel first!',
          'Turn OFF only the Lights at the Power Panel before sleeping!'
        );
        return;
      }

      this.runSleepTransition(
        'END OF SOL 2\n\nWith the lights off and the Oxygen Maker humming softly, the crew rests safely through the night...\n\nSOL 3 BEGINS',
        () => {
          gameState.nightDrainActive = false;
          gameState.goTo('d3_morning');
          gameState.habLightsOn = true;
          gameState.activeAstronaut = 'maisha';
          this.scene.restart();
        }
      );
    } else if (gameState.day === 3) {
      if (!gameState.d3IceDrilled) {
        this.game.events.emit('toast', 'Drill subsurface Martian ice outside first!');
        return;
      }
      if (!gameState.d3WaterBuilt) {
        this.game.events.emit('toast', 'Build the Water Station first!');
        return;
      }
      if (!gameState.d3WaterIceLoaded) {
        this.game.events.emit('toast', 'Load ice into the Water Station first!');
        return;
      }
      if (!gameState.d3OxIceLoaded) {
        this.game.events.emit('toast', 'Load the remaining ice into the Oxygen Maker before sleeping!');
        return;
      }

      if (!gameState.d2OxSwitchOn || !gameState.d3WaterSwitchOn) {
        this.promptPowerPanelReminder(
          'Hold on! Both our Oxygen Maker and Water Station must stay ON tonight so we have clean air and water. Head to the Power Panel and switch them back ON!',
          'Keep both OXYGEN and WATER switches ON at the Power Panel!'
        );
        return;
      }

      if (gameState.habLightsOn) {
        this.promptPowerPanelReminder(
          'Wait—the habitat lights are still on! Let us switch OFF only the Lights at the Power Panel first so we save power overnight!',
          'Turn OFF only the Lights at the Power Panel before sleeping!'
        );
        return;
      }

      this.runSleepTransition(
        'END OF SOL 3\n\nWith the habitat lights off, water purified, and oxygen flowing, the crew rests safely through the night...\n\nSOL 4 BEGINS',
        () => {
          gameState.nightDrainActive = false;
          gameState.goTo('d4_morning');
          gameState.habLightsOn = true;
          gameState.d2OxSwitchOn = true;
          gameState.d3WaterSwitchOn = true;
          gameState.activeAstronaut = 'maisha';
          this.scene.restart();
        },
        true
      );
    } else if (gameState.day === 4) {
      if (!gameState.d4WaterTurnedOff) {
        this.game.events.emit('toast', 'Pause the Water Station at the Power Panel first!');
        return;
      }
      if (!gameState.d4PanelCleaned || !gameState.d4PanelAligned) {
        this.game.events.emit('toast', 'Clean and realign the solar panels outside first!');
        return;
      }
      if (!gameState.d4ReactorBuilt) {
        this.game.events.emit('toast', 'Build and activate the Kilopower Nuclear Reactor outside before sleeping!');
        return;
      }
      if (!gameState.d4CommsDone) {
        this.game.events.emit('toast', 'Listen to the incoming Comms alert first!');
        return;
      }
      if (!gameState.d4SafeModeOn) {
        gameState.setMeters({ power: 0 });
        this.game.events.emit('power:safe-mode-changed', false);
        this.game.events.emit('warning:show', {
          text: 'Warning: Sleeping without SAFE MODE during a Martian solar storm will overload and destroy the habitat electronics! Enable SAFE MODE on the Power Panel.',
          rewindEvent: 'checkpoint:rewind-d4-safemode',
        });
        return;
      }

      this.runSleepTransition(
        'END OF SOL 4\n\nOvernight, the severe solar storm sweeps across Mars—SAFE MODE shields every circuit while Kilopower keeps oxygen and thermal loops alive!\n\nSOL 5 BEGINS',
        () => {
          gameState.nightDrainActive = false;
          gameState.habLightsOn = true;
          gameState.d2OxSwitchOn = true;
          gameState.d3WaterSwitchOn = true;
          gameState.d4SafeModeOn = true;
          const prevW = gameState.meters.water;
          gameState.goTo('d5_storm');
          if (prevW !== null && prevW < gameState.meters.water) {
            gameState.setMeters({ water: prevW });
          }
          gameState.activeAstronaut = 'maisha';
          this.scene.restart();
        },
        true
      );
    } else if (gameState.day === 5) {
      if (!gameState.d5BunksBagged) {
        this.game.events.emit('toast', 'Deploy 5 sealed H2O Shield Bags around the Bunks first!');
        return;
      }
      this.game.events.emit('radiation:stop-d5-decay');
      this.game.events.emit('lifesupport:stop-d5-moderate');

      this.runSleepTransition(
        'END OF SOL 5\n\nProtected behind sealed water-bag walls and SAFE MODE electronics, the crew sleeps safely through the storm!\n\nSOL 6 BEGINS',
        () => {
          gameState.goTo('d6_morning');
          gameState.activeAstronaut = 'muntasir';
          this.scene.restart();
        },
        false
      );
    } else if (gameState.day === 6) {
      if (!gameState.d6CropsPlanted) {
        this.game.events.emit('toast', 'Build the Greenhouse and seed space crops outside first!');
        return;
      }

      this.runSleepTransition(
        'END OF SOL 6\n\nMuntasir rests away radiation fatigue indoors while Maisha’s new hydroponic seeds begin sprouting outside...\n\nSOL 7 BEGINS',
        () => {
          gameState.goTo('d7_final');
          gameState.activeAstronaut = 'maisha';
          this.scene.restart();
        },
        false
      );
    } else if (gameState.day === 7) {
      this.game.events.emit('toast', 'Complete all Sol 7 optimization tasks (Ice -> Water/O2 -> Shields -> Harvest)!');
    }
  }

  /** Fade to black, show end-of-sol message, then advance to the next Sol. */
  runSleepTransition(message, onDone, playStorm = false) {
    this.transitioning = true;
    this.game.events.emit('prompt', null);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0).setOrigin(0).setDepth(3000);
    const sleepText = this.add
      .text(cx, cy, message, {
        fontFamily: 'monospace',
        fontSize: '18px',
        align: 'center',
        lineSpacing: 10,
        color: '#ffd166',
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(3001);

    this.tweens.add({
      targets: overlay,
      fillAlpha: 1,
      duration: 800,
      onComplete: () => {
        if (playStorm) {
          this.game.events.emit('storm:transition-play', 5600);
        }
        this.tweens.add({
          targets: sleepText,
          alpha: 1,
          duration: 600,
          hold: 2600,
          yoyo: true,
          onComplete: () => {
            onDone();
          },
        });
      },
    });
  }

  goThroughAirlock(targetRoom) {
    this.transitioning = true;
    this.game.events.emit('prompt', null);

    const airlockVol = gameState.getEffectiveVolume('sfx', 0.65);
    if (airlockVol > 0 && this.cache.audio.exists('sfx-airlock')) {
      this.sound.play('sfx-airlock', { volume: airlockVol });
    }

    // When Muntasir enters the Outpost after aligning the solar panel on Day 1,
    // hand player control to Maisha inside the Outpost so she can turn on the lights.
    if (gameState.day === 1 && this.roomId === 'surface' && targetRoom === 'outpost' && gameState.solarAligned && !gameState.habLightsOn) {
      gameState.solarDeployed = true;
      gameState.activeAstronaut = 'maisha';
    }

    // When Muntasir returns inside with the ice core on Day 2, hand control to Maisha to build the Oxygen Maker.
    if (gameState.day === 2 && this.roomId === 'surface' && targetRoom === 'outpost' && gameState.d2IceDrilled && !gameState.d2OxBuilt) {
      gameState.activeAstronaut = 'maisha';
    }

    this.cameras.main.fadeOut(FADE_MS, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      const door = STATIONS[targetRoom].find((s) => s.leadsTo === this.roomId);
      const isLeftDoor = door.x < 640;
      const spawnX = isLeftDoor ? door.x + 85 : door.x - 85;
      const spawnY = door.y + 35;
      const facingLeft = !isLeftDoor;
      this.scene.start(ROOM_TO_SCENE[targetRoom], { spawnX, spawnY, facingLeft });
    });
  }

  // --- override in subclasses ---
  drawBackground() {}
  defaultSpawnX() {
    return 640;
  }
}
