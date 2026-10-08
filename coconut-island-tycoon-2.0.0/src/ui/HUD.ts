import Phaser from 'phaser';
import { EVT, EventSubs } from '../core/EventBus';
import { FONT } from '../core/GameConfig';
import { gameState } from '../core/GameState';
import { getIsland } from '../data/islands';
import { Inventory } from '../player/Inventory';

/** Top-left: coins, bag, island name. */
export class HUD {
  readonly container: Phaser.GameObjects.Container;
  private money: Phaser.GameObjects.Text;
  private bag: Phaser.GameObjects.Text;
  private island: Phaser.GameObjects.Text;
  private golden: Phaser.GameObjects.Text;
  private shownMoney = gameState.data.money;
  private subs = new EventSubs();

  constructor(scene: Phaser.Scene) {
    const style = { fontFamily: FONT, fontStyle: 'bold', stroke: '#06324a', strokeThickness: 5, color: '#ffffff' };
    this.money = scene.add.text(0, 0, '', { ...style, fontSize: '30px', color: '#ffe066' });
    this.bag = scene.add.text(0, 40, '', { ...style, fontSize: '24px' });
    this.golden = scene.add.text(175, 44, '', { ...style, fontSize: '20px', color: '#ffd23f' });
    this.island = scene.add.text(0, 76, '', { ...style, fontSize: '18px' });
    this.container = scene.add.container(16, 12, [this.money, this.bag, this.golden, this.island]).setDepth(10);

    const bag = new Inventory();
    this.setBag(bag.count, bag.capacity);
    this.island.setText(`🏝 Island ${gameState.data.islandId} · ${getIsland(gameState.data.islandId).name}`);
    this.setGolden(gameState.data.golden);
    this.subs.on(EVT.GOLDEN, (n: number) => this.setGolden(n));
    this.subs.on(EVT.BAG, (c: number, cap: number) => this.setBag(c, cap));
    this.renderMoney();
  }

  private setBag(count: number, cap: number): void {
    this.bag.setText(`🥥 ${count} / ${cap}`).setColor(count >= cap ? '#ff7b7b' : '#ffffff');
  }

  private setGolden(n: number): void {
    this.golden.setText(n > 0 ? `✨ ${n}` : '');
  }

  private renderMoney(): void {
    this.money.setText(`💰 ${Math.floor(this.shownMoney).toLocaleString()}`);
  }

  update(dt: number): void {
    const target = gameState.data.money;
    if (this.shownMoney === target) return;
    const diff = target - this.shownMoney;
    const step = Math.abs(diff) < 1 ? diff : diff * Math.min(1, dt * 10);
    this.shownMoney += Math.abs(step) < 1 ? diff : step;
    this.renderMoney();
  }

  destroy(): void {
    this.subs.clear();
  }
}
