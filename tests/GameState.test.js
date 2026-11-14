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
});
