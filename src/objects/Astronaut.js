import Phaser from 'phaser';
import { LANE, PLAYER, DEPTH } from '../config/constants.js';

/**
 * The walking astronaut. Origin is at the FEET (0.5, 1) so Y-sorting and lane clamping
 * work on the feet line. Uses a placeholder texture until the real sprite sheet is in.
 */
export class Astronaut extends Phaser.GameObjects.Container {
  constructor(scene, x, y, { name, color }) {
    super(scene, x, y);
    this.name = name;

    this.shadow = scene.add.ellipse(0, 0, 50, 14, 0x000000, 0.35);
    this.body_ = scene.add.image(0, 0, 'astronaut-placeholder').setOrigin(0.5, 1).setTint(color);
    this.tag = scene.add
      .text(0, -this.body_.height - 8, name, { fontFamily: 'monospace', fontSize: '14px', color: '#fff' })
      .setOrigin(0.5, 1);

    this.add([this.shadow, this.body_, this.tag]);
    scene.add.existing(this);
    this.syncDepth();
  }

  /** dir: { x: -1..1, y: -1..1 } */
  move(dir, deltaMs) {
    const dt = deltaMs / 1000;
    const len = Math.hypot(dir.x, dir.y) || 1;
    this.x += (dir.x / len) * PLAYER.speedX * dt;
    this.y += (dir.y / len) * PLAYER.speedX * PLAYER.speedYRatio * dt;
    this.x = Phaser.Math.Clamp(this.x, LANE.left, LANE.right);
    this.y = Phaser.Math.Clamp(this.y, LANE.top, LANE.bottom);
    if (dir.x !== 0) this.body_.setFlipX(dir.x < 0);
    this.syncDepth();
  }

  syncDepth() {
    this.setDepth(DEPTH.WORLD_MIN + this.y);
  }
}
