import Phaser from 'phaser';
import { FONT } from '../core/GameConfig';
import { FLAT_DEPTH } from '../utils/DepthUtils';

/** Ground area in front of a building. Fires onEnter / onExit when the player's feet cross it. */
export class InteractZone {
  readonly rect: Phaser.Geom.Rectangle;
  inside = false;
  onEnter?: () => void;
  onExit?: () => void;
  private marker: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, cx: number, cy: number, w: number, h: number, color: number, label: string, labelY: number) {
    this.rect = new Phaser.Geom.Rectangle(cx - w / 2, cy - h / 2, w, h);
    this.marker = scene.add
      .ellipse(cx, cy, w, h, color, 0.22)
      .setStrokeStyle(3, color, 0.7)
      .setDepth(FLAT_DEPTH + 1);
    scene.add
      .text(cx, labelY, label, {
        fontFamily: FONT,
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#3a2a10',
        strokeThickness: 5,
      })
      .setOrigin(0.5, 1)
      .setDepth(labelY + 2);
  }

  /** Call every frame with the player's foot position. */
  check(px: number, py: number): void {
    const now = this.rect.contains(px, py);
    if (now === this.inside) return;
    this.inside = now;
    this.marker.setFillStyle(this.marker.fillColor, now ? 0.5 : 0.22);
    if (now) this.onEnter?.();
    else this.onExit?.();
  }
}
