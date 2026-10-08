export const SCENES = {
  boot: 'BootScene',
  preload: 'PreloadScene',
  menu: 'MenuScene',
  island: 'IslandScene',
  ui: 'UIScene',
  temple: 'TempleScene',
  kraken: 'KrakenScene',
} as const;

export const SAVE_KEY = 'coconut-island-tycoon-save';
export const SAVE_VERSION = 7;
/** Typed anywhere in game (no input field) to open the admin pad. */
export const ADMIN_CODE = '1558726';
export const AUTOSAVE_MS = 30000;

export const WATER_COLOR = 0x2a9fd6;
export const FONT = 'Arial, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
