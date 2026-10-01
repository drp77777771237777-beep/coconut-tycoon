import Phaser from 'phaser';

export type Facing = 'down' | 'up' | 'left' | 'right';

export class Player extends Phaser.Physics.Arcade.Sprite {
  facing: Facing = 'down';
  isMoving = false;
  private shadow: Phaser.GameObjects.Ellipse;
  private walkT = 0;
  private harvestTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player_down');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(18, 12);
    body.setOffset((this.width - 18) / 2, this.height - 12);
    this.shadow = scene.add.ellipse(x, y, 28, 10, 0x000000, 0.25);
  }

  /** Velocity is set by PlayerController; the Player only applies it. */
  move(vx: number, vy: number, speed: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(vx * speed, vy * speed);
    this.isMoving = vx !== 0 || vy !== 0;
    if (this.isMoving) {
      const facing: Facing = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? 'right' : 'left') : vy > 0 ? 'down' : 'up';
      this.setFacing(facing);
    }
  }

  setFacing(f: Facing): void {
    if (f === this.facing) return;
    this.facing = f;
    this.setTexture(`player_${f}`);
  }

  playHarvest(): void {
    this.harvestTween?.stop();
    this.setScale(1, 1);
    this.harvestTween = this.scene.tweens.add({
      targets: this,
      scaleY: 0.85,
      scaleX: 1.1,
      duration: 90,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }

  /** Per-frame visuals: walk bob, shadow, depth sorting. */
  tick(dt: number): void {
    if (this.isMoving) {
      this.walkT += dt * 12;
      this.setAngle(Math.sin(this.walkT) * 4);
    } else {
      this.walkT = 0;
      this.setAngle(0);
    }
    this.shadow.setPosition(this.x, this.y - 3).setDepth(this.y - 1);
    this.setDepth(this.y);
  }

  destroy(fromScene?: boolean): void {
    this.shadow.destroy();
    super.destroy(fromScene);
  }
}
