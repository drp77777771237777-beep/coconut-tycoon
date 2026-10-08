import Phaser from 'phaser';
import { EVT, eventBus } from '../core/EventBus';
import { FONT } from '../core/GameConfig';
import { FLAT_DEPTH } from '../utils/DepthUtils';
import { InteractZone } from './InteractZone';

/** Pier + boat. Boarding opens the destination menu. */
export class Dock {
  readonly zone: InteractZone;
  private boat: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    scene.add.image(x, y - 30, 'pier').setOrigin(0.5, 0).setDepth(FLAT_DEPTH + 2);
    const boatY = y + 150;
    this.boat = scene.add.image(x, boatY, 'boat').setOrigin(0.5, 1).setDepth(boatY);
    scene.tweens.add({ targets: this.boat, y: boatY + 6, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.boat.setInteractive({ useHandCursor: true });
    this.boat.on('pointerdown', () => this.board());

    this.zone = new InteractZone(scene, x, y + 40, 200, 90, 0x7fe0ff, 'DOCK', y - 20);
    scene.add
      .text(x, boatY - 78, '⛵ TRAVEL', {
        fontFamily: FONT,
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#003a55',
        strokeThickness: 5,
      })
      .setOrigin(0.5, 1)
      .setDepth(boatY + 2);
  }

  board(): void {
    eventBus.emit(EVT.BOARD);
  }

  /** Interact input (SPACE / action button) while standing at the dock. */
  tryInteract(): void {
    if (this.zone.inside) this.board();
  }
}
