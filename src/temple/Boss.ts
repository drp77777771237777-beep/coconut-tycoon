import Phaser from 'phaser';
import { ABILITY_TUNING, type TempleDef } from '../data/temple';

/**
 * Temple guardian: stationary boss that rolls boulders and drops rocks.
 * When the temple defines `armor`, phase 2 adds Stone Armor (coconuts barely hurt) which relic abilities bypass.
 */
export class Boss {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly hazards: Phaser.Physics.Arcade.Group;
  hp: number;
  readonly maxHp: number;
  defeated = false;
  /** Seconds of stun left (attacks paused, armor off, extra damage). */
  stunLeft = 0;
  onArmorUp?: () => void;
  private timer = 2.2;
  private pattern = 0;
  private flash = 0;
  private armorAnnounced = false;
  private charging = false;
  private chargeChain?: Phaser.Tweens.TweenChain;
  private readonly originX: number;
  private stars?: Phaser.GameObjects.Text;

  constructor(
    private scene: Phaser.Scene,
    x: number,
    private groundY: number,
    private def: TempleDef,
  ) {
    this.hp = def.bossHp;
    this.maxHp = def.bossHp;
    this.originX = x;
    this.sprite = scene.physics.add.sprite(x, groundY, def.bossTexture).setOrigin(0.5, 1);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false).setImmovable(true);
    this.hazards = scene.physics.add.group({ allowGravity: true });
    scene.tweens.add({ targets: this.sprite, scaleY: 1.03, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  get stunned(): boolean {
    return this.stunLeft > 0;
  }

  get phase2(): boolean {
    return this.hp <= this.maxHp / 2;
  }

  /** Phase-2 armor (only for temples that define it), removed while stunned. */
  get armored(): boolean {
    return this.def.armor && this.phase2 && !this.stunned && !this.defeated;
  }

  /** `pierce` ignores armor (Sun Beam). Returns the damage actually dealt. */
  hit(damage: number, pierce = false): number {
    if (this.defeated) return 0;
    let dmg = damage;
    if (this.armored && !pierce) dmg *= ABILITY_TUNING.armorMult;
    if (this.stunned) dmg *= ABILITY_TUNING.stunMult;
    this.hp = Math.max(0, this.hp - dmg);
    this.flash = 0.09;
    if (this.hp === 0) this.defeat();
    return dmg;
  }

  stun(seconds: number): void {
    if (this.defeated) return;
    this.stunLeft = seconds;
    if (this.charging) this.abortCharge();
    this.stars?.destroy();
    this.stars = this.scene.add
      .text(this.sprite.x, this.sprite.y - this.sprite.displayHeight - 8, '⭐ ⭐ ⭐', { fontSize: '26px' })
      .setOrigin(0.5, 1)
      .setDepth(20);
    this.scene.tweens.add({ targets: this.stars, angle: 8, duration: 220, yoyo: true, repeat: -1 });
  }

  private defeat(): void {
    this.defeated = true;
    this.chargeChain?.stop();
    this.hazards.clear(true, true);
    this.stars?.destroy();
    this.sprite.clearTint();
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      angle: 8,
      y: this.sprite.y + 20,
      duration: 1100,
      ease: 'Quad.easeIn',
    });
  }

  update(dt: number, playerX: number): void {
    if (this.defeated) return;
    this.flash = Math.max(0, this.flash - dt);
    if (this.stunned) {
      this.stunLeft = Math.max(0, this.stunLeft - dt);
      if (!this.stunned) {
        this.stars?.destroy();
        this.stars = undefined;
      }
    }
    if (this.def.armor && this.phase2 && !this.armorAnnounced) {
      this.armorAnnounced = true;
      this.onArmorUp?.();
    }

    if (this.flash > 0) this.sprite.setTint(0xff9a9a);
    else if (this.stunned) this.sprite.setTint(0xfff3a0);
    else if (this.armored) this.sprite.setTint(0x9fb4ff);
    else this.sprite.clearTint();

    if (!this.stunned) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.timer = (this.phase2 ? 1.5 : 2.4) / this.def.aggression;
        this.attack(playerX);
      }
    }
    for (const obj of this.hazards.getChildren()) {
      const h = obj as Phaser.Physics.Arcade.Sprite;
      if (h.getData('kind') === 'boulder') {
        h.angle -= dt * 420;
        if (h.x < -60) h.destroy();
      } else if ((h.body as Phaser.Physics.Arcade.Body).blocked.down) {
        h.destroy();
      }
    }
  }

  /** Crab King: shake to warn, dash sideways across the arena, then scuttle back. Jump over it. */
  private charge(): void {
    this.charging = true;
    this.chargeChain = this.scene.tweens.chain({
      targets: this.sprite,
      tweens: [
        { x: this.originX + 6, duration: 70, yoyo: true, repeat: 7 },
        { x: 60, duration: 1100, ease: 'Quad.easeIn' },
        { x: 60, duration: 250 },
        { x: this.originX, duration: 1400, ease: 'Sine.easeInOut' },
      ],
      onComplete: () => {
        this.charging = false;
      },
    });
  }

  private abortCharge(): void {
    this.chargeChain?.stop();
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.originX,
      duration: 600,
      onComplete: () => {
        this.charging = false;
      },
    });
  }

  private attack(playerX: number): void {
    if (this.charging) return;
    this.pattern += 1;
    if (this.def.charge && this.pattern % 3 === 0) {
      this.charge();
      return;
    }
    const useBoulder = this.pattern % 2 === 1;
    if (useBoulder || this.phase2) this.boulder();
    if (!useBoulder || this.phase2) this.rocks(playerX);
  }

  private boulder(): void {
    const b = this.hazards.create(this.sprite.x - 70, this.groundY - 22, this.def.rollTexture) as Phaser.Physics.Arcade.Sprite;
    b.setData('kind', 'boulder');
    (b.body as Phaser.Physics.Arcade.Body).setCircle(20, 2, 2);
    b.setVelocityX(-(this.phase2 ? 290 : 240) * this.def.aggression);
  }

  /** Warning marker on the floor, then a rock falls on that spot. */
  private rocks(playerX: number): void {
    const count = (this.phase2 ? 3 : 2) + this.def.rockBonus;
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Clamp(playerX + (i === 0 ? 0 : Phaser.Math.Between(-170, 170)), 40, 920);
      const mark = this.scene.add.ellipse(x, this.groundY - 4, 46, 12, 0xff4d4d, 0.55).setDepth(5);
      this.scene.tweens.add({ targets: mark, alpha: 0.15, duration: 160, yoyo: true, repeat: 2 });
      this.scene.time.delayedCall(800 + i * 150, () => {
        mark.destroy();
        if (this.defeated || this.stunned) return;
        const r = this.hazards.create(x, -30, this.def.dropTexture) as Phaser.Physics.Arcade.Sprite;
        r.setData('kind', 'rock');
        r.setVelocityY(360);
      });
    }
  }
}
