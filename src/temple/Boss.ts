import Phaser from 'phaser';
import { ARMOR_MULT, type TempleDef } from '../data/temple';

/**
 * Temple guardian: stationary boss that rolls boulders and drops rocks.
 * When the temple defines `armor`, phase 2 adds Stone Armor (coconuts barely hurt) which weakens coconut hits.
 */
export class Boss {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly hazards: Phaser.Physics.Arcade.Group;
  hp: number;
  readonly maxHp: number;
  defeated = false;
  onArmorUp?: () => void;
  private timer = 2.2;
  private pattern = 0;
  private flash = 0;
  private armorAnnounced = false;
  private charging = false;
  private chargeChain?: Phaser.Tweens.TweenChain;
  /** Magma boulder shown while the boss dashes out and rolls back. */
  private boulderForm?: Phaser.GameObjects.Image;
  private lastX = 0;
  private readonly originX: number;

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

  get phase2(): boolean {
    return this.hp <= this.maxHp / 2;
  }

  /** Phase-2 armor (only for temples that define it). */
  get armored(): boolean {
    return this.def.armor && this.phase2 && !this.defeated;
  }

  /** Returns the damage actually dealt. */
  hit(damage: number): number {
    if (this.defeated) return 0;
    const dmg = this.armored ? damage * ARMOR_MULT : damage;
    this.setHp(this.hp - dmg);
    this.flash = 0.09;
    return dmg;
  }

  /** Clamp to [0, maxHp]; reaching 0 defeats the boss. */
  setHp(value: number): void {
    if (this.defeated) return;
    this.hp = Math.min(this.maxHp, Math.max(0, value));
    if (this.hp === 0) this.defeat();
  }

  private defeat(): void {
    this.defeated = true;
    this.chargeChain?.stop();
    this.boulderForm?.destroy();
    this.boulderForm = undefined;
    this.hazards.clear(true, true);
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
    if (this.def.armor && this.phase2 && !this.armorAnnounced) {
      this.armorAnnounced = true;
      this.onArmorUp?.();
    }

    if (this.flash > 0) this.sprite.setTint(0xff9a9a);
    else if (this.armored) this.sprite.setTint(0x9fb4ff);
    else this.sprite.clearTint();

    this.rollBoulder();
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = (this.phase2 ? 1.5 : 2.4) / this.def.aggression;
      this.attack(playerX);
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

  /** Shake to warn, then the boss becomes a magma boulder: dash across the arena and roll back. Jump over it. */
  private charge(): void {
    this.charging = true;
    this.chargeChain = this.scene.tweens.chain({
      targets: this.sprite,
      tweens: [
        { x: this.originX + 6, duration: 90, yoyo: true, repeat: 9, onComplete: () => this.setBoulderForm(true) },
        { x: 60, duration: 1500, ease: 'Sine.easeIn' },
        { x: 60, duration: 250 },
        { x: this.originX, duration: 1400, ease: 'Sine.easeInOut' },
      ],
      onComplete: () => {
        this.setBoulderForm(false);
        this.charging = false;
      },
    });
  }

  /** Swaps the boss for a rolling magma boulder (low hitbox: a normal ~128px jump clears it) and back. */
  private setBoulderForm(on: boolean): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const h = this.sprite.height;
    if (on) {
      this.lastX = this.sprite.x;
      this.boulderForm = this.scene.add.image(this.sprite.x, this.groundY, 'ember').setOrigin(0.5, 1).setScale(2.3).setDepth(this.sprite.depth + 1);
      this.sprite.setAlpha(0);
      body.setSize(96, 56).setOffset((this.sprite.width - 96) / 2, h - 56);
    } else {
      this.boulderForm?.destroy();
      this.boulderForm = undefined;
      this.sprite.setAlpha(1);
      body.setSize(this.sprite.width, h).setOffset(0, 0);
    }
  }

  /** Keeps the boulder glued to the boss and rolling in the direction of travel. */
  private rollBoulder(): void {
    const rock = this.boulderForm;
    if (!rock) return;
    const dx = this.sprite.x - this.lastX;
    this.lastX = this.sprite.x;
    rock.setPosition(this.sprite.x, this.groundY);
    rock.angle += (dx / (rock.displayWidth / 2)) * (180 / Math.PI);
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
        if (this.defeated) return;
        const r = this.hazards.create(x, -30, this.def.dropTexture) as Phaser.Physics.Arcade.Sprite;
        r.setData('kind', 'rock');
        r.setVelocityY(360);
      });
    }
  }
}
