import Phaser from 'phaser';
import { EVT, eventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { BALANCE } from '../data/balance';
import type { Inventory } from '../player/Inventory';
import type { Player } from '../player/Player';
import type { FloatingTextManager } from '../ui/FloatingText';
import { Economy } from '../systems/EconomySystem';
import { InteractZone } from './InteractZone';
import { flyCoconut } from './Coconut';

/** Standing inside the zone sells the bag progressively. */
export class SellZone extends InteractZone {
  /** Where Carriers stand to deliver. */
  readonly dropPoint: { x: number; y: number };
  private tickLeft = 0;
  private pending = 0;
  private pendingCount = 0;

  constructor(
    private scene2: Phaser.Scene,
    private stand: { x: number; y: number },
    zone: { cx: number; cy: number; w: number; h: number },
    private inventory: Inventory,
    private floating: FloatingTextManager,
  ) {
    super(scene2, zone.cx, zone.cy, zone.w, zone.h, 0xffd54a, 'SELL', stand.y - 105);
    this.dropPoint = { x: zone.cx, y: zone.cy };
  }

  update(dt: number, player: Player): void {
    this.check(player.x, player.y);
    if (this.inside && (this.inventory.count > 0 || gameState.data.golden > 0)) {
      this.tickLeft -= dt;
      if (this.tickLeft <= 0) {
        this.tickLeft = BALANCE.sellTickSec;
        this.sellChunk(player);
      }
    } else if (this.pendingCount > 0) {
      this.flush(player);
    }
  }

  private sellChunk(player: Player): void {
    if (this.inventory.count === 0) {
      this.sellGolden(player);
      return;
    }
    const chunk = Math.max(1, Math.ceil(this.inventory.capacity / BALANCE.sellChunkDivisor));
    const n = this.inventory.remove(chunk);
    if (n <= 0) return;
    const gain = Economy.earn(n * Economy.coconutValue());
    gameState.data.stats.sold += n;
    this.pending += gain;
    this.pendingCount += n;
    flyCoconut(this.scene2, player.x, player.y, this.stand.x, this.stand.y);
    eventBus.emit(EVT.SOUND, 'sell');
    eventBus.emit(EVT.SOLD, n);
    if (this.inventory.count === 0 && gameState.data.golden === 0) this.flush(player);
  }

  /** Rare golden coconuts sell one at a time after the bag is empty. */
  private sellGolden(player: Player): void {
    if (gameState.data.golden <= 0) return;
    gameState.data.golden -= 1;
    this.pending += Economy.earn(Economy.goldenValue());
    flyCoconut(this.scene2, player.x, player.y, this.stand.x, this.stand.y, 'coin_gold');
    eventBus.emit(EVT.GOLDEN, gameState.data.golden);
    eventBus.emit(EVT.SOUND, 'coin');
    if (gameState.data.golden === 0) this.flush(player);
  }

  private flush(player: Player): void {
    if (this.pending > 0) {
      this.floating.spawn(player.x, player.y, `+${this.pending} 💰`, '#ffe066');
      eventBus.emit(EVT.SOUND, 'coin');
    }
    this.pending = 0;
    this.pendingCount = 0;
  }
}
