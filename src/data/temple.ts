import type { Point } from './islands';

export interface Platform {
  /** centre x, top y, width */
  x: number;
  y: number;
  w: number;
}

/** Optional bonus pickups on the jump course (coins). */
export const COURSE = {
  width: 1950,
  height: 640,
  pitY: 720,
  start: { x: 80, y: 480 },
  /** Max jump ≈ 128px high / ≈ 210px far, so gaps stay below that. */
  platforms: [
    { x: 150, y: 520, w: 300 },
    { x: 400, y: 480, w: 110 },
    { x: 580, y: 430, w: 110 },
    { x: 760, y: 380, w: 110 },
    { x: 940, y: 430, w: 110 },
    { x: 1120, y: 480, w: 110 },
    { x: 1300, y: 430, w: 110 },
    { x: 1480, y: 380, w: 110 },
    { x: 1660, y: 440, w: 110 },
    { x: 1850, y: 500, w: 200 },
    // optional ledges holding bonus gems
    { x: 670, y: 330, w: 80 },
    { x: 1390, y: 330, w: 80 },
    { x: 1030, y: 330, w: 80 },
  ] as Platform[],
  checkpoints: [
    { x: 760, y: 340 },
    { x: 1480, y: 340 },
  ] as Point[],
  gems: [
    { x: 670, y: 296 },
    { x: 1030, y: 296 },
    { x: 1390, y: 296 },
  ] as Point[],
  gemValue: 100,
  door: { x: 1900, y: 500 },
};

export const ARENA = {
  width: 960,
  height: 540,
  groundY: 470,
  start: { x: 120, y: 440 },
};

export const BOSS = {
  contactDamageCooldown: 1.6,
  playerHearts: 4,
  throwCooldown: 0.3,
};

/** One temple per island, themed after it. Beating its boss gives that island's relic. */
export interface TempleTheme {
  bg: number;
  pillarA: number;
  pillarB: number;
  platform: number;
  platformTop: number;
}

export interface TempleDef {
  islandId: number;
  bossName: string;
  bossHp: number;
  /** Phase-2 armor (needs relic abilities to be efficient). */
  armor: boolean;
  armorName: string;
  /** Sideways charge attack (jump over it). */
  charge: boolean;
  /** Multiplies boulder speed and shortens attack intervals. */
  aggression: number;
  /** Extra rocks per falling-rock volley. */
  rockBonus: number;
  /** Texture keys (see PreloadScene). */
  bossTexture: string;
  rollTexture: string;
  dropTexture: string;
  theme: TempleTheme;
  relicId: string;
  /** Coins for the first victory. */
  reward: number;
}

export const TEMPLES: TempleDef[] = [
  {
    islandId: 1,
    bossName: 'Coconut Crab King',
    bossHp: 14,
    armor: false,
    armorName: '',
    charge: true,
    rockBonus: 0,
    aggression: 0.75,
    bossTexture: 'boss_crab',
    rollTexture: 'shell',
    dropTexture: 'coconut_big',
    theme: { bg: 0x16384a, pillarA: 0x21526b, pillarB: 0x2d6a88, platform: 0xb59b6a, platformTop: 0xe8d6a0 },
    relicId: 'relic_sun',
    reward: 600,
  },
  {
    islandId: 2,
    bossName: 'Golden Colossus',
    bossHp: 20,
    armor: true,
    armorName: 'GILDED ARMOR!',
    charge: false,
    rockBonus: 0,
    aggression: 0.9,
    bossTexture: 'boss_gold',
    rollTexture: 'nugget',
    dropTexture: 'gold_rock',
    theme: { bg: 0x2e2410, pillarA: 0x4a3a16, pillarB: 0x6b5420, platform: 0xb08d3a, platformTop: 0xffe27a },
    relicId: 'relic_moon',
    reward: 1500,
  },
  {
    islandId: 3,
    bossName: 'Elder Treant',
    bossHp: 24,
    armor: true,
    armorName: 'BARK ARMOR!',
    charge: false,
    rockBonus: 1,
    aggression: 0.95,
    bossTexture: 'boss_treant',
    rollTexture: 'log',
    dropTexture: 'thorn_seed',
    theme: { bg: 0x0f2a1a, pillarA: 0x1d4a2a, pillarB: 0x2a6a3a, platform: 0x7a5a32, platformTop: 0x8bd35a },
    relicId: 'relic_star',
    reward: 3000,
  },
];

export function getTemple(islandId: number): TempleDef {
  return TEMPLES.find((t) => t.islandId === islandId) ?? TEMPLES[0];
}

/** Island relics double as boss abilities (key = desktop shortcut). Relics come from earlier islands' bosses. */
export interface RelicAbility {
  id: string;
  key: string;
  label: string;
  icon: string;
  cooldown: number;
}

export const ABILITIES: RelicAbility[] = [
  { id: 'relic_sun', key: 'Digit1', label: 'Sun Beam', icon: '☀️', cooldown: 12 },
  { id: 'relic_moon', key: 'Digit2', label: 'Moon Shield', icon: '🌙', cooldown: 14 },
  { id: 'relic_star', key: 'Digit3', label: 'Star Stun', icon: '⭐', cooldown: 16 },
];

export const ABILITY_TUNING = {
  sunDamage: 6,
  shieldSec: 4,
  stunSec: 3,
  /** Coconut damage multiplier while the boss wears Stone Armor (phase 2). */
  armorMult: 0.35,
  /** Damage multiplier while stunned. */
  stunMult: 2,
};
