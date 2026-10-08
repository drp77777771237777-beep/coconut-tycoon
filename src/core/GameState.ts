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
  /** Islands the player has already sailed to (can be revisited for free). */
  visitedIslands: number[];
  stats: { harvested: number; sold: number; earned: number; golden: number };
  collectibles: string[];
  settings: { sound: boolean };
  /** Admin-pad overrides (null = use the normal value). */
  admin: { bagCapacity: number | null; coconutPrice: number | null };
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
    visitedIslands: [1],
    stats: { harvested: 0, sold: 0, earned: 0, golden: 0 },
    collectibles: [],
    settings: { sound: true },
    admin: { bagCapacity: null, coconutPrice: null },
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

  hasCollectible(id: string): boolean {
    return this.data.collectibles.includes(id);
  }
}

export const gameState = new GameStateStore();
