import type Phaser from 'phaser';
import { EVT, eventBus } from '../core/EventBus';
import { ADMIN_CODE, SCENES } from '../core/GameConfig';
import type { GameEventId } from '../data/events';
import { AdminSystem } from '../systems/AdminSystem';
import { Economy } from '../systems/EconomySystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';

const MODIFIERS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock']);

/**
 * Hidden admin pad (DOM overlay). Typing ADMIN_CODE anywhere in the game toggles it.
 * Saved-state edits go through AdminSystem; boss / hearts / events are sent over the EventBus.
 */
export class AdminPanel {
  private root: HTMLDivElement;
  private status: HTMLDivElement;
  private refreshers: (() => void)[] = [];
  private typed = '';

  private onKey = (e: KeyboardEvent): void => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (MODIFIERS.has(e.key)) return;
    if (!/^\d$/.test(e.key)) {
      this.typed = '';
      return;
    }
    this.typed = (this.typed + e.key).slice(-ADMIN_CODE.length);
    if (this.typed === ADMIN_CODE) {
      this.typed = '';
      this.toggle();
    }
  };

  constructor(private game: Phaser.Game) {
    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'fixed',
      top: '12px',
      right: '12px',
      width: '320px',
      maxHeight: 'calc(100vh - 24px)',
      overflowY: 'auto',
      boxSizing: 'border-box',
      padding: '12px',
      background: 'rgba(6, 50, 74, 0.96)',
      border: '3px solid rgba(255, 255, 255, 0.5)',
      borderRadius: '10px',
      color: '#ffffff',
      font: '14px Arial, "Malgun Gothic", sans-serif',
      zIndex: '1000',
      display: 'none',
      userSelect: 'text',
      touchAction: 'auto',
    });
    this.status = document.createElement('div');
    this.build();
    document.body.appendChild(this.root);
    window.addEventListener('keydown', this.onKey);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKey);
    this.root.remove();
  }

  private toggle(): void {
    const show = this.root.style.display === 'none';
    this.root.style.display = show ? 'block' : 'none';
    if (show) this.refresh();
  }

  private refresh(): void {
    this.refreshers.forEach((fn) => fn());
  }

  private say(text: string): void {
    this.status.textContent = text;
  }

  private build(): void {
    const head = document.createElement('div');
    Object.assign(head.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' });
    const title = document.createElement('b');
    title.textContent = '🛠 ADMIN PAD';
    title.style.cssText = 'font-size:18px;color:#ffe066';
    const close = this.button('✕', () => this.toggle());
    head.append(title, close);
    this.root.append(head);

    this.numberRow('💰 돈', () => Economy.money(), [
      ['설정', (n) => AdminSystem.setMoney(n)],
      ['+1만', () => AdminSystem.addMoney(10_000)],
      ['+100만', () => AdminSystem.addMoney(1_000_000)],
    ]);
    this.numberRow('🥥 코코넛 1개 판매가', () => Economy.coconutValue(), [
      ['설정', (n) => AdminSystem.setCoconutPrice(n)],
      ['기본값', () => AdminSystem.setCoconutPrice(null)],
    ]);
    this.numberRow('🎒 가방 크기', () => UpgradeSystem.bagCapacity(), [
      ['설정', (n) => AdminSystem.setBagCapacity(n)],
      ['기본값', () => AdminSystem.setBagCapacity(null)],
    ]);
    this.numberRow('👹 보스 체력 (보스전 중)', () => 0, [
      ['설정', (n) => this.bossOnly(EVT.ADMIN_BOSS_HP, n)],
      ['즉사', () => this.bossOnly(EVT.ADMIN_BOSS_HP, 0)],
    ]);
    this.numberRow('❤️ 내 체력 (보스전 중)', () => 4, [['설정', (n) => this.bossOnly(EVT.ADMIN_HEARTS, n)]]);

    const label = document.createElement('div');
    label.textContent = '🎲 이벤트 발생 (섬에서)';
    label.style.cssText = 'margin:12px 0 4px;font-weight:bold';
    const events = document.createElement('div');
    events.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap';
    events.append(
      this.button('🦑 크라켄 습격', () => this.fire('kraken')),
      this.button('✨ 골든 러시 (x2 · 60초)', () => this.fire('goldenRush')),
    );
    this.status.style.cssText = 'margin-top:10px;min-height:18px;color:#8be04e;font-size:13px';
    this.root.append(label, events, this.status);
  }

  /** Label + number input + action buttons. Buttons receive the typed number. */
  private numberRow(label: string, current: () => number, actions: [string, (n: number) => void][]): void {
    const wrap = document.createElement('div');
    wrap.style.marginTop = '10px';
    const text = document.createElement('div');
    text.textContent = label;
    text.style.cssText = 'font-weight:bold;margin-bottom:4px';
    const line = document.createElement('div');
    line.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;align-items:center';
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.style.cssText = 'width:100px;padding:5px;border-radius:5px;border:2px solid #9cc4d8;background:#0b3b55;color:#fff;user-select:text';
    this.refreshers.push(() => {
      input.value = String(current());
    });
    line.append(input);
    for (const [name, fn] of actions) {
      line.append(
        this.button(name, () => {
          const n = Number(input.value);
          if (input.value.trim() === '' || !Number.isFinite(n)) {
            this.say('숫자를 입력하세요');
            return;
          }
          fn(n);
          this.say(`${label} → ${name} 적용`);
          this.refresh();
        }),
      );
    }
    wrap.append(text, line);
    this.root.append(wrap);
  }

  private button(text: string, onClick: () => void): HTMLButtonElement {
    const b = document.createElement('button');
    b.textContent = text;
    b.style.cssText = 'padding:6px 10px;border-radius:6px;border:2px solid #1f7a34;background:#3fbf5a;color:#fff;font-weight:bold;cursor:pointer';
    b.addEventListener('click', onClick);
    return b;
  }

  private bossOnly(evt: typeof EVT.ADMIN_BOSS_HP | typeof EVT.ADMIN_HEARTS, n: number): void {
    if (!this.game.scene.isActive(SCENES.temple)) {
      this.say('보스전 중에만 사용할 수 있어요');
      return;
    }
    eventBus.emit(evt, n);
  }

  private fire(id: GameEventId): void {
    if (!this.game.scene.isActive(SCENES.island)) {
      this.say('섬에 있을 때만 발생시킬 수 있어요');
      return;
    }
    eventBus.emit(EVT.GAME_EVENT, id);
    this.say('이벤트 발생!');
    this.root.style.display = 'none';
  }
}
