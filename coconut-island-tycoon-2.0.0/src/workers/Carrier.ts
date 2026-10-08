import Phaser from 'phaser';
import { EVT, eventBus } from '../core/EventBus';
import { CARRIER_BALANCE } from '../data/balance';
import { Economy } from '../systems/EconomySystem';
import { Worker } from './Worker';
import type { WorkerManager } from './WorkerManager';

const CHECK_INTERVAL = 0.5;

/**
 * IDLE -> MOVE (to storage) -> WORK (load) -> CARRY (to sell stand) -> DROP (sell) -> IDLE.
 * Only useful on islands whose storage does not auto-sell.
 */
export class Carrier extends Worker {
  private carried = 0;
  private timer = Math.random() * CHECK_INTERVAL;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private manager: WorkerManager,
  ) {
    super(scene, x, y, 0xffb36b);
  }

  private goIdle(wait = CHECK_INTERVAL): void {
    this.state = 'IDLE';
    this.timer = wait;
  }

  update(dt: number): void {
    const island = this.manager.island;
    const speed = CARRIER_BALANCE.speed;
    switch (this.state) {
      case 'IDLE':
        this.timer -= dt;
        if (this.timer <= 0) {
          if (island.storage.stock > 0) this.state = 'MOVE';
          else this.goIdle();
        }
        break;

      case 'MOVE': {
        const p = island.storage.pickupPoint;
        if (this.moveToward(p.x, p.y, speed, dt)) {
          this.faceTo(island.storage.sprite.x);
          this.timer = 0;
          this.state = 'WORK';
        }
        break;
      }

      case 'WORK':
        this.timer += dt;
        if (this.timer >= 0.3) {
          this.carried = island.storage.take(CARRIER_BALANCE.capacity);
          this.setCarrying(this.carried);
          if (this.carried > 0) this.state = 'CARRY';
          else this.goIdle();
        }
        break;

      case 'CARRY': {
        const d = island.sellZone.dropPoint;
        if (this.moveToward(d.x, d.y, speed, dt)) this.state = 'DROP';
        break;
      }

      case 'DROP': {
        const gain = Economy.sellCoconuts(this.carried);
        if (gain > 0) {
          island.floating.spawn(this.x, this.y - 10, `+${gain} 💰`, '#ffe066');
          eventBus.emit(EVT.SOUND, 'coin');
        }
        this.carried = 0;
        this.setCarrying(0);
        this.sprite.setAngle(0);
        this.goIdle(0.2);
        break;
      }

      case 'FIND_TARGET':
        this.goIdle();
        break;
    }
    this.sync();
  }
}
