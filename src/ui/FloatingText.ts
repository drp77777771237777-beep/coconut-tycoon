import Phaser from 'phaser';
import { FONT } from '../core/GameConfig';
import { OVERLAY_DEPTH } from '../utils/DepthUtils';

/** Pooled world-space floating feedback text ("+1 🥥", "+100 💰"). */
export class FloatingTextManager {
  private pool: Phaser.GameObjects.Text[] = [];

  constructor(private scene: Phaser.Scene) {}

  spawn(x: number, y: number, text: string, color = '#ffffff'): void {
    const t = this.pool.pop() ?? this.scene.add.text(0, 0, '', {
      fontFamily: FONT,
      fontSize: '22px',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5);
    t.setText(text).setColor(color).setPosition(x, y - 60).setAlpha(1).setScale(0.6).setVisible(true).setDepth(OVERLAY_DEPTH);
    this.scene.tweens.add({
      targets: t,
      y: y - 120,
      scale: 1,
      duration: 220,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: t,
          y: t.y - 30,
          alpha: 0,
          duration: 520,
          onComplete: () => {
            t.setVisible(false);
            this.pool.push(t);
          },
        });
      },
    });
  }
}
