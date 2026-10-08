import { EVT, eventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { UpgradeSystem } from '../systems/UpgradeSystem';

export class Inventory {
  get count(): number {
    return gameState.data.bag;
  }

  get capacity(): number {
    return UpgradeSystem.bagCapacity();
  }

  get free(): number {
    return Math.max(0, this.capacity - this.count);
  }

  get isFull(): boolean {
    return this.free <= 0;
  }

  /** Returns how many coconuts actually fit. */
  add(n: number): number {
    const added = Math.max(0, Math.min(Math.floor(n), this.free));
    if (added > 0) {
      gameState.data.bag += added;
      eventBus.emit(EVT.BAG, this.count, this.capacity);
    }
    return added;
  }

  remove(n: number): number {
    const removed = Math.max(0, Math.min(Math.floor(n), this.count));
    if (removed > 0) {
      gameState.data.bag -= removed;
      eventBus.emit(EVT.BAG, this.count, this.capacity);
    }
    return removed;
  }
}
