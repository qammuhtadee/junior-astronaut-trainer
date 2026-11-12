// Transcribed 1:1 from docs/meter.md ("Values at every step").
// Game-design values, NOT NASA data. Tune here; keep meter.md in sync.
//
// meters: value at the END of the step. null = meter not shown yet.
// from:   optional starting values for steps that animate (e.g. "90 down to 75").
// checkpoint: rewind restores the last checkpoint reached.
// wrong:  this step is a failure branch -> always triggers a rewind.

const M = (power, oxygen, water, radiation) => ({ power, oxygen, water, radiation });

export const METER_SCRIPT = [
  // Day 1
  { id: 'd1_start', day: 1, label: 'Start', meters: M(null, null, null, null) },
  { id: 'd1_panel_built', day: 1, label: 'Panel aimed and built', meters: M(100, null, null, null), checkpoint: true },
  { id: 'd1_night', day: 1, label: 'Night falls (night mode)', meters: M(90, null, null, null) },
  // Day 2
  { id: 'd2_dust', day: 2, label: 'Dust on the panels', from: M(90, null, null, null), meters: M(75, null, null, null) },
  { id: 'd2_panel_cleaned', day: 2, label: 'Panel cleaned', meters: M(100, null, null, null), checkpoint: true },
  { id: 'd2_oxygen_low', day: 2, label: 'Oxygen meter appears', meters: M(100, 20, null, null) },
  { id: 'd2_ice_drilled', day: 2, label: 'Ice drilled', meters: M(100, 20, null, null), checkpoint: true },
  { id: 'd2_oxygen_maker', day: 2, label: 'Oxygen maker built', meters: M(60, 100, null, null), checkpoint: true },
  { id: 'd2_night', day: 2, label: 'Night with night mode on', meters: M(25, 100, null, null) },
  { id: 'd2_wrong_lights_on', day: 2, label: 'Lights left on', meters: M(0, 100, null, null), wrong: true },
  // Day 3
  { id: 'd3_morning', day: 3, label: 'Morning recharge', meters: M(60, 100, null, null) },
  { id: 'd3_water_low', day: 3, label: 'Water meter appears', meters: M(60, 100, 10, null) },
  { id: 'd3_water_station', day: 3, label: 'Water station built', meters: M(40, 100, 100, null), checkpoint: true },
  { id: 'd3_night', day: 3, label: 'Night: water station off, oxygen on', meters: M(5, 100, 95, null) },
  { id: 'd3_wrong_all_on', day: 3, label: 'Night mode only', meters: M(0, 100, 100, null), wrong: true },
  { id: 'd3_wrong_oxygen_off', day: 3, label: 'Oxygen switched off', meters: M(10, 25, 100, null), wrong: true },
  // Day 4
  { id: 'd4_morning', day: 4, label: 'Morning recharge', meters: M(40, 100, 95, null) },
  { id: 'd4_dust', day: 4, label: 'Dust, then cleaned', from: M(30, 100, 95, null), meters: M(40, 100, 95, null) },
  { id: 'd4_reactor', day: 4, label: 'Reactor built, shield placed', meters: M(100, 100, 95, 90), checkpoint: true },
  { id: 'd4_clog', day: 4, label: 'Vent and pipe clog', meters: M(100, 75, 90, 90), checkpoint: true },
  { id: 'd4_vent_fixed', day: 4, label: 'Vent fixed first', meters: M(100, 100, 90, 55) },
  { id: 'd4_wrong_pipe_first', day: 4, label: 'Pipe fixed first', meters: M(100, 30, 95, 55), wrong: true },
  { id: 'd4_wrong_both', day: 4, label: 'Both attempted', meters: M(100, 100, 100, 20), wrong: true },
  { id: 'd4_safe_mode', day: 4, label: 'Safe mode, night rest', meters: M(100, 100, 85, 75) },
  // Day 5
  { id: 'd5_storm', day: 5, label: 'Storm begins', meters: M(100, 100, 80, 75), checkpoint: true },
  { id: 'd5_shelter', day: 5, label: 'Water-bag shelter built', meters: M(100, 100, 80, 70), checkpoint: true },
  { id: 'd5_wrong_outside', day: 5, label: 'Went outside in storm', meters: M(100, 100, 80, 0), wrong: true },
  { id: 'd5_pipe_cleared', day: 5, label: 'Storm ends, pipe cleared', meters: M(100, 100, 90, 70) },
  { id: 'd5_recycler', day: 5, label: 'Recycler built', meters: M(100, 100, 100, 70), checkpoint: true },
  { id: 'd5_night', day: 5, label: 'Night rest, ice low', meters: M(100, 80, 100, 85) },
  // Day 6
  { id: 'd6_morning', day: 6, label: 'Ice almost gone', meters: M(100, 70, 100, 85), checkpoint: true },
  { id: 'd6_rover_shield', day: 6, label: 'Rover shield built', meters: M(100, 70, 100, 85), checkpoint: true },
  { id: 'd6_mining', day: 6, label: 'Shielded mining trip', meters: M(100, 70, 100, 76) },
  { id: 'd6_wrong_unshielded', day: 6, label: 'Unshielded mining trip', meters: M(100, 70, 100, 25), wrong: true },
  { id: 'd6_ice_loaded', day: 6, label: 'Ice loaded', meters: M(100, 100, 100, 76) },
  { id: 'd6_rest', day: 6, label: 'Rest inside', meters: M(100, 100, 100, 90) },
  // Day 7
  { id: 'd7_final', day: 7, label: 'Final state', meters: M(100, 100, 100, 90) },
];

export const METER_KEYS = ['power', 'oxygen', 'water', 'radiation'];
export const RADIATION_MAX = 95; // Mars always has natural radiation
export const RADIATION_REWIND_BELOW = 30;

export const stepById = Object.fromEntries(METER_SCRIPT.map((s) => [s.id, s]));
