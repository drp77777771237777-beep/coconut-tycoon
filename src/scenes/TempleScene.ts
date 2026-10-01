import Phaser from 'phaser';
import { EVT, eventBus } from '../core/EventBus';
import { FONT, SCENES } from '../core/GameConfig';
import { COLLECTIBLES } from '../data/collectibles';
import { gameState } from '../core/GameState';
import { ABILITIES, ABILITY_TUNING, ARENA, BOSS, COURSE, getTemple, type RelicAbility, type TempleDef } from '../data/temple';
import { KeyboardInput } from '../input/KeyboardInput';
import { touchInput } from '../input/TouchInput';
import { CollectionSystem } from '../systems/CollectionSystem';
import { Economy } from '../systems/EconomySystem';
import { SaveSystem } from '../systems/SaveSystem';
import { Boss } from '../temple/Boss';
import { ScreenPin } from '../temple/ScreenPin';

type Mode = 'course' | 'boss';

const RUN = 200;
const JUMP = -480;
const GRAVITY = 900;

/**
 * Optional side content per island: a side-view jump course (bonus gems) and that island's guardian boss.
 * Beating the guardian grants the island relic, which later bosses can use as abilities.
 * Independent from the economy loop; rewards are collectibles with a small permanent sell bonus.
 */
export class TempleScene extends Phaser.Scene {
  private mode: Mode = 'course';
  private keyboard!: KeyboardInput;
  private pin!: ScreenPin;
  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private prevJump = false;
  private leaving = false;
  private lastCheckpoint = COURSE.start;
  private temple!: TempleDef;
  private gemSprites: Phaser.GameObjects.Image[] = [];
  private gemsFound = 0;
  private gemText?: Phaser.GameObjects.Text;
  // boss mode
  private boss?: Boss;
  private shots!: Phaser.Physics.Arcade.Group;
  private hearts = BOSS.playerHearts;
  private heartText?: Phaser.GameObjects.Text;
  private bossBar?: Phaser.GameObjects.Rectangle;
  private invuln = 0;
  private throwCd = 0;
  private ended = false;
  private won = false;
  private cooldowns: Record<string, number> = {};
  private shield = 0;
  private shieldRing?: Phaser.GameObjects.Ellipse;
  private abilityBtns: { def: RelicAbility; bg: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }[] = [];

  constructor() {
    super(SCENES.temple);
  }

  create(data?: { mode?: Mode }): void {
    this.mode = data?.mode ?? 'course';
    this.leaving = false;
    this.ended = false;
    this.won = false;
    this.cooldowns = {};
    this.shield = 0;
    this.abilityBtns = [];
    this.prevJump = false;
    this.hearts = BOSS.playerHearts;
    this.invuln = 0;
    this.throwCd = 0;
    this.temple = getTemple(gameState.data.islandId);
    this.gemSprites = [];
    this.gemsFound = 0;
    this.lastCheckpoint = COURSE.start;

    this.physics.world.gravity.y = GRAVITY;
    this.cameras.main.setBackgroundColor(this.temple.theme.bg);
    this.cameras.main.fadeIn(400);
    this.keyboard = new KeyboardInput();
    this.pin = new ScreenPin(this);
    this.platforms = this.physics.add.staticGroup();

    if (this.mode === 'course') this.buildCourse();
    else this.buildArena();
    this.buildUi();

    this.updateCamera();
    this.scale.on('resize', this.updateCamera, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.updateCamera, this);
      this.keyboard.destroy();
    });
    this.input.keyboard?.on('keydown-ESC', () => this.leave());
  }

  // ---------------------------------------------------------------- building

  private addPlatform(x: number, y: number, w: number, h = 16): void {
    const p = this.platforms.create(x, y + h / 2, 'pixel') as Phaser.Physics.Arcade.Sprite;
    p.setTint(this.temple.theme.platform).setDisplaySize(w, h);
    (p.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    this.add.rectangle(x, y + 2, w, 4, this.temple.theme.platformTop).setDepth(2);
    this.add.rectangle(x, y + h / 2 + 5, w, h - 6, this.temple.theme.platform).setAlpha(0.7).setDepth(1);
  }

  private makePlayer(x: number, y: number): void {
    this.player = this.physics.add.sprite(x, y, 'player_right').setOrigin(0.5, 1).setDepth(10);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(18, 40).setOffset(7, 8);
    this.player.setCollideWorldBounds(this.mode === 'boss');
    this.physics.add.collider(this.player, this.platforms);
  }

  private decorate(width: number, height: number): void {
    const g = this.add.graphics().setScrollFactor(0.4).setDepth(-10);
    g.fillStyle(this.temple.theme.pillarA, 1);
    for (let x = 0; x < width; x += 260) g.fillRect(x, 80, 46, height);
    g.fillStyle(this.temple.theme.pillarB, 1);
    for (let x = 130; x < width; x += 260) g.fillRect(x, 140, 30, height);
  }

  private buildCourse(): void {
    const { width, height } = COURSE;
    this.physics.world.setBounds(0, -200, width, height + 600);
    this.decorate(width, height);
    COURSE.platforms.forEach((p) => this.addPlatform(p.x, p.y, p.w));

    COURSE.gems.forEach((g) => {
      const s = this.add.image(g.x, g.y, 'relic').setTint(0x7fe9ff).setDepth(5);
      this.tweens.add({ targets: s, y: g.y - 8, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.gemSprites.push(s);
    });

    this.add.text(COURSE.start.x + 20, 440, this.temple.bossName.toUpperCase() + ' TEMPLE', { fontFamily: FONT, fontSize: '18px', color: '#c9a0ff', align: 'center' }).setOrigin(0, 1);
    this.add.image(COURSE.door.x, COURSE.door.y, 'door').setOrigin(0.5, 1).setDepth(3);
    this.add.text(COURSE.door.x, COURSE.door.y - 104, "Guardian's\nChamber", { fontFamily: FONT, fontSize: '14px', color: '#ffffff', align: 'center' }).setOrigin(0.5, 1);

    this.makePlayer(COURSE.start.x, COURSE.start.y);
    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  private buildArena(): void {
    const { width, height, groundY } = ARENA;
    this.physics.world.setBounds(0, 0, width, height);
    this.decorate(width, height);
    this.addPlatform(width / 2, groundY, width, 70);
    this.makePlayer(ARENA.start.x, ARENA.start.y);

    this.boss = new Boss(this, 820, groundY, this.temple);
    this.shots = this.physics.add.group({ allowGravity: false });
    this.boss.onArmorUp = () =>
      eventBus.emit(EVT.BANNER, { text: this.temple.armorName, sub: 'Coconuts barely scratch it: use ☀️ Sun Beam or ⭐ Star Stun', color: '#9fb4ff' });
    this.shieldRing = this.add.ellipse(0, 0, 60, 80, 0x9fd3ff, 0.25).setStrokeStyle(3, 0xffffff, 0.8).setDepth(11).setVisible(false);
    this.physics.add.collider(this.boss.hazards, this.platforms);
    this.physics.add.overlap(this.player, this.boss.hazards, () => this.hurt());
    this.physics.add.overlap(this.player, this.boss.sprite, () => this.hurt());
    this.physics.add.overlap(this.shots, this.boss.sprite, (a, b) => {
      const shot = (a === this.boss?.sprite ? b : a) as Phaser.GameObjects.GameObject;
      if (!shot.active) return;
      shot.destroy();
      this.boss?.hit(1);
      eventBus.emit(EVT.SOUND, 'harvest');
      if (this.boss?.defeated) this.win();
    });
  }

  private buildUi(): void {
    const style = { fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#ffffff', stroke: '#06324a', strokeThickness: 5 };
    const exit = this.add
      .text(0, 0, '⬅ EXIT', { ...style, backgroundColor: '#0b3b55', padding: { x: 12, y: 8 } })
      .setOrigin(0.5)
      .setDepth(100)
      .setInteractive({ useHandCursor: true });
    exit.on('pointerdown', () => this.leave());
    this.pin.add(exit, (w) => ({ x: w / 2, y: 30 }));

    const help =
      this.mode === 'course'
        ? '← → move · W / ↑ / SPACE jump · ESC exit'
        : '← → move · W / ↑ jump · SPACE throw coconut · 1 / 2 / 3 relic powers';
    const info = this.add.text(0, 0, help, { ...style, fontSize: '14px', strokeThickness: 4 }).setOrigin(0.5, 1).setDepth(100);
    this.pin.add(info, (w, h) => ({ x: w / 2, y: h - 10 }));

    if (this.mode === 'course') {
      this.gemText = this.add.text(0, 0, '', { ...style, fontSize: '20px' }).setOrigin(0.5).setDepth(100);
      this.pin.add(this.gemText, (w) => ({ x: w / 2, y: 68 }));
      this.renderGems();
    } else {
      this.heartText = this.add.text(0, 0, '', { ...style, fontSize: '24px', color: '#ff6b6b' }).setOrigin(0.5).setDepth(100);
      this.pin.add(this.heartText, (w) => ({ x: w / 2, y: 68 }));
      const back = this.add.rectangle(0, 0, 320, 14, 0x000000, 0.6).setDepth(100);
      this.pin.add(back, (w) => ({ x: w / 2, y: 100 }));
      this.bossBar = this.add.rectangle(0, 0, 316, 10, 0xe8453c).setOrigin(0, 0.5).setDepth(101);
      this.pin.add(this.bossBar, (w) => ({ x: w / 2 - 158, y: 100 }));
      this.renderHearts();
      this.buildAbilityButtons(style);
    }
  }

  /** Relic abilities: keys 1/2/3 on desktop, tap on mobile. Locked until the relic is collected. */
  private buildAbilityButtons(style: Phaser.Types.GameObjects.Text.TextStyle): void {
    ABILITIES.forEach((def, i) => {
      const owned = CollectionSystem.has(def.id);
      const bg = this.add.rectangle(0, 0, 64, 64, owned ? 0x1f5f86 : 0x3a3a46, 0.9).setStrokeStyle(3, 0xffffff, owned ? 0.8 : 0.25).setDepth(100);
      const icon = this.add.text(0, 0, owned ? def.icon : '🔒', { fontSize: '30px' }).setOrigin(0.5).setDepth(101);
      const label = this.add.text(0, 0, '', { ...style, fontSize: '13px', strokeThickness: 3 }).setOrigin(0.5, 0).setDepth(101);
      const dx = (i - 1) * 76;
      this.pin.add(bg, (w, h) => ({ x: w / 2 + dx, y: h - 100 }));
      this.pin.add(icon, (w, h) => ({ x: w / 2 + dx, y: h - 100 }));
      this.pin.add(label, (w, h) => ({ x: w / 2 + dx, y: h - 64 }));
      if (owned) {
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => this.useAbility(def));
      } else {
        label.setText('relic?');
      }
      this.abilityBtns.push({ def, bg, label });
    });
  }

  private updateCamera(): void {
    const cam = this.cameras.main;
    if (this.mode === 'course') {
      cam.setZoom(Phaser.Math.Clamp(cam.height / 560, 0.6, 1.4));
    } else {
      cam.setZoom(Phaser.Math.Clamp(Math.min(cam.width / ARENA.width, cam.height / ARENA.height), 0.5, 1.6));
      cam.centerOn(ARENA.width / 2, ARENA.height / 2);
    }
    this.pin.layout();
  }

  // ---------------------------------------------------------------- loop

  update(_time: number, delta: number): void {
    if (this.leaving) return;
    const dt = Math.min(delta / 1000, 0.05);
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    const k = this.keyboard.vector;
    const t = touchInput.vector;
    const v = k.x !== 0 || k.y !== 0 ? k : t;
    const dir = v.x > 0.3 ? 1 : v.x < -0.3 ? -1 : 0;
    let jump = v.y < -0.3;
    let fire = false;
    if (this.mode === 'course') jump = jump || this.keyboard.action || touchInput.actionHeld;
    else fire = this.keyboard.action || touchInput.actionHeld;

    if (!this.ended) {
      body.setVelocityX(dir * RUN);
      if (dir !== 0) this.player.setTexture(dir > 0 ? 'player_right' : 'player_left');
      const grounded = body.blocked.down || body.touching.down;
      if (jump && !this.prevJump && grounded) {
        body.setVelocityY(JUMP);
        eventBus.emit(EVT.SOUND, 'click');
      }
      if (!jump && body.velocity.y < -220) body.setVelocityY(-220);
    } else {
      body.setVelocityX(0);
    }
    this.prevJump = jump;

    if (this.mode === 'course') this.updateCourse();
    else this.updateBoss(dt, fire);
  }

  private updateCourse(): void {
    if (this.player.y > COURSE.pitY) {
      this.player.setPosition(this.lastCheckpoint.x, this.lastCheckpoint.y);
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      eventBus.emit(EVT.TOAST, 'Careful! Back to the checkpoint');
      eventBus.emit(EVT.SOUND, 'error');
    }
    for (const cp of COURSE.checkpoints) {
      if (this.player.x >= cp.x && cp.x > this.lastCheckpoint.x) {
        this.lastCheckpoint = cp;
        eventBus.emit(EVT.TOAST, 'Checkpoint!');
      }
    }
    for (const g of this.gemSprites) {
      if (!g.active || Phaser.Math.Distance.Between(g.x, g.y, this.player.x, this.player.y - 22) > 30) continue;
      g.destroy();
      this.gemsFound += 1;
      Economy.grant(COURSE.gemValue);
      eventBus.emit(EVT.TOAST, `Gem! +${COURSE.gemValue} coins`);
      eventBus.emit(EVT.SOUND, 'coin');
      this.renderGems();
    }
    if (Math.abs(this.player.x - COURSE.door.x) < 28 && Math.abs(this.player.y - COURSE.door.y) < 10) {
      this.scene.restart({ mode: 'boss' as Mode });
    }
  }

  private updateBoss(dt: number, fire: boolean): void {
    if (!this.boss) return;
    this.invuln = Math.max(0, this.invuln - dt);
    this.throwCd = Math.max(0, this.throwCd - dt);
    this.player.setAlpha(this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0 ? 0.35 : 1);

    if (fire && this.throwCd <= 0 && !this.ended) {
      this.throwCd = BOSS.throwCooldown;
      const facingRight = this.player.texture.key === 'player_right';
      const s = this.shots.create(this.player.x + (facingRight ? 18 : -18), this.player.y - 26, 'coconut') as Phaser.Physics.Arcade.Sprite;
      s.setVelocityX(facingRight ? 460 : -460);
      this.time.delayedCall(1500, () => s.destroy());
      eventBus.emit(EVT.SOUND, 'sell');
    }

    this.updateAbilities(dt);
    this.boss.update(dt, this.player.x);
    this.bossBar?.setDisplaySize((316 * this.boss.hp) / this.boss.maxHp / this.pin.zoom, 10 / this.pin.zoom);
  }

  private updateAbilities(dt: number): void {
    this.shield = Math.max(0, this.shield - dt);
    this.shieldRing?.setVisible(this.shield > 0).setPosition(this.player.x, this.player.y - 22);
    for (const { def, bg, label } of this.abilityBtns) {
      if (!CollectionSystem.has(def.id)) continue;
      const cd = Math.max(0, (this.cooldowns[def.id] ?? 0) - dt);
      this.cooldowns[def.id] = cd;
      label.setText(cd > 0 ? cd.toFixed(0) + 's' : def.key.replace('Digit', '[') + ']');
      bg.setFillStyle(cd > 0 ? 0x3a4b55 : 0x1f7a34, 0.9);
      if (this.keyboard.consumePress(def.key)) this.useAbility(def);
    }
  }

  private useAbility(def: RelicAbility): void {
    const boss = this.boss;
    if (!boss || this.ended || !CollectionSystem.has(def.id) || (this.cooldowns[def.id] ?? 0) > 0) return;
    this.cooldowns[def.id] = def.cooldown;
    eventBus.emit(EVT.SOUND, 'upgrade');
    if (def.id === 'relic_sun') {
      const facingRight = this.player.texture.key === 'player_right';
      const y = this.player.y - 26;
      const len = 900;
      const beam = this.add.rectangle(this.player.x + (facingRight ? len / 2 : -len / 2), y, len, 28, 0xffd23f, 0.85).setDepth(12);
      this.tweens.add({ targets: beam, alpha: 0, scaleY: 0.2, duration: 380, onComplete: () => beam.destroy() });
      const inLine = facingRight ? boss.sprite.x > this.player.x : boss.sprite.x < this.player.x;
      if (inLine) {
        boss.hit(ABILITY_TUNING.sunDamage, true);
        if (boss.defeated) this.win();
      }
    } else if (def.id === 'relic_moon') {
      this.shield = ABILITY_TUNING.shieldSec;
    } else if (def.id === 'relic_star') {
      boss.stun(ABILITY_TUNING.stunSec);
    }
  }

  // ---------------------------------------------------------------- outcomes

  private hurt(): void {
    if (this.invuln > 0 || this.ended || this.shield > 0) return;
    this.hearts -= 1;
    this.invuln = BOSS.contactDamageCooldown;
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(-160, -260);
    eventBus.emit(EVT.SOUND, 'error');
    this.renderHearts();
    if (this.hearts <= 0) {
      this.ended = true;
      eventBus.emit(EVT.BANNER, { text: 'DEFEATED', sub: 'Try again!', color: '#ff7b7b' });
      this.time.delayedCall(1400, () => this.scene.restart({ mode: 'boss' as Mode }));
    }
  }

  private win(): void {
    if (this.won) return;
    this.won = true;
    this.ended = true;
    const first = CollectionSystem.collect(this.temple.relicId);
    if (first) Economy.grant(this.temple.reward);
    const relic = COLLECTIBLES.find((c) => c.id === this.temple.relicId);
    eventBus.emit(EVT.BANNER, {
      text: `${this.temple.bossName.toUpperCase()} DEFEATED!`,
      sub: first ? `+${this.temple.reward} coins · ${relic?.icon ?? ''} ${relic?.name ?? ''}` : 'Relic already collected',
      big: true,
      color: '#ffd23f',
    });
    this.time.delayedCall(3200, () => this.leave());
  }

  private leave(): void {
    if (this.leaving) return;
    this.leaving = true;
    SaveSystem.save();
    this.cameras.main.fadeOut(400);
    this.time.delayedCall(420, () => this.scene.start(SCENES.island, { from: 'temple' }));
  }

  private renderGems(): void {
    this.gemText?.setText(`✦ Gems ${this.gemsFound} / ${COURSE.gems.length}`);
  }

  private renderHearts(): void {
    this.heartText?.setText('♥'.repeat(Math.max(0, this.hearts)) + '♡'.repeat(Math.max(0, BOSS.playerHearts - this.hearts)));
  }
}
