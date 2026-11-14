import { stepById, METER_KEYS, RADIATION_MAX, RADIATION_REWIND_BELOW } from '../data/meterScript.js';

/**
 * Pure game state - no Phaser import, so it is unit-testable in Node.
 * Scenes READ from here and CALL its methods; they never hold their own copy of meters.
 *
 * Events: 'meters' (meters), 'step' (step), 'rewind' ({ reason, step })
 */
export class GameState {
  constructor() {
    this.listeners = new Map();
    this.reset();
  }

  reset() {
    this.stepId = 'd1_start';
    this.meters = { ...stepById.d1_start.meters };
    this.checkpointId = 'd1_start';
    this.room = 'surface';
    this.activeAstronaut = 'muntasir';
    this.hasSeenCrash = false;
    this.solarDeployed = false;
    this.solarAligned = false;
    this.habLightsOn = false;
  }

  get step() {
    return stepById[this.stepId];
  }

  get day() {
    return this.step.day;
  }

  /** Advance to a scripted step from meter.md. Returns { rewind: reason|null }. */
  goTo(stepId) {
    const step = stepById[stepId];
    if (!step) throw new Error(`Unknown step "${stepId}"`);

    this.stepId = stepId;
    this.setMeters(step.meters);
    if (step.checkpoint) this.checkpointId = stepId;
    this.emit('step', step);

    const reason = step.wrong ? 'wrong_choice' : this.failureReason();
    if (reason) this.emit('rewind', { reason, step });
    return { rewind: reason };
  }

  /** Used by real-time systems (the radiation clock). Clamps to the meter rules. */
  setMeters(partial) {
    for (const key of METER_KEYS) {
      if (!(key in partial)) continue;
      const v = partial[key];
      if (v === null) {
        this.meters[key] = null;
        continue;
      }
      const max = key === 'radiation' ? RADIATION_MAX : 100;
      this.meters[key] = Math.max(0, Math.min(max, v));
    }
    this.emit('meters', this.meters);
  }

  /** null if fine, otherwise the rewind reason. */
  failureReason() {
    for (const key of METER_KEYS) {
      if (this.meters[key] === 0) return `${key}_empty`;
    }
    const r = this.meters.radiation;
    if (r !== null && r < RADIATION_REWIND_BELOW) return 'radiation_low';
    return null;
  }

  /** "Simulation paused: rewind?" -> restore last checkpoint. */
  rewind() {
    const cp = stepById[this.checkpointId];
    this.stepId = cp.id;
    this.setMeters(cp.meters);
    this.emit('step', cp);
    return cp;
  }

  // Tiny emitter (kept local so this file has zero dependencies).
  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    this.listeners.get(event)?.delete(fn);
  }

  emit(event, payload) {
    this.listeners.get(event)?.forEach((fn) => fn(payload));
  }
}

/** The one shared instance for the running game. */
export const gameState = new GameState();
