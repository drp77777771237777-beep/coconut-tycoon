import Phaser from 'phaser';
import { EVT, EventSubs, eventBus } from '../core/EventBus';
import { FONT, SCENES } from '../core/GameConfig';
import { gameState } from '../core/GameState';
import { touchInput, TouchJoystick } from '../input/TouchInput';
import { COLLECTIBLES } from '../data/collectibles';
import type { TravelOption } from '../systems/TravelSystem';
import { Economy } from '../systems/EconomySystem';
import { AdminPanel } from '../ui/AdminPanel';
import { HUD } from '../ui/HUD';
import { UpgradePanel } from '../ui/UpgradePanel';
import { clamp } from '../utils/MathUtils';

interface BannerArgs {
  text: string;
  sub?: string;
  big?: boolean;
  color?: string;
}

/** Screen-space UI, kept separate from the world scene. Talks to the world only through the EventBus. */
export class UIScene extends Phaser.Scene {
  private hud!: HUD;
  private admin!: AdminPanel;
  private panel!: UpgradePanel;
  private banner!: Phaser.GameObjects.Text;
  private bannerSub!: Phaser.GameObjects.Text;
  private toast!: Phaser.GameObjects.Text;
  private soundBtn!: Phaser.GameObjects.Text;
  private actionBtn?: Phaser.GameObjects.Container;
  private autoBtn?: Phaser.GameObjects.Container;
  private travel!: Phaser.GameObjects.Container;
  private collectBtn!: Phaser.GameObjects.Text;
  private collection!: Phaser.GameObjects.Container;
  private subs = new EventSubs();
  private toastTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super(SCENES.ui);
  }

  create(): void {
    this.hud = new HUD(this);
    this.admin = new AdminPanel(this.game);
    this.panel = new UpgradePanel(this, () => this.layout());

    const textStyle = { fontFamily: FONT, fontStyle: 'bold', color: '#ffffff', stroke: '#06324a', strokeThickness: 8, align: 'center' };
    this.banner = this.add.text(0, 0, '', { ...textStyle, fontSize: '48px' }).setOrigin(0.5).setDepth(200).setAlpha(0);
    this.bannerSub = this.add.text(0, 0, '', { ...textStyle, fontSize: '20px', strokeThickness: 5 }).setOrigin(0.5).setDepth(200).setAlpha(0);
    this.toast = this.add.text(0, 0, '', { ...textStyle, fontSize: '18px', strokeThickness: 5 }).setOrigin(0.5).setDepth(200).setAlpha(0);

    this.soundBtn = this.add
      .text(0, 0, '', { fontFamily: FONT, fontSize: '26px' })
      .setOrigin(0, 1)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });
    this.soundBtn.on('pointerdown', () => {
      gameState.data.settings.sound = !gameState.data.settings.sound;
      this.renderSound();
      eventBus.emit(EVT.SOUND, 'click');
    });
    this.renderSound();

    this.collectBtn = this.add.text(0, 0, '📜', { fontFamily: FONT, fontSize: '26px' }).setOrigin(0, 1).setDepth(20).setInteractive({ useHandCursor: true });
    this.collectBtn.on('pointerdown', () => this.toggleCollection());
    this.buildTravel();
    this.buildCollection();
    if (this.sys.game.device.input.touch) this.buildTouchControls();

    new TouchJoystick(this);

    this.subs.on(EVT.BANNER, (a: BannerArgs) => this.showBanner(a));
    this.subs.on(EVT.TOAST, (t: string) => this.showToast(t));
    this.subs.on(EVT.BAG_FULL, () => this.showBanner({ text: 'BAG FULL', sub: 'Head to the SELL stand', color: '#ff7b7b' }));
    this.subs.on(EVT.COLLECTED, (name: string) => this.showBanner({ text: 'COLLECTED!', sub: name, color: '#ffd23f' }));
    this.subs.on(EVT.TRAVEL_MENU, (opts: TravelOption[]) => this.showTravel(opts));

    this.scale.on('resize', this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.layout, this);
      this.subs.clear();
      this.hud.destroy();
      this.admin.destroy();
      this.panel.destroy();
    });
    this.layout();
  }

  update(_time: number, delta: number): void {
    this.hud.update(delta / 1000);
  }

  private renderSound(): void {
    this.soundBtn.setText(gameState.data.settings.sound ? '🔊' : '🔇');
  }

  private layout(): void {
    const { width: w, height: h } = this.scale;
    const s = clamp(Math.min(w / 640, 1), 0.7, 1);
    this.hud.container.setScale(s).setPosition(12, 10);

    this.panel.container.setScale(Math.min(s, (w - 20) / this.panel.width));
    const ps = this.panel.container.scaleX;
    this.panel.container.setPosition((w - this.panel.width * ps) / 2, h - 14 - this.panel.height * ps);

    this.banner.setPosition(w / 2, h * 0.3).setScale(s);
    this.bannerSub.setPosition(w / 2, h * 0.3 + 48 * s).setScale(s);
    this.toast.setPosition(w / 2, 120 * s + 20);
    this.soundBtn.setPosition(12, h - 10);
    this.collectBtn.setPosition(56, h - 10);
    this.collection.setPosition(w / 2, h / 2);
    (this.collection.getAt(0) as Phaser.GameObjects.Rectangle).setSize(w, h);
    this.actionBtn?.setPosition(w - 80, h - 90);
    this.autoBtn?.setPosition(w - 80, h - 190);
    this.travel.setPosition(w / 2, h / 2);
    const ts = clamp(Math.min(w / 460, h / 420), 0.6, 1);
    this.travel.setScale(ts);
    (this.travel.getAt(0) as Phaser.GameObjects.Rectangle).setSize(w / ts, h / ts);
  }

  private showBanner({ text, sub, big, color }: BannerArgs): void {
    this.tweens.killTweensOf([this.banner, this.bannerSub]);
    this.banner.setText(text).setColor(color ?? '#ffffff').setFontSize(big ? 64 : 44).setAlpha(1);
    this.bannerSub.setText(sub ?? '').setAlpha(sub ? 1 : 0);
    this.banner.setScale(0.5);
    this.tweens.add({ targets: this.banner, scale: this.hud.container.scaleX, duration: 250, ease: 'Back.easeOut' });
    this.tweens.add({ targets: [this.banner, this.bannerSub], alpha: 0, delay: big ? 3200 : 1400, duration: 500 });
  }

  private showToast(text: string): void {
    this.toast.setText(text).setAlpha(1);
    this.toastTimer?.remove();
    this.toastTimer = this.time.delayedCall(2400, () => this.tweens.add({ targets: this.toast, alpha: 0, duration: 400 }));
  }

  private toggleCollection(): void {
    const show = !this.collection.visible;
    if (show) this.renderCollection();
    this.collection.setVisible(show);
    eventBus.emit(EVT.SOUND, 'click');
  }

  private buildCollection(): void {
    const veil = this.add.rectangle(0, 0, 10, 10, 0x000000, 0.65).setInteractive();
    veil.on('pointerdown', () => this.collection.setVisible(false));
    const card = this.add.rectangle(0, 0, 380, 120 + COLLECTIBLES.length * 44, 0x06324a).setStrokeStyle(4, 0xffffff, 0.5).setInteractive();
    this.collection = this.add.container(0, 0, [veil, card]).setDepth(450).setVisible(false);
  }

  private renderCollection(): void {
    // keep veil + card, rebuild the rest
    this.collection.list.slice(2).forEach((o) => o.destroy());
    const top = -(60 + COLLECTIBLES.length * 22);
    const have = gameState.data.collectibles;
    const title = this.add.text(0, top + 22, 'COLLECTION  ' + have.length + ' / ' + COLLECTIBLES.length, { fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#ffe066' }).setOrigin(0.5);
    const bonus = this.add.text(0, top + 54, 'Sell price bonus: +' + Math.round((Economy.bonus() - 1) * 100) + '%', { fontFamily: FONT, fontSize: '15px', color: '#8be04e' }).setOrigin(0.5);
    const items: Phaser.GameObjects.GameObject[] = [title, bonus];
    COLLECTIBLES.forEach((c, i) => {
      const owned = have.includes(c.id);
      items.push(
        this.add.text(-160, top + 92 + i * 44, owned ? c.icon : '❔', { fontFamily: FONT, fontSize: '26px' }).setOrigin(0, 0.5),
        this.add.text(-110, top + 92 + i * 44, owned ? c.name : '???', { fontFamily: FONT, fontSize: '19px', fontStyle: 'bold', color: owned ? '#ffffff' : '#8aa3b0' }).setOrigin(0, 0.5),
        this.add.text(170, top + 92 + i * 44, c.hint, { fontFamily: FONT, fontSize: '12px', color: '#9cc4d8' }).setOrigin(1, 0.5),
      );
    });
    this.collection.add(items);
  }

  private buildTravel(): void {
    const veil = this.add.rectangle(0, 0, 10, 10, 0x000000, 0.65).setInteractive();
    veil.on('pointerdown', () => this.travel.setVisible(false));
    this.travel = this.add.container(0, 0, [veil]).setDepth(500).setVisible(false);
  }

  /** Destination list: current / visited (free) / next (ticket) / locked. */
  private showTravel(opts: TravelOption[]): void {
    this.travel.list.slice(1).forEach((o) => o.destroy());
    const rowH = 64;
    const height = 120 + opts.length * rowH + 40;
    const top = -height / 2;
    const items: Phaser.GameObjects.GameObject[] = [];
    items.push(this.add.rectangle(0, 0, 440, height, 0x06324a).setStrokeStyle(4, 0xffffff, 0.5).setInteractive());
    items.push(this.add.text(0, top + 32, '⛵ WHERE TO?', { fontFamily: FONT, fontSize: '28px', fontStyle: 'bold', color: '#ffe066' }).setOrigin(0.5));

    opts.forEach((o, i) => {
      const y = top + 90 + i * rowH;
      const status =
        o.state === 'current' ? 'You are here' : o.state === 'visited' ? 'Visited · free' : o.state === 'available' ? 'New island!' : 'Visit the previous island first';
      items.push(
        this.add.text(-200, y - 10, 'Island ' + o.island.id + ' · ' + o.island.name, { fontFamily: FONT, fontSize: '19px', fontStyle: 'bold', color: o.state === 'locked' ? '#8aa3b0' : '#ffffff' }).setOrigin(0, 0.5),
        this.add.text(-200, y + 14, status, { fontFamily: FONT, fontSize: '13px', color: '#9cc4d8' }).setOrigin(0, 0.5),
      );
      if (o.state === 'current' || o.state === 'locked') return;
      const afford = o.cost <= gameState.data.money;
      const label = o.state === 'available' ? '💰 ' + o.cost.toLocaleString() : 'GO';
      const ok = o.state === 'visited' || afford;
      const btn = this.add.rectangle(140, y, 110, 42, ok ? 0x3fbf5a : 0x59707d).setStrokeStyle(3, ok ? 0x1f7a34 : 0x3a4b55).setInteractive({ useHandCursor: true });
      const txt = this.add.text(140, y, label, { fontFamily: FONT, fontSize: '17px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
      btn.on('pointerdown', () => {
        if (!ok) {
          eventBus.emit(EVT.TOAST, 'Not enough coins for the ticket');
          eventBus.emit(EVT.SOUND, 'error');
          return;
        }
        this.travel.setVisible(false);
        eventBus.emit(EVT.TRAVEL, o.island.id);
      });
      items.push(btn, txt);
    });

    items.push(this.add.text(0, top + height - 38, 'More islands coming soon…', { fontFamily: FONT, fontSize: '13px', color: '#9cc4d8' }).setOrigin(0.5));
    const close = this.add.text(200, top + 28, '✕', { fontFamily: FONT, fontSize: '26px', color: '#ffffff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => this.travel.setVisible(false));
    items.push(close);
    this.travel.add(items);
    this.travel.setVisible(true);
  }

  private buildTouchControls(): void {
    const mkCircle = (label: string, size: number, color: number): { c: Phaser.GameObjects.Container; bg: Phaser.GameObjects.Rectangle } => {
      const bg = this.add.rectangle(0, 0, size, size, color, 0.75).setStrokeStyle(4, 0xffffff, 0.8).setInteractive();
      const t = this.add.text(0, 0, label, { fontFamily: FONT, fontSize: `${Math.floor(size / 3)}px`, fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
      return { c: this.add.container(0, 0, [bg, t]).setDepth(30), bg };
    };

    const action = mkCircle('🥥', 96, 0xe8861c);
    action.bg.on('pointerdown', () => {
      touchInput.actionHeld = true;
      touchInput.actionTap = true;
    });
    const release = (): void => {
      touchInput.actionHeld = false;
    };
    action.bg.on('pointerup', release);
    action.bg.on('pointerout', release);
    this.game.events.on(Phaser.Core.Events.BLUR, release);
    this.actionBtn = action.c;

    const auto = mkCircle('AUTO', 72, 0x4a6f86);
    auto.bg.on('pointerdown', () => {
      touchInput.autoHarvest = !touchInput.autoHarvest;
      auto.bg.setFillStyle(touchInput.autoHarvest ? 0x3fbf5a : 0x4a6f86, 0.75);
      eventBus.emit(EVT.SOUND, 'click');
    });
    this.autoBtn = auto.c;
  }
}
