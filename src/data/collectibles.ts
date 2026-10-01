export interface CollectibleDef {
  id: string;
  name: string;
  icon: string;
  hint: string;
}

/** Island relics: dropped by each island's temple boss, then used as boss abilities. Each adds a small permanent sell bonus. */
export const COLLECTIBLES: CollectibleDef[] = [
  { id: 'relic_sun', name: 'Sun Relic', icon: '☀️', hint: 'Island 1 · Coconut Crab King' },
  { id: 'relic_moon', name: 'Moon Relic', icon: '🌙', hint: 'Island 2 · Golden Colossus' },
  { id: 'relic_star', name: 'Star Relic', icon: '⭐', hint: 'Island 3 · Elder Treant' },
];

export const COLLECTIBLE_IDS = COLLECTIBLES.map((c) => c.id);
