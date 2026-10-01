import Phaser from 'phaser';
import { EVT, eventBus } from '../core/EventBus';
import { FONT } from '../core/GameConfig';
import type { IslandDef } from '../data/islands';
import type { FloatingTextManager } from '../ui/FloatingText';
import type { Inventory } from '../player/Inventory';
import { FLAT_DEPTH, GROUND_DEPTH } from '../utils/DepthUtils';
import { CoconutTree } from './CoconutTree';
import { Dock } from './Dock';
import { InteractZone } from './InteractZone';
import { SellZone } from './SellZone';
import { Storage } from './Storage';

/** Builds one island from data (see data/islands.ts) and owns its static world objects. */
export class IslandManager {
  readonly trees: CoconutTree[] = [];
  readonly solids: Phaser.Physics.Arcade.StaticGroup;
  readonly sellZone: SellZone;
  readonly shopZone: InteractZone;
  readonly hireZone: InteractZone;
  readonly storage: Storage;
  readonly dock: Dock;
  /** Optional side content (only on islands that define a temple). */
  readonly templeZone?: InteractZone;

  constructor(
    private scene: Phaser.Scene,
    readonly def: IslandDef,
    inventory: Inventory,
    readonly floating: FloatingTextManager,
  ) {
    this.solids = scene.physics.add.staticGroup();
    this.drawGround();

    for (const r of def.rocks) {
      scene.add.image(r.x, r.y, 'rock').setOrigin(0.5, 1).setDepth(r.y);
      this.addSolid(r.x, r.y - 8, 40, 16);
    }

    for (const t of def.trees) {
      this.trees.push(new CoconutTree(scene, t.x, t.y, t.kind ?? 'normal', def.treeStyle));
      this.addSolid(t.x, t.y - 7, 24, 14);
    }

    this.sellZone = new SellZone(
      scene,
      def.sellZone,
      { cx: def.sellZone.x, cy: def.sellZone.y + 62, w: 210, h: 110 },
      inventory,
      floating,
    );
    this.building('sell_stand', def.sellZone, 100, 26);

    this.building('shop', def.shop, 100, 26);
    this.shopZone = new InteractZone(scene, def.shop.x, def.shop.y + 58, 170, 90, 0x6fb7ff, 'UPGRADES', def.shop.y - 112);
    this.shopZone.onEnter = () => eventBus.emit(EVT.PANEL_OPEN, 'shop');
    this.shopZone.onExit = () => eventBus.emit(EVT.PANEL_CLOSE, 'shop');

    this.building('hire_hut', def.hire, 100, 26);
    this.hireZone = new InteractZone(scene, def.hire.x, def.hire.y + 58, 170, 90, 0x7be08a, 'HIRE WORKERS', def.hire.y - 112);
    this.hireZone.onEnter = () => eventBus.emit(EVT.PANEL_OPEN, 'hire');
    this.hireZone.onExit = () => eventBus.emit(EVT.PANEL_CLOSE, 'hire');

    this.storage = new Storage(scene, def.storage.x, def.storage.y, floating, def.autoSellStorage !== false);
    this.addSolid(def.storage.x, def.storage.y - 12, 64, 24);

    this.dock = new Dock(scene, def.dock.x, def.dock.y);

    if (def.temple) {
      this.building('temple', def.temple, 150, 30);
      this.templeZone = new InteractZone(scene, def.temple.x, def.temple.y + 60, 190, 90, 0xc9a0ff, 'TEMPLE', def.temple.y - 150);
      this.templeZone.onEnter = () => eventBus.emit(EVT.TOAST, 'Ancient temple: press SPACE / action to enter (optional)');
    }
  }

  /** Keep a point inside the walkable part of the island (slightly inside the beach). */
  clamp(x: number, y: number, margin = 0): { x: number; y: number } {
    const { cx, cy, rx, ry } = this.def.shape;
    const nx = (x - cx) / (rx - margin);
    const ny = (y - cy) / (ry - margin);
    const d = Math.hypot(nx, ny);
    if (d <= 1) return { x, y };
    return { x: cx + (nx / d) * (rx - margin), y: cy + (ny / d) * (ry - margin) };
  }

  /** Nearest ready, unreserved tree to a point. */
  findFreeTree(x: number, y: number): CoconutTree | null {
    let best: CoconutTree | null = null;
    let bestD = Infinity;
    for (const t of this.trees) {
      if (!t.ready || t.reservedBy || t.kind === 'golden') continue;
      const d = Phaser.Math.Distance.Between(x, y, t.x, t.y);
      if (d < bestD) {
        bestD = d;
        best = t;
      }
    }
    return best;
  }

  update(dt: number): void {
    for (const t of this.trees) t.tick(dt);
    this.storage.update(dt);
  }

  private building(key: string, at: { x: number; y: number }, w: number, h: number): void {
    this.scene.add.image(at.x, at.y, key).setOrigin(0.5, 1).setDepth(at.y);
    this.addSolid(at.x, at.y - h / 2, w, h);
  }

  private addSolid(x: number, y: number, w: number, h: number): void {
    const s = this.solids.create(x, y, 'pixel') as Phaser.Physics.Arcade.Sprite;
    s.setVisible(false).setDisplaySize(w, h);
    (s.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
  }

  private drawGround(): void {
    const { cx, cy, rx, ry } = this.def.shape;
    const th = this.def.theme;
    const g = this.scene.add.graphics().setDepth(GROUND_DEPTH);
    // shallow water halo
    g.fillStyle(0x4cc3e6, 0.55).fillEllipse(cx, cy + 18, (rx + 150) * 2, (ry + 120) * 2);
    g.fillStyle(0x6fd6ee, 0.6).fillEllipse(cx, cy + 14, (rx + 90) * 2, (ry + 70) * 2);
    // island thickness (side wall) gives the 2.5D slab feel
    g.fillStyle(0xb98a4a, 1).fillEllipse(cx, cy + 34, (rx + 50) * 2, (ry + 40) * 2);
    g.fillStyle(0x8d6531, 1).fillEllipse(cx, cy + 44, (rx + 46) * 2, (ry + 34) * 2);
    // sand top
    g.fillStyle(th.sand, 1).fillEllipse(cx, cy, (rx + 50) * 2, (ry + 40) * 2);
    g.fillStyle(th.sandDark, 1).fillEllipse(cx, cy, (rx + 20) * 2, (ry + 14) * 2);
    // grass
    g.fillStyle(th.grass, 1).fillEllipse(cx, cy, (rx - 60) * 2, (ry - 50) * 2);
    g.fillStyle(th.grassLight, 1).fillEllipse(cx - 10, cy - 8, (rx - 90) * 2, (ry - 80) * 2);
    // dirt patches under facilities
    const d = this.def;
    g.fillStyle(0xd9b878, 0.85);
    for (const p of [
      { x: d.sellZone.x, y: d.sellZone.y + 30 },
      { x: d.shop.x, y: d.shop.y + 30 },
      { x: d.hire.x, y: d.hire.y + 30 },
      { x: d.storage.x, y: d.storage.y + 10 },
    ]) {
      g.fillEllipse(p.x, p.y, 240, 130);
    }
    g.fillEllipse(d.dock.x, d.dock.y + 10, 220, 110);
    if (d.temple) g.fillEllipse(d.temple.x, d.temple.y + 30, 260, 130);

    // water shimmer
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const x = cx + Math.cos(a) * (rx + 190);
      const y = cy + Math.sin(a) * (ry + 150);
      const w = this.scene.add.text(x, y, '~', { fontFamily: FONT, fontSize: '34px', color: '#ffffff' }).setAlpha(0.35).setDepth(FLAT_DEPTH - 1);
      this.scene.tweens.add({ targets: w, alpha: 0.1, duration: 1200 + i * 90, yoyo: true, repeat: -1 });
    }
  }
}
