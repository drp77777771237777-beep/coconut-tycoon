export type UpgradeId = 'harvestPower' | 'harvestSpeed' | 'bagCapacity' | 'moveSpeed';

export interface UpgradeLevel {
  value: number;
  cost: number;
}

export interface UpgradeDef {
  id: UpgradeId;
  label: string;
  icon: string;
  unit: string;
  levels: UpgradeLevel[];
}

export const UPGRADE_ORDER: UpgradeId[] = ['harvestPower', 'harvestSpeed', 'bagCapacity', 'moveSpeed'];

export const UPGRADES: Record<UpgradeId, UpgradeDef> = {
  harvestPower: {
    id: 'harvestPower',
    label: 'Harvest Power',
    icon: '🥥',
    unit: '',
    levels: [
      { value: 1, cost: 0 },
      { value: 2, cost: 80 },
      { value: 3, cost: 300 },
      { value: 5, cost: 800 },
      { value: 8, cost: 2000 },
    ],
  },
  harvestSpeed: {
    id: 'harvestSpeed',
    label: 'Harvest Speed',
    icon: '⚡',
    unit: 's',
    levels: [
      { value: 1.5, cost: 0 },
      { value: 1.2, cost: 120 },
      { value: 1.0, cost: 350 },
      { value: 0.8, cost: 900 },
      { value: 0.5, cost: 2200 },
    ],
  },
  bagCapacity: {
    id: 'bagCapacity',
    label: 'Bag Capacity',
    icon: '🎒',
    unit: '',
    levels: [
      { value: 10, cost: 0 },
      { value: 20, cost: 100 },
      { value: 35, cost: 300 },
      { value: 50, cost: 700 },
      { value: 75, cost: 1500 },
      { value: 100, cost: 3000 },
      { value: 150, cost: 6000 },
      { value: 250, cost: 12000 },
    ],
  },
  moveSpeed: {
    id: 'moveSpeed',
    label: 'Move Speed',
    icon: '👟',
    unit: '',
    levels: [
      { value: 140, cost: 0 },
      { value: 160, cost: 150 },
      { value: 180, cost: 400 },
      { value: 200, cost: 1000 },
      { value: 220, cost: 2500 },
    ],
  },
};
