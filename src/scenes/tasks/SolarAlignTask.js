import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/constants.js';
import { gameState } from '../../state/GameState.js';

/**
 * Telescope Sun-Alignment mini-game (Among Us Polus style).
 * The telescope crosshair is locked at center; player steers the viewport to center the Sun.
 */
export class SolarAlignTask extends Phaser.Scene {
  constructor() {
    super('SolarAlignTask');
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const viewRadius = 220; // circular telescope aperture

    // Dark dimmed overlay behind modal
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75).setOrigin(0);

    // Modal Card / Telescope Chassis
    const chassis = this.add.container(cx, cy);

    // Outer bezel
    const bezel = this.add.circle(0, 0, viewRadius + 18, 0x1a1c23).setStrokeStyle(4, 0x3a4050);
    chassis.add(bezel);

    // Sky viewport container (clipped to circle)
    this.viewport = this.add.container(0, 0);
    chassis.add(this.viewport);

    // Circular mask so sky and sun stay inside telescope lens
    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillCircle(cx, cy, viewRadius);
    const mask = maskShape.createGeometryMask();
    this.viewport.setMask(mask);

    // Reddish Martian sky background inside telescope
    const skyBg = this.add.rectangle(0, 0, 900, 700, 0x5a2318);
    this.viewport.add(skyBg);

    // Distant faint stars / haze particles
    const haze = this.add.graphics();
    haze.fillStyle(0xffffff, 0.4);
    for (let i = 0; i < 30; i++) {
      haze.fillCircle(
        Phaser.Math.Between(-350, 350),
        Phaser.Math.Between(-250, 250),
        Phaser.Math.Between(1, 2.5)
      );
    }
    this.viewport.add(haze);

    // Glowing Sun (starts offset so player has to navigate it)
    this.sunOffset = {
      x: Phaser.Math.RND.pick([-180, 180]) + Phaser.Math.Between(-30, 30),
      y: Phaser.Math.RND.pick([-140, 140]) + Phaser.Math.Between(-20, 20),
    };

    this.sunGlow = this.add.circle(this.sunOffset.x, this.sunOffset.y, 48, 0xffd166, 0.25);
    this.sunCore = this.add.circle(this.sunOffset.x, this.sunOffset.y, 28, 0xfffae0, 1);
    this.sunCorona = this.add.circle(this.sunOffset.x, this.sunOffset.y, 36, 0xffaa00, 0.6);
    this.viewport.add([this.sunGlow, this.sunCorona, this.sunCore]);

    // Fixed HUD Overlay on top of telescope (Crosshair & Target Ring)
    this.hud = this.add.container(cx, cy);

    // Target circle (dashed gray circle, radius 36)
    this.targetRadius = 36;
    this.targetRing = this.add.graphics();
    this.drawTargetRing(0x8899aa, false);
    this.hud.add(this.targetRing);

    // Crosshairs
    const crosshair = this.add.graphics();
    crosshair.lineStyle(1.5, 0x667788, 0.8);
    // Horizontal crosshair with gap in center
    crosshair.lineBetween(-viewRadius + 20, 0, -this.targetRadius - 10, 0);
    crosshair.lineBetween(this.targetRadius + 10, 0, viewRadius - 20, 0);
    // Vertical crosshair with gap in center
    crosshair.lineBetween(0, -viewRadius + 20, 0, -this.targetRadius - 10);
    crosshair.lineBetween(0, this.targetRadius + 10, 0, viewRadius - 20);
    // Corner tick marks
    crosshair.strokeCircle(0, 0, viewRadius - 10);
    this.hud.add(crosshair);

    // Title / Instructions
    this.statusText = this.add
      .text(cx, cy - viewRadius - 38, 'ALIGN SOLAR ARRAY WITH SUN', {
        fontFamily: 'monospace',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffd166',
      })
      .setOrigin(0.5);

    this.hintText = this.add
      .text(cx, cy + viewRadius + 32, 'Use ARROW KEYS / WASD to steer camera', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#a0aab8',
      })
      .setOrigin(0.5);

    // Close button (X)
    const closeBtn = this.add
      .text(cx + viewRadius + 40, cy - viewRadius - 10, '[ESC / X]', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#ff6666',
        backgroundColor: '#220000',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.closeTask());

    // Input handlers
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.input.keyboard.on('keydown-ESC', () => this.closeTask());

    // Touch / Mouse Drag support (inverting drag like moving a telescope)
    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown && !this.completed) {
        // Inverted: dragging right moves telescope right -> sun moves left
        this.sunOffset.x -= pointer.position.x - pointer.prevPosition.x;
        this.sunOffset.y -= pointer.position.y - pointer.prevPosition.y;
        this.clampSun();
      }
    });

    this.completed = false;
    this.speed = 150; // px/sec

    // Slide up from bottom
    this.cameras.main.scrollY = 450;
    this.tweens.add({
      targets: this.cameras.main,
      scrollY: 0,
      duration: 450,
      ease: 'Back.easeOut',
    });
  }

  drawTargetRing(color, pulse = false) {
    this.targetRing.clear();
    this.targetRing.lineStyle(2, color, pulse ? 1 : 0.7);

    // Dashed circle
    const count = 16;
    for (let i = 0; i < count; i += 2) {
      const a1 = (i / count) * Math.PI * 2;
      const a2 = ((i + 1) / count) * Math.PI * 2;
      this.targetRing.beginPath();
      this.targetRing.arc(0, 0, this.targetRadius, a1, a2);
      this.targetRing.strokePath();
    }
  }

  update(_time, delta) {
    if (this.completed) return;

    const dt = delta / 1000;
    let dx = 0;
    let dy = 0;

    // Inverted telescope controls:
    // Steering UP moves camera up -> objects in sky shift DOWN (+y)
    if (this.cursors.up.isDown || this.wasd.W.isDown) dy += 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) dy -= 1;
    if (this.cursors.left.isDown || this.wasd.A.isDown) dx += 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) dx -= 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy) || 1;
      this.sunOffset.x += (dx / len) * this.speed * dt;
      this.sunOffset.y += (dy / len) * this.speed * dt;
      this.clampSun();
    }

    // Update Sun graphic positions
    this.sunGlow.setPosition(this.sunOffset.x, this.sunOffset.y);
    this.sunCorona.setPosition(this.sunOffset.x, this.sunOffset.y);
    this.sunCore.setPosition(this.sunOffset.x, this.sunOffset.y);

    // Check distance to center (0, 0)
    const dist = Math.hypot(this.sunOffset.x, this.sunOffset.y);
    const tolerance = 18; // ~15% displacement tolerance

    if (dist <= tolerance) {
      this.onAligned();
    }
  }

  clampSun() {
    this.sunOffset.x = Phaser.Math.Clamp(this.sunOffset.x, -280, 280);
    this.sunOffset.y = Phaser.Math.Clamp(this.sunOffset.y, -220, 220);
  }

  onAligned() {
    this.completed = true;

    // Snap to center
    this.tweens.add({
      targets: [this.sunGlow, this.sunCorona, this.sunCore],
      x: 0,
      y: 0,
      duration: 300,
      ease: 'Back.easeOut',
    });

    // Flash target ring green
    this.drawTargetRing(0x00ff88, true);

    // Sun flare animation
    this.tweens.add({
      targets: this.sunGlow,
      scale: 1.5,
      alpha: 0.6,
      yoyo: true,
      repeat: 1,
      duration: 350,
    });

    this.statusText.setText('ALIGNMENT LOCKED! (100% POWER)').setColor('#00ff88');
    this.hintText.setText('Solar array locked! Return inside to the bunks to rest.').setColor('#88ffbb');

    // Update game state
    gameState.goTo('d1_panel_built');

    // Close after celebration
    this.time.delayedCall(2000, () => {
      this.closeTask();
    });
  }

  closeTask() {
    this.tweens.add({
      targets: this.cameras.main,
      scrollY: 500,
      duration: 300,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.scene.stop();
        const activeRoom = gameState.room === 'surface' ? 'Surface' : 'Outpost';
        this.scene.resume(activeRoom);
      },
    });
  }
}
