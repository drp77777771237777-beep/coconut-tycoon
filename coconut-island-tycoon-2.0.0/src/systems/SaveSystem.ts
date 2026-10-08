import { AUTOSAVE_MS, SAVE_KEY, SAVE_VERSION } from '../core/GameConfig';
import { EVT, eventBus } from '../core/EventBus';
import { defaultSave, gameState, type SaveData } from '../core/GameState';
import { UPGRADES, UPGRADE_ORDER } from '../data/upgrades';
import { CARRIER_BALANCE, WORKER_BALANCE } from '../data/balance';
import { COLLECTIBLE_IDS } from '../data/collectibles';
import { ADMIN_LIMITS } from '../data/events';

function num(v: unknown, fallback: number, min = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.max(min, v) : fallback;
}

/** Convert older save versions to the current shape. Add steps here when SAVE_VERSION grows. */
function migrate(raw: Record<string, unknown>): Record<string, unknown> {
  const version = typeof raw.saveVersion === 'number' ? raw.saveVersion : 1;
  if (version < 2) {
    // v1 -> v2: single island flag became a list, island earnings tracked separately
    raw.completedIslands = raw.islandCompleted === true ? [1] : [];
    const stats = (raw.stats ?? {}) as Record<string, unknown>;
    stats.islandEarned = stats.earned;
    raw.stats = stats;
  }
  if (version < 3) {
    // v2 -> v3: remember which islands were visited
    const done = Array.isArray(raw.completedIslands) ? (raw.completedIslands as number[]) : [];
    const current = typeof raw.islandId === 'number' ? raw.islandId : 1;
    raw.visitedIslands = Array.from(new Set([1, current, ...done]));
  }
  if (version < 4) {
    // v3 -> v4: relics became per-island boss rewards (old course relics / idol are gone)
    const old = Array.isArray(raw.collectibles) ? (raw.collectibles as string[]) : [];
    raw.collectibles = old.includes('idol_guardian') ? ['relic_moon'] : [];
  }
  if (version < 6) {
    // v5 -> v6: admin-pad overrides (sanitize fills the defaults)
    raw.admin = {};
  }
  // v6 -> v7: missions and island completion were removed (their fields are dropped by sanitize)
  return raw;
}

function sanitize(raw: Record<string, unknown>): SaveData {
  const base = defaultSave();
  const upgrades = (raw.upgrades ?? {}) as Record<string, unknown>;
  const stats = (raw.stats ?? {}) as Record<string, unknown>;
  const settings = (raw.settings ?? {}) as Record<string, unknown>;
  const admin = (raw.admin ?? {}) as Record<string, unknown>;
  for (const id of UPGRADE_ORDER) {
    const max = UPGRADES[id].levels.length;
    base.upgrades[id] = Math.min(max, Math.max(1, Math.floor(num(upgrades[id], 1, 1))));
  }
  base.money = num(raw.money, 0);
  base.islandId = Math.floor(num(raw.islandId, 1, 1));
  base.workers = Math.min(WORKER_BALANCE.maxCount, Math.floor(num(raw.workers, 0)));
  base.carriers = Math.min(CARRIER_BALANCE.maxCount, Math.floor(num(raw.carriers, 0)));
  const ids = (v: unknown): number[] =>
    Array.isArray(v) ? v.filter((n): n is number => typeof n === 'number' && Number.isFinite(n)) : [];
  base.visitedIslands = Array.from(new Set([1, base.islandId, ...ids(raw.visitedIslands)]));
  base.golden = Math.floor(num(raw.golden, 0));
  base.collectibles = Array.isArray(raw.collectibles)
    ? raw.collectibles.filter((c): c is string => typeof c === 'string' && COLLECTIBLE_IDS.includes(c))
    : [];
  base.stats = {
    harvested: num(stats.harvested, 0),
    sold: num(stats.sold, 0),
    earned: num(stats.earned, 0),
    golden: num(stats.golden, 0),
  };
  base.settings = { sound: settings.sound !== false };
  const override = (v: unknown, max: number): number | null =>
    typeof v === 'number' && Number.isFinite(v) && v >= 1 ? Math.min(max, Math.floor(v)) : null;
  base.admin = {
    bagCapacity: override(admin.bagCapacity, ADMIN_LIMITS.maxBag),
    coconutPrice: override(admin.coconutPrice, ADMIN_LIMITS.maxPrice),
  };
  const cap = base.admin.bagCapacity ?? UPGRADES.bagCapacity.levels[base.upgrades.bagCapacity - 1].value;
  base.bag = Math.min(cap, Math.floor(num(raw.bag, 0)));
  return base;
}

let timer: number | undefined;

export const SaveSystem = {
  hasSave(): boolean {
    try {
      return localStorage.getItem(SAVE_KEY) !== null;
    } catch {
      return false;
    }
  },

  load(): boolean {
    try {
      const text = localStorage.getItem(SAVE_KEY);
      if (!text) return false;
      const raw = migrate(JSON.parse(text) as Record<string, unknown>);
      gameState.replace(sanitize(raw));
      return true;
    } catch {
      return false;
    }
  },

  save(): void {
    try {
      gameState.data.saveVersion = SAVE_VERSION;
      localStorage.setItem(SAVE_KEY, JSON.stringify(gameState.data));
    } catch {
      // storage unavailable: ignore
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // ignore
    }
  },

  /** Autosave every 30s and on key events / page exit. Idempotent. */
  start(): void {
    if (timer !== undefined) return;
    timer = window.setInterval(() => SaveSystem.save(), AUTOSAVE_MS);
    eventBus.on(EVT.UPGRADE, SaveSystem.save);
    eventBus.on(EVT.WORKER, SaveSystem.save);
    window.addEventListener('beforeunload', SaveSystem.save);
    window.addEventListener('pagehide', SaveSystem.save);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) SaveSystem.save();
    });
  },
};
