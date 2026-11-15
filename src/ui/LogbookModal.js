import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENES } from '../config/constants.js';
import { LOGBOOK_ENTRIES } from '../data/logbookData.js';
import { gameState } from '../state/GameState.js';

/**
 * Open two-page astronaut journal with real NASA archival photographs,
 * procedural vector science art, kid-friendly facts (ages 7-12),
 * and formally separated NASA/nasa-data references.
 */
export class LogbookModal extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2);

    this.scene = scene;
    this.spreadIndex = 0;
    this.visible = false;
    this.pausedScenes = [];
    this.onCloseCallback = null;
    this.setDepth(2600);

    this.buildModal();
    this.bindInputs();

    this.unsubLogbook = gameState.on('logbook', () => {
      if (this.visible) {
        this.renderSpread();
      }
    });

    scene.add.existing(this);
  }

  buildModal() {
    const bookW = 940;
    const bookH = 580;

    // Dark screen backdrop that blocks clicks to underlying scenes
    const backdrop = this.scene.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8)
      .setInteractive();
    backdrop.on('pointerdown', (_p, _lx, _ly, event) => {
      if (event) event.stopPropagation();
    });
    this.add(backdrop);

    // Open leather hardcover + two cream lined journal pages
    const bookBg = this.scene.add.graphics();
    bookBg.fillStyle(0x000000, 0.45);
    bookBg.fillRoundedRect(-bookW / 2 + 8, -bookH / 2 + 10, bookW, bookH, 16);

    bookBg.fillStyle(0x3e2723, 1);
    bookBg.fillRoundedRect(-bookW / 2, -bookH / 2, bookW, bookH, 14);
    bookBg.lineStyle(3, 0x78350f, 1);
    bookBg.strokeRoundedRect(-bookW / 2, -bookH / 2, bookW, bookH, 14);

    const pageW = 444;
    const pageH = 548;
    const leftX = -454;
    const rightX = 10;
    const pageY = -274;

    [leftX, rightX].forEach((px) => {
      bookBg.fillStyle(0xfef9e7, 1);
      bookBg.fillRoundedRect(px, pageY, pageW, pageH, 6);
      bookBg.lineStyle(1.5, 0xd6d3d1, 1);
      bookBg.strokeRoundedRect(px, pageY, pageW, pageH, 6);

      // Vertical red notebook margin line
      const marginX = px + 34;
      bookBg.lineStyle(1.2, 0xfca5a5, 0.85);
      bookBg.lineBetween(marginX, pageY + 14, marginX, pageY + pageH - 14);

      // Horizontal ruled diary lines every 22px
      bookBg.lineStyle(1, 0xd6d3d1, 0.65);
      for (let ly = pageY + 42; ly < pageY + pageH - 22; ly += 22) {
        bookBg.lineBetween(px + 12, ly, px + pageW - 12, ly);
      }
    });

    // Center spine groove & metallic rings
    bookBg.fillStyle(0x5d4037, 0.9);
    bookBg.fillRect(-10, pageY - 2, 20, pageH + 4);
    for (let ry = -220; ry <= 220; ry += 55) {
      bookBg.lineStyle(2.5, 0x94a3b8, 1);
      bookBg.lineBetween(-12, ry, 12, ry);
    }
    this.add(bookBg);

    // Header Title Ribbon & Close Button
    this.add(
      this.scene.add
        .text(-bookW / 2 + 24, -bookH / 2 - 24, 'ASTRONAUT MISSION LOGBOOK  //  NASA SCIENCE ARCHIVE', {
          fontFamily: 'monospace',
          fontSize: '15px',
          fontStyle: 'bold',
          color: '#ffd166',
        })
        .setOrigin(0, 0.5)
    );

    const closeBtn = this.scene.add
      .text(bookW / 2 - 4, -bookH / 2 - 24, '[ X CLOSE / ESC ]', {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#fecaca',
        backgroundColor: '#450a0a',
        padding: { x: 10, y: 4 },
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', (_p, _lx, _ly, event) => {
      if (event) event.stopPropagation();
      this.close();
    });
    this.add(closeBtn);

    // Page content dynamic container
    this.pagesContainer = this.scene.add.container(0, 0);
    this.add(this.pagesContainer);

    // Bottom Navigation Bar
    this.prevBtn = this.scene.add
      .text(-bookW / 2 + 24, bookH / 2 + 24, '[ ◀ PREV ]', {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#f8fafc',
        backgroundColor: '#1e293b',
        padding: { x: 12, y: 5 },
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    this.prevBtn.on('pointerdown', (_p, _lx, _ly, event) => {
      if (event) event.stopPropagation();
      this.changeSpread(-1);
    });
    this.add(this.prevBtn);

    this.spreadLabel = this.scene.add
      .text(0, bookH / 2 + 24, 'SPREAD 1 / 1', {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#cbd5e1',
      })
      .setOrigin(0.5);
    this.add(this.spreadLabel);

    this.nextBtn = this.scene.add
      .text(bookW / 2 - 24, bookH / 2 + 24, '[ NEXT ▶ ]', {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#f8fafc',
        backgroundColor: '#1e293b',
        padding: { x: 12, y: 5 },
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });
    this.nextBtn.on('pointerdown', (_p, _lx, _ly, event) => {
      if (event) event.stopPropagation();
      this.changeSpread(1);
    });
    this.add(this.nextBtn);
  }

  bindInputs() {
    this.onEsc = () => {
      if (this.visible) this.close();
    };
    this.onLeft = () => {
      if (this.visible) this.changeSpread(-1);
    };
    this.onRight = () => {
      if (this.visible) this.changeSpread(1);
    };

    this.scene.input.keyboard.on('keydown-ESC', this.onEsc);
    this.scene.input.keyboard.on('keydown-LEFT', this.onLeft);
    this.scene.input.keyboard.on('keydown-RIGHT', this.onRight);
  }

  /** Unlock every logbook entry up through the specified day (1-8). */
  unlockUpToDay(maxDay) {
    let changed = false;
    LOGBOOK_ENTRIES.forEach((entry) => {
      if (entry.day <= maxDay && !gameState.discoveredFacts.includes(entry.id)) {
        gameState.discoveredFacts.push(entry.id);
        changed = true;
      }
    });
    if (changed) {
      gameState.hasUnreadLogbook = true;
      gameState.emit('logbook', { factId: null, unread: true, discoveredFacts: gameState.discoveredFacts });
    }
    return changed;
  }

  getUnlockedEntries() {
    const discovered = new Set(gameState.discoveredFacts || []);
    return LOGBOOK_ENTRIES.filter((entry) => discovered.has(entry.id));
  }

  getTotalSpreads() {
    const count = this.getUnlockedEntries().length;
    return Math.max(1, Math.ceil(count / 2));
  }

  playPopSound() {
    const vol = gameState.getEffectiveVolume('sfx', 0.72);
    if (vol <= 0) return;
    if (this.scene.cache.audio.exists('sfx-logpop')) {
      this.scene.sound.play('sfx-logpop', { volume: vol });
    } else if (this.scene.cache.audio.exists('sfx-page')) {
      this.scene.sound.play('sfx-page', { volume: vol });
    }
  }

  playPageSound() {
    const vol = gameState.getEffectiveVolume('sfx', 0.65);
    if (vol <= 0) return;
    if (this.scene.cache.audio.exists('sfx-page')) {
      this.scene.sound.play('sfx-page', { volume: vol });
    }
  }

  pauseUnderlyingScenes() {
    this.pausedScenes = [];
    const ownKey = this.scene.scene.key;
    this.scene.scene.manager.getScenes(true).forEach((s) => {
      const key = s.scene.key;
      if (key !== SCENES.HUD && key !== ownKey) {
        this.scene.scene.pause(key);
        this.pausedScenes.push(key);
      }
    });
  }

  /** Automatically or explicitly open directly to a given day's spread (1-8). */
  openForDay(day, { auto = false, onClose = null } = {}) {
    this.unlockUpToDay(day);
    gameState.markLogbookRead();

    const total = this.getTotalSpreads();
    this.spreadIndex = Phaser.Math.Clamp(day - 1, 0, total - 1);
    this.onCloseCallback = onClose || null;

    if (!this.visible) {
      this.pauseUnderlyingScenes();
      this.setVisible(true);
    }

    if (auto) {
      this.playPopSound();
    } else {
      this.playPageSound();
    }
    this.renderSpread();
  }

  /** Manual open from the top HUD Logbook icon (plays flipping-page SFX). */
  openLatest() {
    if (this.visible) {
      this.close();
      return;
    }

    if (this.getUnlockedEntries().length === 0) {
      this.unlockUpToDay(Math.max(1, gameState.day || 1));
    }
    gameState.markLogbookRead();

    const count = this.getUnlockedEntries().length;
    this.spreadIndex = count > 0 ? Math.floor((count - 1) / 2) : 0;
    this.onCloseCallback = null;

    this.pauseUnderlyingScenes();
    this.setVisible(true);
    this.playPageSound();
    this.renderSpread();
  }

  close() {
    if (!this.visible) return;
    this.setVisible(false);

    const toResume = [...this.pausedScenes];
    this.pausedScenes = [];
    const cb = this.onCloseCallback;
    this.onCloseCallback = null;

    this.scene.time.delayedCall(30, () => {
      toResume.forEach((key) => {
        if (this.scene?.scene) {
          this.scene.scene.resume(key);
        }
      });
      if (cb) cb();
    });
  }

  changeSpread(delta) {
    const total = this.getTotalSpreads();
    const next = Phaser.Math.Clamp(this.spreadIndex + delta, 0, total - 1);
    if (next === this.spreadIndex) return;
    this.spreadIndex = next;
    this.playPageSound();
    this.renderSpread();
  }

  renderSpread() {
    this.pagesContainer.removeAll(true);

    const unlocked = this.getUnlockedEntries();
    const totalSpreads = this.getTotalSpreads();
    this.spreadIndex = Phaser.Math.Clamp(this.spreadIndex, 0, totalSpreads - 1);

    const leftIdx = this.spreadIndex * 2;
    const rightIdx = leftIdx + 1;

    if (unlocked.length === 0) {
      this.renderAwaitingPage(-454, -274, 1);
      this.renderAwaitingPage(10, -274, 2);
    } else {
      this.renderPageSlot(-454, -274, unlocked[leftIdx], leftIdx + 1);
      if (unlocked[rightIdx]) {
        this.renderPageSlot(10, -274, unlocked[rightIdx], rightIdx + 1);
      } else {
        this.renderAwaitingPage(10, -274, rightIdx + 1);
      }
    }

    this.spreadLabel.setText(
      `SPREAD ${this.spreadIndex + 1} / ${totalSpreads}  (${unlocked.length} / ${LOGBOOK_ENTRIES.length} PAGES)`
    );
    this.prevBtn.setAlpha(this.spreadIndex > 0 ? 1 : 0.35);
    this.nextBtn.setAlpha(this.spreadIndex < totalSpreads - 1 ? 1 : 0.35);
  }

  drawPhotoFrame(x, y, w, h, texKey) {
    const frameGfx = this.scene.add.graphics();
    frameGfx.fillStyle(0x0f172a, 1);
    frameGfx.fillRect(x, y, w, h);
    frameGfx.lineStyle(2, 0x475569, 1);
    frameGfx.strokeRect(x, y, w, h);
    this.pagesContainer.add(frameGfx);

    if (texKey && this.scene.textures.exists(texKey)) {
      const img = this.scene.add.image(x + w / 2, y + h / 2, texKey).setOrigin(0.5);
      const scale = Math.min((w - 8) / img.width, (h - 8) / img.height);
      img.setScale(scale);
      this.pagesContainer.add(img);
    }
  }

  drawGreenhouseVectorArt(x, y, w, h) {
    const g = this.scene.add.graphics();
    // Dark Martian sky backdrop inside diagram box
    g.fillStyle(0x0b132b, 1);
    g.fillRoundedRect(x, y, w, h, 6);
    g.lineStyle(2, 0x38bdf8, 0.9);
    g.strokeRoundedRect(x, y, w, h, 6);

    // Martian red ground strip
    g.fillStyle(0x7c2d12, 1);
    g.fillRect(x + 2, y + h - 22, w - 4, 20);

    // Outer water-bag shield walls (left & right of dome)
    g.fillStyle(0x0284c7, 0.9);
    g.fillRoundedRect(x + 56, y + 58, 18, 62, 4);
    g.fillRoundedRect(x + w - 74, y + 58, 18, 62, 4);
    g.lineStyle(1.5, 0x7dd3fc, 1);
    g.strokeRoundedRect(x + 56, y + 58, 18, 62, 4);
    g.strokeRoundedRect(x + w - 74, y + 58, 18, 62, 4);

    // Pressurized dome shell
    g.fillStyle(0x1e293b, 0.85);
    g.fillRoundedRect(x + 78, y + 26, w - 156, 94, { tl: 46, tr: 46, bl: 4, br: 4 });
    g.lineStyle(2.5, 0x4ade80, 0.95);
    g.strokeRoundedRect(x + 78, y + 26, w - 156, 94, { tl: 46, tr: 46, bl: 4, br: 4 });

    // Glowing LED grow lights & warm cone rays inside dome
    g.fillStyle(0xfef08a, 0.14);
    g.fillTriangle(x + 115, y + 36, x + 90, y + 102, x + 298, y + 102);
    g.fillStyle(0xfde047, 1);
    g.fillRoundedRect(x + 122, y + 32, w - 244, 7, 3);

    // Blue hydroponic nutrient water tray
    g.fillStyle(0x0369a1, 1);
    g.fillRoundedRect(x + 94, y + 96, w - 188, 16, 4);

    // 4 cute green space crops growing out of water tray
    const plantXs = [x + 124, x + 168, x + 214, x + 258];
    plantXs.forEach((px) => {
      g.lineStyle(2.5, 0x22c55e, 1);
      g.lineBetween(px, y + 96, px, y + 74);
      g.fillStyle(0x4ade80, 1);
      g.fillEllipse(px - 8, y + 78, 13, 8);
      g.fillEllipse(px + 8, y + 78, 13, 8);
      g.fillCircle(px, y + 69, 6);
    });

    this.pagesContainer.add(g);

    // Clear vector labels
    const labelStyle = { fontFamily: 'monospace', fontSize: '9.5px', fontStyle: 'bold', color: '#e2e8f0' };
    this.pagesContainer.add(this.scene.add.text(x + 10, y + 10, 'H2O SHIELD\nBLOCKS RAYS', { ...labelStyle, color: '#7dd3fc' }));
    this.pagesContainer.add(this.scene.add.text(x + w / 2, y + 14, 'LED GROW SUN', { ...labelStyle, color: '#fde047' }).setOrigin(0.5));
    this.pagesContainer.add(this.scene.add.text(x + w / 2, y + h - 12, 'HYDROPONIC NUTRIENT WATER TRAY  •  CO2 IN ➔ O2 + FOOD OUT', { ...labelStyle, color: '#fde68a' }).setOrigin(0.5));
  }

  renderPageSlot(px, py, entry, pageNum) {
    const x0 = px + 42;
    const contentW = 388;

    // SOL badge + Page Counter
    this.pagesContainer.add(
      this.scene.add.text(x0, py + 15, `${entry.sol}  //  TOPIC #${String(pageNum).padStart(2, '0')}`, {
        fontFamily: 'monospace',
        fontSize: '11.5px',
        fontStyle: 'bold',
        color: '#b45309',
      })
    );

    // Topic Title
    const titleObj = this.scene.add.text(x0, py + 33, entry.title, {
      fontFamily: 'monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#0f172a',
      wordWrap: { width: contentW },
    });
    this.pagesContainer.add(titleObj);

    let cursorY = py + 33 + titleObj.height + 6;
    const images = entry.images || [];

    if (images.length === 1) {
      this.drawPhotoFrame(x0, cursorY, contentW, 134, images[0]);
      cursorY += 137;
      if (entry.imageCaption) {
        const cap = this.scene.add.text(x0, cursorY, entry.imageCaption, {
          fontFamily: 'monospace',
          fontSize: '10px',
          fontStyle: 'italic',
          color: '#475569',
          wordWrap: { width: contentW },
        });
        this.pagesContainer.add(cap);
        cursorY += cap.height + 6;
      }
    } else if (images.length === 2) {
      const halfW = 189;
      this.drawPhotoFrame(x0, cursorY, halfW, 132, images[0]);
      this.drawPhotoFrame(x0 + 199, cursorY, halfW, 132, images[1]);
      cursorY += 135;
      if (entry.imageCaption) {
        const cap = this.scene.add.text(x0, cursorY, entry.imageCaption, {
          fontFamily: 'monospace',
          fontSize: '10px',
          fontStyle: 'italic',
          color: '#475569',
          wordWrap: { width: contentW },
        });
        this.pagesContainer.add(cap);
        cursorY += cap.height + 6;
      }
    } else if (entry.vectorArt === 'greenhouse') {
      this.drawGreenhouseVectorArt(x0, cursorY, contentW, 140);
      cursorY += 144;
      if (entry.imageCaption) {
        const cap = this.scene.add.text(x0, cursorY, entry.imageCaption, {
          fontFamily: 'monospace',
          fontSize: '10px',
          fontStyle: 'italic',
          color: '#475569',
          wordWrap: { width: contentW },
        });
        this.pagesContainer.add(cap);
        cursorY += cap.height + 6;
      }
    } else if (entry.noImageCallout) {
      const bannerGfx = this.scene.add.graphics();
      bannerGfx.fillStyle(0x0f172a, 1);
      bannerGfx.fillRoundedRect(x0, cursorY, contentW, 56, 8);
      bannerGfx.lineStyle(2, 0x38bdf8, 1);
      bannerGfx.strokeRoundedRect(x0, cursorY, contentW, 56, 8);
      this.pagesContainer.add(bannerGfx);

      this.pagesContainer.add(
        this.scene.add
          .text(x0 + contentW / 2, cursorY + 28, entry.noImageCallout, {
            fontFamily: 'monospace',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#7dd3fc',
            align: 'center',
            wordWrap: { width: contentW - 20 },
          })
          .setOrigin(0.5)
      );
      cursorY += 66;
    } else {
      cursorY += 6;
    }

    // Kid-friendly Science Facts Body (no inline citations)
    const bodyObj = this.scene.add.text(x0, cursorY, entry.factText, {
      fontFamily: 'monospace',
      fontSize: images.length === 0 && !entry.vectorArt ? '13px' : '12px',
      color: '#0f172a',
      lineSpacing: 5,
      wordWrap: { width: contentW },
    });
    this.pagesContainer.add(bodyObj);
    cursorY += bodyObj.height + 12;

    // Optional Closing Quote Plaque (Finale Spread)
    if (entry.closingQuote) {
      const quoteBoxY = Math.min(cursorY, py + 368);
      const quoteGfx = this.scene.add.graphics();
      quoteGfx.fillStyle(0xfef08a, 0.55);
      quoteGfx.fillRoundedRect(x0, quoteBoxY, contentW, 66, 8);
      quoteGfx.lineStyle(2, 0xd97706, 0.9);
      quoteGfx.strokeRoundedRect(x0, quoteBoxY, contentW, 66, 8);
      this.pagesContainer.add(quoteGfx);

      this.pagesContainer.add(
        this.scene.add
          .text(x0 + contentW / 2, quoteBoxY + 33, `"${entry.closingQuote}"`, {
            fontFamily: 'monospace',
            fontSize: '13.5px',
            fontStyle: 'bold',
            color: '#7c2d12',
            align: 'center',
            wordWrap: { width: contentW - 24 },
          })
          .setOrigin(0.5)
      );
    }

    // Strictly Separated Formal Reference Box at Bottom of Page
    const refBoxY = py + 448;
    const refBoxH = 72;
    const refGfx = this.scene.add.graphics();
    refGfx.fillStyle(0xe2e8f0, 0.94);
    refGfx.fillRoundedRect(x0, refBoxY, contentW, refBoxH, 6);
    refGfx.lineStyle(1, 0x64748b, 0.9);
    refGfx.strokeRoundedRect(x0, refBoxY, contentW, refBoxH, 6);
    this.pagesContainer.add(refGfx);

    this.pagesContainer.add(
      this.scene.add.text(x0 + 8, refBoxY + 6, 'FORMAL NASA / ARCHIVE REFERENCE', {
        fontFamily: 'monospace',
        fontSize: '9.5px',
        fontStyle: 'bold',
        color: '#334155',
      })
    );

    this.pagesContainer.add(
      this.scene.add.text(x0 + 8, refBoxY + 21, entry.formalReference, {
        fontFamily: 'monospace',
        fontSize: '9.5px',
        color: '#1e3a8a',
        lineSpacing: 3,
        wordWrap: { width: contentW - 16 },
      })
    );

    // Page number footer
    this.pagesContainer.add(
      this.scene.add
        .text(px + 428, py + 536, `PAGE ${pageNum}`, {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#78716c',
        })
        .setOrigin(1, 1)
    );
  }

  renderAwaitingPage(px, py, pageNum) {
    const x0 = px + 44;
    this.pagesContainer.add(
      this.scene.add.text(x0, py + 190, 'NEXT SOL BRIEFING LOCKED', {
        fontFamily: 'monospace',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#a8a29e',
      })
    );
    this.pagesContainer.add(
      this.scene.add.text(
        x0,
        py + 228,
        'Finish today’s mission tasks to unlock tomorrow’s NASA Logbook lessons and photographs!',
        {
          fontFamily: 'monospace',
          fontSize: '12.5px',
          color: '#78716c',
          lineSpacing: 6,
          wordWrap: { width: 370 },
        }
      )
    );
    this.pagesContainer.add(
      this.scene.add
        .text(px + 428, py + 536, `PAGE ${pageNum}`, {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#78716c',
        })
        .setOrigin(1, 1)
    );
  }

  destroy() {
    if (this.unsubLogbook) this.unsubLogbook();
    if (this.scene?.input?.keyboard) {
      this.scene.input.keyboard.off('keydown-ESC', this.onEsc);
      this.scene.input.keyboard.off('keydown-LEFT', this.onLeft);
      this.scene.input.keyboard.off('keydown-RIGHT', this.onRight);
    }
    super.destroy();
  }
}
