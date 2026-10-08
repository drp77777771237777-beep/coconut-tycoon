import Phaser from 'phaser';

const DEADZONE = 0.25;
const RADIUS = 60;

/** Shared state read by PlayerController; written by the UI scene's joystick / action button. */
class TouchInputState {
  vector = { x: 0, y: 0 };
  /** Mobile auto-harvest toggle. */
  autoHarvest = false;
  /** Action button currently held. */
  actionHeld = false;
  /** One-shot tap on the action button (dock / interactions). */
  actionTap = false;

  reset(): void {
    this.vector = { x: 0, y: 0 };
    this.actionHeld = false;
    this.actionTap = false;
  }

  consumeTap(): boolean {
    const t = this.actionTap;
    this.actionTap = false;
    return t;
  }
}

export const touchInput = new TouchInputState();

/** Floating virtual joystick: touch the left half of the screen. Snaps to 8 directions. */
export class TouchJoystick {
  private pointerId = -1;
  private originX = 0;
  private originY = 0;
  private gfx: Phaser.GameObjects.Graphics;

  constructor(private scene: Phaser.Scene) {
    this.gfx = scene.add.graphics().setDepth(900).setScrollFactor(0);
    scene.input.addPointer(2);
    scene.input.on('pointerdown', this.onDown, this);
    scene.input.on('pointermove', this.onMove, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.input.on('pointerupoutside', this.onUp, this);
    scene.game.events.on(Phaser.Core.Events.BLUR, this.release, this);
    scene.game.events.on(Phaser.Core.Events.HIDDEN, this.release, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (!p.wasTouch || this.pointerId !== -1) return;
    if (p.x > this.scene.scale.width * 0.5) return;
    if (this.scene.input.hitTestPointer(p).length > 0) return;
    this.pointerId = p.id;
    this.originX = p.x;
    this.originY = p.y;
    this.draw(p.x, p.y);
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (p.id !== this.pointerId) return;
    const dx = p.x - this.originX;
    const dy = p.y - this.originY;
    const len = Math.hypot(dx, dy);
    const mag = Math.min(1, len / RADIUS);
    if (mag < DEADZONE) {
      touchInput.vector = { x: 0, y: 0 };
    } else {
      const step = Math.PI / 4;
      const a = Math.round(Math.atan2(dy, dx) / step) * step;
      touchInput.vector = { x: Math.cos(a), y: Math.sin(a) };
    }
    const k = len > RADIUS ? RADIUS / len : 1;
    this.draw(this.originX + dx * k, this.originY + dy * k);
  }

  private onUp(p: Phaser.Input.Pointer): void {
    if (p.id === this.pointerId) this.release();
  }

  private release(): void {
    this.pointerId = -1;
    touchInput.vector = { x: 0, y: 0 };
    this.gfx.clear();
  }

  private draw(knobX: number, knobY: number): void {
    this.gfx.clear();
    this.gfx.fillStyle(0xffffff, 0.18).fillCircle(this.originX, this.originY, RADIUS);
    this.gfx.lineStyle(3, 0xffffff, 0.4).strokeCircle(this.originX, this.originY, RADIUS);
    this.gfx.fillStyle(0xffffff, 0.5).fillCircle(knobX, knobY, 26);
  }

  private destroy(): void {
    this.scene.input.off('pointerdown', this.onDown, this);
    this.scene.input.off('pointermove', this.onMove, this);
    this.scene.input.off('pointerup', this.onUp, this);
    this.scene.input.off('pointerupoutside', this.onUp, this);
    this.scene.game.events.off(Phaser.Core.Events.BLUR, this.release, this);
    this.scene.game.events.off(Phaser.Core.Events.HIDDEN, this.release, this);
    touchInput.reset();
  }
}
