import Phaser from 'phaser';
import { EVT, eventBus } from '../core/EventBus';
import { FONT, SCENES } from '../core/GameConfig';
import { gameState } from '../core/GameState';
import { KRAKEN } from '../data/events';
import { KeyboardInput } from '../input/KeyboardInput';
import { touchInput } from '../input/TouchInput';
import { Economy } from '../systems/EconomySystem';
import { SaveSystem } from '../systems/SaveSystem';

const W = 960;
const H = 540;
const BOAT_Y = 440;

interface Tentacle {
  x: number;
  age: number;
  mark: Phaser.GameObjects.Ellipse;
  arm: Phaser.GameObjects.Rectangle;
  struck: boolean;
}

/**
 * Kraken attack at sea: dodge the tentacles for a while.
 * Survive for a coin reward; get wrecked and lose part of your coins. Either way the trip continues.
 */
export class KrakenScene extends Phaser.Scene {
  private keyboard!: KeyboardInput;
  private boat!: Phaser.GameObjects.Text;
  private hud!: Phaser.GameObjects.Text;
  private tentacles: Tentacle[] = [];
  private hearts = KRAKEN.hearts;
  private timeLeft = KRAKEN.surviveSec;
  private spawnCd = 1;
  private invuln = 0;
  private ended = false;
  private arrived = false;

  constructor() {
    super(SCENES.kraken);
  }

  create(data?: { arrived?: boolean }): void {
    this.arrived = data?.arrived === true;
    this.tentacles = [];
    this.hearts = KRAKEN.hearts;
    this.timeLeft = KRAKEN.surviveSec;
    this.spawnCd = 1;
    this.invuln = 0;
    this.ended = false;

    const cam = this.cameras.main;
    cam.setBackgroundColor(0x0a2740);
    cam.fadeIn(400);
    this.add.rectangle(W / 2, H - 40, W, 160, 0x0e3a5c).setDepth(0);
    for (let x = 40; x < W; x += 120) this.add.text(x, BOAT_Y + 34, '〰', { fontFamily: FONT, fontSize: '28px', color: '#2f6f9a' }).setOrigin(0.5);

    this.add.text(W / 2, 70, '🦑', { fontSize: '120px' }).setOrigin(0.5).setDepth(1);
    this.boat = this.add.text(W / 2, BOAT_Y, '⛵', { fontSize: '56px' }).setOrigin(0.5, 1).setDepth(10);
    this.hud = this.add.text(W / 2, 150, '', { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#ffffff', stroke: '#06324a', strokeThickness: 5 }).setOrigin(0.5).setDepth(20);
    this.add
      .text(W / 2, H - 14, '← → / A D : steer the boat · dodge the tentacles!', { fontFamily: FONT, fontSize: '14px', color: '#9cc4d8' })
      .setOrigin(0.5, 1)
      .setDepth(20);

    this.keyboard = new KeyboardInput();
    this.updateCamera();
    this.scale.on('resize', this.updateCamera, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.updateCamera, this);
      this.keyboard.destroy();
    });

    eventBus.emit(EVT.SOUND, 'boat');
    eventBus.emit(EVT.BANNER, { text: 'KRAKEN ATTACK!', sub: `Survive ${KRAKEN.surviveSec} seconds`, color: '#ff7b7b', big: true });
  }

  private updateCamera(): void {
    const cam = this.cameras.main;
    cam.setZoom(Math.min(cam.width / W, cam.height / H));
    cam.centerOn(W / 2, H / 2);
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(delta / 1000, 0.05);
    this.invuln = Math.max(0, this.invuln - dt);
    this.boat.setAlpha(this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0 ? 0.35 : 1);

    if (!this.ended) {
      const k = this.keyboard.vector;
      const v = k.x !== 0 ? k : touchInput.vector;
      const dir = v.x > 0.3 ? 1 : v.x < -0.3 ? -1 : 0;
      this.boat.x = Phaser.Math.Clamp(this.boat.x + dir * KRAKEN.boatSpeed * dt, 60, W - 60);

      this.timeLeft -= dt;
      this.spawnCd -= dt;
      if (this.spawnCd <= 0) {
        const t = 1 - Math.max(0, this.timeLeft) / KRAKEN.surviveSec;
        this.spawnCd = Phaser.Math.Linear(KRAKEN.spawnStartSec, KRAKEN.spawnEndSec, t);
        this.spawn();
      }
    }

    this.updateTentacles(dt);
    this.renderHud();
    if (!this.ended && this.timeLeft <= 0) this.finish(true);
  }

  private spawn(): void {
    const x = Phaser.Math.Clamp(this.boat.x + Phaser.Math.Between(-90, 90), 50, W - 50);
    const mark = this.add.ellipse(x, BOAT_Y - 4, KRAKEN.hitRadius * 2, 18, 0xff4d4d, 0.5).setDepth(5);
    this.tweens.add({ targets: mark, alpha: 0.15, duration: 150, yoyo: true, repeat: -1 });
    const arm = this.add.rectangle(x, BOAT_Y - 4, KRAKEN.hitRadius * 0.9, BOAT_Y + 40, 0x8a3fc7).setOrigin(0.5, 1).setStrokeStyle(4, 0x5d2490).setDepth(6).setVisible(false);
    this.tentacles.push({ x, age: 0, mark, arm, struck: false });
  }

  private updateTentacles(dt: number): void {
    for (const t of this.tentacles) {
      t.age += dt;
      if (!t.struck && t.age >= KRAKEN.warnSec) {
        t.struck = true;
        t.mark.setAlpha(0.8);
        t.arm.setVisible(true);
        eventBus.emit(EVT.SOUND, 'error');
      }
      if (t.struck && !this.ended && this.invuln <= 0 && Math.abs(this.boat.x - t.x) < KRAKEN.hitRadius) this.hurt();
    }
    this.tentacles = this.tentacles.filter((t) => {
      const alive = t.age < KRAKEN.warnSec + KRAKEN.strikeSec && !(this.ended && t.struck);
      if (!alive) {
        this.tweens.killTweensOf(t.mark);
        t.mark.destroy();
        t.arm.destroy();
      }
      return alive;
    });
  }

  private hurt(): void {
    this.hearts -= 1;
    this.invuln = 1.2;
    eventBus.emit(EVT.SOUND, 'error');
    if (this.hearts <= 0) this.finish(false);
  }

  private renderHud(): void {
    const hearts = '♥'.repeat(Math.max(0, this.hearts)) + '♡'.repeat(Math.max(0, KRAKEN.hearts - this.hearts));
    this.hud.setText(`${hearts}   ⏱ ${Math.max(0, Math.ceil(this.timeLeft))}s`);
  }

  private finish(survived: boolean): void {
    if (this.ended) return;
    this.ended = true;
    if (survived) {
      const reward = KRAKEN.reward * gameState.data.islandId;
      Economy.grant(reward);
      eventBus.emit(EVT.SOUND, 'complete');
      eventBus.emit(EVT.BANNER, { text: 'KRAKEN DRIVEN OFF!', sub: `+${reward} coins`, color: '#ffd23f', big: true });
    } else {
      const lost = Math.floor(Economy.money() * KRAKEN.penaltyRate);
      Economy.spend(lost);
      eventBus.emit(EVT.BANNER, { text: 'BOAT WRECKED!', sub: lost > 0 ? `Lost ${lost} coins` : 'The Kraken lets you go', color: '#ff7b7b', big: true });
    }
    SaveSystem.save();
    this.time.delayedCall(3000, () => {
      this.cameras.main.fadeOut(500);
      this.time.delayedCall(520, () => this.scene.start(SCENES.island, this.arrived ? { arrived: true } : undefined));
    });
  }
}
