import Phaser from 'phaser';
import type { AnimalDef } from '../data/animals';
import { PALETTE } from '../data/palette';
import { createRng } from '../util/Random';
import { blob, outline, stroke, type Point } from './PaintBrush';

interface Leg {
  g: Phaser.GameObjects.Graphics;
  phase: number;
  side: number;
}

/**
 * A painted top-down animal facing right. Add `root` to a Container
 * (or use it directly) and call `animate` every frame.
 */
export class AnimalPainting {
  readonly root: Phaser.GameObjects.Container;
  private readonly legs: Leg[] = [];
  private readonly flash: Phaser.GameObjects.Graphics;
  private readonly def: AnimalDef;

  constructor(scene: Phaser.Scene, def: AnimalDef, seed: number) {
    this.def = def;
    const s = def.paintingShape;
    const rng = createRng(seed);
    const color = PALETTE[def.color];
    this.root = scene.add.container(0, 0);

    // Legs first so the body paints over the hips.
    const hipX = s.bodyLength * 0.3;
    const hipY = s.bodyWidth * 0.3;
    const legSpots: Array<[number, number, number]> = [
      [hipX, -hipY, 0],
      [hipX, hipY, Math.PI],
      [-hipX, -hipY, Math.PI],
      [-hipX, hipY, 0],
    ];
    for (const [x, y, phase] of legSpots) {
      const side = Math.sign(y);
      const g = scene.add.graphics({ x, y });
      stroke(g, 0, 0, -s.legLength * 0.55, side * s.legLength, s.legWidth, PALETTE.charcoal, rng, 0.95, 0.8);
      // Hoof dab.
      g.fillStyle(PALETTE.charcoal, 1);
      g.fillCircle(-s.legLength * 0.55, side * s.legLength, s.legWidth * 0.7);
      this.root.add(g);
      this.legs.push({ g, phase, side });
    }

    const body = scene.add.graphics();
    if (s.tailLength) {
      stroke(body, -s.bodyLength / 2, 0, -s.bodyLength / 2 - s.tailLength, rng.range(-2, 2), 3, PALETTE.charcoal, rng);
    }
    const bodyPts = blob(body, 0, 0, s.bodyLength / 2, s.bodyWidth / 2, color, rng, 1, 0.08);
    outline(body, bodyPts, 2, PALETTE.charcoal, rng, 0.9);

    // Neck and head reach forward.
    const neckStart = s.bodyLength / 2 - 4;
    const headX = neckStart + s.neckLength + s.headLength / 2;
    stroke(body, neckStart, 0, headX - s.headLength / 2 + 2, 0, s.headWidth * 0.8, color, rng, 1, 1);
    const headPts = blob(body, headX, 0, s.headLength / 2, s.headWidth / 2, color, rng, 1, 0.1);
    outline(body, headPts, 1.6, PALETTE.charcoal, rng, 0.9);
    // Ears.
    stroke(body, headX - 3, -s.headWidth / 2, headX - 7, -s.headWidth / 2 - 5, 3, PALETTE.charcoal, rng);
    stroke(body, headX - 3, s.headWidth / 2, headX - 7, s.headWidth / 2 + 5, 3, PALETTE.charcoal, rng);

    if (s.antlers) {
      for (const side of [-1, 1]) {
        const bx = headX - 2;
        const by = side * (s.headWidth / 2 - 1);
        const tx = bx - 9;
        const ty = by + side * 12;
        stroke(body, bx, by, tx, ty, 2.2, PALETTE.charcoal, rng);
        stroke(body, bx - 3, by + side * 4, bx + 3, by + side * 9, 1.6, PALETTE.charcoal, rng);
        stroke(body, tx + 2, ty - side * 2, tx + 1, ty + side * 5, 1.6, PALETTE.charcoal, rng);
      }
    }
    this.root.add(body);

    // Kaolin outline used for hit and telegraph flashes.
    this.flash = scene.add.graphics();
    const flashRng = createRng(seed + 1);
    outline(this.flash, scaled(bodyPts, 1.12), 3, PALETTE.kaolin, flashRng);
    outline(this.flash, scaled(headPts, 1.15, headX), 2.5, PALETTE.kaolin, flashRng);
    this.flash.setVisible(false);
    this.root.add(this.flash);
  }

  /** Swing legs: angle = sin(time * stepRate) * swingAmount, scaled by speed (0..1). */
  animate(timeSeconds: number, speedFactor: number): void {
    const s = this.def.paintingShape;
    const k = Phaser.Math.Clamp(speedFactor, 0, 1.5);
    for (const leg of this.legs) {
      leg.g.rotation = Math.sin(timeSeconds * s.stepRate * Math.max(0.35, k) + leg.phase) * s.swingAmount * k * leg.side;
    }
  }

  setFlash(on: boolean): void {
    this.flash.setVisible(on);
  }

  /** Splay the legs and stop animating (dead pose). */
  collapse(): void {
    for (const leg of this.legs) leg.g.rotation = 0.5 * leg.side;
  }
}

function scaled(points: Point[], k: number, cx = 0): Point[] {
  return points.map((p) => ({ x: cx + (p.x - cx) * k, y: p.y * k }));
}
