const MOVE_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
]);

/**
 * Native keyboard tracking. State is cleared on blur / visibilitychange / pointerup-outside
 * so a key released while the page is unfocused can never leave the player running.
 */
export class KeyboardInput {
  private down = new Set<string>();
  private actionEdge = false;
  private edges = new Set<string>();

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (MOVE_KEYS.has(e.code) || e.code === 'Space') e.preventDefault();
    if (e.code === 'Space' && !this.down.has('Space')) this.actionEdge = true;
    if (!this.down.has(e.code)) this.edges.add(e.code);
    this.down.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.down.delete(e.code);
  };

  private reset = (): void => {
    this.down.clear();
    this.edges.clear();
    this.actionEdge = false;
  };

  private onVisibility = (): void => {
    if (document.hidden) this.reset();
  };

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.reset);
    window.addEventListener('contextmenu', this.reset);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  /** 8-direction vector (diagonals normalized). */
  get vector(): { x: number; y: number } {
    const d = this.down;
    const x = (d.has('KeyD') || d.has('ArrowRight') ? 1 : 0) - (d.has('KeyA') || d.has('ArrowLeft') ? 1 : 0);
    const y = (d.has('KeyS') || d.has('ArrowDown') ? 1 : 0) - (d.has('KeyW') || d.has('ArrowUp') ? 1 : 0);
    if (x !== 0 && y !== 0) return { x: x * Math.SQRT1_2, y: y * Math.SQRT1_2 };
    return { x, y };
  }

  get action(): boolean {
    return this.down.has('Space');
  }

  /** True once per fresh SPACE press. */
  consumeActionPress(): boolean {
    const pressed = this.actionEdge;
    this.actionEdge = false;
    return pressed;
  }

  /** True once per fresh press of a specific key (e.g. 'Digit1'). */
  consumePress(code: string): boolean {
    return this.edges.delete(code);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.reset);
    window.removeEventListener('contextmenu', this.reset);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.reset();
  }
}
