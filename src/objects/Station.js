import Phaser from 'phaser';
import { DEPTH, INTERACT } from '../config/constants.js';

/**
 * A static interactable prop. Placeholder rectangle until art exists.
 * def comes from src/data/stations.js
 */
export class Station extends Phaser.GameObjects.Container {
  constructor(scene, def) {
    super(scene, def.x, def.y);
    this.def = def;

    const shadow = scene.add.ellipse(0, 0, def.w * 1.1, 16, 0x000000, 0.3);
    if (def.id === 'oxygen_maker' && scene.textures.exists('station-oxygen')) {
      const sprite = scene.add.image(0, 0, 'station-oxygen').setOrigin(0.5, 1);
      const targetH = def.h * 1.35;
      sprite.setScale(targetH / sprite.height);
      const label = scene.add
        .text(0, -sprite.displayHeight - 6, def.label, { fontFamily: 'monospace', fontSize: '13px', color: '#fff' })
        .setOrigin(0.5, 1);

      this.add([shadow, sprite, label]);
    } else {
      const box = scene.add.rectangle(0, 0, def.w, def.h, def.color).setOrigin(0.5, 1).setStrokeStyle(3, 0x000000);
      const label = scene.add
        .text(0, -def.h - 6, def.label, { fontFamily: 'monospace', fontSize: '13px', color: '#fff' })
        .setOrigin(0.5, 1);

      this.add([shadow, box, label]);
    }
    scene.add.existing(this);
    this.setDepth(DEPTH.WORLD_MIN + def.y);
  }

  /** Oval zone around the base - forgiving so kids don't need pixel-perfect alignment. */
  isInRange(x, y) {
    const dx = (x - this.x) / INTERACT.radiusX;
    const dy = (y - this.y) / INTERACT.radiusY;
    return dx * dx + dy * dy <= 1;
  }
}
