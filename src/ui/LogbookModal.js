import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENES } from '../config/constants.js';
import { LOGBOOK_ENTRIES } from '../data/logbookData.js';
import { gameState } from '../state/GameState.js';

/**
 * Open two-page astronaut journal / diary with lined pages, procedural NASA archival
 * illustrations, mission data metrics, and solid NASA references.
 * Live-updates as facts and tasks are discovered (unread badge triggers on HudScene).
 */
export class LogbookModal extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2);

    this.scene = scene;
    this.spreadIndex = 0;
    this.visible = false;
    this.pausedScenes = [];
    this.setDepth(2600);

    this.ensurePhotoTextures();
    this.buildModal();
    this.bindInputs();

    this.unsubLogbook = gameState.on('logbook', () => {
      if (this.visible) {
        this.renderSpread();
      }
    });

    scene.add.existing(this);
  }

  ensurePhotoTextures() {
    const texMgr = this.scene.textures;
    const W = 380;
    const H = 118;

    const specs = [
      { id: 'comm_delay', draw: (ctx) => this.drawCommDelayPhoto(ctx, W, H) },
      { id: 'regolith_3d', draw: (ctx) => this.drawRegolithPhoto(ctx, W, H) },
      { id: 'solar_arrays', draw: (ctx) => this.drawSolarArrayPhoto(ctx, W, H) },
      { id: 'mars_sunlight_43', draw: (ctx) => this.drawSunlight43Photo(ctx, W, H) },
      { id: 'opportunity_dust_2018', draw: (ctx) => this.drawOpportunityDustPhoto(ctx, W, H) },
      { id: 'iss_electrolysis_moxie', draw: (ctx) => this.drawElectrolysisMoxiePhoto(ctx, W, H) },
      { id: 'human_o2_consumption', draw: (ctx) => this.drawO2DemandPhoto(ctx, W, H) },
    ];

    specs.forEach(({ id, draw }) => {
      const key = `logbook-photo-${id}`;
      if (texMgr.exists(key)) return;
      const canvasTex = texMgr.createCanvas(key, W, H);
      const ctx = canvasTex.getContext();
      draw(ctx);

      // Crisp corner archive stamp
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.fillRect(W - 156, H - 18, 152, 14);
      ctx.fillStyle = '#93c5fd';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('NASA PUBLIC DOMAIN ARCHIVE', W - 8, H - 8);
      ctx.textAlign = 'left';

      canvasTex.refresh();
    });
  }

  drawCommDelayPhoto(ctx, w, h) {
    ctx.fillStyle = '#070b18';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(58, h / 2, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(53, h / 2 - 4, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(w - 64, h / 2, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    for (let r = 28; r <= 76; r += 16) {
      ctx.beginPath();
      ctx.arc(76, h / 2, r, -0.55, 0.55);
      ctx.stroke();
    }
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(82, h / 2);
    ctx.lineTo(w - 86, h / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('EARTH', 42, h - 14);
    ctx.fillText('MARS', w - 78, h - 14);
    ctx.fillStyle = '#ffd166';
    ctx.fillText('3 - 22 MIN ONE-WAY', 124, h / 2 - 14);
  }

  drawRegolithPhoto(ctx, w, h) {
    ctx.fillStyle = '#431407';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(0, 74, w, h - 74);

    // 3D-printed habitat dome with contour layers
    ctx.fillStyle = '#d6d3d1';
    ctx.beginPath();
    ctx.arc(w / 2, 78, 52, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 1.5;
    for (let y = 36; y <= 72; y += 9) {
      ctx.beginPath();
      ctx.moveTo(w / 2 - 42, y);
      ctx.lineTo(w / 2 + 42, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(w / 2 - 12, 54, 24, 24);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(w / 2 + 18, 54, 14, 10);

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('MARS DUNE ALPHA // LAVACRETE', 14, 20);
  }

  drawSolarArrayPhoto(ctx, w, h) {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Sunburst
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(54, 34, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(74, 40);
    ctx.lineTo(155, 58);
    ctx.moveTo(72, 48);
    ctx.lineTo(148, 72);
    ctx.stroke();

    // Photovoltaic wing panels
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(140, 38, 175, 48);
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 1.5;
    for (let x = 140; x <= 315; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 38);
      ctx.lineTo(x, 86);
      ctx.stroke();
    }
    for (let y = 38; y <= 86; y += 16) {
      ctx.beginPath();
      ctx.moveTo(140, y);
      ctx.lineTo(315, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('PHOTOVOLTAIC CELL ARRAYS', 14, h - 14);
  }

  drawSunlight43Photo(ctx, w, h) {
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('EARTH (1.0 AU)   100%  ~1,361 W/m2', 16, 30);
    ctx.fillStyle = '#334155';
    ctx.fillRect(16, 36, 260, 14);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(16, 36, 260, 14);

    ctx.fillStyle = '#fde68a';
    ctx.fillText('MARS  (1.52 AU)   43%   ~590 W/m2', 16, 72);
    ctx.fillStyle = '#334155';
    ctx.fillRect(16, 78, 260, 14);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(16, 78, Math.round(260 * 0.43), 14);
  }

  drawOpportunityDustPhoto(ctx, w, h) {
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(234, 88, 12, 0.55)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(0, 82, w, 36);

    // Rover body & solar deck silhouette coated in dust
    ctx.fillStyle = '#d97706';
    ctx.fillRect(130, 56, 95, 16);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(156, 40, 14, 18);
    ctx.fillRect(150, 28, 26, 12);
    ctx.fillStyle = '#0f172a';
    [142, 178, 212].forEach((wx) => {
      ctx.beginPath();
      ctx.arc(wx, 82, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('MER-B OPPORTUNITY // JUNE 2018 DUST STORM', 14, 20);
  }

  drawElectrolysisMoxiePhoto(ctx, w, h) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Ice block + electrolysis cell
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(24, 34, 62, 54);
    ctx.fillStyle = '#e0f2fe';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('H2O ICE', 31, 65);

    ctx.fillStyle = '#fbbf24';
    ctx.fillText('---> + e-', 95, 65);

    ctx.fillStyle = '#065f46';
    ctx.fillRect(172, 34, 78, 54);
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    ctx.strokeRect(172, 34, 78, 54);
    ctx.fillStyle = '#ecfdf5';
    ctx.fillText('2H2 + O2', 184, 65);

    // MOXIE golden cube badge
    ctx.fillStyle = '#b45309';
    ctx.fillRect(274, 34, 82, 54);
    ctx.fillStyle = '#fef08a';
    ctx.fillText('MOXIE', 295, 56);
    ctx.fillText('122 g O2', 284, 74);

    ctx.fillStyle = '#7dd3fc';
    ctx.fillText('ISS ELECTROLYSIS + PERSEVERANCE MOXIE', 14, 20);
  }

  drawO2DemandPhoto(ctx, w, h) {
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(20, 28, 150, 62);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 28, 150, 62);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('0.84 kg O2', 44, 54);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px monospace';
    ctx.fillText('PER CREW / 24h', 40, 74);

    // Breaker bars
    ctx.fillStyle = '#34d399';
    ctx.fillRect(195, 36, 155, 18);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('O2 ELECTROLYSIS: ON (40%)', 200, 49);

    ctx.fillStyle = '#475569';
    ctx.fillRect(195, 64, 155, 18);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('NIGHT LIGHTS: OFF (SAVE)', 200, 77);
  }

  buildModal() {
    const bookW = 940;
    const bookH = 580;

    // Dark screen backdrop that blocks clicks to underlying scenes
    const backdrop = this.scene.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.78)
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
      const marginX = px === leftX ? px + 34 : px + 34;
      bookBg.lineStyle(1.2, 0xfca5a5, 0.85);
      bookBg.lineBetween(marginX, pageY + 14, marginX, pageY + pageH - 14);

      // Horizontal ruled diary lines every 22px
      bookBg.lineStyle(1, 0xd6d3d1, 0.7);
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
        .text(-bookW / 2 + 24, -bookH / 2 - 24, 'ASTRONAUT MISSION LOGBOOK  //  LIVE NASA ARCHIVE', {
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

  getUnlockedEntries() {
    const discovered = new Set(gameState.discoveredFacts || []);
    return LOGBOOK_ENTRIES.filter((entry) => discovered.has(entry.id));
  }

  getTotalSpreads() {
    const count = this.getUnlockedEntries().length;
    return Math.max(1, Math.ceil(count / 2));
  }

  playPageSound() {
    if (this.scene.cache.audio.exists('sfx-page')) {
      this.scene.sound.play('sfx-page', { volume: 0.6 });
    }
  }

  openLatest() {
    if (this.visible) {
      this.close();
      return;
    }

    gameState.markLogbookRead();

    const count = this.getUnlockedEntries().length;
    this.spreadIndex = count > 0 ? Math.floor((count - 1) / 2) : 0;

    this.pausedScenes = [];
    this.scene.scene.manager.getScenes(true).forEach((s) => {
      const key = s.scene.key;
      if (key !== SCENES.HUD && !this.scene.isPaused) {
        this.scene.scene.pause(key);
        this.pausedScenes.push(key);
      }
    });

    this.setVisible(true);
    this.playPageSound();
    this.renderSpread();
  }

  close() {
    if (!this.visible) return;
    this.setVisible(false);

    const toResume = [...this.pausedScenes];
    this.pausedScenes = [];
    if (toResume.length > 0) {
      this.scene.time.delayedCall(30, () => {
        toResume.forEach((key) => {
          if (this.scene?.scene) {
            this.scene.scene.resume(key);
          }
        });
      });
    }
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
      this.renderCoverPage(-454, -274);
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
      `SPREAD ${this.spreadIndex + 1} / ${totalSpreads}  (${unlocked.length} / ${LOGBOOK_ENTRIES.length} RECORDS)`
    );
    this.prevBtn.setAlpha(this.spreadIndex > 0 ? 1 : 0.35);
    this.nextBtn.setAlpha(this.spreadIndex < totalSpreads - 1 ? 1 : 0.35);
  }

  renderCoverPage(px, py) {
    const x0 = px + 44;
    const w = 384;
    this.pagesContainer.add(
      this.scene.add.text(x0, py + 24, 'MISSION JOURNAL — ARES VII', {
        fontFamily: 'monospace',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#9a3412',
      })
    );
    this.pagesContainer.add(
      this.scene.add.text(
        x0,
        py + 70,
        'Astronaut Keeper: Maisha (Scientist-Medic)\nCo-Lead: Muntasir (Systems Engineer)\n\nEvery task completed and every NASA discovery encountered during your 7-Sol survival mission is logged automatically onto these pages with mission data, archival imagery, and references.\n\nWatch for the RED DOT on the Logbook icon whenever a new entry arrives!',
        {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#1e293b',
          lineSpacing: 8,
          wordWrap: { width: w },
        }
      )
    );
    this.pagesContainer.add(
      this.scene.add
        .text(px + 426, py + 530, 'PAGE 1', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#78716c',
        })
        .setOrigin(1, 1)
    );
  }

  renderPageSlot(px, py, entry, pageNum) {
    const x0 = px + 42;
    const contentW = 388;

    // SOL badge + Entry counter
    this.pagesContainer.add(
      this.scene.add.text(x0, py + 16, `${entry.sol}  //  LOG #${String(pageNum).padStart(2, '0')}`, {
        fontFamily: 'monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#b45309',
      })
    );

    // Title
    this.pagesContainer.add(
      this.scene.add.text(x0, py + 34, entry.title, {
        fontFamily: 'monospace',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#0f172a',
        wordWrap: { width: contentW },
      })
    );

    // Polaroid Photo Frame + NASA archival illustration
    const frameY = py + 62;
    const frameGfx = this.scene.add.graphics();
    frameGfx.fillStyle(0xffffff, 1);
    frameGfx.fillRect(x0, frameY, 384, 140);
    frameGfx.lineStyle(1.5, 0x94a3b8, 1);
    frameGfx.strokeRect(x0, frameY, 384, 140);
    this.pagesContainer.add(frameGfx);

    const photo = this.scene.add.image(x0 + 2, frameY + 2, `logbook-photo-${entry.id}`).setOrigin(0, 0);
    this.pagesContainer.add(photo);

    this.pagesContainer.add(
      this.scene.add.text(x0 + 6, frameY + 123, entry.photoCaption, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#475569',
      })
    );

    // Real Data Metric Strip
    const dataY = frameY + 148;
    const metricBg = this.scene.add.graphics();
    metricBg.fillStyle(0xe2e8f0, 0.9);
    metricBg.fillRoundedRect(x0, dataY, contentW, 28, 4);
    metricBg.lineStyle(1, 0x94a3b8, 0.8);
    metricBg.strokeRoundedRect(x0, dataY, contentW, 28, 4);
    this.pagesContainer.add(metricBg);

    this.pagesContainer.add(
      this.scene.add
        .text(x0 + 8, dataY + 14, entry.dataMetric, {
          fontFamily: 'monospace',
          fontSize: '10.5px',
          fontStyle: 'bold',
          color: '#0f172a',
        })
        .setOrigin(0, 0.5)
    );

    // Main NASA Science Fact Body
    this.pagesContainer.add(
      this.scene.add.text(x0, dataY + 38, entry.factText, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#1e293b',
        lineSpacing: 6,
        wordWrap: { width: contentW },
      })
    );

    // Astronaut Handwritten-Style Diary Note
    const diaryY = py + 365;
    const diaryBg = this.scene.add.graphics();
    diaryBg.fillStyle(0xfef08a, 0.4);
    diaryBg.fillRoundedRect(x0, diaryY, contentW, 74, 6);
    diaryBg.lineStyle(1, 0xd97706, 0.55);
    diaryBg.strokeRoundedRect(x0, diaryY, contentW, 74, 6);
    this.pagesContainer.add(diaryBg);

    this.pagesContainer.add(
      this.scene.add.text(x0 + 10, diaryY + 10, entry.diaryNote, {
        fontFamily: 'monospace',
        fontSize: '11.5px',
        fontStyle: 'italic',
        color: '#7c2d12',
        lineSpacing: 5,
        wordWrap: { width: contentW - 20 },
      })
    );

    // Solid NASA Reference + Page Number Footer
    this.pagesContainer.add(
      this.scene.add.text(x0, py + 455, entry.reference, {
        fontFamily: 'monospace',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#1d4ed8',
        lineSpacing: 4,
        wordWrap: { width: contentW },
      })
    );

    this.pagesContainer.add(
      this.scene.add
        .text(px + 428, py + 532, `PAGE ${pageNum}`, {
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
      this.scene.add.text(x0, py + 190, 'AWAITING FIELD DATA...', {
        fontFamily: 'monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#a8a29e',
      })
    );
    this.pagesContainer.add(
      this.scene.add.text(
        x0,
        py + 228,
        'Continue completing mission tasks and inspecting crew telemetry to record the next NASA research entry here.',
        {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#78716c',
          lineSpacing: 6,
          wordWrap: { width: 370 },
        }
      )
    );
    this.pagesContainer.add(
      this.scene.add
        .text(px + 428, py + 532, `PAGE ${pageNum}`, {
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
