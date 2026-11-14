import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../src/state/GameState.js';
import { METER_SCRIPT } from '../src/data/meterScript.js';

describe('GameState', () => {
  let gs;
  beforeEach(() => (gs = new GameState()));

  it('starts with no meters shown', () => {
    expect(gs.meters).toEqual({ power: null, oxygen: null, water: null, radiation: null });
  });

  it('wrong choice triggers rewind to last checkpoint', () => {
    gs.goTo('d2_oxygen_maker'); // checkpoint
    gs.goTo('d2_night');
    const { rewind } = gs.goTo('d2_wrong_lights_on');
    expect(rewind).toBe('wrong_choice');
    gs.rewind();
    expect(gs.stepId).toBe('d2_oxygen_maker');
    expect(gs.meters.power).toBe(60);
  });

  it('caps radiation protection at 95', () => {
    gs.setMeters({ radiation: 120 });
    expect(gs.meters.radiation).toBe(95);
  });

  it('flags radiation below 30', () => {
    gs.setMeters({ radiation: 29 });
    expect(gs.failureReason()).toBe('radiation_low');
  });

  // Guards the design table itself: no canon (non-wrong) step may fail.
  it('every canon step in meter.md is survivable', () => {
    for (const step of METER_SCRIPT.filter((s) => !s.wrong)) {
      expect(gs.goTo(step.id).rewind, step.id).toBeNull();
    }
  });

  it('every wrong step actually rewinds', () => {
    for (const step of METER_SCRIPT.filter((s) => s.wrong)) {
      expect(gs.goTo(step.id).rewind, step.id).not.toBeNull();
    }
  });

  it('unlocks logbook facts without duplicates and clears unread flag when read', () => {
    expect(gs.discoveredFacts).toEqual([]);
    expect(gs.hasUnreadLogbook).toBe(false);

    expect(gs.unlockFact('comm_delay')).toBe(true);
    expect(gs.discoveredFacts).toEqual(['comm_delay']);
    expect(gs.hasUnreadLogbook).toBe(true);

    // Duplicate unlock returns false and does not duplicate entry
    expect(gs.unlockFact('comm_delay')).toBe(false);
    expect(gs.discoveredFacts).toEqual(['comm_delay']);

    gs.markLogbookRead();
    expect(gs.hasUnreadLogbook).toBe(false);

    // Unlocking a second fact lights up unread badge again
    expect(gs.unlockFact('regolith_3d')).toBe(true);
    expect(gs.discoveredFacts).toEqual(['comm_delay', 'regolith_3d']);
    expect(gs.hasUnreadLogbook).toBe(true);
  });

  it('saves and restores time-travel checkpoint snapshots accurately', () => {
    let emitted = null;
    gs.on('meters', (m) => {
      emitted = { ...m };
    });

    gs.goTo('d2_oxygen_maker');
    gs.habLightsOn = true;
    gs.d2OxBuilt = true;
    gs.d2OxLoaded = true;
    gs.d2OxSwitchOn = true;
    gs.setMeters({ power: 60, oxygen: 100 });
    gs.saveCheckpoint('d2_night_ready');

    // Simulate non-canon switch flip (oxygen off, lights off) and rapid oxygen loss
    gs.d2OxSwitchOn = false;
    gs.habLightsOn = false;
    gs.setMeters({ power: 100, oxygen: 18 });

    expect(gs.restoreCheckpoint('d2_night_ready')).toBe(true);
    expect(gs.day).toBe(2);
    expect(gs.d2OxSwitchOn).toBe(true);
    expect(gs.habLightsOn).toBe(true);
    expect(gs.meters.power).toBe(60);
    expect(gs.meters.oxygen).toBe(100);
    expect(emitted).toMatchObject({ power: 60, oxygen: 100 });

    // Ensure listener Map was preserved and continues emitting cleanly after restore
    gs.setMeters({ power: 70 });
    expect(emitted.power).toBe(70);
    expect(gs.restoreCheckpoint('missing_key')).toBe(false);
  });
});


describe('Day 3 & Day 4 GameState flags and checkpoints', () => {
  it('initializes all Day 3 and Day 4 flags to safe defaults on reset', async () => {
    const { gameState } = await import('../src/state/GameState.js');
    gameState.reset();
    expect(gameState.d3IntroDone).toBe(false);
    expect(gameState.d3IceDrilled).toBe(false);
    expect(gameState.d3DrillDepth).toBe(0);
    expect(gameState.d3WaterBuilt).toBe(false);
    expect(gameState.d3WaterSwitchOn).toBe(false);
    expect(gameState.d3WaterIceCount).toBe(0);
    expect(gameState.d3WaterIceLoaded).toBe(false);
    expect(gameState.d3OxIceCount).toBe(0);
    expect(gameState.d3OxIceLoaded).toBe(false);
    expect(gameState.d3LightsTurnedOffOnce).toBe(false);
    expect(gameState.d3NightModeSet).toBe(false);

    expect(gameState.d4IntroDone).toBe(false);
    expect(gameState.d4WaterTurnedOff).toBe(false);
    expect(gameState.d4PanelCleaned).toBe(false);
    expect(gameState.d4PanelAligned).toBe(false);
    expect(gameState.d4ReactorIntroDone).toBe(false);
    expect(gameState.d4ReactorBuilt).toBe(false);
    expect(gameState.d4EveningDone).toBe(false);
    expect(gameState.d4CommsDone).toBe(false);
    expect(gameState.d4SafeModeOn).toBe(false);
    expect(gameState.d4SafeModeDone).toBe(false);
  });

  it('initializes d3_morning with 15% water reserve so refusal drain never jumps to 100%', async () => {
    const { gameState } = await import('../src/state/GameState.js');
    gameState.reset();
    gameState.goTo('d3_morning');
    expect(gameState.meters.power).toBe(60);
    expect(gameState.meters.oxygen).toBe(100);
    expect(gameState.meters.water).toBe(15);
  });

  it('saves and restores the d3_night_ready checkpoint without corrupting listeners', async () => {
    const { gameState } = await import('../src/state/GameState.js');
    gameState.reset();
    gameState.goTo('d3_morning');
    gameState.d3OxIceLoaded = true;
    gameState.habLightsOn = true;
    gameState.d2OxSwitchOn = true;
    gameState.d3WaterSwitchOn = true;
    gameState.d3LightsTurnedOffOnce = false;
    gameState.setMeters({ power: 40, oxygen: 100, water: 100 });
    gameState.saveCheckpoint('d3_night_ready');

    // Simulate non-canon red-zone mistake on Day 3 night
    gameState.habLightsOn = true;
    gameState.d3LightsTurnedOffOnce = true;
    gameState.d3WaterSwitchOn = false;
    gameState.setMeters({ power: 30, water: 20 });

    const restored = gameState.restoreCheckpoint('d3_night_ready');
    expect(restored).toBe(true);
    expect(gameState.meters.power).toBe(40);
    expect(gameState.meters.oxygen).toBe(100);
    expect(gameState.meters.water).toBe(100);
    expect(gameState.habLightsOn).toBe(true);
    expect(gameState.d3WaterSwitchOn).toBe(true);
    expect(gameState.d3LightsTurnedOffOnce).toBe(false);
    expect(() => gameState.setMeters({ power: 50 })).not.toThrow();
  });

  it('restores d4_before_safe_mode checkpoint without overwriting existing water reserve', async () => {
    const { gameState } = await import('../src/state/GameState.js');
    gameState.reset();
    gameState.goTo('d4_morning');
    gameState.d4ReactorBuilt = true;
    gameState.d4CommsDone = true;
    gameState.d4SafeModeOn = false;
    gameState.setMeters({ power: 100, oxygen: 100, water: 64 });
    gameState.saveCheckpoint('d4_before_safe_mode');

    // Simulate forgetting Safe Mode before solar storm
    gameState.setMeters({ power: 0 });
    expect(gameState.meters.power).toBe(0);

    const restored = gameState.restoreCheckpoint('d4_before_safe_mode');
    expect(restored).toBe(true);
    expect(gameState.meters.power).toBe(100);
    expect(gameState.meters.water).toBe(64);
    expect(gameState.d4CommsDone).toBe(true);
    expect(gameState.d4SafeModeOn).toBe(false);
  });
});
