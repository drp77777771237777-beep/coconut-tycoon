import Phaser from 'phaser';
import { EVT, eventBus } from '../core/EventBus';
import { FONT } from '../core/GameConfig';
import { BALANCE } from '../data/balance';
import { Economy } from '../systems/EconomySystem';
import type { FloatingTextManager } from '../ui/FloatingText';

/** Workers drop coconuts here. MVP: stock is auto-sold on a timer (no Carrier yet). */
export class Storage {
  readonly sprite: Phaser.GameObjects.Image;
  /** Where workers stand to drop off. */
  readonly dropPoint: { x: number; y: number };
  /** Where Carriers stand to load up. */
  readonly pickupPoint: { x: number; y: number };
  private count = 0;
  private sellLeft = 0;
  private label: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private floating: FloatingTextManager,
    /** false = stock waits for Carriers instead of selling itself. */
    private autoSell = true,
  ) {
    this.sprite = scene.add.image(x, y, 'storage').setOrigin(0.5, 1).setDepth(y);
    this.dropPoint = { x, y: y + 22 };
    this.pickupPoint = { x: x + 34, y: y + 14 };
    this.label = scene.add
      .text(x, y - 84, 'STORAGE', {
        fontFamily: FONT,
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#3a2a10',
        strokeThickness: 5,
      })
      .setOrigin(0.5, 1)
      .setDepth(y + 2);
  }

  deposit(n: number): void {
    if (n <= 0) return;
    this.count += n;
    this.refresh();
  }

  get stock(): number {
    return this.count;
  }

  /** Carriers load up to `max` coconuts. */
  take(max: number): number {
    const n = Math.max(0, Math.min(Math.floor(max), this.count));
    this.count -= n;
    this.refresh();
    return n;
  }

  update(dt: number): void {
    if (!this.autoSell || this.count <= 0) return;
    this.sellLeft -= dt;
    if (this.sellLeft > 0) return;
    this.sellLeft = BALANCE.storageAutoSellSec;
    const n = this.count;
    this.count = 0;
    const gain = Economy.sellCoconuts(n);
    this.floating.spawn(this.sprite.x, this.sprite.y - 20, `+${gain} 💰`, '#ffe066');
    eventBus.emit(EVT.SOUND, 'coin');
    this.refresh();
  }

  private refresh(): void {
    this.label.setText(this.count > 0 ? `STORAGE 🥥${this.count}` : 'STORAGE');
  }
}
