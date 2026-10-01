import { EVT, eventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { getQuests, type QuestStat } from '../data/quests';
import { BALANCE } from '../data/balance';
import { Economy } from './EconomySystem';

export function readStat(stat: QuestStat): number {
  const d = gameState.data;
  switch (stat) {
    case 'harvested':
      return d.stats.harvested;
    case 'sold':
      return d.stats.sold;
    case 'earned':
      return d.stats.islandEarned;
    case 'golden':
      return d.stats.golden;
    case 'bagLevel':
      return d.upgrades.bagCapacity;
    case 'harvestLevel':
      return d.upgrades.harvestPower;
    case 'workers':
      return d.workers;
    case 'carriers':
      return d.carriers;
  }
}

export interface QuestView {
  text: string;
  progress: number;
  target: number;
  done: boolean;
}

let started = false;

export const QuestSystem = {
  view(): QuestView {
    const quest = getQuests(gameState.data.islandId)[gameState.data.questIndex];
    if (!quest) return { text: 'All missions complete!', progress: 1, target: 1, done: true };
    return {
      text: quest.text,
      progress: Math.min(quest.target, readStat(quest.stat)),
      target: quest.target,
      done: false,
    };
  },

  check(): void {
    for (;;) {
      const quest = getQuests(gameState.data.islandId)[gameState.data.questIndex];
      if (!quest || readStat(quest.stat) < quest.target) break;
      gameState.data.questIndex += 1;
      const reward = Math.floor(quest.reward * BALANCE.questRewardScale);
      Economy.grant(reward);
      eventBus.emit(EVT.TOAST, reward > 0 ? `Mission complete! +${reward} coins` : 'Mission complete!');
      eventBus.emit(EVT.SOUND, 'upgrade');
    }
    eventBus.emit(EVT.QUEST, QuestSystem.view());
  },

  start(): void {
    if (started) {
      QuestSystem.check();
      return;
    }
    started = true;
    const update = (): void => QuestSystem.check();
    eventBus.on(EVT.HARVESTED, update);
    eventBus.on(EVT.SOLD, update);
    eventBus.on(EVT.UPGRADE, update);
    eventBus.on(EVT.WORKER, update);
    QuestSystem.check();
  },
};
