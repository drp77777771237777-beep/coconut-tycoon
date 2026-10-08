import { EVT, eventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { COLLECTIBLES } from '../data/collectibles';
import { SaveSystem } from './SaveSystem';

export const CollectionSystem = {
  /** Returns true when the item was newly collected. */
  collect(id: string): boolean {
    const def = COLLECTIBLES.find((c) => c.id === id);
    if (!def || gameState.hasCollectible(id)) return false;
    gameState.data.collectibles.push(id);
    eventBus.emit(EVT.COLLECTED, `${def.icon} ${def.name}`);
    eventBus.emit(EVT.SOUND, 'complete');
    SaveSystem.save();
    return true;
  },
};
