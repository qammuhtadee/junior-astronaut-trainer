import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENES } from '../../config/constants.js';
import { gameState } from '../../state/GameState.js';

const TOTAL_BAGS = 5;

const MODE_CONFIG = {
  bunks: {
    title: 'BUNKS WATER-BAG RADIATION SHIELD',
    targetLabel: 'SLEEPING BUNKS WALL',
    slotOffsets: [
      { dx: -68, dy: -66 },
      { dx: 0, dy: -74 },
      { dx: 68, dy: -66 },
      { dx: -52, dy: 44 },
      { dx: 52, dy: 44 },
    ],
  },
  ice_site: {
    title: 'ICE DRILL SITE WATER-BAG SHIELD',
    targetLabel: 'ICE DRILL WORKSTATION',
    slotOffsets: [
      { dx: -70, dy: -56 },
      { dx: 0, dy: -66 },
      { dx: 70, dy: -56 },
      { dx: -48, dy: 46 },
      { dx: 48, dy: 46 },
    ],
  },
  greenhouse: {
    title: 'GREENHOUSE WATER-BAG SHIELD',
    targetLabel: 'MARS GREENHOUSE DOME',
    slotOffsets: [
      { dx: -72, dy: -58 },
      { dx: 0, dy: -76 },
      { dx: 72, dy: -58 },
      { dx: -52, dy: 46 },
      { dx: 52, dy: 46 },
    ],
  },
};

/**
 * Reusable drag-and-drop / click-to-place Water-Bag Radiation Shielding mini-game.
 * Used on Day 5 (Bunks) and twice on Day 7 (Ice Drill Site & Greenhouse).
 */
export class WaterBagShieldTask extends Phaser.Scene {
  constructor() {
    super('WaterBagShieldTask');
  }

  create(data = {}) {
    this.completed = false;
    this.closing = false;
    this.mode = data?.mode || 'bunks';
    this.placedCount = 0;

    const cfg = MODE_CONFIG[this.mode] || MODE_CONFIG.bunks;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const panelW = 620;
    const panelH = 510;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.78).setOrigin(0);
    this.modal = this.add.container(cx, GAME_HEIGHT + 320);

    // Chassis
    const chassis = this.add.graphics();
    chassis.fillStyle(0x161b24, 1);
    chassis.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    chassis.lineStyle(3, 0x3b4459, 1);
    chassis.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    chassis.fillStyle(0x0369a1, 1);
    chassis.fillRoundedRect(-panelW / 2 + 6, -panelH / 2 + 6, panelW - 12, 42, {
      tl: 10,
      tr: 10,
      bl: 0,
      br: 0,
    });
    this.modal.add(chassis);

    this.modal.add(
      this.add
        .text(0, -panelH / 2 + 27, cfg.title, {
          fontFamily: 'monospace',
          fontSize: '15px',
          fontStyle: 'bold',
          color: '#ffffff',
        })
        .setOrigin(0.5)
    );

    const closeBtn = this.add
      .text(panelW / 2 - 30, -panelH / 2 + 27, '[X]', {
        fontFamily: 'monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#fecaca',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.closeTask());
    this.modal.add(closeBtn);

    this.statusText = this.add
      .text(0, -panelH / 2 + 66, 'DRAG OR CLICK SEALED WATER BAGS ONTO ALL 5 SHIELD SLOTS', {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffd166',
      })
      .setOrigin(0.5);
    this.modal.add(this.statusText);

    // Left rack: 5 Sealed H2O Bags
    const rackX = -175;
    const rackY = 0;
    const rackGfx = this.add.graphics();
    rackGfx.fillStyle(0x0f172a, 0.96);
    rackGfx.fillRoundedRect(rackX - 108, -148, 216, 300, 12);
    rackGfx.lineStyle(2, 0x38bdf8, 0.65);
    rackGfx.strokeRoundedRect(rackX - 108, -148, 216, 300, 12);
    this.modal.add(rackGfx);

    this.modal.add(
      this.add
        .text(rackX, -130, 'SEALED H2O BAGS (5)', {
          fontFamily: 'monospace',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#7dd3fc',
        })
        .setOrigin(0.5)
    );

    // Right panel: Target station + dashed perimeter slots
    const targetX = 122;
    const targetY = 0;
    const stageGfx = this.add.graphics();
    stageGfx.fillStyle(0x0f172a, 0.96);
    stageGfx.fillRoundedRect(targetX - 155, -148, 310, 300, 12);
    stageGfx.lineStyle(2, 0x475569, 0.9);
    stageGfx.strokeRoundedRect(targetX - 155, -148, 310, 300, 12);

    // Target structure silhouette
    stageGfx.fillStyle(this.mode === 'greenhouse' ? 0x166534 : 0x334155, 1);
    stageGfx.fillRoundedRect(targetX - 66, targetY - 40, 132, 76, 12);
    stageGfx.lineStyle(2, this.mode === 'greenhouse' ? 0x4ade80 : 0x94a3b8, 0.9);
    stageGfx.strokeRoundedRect(targetX - 66, targetY - 40, 132, 76, 12);
    this.modal.add(stageGfx);

    this.modal.add(
      this.add
        .text(targetX, targetY - 2, cfg.targetLabel, {
          fontFamily: 'monospace',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#f8fafc',
          align: 'center',
          wordWrap: { width: 120 },
        })
        .setOrigin(0.5)
    );

    // Incoming radiation arrows (turn green/deflected once shielded)
    this.radIndicator = this.add
      .text(targetX, -126, 'RADIATION FLUX: UNSHIELDED (0/5 BAGS)', {
        fontFamily: 'monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#f87171',
      })
      .setOrigin(0.5);
    this.modal.add(this.radIndicator);

    this.slots = cfg.slotOffsets.map((off, idx) => {
      const sx = targetX + off.dx;
      const sy = targetY + off.dy;
      const box = this.add.graphics();
      box.lineStyle(2, 0x38bdf8, 0.75);
      box.strokeRoundedRect(sx - 28, sy - 16, 56, 32, 8);
      box.fillStyle(0x082f49, 0.45);
      box.fillRoundedRect(sx - 28, sy - 16, 56, 32, 8);
      this.modal.add(box);

      const hint = this.add
        .text(sx, sy, `BAG ${idx + 1}`, {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#7dd3fc',
        })
        .setOrigin(0.5);
      this.modal.add(hint);

      return { x: sx, y: sy, filled: false, box, hint };
    });

    // Spawn 5 draggable/clickable water bag items
    this.bags = [];
    for (let i = 0; i < TOTAL_BAGS; i++) {
      const bx = rackX;
      const by = -86 + i * 50;
      const bag = this.add.container(bx, by);
      const bg = this.add.graphics();
      bg.fillStyle(0x0284c7, 0.92);
      bg.fillRoundedRect(-72, -17, 144, 34, 8);
      bg.lineStyle(2, 0xbae6fd, 0.95);
      bg.strokeRoundedRect(-72, -17, 144, 34, 8);
      const txt = this.add
        .text(0, 0, `H2O SHIELD #${i + 1}`, {
          fontFamily: 'monospace',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#e0f2fe',
        })
        .setOrigin(0.5);
      bag.add([bg, txt]);
      bag.homeX = bx;
      bag.homeY = by;
      bag.placed = false;
      bag.setSize(144, 34);
      bag.setInteractive({ useHandCursor: true, draggable: true });
      this.input.setDraggable(bag);

      bag.on('drag', (_ptr, dragX, dragY) => {
        if (bag.placed || this.completed || this.closing) return;
        bag.setPosition(dragX, dragY);
      });

      bag.on('dragend', () => {
        if (bag.placed || this.completed || this.closing) return;
        const nearest = this.findAvailableSlotNear(bag.x, bag.y, 95);
        if (nearest) {
          this.snapBagToSlot(bag, nearest);
        } else {
          this.tweens.add({
            targets: bag,
            x: bag.homeX,
            y: bag.homeY,
            duration: 180,
            ease: 'Power2',
          });
        }
      });

      // Fallback quick click-to-place for kids
      bag.on('pointerup', (ptr) => {
        if (bag.placed || this.completed || this.closing) return;
        if (ptr.getDistance() > 14) return;
        const nextOpen = this.slots.find((s) => !s.filled);
        if (nextOpen) this.snapBagToSlot(bag, nextOpen);
      });

      this.bags.push(bag);
      this.modal.add(bag);
    }

    // Bottom zero-wastage scientific note
    this.modal.add(
      this.add
        .text(0, panelH / 2 - 48, 'Hydrogen in sealed water slows & blocks gamma/particle radiation with 0% H2O wastage!', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#93c5fd',
          align: 'center',
          wordWrap: { width: panelW - 60 },
        })
        .setOrigin(0.5)
    );

    this.tweens.add({
      targets: this.modal,
      y: cy,
      duration: 360,
      ease: 'Back.easeOut',
    });
  }

  findAvailableSlotNear(x, y, maxDist) {
    let best = null;
    let bestDist = maxDist;
    for (const s of this.slots) {
      if (s.filled) continue;
      const d = Phaser.Math.Distance.Between(x, y, s.x, s.y);
      if (d <= bestDist) {
        best = s;
        bestDist = d;
      }
    }
    return best;
  }

  snapBagToSlot(bag, slot) {
    bag.placed = true;
    bag.disableInteractive();
    slot.filled = true;
    slot.hint.setVisible(false);
    this.placedCount += 1;

    slot.box.clear();
    slot.box.fillStyle(0x0ea5e9, 0.85);
    slot.box.fillRoundedRect(slot.x - 28, slot.y - 16, 56, 32, 8);
    slot.box.lineStyle(2, 0x50fa7b, 1);
    slot.box.strokeRoundedRect(slot.x - 28, slot.y - 16, 56, 32, 8);

    this.tweens.add({
      targets: bag,
      x: slot.x,
      y: slot.y,
      scaleX: 0.42,
      scaleY: 0.9,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        bag.setVisible(false);
        this.modal.add(
          this.add
            .text(slot.x, slot.y, 'H2O ✓', {
              fontFamily: 'monospace',
              fontSize: '10px',
              fontStyle: 'bold',
              color: '#ecfeff',
            })
            .setOrigin(0.5)
        );
      },
    });

    if (this.placedCount < TOTAL_BAGS) {
      this.radIndicator
        .setText(`SHIELDING IN PROGRESS (${this.placedCount}/${TOTAL_BAGS} BAGS)`)
        .setColor('#fbbf24');
    } else {
      this.completeShielding();
    }
  }

  completeShielding() {
    if (this.completed) return;
    this.completed = true;
    this.cameras.main.flash(280, 56, 189, 248);

    this.radIndicator.setText('RADIATION SHIELDED — BARRIER COMPLETE (5/5)').setColor('#50fa7b');
    this.statusText.setText('ALL 5 DRINKABLE H2O SHIELD BAGS SECURED!').setColor('#34d399');

    if (this.mode === 'bunks') {
      gameState.d5BunksBagged = true;
      gameState.d5BagCount = TOTAL_BAGS;
      this.game.events.emit('radiation:stop-d5-decay');
      gameState.setMeters({ radiation: 95 });
    } else if (this.mode === 'ice_site') {
      gameState.d7IceSiteBagged = true;
      gameState.setMeters({ radiation: Math.max(92, gameState.meters.radiation ?? 90) });
    } else if (this.mode === 'greenhouse') {
      gameState.d7GreenhouseBagged = true;
      this.game.events.emit('radiation:stop-d7-surface');
      gameState.setMeters({ radiation: 95 });
    }

    this.time.delayedCall(850, () => this.closeTask());
  }

  closeTask() {
    if (this.closing) return;
    this.closing = true;
    const wasCompleted = this.completed;

    this.tweens.add({
      targets: this.modal,
      y: GAME_HEIGHT + 350,
      duration: 300,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.scene.stop();
        const activeRoom = gameState.room === 'surface' ? SCENES.SURFACE : SCENES.OUTPOST;
        this.scene.resume(activeRoom);
        if (wasCompleted) {
          const ev =
            this.mode === 'bunks'
              ? 'd5:bunks-bagged'
              : this.mode === 'ice_site'
                ? 'd7:ice-bagged'
                : 'd7:greenhouse-bagged';
          this.game.events.emit(ev);
        }
      },
    });
  }
}
