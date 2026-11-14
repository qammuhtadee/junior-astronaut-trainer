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
    this.isAutoWalking = false;

    if (!scene.anims.exists('walk')) {
      scene.anims.create({
        key: 'walk',
        frames: scene.anims.generateFrameNumbers('astronaut-walk', { start: 0, end: 7 }),
        frameRate: 14, // faster animation loop to match brisk walk
        repeat: -1,
      });
    }

    this.shadow = scene.add.ellipse(0, 0, 52, 14, 0x000000, 0.35);
    this.body_ = scene.add.sprite(0, 0, 'astronaut-walk', 0).setOrigin(0.5, 1);
    this.body_.setScale(0.323); // 85% of original size (~110px height)
    this.body_.setTint(color);

    this.body_.on('animationupdate', (_anim, frame) => {
      if (_anim.key === 'walk' && (frame.index === 2 || frame.index === 6)) {
        const now = scene.time.now;
        if (!scene.game.lastFootstepTime || now < scene.game.lastFootstepTime || now - scene.game.lastFootstepTime >= 160) {
          if (scene.cache.audio.exists('sfx-footstep')) {
            scene.game.lastFootstepTime = now;
            scene.sound.play('sfx-footstep', {
              volume: 0.45,
              detune: Phaser.Math.Between(-80, 80),
            });
          }
        }
      }
    });

    this.tag = scene.add
      .text(0, -this.body_.displayHeight - 8, name, { fontFamily: 'monospace', fontSize: '14px', color: '#fff' })
      .setOrigin(0.5, 1);

    this.add([this.shadow, this.body_, this.tag]);
    scene.add.existing(this);
    this.syncDepth();
  }

  /** dir: { x: -1..1, y: -1..1 } */
  move(dir, deltaMs) {
    if (this.isAutoWalking) return;

    const isMoving = dir.x !== 0 || dir.y !== 0;

    if (isMoving) {
      if (!this.body_.anims.isPlaying || this.body_.anims.currentAnim?.key !== 'walk') {
        this.body_.play('walk');
      }
      const dt = Math.min(deltaMs / 1000, 0.04);
      const len = Math.hypot(dir.x, dir.y) || 1;
      this.x += (dir.x / len) * PLAYER.speedX * dt;
      this.y += (dir.y / len) * PLAYER.speedX * PLAYER.speedYRatio * dt;
      this.x = Phaser.Math.Clamp(this.x, LANE.left, LANE.right);
      this.y = Phaser.Math.Clamp(this.y, LANE.top, LANE.bottom);

      if (dir.x !== 0) this.body_.setFlipX(dir.x < 0);
    } else {
      if (this.body_.anims.isPlaying) {
        this.body_.stop();
        this.body_.setFrame(0);
      }
    }

    this.syncDepth();
  }

  syncDepth() {
    this.setDepth(DEPTH.WORLD_MIN + this.y);
  }
}
