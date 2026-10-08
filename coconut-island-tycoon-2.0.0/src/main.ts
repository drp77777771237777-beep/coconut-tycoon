import Phaser from 'phaser';
import './style.css';
import { WATER_COLOR } from './core/GameConfig';
import { BootScene } from './scenes/BootScene';
import { IslandScene } from './scenes/IslandScene';
import { KrakenScene } from './scenes/KrakenScene';
import { MenuScene } from './scenes/MenuScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TempleScene } from './scenes/TempleScene';
import { UIScene } from './scenes/UIScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: WATER_COLOR,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 } },
  },
  input: { activePointers: 3 },
  scene: [BootScene, PreloadScene, MenuScene, IslandScene, UIScene, TempleScene, KrakenScene],
});

if (import.meta.env.DEV) (window as unknown as { __game: Phaser.Game }).__game = game;
