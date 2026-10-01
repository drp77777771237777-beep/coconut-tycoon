import Phaser from 'phaser';
import { SCENES } from '../core/GameConfig';
import { SaveSystem } from '../systems/SaveSystem';
import { SoundSystem } from '../systems/SoundSystem';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create(): void {
    SaveSystem.load();
    SoundSystem.start();
    this.scene.start(SCENES.preload);
  }
}
