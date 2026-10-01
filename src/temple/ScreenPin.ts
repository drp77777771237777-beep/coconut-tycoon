import Phaser from 'phaser';

type Pinnable = Phaser.GameObjects.GameObject &
  Phaser.GameObjects.Components.Transform &
  Phaser.GameObjects.Components.ScrollFactor;

type Anchor = (w: number, h: number) => { x: number; y: number };

/**
 * Keeps objects at fixed *screen* positions and size while the main camera is zoomed
 * (scrollFactor-0 objects are still scaled by camera zoom in Phaser).
 */
export class ScreenPin {
  private items: { obj: Pinnable; anchor: Anchor }[] = [];

  constructor(private scene: Phaser.Scene) {}

  add<T extends Pinnable>(obj: T, anchor: Anchor): T {
    obj.setScrollFactor(0);
    this.items.push({ obj, anchor });
    this.layout();
    return obj;
  }

  layout(): void {
    const cam = this.scene.cameras.main;
    const z = cam.zoom;
    const cx = cam.width / 2;
    const cy = cam.height / 2;
    for (const { obj, anchor } of this.items) {
      const p = anchor(cam.width, cam.height);
      obj.setPosition(cx + (p.x - cx) / z, cy + (p.y - cy) / z);
      obj.setScale(1 / z);
    }
  }

  get zoom(): number {
    return this.scene.cameras.main.zoom;
  }
}
