import { KeyboardInput } from '../input/KeyboardInput';
import { touchInput } from '../input/TouchInput';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import type { Player } from './Player';

/** The only place that translates input devices into Player movement. */
export class PlayerController {
  constructor(
    private player: Player,
    readonly keyboard: KeyboardInput,
  ) {}

  update(): void {
    const k = this.keyboard.vector;
    const t = touchInput.vector;
    const v = k.x !== 0 || k.y !== 0 ? k : t;
    this.player.move(v.x, v.y, UpgradeSystem.value('moveSpeed'));
  }

  /** Harvest is wanted while SPACE / action button is held, or mobile auto-harvest is on. */
  get wantsHarvest(): boolean {
    return this.keyboard.action || touchInput.actionHeld || touchInput.autoHarvest;
  }

  /** Fresh press of an interact input (dock etc.). */
  consumeInteract(): boolean {
    const a = this.keyboard.consumeActionPress();
    const b = touchInput.consumeTap();
    return a || b;
  }
}
