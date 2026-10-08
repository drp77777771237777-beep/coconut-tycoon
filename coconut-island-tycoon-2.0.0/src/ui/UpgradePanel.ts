import Phaser from 'phaser';
import { EVT, EventSubs, eventBus, type PanelKind } from '../core/EventBus';
import { FONT } from '../core/GameConfig';
import { CARRIER_BALANCE, WORKER_BALANCE } from '../data/balance';
import { getIsland } from '../data/islands';
import { gameState } from '../core/GameState';
import { UPGRADES, UPGRADE_ORDER, type UpgradeId } from '../data/upgrades';
import { Economy } from '../systems/EconomySystem';
import { CarrierSystem, UpgradeSystem, WorkerSystem } from '../systems/UpgradeSystem';

const PANEL_W = 360;
const ROW_H = 58;
const HEAD_H = 40;

interface RowInfo {
  title: string;
  desc: string;
  cost: number | null;
}

interface Row {
  info: () => RowInfo;
  buy: () => boolean;
  desc: Phaser.GameObjects.Text;
  btn: Phaser.GameObjects.Rectangle;
  btnText: Phaser.GameObjects.Text;
}

/** Small contextual panel opened by walking up to the upgrade shop or the hire point. */
export class UpgradePanel {
  readonly container: Phaser.GameObjects.Container;
  private kind: PanelKind | null = null;
  private rows: Row[] = [];
  private subs = new EventSubs();
  height = 0;

  constructor(
    private scene: Phaser.Scene,
    private onShown: () => void,
  ) {
    this.container = scene.add.container(0, 0).setDepth(50).setVisible(false);
    this.subs.on(EVT.PANEL_OPEN, (k: PanelKind) => this.show(k));
    this.subs.on(EVT.PANEL_CLOSE, (k: PanelKind) => {
      if (this.kind === k) this.hide();
    });
    const refresh = (): void => this.refresh();
    this.subs.on(EVT.MONEY, refresh);
    this.subs.on(EVT.UPGRADE, refresh);
    this.subs.on(EVT.WORKER, refresh);
  }

  private shopRows(): { info: () => RowInfo; buy: () => boolean }[] {
    return UPGRADE_ORDER.map((id: UpgradeId) => ({
      info: (): RowInfo => {
        const def = UPGRADES[id];
        const lv = UpgradeSystem.level(id);
        const cost = UpgradeSystem.nextCost(id);
        const cur = UpgradeSystem.value(id);
        const desc =
          cost === null
            ? `Lv${lv} MAX  (${cur}${def.unit})`
            : `Lv${lv} → Lv${lv + 1}   ${cur}${def.unit} → ${UpgradeSystem.value(id, lv + 1)}${def.unit}`;
        return { title: `${def.icon} ${def.label}`, desc, cost };
      },
      buy: () => UpgradeSystem.buy(id),
    }));
  }

  private hireRows(): { info: () => RowInfo; buy: () => boolean }[] {
    const rows: { info: () => RowInfo; buy: () => boolean }[] = [
      {
        info: (): RowInfo => ({
          title: '👷 Harvester',
          desc: `Hired ${WorkerSystem.count()} / ${WORKER_BALANCE.maxCount}   auto-harvests trees`,
          cost: WorkerSystem.nextCost(),
        }),
        buy: () => WorkerSystem.buy(),
      },
    ];
    // islands whose storage does not auto-sell need Carriers to haul coconuts to the sell stand
    if (getIsland(gameState.data.islandId).autoSellStorage === false) {
      rows.push({
        info: (): RowInfo => ({
          title: '📦 Carrier',
          desc: `Hired ${CarrierSystem.count()} / ${CARRIER_BALANCE.maxCount}   storage → sell stand`,
          cost: CarrierSystem.nextCost(),
        }),
        buy: () => CarrierSystem.buy(),
      });
    }
    return rows;
  }

  private show(kind: PanelKind): void {
    this.kind = kind;
    this.clear();
    const defs = kind === 'shop' ? this.shopRows() : this.hireRows();
    this.height = HEAD_H + defs.length * ROW_H + 10;

    const bg = this.scene.add.rectangle(0, 0, PANEL_W, this.height, 0x06324a, 0.88).setOrigin(0, 0).setStrokeStyle(3, 0xffffff, 0.35);
    const head = this.scene.add.text(14, 10, kind === 'shop' ? 'UPGRADE' : 'HIRE WORKERS', {
      fontFamily: FONT,
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffe066',
    });
    this.container.add([bg, head]);

    defs.forEach((def, i) => {
      const y = HEAD_H + i * ROW_H;
      const title = this.scene.add.text(14, y + 4, '', { fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#ffffff' });
      const desc = this.scene.add.text(14, y + 30, '', { fontFamily: FONT, fontSize: '13px', color: '#bfe3f5' });
      const btn = this.scene.add.rectangle(PANEL_W - 14, y + 26, 108, 42, 0x3fbf5a).setOrigin(1, 0.5).setStrokeStyle(3, 0x1f7a34);
      btn.setInteractive({ useHandCursor: true });
      const btnText = this.scene.add.text(PANEL_W - 14 - 54, y + 26, '', { fontFamily: FONT, fontSize: '17px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
      const row: Row = { info: def.info, buy: def.buy, desc, btn, btnText };
      btn.on('pointerdown', () => {
        if (row.buy()) eventBus.emit(EVT.SOUND, 'upgrade');
        else eventBus.emit(EVT.SOUND, 'error');
      });
      title.setText(def.info().title);
      this.container.add([title, desc, btn, btnText]);
      this.rows.push(row);
    });

    this.container.setVisible(true);
    this.refresh();
    this.onShown();
  }

  private hide(): void {
    this.kind = null;
    this.container.setVisible(false);
    this.clear();
  }

  private clear(): void {
    this.container.removeAll(true);
    this.rows = [];
  }

  private refresh(): void {
    if (!this.kind) return;
    for (const row of this.rows) {
      const info = row.info();
      row.desc.setText(info.desc);
      if (info.cost === null) {
        row.btn.setFillStyle(0x59707d).setStrokeStyle(3, 0x3a4b55);
        row.btnText.setText('MAX');
      } else {
        const ok = Economy.canAfford(info.cost);
        row.btn.setFillStyle(ok ? 0x3fbf5a : 0x59707d).setStrokeStyle(3, ok ? 0x1f7a34 : 0x3a4b55);
        row.btnText.setText(`💰 ${info.cost.toLocaleString()}`).setColor(ok ? '#ffffff' : '#b9c7cf');
      }
    }
  }

  get width(): number {
    return PANEL_W;
  }

  destroy(): void {
    this.subs.clear();
  }
}
