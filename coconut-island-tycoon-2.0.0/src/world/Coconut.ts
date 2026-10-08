import Phaser from 'phaser';
import { OVERLAY_DEPTH } from '../utils/DepthUtils';

const DROP_COUNT = 3;

/** Visual-only falling coconuts when a tree is shaken (always 3, regardless of yield). */
export function spawnCoconutDrop(scene: Phaser.Scene, x: number, groundY: number): void {
  for (let i = 0; i < DROP_COUNT; i++) {
    const startX = x + Phaser.Math.Between(-22, 22);
    const c = scene.add.image(startX, groundY - 85, 'coconut').setDepth(groundY + 5);
    scene.tweens.add({
      targets: c,
      y: groundY - 4 + Phaser.Math.Between(-4, 8),
      duration: 330 + i * 60,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        scene.tweens.add({ targets: c, alpha: 0, duration: 250, onComplete: () => c.destroy() });
      },
    });
  }
}

/** Coconut icon that flies from one world point to another (sell animation). */
export function flyCoconut(scene: Phaser.Scene, fromX: number, fromY: number, toX: number, toY: number, key = 'coconut'): void {
  const c = scene.add.image(fromX, fromY - 30, key).setDepth(OVERLAY_DEPTH - 1);
  scene.tweens.add({
    targets: c,
    x: toX,
    y: toY - 40,
    scale: 0.5,
    duration: 280,
    ease: 'Quad.easeIn',
    onComplete: () => c.destroy(),
  });
}
