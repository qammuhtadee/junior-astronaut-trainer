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
        if (this.roomId === 'outpost' && gameState.d2IceDrilled && !gameState.d2OxBuilt) {
          this.game.events.emit('toast', 'Build the Oxygen Maker inside first!');
          return;
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
    }

    if (def.id === 'oxygen_maker') {
      if (gameState.day === 2) {
        if (!gameState.d2OxBuilt) {
          this.scene.pause();
          this.scene.launch('OxygenBuildTask');
        } else {
          this.game.events.emit('toast', 'Oxygen Maker is online and producing breathable air.');
        }
        return;
      }
    }

    if (def.id === 'power_panel') {
      this.scene.pause();
      this.scene.launch('PowerPanelTask');
      return;
    }

    if (def.id === 'bed') {
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

  handleSleep() {
    if (gameState.day === 1) {
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
        }
      );
    } else if (gameState.day === 2) {
      if (!gameState.d2OxBuilt) {
        this.game.events.emit('toast', 'Build the Oxygen Maker first!');
        return;
      }

      if (gameState.habLightsOn) {
        gameState.setMeters({ power: 0 });
        this.game.events.emit('warning:show', {
          text: 'Leaving the lights on overnight with the Oxygen Maker running drained the battery to 0%! Turn off the lights at the Power Panel before sleeping.',
          rewindEvent: 'checkpoint:rewind-d2-night',
        });
        return;
      }

      this.runSleepTransition(
        'END OF SOL 2\n\nWith the lights off and the Oxygen Maker humming softly, the crew rests safely through the night...\n\nSOL 3 BEGINS',
        () => {
          gameState.goTo('d3_morning');
          gameState.habLightsOn = true;
          gameState.activeAstronaut = 'maisha';
          this.scene.restart();
        }
      );
    }
  }

  /** Fade to black, show end-of-sol message, then advance to the next Sol. */
  runSleepTransition(message, onDone) {
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
        this.tweens.add({
          targets: sleepText,
          alpha: 1,
          duration: 600,
          hold: 2600,
          yoyo: true,
          onComplete: onDone,
        });
      },
    });
  }

  goThroughAirlock(targetRoom) {
    this.transitioning = true;
    this.game.events.emit('prompt', null);

    if (this.cache.audio.exists('sfx-airlock')) {
      this.sound.play('sfx-airlock', { volume: 0.65 });
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
