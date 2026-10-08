/** Random / admin-triggered events. */
export type GameEventId = 'kraken' | 'goldenRush';

/** Sailing to another island has this chance of a Kraken attack. */
export const KRAKEN = {
  chance: 0.01,
  surviveSec: 20,
  hearts: 3,
  boatSpeed: 260,
  /** Seconds a tentacle telegraphs its strike. */
  warnSec: 0.9,
  strikeSec: 0.3,
  /** Hit half-width around a tentacle. */
  hitRadius: 46,
  /** Spawn interval at the start / end of the fight. */
  spawnStartSec: 1.3,
  spawnEndSec: 0.65,
  /** Coins for surviving, multiplied by the island id. */
  reward: 300,
  /** Share of the coins lost when the boat is wrecked. */
  penaltyRate: 0.25,
};

/** Temporary sell-price boost. */
export const GOLDEN_RUSH = {
  seconds: 60,
  mult: 2,
};

export const ADMIN_LIMITS = {
  maxMoney: 1_000_000_000_000,
  maxPrice: 1_000_000,
  maxBag: 99_999,
  maxHearts: 20,
};
