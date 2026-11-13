import { RoomScene } from './RoomScene.js';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, HORIZON_Y, DEPTH, COLORS } from '../config/constants.js';
import { Astronaut } from '../objects/Astronaut.js';
import { gameState } from '../state/GameState.js';

/** Inside the outpost. */
export class OutpostScene extends RoomScene {
  constructor() {
    super(SCENES.OUTPOST, 'outpost');
  }

  create(data = {}) {
    super.create(data);

    // When Muntasir is active, show Maisha (pink) standing by the bunks
    if (gameState.activeAstronaut === 'muntasir') {
      this.companion = new Astronaut(this, GAME_WIDTH - 220, 440, {
        name: 'Maisha',
        color: COLORS.maisha,
      });
      this.companion.body_.setFlipX(true); // Facing left toward the hab center
    }
  }

  drawBackground() {
    this.add.rectangle(0, 0, GAME_WIDTH, HORIZON_Y, 0x3b3f4a).setOrigin(0).setDepth(DEPTH.BACKGROUND);
    this.add
      .rectangle(0, HORIZON_Y, GAME_WIDTH, GAME_HEIGHT - HORIZON_Y, 0x5a5048)
      .setOrigin(0)
      .setDepth(DEPTH.BACKGROUND);
  }
}
