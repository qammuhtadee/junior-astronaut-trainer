import { RoomScene } from './RoomScene.js';
import { SCENES, GAME_WIDTH, DEPTH } from '../config/constants.js';

/** The Martian surface outside the airlock. */
export class SurfaceScene extends RoomScene {
  constructor() {
    super(SCENES.SURFACE, 'surface');
  }

  drawBackground() {
    // Source art is 1024x1024; scale to full width and anchor to the top (bottom is cropped).
    const bg = this.add.image(0, 0, 'bg-surface').setOrigin(0).setDepth(DEPTH.BACKGROUND);
    bg.setScale(GAME_WIDTH / bg.width);
  }
}
