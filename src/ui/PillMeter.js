import Phaser from 'phaser';

/**
 * Capsule / Pill style resource meter matching user sketch.
 * Circular icon badge on the left, smooth fill bar inside, percentage label on the right.
 */
export class PillMeter extends Phaser.GameObjects.Container {
  constructor(scene, x, y, { type = 'power', label = 'Power', color = 0xffd166, width = 170, height = 30 }) {
    super(scene, x, y);

    this.meterType = type;
    this.meterColor = color;
    this.meterWidth = width;
    this.meterHeight = height;
    this.currentValue = 0;
    this.targetValue = 0;

    const r = height / 2;

    // 1. Capsule Background
    this.bg = scene.add.graphics();
    this.bg.fillStyle(0x181a20, 0.9);
    this.bg.fillRoundedRect(0, 0, width, height, r);
    this.bg.lineStyle(2, 0x3d4354, 1);
    this.bg.strokeRoundedRect(0, 0, width, height, r);
    this.add(this.bg);

    // 2. Fill Bar Graphics (clipped inside the capsule)
    this.fillBar = scene.add.graphics();
    this.add(this.fillBar);

    // 3. Circular Icon Badge on the left
    this.badge = scene.add.graphics();
    this.badge.fillStyle(0x232732, 1);
    this.badge.fillCircle(r, r, r - 2);
    this.badge.lineStyle(2, 0x4f566b, 1);
    this.badge.strokeCircle(r, r, r - 2);
    this.add(this.badge);

    // 4. Procedural Vector Icon inside the badge
    this.iconGraphics = scene.add.graphics();
    this.drawIcon(r, r, type, color);
    this.add(this.iconGraphics);

    // 5. Value Text on the right of the pill
    this.valueText = scene.add
      .text(width + 10, r, '0%', {
        fontFamily: 'monospace',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0, 0.5);
    this.add(this.valueText);

    scene.add.existing(this);
  }

  drawIcon(cx, cy, type, color) {
    this.iconGraphics.clear();

    if (type === 'power') {
      // Crisp 6-point lightning bolt
      this.iconGraphics.fillStyle(color, 1);
      this.iconGraphics.beginPath();
      this.iconGraphics.moveTo(cx + 1, cy - 8);
      this.iconGraphics.lineTo(cx - 5, cy + 1);
      this.iconGraphics.lineTo(cx, cy + 1);
      this.iconGraphics.lineTo(cx - 2, cy + 8);
      this.iconGraphics.lineTo(cx + 5, cy - 1);
      this.iconGraphics.lineTo(cx, cy - 1);
      this.iconGraphics.closePath();
      this.iconGraphics.fillPath();
    } else if (type === 'oxygen') {
      // O2 text / molecule symbol
      this.iconGraphics.fillStyle(color, 1);
      this.iconGraphics.lineStyle(2, color, 1);
      this.iconGraphics.strokeCircle(cx - 2, cy - 1, 5);
      // Small subscript 2
      this.iconGraphics.fillCircle(cx + 5, cy + 4, 2.5);
    } else if (type === 'water') {
      // Clean teardrop water droplet using lineTo and arc
      this.iconGraphics.fillStyle(color, 1);
      this.iconGraphics.beginPath();
      this.iconGraphics.moveTo(cx, cy - 7);
      this.iconGraphics.lineTo(cx + 5, cy + 1);
      this.iconGraphics.arc(cx, cy + 2, 5, 0, Math.PI, false);
      this.iconGraphics.lineTo(cx - 5, cy + 1);
      this.iconGraphics.closePath();
      this.iconGraphics.fillPath();
    } else if (type === 'radiation') {
      // Trefoil radiation symbol
      this.iconGraphics.fillStyle(color, 1);
      this.iconGraphics.fillCircle(cx, cy, 2.5);
      // 3 fan blades
      for (let i = 0; i < 3; i++) {
        const angle = (i * 120 - 90) * (Math.PI / 180);
        this.iconGraphics.beginPath();
        this.iconGraphics.arc(cx, cy, 7, angle - 0.5, angle + 0.5);
        this.iconGraphics.lineTo(cx, cy);
        this.iconGraphics.closePath();
        this.iconGraphics.fillPath();
      }
    }
  }

  setValue(val, animate = true) {
    if (val === null || val === undefined) {
      this.setVisible(false);
      return;
    }
    this.setVisible(true);
    const clamped = Math.max(0, Math.min(100, Math.round(val)));

    if (!animate) {
      this.currentValue = clamped;
      this.renderFill(clamped);
      return;
    }

    if (this.tween) this.tween.stop();

    this.tween = this.scene.tweens.addCounter({
      from: this.currentValue,
      to: clamped,
      duration: 400,
      ease: 'Cubic.easeOut',
      onUpdate: (tw) => {
        const v = Math.round(tw.getValue());
        this.currentValue = v;
        this.renderFill(v);
      },
    });
  }

  renderFill(pct) {
    this.fillBar.clear();
    this.valueText.setText(`${pct}%`);

    if (pct <= 0) return;

    const r = this.meterHeight / 2;
    const startX = this.meterHeight - 2; // start after circular icon
    const maxFillWidth = this.meterWidth - startX - 4;
    const fillW = (maxFillWidth * pct) / 100;

    // Fill color (turns warning red if <= 20%)
    let fillCol = this.meterColor;
    if (pct <= 20) fillCol = 0xff3b30;

    this.fillBar.fillStyle(fillCol, 0.85);
    this.fillBar.fillRoundedRect(startX, 4, fillW, this.meterHeight - 8, (this.meterHeight - 8) / 2);

    // Hazard stripes for radiation
    if (this.meterType === 'radiation') {
      this.fillBar.lineStyle(1.5, 0x111111, 0.4);
      for (let x = startX + 4; x < startX + fillW; x += 8) {
        this.fillBar.lineBetween(x, 4, x + 4, this.meterHeight - 4);
      }
    }
  }
}
