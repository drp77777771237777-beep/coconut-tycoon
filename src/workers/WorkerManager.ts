import Phaser from 'phaser';
import { EVT, eventBus } from '../core/EventBus';
import { gameState } from '../core/GameState';
import type { IslandManager } from '../world/IslandManager';
import { Carrier } from './Carrier';
import { Harvester } from './Harvester';
import type { Worker } from './Worker';

export class WorkerManager {
  private harvesters: Worker[] = [];
  private carriers: Worker[] = [];

  constructor(
    private scene: Phaser.Scene,
    readonly island: IslandManager,
  ) {
    this.sync(false);
    eventBus.on(EVT.WORKER, this.onHire, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      eventBus.off(EVT.WORKER, this.onHire, this);
      [...this.harvesters, ...this.carriers].forEach((w) => w.destroy());
      this.harvesters = [];
      this.carriers = [];
    });
  }

  private onHire(): void {
    this.sync(true);
  }

  /** Make the number of live workers match saved state. */
  private sync(announce: boolean): void {
    const spawn = this.island.def.hire;
    while (this.harvesters.length < gameState.data.workers) {
      this.harvesters.push(new Harvester(this.scene, spawn.x - 20 + this.harvesters.length * 12, spawn.y + 50, this));
      if (announce) eventBus.emit(EVT.SOUND, 'worker');
    }
    while (this.carriers.length < gameState.data.carriers) {
      this.carriers.push(new Carrier(this.scene, spawn.x + 20 - this.carriers.length * 12, spawn.y + 62, this));
      if (announce) eventBus.emit(EVT.SOUND, 'worker');
    }
  }

  update(dt: number): void {
    for (const w of this.harvesters) w.update(dt);
    for (const w of this.carriers) w.update(dt);
  }
}
