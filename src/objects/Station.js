import Phaser from 'phaser';
import { DEPTH, INTERACT } from '../config/constants.js';

const STATION_SPRITES = {
  oxygen_maker: { key: 'station-oxygen', scaleMul: 1.35 },
  power_panel: { key: 'station-power', scaleMul: 1.25 },
  reactor: { key: 'station-reactor', scaleMul: 1.45 },
  solar_panel: { key: 'station-solar', scaleMul: 1.35 },
};

/**
 * A static interactable prop. Renders custom sprites where available or themed vector placeholders.
 * def comes from src/data/stations.js
 */
export class Station extends Phaser.GameObjects.Container {
  constructor(scene, def) {
    super(scene, def.x, def.y);
    this.def = def;
    this.waterBagLayer = null;

    const shadow = scene.add.ellipse(0, 0, def.w * 1.1, 16, 0x000000, 0.3);
    const spriteSpec = STATION_SPRITES[def.id];
    if (spriteSpec && scene.textures.exists(spriteSpec.key)) {
      const sprite = scene.add.image(0, 0, spriteSpec.key).setOrigin(0.5, 1);
      const targetH = def.h * spriteSpec.scaleMul;
      sprite.setScale(targetH / sprite.height);
      const label = scene.add
        .text(0, -sprite.displayHeight - 6, def.label, { fontFamily: 'monospace', fontSize: '13px', color: '#fff' })
        .setOrigin(0.5, 1);

      this.add([shadow, sprite, label]);
    } else if (def.id === 'greenhouse') {
      const gfx = scene.add.graphics();
      // Hydroponic metal base
      gfx.fillStyle(0x334155, 1);
      gfx.fillRoundedRect(-def.w / 2, -26, def.w, 26, 6);
      gfx.lineStyle(2, 0x64748b, 1);
      gfx.strokeRoundedRect(-def.w / 2, -26, def.w, 26, 6);
      // Translucent dome
      gfx.fillStyle(0x22c55e, 0.25);
      gfx.fillRoundedRect(-def.w / 2 + 8, -def.h + 10, def.w - 16, def.h - 32, { tl: 48, tr: 48, bl: 4, br: 4 });
      gfx.lineStyle(2.5, 0x4ade80, 0.85);
      gfx.strokeRoundedRect(-def.w / 2 + 8, -def.h + 10, def.w - 16, def.h - 32, { tl: 48, tr: 48, bl: 4, br: 4 });
      // Interior greenery silhouette
      gfx.fillStyle(0x16a34a, 0.85);
      [-32, -8, 16, 36].forEach((gx) => {
        gfx.fillCircle(gx, -36, 9);
        gfx.fillRect(gx - 2, -34, 4, 10);
      });
      const label = scene.add
        .text(0, -def.h - 6, `${def.label} (Placeholder)`, {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#86efac',
        })
        .setOrigin(0.5, 1);

      this.add([shadow, gfx, label]);
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
