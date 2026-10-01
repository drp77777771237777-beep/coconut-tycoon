import { EVT, eventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { getIsland } from '../data/islands';
import { readStat } from './QuestSystem';

export interface IslandProgress {
  ratio: number;
  goals: { label: string; current: number; target: number; done: boolean }[];
}

let started = false;

export const UnlockSystem = {
  progress(): IslandProgress {
    const island = getIsland(gameState.data.islandId);
    const goals = island.goals.map((g) => {
      const current = Math.min(g.target, readStat(g.stat));
      return { label: g.label, current, target: g.target, done: current >= g.target };
    });
    const ratio = goals.reduce((sum, g) => sum + g.current / g.target, 0) / goals.length;
    return { ratio, goals };
  },

  check(): void {
    const p = UnlockSystem.progress();
    eventBus.emit(EVT.ISLAND_PROGRESS, p);
    if (!gameState.isCompleted() && p.goals.every((g) => g.done)) {
      gameState.data.completedIslands.push(gameState.data.islandId);
      eventBus.emit(EVT.ISLAND_COMPLETE);
      eventBus.emit(EVT.BANNER, { text: 'ISLAND COMPLETE!', sub: 'Go to the dock and board the boat', big: true });
      eventBus.emit(EVT.SOUND, 'complete');
    }
  },

  start(): void {
    if (started) {
      UnlockSystem.check();
      return;
    }
    started = true;
    const update = (): void => UnlockSystem.check();
    eventBus.on(EVT.SOLD, update);
    eventBus.on(EVT.UPGRADE, update);
    eventBus.on(EVT.WORKER, update);
    eventBus.on(EVT.MONEY, update);
    eventBus.on(EVT.HARVESTED, update);
    UnlockSystem.check();
  },
};
