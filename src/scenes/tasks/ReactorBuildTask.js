import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/constants.js';
import { gameState } from '../../state/GameState.js';

/**
 * Creative 3-stage Kilopower Nuclear Reactor startup & assembly console (NO drag-and-drop):
 * Stage 1: Timing lock 3 radiation shielding rings inside green target arc.
 * Stage 2: Precision control-rod stepper tuning into the 38-42 kW target band.
 * Stage 3: Sequential 1 -> 2 -> 3 Stirling phase sync breakers.
 */
export class ReactorBuildTask extends Phaser.Scene {
  constructor() {
    super('ReactorBuildTask');
  }

  create() {
    this.completed = false;
    this.closing = false;
    this.stage = 1; // 1 = shield rings, 2 = control rods, 3 = phase sync
    this.lockedRings = 0;
    this.ringAngle = -Math.PI;
    this.ringSpeed = 2.4;
    this.rodPct = 15; // 15% -> ~8 kW initially
    this.phaseStep = 0;

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const panelW = 600;
    const panelH = 520;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.78).setOrigin(0);
    this.modal = this.add.container(cx, GAME_HEIGHT + 320);

    // Outer chassis
    const chassis = this.add.graphics();
    chassis.fillStyle(0x161b24, 1);
    chassis.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    chassis.lineStyle(3, 0x3b4459, 1);
    chassis.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    chassis.fillStyle(0x059669, 1);
    chassis.fillRoundedRect(-panelW / 2 + 6, -panelH / 2 + 6, panelW - 12, 42, {
      tl: 10,
      tr: 10,
      bl: 0,
      br: 0,
    });
    this.modal.add(chassis);

    this.modal.add(
      this.add
        .text(0, -panelH / 2 + 27, 'KILOPOWER FISSION REACTOR CONSOLE', {
          fontFamily: 'monospace',
          fontSize: '18px',
          fontStyle: 'bold',
          color: '#ffffff',
        })
        .setOrigin(0.5)
    );

    const closeBtn = this.add
      .text(panelW / 2 - 30, -panelH / 2 + 27, '[X]', {
        fontFamily: 'monospace',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#fecaca',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.closeTask());
    this.modal.add(closeBtn);

    this.statusText = this.add
      .text(0, -panelH / 2 + 68, 'STAGE 1/3: LOCK ALL 3 SHIELD RINGS IN THE GREEN ZONE!', {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ffd166',
      })
      .setOrigin(0.5);
    this.modal.add(this.statusText);

    // ─── Left: Circular Reactor Core & Shield Timing Display ─────────────────
    this.coreX = -125;
    this.coreY = 8;
    const leftFrame = this.add.graphics();
    leftFrame.fillStyle(0x0f172a, 0.96);
    leftFrame.fillRoundedRect(-272, -158, 294, 344, 10);
    leftFrame.lineStyle(2, 0x334155, 1);
    leftFrame.strokeRoundedRect(-272, -158, 294, 344, 10);
    this.modal.add(leftFrame);

    this.coreGfx = this.add.graphics();
    this.modal.add(this.coreGfx);

    this.coreBadge = this.add
      .text(this.coreX, 134, 'SHIELDS LOCKED: 0 / 3', {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#34d399',
      })
      .setOrigin(0.5);
    this.modal.add(this.coreBadge);

    this.lockRingBtn = this.makeBtn(
      this.coreX,
      166,
      244,
      '[ SPACE / CLICK: LOCK SHIELD RING ]',
      0x0284c7,
      0x38bdf8,
      () => this.tryLockShieldRing()
    );
    this.modal.add(this.lockRingBtn);

    // ─── Right Top: Stage 2 Control Rod Criticality Tuning ───────────────────
    const rightX = 148;
    const rodFrame = this.add.graphics();
    rodFrame.fillStyle(0x0f172a, 0.96);
    rodFrame.fillRoundedRect(34, -158, 238, 180, 10);
    rodFrame.lineStyle(2, 0x334155, 1);
    rodFrame.strokeRoundedRect(34, -158, 238, 180, 10);
    this.modal.add(rodFrame);

    this.modal.add(
      this.add
        .text(rightX, -140, 'STAGE 2: CONTROL RODS (38-42 kW)', {
          fontFamily: 'monospace',
          fontSize: '13px',
          fontStyle: 'bold',
          color: '#93c5fd',
        })
        .setOrigin(0.5)
    );

    this.kwGfx = this.add.graphics();
    this.modal.add(this.kwGfx);

    this.kwLabel = this.add
      .text(rightX, -98, 'OUTPUT: 8 kW (TARGET: 38-42 kW)', {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#facc15',
      })
      .setOrigin(0.5);
    this.modal.add(this.kwLabel);

    this.insertBtn = this.makeBtn(rightX - 60, -56, 114, '[ ◀ INSERT ]', 0x334155, 0x64748b, () =>
      this.adjustRods(-5)
    );
    this.withdrawBtn = this.makeBtn(rightX + 60, -56, 114, '[ WITHDRAW ▶ ]', 0x334155, 0x64748b, () =>
      this.adjustRods(5)
    );
    this.engageCoreBtn = this.makeBtn(rightX, -10, 214, '[ ENGAGE 40 kW LOCK ]', 0x059669, 0x34d399, () =>
      this.tryEngageCore()
    );
    this.modal.add([this.insertBtn, this.withdrawBtn, this.engageCoreBtn]);

    // ─── Right Bottom: Stage 3 Stirling Engine Phase Sync ────────────────────
    const phaseFrame = this.add.graphics();
    phaseFrame.fillStyle(0x0f172a, 0.96);
    phaseFrame.fillRoundedRect(34, 34, 238, 152, 10);
    phaseFrame.lineStyle(2, 0x334155, 1);
    phaseFrame.strokeRoundedRect(34, 34, 238, 152, 10);
    this.modal.add(phaseFrame);

    this.modal.add(
      this.add
        .text(rightX, 52, 'STAGE 3: IGNITION (1 → 2 → 3)', {
          fontFamily: 'monospace',
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#a7f3d0',
        })
        .setOrigin(0.5)
    );

    this.phaseBtns = [
      this.makeBtn(rightX, 84, 210, '[ 1. COOLANT LOOP ]', 0x1e293b, 0x475569, () => this.hitPhase(1)),
      this.makeBtn(rightX, 122, 210, '[ 2. STIRLING PISTON ]', 0x1e293b, 0x475569, () => this.hitPhase(2)),
      this.makeBtn(rightX, 160, 210, '[ 3. POWER BUS ]', 0x1e293b, 0x475569, () => this.hitPhase(3)),
    ];
    this.modal.add(this.phaseBtns);

    this.modal.add(
      this.add
        .text(0, panelH / 2 - 28, 'A small Kilopower fission unit supplies steady 40 kW electricity day & night!', {
          fontFamily: 'sans-serif',
          fontSize: '14px',
          color: '#cbd5e1',
          backgroundColor: '#0f172a',
          padding: { x: 10, y: 5 },
        })
        .setOrigin(0.5)
    );

    // Keyboard support for Stage 1 (SPACE) and Stage 2 (LEFT / RIGHT)
    const onSpace = () => {
      if (this.stage === 1 && !this.completed && !this.closing) this.tryLockShieldRing();
    };
    const onLeft = () => {
      if (this.stage === 2 && !this.completed && !this.closing) this.adjustRods(-5);
    };
    const onRight = () => {
      if (this.stage === 2 && !this.completed && !this.closing) this.adjustRods(5);
    };
    const onEsc = () => this.closeTask();

    this.input.keyboard.on('keydown-SPACE', onSpace);
    this.input.keyboard.on('keydown-LEFT', onLeft);
    this.input.keyboard.on('keydown-RIGHT', onRight);
    this.input.keyboard.on('keydown-ESC', onEsc);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.input?.keyboard) {
        this.input.keyboard.off('keydown-SPACE', onSpace);
        this.input.keyboard.off('keydown-LEFT', onLeft);
        this.input.keyboard.off('keydown-RIGHT', onRight);
        this.input.keyboard.off('keydown-ESC', onEsc);
      }
    });

    this.refreshStageUI();
    this.drawCore();
    this.drawKwGauge();

    this.tweens.add({
      targets: this.modal,
      y: cy,
      duration: 360,
      ease: 'Back.easeOut',
    });
  }

  makeBtn(x, y, w, text, fillColor, strokeColor, onClick) {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(fillColor, 1);
    bg.fillRoundedRect(-w / 2, -14, w, 28, 7);
    bg.lineStyle(1.8, strokeColor, 1);
    bg.strokeRoundedRect(-w / 2, -14, w, 28, 7);
    const lbl = this.add
      .text(0, 0, text, {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    btn.add([bg, lbl]);
    btn.setSize(w, 28);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', onClick);
    btn.setData('bg', bg);
    btn.setData('lbl', lbl);
    btn.setData('w', w);
    return btn;
  }

  setBtnColors(btn, fill, stroke, textColor = '#ffffff') {
    const bg = btn.getData('bg');
    const lbl = btn.getData('lbl');
    const w = btn.getData('w');
    bg.clear();
    bg.fillStyle(fill, 1);
    bg.fillRoundedRect(-w / 2, -14, w, 28, 7);
    bg.lineStyle(1.8, stroke, 1);
    bg.strokeRoundedRect(-w / 2, -14, w, 28, 7);
    lbl.setColor(textColor);
  }

  refreshStageUI() {
    this.lockRingBtn.setAlpha(this.stage === 1 ? 1 : 0.45);
    const s2 = this.stage === 2 ? 1 : 0.45;
    this.insertBtn.setAlpha(s2);
    this.withdrawBtn.setAlpha(s2);
    this.engageCoreBtn.setAlpha(s2);
    const s3 = this.stage === 3 ? 1 : 0.45;
    this.phaseBtns.forEach((b) => b.setAlpha(s3));
  }

  update(_time, delta) {
    if (this.completed || this.closing || this.stage !== 1) return;
    const dt = Math.min(delta / 1000, 0.05);
    this.ringAngle = Phaser.Math.Angle.Wrap(this.ringAngle + this.ringSpeed * dt);
    this.drawCore();
  }

  drawCore() {
    const g = this.coreGfx;
    g.clear();

    const cx = this.coreX;
    const cy = this.coreY - 12;

    // 3 concentric radiation shield rings
    for (let i = 0; i < 3; i++) {
      const r = 46 + i * 20;
      const isLocked = i < this.lockedRings;
      g.lineStyle(6, isLocked ? 0x34d399 : 0x334155, isLocked ? 0.95 : 0.7);
      g.strokeCircle(cx, cy, r);
    }

    // Center uranium reactor core glow
    g.fillStyle(this.stage >= 2 ? 0x34d399 : 0x38bdf8, 0.25);
    g.fillCircle(cx, cy, 34);
    g.fillStyle(this.stage >= 2 ? 0x10b981 : 0x0ea5e9, 0.9);
    g.fillCircle(cx, cy, 18);

    // Top green target zone (-90 deg +/- 38 deg)
    const targetCenter = -Math.PI / 2;
    const halfArc = Phaser.Math.DegToRad(38);
    g.lineStyle(8, 0x10b981, 0.95);
    g.beginPath();
    g.arc(cx, cy, 98, targetCenter - halfArc, targetCenter + halfArc, false);
    g.strokePath();

    // Moving alignment marker on outer ring (when stage 1)
    if (this.stage === 1) {
      const mx = cx + Math.cos(this.ringAngle) * 98;
      const my = cy + Math.sin(this.ringAngle) * 98;
      const inZone = Math.abs(Phaser.Math.Angle.ShortestBetween(Phaser.Math.RadToDeg(this.ringAngle), -90)) <= 38;
      g.fillStyle(inZone ? 0xfef08a : 0xf97316, 1);
      g.fillCircle(mx, my, 9);
      g.lineStyle(2, 0xffffff, 1);
      g.strokeCircle(mx, my, 9);
    }
  }

  tryLockShieldRing() {
    if (this.stage !== 1 || this.completed || this.closing) return;
    const degDiff = Math.abs(Phaser.Math.Angle.ShortestBetween(Phaser.Math.RadToDeg(this.ringAngle), -90));
    if (degDiff <= 38) {
      this.lockedRings += 1;
      this.ringSpeed = 2.4 + this.lockedRings * 0.45;
      this.coreBadge.setText(`SHIELDS LOCKED: ${this.lockedRings} / 3`);
      this.drawCore();

      if (this.lockedRings >= 3) {
        this.stage = 2;
        this.refreshStageUI();
        this.drawCore();
        this.statusText
          .setText('STAGE 2/3: TUNE CONTROL RODS INTO THE 38-42 kW GREEN ZONE!')
          .setColor('#38bdf8');
      } else {
        this.statusText
          .setText(`SHIELD RING ${this.lockedRings}/3 LOCKED! KEEP ALIGNING...`)
          .setColor('#34d399');
      }
    } else {
      this.statusText
        .setText('WAIT FOR THE MARKER TO ENTER THE GREEN TOP ARC!')
        .setColor('#f97316');
    }
  }

  getKwOutput() {
    return Math.round(this.rodPct * 0.55);
  }

  drawKwGauge() {
    const rightX = 148;
    const g = this.kwGfx;
    g.clear();

    const barX = rightX - 96;
    const barY = -124;
    const barW = 192;
    const barH = 14;

    g.fillStyle(0x1e293b, 1);
    g.fillRoundedRect(barX, barY, barW, barH, 5);

    // Green 38-42 kW target slice out of 55 kW max
    const gStart = (38 / 55) * barW;
    const gWidth = ((42 - 38) / 55) * barW;
    g.fillStyle(0x10b981, 0.55);
    g.fillRect(barX + gStart, barY, gWidth, barH);

    const kw = this.getKwOutput();
    const curW = Math.max(4, Math.min(barW, (kw / 55) * barW));
    const inBand = kw >= 38 && kw <= 42;
    g.fillStyle(inBand ? 0x34d399 : kw > 42 ? 0xef4444 : 0x38bdf8, 1);
    g.fillRoundedRect(barX + 2, barY + 2, curW - 4, barH - 4, 4);

    this.kwLabel
      .setText(`OUTPUT: ${kw} kW (TARGET: 38-42 kW)`)
      .setColor(inBand ? '#34d399' : kw > 42 ? '#f87171' : '#facc15');
  }

  adjustRods(delta) {
    if (this.stage !== 2 || this.completed || this.closing) return;
    this.rodPct = Phaser.Math.Clamp(this.rodPct + delta, 0, 100);
    this.drawKwGauge();
  }

  tryEngageCore() {
    if (this.stage !== 2 || this.completed || this.closing) return;
    const kw = this.getKwOutput();
    if (kw >= 38 && kw <= 42) {
      this.stage = 3;
      this.refreshStageUI();
      this.statusText
        .setText('STAGE 3/3: ENGAGE PHASE BREAKERS IN ORDER (1 → 2 → 3)!')
        .setColor('#34d399');
    } else {
      this.statusText
        .setText(`TUNE RODS TO 38-42 kW FIRST! (CURRENT: ${kw} kW)`)
        .setColor('#ffd166');
    }
  }

  hitPhase(num) {
    if (this.stage !== 3 || this.completed || this.closing) return;
    if (num === this.phaseStep + 1) {
      this.phaseStep = num;
      this.setBtnColors(this.phaseBtns[num - 1], 0x059669, 0x34d399, '#ffffff');
      if (this.phaseStep >= 3) {
        this.completeReactor();
      }
    } else if (num > this.phaseStep + 1) {
      this.statusText.setText('ENGAGE PHASE BREAKERS IN ORDER: 1 → 2 → 3!').setColor('#f97316');
    }
  }

  completeReactor() {
    if (this.completed) return;
    this.completed = true;
    gameState.d4ReactorBuilt = true;
    gameState.stepId = 'd4_reactor';
    gameState.checkpointId = 'd4_reactor';
    this.game.events.emit('power:stop-dust-drain');
    gameState.setMeters({ power: 100 });

    this.cameras.main.flash(350, 52, 211, 153);
    this.statusText
      .setText('KILOPOWER FISSION REACTOR ONLINE — 40 kW CONTINUOUS OUTPUT!')
      .setColor('#34d399');

    this.time.delayedCall(900, () => this.closeTask());
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
        const activeRoom = gameState.room === 'surface' ? 'Surface' : 'Outpost';
        this.scene.resume(activeRoom);
        if (wasCompleted) {
          this.game.events.emit('d4:reactor-built');
        }
      },
    });
  }
}
