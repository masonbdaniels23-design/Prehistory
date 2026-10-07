import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PHYSICS } from './config';
import { PALETTE_HEX } from './data/palette';
import { BootScene } from './scenes/BootScene';
import { HuntScene } from './scenes/HuntScene';
import { Hud } from './ui/Hud';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: PALETTE_HEX.charcoal,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: PHYSICS.debug },
  },
  scene: [BootScene, HuntScene, Hud],
});

// Handy for poking at the running game from the browser console in dev builds.
if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}
