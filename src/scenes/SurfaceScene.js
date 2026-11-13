import { RoomScene } from './RoomScene.js';
import { SCENES, GAME_WIDTH, DEPTH } from '../config/constants.js';

/** The Martian surface outside the airlock. */
export class SurfaceScene extends RoomScene {
  constructor() {
    super(SCENES.SURFACE, 'surface');
  }

  drawBackground() {
    this.add.image(0, 0, 'bg-surface').setOrigin(0).setDepth(DEPTH.BACKGROUND);
  }
}
