import Phaser from 'phaser';
import { WORKER_BALANCE } from '../data/balance';
import type { CoconutTree } from '../world/CoconutTree';
import { Worker } from './Worker';
import type { WorkerManager } from './WorkerManager';

const SEARCH_INTERVAL = 0.5;

/**
 * IDLE -> FIND_TARGET -> MOVE -> WORK -> (FIND_TARGET | CARRY) -> DROP -> IDLE.
 * Every branch has a way back to IDLE so a worker can never freeze permanently.
 */
export class Harvester extends Worker {
  private target: CoconutTree | null = null;
  private carried = 0;
  private timer = Math.random() * SEARCH_INTERVAL;
  private stuckFor = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private manager: WorkerManager,
  ) {
    super(scene, x, y, 0x7fd0ff);
  }

  private release(): void {
    if (this.target && this.target.reservedBy === this) this.target.reservedBy = null;
    this.target = null;
  }

  private targetValid(): boolean {
    const t = this.target;
    return !!t && t.active && t.ready && t.reservedBy === this;
  }

  private goIdle(): void {
    this.release();
    this.state = 'IDLE';
    this.timer = SEARCH_INTERVAL;
  }

  update(dt: number): void {
    const speed = WORKER_BALANCE.speed;
    switch (this.state) {
      case 'IDLE':
        this.timer -= dt;
        if (this.timer <= 0) this.state = 'FIND_TARGET';
        break;

      case 'FIND_TARGET': {
        const tree = this.manager.island.findFreeTree(this.x, this.y);
        if (tree) {
          tree.reservedBy = this;
          this.target = tree;
          this.stuckFor = 0;
          this.state = 'MOVE';
        } else if (this.carried > 0) {
          this.state = 'CARRY';
        } else {
          this.goIdle();
        }
        break;
      }

      case 'MOVE': {
        if (!this.targetValid() || !this.target) {
          this.goIdle();
          break;
        }
        this.stuckFor += dt;
        const side = this.x < this.target.x ? -30 : 30;
        if (this.moveToward(this.target.x + side, this.target.y + 6, speed, dt) || this.stuckFor > 20) {
          this.faceTo(this.target.x);
          this.timer = 0;
          this.state = 'WORK';
        }
        break;
      }

      case 'WORK': {
        if (!this.targetValid() || !this.target) {
          this.goIdle();
          break;
        }
        this.timer += dt;
        if (this.timer >= WORKER_BALANCE.harvestSec) {
          const tree = this.target;
          tree.harvest();
          this.target = null;
          this.carried += WORKER_BALANCE.yield;
          this.setCarrying(this.carried);
          this.state = this.carried >= WORKER_BALANCE.capacity ? 'CARRY' : 'FIND_TARGET';
        }
        break;
      }

      case 'CARRY': {
        const drop = this.manager.island.storage.dropPoint;
        if (this.moveToward(drop.x, drop.y, speed, dt)) this.state = 'DROP';
        break;
      }

      case 'DROP':
        this.manager.island.storage.deposit(this.carried);
        this.carried = 0;
        this.setCarrying(0);
        this.sprite.setAngle(0);
        this.goIdle();
        this.timer = 0.2;
        break;
    }
    this.sync();
  }

  destroy(): void {
    this.release();
    super.destroy();
  }
}
