import { EVT, eventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { BALANCE } from '../data/balance';
import { getIsland } from '../data/islands';

function safe(n: number): number {
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export const Economy = {
  money(): number {
    return gameState.data.money;
  },

  /** Permanent bonus from owned collectibles. */
  bonus(): number {
    return 1 + BALANCE.collectibleBonus * gameState.data.collectibles.length;
  },

  coconutValue(): number {
    return Math.round(BALANCE.coconutValue * getIsland(gameState.data.islandId).sellMultiplier * Economy.bonus());
  },

  goldenValue(): number {
    return Math.round(BALANCE.goldenValue * getIsland(gameState.data.islandId).sellMultiplier * Economy.bonus());
  },

  /** Income from selling: counts toward lifetime earnings. */
  earn(amount: number): number {
    const gain = Math.floor(safe(amount));
    if (gain <= 0) return 0;
    gameState.data.money = safe(gameState.data.money + gain);
    gameState.data.stats.earned = safe(gameState.data.stats.earned + gain);
    gameState.data.stats.islandEarned = safe(gameState.data.stats.islandEarned + gain);
    eventBus.emit(EVT.MONEY, gameState.data.money);
    return gain;
  },

  /** Sell coconuts at the island price (shared by sell stand, storage and carriers). Returns coins earned. */
  sellCoconuts(n: number): number {
    const count = Math.max(0, Math.floor(n));
    if (count === 0) return 0;
    const gain = Economy.earn(count * Economy.coconutValue());
    gameState.data.stats.sold += count;
    eventBus.emit(EVT.SOLD, count);
    return gain;
  },

  /** Non-income money (quest rewards). */
  grant(amount: number): void {
    const gain = Math.floor(safe(amount));
    if (gain <= 0) return;
    gameState.data.money = safe(gameState.data.money + gain);
    eventBus.emit(EVT.MONEY, gameState.data.money);
  },

  canAfford(cost: number): boolean {
    return Number.isFinite(cost) && cost >= 0 && gameState.data.money >= cost;
  },

  spend(cost: number): boolean {
    if (!Economy.canAfford(cost)) return false;
    gameState.data.money = safe(gameState.data.money - cost);
    eventBus.emit(EVT.MONEY, gameState.data.money);
    return true;
  },
};
