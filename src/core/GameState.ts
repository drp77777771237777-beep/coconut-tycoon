import { SAVE_VERSION } from './GameConfig';
import { BALANCE } from '../data/balance';
import type { UpgradeId } from '../data/upgrades';

export interface SaveData {
  saveVersion: number;
  money: number;
  bag: number;
  /** Rare golden coconuts (separate from the bag). */
  golden: number;
  islandId: number;
  upgrades: Record<UpgradeId, number>;
  workers: number;
  /** Carriers haul storage -> sell stand on islands without auto-sell. */
  carriers: number;
  questIndex: number;
  completedIslands: number[];
  /** Islands the player has already sailed to (can be revisited for free). */
  visitedIslands: number[];
  /** Saved per-island progress for islands the player is not currently on. */
  islandProgress: Record<number, { questIndex: number; earned: number }>;
  /** `earned` is lifetime, `islandEarned` resets when travelling to a new island. */
  stats: { harvested: number; sold: number; earned: number; islandEarned: number; golden: number };
  collectibles: string[];
  settings: { sound: boolean };
}

export function defaultSave(): SaveData {
  return {
    saveVersion: SAVE_VERSION,
    money: BALANCE.startMoney,
    bag: BALANCE.startBag,
    golden: 0,
    islandId: 1,
    upgrades: { harvestPower: 1, harvestSpeed: 1, bagCapacity: 1, moveSpeed: 1 },
    workers: 0,
    carriers: 0,
    questIndex: 0,
    completedIslands: [],
    visitedIslands: [1],
    islandProgress: {},
    stats: { harvested: 0, sold: 0, earned: 0, islandEarned: 0, golden: 0 },
    collectibles: [],
    settings: { sound: true },
  };
}

class GameStateStore {
  data: SaveData = defaultSave();

  replace(next: SaveData): void {
    this.data = next;
  }

  reset(): void {
    this.data = defaultSave();
  }

  isCompleted(id = this.data.islandId): boolean {
    return this.data.completedIslands.includes(id);
  }

  hasCollectible(id: string): boolean {
    return this.data.collectibles.includes(id);
  }
}

export const gameState = new GameStateStore();
