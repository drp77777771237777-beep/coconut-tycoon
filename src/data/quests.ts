export type QuestStat = 'harvested' | 'sold' | 'bagLevel' | 'earned' | 'workers' | 'harvestLevel' | 'golden' | 'carriers';

export interface QuestDef {
  id: string;
  text: string;
  stat: QuestStat;
  target: number;
  reward: number;
}

const ISLAND_1: QuestDef[] = [
  { id: 'harvest5', text: 'Harvest 5 Coconuts', stat: 'harvested', target: 5, reward: 0 },
  { id: 'sell5', text: 'Sell 5 Coconuts', stat: 'sold', target: 5, reward: 20 },
  { id: 'bag2', text: 'Buy a Bag Upgrade', stat: 'bagLevel', target: 2, reward: 30 },
  { id: 'earn500', text: 'Earn 500 Coins', stat: 'earned', target: 500, reward: 50 },
  { id: 'harvest2', text: 'Upgrade Harvest Power', stat: 'harvestLevel', target: 2, reward: 50 },
  { id: 'worker1', text: 'Hire a Worker', stat: 'workers', target: 1, reward: 100 },
  { id: 'earn5000', text: 'Earn 5,000 Coins', stat: 'earned', target: 5000, reward: 0 },
];

const ISLAND_2: QuestDef[] = [
  { id: 'golden1', text: 'Harvest a Golden Coconut', stat: 'golden', target: 1, reward: 100 },
  { id: 'i2earn2000', text: 'Earn 2,000 Coins here', stat: 'earned', target: 2000, reward: 200 },
  { id: 'i2worker3', text: 'Have 3 Workers', stat: 'workers', target: 3, reward: 300 },
  { id: 'i2bag5', text: 'Bag Capacity Lv5', stat: 'bagLevel', target: 5, reward: 400 },
  { id: 'i2golden10', text: 'Harvest 10 Golden Coconuts', stat: 'golden', target: 10, reward: 0 },
  { id: 'i2earn20000', text: 'Earn 20,000 Coins here', stat: 'earned', target: 20000, reward: 0 },
];

const ISLAND_3: QuestDef[] = [
  { id: 'i3harvest', text: 'Harvest 300 Coconuts', stat: 'harvested', target: 300, reward: 100 },
  { id: 'i3worker', text: 'Have 3 Harvesters', stat: 'workers', target: 3, reward: 300 },
  { id: 'i3carrier', text: 'Hire a Carrier', stat: 'carriers', target: 1, reward: 600 },
  { id: 'i3earn10k', text: 'Earn 10,000 Coins here', stat: 'earned', target: 10000, reward: 800 },
  { id: 'i3carrier2', text: 'Have 2 Carriers', stat: 'carriers', target: 2, reward: 1200 },
  { id: 'i3bag6', text: 'Bag Capacity Lv6', stat: 'bagLevel', target: 6, reward: 1500 },
  { id: 'i3earn50k', text: 'Earn 50,000 Coins here', stat: 'earned', target: 50000, reward: 0 },
];

const BY_ISLAND: Record<number, QuestDef[]> = { 1: ISLAND_1, 2: ISLAND_2, 3: ISLAND_3 };

export function getQuests(islandId: number): QuestDef[] {
  return BY_ISLAND[islandId] ?? [];
}
