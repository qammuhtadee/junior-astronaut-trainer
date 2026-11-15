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
    this.audioSettings = {
      musicVolume: 1,
      musicMuted: false,
      sfxVolume: 1,
      sfxMuted: false,
      footstepsVolume: 1,
      footstepsMuted: false,
      talkingVolume: 1,
      talkingMuted: false,
    };
    this.reset();
  }

  reset() {
    this.stepId = 'd1_start';
    this.meters = { ...stepById.d1_start.meters };
    this.checkpointId = 'd1_start';
    this.room = 'surface';
    this.activeAstronaut = 'muntasir';
    this.hasSeenCrash = false;
    this.visitedDarkOutpost = false;
    this.seenSolarThought = false;
    this.solarUnfurled = false;
    this.solarDeployed = false;
    this.solarAligned = false;
    this.habLightsOn = false;
    this.lightsIntroDone = false;
    this.muntasirResting = false;
    this.nightDrainActive = false;

    // Day 2: Dust and air state flags (preserving progress if closed mid-task)
    this.d2IntroDone = false;
    this.d2PanelCleaned = false;
    this.d2CleanProgress = null;
    this.d2OxygenIntroDone = false;
    this.d2IceDrilled = false;
    this.d2DrillDepth = 0;
    this.d2BuildThoughtDone = false;
    this.d2OxPlacedParts = {};
    this.d2OxBuilt = false;
    this.d2OxSwitchOn = true;
    this.d2NightIntroDone = false;
    this.d2NightModeSet = false;

    // Day 2 hopper ice loading & time-travel checkpoint snapshots
    this.d2IceLoadedCount = 0;
    this.d2OxLoaded = false;

    // Day 3: Water station, ice drilling, pipe build, and night switches
    this.d3IntroDone = false;
    this.d3IceDrilled = false;
    this.d3DrillDepth = 0;
    this.d3BuildThoughtDone = false;
    this.d3WaterPlacedParts = {};
    this.d3WaterBuilt = false;
    this.d3WaterSwitchOn = false;
    this.d3WaterIceCount = 0;
    this.d3WaterIceLoaded = false;
    this.d3OxDepleteStarted = false;
    this.d3OxIceCount = 0;
    this.d3OxIceLoaded = false;
    this.d3NightIntroDone = false;
    this.d3LightsTurnedOffOnce = false;
    this.d3NightModeSet = false;

    // Day 4: 2nd dust storm (clean + align), water pause, nuclear reactor build, comms & safe mode
    this.d4IntroDone = false;
    this.d4WaterTurnedOff = false;
    this.d4PanelCleaned = false;
    this.d4CleanProgress = null;
    this.d4PanelAligned = false;
    this.d4ReactorIntroDone = false;
    this.d4ReactorBuilt = false;
    this.d4EveningDone = false;
    this.d4CommsDone = false;
    this.d4SafeModeOn = false;
    this.d4SafeModeDone = false;

    // Day 5: Solar storm continues inside, water-bag bunk shielding, moderate O2/Water decay
    this.d5IntroDone = false;
    this.d5BunksBagged = false;
    this.d5BagCount = 0;
    this.d5EveningDone = false;

    // Day 6: Food shortage, surface radiation clock, greenhouse build, radiation sickness & crew swap, crop planting
    this.d6IntroDone = false;
    this.d6SurfaceIntroDone = false;
    this.d6GreenhousePlacedParts = {};
    this.d6GreenhouseBuilt = false;
    this.d6SicknessShown = false;
    this.d6SwappedToMaisha = false;
    this.d6CropsPlanted = false;
    this.d6PlantedCount = 0;
    this.d6EveningDone = false;

    // Day 7: Optimization day (ice drill -> load water & O2 to 100% -> 2 water-bag shields -> harvest food -> celebration)
    this.d7IntroDone = false;
    this.d7IceDrilled = false;
    this.d7DrillDepth = 0;
    this.d7ReturnInsideIntroDone = false;
    this.d7WaterIceCount = 0;
    this.d7WaterIceLoaded = false;
    this.d7OxIceCount = 0;
    this.d7OxIceLoaded = false;
    this.d7IceSiteBagged = false;
    this.d7GreenhouseBagged = false;
    this.d7CropsHarvested = false;

    this.snapshots = {};

    // Logbook & one-time tutorial flags
    this.discoveredFacts = [];
    this.hasUnreadLogbook = false;
    this.tutorialLogbookDone = false;
    this.tutorialMoveDone = false;
    this.tutorialSolarDone = false;
    this.seenLightsThought = false;
  }

  saveCheckpoint(key) {
    if (!key) return;
    const skip = new Set([
      'listeners',
      'snapshots',
      'audioSettings',
      'discoveredFacts',
      'hasUnreadLogbook',
      'tutorialLogbookDone',
      'tutorialMoveDone',
      'tutorialSolarDone',
    ]);
    const snap = {};
    for (const k of Object.keys(this)) {
      if (skip.has(k)) continue;
      const val = this[k];
      if (typeof val === 'function') continue;
      snap[k] = val && typeof val === 'object' ? JSON.parse(JSON.stringify(val)) : val;
    }
    this.snapshots[key] = snap;
  }

  restoreCheckpoint(key) {
    const snap = this.snapshots?.[key];
    if (!snap) return false;
    for (const [k, val] of Object.entries(snap)) {
      if (k === 'listeners' || k === 'snapshots' || k === 'audioSettings') continue;
      this[k] = val && typeof val === 'object' ? JSON.parse(JSON.stringify(val)) : val;
    }
    this.emit('meters', this.meters);
    return true;
  }

  setAudioSettings(patch) {
    this.audioSettings = { ...this.audioSettings, ...patch };
    this.emit('audio', this.audioSettings);
  }

  getEffectiveVolume(category, baseVolume = 1) {
    const s = this.audioSettings || {};
    if (s[`${category}Muted`]) return 0;
    const mult = s[`${category}Volume`] ?? 1;
    return Math.max(0, Math.min(1, baseVolume * mult));
  }

  /** Record a discovered NASA fact in the live logbook and light up the unread red dot. */
  unlockFact(factId) {
    if (!factId) return false;
    if (!this.discoveredFacts.includes(factId)) {
      this.discoveredFacts.push(factId);
      this.hasUnreadLogbook = true;
      this.emit('logbook', { factId, unread: true, discoveredFacts: this.discoveredFacts });
      return true;
    }
    return false;
  }

  /** Clear the unread red dot when the player opens the logbook. */
  markLogbookRead() {
    if (this.hasUnreadLogbook) {
      this.hasUnreadLogbook = false;
      this.emit('logbook', { factId: null, unread: false, discoveredFacts: this.discoveredFacts });
    }
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
