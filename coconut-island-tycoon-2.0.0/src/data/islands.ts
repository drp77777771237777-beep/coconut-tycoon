export interface Point {
  x: number;
  y: number;
}

export interface TreeSpot extends Point {
  kind?: 'golden';
}

export interface IslandTheme {
  grass: number;
  grassLight: number;
  sand: number;
  sandDark: number;
}

export interface IslandDef {
  id: number;
  name: string;
  coconutType: string;
  sellMultiplier: number;
  /** Coins charged when boarding the boat that leads TO this island. */
  unlockCost: number;
  world: { width: number; height: number };
  shape: { cx: number; cy: number; rx: number; ry: number };
  theme: IslandTheme;
  spawn: Point;
  trees: TreeSpot[];
  rocks: Point[];
  sellZone: Point;
  shop: Point;
  hire: Point;
  storage: Point;
  dock: Point;
  /** Optional side content (jump course + boss). */
  temple?: Point;
  /** false = storage keeps coconuts for Carriers to haul to the sell stand (default: auto-sell). */
  autoSellStorage?: boolean;
  /** Tree art set. */
  treeStyle?: 'jungle' | 'volcano';
}

const WORLD = { width: 1600, height: 1200 };
const SHAPE = { cx: 800, cy: 600, rx: 600, ry: 400 };

export const ISLANDS: IslandDef[] = [
  {
    id: 1,
    name: 'Tutorial Island',
    coconutType: 'normal',
    sellMultiplier: 1,
    unlockCost: 0,
    world: WORLD,
    shape: SHAPE,
    theme: { grass: 0x5fb85a, grassLight: 0x6cc767, sand: 0xf2dc9b, sandDark: 0xe8cb7e },
    spawn: { x: 860, y: 730 },
    trees: [
      { x: 430, y: 420 },
      { x: 550, y: 370 },
      { x: 690, y: 350 },
      { x: 360, y: 520 },
      { x: 500, y: 500 },
      { x: 640, y: 480 },
      { x: 330, y: 630 },
      { x: 470, y: 640 },
      { x: 610, y: 640 },
      { x: 760, y: 500 },
    ],
    rocks: [
      { x: 1250, y: 470 },
      { x: 250, y: 740 },
      { x: 1000, y: 880 },
    ],
    sellZone: { x: 1130, y: 600 },
    shop: { x: 1010, y: 430 },
    hire: { x: 1190, y: 790 },
    storage: { x: 570, y: 790 },
    dock: { x: 800, y: 950 },
    temple: { x: 1210, y: 330 },
  },
  {
    id: 2,
    name: 'Golden Island',
    coconutType: 'golden',
    sellMultiplier: 2,
    unlockCost: 1500,
    world: WORLD,
    shape: SHAPE,
    theme: { grass: 0x8cc152, grassLight: 0x9bd05f, sand: 0xf8d86a, sandDark: 0xeec24a },
    spawn: { x: 860, y: 730 },
    trees: [
      { x: 420, y: 430 },
      { x: 540, y: 380 },
      { x: 680, y: 360 },
      { x: 360, y: 560 },
      { x: 490, y: 520 },
      { x: 630, y: 500 },
      { x: 340, y: 670 },
      { x: 470, y: 670 },
      { x: 610, y: 660 },
      { x: 750, y: 530 },
      { x: 760, y: 650 },
      // rare golden trees
      { x: 880, y: 330, kind: 'golden' },
      { x: 270, y: 520, kind: 'golden' },
      { x: 930, y: 800, kind: 'golden' },
    ],
    rocks: [
      { x: 1280, y: 520 },
      { x: 240, y: 720 },
      { x: 1050, y: 900 },
    ],
    sellZone: { x: 1130, y: 600 },
    shop: { x: 1010, y: 430 },
    hire: { x: 1190, y: 790 },
    storage: { x: 570, y: 800 },
    dock: { x: 800, y: 950 },
    temple: { x: 1210, y: 330 },
  },
];

const ISLAND_3: IslandDef = {
  id: 3,
  name: 'Jungle Island',
  coconutType: 'jungle',
  sellMultiplier: 3,
  unlockCost: 4000,
  world: WORLD,
  shape: SHAPE,
  theme: { grass: 0x3f9a4a, grassLight: 0x4fae58, sand: 0xcdb77a, sandDark: 0xb89d5c },
  spawn: { x: 900, y: 720 },
  trees: [
      { x: 520, y: 414 },
      { x: 854, y: 543 },
      { x: 550, y: 631 },
      { x: 831, y: 352 },
      { x: 393, y: 535 },
      { x: 626, y: 448 },
      { x: 726, y: 534 },
      { x: 767, y: 423 },
      { x: 384, y: 658 },
      { x: 679, y: 343 },
      { x: 1029, y: 340, kind: 'golden' },
      { x: 485, y: 513 },
      { x: 478, y: 700 },
      { x: 783, y: 615 },
      { x: 958, y: 646, kind: 'golden' },
      { x: 656, y: 653 },
      { x: 742, y: 710 },
      { x: 385, y: 426, kind: 'golden' },
      { x: 933, y: 338 },
      { x: 584, y: 342 },
      { x: 579, y: 533 },
      { x: 587, y: 718 },
  ],
  rocks: [
    { x: 1250, y: 470 },
    { x: 250, y: 740 },
    { x: 1000, y: 880 },
  ],
  sellZone: { x: 1130, y: 600 },
  shop: { x: 1010, y: 430 },
  hire: { x: 1190, y: 790 },
  storage: { x: 850, y: 820 },
  dock: { x: 800, y: 950 },
  temple: { x: 1210, y: 330 },
  autoSellStorage: false,
  treeStyle: 'jungle',
};
ISLANDS.push(ISLAND_3);

const ISLAND_4: IslandDef = {
  id: 4,
  name: 'Volcano Island',
  coconutType: 'magma',
  sellMultiplier: 4,
  unlockCost: 10000,
  world: WORLD,
  shape: SHAPE,
  theme: { grass: 0x5a4a44, grassLight: 0x6a5750, sand: 0x3a3236, sandDark: 0x2a2428 },
  spawn: { x: 900, y: 720 },
  trees: [
    { x: 430, y: 420 },
    { x: 560, y: 370 },
    { x: 700, y: 350 },
    { x: 360, y: 530 },
    { x: 500, y: 510 },
    { x: 640, y: 490 },
    { x: 780, y: 440 },
    { x: 340, y: 650 },
    { x: 480, y: 660 },
    { x: 620, y: 650 },
    { x: 760, y: 620 },
    { x: 900, y: 360 },
    { x: 560, y: 740 },
    { x: 1030, y: 340, kind: 'golden' },
    { x: 290, y: 540, kind: 'golden' },
    { x: 940, y: 650, kind: 'golden' },
  ],
  rocks: [
    { x: 1250, y: 470 },
    { x: 250, y: 740 },
    { x: 1000, y: 880 },
    { x: 1330, y: 640 },
  ],
  sellZone: { x: 1130, y: 600 },
  shop: { x: 1010, y: 430 },
  hire: { x: 1190, y: 790 },
  storage: { x: 850, y: 820 },
  dock: { x: 800, y: 950 },
  temple: { x: 1210, y: 330 },
  autoSellStorage: false,
  treeStyle: 'volcano',
};
ISLANDS.push(ISLAND_4);

export function getIsland(id: number): IslandDef {
  return ISLANDS.find((i) => i.id === id) ?? ISLANDS[0];
}

export function getNextIsland(id: number): IslandDef | undefined {
  return ISLANDS.find((i) => i.id === id + 1);
}
