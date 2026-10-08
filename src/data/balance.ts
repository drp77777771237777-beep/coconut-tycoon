export const BALANCE = {
  coconutValue: 10,
  treeRespawnSec: 5,
  harvestRange: 85,
  startBag: 0,
  startMoney: 0,
  sellTickSec: 0.05,
  sellChunkDivisor: 20,
  storageAutoSellSec: 0.5,
  /** Golden coconut: rare resource found only on golden trees. */
  goldenValue: 60,
  goldenTreeRespawnSec: 20,
  goldenHarvestMult: 1.5,
  /** Each collectible permanently adds this much to sell prices. */
  collectibleBonus: 0.05,
} as const;

export const WORKER_BALANCE = {
  maxCount: 5,
  costs: [200, 500, 1000, 2000, 4000],
  speed: 90,
  harvestSec: 1.8,
  yield: 2,
  capacity: 6,
} as const;

/** Carriers haul coconuts from storage to the sell stand (islands with autoSellStorage: false). */
export const CARRIER_BALANCE = {
  maxCount: 4,
  costs: [400, 900, 1800, 3500],
  speed: 105,
  capacity: 12,
} as const;
