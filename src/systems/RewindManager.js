import { SCENES } from '../config/constants.js';
import { gameState } from '../state/GameState.js';

/**
 * Dedicated checkpoint & rewind manager.
 * Centralizes state restoration so meters never reset to null once unlocked,
 * active drain timers are always halted cleanly, and scenes never soft-lock.
 */
export const RewindManager = {
  /** Snapshot currently unlocked meter floor values before restoring so unlocked meters never disappear. */
  captureUnlockedFloors() {
    return {
      power: gameState.meters.power !== null,
      oxygen: gameState.meters.oxygen !== null,
      water: gameState.meters.water !== null,
      radiation: gameState.meters.radiation !== null,
    };
  },

  /** Ensure meters that were already unlocked stay numeric (never revert to null). */
  ensureUnlockedMeters(floors) {
    const patch = {};
    if (floors.power && gameState.meters.power === null) patch.power = 50;
    if (floors.oxygen && gameState.meters.oxygen === null) patch.oxygen = 100;
    if (floors.water && gameState.meters.water === null) patch.water = 100;
    if (floors.radiation && gameState.meters.radiation === null) patch.radiation = 100;
    if (Object.keys(patch).length > 0) {
      gameState.setMeters(patch);
    }
  },

  stopAllMeterTimers(hud) {
    hud?.playWrongSound?.();
    hud.stopNightDrain?.();
    hud.stopDustDrain?.();
    hud.stopRapidOxygenDrain?.();
    hud.stopDay3OxygenDeplete?.();
    hud.stopRapidWaterDrain?.();
    hud.stopDay4WaterDecay?.();
    hud.stopInitialPowerCharge?.();
    hud.stopD5RadiationDecay?.();
    hud.stopD5SurfaceRadiation?.();
    hud.stopD5ModerateDecay?.();
    hud.stopD6SurfaceRadiation?.();
    hud.stopD7SurfaceRadiation?.();
    hud.stopRadiationCharge?.();
    if (hud.chargeFromEvent) {
      hud.chargeFromEvent.remove();
      hud.chargeFromEvent = null;
    }
    if (hud.oxygenChargeEvent) {
      hud.oxygenChargeEvent.remove();
      hud.oxygenChargeEvent = null;
    }
    if (hud.waterChargeEvent) {
      hud.waterChargeEvent.remove();
      hud.waterChargeEvent = null;
    }
  },

  rewindLightsCheckpoint(hud) {
    hud?.playWrongSound?.();
    hud.warningCard.hide();
    hud.stopInitialPowerCharge();
    gameState.habLightsOn = false;

    if (hud.scene.isActive('PowerPanelTask')) {
      hud.scene.stop('PowerPanelTask');
    }
    hud.game.events.emit('lights:turned-off', { silentWarning: true });

    if (hud.scene.isActive(SCENES.OUTPOST)) {
      hud.scene.pause(SCENES.OUTPOST);
    }
    hud.scene.launch('PowerPanelTask');
  },

  rewindD2Oxygen(hud) {
    const floors = this.captureUnlockedFloors();
    this.stopAllMeterTimers(hud);
    hud.warningCard.hide();

    gameState.d2OxBuilt = false;
    gameState.d2OxLoaded = false;
    gameState.d2OxSwitchOn = true;
    gameState.d2OxPlacedParts = { hopper: true, electrolysis: true, valve: true };
    gameState.stepId = 'd2_ice_drilled';
    gameState.checkpointId = 'd2_ice_drilled';
    gameState.setMeters({ power: 100, oxygen: 20 });
    this.ensureUnlockedMeters(floors);

    if (hud.scene.isActive('OxygenBuildTask')) {
      hud.scene.stop('OxygenBuildTask');
    }
    if (hud.scene.isActive(SCENES.OUTPOST)) {
      hud.scene.pause(SCENES.OUTPOST);
    }
    hud.scene.launch('OxygenBuildTask');
  },

  rewindD2Night(hud) {
    const floors = this.captureUnlockedFloors();
    const oxBefore = gameState.meters.oxygen;
    this.stopAllMeterTimers(hud);
    hud.warningCard.hide();

    const restored = gameState.restoreCheckpoint('d2_night_ready');
    if (!restored) {
      gameState.d2OxBuilt = true;
      gameState.d2OxLoaded = true;
      gameState.setMeters({ power: 60 });
    }
    gameState.d2OxSwitchOn = true;
    gameState.habLightsOn = true;
    gameState.d2NightModeSet = false;
    gameState.nightDrainActive = true;

    // Preserve depleted oxygen so it climbs smoothly back up instead of snapping to 100
    if (typeof oxBefore === 'number' && oxBefore < 100) {
      gameState.setMeters({ oxygen: oxBefore });
      hud.startGradualOxygenCharge();
    } else {
      gameState.setMeters({ oxygen: 100 });
    }
    this.ensureUnlockedMeters(floors);

    hud.startNightDrain();
    hud.game.events.emit('lights:sync');

    if (hud.scene.isActive('PowerPanelTask')) {
      hud.scene.stop('PowerPanelTask');
    }
    if (hud.scene.isActive(SCENES.OUTPOST)) {
      hud.scene.pause(SCENES.OUTPOST);
    }
    hud.scene.launch('PowerPanelTask');
  },

  rewindD3Water(hud) {
    const floors = this.captureUnlockedFloors();
    this.stopAllMeterTimers(hud);
    hud.warningCard.hide();

    const restored = gameState.restoreCheckpoint('d3_before_water_build');
    if (!restored) {
      gameState.setMeters({ power: 60, oxygen: 100, water: 15 });
    }
    gameState.d3WaterBuilt = false;
    gameState.d3WaterSwitchOn = false;
    gameState.d3WaterPlacedParts = {
      inlet_hopper: true,
      heater_coil: true,
      sediment_trap: true,
      charcoal_bed: true,
      clean_spigot: true,
    };
    this.ensureUnlockedMeters(floors);

    if (hud.scene.isActive('WaterBuildTask')) {
      hud.scene.stop('WaterBuildTask');
    }
    if (hud.scene.isActive(SCENES.OUTPOST)) {
      hud.scene.pause(SCENES.OUTPOST);
    }
    hud.scene.launch('WaterBuildTask');
  },

  rewindD3Night(hud) {
    const floors = this.captureUnlockedFloors();
    const oxBefore = gameState.meters.oxygen;
    const waterBefore = gameState.meters.water;
    this.stopAllMeterTimers(hud);
    hud.warningCard.hide();

    const restored = gameState.restoreCheckpoint('d3_night_ready');
    if (!restored) {
      gameState.setMeters({ power: 40 });
    }
    gameState.habLightsOn = true;
    gameState.d2OxSwitchOn = true;
    gameState.d3WaterSwitchOn = true;
    gameState.d3LightsTurnedOffOnce = false;
    gameState.d3NightModeSet = false;
    gameState.nightDrainActive = true;

    if (typeof oxBefore === 'number' && oxBefore < 100) {
      gameState.setMeters({ oxygen: oxBefore });
      hud.startGradualOxygenCharge();
    }
    if (typeof waterBefore === 'number' && waterBefore < 100) {
      gameState.setMeters({ water: waterBefore });
      hud.startGradualWaterCharge();
    }
    this.ensureUnlockedMeters(floors);

    hud.startNightDrain();
    hud.game.events.emit('lights:sync');

    if (hud.scene.isActive('PowerPanelTask')) {
      hud.scene.stop('PowerPanelTask');
    }
    if (hud.scene.isActive(SCENES.OUTPOST)) {
      hud.scene.pause(SCENES.OUTPOST);
    }
    hud.scene.launch('PowerPanelTask');
  },

  rewindD4SafeMode(hud) {
    const floors = this.captureUnlockedFloors();
    this.stopAllMeterTimers(hud);
    hud.warningCard.hide();

    const restored = gameState.restoreCheckpoint('d4_before_safe_mode');
    if (!restored) {
      gameState.d4SafeModeOn = false;
      gameState.d4SafeModeDone = false;
      gameState.d4CommsDone = true;
      gameState.d3WaterSwitchOn = true;
      gameState.d2OxSwitchOn = true;
      gameState.habLightsOn = true;
      gameState.setMeters({ power: 100 });
    }
    this.ensureUnlockedMeters(floors);
    hud.game.events.emit('power:safe-mode-changed', false);
    hud.game.events.emit('lights:sync');

    if (hud.scene.isActive('PowerPanelTask')) {
      hud.scene.stop('PowerPanelTask');
    }
    if (hud.scene.isActive(SCENES.OUTPOST)) {
      hud.scene.pause(SCENES.OUTPOST);
    }
    hud.scene.launch('PowerPanelTask');
  },

  rewindD5Storm(hud) {
    const floors = this.captureUnlockedFloors();
    this.stopAllMeterTimers(hud);
    hud.warningCard.hide();

    // If the astronaut is currently outside on Surface during the solar storm,
    // autonomously walk them back through the Airlock and refill Radiation indoors!
    if (hud.scene.isActive(SCENES.SURFACE)) {
      this.ensureUnlockedMeters(floors);
      hud.game.events.emit('d5:autonomous-return');
      return;
    }

    if (!gameState.restoreCheckpoint('d5_storm_start')) {
      gameState.d5BunksBagged = false;
      gameState.setMeters({ power: 100, oxygen: 92, water: 86, radiation: 88 });
    }
    this.ensureUnlockedMeters(floors);
    gameState.room = 'outpost';
    gameState.activeAstronaut = 'maisha';

    if (hud.scene.isActive(SCENES.OUTPOST)) {
      hud.scene.stop(SCENES.OUTPOST);
    }
    if (hud.scene.isActive(SCENES.SURFACE)) {
      hud.scene.stop(SCENES.SURFACE);
    }
    hud.scene.start(SCENES.OUTPOST);
    hud.startD5RadiationDecay();
  },

  rewindD6Surface(hud) {
    const floors = this.captureUnlockedFloors();
    this.stopAllMeterTimers(hud);
    hud.warningCard.hide();

    if (!gameState.restoreCheckpoint('d6_surface_entry')) {
      gameState.d6GreenhouseBuilt = false;
      gameState.d6GreenhousePlacedParts = {};
      gameState.d6SwappedToMaisha = false;
      gameState.d6CropsPlanted = false;
      gameState.setMeters({ radiation: 95 });
    }
    this.ensureUnlockedMeters(floors);
    gameState.room = 'surface';
    gameState.activeAstronaut = 'muntasir';

    if (hud.scene.isActive('GreenhouseBuildTask')) hud.scene.stop('GreenhouseBuildTask');
    if (hud.scene.isActive('CropFarmTask')) hud.scene.stop('CropFarmTask');
    if (hud.scene.isActive(SCENES.SURFACE)) {
      hud.scene.stop(SCENES.SURFACE);
    }
    hud.scene.start(SCENES.SURFACE);
  },

  rewindD6Swap(hud) {
    const floors = this.captureUnlockedFloors();
    this.stopAllMeterTimers(hud);
    hud.warningCard.hide();

    if (!gameState.restoreCheckpoint('d6_after_greenhouse')) {
      gameState.d6GreenhouseBuilt = true;
      gameState.d6SwappedToMaisha = false;
      gameState.d6CropsPlanted = false;
      gameState.setMeters({ radiation: 52 });
    }
    this.ensureUnlockedMeters(floors);
    gameState.room = 'surface';
    gameState.activeAstronaut = 'muntasir';

    if (hud.scene.isActive('CropFarmTask')) hud.scene.stop('CropFarmTask');
    if (hud.scene.isActive(SCENES.SURFACE)) {
      hud.scene.resume(SCENES.SURFACE);
    } else {
      hud.scene.start(SCENES.SURFACE);
    }
    hud.time.delayedCall(120, () => hud.game.events.emit('d6:prompt-swap'));
  },
};
