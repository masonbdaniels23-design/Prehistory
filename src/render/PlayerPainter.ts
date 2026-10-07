import Phaser from 'phaser';
import { PALETTE } from '../data/palette';
import { createRng } from '../util/Random';
import { blob, outline, stroke } from './PaintBrush';

export interface PlayerLook {
  /** Body fill colour from equipped clothing. */
  bodyColor: number;
  /** Spear tip colour from equipped spear tier. */
  tipColor: number;
}

/** Spear geometry relative to the player centre (facing right). */
export const SPEAR_LAYOUT = {
  gripY: 9,
  butt: -22,
  tipBase: 34,
  tipEnd: 46,
} as const;

/**
 * Top-down charcoal hunter facing right: shoulders, head, arms and spear.
 * The spear lives in its own Graphics so it can thrust and brace.
 */
export class PlayerPainting {
  readonly root: Phaser.GameObjects.Container;
  readonly spear: Phaser.GameObjects.Graphics;
  private readonly arms: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, look: PlayerLook, seed = 7) {
    const rng = createRng(seed);
    this.root = scene.add.container(0, 0);

    // Spear under the arms.
    this.spear = scene.add.graphics();
    const { gripY, butt, tipBase, tipEnd } = SPEAR_LAYOUT;
    stroke(this.spear, butt, gripY, tipBase, gripY, 3, PALETTE.charcoal, rng, 1, 0.6);
    this.spear.fillStyle(look.tipColor, 1);
    this.spear.fillPoints(
      [
        { x: tipBase - 1, y: gripY - 4 },
        { x: tipEnd, y: gripY + rng.range(-0.5, 0.5) },
        { x: tipBase - 1, y: gripY + 4 },
      ],
      true,
    );
    this.spear.lineStyle(1.2, PALETTE.charcoal, 1);
    this.spear.strokeTriangle(tipBase - 1, gripY - 4, tipEnd, gripY, tipBase - 1, gripY + 4);
    this.root.add(this.spear);

    // Shoulders / torso: wide along the y axis when seen from above.
    const body = scene.add.graphics();
    const torso = blob(body, -2, 0, 9, 15, look.bodyColor, rng, 1, 0.1);
    outline(body, torso, 2.2, PALETTE.charcoal, rng);
    this.root.add(body);

    // Arms reach forward to the spear shaft.
    this.arms = scene.add.graphics();
    stroke(this.arms, 0, 12, 14, gripY, 3.5, PALETTE.charcoal, rng);
    stroke(this.arms, 0, -12, 6, gripY - 1, 3.5, PALETTE.charcoal, rng);
    this.root.add(this.arms);

    // Head on top.
    const head = scene.add.graphics();
    const headPts = blob(head, 1, 0, 7, 7, PALETTE.charcoal, rng, 1, 0.08);
    outline(head, headPts, 1, PALETTE.charcoal, rng);
    this.root.add(head);
  }

  /** Offset the spear (and hands) forward for a thrust; 0 = rest. */
  setThrust(offset: number): void {
    this.spear.x = offset;
    this.arms.x = offset * 0.6;
  }
}
