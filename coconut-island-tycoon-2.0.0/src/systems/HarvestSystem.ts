import Phaser from 'phaser';
import { EVT, eventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { BALANCE } from '../data/balance';
import type { Inventory } from '../player/Inventory';
import type { Player } from '../player/Player';
import type { FloatingTextManager } from '../ui/FloatingText';
import type { CoconutTree } from '../world/CoconutTree';
import { OVERLAY_DEPTH } from '../utils/DepthUtils';
import { UpgradeSystem } from './UpgradeSystem';

const BAR_W = 44;

/** Player harvesting: pick the nearest ready tree in range, fill a progress bar, then yield coconuts. */
export class HarvestSystem {
  private progress = 0;
  private target: CoconutTree | null = null;
  private clickTree: CoconutTree | null = null;
  private bar: Phaser.GameObjects.Graphics;
  private fullCooldown = 0;

  constructor(
    scene: Phaser.Scene,
    private player: Player,
    private inventory: Inventory,
    private trees: CoconutTree[],
    private floating: FloatingTextManager,
  ) {
    this.bar = scene.add.graphics().setDepth(OVERLAY_DEPTH - 2);
    for (const tree of trees) {
      tree.on('pointerdown', () => this.requestClick(tree));
    }
  }

  private inRange(tree: CoconutTree): boolean {
    return Phaser.Math.Distance.Between(this.player.x, this.player.y, tree.x, tree.y) <= BALANCE.harvestRange;
  }

  private requestClick(tree: CoconutTree): void {
    if (this.inRange(tree)) this.clickTree = tree;
    else this.floating.spawn(this.player.x, this.player.y, 'Too far', '#ffffff');
  }

  private nearestReady(): CoconutTree | null {
    let best: CoconutTree | null = null;
    let bestD: number = BALANCE.harvestRange;
    for (const t of this.trees) {
      if (!t.ready) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, t.x, t.y);
      if (d <= bestD) {
        bestD = d;
        best = t;
      }
    }
    return best;
  }

  update(dt: number, wantsHarvest: boolean): void {
    this.fullCooldown = Math.max(0, this.fullCooldown - dt);
    const near = this.nearestReady();
    if (near !== this.target) {
      this.target?.highlight(false);
      this.target = near;
      this.target?.highlight(true);
      this.progress = 0;
    }

    if (this.player.isMoving) this.clickTree = null;
    const clickWanted = this.clickTree !== null && this.clickTree === this.target;
    const wants = (wantsHarvest || clickWanted) && this.target !== null && !this.player.isMoving;

    if (!wants) {
      this.progress = 0;
      this.bar.clear();
      return;
    }

    const golden = this.target?.kind === 'golden';
    if (this.inventory.isFull && !golden) {
      this.progress = 0;
      this.bar.clear();
      if (this.fullCooldown <= 0) {
        this.fullCooldown = 1.5;
        eventBus.emit(EVT.BAG_FULL);
        eventBus.emit(EVT.SOUND, 'error');
      }
      return;
    }

    this.progress += dt;
    const need = UpgradeSystem.value('harvestSpeed') * (golden ? BALANCE.goldenHarvestMult : 1);
    this.drawBar(Math.min(1, this.progress / need));
    if (this.progress >= need && this.target) this.harvest(this.target);
  }

  private harvest(tree: CoconutTree): void {
    const power = UpgradeSystem.value('harvestPower');
    this.progress = 0;
    this.clickTree = null;
    this.bar.clear();
    if (!tree.harvest()) return;
    if (tree.kind === 'golden') {
      gameState.data.golden += 1;
      gameState.data.stats.golden += 1;
      this.player.playHarvest();
      this.floating.spawn(this.player.x, this.player.y, '+1 ✨ GOLDEN', '#ffd23f');
      eventBus.emit(EVT.SOUND, 'upgrade');
      eventBus.emit(EVT.GOLDEN, gameState.data.golden);
      eventBus.emit(EVT.HARVESTED, 0);
      return;
    }
    const n = this.inventory.add(power);
    gameState.data.stats.harvested += n;
    this.player.playHarvest();
    this.floating.spawn(this.player.x, this.player.y, `+${n} 🥥`, '#ffffff');
    eventBus.emit(EVT.SOUND, 'harvest');
    eventBus.emit(EVT.HARVESTED, n);
  }

  private drawBar(ratio: number): void {
    const x = this.player.x - BAR_W / 2;
    const y = this.player.y - this.player.displayHeight - 12;
    this.bar.clear();
    this.bar.fillStyle(0x000000, 0.6).fillRoundedRect(x - 2, y - 2, BAR_W + 4, 10, 4);
    this.bar.fillStyle(0x8be04e, 1).fillRoundedRect(x, y, BAR_W * ratio, 6, 3);
  }
}
