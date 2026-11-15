import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/constants.js';
import { gameState } from '../../state/GameState.js';

/**
 * Outpost Power Breaker Panel.
 * Controls switches for: Light, Oxygen, Water, Battery, Safe Mode.
 * Slides up smoothly from the bottom.
 */
export class PowerPanelTask extends Phaser.Scene {
  constructor() {
    super('PowerPanelTask');
  }

  create(data = {}) {
    this.closing = false;
    this.lightsChangeState = null;
    this.d2OxOffWarning = false;
    this.d2SilentDark = false;
    this.d3OxOffWarning = false;
    this.d3WaterOffWarning = false;
    this.d3OxTurnedOn = false;
    this.d3WaterTurnedOn = false;
    this.d3LightsReenabledWarning = false;
    this.d4WaterPaused = false;
    this.d4SafeModeActivated = false;
    this.d4SafeModeFailed = false;

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Dark backdrop
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75).setOrigin(0);

    // Master container for slide-up entrance
    this.modal = this.add.container(cx, GAME_HEIGHT + 300);

    const panelW = 520;
    const panelH = 480;

    // Outer metal chassis
    const chassis = this.add.graphics();
    chassis.fillStyle(0x1e2129, 1);
    chassis.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);
    chassis.lineStyle(3, 0x4f586d, 1);
    chassis.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 14);

    // Hazard stripe header
    chassis.fillStyle(0xd97706, 1);
    chassis.fillRoundedRect(-panelW / 2 + 6, -panelH / 2 + 6, panelW - 12, 42, { tl: 10, tr: 10, bl: 0, br: 0 });

    this.modal.add(chassis);

    // Panel Title
    const title = this.add
      .text(0, -panelH / 2 + 27, '⚡ OUTPOST POWER BREAKER BOARD', {
        fontFamily: 'monospace',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#111827',
      })
      .setOrigin(0.5);
    this.modal.add(title);

    // Subtitle / Status
    this.statusText = this.add
      .text(0, -panelH / 2 + 68, 'TOTAL POWER: 100% | LOAD: BALANCED', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#ffd166',
      })
      .setOrigin(0.5);
    this.modal.add(this.statusText);

    // Close button (X)
    const closeBtn = this.add
      .text(panelW / 2 - 30, -panelH / 2 + 27, '[X]', {
        fontFamily: 'monospace',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.closeTask());
    this.modal.add(closeBtn);

    // Configure switch list per day / narrative progression
    // On Day 1, only the option of lights is inside the power board
    if (gameState.day === 1) {
      this.switches = [
        {
          id: 'light',
          label: 'LIGHTS',
          desc: 'Main habitat illumination',
          on: gameState.habLightsOn || false,
          load: 10,
          locked: false,
        },
      ];
    } else if (gameState.day === 2) {
      this.switches = [
        {
          id: 'light',
          label: 'LIGHTS',
          desc: 'Main habitat illumination',
          on: gameState.habLightsOn,
          load: 10,
          locked: false,
        },
      ];
      if (gameState.d2OxBuilt) {
        this.switches.push({
          id: 'oxygen',
          label: 'OXYGEN',
          desc: 'Life support water splitting',
          on: gameState.d2OxSwitchOn,
          load: 40,
          locked: false,
        });
      }
    } else if (gameState.day === 3) {
      this.switches = [
        {
          id: 'light',
          label: 'LIGHTS',
          desc: 'Main habitat illumination',
          on: !!gameState.habLightsOn,
          load: 10,
          locked: false,
        },
        {
          id: 'oxygen',
          label: 'OXYGEN',
          desc: 'Life support water splitting',
          on: !!gameState.d2OxSwitchOn,
          load: 40,
          locked: false,
        },
      ];
      if (gameState.d3WaterBuilt) {
        this.switches.push({
          id: 'water',
          label: 'WATER',
          desc: 'Filtration and melting pumps',
          on: !!gameState.d3WaterSwitchOn,
          load: 20,
          locked: false,
        });
      }
    } else if (gameState.day === 4 && gameState.d4CommsDone) {
      this.switches = [
        {
          id: 'light',
          label: 'LIGHTS',
          desc: 'Habitat illumination (Locked ON — Kilopower)',
          on: true,
          load: 10,
          locked: true,
        },
        {
          id: 'oxygen',
          label: 'OXYGEN',
          desc: 'Life support water splitting (Locked ON — Kilopower)',
          on: true,
          load: 40,
          locked: true,
        },
        {
          id: 'water',
          label: 'WATER',
          desc: 'Filtration and melting pumps (Locked ON — Kilopower)',
          on: true,
          load: 20,
          locked: true,
        },
        {
          id: 'safemode',
          label: 'SAFE MODE',
          desc: 'Isolate & surge-protect circuits for solar storm',
          on: !!gameState.d4SafeModeOn,
          load: -15,
          locked: false,
        },
      ];
    } else if (gameState.day === 4) {
      this.switches = [
        {
          id: 'light',
          label: 'LIGHTS',
          desc: 'Main habitat illumination (Locked)',
          on: true,
          load: 10,
          locked: true,
        },
        {
          id: 'oxygen',
          label: 'OXYGEN',
          desc: 'Life support water splitting (Locked)',
          on: true,
          load: 40,
          locked: true,
        },
        {
          id: 'water',
          label: 'WATER',
          desc: 'Filtration and melting pumps',
          on: !!gameState.d3WaterSwitchOn,
          load: 20,
          locked: false,
        },
      ];
    } else {
      this.switches = [
        { id: 'light', label: 'LIGHTS', desc: 'Main habitat illumination', on: true, load: 15, locked: false },
        { id: 'oxygen', label: 'OXYGEN', desc: 'Life support water splitting', on: true, load: 40, locked: false },
        { id: 'water', label: 'WATER', desc: 'Filtration and melting pumps', on: false, load: 20, locked: false },
        { id: 'safemode', label: 'SAFE MODE', desc: 'Cut non-essential auxiliary draw', on: false, load: -20, locked: false },
      ];
    }

    // Render 4 switch rows with spacious tactile layout
    const startY = -panelH / 2 + 120;
    const rowGap = 66;

    this.switchViews = [];

    this.switches.forEach((sw, idx) => {
      const rowY = startY + idx * rowGap;
      const rowContainer = this.add.container(0, rowY);

      // Row background plate
      const rowBg = this.add.graphics();
      rowBg.fillStyle(0x13151a, 0.95);
      rowBg.fillRoundedRect(-panelW / 2 + 20, -25, panelW - 40, 52, 10);
      rowBg.lineStyle(1.5, 0x2e3442, 1);
      rowBg.strokeRoundedRect(-panelW / 2 + 20, -25, panelW - 40, 52, 10);
      rowContainer.add(rowBg);

      // Label & Description
      const labelText = this.add.text(-panelW / 2 + 36, -16, sw.label, {
        fontFamily: 'monospace',
        fontSize: '17px',
        fontStyle: 'bold',
        color: '#ffffff',
      });
      const descText = this.add.text(-panelW / 2 + 36, 6, sw.desc, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#8b949e',
      });
      rowContainer.add([labelText, descText]);

      // Aerospace Tactile Switch (Recessed Track + Beveled Rocker Slider)
      const trackX = panelW / 2 - 144;
      const track = this.add.graphics();
      const knob = this.add.graphics();
      const statusPill = this.add
        .text(trackX + 34, 0, sw.on ? '[ONLINE]' : '[OFFLINE]', {
          fontFamily: 'monospace',
          fontSize: '13px',
          fontStyle: 'bold',
          color: sw.on ? '#06b6d4' : '#64748b',
        })
        .setOrigin(0, 0.5);

      rowContainer.add([track, knob, statusPill]);

      const updateSwitchVisual = (isOn) => {
        track.clear();
        // Recessed outer groove
        track.fillStyle(0x0a0c10, 1);
        track.fillRoundedRect(trackX - 26, -14, 52, 28, 14);
        track.lineStyle(2, isOn ? 0x0284c7 : 0x1e293b, 1);
        track.strokeRoundedRect(trackX - 26, -14, 52, 28, 14);

        // Illuminated active channel when ON
        if (isOn) {
          track.fillStyle(0x0369a1, 0.85);
          track.fillRoundedRect(trackX - 22, -10, 30, 20, 10);
          // Neon power strip indicator
          track.lineStyle(2, 0x38bdf8, 0.9);
          track.lineBetween(trackX - 16, 0, trackX - 4, 0);
        }

        knob.clear();
        const knobX = isOn ? trackX + 11 : trackX - 11;

        // Knob shadow
        knob.fillStyle(0x000000, 0.45);
        knob.fillRoundedRect(knobX - 11, -10, 22, 24, 7);

        // Tactile metallic slider knob body
        knob.fillStyle(isOn ? 0xf1f5f9 : 0x94a3b8, 1);
        knob.fillRoundedRect(knobX - 11, -12, 22, 24, 6);
        knob.lineStyle(1.5, isOn ? 0x38bdf8 : 0x475569, 1);
        knob.strokeRoundedRect(knobX - 11, -12, 22, 24, 6);

        // Tactile grip grooves
        knob.lineStyle(1, 0x475569, 0.8);
        knob.lineBetween(knobX - 3, -6, knobX - 3, 6);
        knob.lineBetween(knobX + 3, -6, knobX + 3, 6);

        // Micro LED status pip on the knob
        knob.fillStyle(isOn ? 0x10b981 : 0xef4444, 1);
        knob.fillCircle(knobX, 0, 3);

        if (sw.locked) {
          statusPill.setText(isOn ? '[LOCKED ON]' : '[LOCKED]');
          statusPill.setColor('#64748b');
        } else {
          statusPill.setText(isOn ? '[ONLINE]' : '[OFFLINE]');
          statusPill.setColor(isOn ? '#06b6d4' : '#64748b');
        }
      };

      if (sw.locked) {
        rowContainer.setAlpha(0.45);
      }

      updateSwitchVisual(sw.on);

      // Interactive hit area on the toggle
      if (!sw.locked) {
        const hitArea = this.add
          .rectangle(trackX, 0, 110, 48, 0x000000, 0)
          .setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', () => {
          sw.on = !sw.on;
          updateSwitchVisual(sw.on);
          this.updateLoad();
        });
        rowContainer.add(hitArea);
      }

      this.modal.add(rowContainer);
      this.switchViews.push({ sw, updateSwitchVisual });
    });

    // Apply & Confirm button
    const applyBtn = this.add.container(0, panelH / 2 - 40);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x059669, 1);
    btnBg.fillRoundedRect(-120, -18, 240, 36, 8);
    btnBg.lineStyle(2, 0x34d399, 1);
    btnBg.strokeRoundedRect(-120, -18, 240, 36, 8);

    const btnText = this.add
      .text(0, 0, 'APPLY CONFIGURATION', {
        fontFamily: 'monospace',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    applyBtn.add([btnBg, btnText]);
    applyBtn.setSize(240, 36);
    applyBtn.setInteractive({ useHandCursor: true });
    applyBtn.on('pointerdown', () => this.applyAndClose());
    this.modal.add(applyBtn);

    // Slide up from bottom
    this.tweens.add({
      targets: this.modal,
      y: cy,
      duration: 400,
      ease: 'Back.easeOut',
    });

    // Keyboard ESC to close
    const onEsc = () => this.closeTask();
    this.input.keyboard.on('keydown-ESC', onEsc);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.input?.keyboard) this.input.keyboard.off('keydown-ESC', onEsc);
    });
    this.updateLoad();
  }

  updateLoad() {
    let totalLoad = 0;
    this.switches.forEach((sw) => {
      if (sw.on) totalLoad += sw.load;
    });

    const isSafe = this.switches.find((s) => s.id === 'safemode')?.on;
    if (isSafe) {
      this.statusText.setText(`LOAD: ${Math.max(10, totalLoad)}% | SAFE MODE ACTIVE`).setColor('#50fa7b');
    } else {
      this.statusText.setText(`TOTAL ACTIVE LOAD: ${totalLoad}% | STATUS: NORMAL`).setColor('#ffd166');
    }
  }

  applyAndClose() {
    if (gameState.day === 1) {
      const lightSw = this.switches.find((s) => s.id === 'light');
      if (lightSw) {
        if (lightSw.on) {
          if (!gameState.habLightsOn) {
            gameState.habLightsOn = true;
            if (!gameState.lightsIntroDone) {
              gameState.setMeters({ power: 90 });
            } else {
              const cur = gameState.meters.power ?? 100;
              gameState.setMeters({ power: Math.max(0, cur - 10) });
            }
          }
          this.lightsChangeState = 'turned_on';
        } else if (!gameState.lightsIntroDone) {
          this.game.events.emit('toast', 'Switch LIGHTS to [ONLINE] to turn on the habitat lights!');
        } else {
          if (gameState.habLightsOn) {
            gameState.habLightsOn = false;
            const cur = gameState.meters.power ?? 90;
            gameState.setMeters({ power: Math.min(100, cur + 10) });
          }
          this.lightsChangeState = 'off_warning';
        }
      }
    } else if (gameState.day === 2) {
      const lightSw = this.switches.find((s) => s.id === 'light');
      const oxSw = this.switches.find((s) => s.id === 'oxygen');

      const prevLights = !!gameState.habLightsOn;
      const nextLights = lightSw ? !!lightSw.on : prevLights;
      const prevOx = !!gameState.d2OxSwitchOn;
      const nextOx = oxSw ? !!oxSw.on : prevOx;

      let powerDelta = 0;
      if (prevLights !== nextLights) {
        powerDelta += nextLights ? -10 : 10;
      }
      if (oxSw && prevOx !== nextOx) {
        powerDelta += nextOx ? -40 : 40;
      }

      const curPower = gameState.meters.power ?? 60;
      const nextPower = Math.max(0, Math.min(100, curPower + powerDelta));
      gameState.setMeters({ power: nextPower });

      gameState.habLightsOn = nextLights;
      if (oxSw) {
        gameState.d2OxSwitchOn = nextOx;
      }

      this.lightsChangeState = null;
      this.d2SilentDark = false;
      this.d2OxTurnedOff = false;
      this.d2OxTurnedOn = false;
      this.d2StillOxOff = false;

      if (oxSw && !nextOx) {
        gameState.d2NightModeSet = false;
        if (prevOx) {
          this.d2OxTurnedOff = true;
        } else {
          this.d2StillOxOff = true;
        }
      } else {
        if (oxSw && !prevOx && nextOx) {
          this.d2OxTurnedOn = true;
        }
        if (!nextLights) {
          if (gameState.d2OxBuilt && gameState.d2OxLoaded) {
            gameState.d2NightModeSet = true;
            this.d2SilentDark = true;
          } else {
            gameState.d2NightModeSet = false;
            this.lightsChangeState = 'off_warning';
          }
        } else {
          gameState.d2NightModeSet = false;
          if (!prevLights) {
            this.lightsChangeState = 'turned_on';
          }
          this.lightsChangeState = 'turn_on_skip';
        }
      }
    } else if (gameState.day === 3) {
      const lightSw = this.switches.find((s) => s.id === 'light');
      const oxSw = this.switches.find((s) => s.id === 'oxygen');
      const waterSw = this.switches.find((s) => s.id === 'water');

      const prevLights = !!gameState.habLightsOn;
      const nextLights = lightSw ? !!lightSw.on : prevLights;
      const prevOx = !!gameState.d2OxSwitchOn;
      const nextOx = oxSw ? !!oxSw.on : prevOx;
      const prevWater = !!gameState.d3WaterSwitchOn;
      const nextWater = waterSw ? !!waterSw.on : prevWater;

      let powerDelta = 0;
      if (prevLights !== nextLights) powerDelta += nextLights ? -10 : 10;
      if (oxSw && prevOx !== nextOx) powerDelta += nextOx ? -40 : 40;
      if (waterSw && prevWater !== nextWater) powerDelta += nextWater ? -20 : 20;

      const curPower = gameState.meters.power ?? 40;
      const nextPower = Math.max(0, Math.min(100, curPower + powerDelta));
      gameState.setMeters({ power: nextPower });

      gameState.habLightsOn = nextLights;
      if (oxSw) gameState.d2OxSwitchOn = nextOx;
      if (waterSw) gameState.d3WaterSwitchOn = nextWater;

      this.lightsChangeState = null;
      this.d2SilentDark = false;
      this.d3OxOffWarning = false;
      this.d3WaterOffWarning = false;
      this.d3OxTurnedOn = false;
      this.d3WaterTurnedOn = false;
      this.d3LightsReenabledWarning = false;

      if (oxSw && !prevOx && nextOx) this.d3OxTurnedOn = true;
      if (waterSw && !prevWater && nextWater) this.d3WaterTurnedOn = true;

      if (oxSw && !nextOx) {
        gameState.d3NightModeSet = false;
        this.d3OxOffWarning = true;
      }
      if (waterSw && !nextWater) {
        gameState.d3NightModeSet = false;
        this.d3WaterOffWarning = true;
      }

      if (!this.d3OxOffWarning && !this.d3WaterOffWarning) {
        if (nextLights && gameState.d3LightsTurnedOffOnce) {
          gameState.habLightsOn = true;
          gameState.d3NightModeSet = false;
          this.d3LightsReenabledWarning = true;
        } else if (!nextLights) {
          if (gameState.d3OxIceLoaded) {
            gameState.habLightsOn = false;
            gameState.d3LightsTurnedOffOnce = true;
            gameState.d3NightModeSet = true;
            this.d2SilentDark = true;
          } else {
            gameState.habLightsOn = false;
            this.lightsChangeState = 'off_warning';
          }
        } else {
          gameState.habLightsOn = true;
          gameState.d3NightModeSet = false;
          if (!prevLights) this.lightsChangeState = 'turned_on';
        }
      }
    } else if (gameState.day === 4 && gameState.d4CommsDone) {
      const safeSw = this.switches.find((s) => s.id === 'safemode');
      if (safeSw && safeSw.on) {
        gameState.d4SafeModeOn = true;
        gameState.d3WaterSwitchOn = true;
        gameState.stepId = 'd4_safe_mode';
        this.d4SafeModeActivated = true;
      } else {
        gameState.d4SafeModeOn = false;
        gameState.setMeters({ power: 0 });
        this.d4SafeModeFailed = true;
      }
    } else if (gameState.day === 4) {
      const waterSw = this.switches.find((s) => s.id === 'water');
      if (waterSw && !waterSw.on) {
        if (gameState.d3WaterSwitchOn) {
          const curPower = gameState.meters.power ?? 20;
          gameState.setMeters({ power: Math.min(100, curPower + 20) });
        }
        gameState.d3WaterSwitchOn = false;
        gameState.d4WaterTurnedOff = true;
        this.d4WaterPaused = true;
      } else {
        this.game.events.emit('toast', 'Turn OFF the WATER switch to conserve power before leaving!');
        return;
      }
    }
    this.closeTask();
  }

  closeTask() {
    if (this.closing) return;
    this.closing = true;
    const changeState = this.lightsChangeState;
    const silentDark = this.d2SilentDark;
    const oxTurnedOff = this.d2OxTurnedOff;
    const oxTurnedOn = this.d2OxTurnedOn;
    const stillOxOff = this.d2StillOxOff;
    const d3OxOff = this.d3OxOffWarning;
    const d3WaterOff = this.d3WaterOffWarning;
    const d3OxOn = this.d3OxTurnedOn;
    const d3WaterOn = this.d3WaterTurnedOn;
    const d3LightsRe = this.d3LightsReenabledWarning;
    const d4Paused = this.d4WaterPaused;
    const d4SafeOn = this.d4SafeModeActivated;
    const d4SafeFail = this.d4SafeModeFailed;

    this.tweens.add({
      targets: this.modal,
      y: GAME_HEIGHT + 350,
      duration: 300,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.scene.stop();
        const activeRoom = gameState.room === 'surface' ? 'Surface' : 'Outpost';
        this.scene.resume(activeRoom);
        this.game.events.emit('lights:sync');

        if (d4SafeOn) {
          this.game.events.emit('warning:hide');
          this.game.events.emit('power:safe-mode-changed', true);
          this.game.events.emit('d4:safe-mode-enabled');
          return;
        }

        if (d4SafeFail) {
          this.game.events.emit('power:safe-mode-changed', false);
          this.game.events.emit('warning:show', {
            text: 'Warning: Leaving electrical systems unprotected during a Martian solar storm will overload and destroy the habitat electronics! Enable SAFE MODE on the Power Panel.',
            rewindEvent: 'checkpoint:rewind-d4-safemode',
          });
          return;
        }

        if (d4Paused) {
          this.game.events.emit('warning:hide');
          this.game.events.emit('water:start-day4-decay');
          this.game.events.emit('d4:water-turned-off');
          this.game.events.emit('toast', 'Water station paused to save power. Head outside to fix the solar panels!');
          return;
        }

        if (d3OxOn) {
          this.game.events.emit('oxygen:stop-rapid-drain');
          if (gameState.d3OxIceLoaded) this.game.events.emit('oxygen:gradual-charge');
          this.game.events.emit('warning:hide');
        }
        if (d3WaterOn) {
          this.game.events.emit('water:stop-rapid-drain');
          if (gameState.d3WaterIceLoaded) this.game.events.emit('water:gradual-charge');
          this.game.events.emit('warning:hide');
        }

        if (d3OxOff && d3WaterOff) {
          this.game.events.emit('oxygen:start-rapid-drain');
          this.game.events.emit('water:start-rapid-drain');
          this.game.events.emit('warning:show', {
            text: 'Warning: Switching off BOTH Oxygen and Water saves power, but breathable air and clean water are both dropping fast!',
            rewindEvent: 'checkpoint:rewind-d3-night',
          });
          return;
        }

        if (d3OxOff) {
          this.game.events.emit('oxygen:start-rapid-drain');
          this.game.events.emit('warning:show', {
            text: 'Warning: Switching off the Oxygen Maker saves power, but breathable air is depleting fast! Keep Oxygen ON overnight.',
            rewindEvent: 'checkpoint:rewind-d3-night',
          });
          return;
        }

        if (d3WaterOff) {
          this.game.events.emit('water:start-rapid-drain');
          this.game.events.emit('warning:show', {
            text: 'Warning: Switching off the Water Station saves power, but clean drinking water is depleting fast! Keep Water ON overnight.',
            rewindEvent: 'checkpoint:rewind-d3-night',
          });
          return;
        }

        if (d3LightsRe) {
          this.game.events.emit('lights:restored');
          this.game.events.emit('warning:show', {
            text: 'Warning: Turning the lights back on wastes power needed by Oxygen and Water overnight! Keep the lights OFF before sleeping.',
            rewindEvent: 'checkpoint:rewind-d3-night',
          });
          return;
        }

        if (oxTurnedOff || stillOxOff) {
          this.game.events.emit('oxygen:start-rapid-drain');
          this.game.events.emit('warning:show', {
            text: 'Warning: Never switch off the Oxygen Maker! Without life support, breathable air in the habitat will run out fast.',
            rewindEvent: 'checkpoint:rewind-d2-night',
          });
          return;
        }

        if (oxTurnedOn) {
          this.game.events.emit('oxygen:stop-rapid-drain');
          if (gameState.d2OxLoaded) {
            this.game.events.emit('oxygen:gradual-charge');
          }
          this.game.events.emit('warning:hide');
        }

        if (silentDark) {
          this.game.events.emit('warning:hide');
          this.game.events.emit('lights:turned-off', { silentWarning: true });
          this.game.events.emit(
            'toast',
            oxTurnedOn || d3OxOn
              ? 'Oxygen Maker back online and habitat lights off for the night.'
              : 'Habitat lights off for the night. Rest on the bunks!'
          );
        } else if (changeState === 'turned_on') {
          this.game.events.emit('warning:hide');
          this.game.events.emit('lights:restored');
          if (oxTurnedOn || d3OxOn) {
            this.game.events.emit('toast', 'Oxygen Maker back online.');
          }
        } else if (changeState === 'off_warning') {
          this.game.events.emit('lights:turned-off', { silentWarning: false });
        } else if (oxTurnedOn || d3OxOn) {
          this.game.events.emit('toast', 'Oxygen Maker back online.');
        } else if (d3WaterOn) {
          this.game.events.emit('toast', 'Water Station back online.');
        }
      },
    });
  }
}
