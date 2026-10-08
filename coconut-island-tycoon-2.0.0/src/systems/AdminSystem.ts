import { EVT, eventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { ADMIN_LIMITS } from '../data/events';
import { Economy } from './EconomySystem';
import { SaveSystem } from './SaveSystem';
import { UpgradeSystem } from './UpgradeSystem';

function clampInt(n: number, min: number, max: number): number {
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.floor(n))) : min;
}

/** Admin-pad actions that touch saved game state (boss / hearts / events are handled by their scenes). */
export const AdminSystem = {
  setMoney(n: number): void {
    Economy.setMoney(clampInt(n, 0, ADMIN_LIMITS.maxMoney));
    SaveSystem.save();
  },

  addMoney(n: number): void {
    AdminSystem.setMoney(Economy.money() + n);
  },

  /** Flat coins per coconut sold, or null for the normal island price. */
  setCoconutPrice(n: number | null): void {
    gameState.data.admin.coconutPrice = n === null ? null : clampInt(n, 1, ADMIN_LIMITS.maxPrice);
    SaveSystem.save();
  },

  /** Bag size override, or null for the upgrade value. */
  setBagCapacity(n: number | null): void {
    const d = gameState.data;
    d.admin.bagCapacity = n === null ? null : clampInt(n, 1, ADMIN_LIMITS.maxBag);
    const cap = UpgradeSystem.bagCapacity();
    d.bag = Math.min(d.bag, cap);
    eventBus.emit(EVT.BAG, d.bag, cap);
    SaveSystem.save();
  },
};
