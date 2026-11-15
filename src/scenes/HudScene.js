import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { gameState } from '../state/GameState.js';
import { PillMeter } from '../ui/PillMeter.js';
import { FactCard } from '../ui/FactCard.js';
import { WarningCard } from '../ui/WarningCard.js';
import { LogbookModal } from '../ui/LogbookModal.js';
import { matchLogbookEntry } from '../data/logbookData.js';
import { RewindManager } from '../systems/RewindManager.js';

/**
 * Always-on overlay scene: capsule pill meters, "Press SPACE" prompt, day badge.
 * Runs in parallel with whichever room is active, so it survives airlock transitions.
 */
export class HudScene extends Phaser.Scene {
  constructor() {
    super(SCENES.HUD);
  }

  create() {
    const font = { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' };

    // Day Display (Top-left, matching sketch)
    this.dayText = this.add.text(24, 18, 'Day 1', {
      fontFamily: 'monospace',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffd166',
    });

    // 4 Pill Meters (2x2 grid in top-left)
    // Row 1: Power & Oxygen
    this.powerMeter = new PillMeter(this, 24, 52, {
      type: 'power',
      label: 'Power',
      color: 0xffd166,
      width: 170,
      height: 30,
    });

    this.oxygenMeter = new PillMeter(this, 268, 52, {
      type: 'oxygen',
      label: 'Oxygen',
      color: 0x6fc3df,
      width: 170,
      height: 30,
    });

    // Row 2: Water & Radiation
    this.waterMeter = new PillMeter(this, 24, 88, {
      type: 'water',
      label: 'Water',
      color: 0x4a90e2,
      width: 170,
      height: 30,
    });

    this.radiationMeter = new PillMeter(this, 268, 88, {
      type: 'radiation',
      label: 'Radiation',
      color: 0x50fa7b,
      width: 170,
      height: 30,
    });

    // Top Header: Title, Logbook, Settings, and Pause Button
    this.createTitleBanner();
    this.createLogbookButton();
    this.createSettingsButton();
    this.createPauseButton();
    this.createPauseOverlay();
    this.createSettingsModal();

    // Floating NASA Fact Card (shifted left so it never covers the Airlock, larger for legibility)
    this.factCard = new FactCard(this, GAME_WIDTH - 595, 58);

    // Floating Side Warning Card (shows wrong decisions with Rewind to Checkpoint)
    this.warningCard = new WarningCard(this, 24, 136);

    // Live Two-Page Astronaut Mission Logbook modal
    this.logbookModal = new LogbookModal(this);

    // Floating interaction prompt
    this.prompt = this.add
      .text(GAME_WIDTH / 2, 120, '', { ...font, fontSize: '20px', backgroundColor: '#000c', padding: { x: 14, y: 7 } })
      .setOrigin(0.5)
      .setVisible(false);

    this.toast = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 30, '', {
        ...font,
        color: '#ffd166',
        backgroundColor: '#0f172acc',
        padding: { x: 14, y: 6 },
      })
      .setOrigin(0.5)
      .setVisible(false);

    const unsub = [
      gameState.on('meters', () => this.refresh()),
      gameState.on('step', () => this.refresh()),
      gameState.on('logbook', () => this.syncLogbookDot()),
      gameState.on('audio', () => this.applyAudioSettings()),
    ];
    this.game.events.on('prompt', this.showPrompt, this);
    this.game.events.on('toast', this.showToast, this);
    this.game.events.on('station:interact', this.onInteract, this);
    this.game.events.on('fact:show', this.onShowFact, this);
    this.game.events.on('fact:hide', this.onHideFact, this);
    this.game.events.on('logbook:unlock', this.onUnlockFact, this);
    this.game.events.on('tutorial:logbook', this.showLogbookTutorial, this);
    this.game.events.on('tutorial:move', this.showMoveTutorial, this);
    this.game.events.on('warning:show', this.onShowWarning, this);
    this.game.events.on('warning:hide', this.onHideWarning, this);
    this.game.events.on('checkpoint:rewind-lights', this.onRewindLightsCheckpoint, this);
    this.game.events.on('checkpoint:rewind-d2-oxygen', this.onRewindD2Oxygen, this);
    this.game.events.on('checkpoint:rewind-d2-night', this.onRewindD2Night, this);
    this.game.events.on('checkpoint:rewind-d3-water', this.onRewindD3Water, this);
    this.game.events.on('checkpoint:rewind-d3-night', this.onRewindD3Night, this);
    this.game.events.on('checkpoint:rewind-d4-safemode', this.onRewindD4SafeMode, this);
    this.game.events.on('checkpoint:rewind-d5-storm', this.onRewindD5Storm, this);
    this.game.events.on('checkpoint:rewind-d6-surface', this.onRewindD6Surface, this);
    this.game.events.on('checkpoint:rewind-d6-swap', this.onRewindD6Swap, this);
    this.game.events.on('radiation:start-d5-decay', this.startD5RadiationDecay, this);
    this.game.events.on('radiation:stop-d5-decay', this.stopD5RadiationDecay, this);
    this.game.events.on('radiation:start-d5-surface-storm', this.startD5SurfaceRadiation, this);
    this.game.events.on('radiation:stop-d5-surface-storm', this.stopD5SurfaceRadiation, this);
    this.game.events.on('radiation:gradual-charge', this.startRadiationCharge, this);
    this.game.events.on('storm:transition-play', this.playTransitionStorm, this);
    this.game.events.on('lifesupport:start-d5-moderate', this.startD5ModerateDecay, this);
    this.game.events.on('lifesupport:stop-d5-moderate', this.stopD5ModerateDecay, this);
    this.game.events.on('radiation:start-d6-surface', this.startD6SurfaceRadiation, this);
    this.game.events.on('radiation:stop-d6-surface', this.stopD6SurfaceRadiation, this);
    this.game.events.on('radiation:start-d7-surface', this.startD7SurfaceRadiation, this);
    this.game.events.on('radiation:stop-d7-surface', this.stopD7SurfaceRadiation, this);
    this.game.events.on('power:gradual-charge', this.startGradualPowerCharge, this);
    this.game.events.on('power:gradual-charge-from', this.startGradualPowerFromCurrent, this);
    this.game.events.on('power:start-night-drain', this.startNightDrain, this);
    this.game.events.on('power:stop-night-drain', this.stopNightDrain, this);
    this.game.events.on('power:safe-mode-changed', this.onSafeModeChanged, this);
    this.game.events.on('power:start-dust-drain', this.startDustDrain, this);
    this.game.events.on('power:stop-dust-drain', this.stopDustDrain, this);
    this.game.events.on('oxygen:gradual-charge', this.startGradualOxygenCharge, this);
    this.game.events.on('oxygen:start-rapid-drain', this.startRapidOxygenDrain, this);
    this.game.events.on('oxygen:stop-rapid-drain', this.stopRapidOxygenDrain, this);
    this.game.events.on('oxygen:start-day3-deplete', this.startDay3OxygenDeplete, this);
    this.game.events.on('water:gradual-charge', this.startGradualWaterCharge, this);
    this.game.events.on('water:start-rapid-drain', this.startRapidWaterDrain, this);
    this.game.events.on('water:stop-rapid-drain', this.stopRapidWaterDrain, this);
    this.game.events.on('water:start-day4-decay', this.startDay4WaterDecay, this);
    this.game.events.on('water:stop-day4-decay', this.stopDay4WaterDecay, this);
    this.game.events.on('lights:restored', this.stopInitialPowerCharge, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      unsub.forEach((fn) => fn());
      this.game.events.off('prompt', this.showPrompt, this);
      this.game.events.off('toast', this.showToast, this);
      this.game.events.off('station:interact', this.onInteract, this);
      this.game.events.off('fact:show', this.onShowFact, this);
      this.game.events.off('fact:hide', this.onHideFact, this);
      this.game.events.off('logbook:unlock', this.onUnlockFact, this);
      this.game.events.off('tutorial:logbook', this.showLogbookTutorial, this);
      this.game.events.off('tutorial:move', this.showMoveTutorial, this);
      this.game.events.off('warning:show', this.onShowWarning, this);
      this.game.events.off('warning:hide', this.onHideWarning, this);
      this.game.events.off('checkpoint:rewind-lights', this.onRewindLightsCheckpoint, this);
      this.game.events.off('checkpoint:rewind-d2-oxygen', this.onRewindD2Oxygen, this);
      this.game.events.off('checkpoint:rewind-d2-night', this.onRewindD2Night, this);
      this.game.events.off('checkpoint:rewind-d3-water', this.onRewindD3Water, this);
      this.game.events.off('checkpoint:rewind-d3-night', this.onRewindD3Night, this);
      this.game.events.off('checkpoint:rewind-d4-safemode', this.onRewindD4SafeMode, this);
      this.game.events.off('checkpoint:rewind-d5-storm', this.onRewindD5Storm, this);
      this.game.events.off('checkpoint:rewind-d6-surface', this.onRewindD6Surface, this);
      this.game.events.off('checkpoint:rewind-d6-swap', this.onRewindD6Swap, this);
      this.game.events.off('radiation:start-d5-decay', this.startD5RadiationDecay, this);
      this.game.events.off('radiation:stop-d5-decay', this.stopD5RadiationDecay, this);
      this.game.events.off('radiation:start-d5-surface-storm', this.startD5SurfaceRadiation, this);
      this.game.events.off('radiation:stop-d5-surface-storm', this.stopD5SurfaceRadiation, this);
      this.game.events.off('radiation:gradual-charge', this.startRadiationCharge, this);
      this.game.events.off('storm:transition-play', this.playTransitionStorm, this);
      this.game.events.off('lifesupport:start-d5-moderate', this.startD5ModerateDecay, this);
      this.game.events.off('lifesupport:stop-d5-moderate', this.stopD5ModerateDecay, this);
      this.game.events.off('radiation:start-d6-surface', this.startD6SurfaceRadiation, this);
      this.game.events.off('radiation:stop-d6-surface', this.stopD6SurfaceRadiation, this);
      this.game.events.off('radiation:start-d7-surface', this.startD7SurfaceRadiation, this);
      this.game.events.off('radiation:stop-d7-surface', this.stopD7SurfaceRadiation, this);
      this.game.events.off('power:gradual-charge', this.startGradualPowerCharge, this);
      this.game.events.off('power:gradual-charge-from', this.startGradualPowerFromCurrent, this);
      this.game.events.off('power:start-night-drain', this.startNightDrain, this);
      this.game.events.off('power:stop-night-drain', this.stopNightDrain, this);
      this.game.events.off('power:safe-mode-changed', this.onSafeModeChanged, this);
      this.game.events.off('power:start-dust-drain', this.startDustDrain, this);
      this.game.events.off('power:stop-dust-drain', this.stopDustDrain, this);
      this.game.events.off('oxygen:gradual-charge', this.startGradualOxygenCharge, this);
      this.game.events.off('oxygen:start-rapid-drain', this.startRapidOxygenDrain, this);
      this.game.events.off('oxygen:stop-rapid-drain', this.stopRapidOxygenDrain, this);
      this.game.events.off('oxygen:start-day3-deplete', this.startDay3OxygenDeplete, this);
      this.game.events.off('water:gradual-charge', this.startGradualWaterCharge, this);
      this.game.events.off('water:start-rapid-drain', this.startRapidWaterDrain, this);
      this.game.events.off('water:stop-rapid-drain', this.stopRapidWaterDrain, this);
      this.game.events.off('water:start-day4-decay', this.startDay4WaterDecay, this);
      this.game.events.off('water:stop-day4-decay', this.stopDay4WaterDecay, this);
      this.game.events.off('lights:restored', this.stopInitialPowerCharge, this);
      this.stopNightDrain();
      this.stopDustDrain();
      this.stopRapidOxygenDrain();
      this.stopDay3OxygenDeplete();
      this.stopRapidWaterDrain();
      this.stopDay4WaterDecay();
      this.stopInitialPowerCharge();
      this.stopD5RadiationDecay();
      this.stopD5SurfaceRadiation();
      this.stopRadiationCharge();
      this.stopD5ModerateDecay();
      this.stopD6SurfaceRadiation();
      this.stopD7SurfaceRadiation();
      if (this.settingsDragMove) {
        this.input?.off('pointermove', this.settingsDragMove);
        this.settingsDragMove = null;
      }
      if (this.settingsDragUp) {
        this.input?.off('pointerup', this.settingsDragUp);
        this.settingsDragUp = null;
      }
      const stormBgm = this.getValidSound('sfx-storm');
      if (stormBgm?.isPlaying) stormBgm.stop();
      this.factCard?.stopTypingSound();
    });

    this.refresh();
  }

  getValidSound(key) {
    const s = this.sound.get(key);
    if (s && (s.pendingRemove || !s.currentConfig)) {
      this.sound.remove(s);
      return null;
    }
    return s;
  }

  applyAudioSettings() {
    const bgmVol = gameState.getEffectiveVolume('music', 0.35);
    ['bgm-main', 'bgm-day1', 'bgm-day2', 'bgm-day3', 'bgm-day4'].forEach((k) => {
      const s = this.getValidSound(k);
      if (s) s.setVolume(bgmVol);
    });
    const stormSfx = this.getValidSound('sfx-storm');
    if (stormSfx) {
      stormSfx.setVolume(gameState.getEffectiveVolume('sfx', gameState.day === 5 ? 0.42 : 0.5));
    }
    const radioSfx = this.getValidSound('sfx-radio');
    if (radioSfx) {
      radioSfx.setVolume(gameState.getEffectiveVolume('sfx', 0.55));
    }
    const talkSfx = this.getValidSound('voice-talk');
    if (talkSfx) {
      talkSfx.setVolume(gameState.getEffectiveVolume('talking', 0.5));
    }
    const typeSfx = this.getValidSound('sfx-typing');
    if (typeSfx) {
      typeSfx.setVolume(gameState.getEffectiveVolume('talking', 0.5));
    }
  }

  syncDayBgm() {
    if (gameState.day === 5) {
      ['bgm-main', 'bgm-day1', 'bgm-day2', 'bgm-day3', 'bgm-day4'].forEach((k) => {
        const s = this.getValidSound(k);
        if (s?.isPlaying) s.stop();
      });
      if (!this.cache.audio.exists('sfx-storm')) return;
      const stormVol = gameState.getEffectiveVolume('sfx', 0.42);
      const stormSound = this.getValidSound('sfx-storm');
      if (this.currentBgmKey === 'sfx-storm' && stormSound?.isPlaying) {
        stormSound.setVolume(stormVol);
        return;
      }
      if (stormSound) {
        if (!stormSound.isPlaying) stormSound.play({ loop: true, volume: stormVol });
        else stormSound.setVolume(stormVol);
      } else {
        this.sound.add('sfx-storm', { loop: true, volume: stormVol }).play();
      }
      this.currentBgmKey = 'sfx-storm';
      return;
    }

    if (!this.transitionStormActive) {
      const stormPlaying = this.getValidSound('sfx-storm');
      if (stormPlaying?.isPlaying && this.currentBgmKey === 'sfx-storm') {
        stormPlaying.stop();
      }
    }

    const dayKey =
      gameState.day === 6 ? 'bgm-main' : gameState.day >= 7 ? 'bgm-day4' : `bgm-day${gameState.day}`;
    const targetKey = this.cache.audio.exists(dayKey) ? dayKey : 'bgm-main';
    if (!this.cache.audio.exists(targetKey)) return;

    const bgmVol = gameState.getEffectiveVolume('music', 0.35);
    const curSound = this.getValidSound(targetKey);

    // Play each day's backtrack at most ONCE per Sol (no replay on room transitions or loop)
    if (gameState.playedBgmDays?.has(gameState.day)) {
      if (curSound?.isPlaying) curSound.setVolume(bgmVol);
      return;
    }

    gameState.playedBgmDays?.add(gameState.day);
    ['bgm-main', 'bgm-day1', 'bgm-day2', 'bgm-day3', 'bgm-day4'].forEach((k) => {
      if (k === targetKey) return;
      const s = this.getValidSound(k);
      if (s?.isPlaying) s.stop();
    });

    if (curSound) {
      if (!curSound.isPlaying) curSound.play({ loop: false, volume: bgmVol });
      else curSound.setVolume(bgmVol);
    } else {
      this.sound.add(targetKey, { loop: false, volume: bgmVol }).play();
    }
    this.currentBgmKey = targetKey;
  }

  /** Play storm transition audio across night transitions and fade it out smoothly into morning. */
  playTransitionStorm(durationMs = 5400) {
    if (!this.cache.audio.exists('sfx-storm')) return;
    const stormVol = gameState.getEffectiveVolume('sfx', 0.52);
    if (stormVol <= 0) return;

    if (this.transitionStormTween) {
      this.transitionStormTween.stop();
      this.transitionStormTween = null;
    }
    this.transitionStormActive = true;

    let s = this.getValidSound('sfx-storm');
    if (s?.isPlaying) s.stop();
    if (!s) {
      s = this.sound.add('sfx-storm', { loop: true, volume: stormVol });
    }
    s.play({ loop: true, volume: stormVol });

    this.time.delayedCall(Math.max(1200, durationMs - 2200), () => {
      if (!s || s.pendingRemove) {
        this.transitionStormActive = false;
        return;
      }
      this.transitionStormTween = this.tweens.add({
        targets: s,
        volume: 0,
        duration: 2400,
        ease: 'Sine.easeOut',
        onComplete: () => {
          this.transitionStormActive = false;
          this.transitionStormTween = null;
          if (gameState.day !== 5 && s?.isPlaying) s.stop();
        },
      });
    });
  }

  refresh() {
    this.syncDayBgm();
    this.dayText.setText(`Day ${gameState.day}`);
    this.powerMeter.setValue(gameState.meters.power);
    this.powerMeter.setSafeModeGlow(!!gameState.d4SafeModeOn);
    this.oxygenMeter.setValue(gameState.meters.oxygen);
    this.waterMeter.setValue(gameState.meters.water);
    this.radiationMeter.setValue(gameState.meters.radiation);
  }

  onSafeModeChanged(active) {
    this.powerMeter?.setSafeModeGlow(!!active);
  }

  showPrompt(label) {
    this.prompt.setVisible(!!label);
    if (label) this.prompt.setText(`${label}  -  Press SPACE / tap`);
  }

  showToast(message) {
    if (this.toastTimer) this.toastTimer.remove();
    this.toast.setText(message);
    this.toast.setVisible(true);
    this.toastTimer = this.time.delayedCall(2200, () => {
      this.toast.setVisible(false);
    });
  }

  onInteract({ station }) {
    this.showToast(`[${station}] mini-game not built yet`);
  }

  onShowFact(payload) {
    const text = typeof payload === 'string' ? payload : payload.text;
    const matchedId = (typeof payload === 'object' && payload?.id) || matchLogbookEntry(text);
    if (matchedId) {
      gameState.unlockFact(matchedId);
    }
    this.factCard.show(text);
  }

  onUnlockFact(factId) {
    const resolved = matchLogbookEntry(factId) || factId;
    gameState.unlockFact(resolved);
  }

  onHideFact(immediate = true) {
    this.factCard.hide(immediate);
  }

  onShowWarning(payload) {
    const msg = typeof payload === 'string' ? payload : payload?.text;
    if (msg && msg.includes('0.84 kg')) {
      gameState.unlockFact('human_o2_consumption');
    }
    this.warningCard.show(payload);
  }

  onHideWarning() {
    this.warningCard.hide();
  }

  onRewindLightsCheckpoint() {
    RewindManager.rewindLightsCheckpoint(this);
  }

  onRewindD2Oxygen() {
    RewindManager.rewindD2Oxygen(this);
  }

  onRewindD2Night() {
    RewindManager.rewindD2Night(this);
  }

  onRewindD3Water() {
    RewindManager.rewindD3Water(this);
  }

  onRewindD3Night() {
    RewindManager.rewindD3Night(this);
  }

  onRewindD4SafeMode() {
    RewindManager.rewindD4SafeMode(this);
  }

  onRewindD5Storm() {
    RewindManager.rewindD5Storm(this);
  }

  onRewindD6Surface() {
    RewindManager.rewindD6Surface(this);
  }

  onRewindD6Swap() {
    RewindManager.rewindD6Swap(this);
  }

  startD5SurfaceRadiation() {
    if (gameState.day !== 5 || gameState.room !== 'surface') return;
    this.stopRadiationCharge();
    this.radiationMeter?.setShaking(true);
    if (this.d5SurfaceRadEvent) {
      this.d5SurfaceRadEvent.remove();
      this.d5SurfaceRadEvent = null;
    }

    this.d5SurfaceRadEvent = this.time.addEvent({
      delay: 190,
      loop: true,
      callback: () => {
        if (gameState.day !== 5 || gameState.room !== 'surface') {
          this.stopD5SurfaceRadiation();
          return;
        }
        const cur = gameState.meters.radiation ?? 88;
        const next = Math.max(15, cur - 1);
        gameState.setMeters({ radiation: next });
        if (next <= 35 && !this.warningCard.visible) {
          this.warningCard.show({
            text: 'DANGER: Solar storm radiation on the surface is falling rapidly! Rewind now so Maisha rushes back inside the shelter.',
            rewindEvent: 'checkpoint:rewind-d5-storm',
          });
        }
        if (next <= 15) {
          this.stopD5SurfaceRadiation();
        }
      },
    });
  }

  stopD5SurfaceRadiation() {
    if (this.d5SurfaceRadEvent) {
      this.d5SurfaceRadEvent.remove();
      this.d5SurfaceRadEvent = null;
    }
    this.radiationMeter?.setShaking(false);
  }

  startRadiationCharge(targetVal = 88) {
    this.stopD5SurfaceRadiation();
    this.stopRadiationCharge();
    const goal = typeof targetVal === 'number' ? targetVal : gameState.d5BunksBagged ? 95 : 88;

    this.radChargeEvent = this.time.addEvent({
      delay: 85,
      loop: true,
      callback: () => {
        const cur = gameState.meters.radiation ?? 40;
        if (cur >= goal) {
          this.stopRadiationCharge();
          if (gameState.day === 5 && !gameState.d5BunksBagged) {
            this.startD5RadiationDecay();
          }
          return;
        }
        gameState.setMeters({ radiation: Math.min(goal, cur + 2) });
      },
    });
  }

  stopRadiationCharge() {
    if (this.radChargeEvent) {
      this.radChargeEvent.remove();
      this.radChargeEvent = null;
    }
  }

  startD5RadiationDecay() {
    if (gameState.day !== 5 || gameState.d5BunksBagged) return;
    this.radiationMeter?.setShaking(true);
    if (this.d5RadEvent) {
      this.d5RadEvent.remove();
      this.d5RadEvent = null;
    }

    this.d5RadEvent = this.time.addEvent({
      delay: 2500,
      loop: true,
      callback: () => {
        if (gameState.day !== 5 || gameState.d5BunksBagged) {
          this.stopD5RadiationDecay();
          return;
        }
        const cur = gameState.meters.radiation ?? 88;
        const next = Math.max(0, cur - 1);
        gameState.setMeters({ radiation: next });
        if (next <= 30) {
          this.stopD5RadiationDecay();
          this.warningCard.show({
            text: 'CRITICAL: Solar particle & gamma rays penetrated unshielded bunks! Place sealed water bags around the Bunks.',
            rewindEvent: 'checkpoint:rewind-d5-storm',
          });
        }
      },
    });
  }

  stopD5RadiationDecay() {
    if (this.d5RadEvent) {
      this.d5RadEvent.remove();
      this.d5RadEvent = null;
    }
    this.radiationMeter?.setShaking(false);
  }

  startD5ModerateDecay() {
    if (gameState.day !== 5) return;
    if (this.d5OxDecayEvent) this.d5OxDecayEvent.remove();
    if (this.d5WaterDecayEvent) this.d5WaterDecayEvent.remove();

    this.d5OxDecayEvent = this.time.addEvent({
      delay: 4500,
      loop: true,
      callback: () => {
        if (gameState.day !== 5) {
          this.stopD5ModerateDecay();
          return;
        }
        const curOx = gameState.meters.oxygen ?? 96;
        if (curOx > 78) gameState.setMeters({ oxygen: curOx - 1 });
      },
    });

    this.d5WaterDecayEvent = this.time.addEvent({
      delay: 4000,
      loop: true,
      callback: () => {
        if (gameState.day !== 5) {
          this.stopD5ModerateDecay();
          return;
        }
        const curW = gameState.meters.water ?? 90;
        if (curW > 74) gameState.setMeters({ water: curW - 1 });
      },
    });
  }

  stopD5ModerateDecay() {
    if (this.d5OxDecayEvent) {
      this.d5OxDecayEvent.remove();
      this.d5OxDecayEvent = null;
    }
    if (this.d5WaterDecayEvent) {
      this.d5WaterDecayEvent.remove();
      this.d5WaterDecayEvent = null;
    }
  }

  startD6SurfaceRadiation() {
    if (gameState.day !== 6 || gameState.room !== 'surface') return;
    this.radiationMeter?.setShaking(true);
    if (this.d6RadEvent) {
      this.d6RadEvent.remove();
      this.d6RadEvent = null;
    }

    this.d6RadEvent = this.time.addEvent({
      delay: 1100,
      loop: true,
      callback: () => {
        if (gameState.day !== 6 || gameState.room !== 'surface' || gameState.d6CropsPlanted) {
          this.stopD6SurfaceRadiation();
          return;
        }
        const cur = gameState.meters.radiation ?? 95;
        const next = Math.max(0, cur - 1);
        gameState.setMeters({ radiation: next });
        if (next <= 30) {
          this.stopD6SurfaceRadiation();
          this.warningCard.show({
            text: 'RADIATION DANGER: Extended outdoor exposure reached lethal dose limits! Rotate crew or rewind!',
            rewindEvent: gameState.d6GreenhouseBuilt ? 'checkpoint:rewind-d6-swap' : 'checkpoint:rewind-d6-surface',
          });
        }
      },
    });
  }

  stopD6SurfaceRadiation() {
    if (this.d6RadEvent) {
      this.d6RadEvent.remove();
      this.d6RadEvent = null;
    }
    this.radiationMeter?.setShaking(false);
  }

  startD7SurfaceRadiation() {
    if (gameState.day !== 7 || gameState.room !== 'surface' || gameState.d7GreenhouseBagged) return;
    this.radiationMeter?.setShaking(true);
    if (this.d7RadEvent) {
      this.d7RadEvent.remove();
      this.d7RadEvent = null;
    }

    this.d7RadEvent = this.time.addEvent({
      delay: 2400,
      loop: true,
      callback: () => {
        if (gameState.day !== 7 || gameState.room !== 'surface' || gameState.d7GreenhouseBagged) {
          this.stopD7SurfaceRadiation();
          return;
        }
        const cur = gameState.meters.radiation ?? 90;
        if (cur > 55) gameState.setMeters({ radiation: cur - 1 });
      },
    });
  }

  stopD7SurfaceRadiation() {
    if (this.d7RadEvent) {
      this.d7RadEvent.remove();
      this.d7RadEvent = null;
    }
    this.radiationMeter?.setShaking(false);
  }

  startDustDrain() {
    this.powerMeter.setShaking(true);
    if (this.dustDrainEvent) return;

    this.dustDrainEvent = this.time.addEvent({
      delay: 6000,
      loop: true,
      callback: () => {
        const done =
          (gameState.day === 2 && gameState.d2PanelCleaned) ||
          (gameState.day === 4 && gameState.d4PanelCleaned && gameState.d4PanelAligned) ||
          (gameState.day !== 2 && gameState.day !== 4);
        if (done) {
          this.stopDustDrain();
          return;
        }
        const minPower = gameState.day === 4 ? 10 : 50;
        if (gameState.meters.power !== null && gameState.meters.power > minPower) {
          gameState.setMeters({ power: gameState.meters.power - 1 });
        }
      },
    });
  }

  stopDustDrain() {
    if (this.dustDrainEvent) {
      this.dustDrainEvent.remove();
      this.dustDrainEvent = null;
    }
    this.powerMeter.setShaking(false);
  }

  startGradualPowerFromCurrent() {
    gameState.unlockFact('opportunity_dust_2018');
    this.stopDustDrain();
    if (this.chargeFromEvent) {
      this.chargeFromEvent.remove();
      this.chargeFromEvent = null;
    }

    let current = gameState.meters.power ?? 75;
    if (current >= 100) {
      gameState.setMeters({ power: 100 });
      return;
    }

    this.chargeFromEvent = this.time.addEvent({
      delay: 55,
      loop: true,
      callback: () => {
        if (gameState.day !== 2 || gameState.d2OxBuilt) {
          this.chargeFromEvent.remove();
          this.chargeFromEvent = null;
          return;
        }
        current = Math.min(100, current + 1);
        gameState.setMeters({ power: current });
        if (current >= 100) {
          this.chargeFromEvent.remove();
          this.chargeFromEvent = null;
        }
      },
    });
  }

  startRapidOxygenDrain() {
    this.oxygenMeter?.setShaking(true);
    if (this.oxygenChargeEvent) {
      this.oxygenChargeEvent.remove();
      this.oxygenChargeEvent = null;
    }
    if (this.rapidOxDrainEvent) return;

    this.rapidOxDrainEvent = this.time.addEvent({
      delay: 350,
      loop: true,
      callback: () => {
        if ((gameState.day !== 2 && gameState.day !== 3) || gameState.d2OxSwitchOn) {
          this.stopRapidOxygenDrain();
          return;
        }
        const cur = gameState.meters.oxygen ?? 100;
        const next = Math.max(0, cur - 2);
        gameState.setMeters({ oxygen: next });
        if (next <= 0) {
          this.stopRapidOxygenDrain();
          this.warningCard.show({
            text: 'CRITICAL: Habitat Oxygen hit 0%! Turn OXYGEN MAKER back ON or rewind!',
            rewindEvent: gameState.day === 3 ? 'checkpoint:rewind-d3-night' : 'checkpoint:rewind-d2-night',
          });
        }
      },
    });
  }

  stopRapidOxygenDrain() {
    if (this.rapidOxDrainEvent) {
      this.rapidOxDrainEvent.remove();
      this.rapidOxDrainEvent = null;
    }
    this.oxygenMeter?.setShaking(false);
  }

  startDay3OxygenDeplete() {
    this.oxygenMeter?.setShaking(true);
    if (this.day3OxDepleteEvent) return;

    this.day3OxDepleteEvent = this.time.addEvent({
      delay: 2500,
      loop: true,
      callback: () => {
        if (gameState.day !== 3 || gameState.d3OxIceLoaded) {
          this.stopDay3OxygenDeplete();
          return;
        }
        const cur = gameState.meters.oxygen ?? 55;
        if (cur > 25) {
          gameState.setMeters({ oxygen: Math.max(25, cur - 1) });
        }
      },
    });
  }

  stopDay3OxygenDeplete() {
    if (this.day3OxDepleteEvent) {
      this.day3OxDepleteEvent.remove();
      this.day3OxDepleteEvent = null;
    }
    this.oxygenMeter?.setShaking(false);
  }

  startGradualOxygenCharge() {
    this.stopRapidOxygenDrain();
    this.stopDay3OxygenDeplete();
    gameState.unlockFact('human_o2_consumption');
    if (this.chargeFromEvent) {
      this.chargeFromEvent.remove();
      this.chargeFromEvent = null;
    }
    if (this.oxygenChargeEvent) {
      this.oxygenChargeEvent.remove();
      this.oxygenChargeEvent = null;
    }

    let current = gameState.meters.oxygen ?? 20;

    this.oxygenChargeEvent = this.time.addEvent({
      delay: 140,
      loop: true,
      callback: () => {
        if (
          (gameState.day !== 2 && gameState.day !== 3 && gameState.day !== 4 && gameState.day !== 7) ||
          !gameState.d2OxSwitchOn
        ) {
          this.oxygenChargeEvent.remove();
          this.oxygenChargeEvent = null;
          return;
        }
        current = Math.min(100, current + 1);
        gameState.setMeters({ oxygen: current });
        if (current >= 100) {
          this.oxygenChargeEvent.remove();
          this.oxygenChargeEvent = null;
        }
      },
    });
  }

  startGradualWaterCharge() {
    this.stopRapidWaterDrain();
    this.stopDay4WaterDecay();
    if (this.waterChargeEvent) {
      this.waterChargeEvent.remove();
      this.waterChargeEvent = null;
    }

    let current = gameState.meters.water ?? 10;

    this.waterChargeEvent = this.time.addEvent({
      delay: 140,
      loop: true,
      callback: () => {
        if ((gameState.day !== 3 && gameState.day !== 4 && gameState.day !== 7) || !gameState.d3WaterSwitchOn) {
          this.waterChargeEvent.remove();
          this.waterChargeEvent = null;
          return;
        }
        current = Math.min(100, current + 1);
        gameState.setMeters({ water: current });
        if (current >= 100) {
          this.waterChargeEvent.remove();
          this.waterChargeEvent = null;
        }
      },
    });
  }

  startRapidWaterDrain() {
    this.waterMeter?.setShaking(true);
    if (this.waterChargeEvent) {
      this.waterChargeEvent.remove();
      this.waterChargeEvent = null;
    }
    if (this.rapidWaterDrainEvent) return;

    this.rapidWaterDrainEvent = this.time.addEvent({
      delay: 350,
      loop: true,
      callback: () => {
        if (gameState.day !== 3 || gameState.d3WaterSwitchOn) {
          this.stopRapidWaterDrain();
          return;
        }
        const cur = gameState.meters.water ?? 15;
        const next = Math.max(0, cur - 2);
        gameState.setMeters({ water: next });
        if (next <= 0) {
          this.stopRapidWaterDrain();
          this.warningCard.show({
            text: 'CRITICAL: Habitat Water hit 0%! Rewind to allocate power or turn WATER STATION back ON!',
            rewindEvent: gameState.d3WaterBuilt ? 'checkpoint:rewind-d3-night' : 'checkpoint:rewind-d3-water',
          });
        }
      },
    });
  }

  stopRapidWaterDrain() {
    if (this.rapidWaterDrainEvent) {
      this.rapidWaterDrainEvent.remove();
      this.rapidWaterDrainEvent = null;
    }
    this.waterMeter?.setShaking(false);
  }

  startDay4WaterDecay() {
    if (this.day4WaterDecayEvent) return;

    this.day4WaterDecayEvent = this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => {
        if (gameState.day !== 4 || gameState.d3WaterSwitchOn || gameState.d4ReactorBuilt) {
          this.stopDay4WaterDecay();
          return;
        }
        const cur = gameState.meters.water ?? 100;
        if (cur > 40) {
          gameState.setMeters({ water: cur - 1 });
        }
      },
    });
  }

  stopDay4WaterDecay() {
    if (this.day4WaterDecayEvent) {
      this.day4WaterDecayEvent.remove();
      this.day4WaterDecayEvent = null;
    }
  }

  stopInitialPowerCharge() {
    if (this.chargeEvent) {
      this.chargeEvent.remove();
      this.chargeEvent = null;
    }
  }

  startGradualPowerCharge() {
    gameState.unlockFact('solar_arrays');
    this.stopInitialPowerCharge();
    gameState.setMeters({ power: 0 });

    // Charge smoothly from 0% to 100% over 6 seconds (60 ticks at 100ms each)
    let current = 0;
    this.chargeEvent = this.time.addEvent({
      delay: 60,
      repeat: 99,
      callback: () => {
        // Stop charging if lights were already turned on
        if (gameState.habLightsOn) {
          this.chargeEvent.remove();
          return;
        }
        current = Math.min(100, current + 1);
        gameState.setMeters({ power: current });
      },
    });
  }

  startNightDrain() {
    gameState.nightDrainActive = true;
    if (this.nightDrainEvent) {
      this.nightDrainEvent.remove();
      this.nightDrainEvent = null;
    }

    // Drain power periodically while night drain is active (Days 1-3 until nuclear reactor)
    this.nightDrainEvent = this.time.addEvent({
      delay: 4000,
      loop: true,
      callback: () => {
        if (!gameState.nightDrainActive || gameState.day > 3 || gameState.d4ReactorBuilt) {
          this.stopNightDrain();
          return;
        }
        const step = gameState.day === 3 ? 2 : 1;
        if (gameState.meters.power !== null && gameState.meters.power > 10) {
          gameState.setMeters({ power: Math.max(10, gameState.meters.power - step) });
        }
      },
    });
  }

  stopNightDrain() {
    if (this.nightDrainEvent) {
      this.nightDrainEvent.remove();
      this.nightDrainEvent = null;
    }
  }

  createTitleBanner() {
    const cx = GAME_WIDTH / 2;
    const cy = 28;
    const w = 410;
    const h = 34;

    const banner = this.add.container(cx, cy);

    // Decorative plate
    const plate = this.add.graphics();
    plate.fillStyle(0x131722, 0.88);
    plate.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    plate.lineStyle(1.5, 0x334155, 1);
    plate.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);

    // Cyan sci-fi corner brackets
    plate.lineStyle(2, 0x38bdf8, 1);
    const cSize = 6;
    // Top-left
    plate.lineBetween(-w / 2, -h / 2 + cSize, -w / 2, -h / 2);
    plate.lineBetween(-w / 2, -h / 2, -w / 2 + cSize, -h / 2);
    // Top-right
    plate.lineBetween(w / 2, -h / 2 + cSize, w / 2, -h / 2);
    plate.lineBetween(w / 2, -h / 2, w / 2 - cSize, -h / 2);
    // Bottom-left
    plate.lineBetween(-w / 2, h / 2 - cSize, -w / 2, h / 2);
    plate.lineBetween(-w / 2, h / 2, -w / 2 + cSize, h / 2);
    // Bottom-right
    plate.lineBetween(w / 2, h / 2 - cSize, w / 2, h / 2);
    plate.lineBetween(w / 2, h / 2, w / 2 - cSize, h / 2);

    // Subtle bottom glow line
    plate.lineStyle(2, 0xf97316, 0.8);
    plate.lineBetween(-w / 4, h / 2, w / 4, h / 2);

    banner.add(plate);

    // Title Text
    const titleText = this.add
      .text(0, 0, 'STRANDED ON MARS: SEVEN SOLS', {
        fontFamily: 'monospace',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#f1f5f9',
      })
      .setOrigin(0.5);
    banner.add(titleText);
  }

  createLogbookButton() {
    const bx = GAME_WIDTH / 2 + 236;
    const by = 28;
    const btn = this.add.container(bx, by);

    const bg = this.add.graphics();
    const drawBg = (hover = false) => {
      bg.clear();
      bg.fillStyle(hover ? 0x273142 : 0x181f2c, 0.9);
      bg.fillRoundedRect(-17, -17, 34, 34, 6);
      bg.lineStyle(1.5, hover ? 0x38bdf8 : 0x475569, 1);
      bg.strokeRoundedRect(-17, -17, 34, 34, 6);

      // Open Book Icon
      bg.fillStyle(0xf8fafc, 1);
      // Left Page
      bg.beginPath();
      bg.moveTo(-1, -7);
      bg.lineTo(-10, -9);
      bg.lineTo(-10, 6);
      bg.lineTo(-1, 8);
      bg.closePath();
      bg.fillPath();

      // Right Page
      bg.beginPath();
      bg.moveTo(1, -7);
      bg.lineTo(10, -9);
      bg.lineTo(10, 6);
      bg.lineTo(1, 8);
      bg.closePath();
      bg.fillPath();

      // Spine & Ribbon
      bg.lineStyle(1.5, 0x0f172a, 1);
      bg.lineBetween(0, -7, 0, 8);
      bg.fillStyle(0xf59e0b, 1);
      bg.fillRect(2, -8, 2, 7);
    };

    drawBg(false);
    btn.add(bg);

    this.logbookRedDot = this.add
      .circle(13, -13, 6, 0xef4444)
      .setStrokeStyle(2, 0xffffff)
      .setVisible(!!gameState.hasUnreadLogbook);
    btn.add(this.logbookRedDot);

    this.tweens.add({
      targets: this.logbookRedDot,
      scale: 1.25,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    const hit = this.add.rectangle(0, 0, 34, 34, 0x000000, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => drawBg(true));
    hit.on('pointerout', () => drawBg(false));
    hit.on('pointerdown', (_p, _lx, _ly, event) => {
      if (event) event.stopPropagation();
      this.logbookModal.openLatest();
    });
    btn.add(hit);
  }

  syncLogbookDot() {
    if (this.logbookRedDot) {
      this.logbookRedDot.setVisible(!!gameState.hasUnreadLogbook);
    }
  }

  drawKeyCap(parent, x, y, label, w = 46, h = 46) {
    const g = this.add.graphics();
    g.fillStyle(0x1e293b, 1);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    g.lineStyle(2, 0x38bdf8, 0.95);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    const t = this.add
      .text(x, y, label, {
        fontFamily: 'monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#f8fafc',
      })
      .setOrigin(0.5);
    parent.add([g, t]);
  }

  showLogbookTutorial(onComplete) {
    const bx = GAME_WIDTH / 2 + 236;
    const by = 28;
    const overlay = this.add.container(0, 0).setDepth(2450);

    // Full-screen dim hue overlay that absorbs clicks
    const hue = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x060b19, 0.84).setOrigin(0).setInteractive();
    hue.on('pointerdown', (_p, _lx, _ly, event) => {
      if (event) event.stopPropagation();
    });
    overlay.add(hue);

    // Spotlight halo + highlighted Logbook icon replica
    const halo = this.add.graphics();
    halo.fillStyle(0x38bdf8, 0.16);
    halo.fillCircle(bx, by, 34);
    halo.lineStyle(3, 0xffd166, 1);
    halo.strokeCircle(bx, by, 26);

    halo.fillStyle(0x273142, 1);
    halo.fillRoundedRect(bx - 17, by - 17, 34, 34, 6);
    halo.lineStyle(2, 0x38bdf8, 1);
    halo.strokeRoundedRect(bx - 17, by - 17, 34, 34, 6);
    halo.fillStyle(0xf8fafc, 1);
    halo.fillRect(bx - 10, by - 8, 9, 15);
    halo.fillRect(bx + 1, by - 8, 9, 15);
    halo.fillStyle(0xef4444, 1);
    halo.fillCircle(bx + 13, by - 13, 6);
    overlay.add(halo);

    // Upward bouncing arrow pointing to Logbook button
    const arrow = this.add
      .text(bx, by + 44, '▲', {
        fontFamily: 'monospace',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#ffd166',
      })
      .setOrigin(0.5);
    overlay.add(arrow);
    this.tweens.add({
      targets: arrow,
      y: by + 34,
      duration: 450,
      yoyo: true,
      repeat: -1,
    });

    // Callout Tutorial Box
    const cardW = 540;
    const cardH = 220;
    const cardX = GAME_WIDTH / 2;
    const cardY = 230;
    const card = this.add.graphics();
    card.fillStyle(0x0f172a, 0.96);
    card.fillRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 14);
    card.lineStyle(2.5, 0x38bdf8, 1);
    card.strokeRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 14);
    overlay.add(card);

    overlay.add(
      this.add
        .text(
          cardX,
          cardY - 12,
          'MISSION LOGBOOK UPDATED!\n\nMaisha records every NASA fact, mission photo, and reference\nin this open 2-page journal.\n\nWhenever you see the RED DOT on the Logbook icon above,\na new discovery has been added. Click it anytime to flip pages!',
          {
            fontFamily: 'monospace',
            fontSize: '14px',
            align: 'center',
            lineSpacing: 6,
            color: '#f8fafc',
          }
        )
        .setOrigin(0.5)
    );

    overlay.add(
      this.add
        .text(cardX, cardY + 84, '▶ TAP / PRESS SPACE TO CONTINUE', {
          fontFamily: 'monospace',
          fontSize: '13px',
          fontStyle: 'bold',
          color: '#ffd166',
        })
        .setOrigin(0.5)
    );

    let done = false;
    const dismiss = () => {
      if (done) return;
      done = true;
      hue.off('pointerdown', dismiss);
      this.input.keyboard.off('keydown-SPACE', dismiss);
      overlay.destroy();
      if (onComplete) {
        this.time.delayedCall(30, onComplete);
      }
    };

    this.time.delayedCall(220, () => {
      if (done) return;
      hue.on('pointerdown', dismiss);
      this.input.keyboard.on('keydown-SPACE', dismiss);
    });
  }

  showMoveTutorial(onComplete) {
    const activeRoom = gameState.room === 'surface' ? SCENES.SURFACE : SCENES.OUTPOST;
    let pausedRoom = null;
    if (this.scene.isActive(activeRoom) && !this.isPaused) {
      this.scene.pause(activeRoom);
      pausedRoom = activeRoom;
    }

    const overlay = this.add.container(0, 0).setDepth(2450);
    const hue = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x060b19, 0.8).setOrigin(0).setInteractive();
    hue.on('pointerdown', (_p, _lx, _ly, event) => {
      if (event) event.stopPropagation();
    });
    overlay.add(hue);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const cardW = 580;
    const cardH = 310;

    const card = this.add.graphics();
    card.fillStyle(0x0f172a, 0.96);
    card.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 16);
    card.lineStyle(2.5, 0xffd166, 1);
    card.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 16);
    overlay.add(card);

    overlay.add(
      this.add
        .text(cx, cy - 118, 'MISSION CONTROLS TUTORIAL', {
          fontFamily: 'monospace',
          fontSize: '18px',
          fontStyle: 'bold',
          color: '#ffd166',
        })
        .setOrigin(0.5)
    );

    // Drawn Arrow Key cluster (left) & SPACE / TAP badge (right)
    this.drawKeyCap(overlay, cx - 125, cy - 52, '▲');
    this.drawKeyCap(overlay, cx - 177, cy + 2, '◄');
    this.drawKeyCap(overlay, cx - 125, cy + 2, '▼');
    this.drawKeyCap(overlay, cx - 73, cy + 2, '►');
    this.drawKeyCap(overlay, cx + 115, cy - 22, 'SPACE / TAP', 175, 48);

    overlay.add(
      this.add
        .text(
          cx,
          cy + 68,
          '• Use ARROW KEYS (◄ ▲ ▼ ►) to walk around the Martian surface & outpost.\n• Stand near any glowing station or Airlock and press SPACE (or TAP) to interact.',
          {
            fontFamily: 'monospace',
            fontSize: '13px',
            align: 'center',
            lineSpacing: 6,
            color: '#e2e8f0',
          }
        )
        .setOrigin(0.5)
    );

    overlay.add(
      this.add
        .text(cx, cy + 124, '▶ TAP / PRESS SPACE OR ARROW KEYS TO BEGIN', {
          fontFamily: 'monospace',
          fontSize: '13px',
          fontStyle: 'bold',
          color: '#34d399',
        })
        .setOrigin(0.5)
    );

    let done = false;
    const dismiss = () => {
      if (done) return;
      done = true;
      hue.off('pointerdown', dismiss);
      this.input.keyboard.off('keydown-SPACE', dismiss);
      this.input.keyboard.off('keydown-LEFT', dismiss);
      this.input.keyboard.off('keydown-RIGHT', dismiss);
      this.input.keyboard.off('keydown-UP', dismiss);
      this.input.keyboard.off('keydown-DOWN', dismiss);
      overlay.destroy();
      if (pausedRoom) {
        this.time.delayedCall(30, () => {
          this.scene.resume(pausedRoom);
          if (onComplete) onComplete();
        });
      } else if (onComplete) {
        this.time.delayedCall(30, onComplete);
      }
    };

    this.time.delayedCall(220, () => {
      if (done) return;
      hue.on('pointerdown', dismiss);
      this.input.keyboard.on('keydown-SPACE', dismiss);
      this.input.keyboard.on('keydown-LEFT', dismiss);
      this.input.keyboard.on('keydown-RIGHT', dismiss);
      this.input.keyboard.on('keydown-UP', dismiss);
      this.input.keyboard.on('keydown-DOWN', dismiss);
    });
  }

  createSettingsButton() {
    const sx = GAME_WIDTH - 78;
    const sy = 28;
    const btn = this.add.container(sx, sy);

    const bg = this.add.graphics();
    const drawBtn = (hover = false) => {
      bg.clear();
      bg.fillStyle(hover ? 0x273142 : 0x181f2c, 0.9);
      bg.fillRoundedRect(-17, -17, 34, 34, 6);
      bg.lineStyle(1.5, hover ? 0x38bdf8 : 0x475569, 1);
      bg.strokeRoundedRect(-17, -17, 34, 34, 6);
    };
    drawBtn(false);

    const icon = this.add
      .text(0, 0, '⚙', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#e2e8f0',
      })
      .setOrigin(0.5);

    btn.add([bg, icon]);

    const hit = this.add.rectangle(0, 0, 34, 34, 0x000000, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => {
      drawBtn(true);
      icon.setColor('#38bdf8');
    });
    hit.on('pointerout', () => {
      drawBtn(false);
      icon.setColor('#e2e8f0');
    });
    hit.on('pointerdown', (_p, _lx, _ly, event) => {
      if (event) event.stopPropagation();
      this.toggleSettingsModal();
    });
    btn.add(hit);
  }

  createSettingsModal() {
    this.isSettingsOpen = false;
    this.roomPausedBySettings = false;
    this.settingsContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(2600).setVisible(false);

    const backdrop = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.78).setInteractive();
    backdrop.on('pointerdown', (_p, _lx, _ly, event) => {
      if (event) event.stopPropagation();
    });

    const panel = this.add.graphics();
    panel.fillStyle(0x0f172a, 0.97);
    panel.fillRoundedRect(-280, -195, 560, 390, 14);
    panel.lineStyle(2.5, 0x38bdf8, 0.95);
    panel.strokeRoundedRect(-280, -195, 560, 390, 14);

    const title = this.add
      .text(0, -160, 'AUDIO & SOUND SETTINGS', {
        fontFamily: 'monospace',
        fontSize: '19px',
        fontStyle: 'bold',
        color: '#ffd166',
      })
      .setOrigin(0.5);

    const closeX = this.add
      .text(252, -160, '[X]', {
        fontFamily: 'monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#f87171',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', (_p, _lx, _ly, event) => {
        if (event) event.stopPropagation();
        this.toggleSettingsModal(false);
      });

    this.settingsContainer.add([backdrop, panel, title, closeX]);

    const channels = [
      { key: 'music', label: 'Music (BGM)', accent: 0x38bdf8, y: -92 },
      { key: 'sfx', label: 'Sound Effects (SFX)', accent: 0xf59e0b, y: -32 },
      { key: 'footsteps', label: 'Footsteps', accent: 0xa78bfa, y: 28 },
      { key: 'talking', label: 'Talking & Voice', accent: 0x4ade80, y: 88 },
    ];

    const trackX = -46;
    const trackW = 180;
    let activeDragRow = null;
    this.settingsRowUpdaters = [];

    const updateSliderFromPointer = (row, pointer) => {
      const worldTrackLeft = GAME_WIDTH / 2 + trackX;
      const ratio = Phaser.Math.Clamp((pointer.x - worldTrackLeft) / trackW, 0, 1);
      const snapped = Math.round(ratio * 100) / 100;
      gameState.setAudioSettings({
        [`${row.key}Volume`]: snapped,
        [`${row.key}Muted`]: snapped === 0,
      });
      this.refreshSettingsRows();
    };

    channels.forEach((ch) => {
      const lbl = this.add
        .text(-246, ch.y, ch.label, {
          fontFamily: 'monospace',
          fontSize: '13px',
          fontStyle: 'bold',
          color: '#f8fafc',
        })
        .setOrigin(0, 0.5);

      const trackGfx = this.add.graphics();
      const knob = this.add.circle(trackX + trackW, ch.y, 9, 0xffffff).setStrokeStyle(2.5, ch.accent);
      const pctText = this.add
        .text(trackX + trackW + 32, ch.y, '100%', {
          fontFamily: 'monospace',
          fontSize: '13px',
          fontStyle: 'bold',
          color: '#cbd5e1',
        })
        .setOrigin(0.5);

      const muteBg = this.add.rectangle(224, ch.y, 68, 28, 0x16a34a, 1).setStrokeStyle(1.5, 0x86efac, 1);
      const muteTxt = this.add
        .text(224, ch.y, 'ON', {
          fontFamily: 'monospace',
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#ffffff',
        })
        .setOrigin(0.5);

      const muteHit = this.add
        .zone(224, ch.y, 68, 28)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', (_p, _lx, _ly, event) => {
          if (event) event.stopPropagation();
          const mutedKey = `${ch.key}Muted`;
          const volKey = `${ch.key}Volume`;
          const nextMuted = !gameState.audioSettings[mutedKey];
          const patch = { [mutedKey]: nextMuted };
          if (!nextMuted && (gameState.audioSettings[volKey] ?? 1) === 0) {
            patch[volKey] = 0.5;
          }
          gameState.setAudioSettings(patch);
          this.refreshSettingsRows();
        });

      const row = { ...ch, trackGfx, knob, pctText, muteBg, muteTxt };
      const sliderHit = this.add
        .zone(trackX + trackW / 2, ch.y, trackW + 18, 28)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', (pointer, _lx, _ly, event) => {
          if (event) event.stopPropagation();
          activeDragRow = row;
          updateSliderFromPointer(row, pointer);
        });

      const redraw = () => {
        const vol = gameState.audioSettings[`${ch.key}Volume`] ?? 1;
        const muted = !!gameState.audioSettings[`${ch.key}Muted`];
        const effective = muted ? 0 : vol;
        const fillW = Math.max(0, trackW * effective);

        trackGfx.clear();
        trackGfx.fillStyle(0x1e293b, 1);
        trackGfx.fillRoundedRect(trackX, ch.y - 5, trackW, 10, 5);
        trackGfx.lineStyle(1, 0x475569, 1);
        trackGfx.strokeRoundedRect(trackX, ch.y - 5, trackW, 10, 5);
        if (fillW > 0) {
          trackGfx.fillStyle(ch.accent, 0.95);
          trackGfx.fillRoundedRect(trackX, ch.y - 5, fillW, 10, 5);
        }

        knob.setX(trackX + fillW);
        knob.setFillStyle(muted ? 0x64748b : 0xffffff);
        pctText.setText(`${Math.round(effective * 100)}%`);
        pctText.setColor(muted ? '#f87171' : '#e2e8f0');

        muteBg.setFillStyle(muted ? 0x991b1b : 0x16a34a, 1);
        muteBg.setStrokeStyle(1.5, muted ? 0xf87171 : 0x86efac, 1);
        muteTxt.setText(muted ? 'MUTED' : 'ON');
      };

      row.redraw = redraw;
      this.settingsRowUpdaters.push(row);
      this.settingsContainer.add([lbl, trackGfx, knob, sliderHit, pctText, muteBg, muteTxt, muteHit]);
    });

    this.settingsDragMove = (pointer) => {
      if (this.isSettingsOpen && activeDragRow && pointer.isDown) {
        updateSliderFromPointer(activeDragRow, pointer);
      }
    };
    this.settingsDragUp = () => {
      activeDragRow = null;
    };
    this.input.on('pointermove', this.settingsDragMove);
    this.input.on('pointerup', this.settingsDragUp);

    // Mute All / Unmute All button
    const muteAllBg = this.add.rectangle(-95, 152, 165, 34, 0x334155, 1).setStrokeStyle(1.5, 0x94a3b8, 1);
    this.muteAllTxt = this.add
      .text(-95, 152, 'MUTE ALL', {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#f8fafc',
      })
      .setOrigin(0.5);
    const muteAllHit = this.add
      .zone(-95, 152, 165, 34)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', (_p, _lx, _ly, event) => {
        if (event) event.stopPropagation();
        const s = gameState.audioSettings;
        const allMuted = s.musicMuted && s.sfxMuted && s.footstepsMuted && s.talkingMuted;
        const nextMuted = !allMuted;
        const patch = {
          musicMuted: nextMuted,
          sfxMuted: nextMuted,
          footstepsMuted: nextMuted,
          talkingMuted: nextMuted,
        };
        if (!nextMuted) {
          if (s.musicVolume === 0) patch.musicVolume = 0.5;
          if (s.sfxVolume === 0) patch.sfxVolume = 0.5;
          if (s.footstepsVolume === 0) patch.footstepsVolume = 0.5;
          if (s.talkingVolume === 0) patch.talkingVolume = 0.5;
        }
        gameState.setAudioSettings(patch);
        this.refreshSettingsRows();
      });

    // Close button
    const closeBg = this.add.rectangle(95, 152, 145, 34, 0x2563eb, 1).setStrokeStyle(1.5, 0x93c5fd, 1);
    const closeTxt = this.add
      .text(95, 152, 'DONE', {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    const closeHit = this.add
      .zone(95, 152, 145, 34)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', (_p, _lx, _ly, event) => {
        if (event) event.stopPropagation();
        this.toggleSettingsModal(false);
      });

    this.settingsContainer.add([muteAllBg, this.muteAllTxt, muteAllHit, closeBg, closeTxt, closeHit]);
    this.refreshSettingsRows();
  }

  refreshSettingsRows() {
    if (!this.settingsRowUpdaters) return;
    this.settingsRowUpdaters.forEach((r) => r.redraw());
    if (this.muteAllTxt) {
      const s = gameState.audioSettings;
      const allMuted = s.musicMuted && s.sfxMuted && s.footstepsMuted && s.talkingMuted;
      this.muteAllTxt.setText(allMuted ? 'UNMUTE ALL' : 'MUTE ALL');
    }
  }

  toggleSettingsModal(force) {
    const next = typeof force === 'boolean' ? force : !this.isSettingsOpen;
    if (next === this.isSettingsOpen) return;
    this.isSettingsOpen = next;
    this.settingsContainer.setVisible(next);
    const activeRoom = gameState.room === 'surface' ? SCENES.SURFACE : SCENES.OUTPOST;

    if (next) {
      this.refreshSettingsRows();
      if (!this.isPaused && this.scene.isActive(activeRoom)) {
        this.scene.pause(activeRoom);
        this.roomPausedBySettings = true;
      }
    } else if (this.roomPausedBySettings) {
      this.roomPausedBySettings = false;
      if (!this.isPaused && this.scene.isPaused(activeRoom)) {
        this.scene.resume(activeRoom);
      }
    }
  }

  createPauseButton() {
    const px = GAME_WIDTH - 36;
    const py = 28;
    const btn = this.add.container(px, py);

    const bg = this.add.graphics();
    const drawPause = (hover = false) => {
      bg.clear();
      bg.fillStyle(hover ? 0x273142 : 0x181f2c, 0.9);
      bg.fillRoundedRect(-17, -17, 34, 34, 6);
      bg.lineStyle(1.5, hover ? 0xf43f5e : 0x475569, 1);
      bg.strokeRoundedRect(-17, -17, 34, 34, 6);

      // Two vertical pause bars ||
      bg.fillStyle(0xffffff, 1);
      bg.fillRoundedRect(-6, -7, 4, 14, 2);
      bg.fillRoundedRect(2, -7, 4, 14, 2);
    };

    drawPause(false);
    btn.add(bg);

    const hit = this.add.rectangle(0, 0, 34, 34, 0x000000, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => drawPause(true));
    hit.on('pointerout', () => drawPause(false));
    hit.on('pointerdown', (_p, _lx, _ly, event) => {
      if (event) event.stopPropagation();
      this.togglePause();
    });
    btn.add(hit);

    this.input.keyboard.on('keydown-P', () => this.togglePause());
  }

  createPauseOverlay() {
    this.isPaused = false;
    this.pauseContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(2500).setVisible(false);

    const backdrop = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75).setInteractive();
    backdrop.on('pointerdown', (_p, _lx, _ly, event) => {
      if (event) event.stopPropagation();
    });
    const box = this.add.graphics();
    box.fillStyle(0x111827, 0.95);
    box.fillRoundedRect(-185, -120, 370, 240, 12);
    box.lineStyle(2, 0x64748b, 1);
    box.strokeRoundedRect(-185, -120, 370, 240, 12);

    const title = this.add
      .text(0, -76, 'SIMULATION PAUSED', {
        fontFamily: 'monospace',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffd166',
      })
      .setOrigin(0.5);

    const hint = this.add
      .text(0, -34, 'Press [P] or click Resume to continue', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    const settingsBtn = this.add.container(0, 18);
    const sBg = this.add.graphics();
    sBg.fillStyle(0x1e293b, 1);
    sBg.fillRoundedRect(-90, -16, 180, 32, 6);
    sBg.lineStyle(1.5, 0x38bdf8, 1);
    sBg.strokeRoundedRect(-90, -16, 180, 32, 6);
    const sText = this.add
      .text(0, 0, '⚙ AUDIO SETTINGS', {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#38bdf8',
      })
      .setOrigin(0.5);
    settingsBtn.add([sBg, sText]);
    settingsBtn.setSize(180, 32);
    settingsBtn.setInteractive({ useHandCursor: true });
    settingsBtn.on('pointerdown', (_p, _lx, _ly, event) => {
      if (event) event.stopPropagation();
      this.toggleSettingsModal(true);
    });

    const resumeBtn = this.add.container(0, 72);
    const rBg = this.add.graphics();
    rBg.fillStyle(0x2563eb, 1);
    rBg.fillRoundedRect(-70, -16, 140, 32, 6);
    const rText = this.add
      .text(0, 0, 'RESUME', {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    resumeBtn.add([rBg, rText]);
    resumeBtn.setSize(140, 32);
    resumeBtn.setInteractive({ useHandCursor: true });
    resumeBtn.on('pointerdown', (_p, _lx, _ly, event) => {
      if (event) event.stopPropagation();
      this.togglePause();
    });

    this.pauseContainer.add([backdrop, box, title, hint, settingsBtn, resumeBtn]);
  }

  togglePause() {
    if (this.isSettingsOpen) {
      this.toggleSettingsModal(false);
    }
    this.isPaused = !this.isPaused;
    this.pauseContainer.setVisible(this.isPaused);

    const activeRoom = gameState.room === 'surface' ? SCENES.SURFACE : SCENES.OUTPOST;
    if (this.isPaused) {
      if (this.scene.isActive(activeRoom)) {
        this.scene.pause(activeRoom);
      }
    } else {
      if (this.scene.isPaused(activeRoom)) {
        this.scene.resume(activeRoom);
      }
    }
  }
}
