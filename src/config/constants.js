// Single source of truth for layout and tuning numbers.
// Change values here, never as magic numbers inside scenes.

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

/** Top 50% is wall/sky, bottom 50% is floor. */
export const HORIZON_Y = Math.round(GAME_HEIGHT * 0.5); // 360

/** The vertical band the astronaut's FEET may occupy. Same in both rooms so the airlock fade never jumps. */
export const LANE = {
  top: 380,
  bottom: 660,
  left: 60,
  right: GAME_WIDTH - 60,
};

export const PLAYER = {
  speedX: 320, // faster movement speed
  speedYRatio: 0.65, // vertical speed = 65% of horizontal, fakes perspective
};

/** Interaction zone is an oval around a station's base. Generous on purpose for kids. */
export const INTERACT = {
  radiusX: 110,
  radiusY: 70,
};

export const FADE_MS = 400;

export const SCENES = Object.freeze({
  PRELOAD: 'Preload',
  OUTPOST: 'Outpost',
  SURFACE: 'Surface',
  HUD: 'Hud',
});

/** Render layers. Actors inside the lane use their feet Y as depth (Y-sorting), which is always between these. */
export const DEPTH = Object.freeze({
  BACKGROUND: 0,
  WORLD_MIN: 100, // y-sorted actors live in [100, 100 + GAME_HEIGHT]
  UI: 2000,
});

export const COLORS = Object.freeze({
  muntasir: 0xf28c28, // engineer - orange
  maisha: 0xff69b4, // scientist-medic - pink
  promptText: '#ffffff',
});
