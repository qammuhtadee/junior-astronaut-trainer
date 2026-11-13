// Which station lives in which room, and where its BASE (feet line) sits.
// PLACEHOLDER positions - this is the "rooms and stations" table the design doc is missing.
// Stations sit against the back wall, at the top of the lane, so the player walks in front of them.

import { LANE, GAME_WIDTH } from '../config/constants.js';

const BACK = LANE.top + 10;

export const STATIONS = {
  outpost: [
    { id: 'airlock', label: 'Airlock', x: 90, y: BACK, w: 90, h: 200, color: 0x8a8f98, leadsTo: 'surface', day: 1 },
    { id: 'power_panel', label: 'Power panel', x: 380, y: BACK, w: 90, h: 120, color: 0xd9b84a, day: 1 },
    { id: 'oxygen_maker', label: 'Oxygen maker', x: 640, y: BACK, w: 110, h: 140, color: 0x6fc3df, day: 2 },
    { id: 'water_station', label: 'Water station', x: 880, y: BACK, w: 110, h: 130, color: 0x4a7fd9, day: 3 },
    { id: 'bed', label: 'Bunks', x: GAME_WIDTH - 140, y: BACK, w: 170, h: 80, color: 0x7a6a9a, day: 1 },
  ],
  surface: [
    { id: 'solar_panel', label: 'Solar array', x: 200, y: BACK, w: 160, h: 110, color: 0x2f4f8f, day: 1 },
    { id: 'ice_site', label: 'Ice drill site', x: 520, y: BACK, w: 120, h: 60, color: 0xdfe8f0, day: 2 },
    { id: 'reactor', label: 'Reactor', x: 860, y: BACK, w: 110, h: 150, color: 0x9a9a9a, day: 4 },
    { id: 'airlock', label: 'Airlock', x: GAME_WIDTH - 90, y: BACK, w: 90, h: 200, color: 0x8a8f98, leadsTo: 'outpost', day: 1 },
  ],
};
