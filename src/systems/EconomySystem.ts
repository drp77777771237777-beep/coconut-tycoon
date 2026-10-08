import { EVT, eventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { BALANCE } from '../data/balance';
import { GOLDEN_RUSH } from '../data/events';
import { getIsland } from '../data/islands';

function safe(n: number): number {
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/** End of the Golden Rush event (ms timestamp, not saved). */
let rushUntil = 0;

export const Economy = {
  money(): number {
    return gameState.data.money;
  },

  /** Permanent bonus from owned collectibles. */
  bonus(): number {
    return 1 + BALANCE.collectibleBonus * gameState.data.collectibles.length;
  },

  /** Temporary sell multiplier from the Golden Rush event. */
  eventMult(): number {
    return Date.now() < rushUntil ? GOLDEN_RUSH.mult : 1;
  },

  startRush(): void {
    rushUntil = Date.now() + GOLDEN_RUSH.seconds * 1000;
  },

  /** Coins per coconut sold: the admin flat price if set, otherwise island price x relic bonus. */
  coconutValue(): number {
    const base = gameState.data.admin.coconutPrice ?? Math.round(BALANCE.coconutValue * getIsland(gameState.data.islandId).sellMultiplier * Economy.bonus());
    return Math.round(base * Economy.eventMult());
  },

  goldenValue(): number {
    return Math.round(BALANCE.goldenValue * getIsland(gameState.data.islandId).sellMultiplier * Economy.bonus() * Economy.eventMult());
  },

  /** Income from selling: counts toward lifetime earnings. */
  earn(amount: number): number {
    const gain = Math.floor(safe(amount));
    if (gain <= 0) return 0;
    gameState.data.money = safe(gameState.data.money + gain);
    gameState.data.stats.earned = safe(gameState.data.stats.earned + gain);
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

  /** Non-income money (boss / gem / event rewards). */
  grant(amount: number): void {
    const gain = Math.floor(safe(amount));
    if (gain <= 0) return;
    gameState.data.money = safe(gameState.data.money + gain);
    eventBus.emit(EVT.MONEY, gameState.data.money);
  },

  /** Admin pad: overwrite the balance. */
  setMoney(amount: number): void {
    gameState.data.money = Math.floor(safe(amount));
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
