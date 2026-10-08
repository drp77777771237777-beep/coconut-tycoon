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
      const unlocked = island.id === 1 || d.visitedIslands.includes(island.id - 1);
      return { island, state: unlocked ? 'available' : 'locked', cost: unlocked ? island.unlockCost : 0 };
    });
  },

  /** Pay the ticket (first visit only) and move to the target island. */
  travel(id: number): boolean {
    const opt = TravelSystem.options().find((o) => o.island.id === id);
    if (!opt || opt.state === 'current' || opt.state === 'locked') return false;
    if (opt.cost > 0 && !Economy.spend(opt.cost)) return false;

    const d = gameState.data;
    d.islandId = id;
    if (!d.visitedIslands.includes(id)) d.visitedIslands.push(id);
    SaveSystem.save();
    return true;
  },
};
