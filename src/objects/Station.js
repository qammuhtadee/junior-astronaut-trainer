import Phaser from 'phaser';
import { DEPTH, INTERACT } from '../config/constants.js';

const STATION_SPRITES = {
  oxygen_maker: { key: 'station-oxygen', scaleMul: 1.35 },
  power_panel: { key: 'station-power', scaleMul: 1.25 },
  reactor: { key: 'station-reactor', scaleMul: 1.35 },
  solar_panel: { key: 'station-solar', scaleMul: 1.35 },
  ice_site: { key: 'station-ice', scaleMul: 1.0 },
  greenhouse: { key: 'station-greenhouse', scaleMul: 1.05 },
  water_station: { key: 'station-water', scaleMul: 1.0 },
  bed: { key: 'station-bunk', scaleMul: 1.45 },
};

/**
 * A static interactable prop. Renders custom sprites where available or themed vector placeholders.
 * def comes from src/data/stations.js
 */
export class Station extends Phaser.GameObjects.Container {
  constructor(scene, def) {
    super(scene, def.x, def.y);
    this.def = def;
    this.sprite = null;
    this.waterBagLayer = null;

    const shadow = scene.add.ellipse(0, 0, def.w * 1.1, 16, 0x000000, 0.3);
    const spriteSpec = STATION_SPRITES[def.id];
    if (spriteSpec && scene.textures.exists(spriteSpec.key)) {
      const sprite = scene.add.image(0, 0, spriteSpec.key).setOrigin(0.5, 1);
      const targetH = def.h * spriteSpec.scaleMul;
      sprite.setScale(targetH / sprite.height);
      this.sprite = sprite;
      shadow.setDisplaySize(Math.max(def.w, sprite.displayWidth * 0.95), 16);
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

  /** Draw or toggle stacked translucent H2O shielding bags around this station's base. */
  setWaterBagShield(visible) {
    if (!visible) {
      if (this.waterBagLayer) this.waterBagLayer.setVisible(false);
      return;
    }
    if (!this.waterBagLayer) {
      const c = this.scene.add.container(0, 0);
      const g = this.scene.add.graphics();
      const halfW = this.def.w / 2 + 12;
      const positions = [-halfW + 14, -halfW / 2, 0, halfW / 2, halfW - 14];
      positions.forEach((bx, idx) => {
        const by = idx % 2 === 0 ? -12 : -22;
        g.fillStyle(0x38bdf8, 0.72);
        g.fillRoundedRect(bx - 16, by - 10, 32, 18, 6);
        g.lineStyle(1.5, 0xbae6fd, 0.95);
        g.strokeRoundedRect(bx - 16, by - 10, 32, 18, 6);
      });
      const badge = this.scene.add
        .text(0, -4, 'H2O SHIELD', {
          fontFamily: 'monospace',
          fontSize: '10px',
          fontStyle: 'bold',
          color: '#e0f2fe',
          backgroundColor: '#0369a1cc',
          padding: { x: 4, y: 1 },
        })
        .setOrigin(0.5, 1);
      c.add([g, badge]);
      this.add(c);
      this.waterBagLayer = c;
    }
    this.waterBagLayer.setVisible(true);
  }

  /** Oval zone around the base - forgiving so kids don't need pixel-perfect alignment. */
  isInRange(x, y) {
    const dx = (x - this.x) / INTERACT.radiusX;
    const dy = (y - this.y) / INTERACT.radiusY;
    return dx * dx + dy * dy <= 1;
  }
}
