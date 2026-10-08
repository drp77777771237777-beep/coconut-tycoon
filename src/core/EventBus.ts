import Phaser from 'phaser';

export const eventBus = new Phaser.Events.EventEmitter();

export const EVT = {
  MONEY: 'money',
  BAG: 'bag',
  HARVESTED: 'harvested',
  SOLD: 'sold',
  UPGRADE: 'upgrade',
  WORKER: 'worker',
  PANEL_OPEN: 'panel-open',
  PANEL_CLOSE: 'panel-close',
  BANNER: 'banner',
  TOAST: 'toast',
  BAG_FULL: 'bag-full',
  SOUND: 'sound',
  GOLDEN: 'golden',
  BOARD: 'board',
  TRAVEL_MENU: 'travel-menu',
  TRAVEL: 'travel',
  COLLECTED: 'collected',
  GAME_EVENT: 'game-event',
  ADMIN_BOSS_HP: 'admin-boss-hp',
  ADMIN_HEARTS: 'admin-hearts',
} as const;

export type PanelKind = 'shop' | 'hire';

/** Collects subscriptions so a scene/component can drop them all on shutdown. */
export class EventSubs {
  private list: [string, (...args: never[]) => void][] = [];

  on<A extends unknown[]>(event: string, fn: (...args: A) => void): void {
    eventBus.on(event, fn);
    this.list.push([event, fn as unknown as (...args: never[]) => void]);
  }

  clear(): void {
    for (const [event, fn] of this.list) eventBus.off(event, fn);
    this.list = [];
  }
}
