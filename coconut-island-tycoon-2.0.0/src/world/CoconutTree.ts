import Phaser from 'phaser';
import { BALANCE } from '../data/balance';
import { spawnCoconutDrop } from './Coconut';

export class CoconutTree extends Phaser.GameObjects.Sprite {
  ready = true;
  /** Worker currently heading to this tree (null if free). */
  reservedBy: object | null = null;
  private respawnLeft = 0;
  private shakeTween?: Phaser.Tweens.Tween;

  readonly kind: 'normal' | 'golden';
  private fullKey: string;
  private emptyKey: string;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: 'normal' | 'golden' = 'normal', style?: 'jungle' | 'volcano') {
    const base = kind === 'golden' ? 'tree_golden' : style ? `tree_${style}` : 'tree';
    super(scene, x, y, `${base}_full`);
    this.kind = kind;
    this.fullKey = `${base}_full`;
    this.emptyKey = `${base}_empty`;
    scene.add.existing(this);
    this.setOrigin(0.5, 1).setDepth(y);
    this.setInteractive({ useHandCursor: true });
  }

  /** Returns false if the tree had nothing to give. */
  harvest(): boolean {
    if (!this.ready) return false;
    this.ready = false;
    this.respawnLeft = this.kind === 'golden' ? BALANCE.goldenTreeRespawnSec : BALANCE.treeRespawnSec;
    this.reservedBy = null;
    this.clearTint();
    this.setTexture(this.emptyKey);
    this.shake();
    spawnCoconutDrop(this.scene, this.x, this.y);
    return true;
  }

  private shake(): void {
    this.shakeTween?.stop();
    this.setAngle(0);
    this.shakeTween = this.scene.tweens.add({
      targets: this,
      angle: { from: -3, to: 3 },
      duration: 55,
      yoyo: true,
      repeat: 3,
      onComplete: () => this.setAngle(0),
    });
  }

  highlight(on: boolean): void {
    if (on && this.ready) this.setTint(0xfff3a8);
    else this.clearTint();
  }

  tick(dt: number): void {
    if (this.ready) return;
    this.respawnLeft -= dt;
    if (this.respawnLeft <= 0) {
      this.ready = true;
      this.setTexture(this.fullKey);
      this.scene.tweens.add({ targets: this, scaleX: 1.06, scaleY: 1.06, duration: 120, yoyo: true });
    }
  }
}
