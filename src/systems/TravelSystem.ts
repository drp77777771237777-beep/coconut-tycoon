import { gameState } from '../core/GameState';
import { ISLANDS, type IslandDef } from '../data/islands';
import { Economy } from './EconomySystem';
import { SaveSystem } from './SaveSystem';

export type TravelState = 'current' | 'visited' | 'available' | 'locked';

export interface TravelOption {
  island: IslandDef;
  state: TravelState;
  /** Coins charged on departure (0 for islands already visited). */
  cost: number;
}

export const TravelSystem = {
  options(): TravelOption[] {
    const d = gameState.data;
    return ISLANDS.map((island) => {
      if (island.id === d.islandId) return { island, state: 'current', cost: 0 };
      if (d.visitedIslands.includes(island.id)) return { island, state: 'visited', cost: 0 };
      const unlocked = island.id === 1 || d.completedIslands.includes(island.id - 1);
      return { island, state: unlocked ? 'available' : 'locked', cost: unlocked ? island.unlockCost : 0 };
    });
  },

  /** The boat is usable once the current island is complete, or when there is somewhere visited to go back to. */
  boatReady(): boolean {
    return gameState.isCompleted() || gameState.data.visitedIslands.length > 1;
  },

  /** Pay (first visit only), store this island's progress and load the target island's progress. */
  travel(id: number): boolean {
    const opt = TravelSystem.options().find((o) => o.island.id === id);
    if (!opt || opt.state === 'current' || opt.state === 'locked') return false;
    if (opt.cost > 0 && !Economy.spend(opt.cost)) return false;

    const d = gameState.data;
    d.islandProgress[d.islandId] = { questIndex: d.questIndex, earned: d.stats.islandEarned };
    const saved = d.islandProgress[id] ?? { questIndex: 0, earned: 0 };
    d.islandId = id;
    d.questIndex = saved.questIndex;
    d.stats.islandEarned = saved.earned;
    if (!d.visitedIslands.includes(id)) d.visitedIslands.push(id);
    SaveSystem.save();
    return true;
  },
};
