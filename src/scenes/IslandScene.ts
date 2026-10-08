import Phaser from 'phaser';
import { EVT, EventSubs, eventBus } from '../core/EventBus';
import { SCENES, WATER_COLOR } from '../core/GameConfig';
import { gameState } from '../core/GameState';
import { KRAKEN, type GameEventId } from '../data/events';
import { getIsland } from '../data/islands';
import { Economy } from '../systems/EconomySystem';
import { TravelSystem } from '../systems/TravelSystem';
import { KeyboardInput } from '../input/KeyboardInput';
import { Inventory } from '../player/Inventory';
import { Player } from '../player/Player';
import { PlayerController } from '../player/PlayerController';
import { HarvestSystem } from '../systems/HarvestSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { FloatingTextManager } from '../ui/FloatingText';
import { clamp } from '../utils/MathUtils';
import { OVERLAY_DEPTH } from '../utils/DepthUtils';
import { WorkerManager } from '../workers/WorkerManager';
import { IslandManager } from '../world/IslandManager';
import { UPGRADES, type UpgradeId } from '../data/upgrades';

const MAX_DT = 0.05;

export class IslandScene extends Phaser.Scene {
  private player!: Player;
  private controller!: PlayerController;
  private keyboard!: KeyboardInput;
  private inventory!: Inventory;
  private island!: IslandManager;
  private harvest!: HarvestSystem;
  private workers!: WorkerManager;
  private floating!: FloatingTextManager;
  private arrow!: Phaser.GameObjects.Triangle;
  private subs = new EventSubs();
  private leaving = false;

  constructor() {
    super(SCENES.island);
  }

  create(data?: { from?: 'temple'; arrived?: boolean }): void {
    this.leaving = false;
    const def = getIsland(gameState.data.islandId);
    const cam = this.cameras.main;
    cam.setBackgroundColor(WATER_COLOR);
    cam.setBounds(0, 0, def.world.width, def.world.height);

    this.floating = new FloatingTextManager(this);
    this.inventory = new Inventory();
    this.island = new IslandManager(this, def, this.inventory, this.floating);

    const spawn = data?.from === 'temple' && def.temple ? { x: def.temple.x, y: def.temple.y + 100 } : def.spawn;
    this.player = new Player(this, spawn.x, spawn.y);
    this.keyboard = new KeyboardInput();
    this.controller = new PlayerController(this.player, this.keyboard);
    this.physics.add.collider(this.player, this.island.solids);

    this.harvest = new HarvestSystem(this, this.player, this.inventory, this.island.trees, this.floating);
    this.workers = new WorkerManager(this, this.island);

    this.arrow = this.add.triangle(0, 0, 0, 0, 28, 0, 14, 22, 0xff4d4d).setStrokeStyle(3, 0xffffff).setDepth(OVERLAY_DEPTH - 3).setVisible(false);

    cam.startFollow(this.player, true, 0.12, 0.12);
    this.updateZoom();
    this.scale.on('resize', this.updateZoom, this);

    this.subs.on(EVT.BOARD, () => this.board());
    this.subs.on(EVT.TRAVEL, (id: number) => this.travelTo(id));
    this.subs.on(EVT.GAME_EVENT, (id: GameEventId) => this.runEvent(id));
    this.subs.on(EVT.UPGRADE, (id: UpgradeId) => {
      this.floating.spawn(this.player.x, this.player.y, `UPGRADE! ${UPGRADES[id].label}`, '#9dffb0');
    });

    cam.fadeIn(500);
    SaveSystem.start();
    this.scene.launch(SCENES.ui);
    if (data?.arrived) {
      eventBus.emit(EVT.BANNER, { text: def.name.toUpperCase(), sub: 'New island, new coconuts!', big: true });
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.updateZoom, this);
      this.subs.clear();
      this.keyboard.destroy();
      SaveSystem.save();
    });
  }

  private updateZoom(): void {
    const { width, height } = this.scale;
    this.cameras.main.setZoom(clamp(Math.min(width / 1000, height / 640), 0.55, 1));
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(delta / 1000, MAX_DT);

    this.controller.update();
    const p = this.island.clamp(this.player.x, this.player.y, 14);
    if (p.x !== this.player.x || p.y !== this.player.y) this.player.setPosition(p.x, p.y);
    this.player.tick(dt);

    this.island.update(dt);
    this.island.sellZone.update(dt, this.player);
    this.island.shopZone.check(this.player.x, this.player.y);
    this.island.hireZone.check(this.player.x, this.player.y);
    this.island.dock.zone.check(this.player.x, this.player.y);
    this.island.templeZone?.check(this.player.x, this.player.y);
    if (this.controller.consumeInteract()) {
      if (this.island.templeZone?.inside) this.enterTemple();
      else this.island.dock.tryInteract();
    }

    this.harvest.update(dt, this.controller.wantsHarvest);
    this.workers.update(dt);
    this.updateArrow();
  }

  private enterTemple(): void {
    if (this.leaving) return;
    this.leaving = true;
    eventBus.emit(EVT.SOUND, 'boat');
    this.cameras.main.fadeOut(400);
    this.time.delayedCall(420, () => this.scene.start(SCENES.temple));
  }

  /** Boat: open the destination menu (the UI scene shows it). */
  private board(): void {
    if (this.leaving) return;
    eventBus.emit(EVT.SOUND, 'boat');
    eventBus.emit(EVT.TRAVEL_MENU, TravelSystem.options());
  }

  private travelTo(id: number): void {
    if (this.leaving || !TravelSystem.travel(id)) {
      if (!this.leaving) eventBus.emit(EVT.SOUND, 'error');
      return;
    }
    this.leaving = true;
    eventBus.emit(EVT.SOUND, 'boat');
    this.cameras.main.fadeOut(700);
    const kraken = Math.random() < KRAKEN.chance;
    this.time.delayedCall(720, () => (kraken ? this.scene.start(SCENES.kraken, { arrived: true }) : this.scene.restart({ arrived: true })));
  }

  /** Admin-pad events. */
  private runEvent(id: GameEventId): void {
    if (this.leaving) return;
    if (id === 'kraken') {
      this.leaving = true;
      eventBus.emit(EVT.SOUND, 'boat');
      this.cameras.main.fadeOut(700);
      this.time.delayedCall(720, () => this.scene.start(SCENES.kraken, { arrived: false }));
    } else {
      Economy.startRush();
      eventBus.emit(EVT.SOUND, 'complete');
      eventBus.emit(EVT.BANNER, { text: 'GOLDEN RUSH!', sub: 'Coconut prices x2 for 60 seconds', color: '#ffd23f', big: true });
    }
  }

  /** Points toward the sell stand while the bag is full. */
  private updateArrow(): void {
    if (!this.inventory.isFull || this.island.sellZone.inside) {
      this.arrow.setVisible(false);
      return;
    }
    const target = this.island.def.sellZone;
    const a = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
    const bob = 64 + Math.sin(this.time.now / 150) * 6;
    this.arrow
      .setVisible(true)
      .setPosition(this.player.x + Math.cos(a) * bob, this.player.y - 24 + Math.sin(a) * bob)
      .setRotation(a - Math.PI / 2);
  }
}
