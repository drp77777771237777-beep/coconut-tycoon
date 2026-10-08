/** 2.5D rule: depth follows the object's foot (y). Origin must be bottom-center. */
export const GROUND_DEPTH = -10000;
export const FLAT_DEPTH = -500;
export const OVERLAY_DEPTH = 100000;

export function applyDepth(obj: { y: number; setDepth(v: number): unknown }, offset = 0): void {
  obj.setDepth(obj.y + offset);
}
