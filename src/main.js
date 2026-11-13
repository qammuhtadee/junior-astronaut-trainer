import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config/constants.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { OutpostScene } from './scenes/OutpostScene.js';
import { SurfaceScene } from './scenes/SurfaceScene.js';
import { HudScene } from './scenes/HudScene.js';
import { SolarAlignTask } from './scenes/tasks/SolarAlignTask.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#000000',
  pixelArt: true, // crisp pixels, no smoothing
  scale: {
    mode: Phaser.Scale.FIT, // fixed 1280x720 design, letterboxed on any screen
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  scene: [PreloadScene, OutpostScene, SurfaceScene, HudScene, SolarAlignTask],
});

// Handy for debugging in the browser console only.
if (import.meta.env.DEV) window.__game = game;
