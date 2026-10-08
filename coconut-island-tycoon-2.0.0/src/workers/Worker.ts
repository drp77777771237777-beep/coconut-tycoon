import Phaser from 'phaser';

export type WorkerState = 'IDLE' | 'FIND_TARGET' | 'MOVE' | 'WORK' | 'CARRY' | 'DROP';

/** Shared worker body: sprite, shadow, straight-line movement, depth sorting. AI lives in subclasses. */
export abstract class Worker {
  state: WorkerState = 'IDLE';
  protected sprite: Phaser.GameObjects.Sprite;
  protected shadow: Phaser.GameObjects.Ellipse;
  protected carryIcon: Phaser.GameObjects.Image;
  private bobT = Math.random() * 6;

  constructor(
    protected scene: Phaser.Scene,
    x: number,
    y: number,
    tint: number,
  ) {
    this.sprite = scene.add.sprite(x, y, 'player_down').setOrigin(0.5, 1).setTint(tint).setScale(0.9);
    this.shadow = scene.add.ellipse(x, y, 24, 9, 0x000000, 0.25);
    this.carryIcon = scene.add.image(x, y, 'coconut').setVisible(false);
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  /** Move toward a point; returns true on arrival. */
  protected moveToward(tx: number, ty: number, speed: number, dt: number): boolean {
    const dx = tx - this.sprite.x;
    const dy = ty - this.sprite.y;
    const d = Math.hypot(dx, dy);
    const step = speed * dt;
    if (d <= Math.max(step, 2)) {
      this.sprite.setPosition(tx, ty);
      return true;
    }
    this.sprite.x += (dx / d) * step;
    this.sprite.y += (dy / d) * step;
    const face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    const key = `player_${face}`;
    if (this.sprite.texture.key !== key) this.sprite.setTexture(key);
    this.bobT += dt * 12;
    this.sprite.setAngle(Math.sin(this.bobT) * 4);
    return false;
  }

  protected faceTo(tx: number): void {
    this.sprite.setTexture(tx >= this.sprite.x ? 'player_right' : 'player_left');
    this.sprite.setAngle(0);
  }

  protected setCarrying(n: number): void {
    this.carryIcon.setVisible(n > 0);
  }

  /** Per-frame visuals; subclasses call super.sync() at the end of update. */
  protected sync(): void {
    const { x, y } = this.sprite;
    this.sprite.setDepth(y);
    this.shadow.setPosition(x, y - 3).setDepth(y - 1);
    this.carryIcon.setPosition(x + 12, y - this.sprite.displayHeight - 4).setDepth(y + 1);
  }

  abstract update(dt: number): void;

  destroy(): void {
    this.sprite.destroy();
    this.shadow.destroy();
    this.carryIcon.destroy();
  }
}
