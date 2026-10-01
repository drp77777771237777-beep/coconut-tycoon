import Phaser from 'phaser';
import { EVT, eventBus } from '../core/EventBus';
import { FONT, SCENES, WATER_COLOR } from '../core/GameConfig';
import { gameState } from '../core/GameState';
import { SaveSystem } from '../systems/SaveSystem';

export class MenuScene extends Phaser.Scene {
  private items: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super(SCENES.menu);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(WATER_COLOR);
    this.scale.on('resize', this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.layout, this));
    this.layout();
  }

  private layout(): void {
    this.items.forEach((o) => o.destroy());
    this.items = [];
    const { width: w, height: h } = this.scale;
    const hasSave = SaveSystem.hasSave();

    this.items.push(
      this.add.image(w / 2, h * 0.5, 'tree_full').setScale(2.2).setAlpha(0.25),
      this.add
        .text(w / 2, h * 0.22, 'COCONUT ISLAND\nTYCOON', {
          fontFamily: FONT,
          fontSize: `${Math.min(64, w / 9)}px`,
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: '#0b5d80',
          strokeThickness: 10,
          align: 'center',
        })
        .setOrigin(0.5),
    );

    let y = h * 0.55;
    if (hasSave) {
      this.button(w / 2, y, 'CONTINUE', () => this.play(true));
      y += 80;
    }
    this.button(w / 2, y, hasSave ? 'NEW GAME' : 'PLAY', () => this.play(false));
    this.items.push(
      this.add
        .text(w / 2, h - 28, 'WASD / Arrows: move   SPACE (hold) / click tree: harvest', {
          fontFamily: FONT,
          fontSize: '16px',
          color: '#e8f8ff',
        })
        .setOrigin(0.5),
    );
  }

  private button(x: number, y: number, label: string, onClick: () => void): void {
    const bg = this.add.rectangle(x, y, 280, 60, 0xffb02e).setStrokeStyle(4, 0xb36b00).setInteractive({ useHandCursor: true });
    const txt = this.add
      .text(x, y, label, { fontFamily: FONT, fontSize: '28px', fontStyle: 'bold', color: '#3a2200' })
      .setOrigin(0.5);
    bg.on('pointerover', () => bg.setFillStyle(0xffc65c));
    bg.on('pointerout', () => bg.setFillStyle(0xffb02e));
    bg.on('pointerdown', onClick);
    this.items.push(bg, txt);
  }

  private play(continueSave: boolean): void {
    if (continueSave) SaveSystem.load();
    else {
      gameState.reset();
      SaveSystem.save();
    }
    eventBus.emit(EVT.SOUND, 'click');
    this.scene.start(SCENES.island);
  }
}
