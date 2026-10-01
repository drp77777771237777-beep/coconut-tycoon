import Phaser from 'phaser';
import { EVT, EventSubs } from '../core/EventBus';
import { FONT } from '../core/GameConfig';
import { QuestSystem, type QuestView } from '../systems/QuestSystem';

const W = 230;
const H = 74;

/** Top-right: current mission. */
export class QuestPanel {
  readonly container: Phaser.GameObjects.Container;
  private text: Phaser.GameObjects.Text;
  private count: Phaser.GameObjects.Text;
  private bar: Phaser.GameObjects.Graphics;
  private subs = new EventSubs();

  constructor(scene: Phaser.Scene) {
    const bg = scene.add.rectangle(0, 0, W, H, 0x06324a, 0.6).setOrigin(0, 0).setStrokeStyle(2, 0xffffff, 0.25);
    const title = scene.add.text(10, 6, 'MISSION', { fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: '#8be04e' });
    this.text = scene.add.text(10, 22, '', { fontFamily: FONT, fontSize: '17px', fontStyle: 'bold', color: '#ffffff', wordWrap: { width: W - 20 } });
    this.count = scene.add.text(W - 10, 6, '', { fontFamily: FONT, fontSize: '13px', color: '#cfeaff' }).setOrigin(1, 0);
    this.bar = scene.add.graphics();
    this.container = scene.add.container(0, 0, [bg, title, this.text, this.count, this.bar]).setDepth(10);
    this.set(QuestSystem.view());
    this.subs.on(EVT.QUEST, (v: QuestView) => this.set(v));
  }

  get width(): number {
    return W;
  }

  private set(v: QuestView): void {
    this.text.setText(v.text);
    this.count.setText(v.done ? '' : `${v.progress.toLocaleString()} / ${v.target.toLocaleString()}`);
    this.bar.clear();
    this.bar.fillStyle(0x000000, 0.4).fillRoundedRect(10, H - 16, W - 20, 8, 4);
    this.bar.fillStyle(0x8be04e, 1).fillRoundedRect(10, H - 16, (W - 20) * (v.progress / v.target), 8, 4);
  }

  destroy(): void {
    this.subs.clear();
  }
}
