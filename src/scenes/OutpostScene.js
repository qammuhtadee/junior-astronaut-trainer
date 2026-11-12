import { RoomScene } from './RoomScene.js';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, HORIZON_Y, DEPTH } from '../config/constants.js';

/** Inside the outpost. Placeholder wall/floor until the interior background is drawn. */
export class OutpostScene extends RoomScene {
  constructor() {
    super(SCENES.OUTPOST, 'outpost');
  }

  drawBackground() {
    this.add.rectangle(0, 0, GAME_WIDTH, HORIZON_Y, 0x3b3f4a).setOrigin(0).setDepth(DEPTH.BACKGROUND);
    this.add
      .rectangle(0, HORIZON_Y, GAME_WIDTH, GAME_HEIGHT - HORIZON_Y, 0x5a5048)
      .setOrigin(0)
      .setDepth(DEPTH.BACKGROUND);
  }
}
