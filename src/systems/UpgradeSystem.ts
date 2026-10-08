import { EVT, eventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { UPGRADES, type UpgradeId } from '../data/upgrades';
import { CARRIER_BALANCE, WORKER_BALANCE } from '../data/balance';
import { Economy } from './EconomySystem';

export const UpgradeSystem = {
  level(id: UpgradeId): number {
    return gameState.data.upgrades[id];
  },

  maxLevel(id: UpgradeId): number {
    return UPGRADES[id].levels.length;
  },

  value(id: UpgradeId, level = gameState.data.upgrades[id]): number {
    return UPGRADES[id].levels[level - 1].value;
  },

  /** Bag size: the admin override if set, otherwise the upgrade value. */
  bagCapacity(): number {
    return gameState.data.admin.bagCapacity ?? UpgradeSystem.value('bagCapacity');
  },

  /** Cost of the next level, or null when maxed. */
  nextCost(id: UpgradeId): number | null {
    const next = UPGRADES[id].levels[gameState.data.upgrades[id]];
    return next ? next.cost : null;
  },

  /** check money -> deduct -> apply (save is triggered by the UPGRADE event). */
  buy(id: UpgradeId): boolean {
    const cost = UpgradeSystem.nextCost(id);
    if (cost === null || !Economy.spend(cost)) return false;
    gameState.data.upgrades[id] += 1;
    eventBus.emit(EVT.UPGRADE, id);
    return true;
  },
};

export const WorkerSystem = {
  count(): number {
    return gameState.data.workers;
  },

  nextCost(): number | null {
    return WORKER_BALANCE.costs[gameState.data.workers] ?? null;
  },

  buy(): boolean {
    const cost = WorkerSystem.nextCost();
    if (cost === null || !Economy.spend(cost)) return false;
    gameState.data.workers += 1;
    eventBus.emit(EVT.WORKER, gameState.data.workers);
    return true;
  },
};

export const CarrierSystem = {
  count(): number {
    return gameState.data.carriers;
  },

  nextCost(): number | null {
    return CARRIER_BALANCE.costs[gameState.data.carriers] ?? null;
  },

  buy(): boolean {
    const cost = CarrierSystem.nextCost();
    if (cost === null || !Economy.spend(cost)) return false;
    gameState.data.carriers += 1;
    eventBus.emit(EVT.WORKER, gameState.data.carriers);
    return true;
  },
};
