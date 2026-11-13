import Phaser from 'phaser';
import { SCENES, LANE, FADE_MS, COLORS } from '../config/constants.js';
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

  /** data.spawnX lets the airlock place the astronaut next to the matching door. */
  create(data = {}) {
    gameState.room = this.roomId;
    this.drawBackground();

    this.stations = STATIONS[this.roomId].map((def) => new Station(this, def));

    const who = gameState.activeAstronaut;
    const spawnX = data.spawnX ?? this.defaultSpawnX();
    this.player = new Astronaut(this, spawnX, (LANE.top + LANE.bottom) / 2, {
      name: who === 'muntasir' ? 'Muntasir' : 'Maisha',
      color: COLORS[who],
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown-SPACE', () => this.tryInteract());
    this.input.on('pointerdown', () => this.tryInteract()); // tap anywhere near a station

    this.nearby = null;
    this.transitioning = false;
    this.cameras.main.fadeIn(FADE_MS, 0, 0, 0);
  }

  update(_time, delta) {
    if (this.transitioning) return;

    const dir = {
      x: (this.cursors.right.isDown ? 1 : 0) - (this.cursors.left.isDown ? 1 : 0),
      y: (this.cursors.down.isDown ? 1 : 0) - (this.cursors.up.isDown ? 1 : 0),
    };
    this.player.move(dir, delta);

    const near = this.stations.find((s) => s.isInRange(this.player.x, this.player.y)) ?? null;
    if (near !== this.nearby) {
      this.nearby = near;
      this.game.events.emit('prompt', near ? near.def.label : null);
    }
  }

  tryInteract() {
    if (!this.nearby || this.transitioning) return;
    const def = this.nearby.def;

    if (def.leadsTo) return this.goThroughAirlock(def.leadsTo);

    if (def.id === 'solar_panel') {
      this.scene.pause();
      this.scene.launch('SolarAlignTask');
      return;
    }

    // Other mini-game pop-ups plug in here. For now, announce it.
    this.game.events.emit('station:interact', { room: this.roomId, station: def.id });
  }

  goThroughAirlock(targetRoom) {
    this.transitioning = true;
    this.game.events.emit('prompt', null);
    this.cameras.main.fadeOut(FADE_MS, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      const door = STATIONS[targetRoom].find((s) => s.leadsTo === this.roomId);
      const offset = door.x < 640 ? 90 : -90; // step out beside the door, not inside it
      this.scene.start(ROOM_TO_SCENE[targetRoom], { spawnX: door.x + offset });
    });
  }

  // --- override in subclasses ---
  drawBackground() {}
  defaultSpawnX() {
    return 640;
  }
}
