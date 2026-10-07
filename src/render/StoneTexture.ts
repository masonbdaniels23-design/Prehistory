import Phaser from 'phaser';
import { PALETTE } from '../data/palette';
import { createRng, type Rng } from '../util/Random';
import { blobPoints, jitterLine, strokePath } from './PaintBrush';

export interface StoneOptions {
  width: number;
  height: number;
  seed: number;
  baseColor?: number;
  /** Multiplier for speckle / blotch / crack counts. */
  density?: number;
}

/**
 * Paint a seeded rock-wall texture: base colour, soft darker blotches,
 * fine speckles and faint cracks. Drawn once into a RenderTexture.
 */
export function createStoneTexture(
  scene: Phaser.Scene,
  x: number,
  y: number,
  opts: StoneOptions,
): Phaser.GameObjects.RenderTexture {
  const { width, height, seed } = opts;
  const density = opts.density ?? 1;
  const rng = createRng(seed);
  const area = (width * height) / (1000 * 1000);

  const rt = scene.add.renderTexture(x, y, width, height).setOrigin(0, 0);
  const g = scene.make.graphics({}, false);

  g.fillStyle(opts.baseColor ?? PALETTE.stoneLight, 1);
  g.fillRect(0, 0, width, height);

  paintBlotches(g, rng, width, height, Math.round(14 * area * density));
  paintSpeckles(g, rng, width, height, Math.round(1400 * area * density));
  paintCracks(g, rng, width, height, Math.round(7 * area * density));

  rt.draw(g);
  g.destroy();
  return rt;
}

function paintBlotches(g: Phaser.GameObjects.Graphics, rng: Rng, w: number, h: number, count: number): void {
  for (let i = 0; i < count; i++) {
    const cx = rng.range(0, w);
    const cy = rng.range(0, h);
    const r = rng.range(60, 220);
    const squash = rng.range(0.5, 1);
    // Concentric low-alpha layers fake a soft edge.
    for (let layer = 0; layer < 5; layer++) {
      const k = 1 - layer * 0.17;
      g.fillStyle(PALETTE.stoneDark, 0.07);
      g.fillPoints(blobPoints(cx, cy, r * k, r * k * squash, rng, 0.25, 14), true);
    }
  }
}

function paintSpeckles(g: Phaser.GameObjects.Graphics, rng: Rng, w: number, h: number, count: number): void {
  for (let i = 0; i < count; i++) {
    const dark = rng.next() < 0.8;
    g.fillStyle(dark ? PALETTE.stoneDark : PALETTE.kaolin, rng.range(0.25, 0.7));
    g.fillCircle(rng.range(0, w), rng.range(0, h), rng.range(0.6, 2.4));
  }
}

function paintCracks(g: Phaser.GameObjects.Graphics, rng: Rng, w: number, h: number, count: number): void {
  for (let i = 0; i < count; i++) {
    let x = rng.range(0, w);
    let y = rng.range(0, h);
    let angle = rng.range(0, Math.PI * 2);
    const segments = rng.int(4, 9);
    for (let s = 0; s < segments; s++) {
      const len = rng.range(18, 55);
      const nx = x + Math.cos(angle) * len;
      const ny = y + Math.sin(angle) * len;
      const width = rng.range(1, 2.4) * (1 - s / (segments + 2));
      strokePath(g, jitterLine(x, y, nx, ny, rng, 3, 10), width, PALETTE.stoneDark, rng, 0.85);
      // Occasional hairline branch.
      if (rng.next() < 0.25) {
        const ba = angle + rng.pick([-1, 1]) * rng.range(0.5, 1.1);
        const bl = len * rng.range(0.4, 0.8);
        strokePath(
          g,
          jitterLine(nx, ny, nx + Math.cos(ba) * bl, ny + Math.sin(ba) * bl, rng, 2, 8),
          width * 0.6,
          PALETTE.stoneDark,
          rng,
          0.7,
        );
      }
      x = nx;
      y = ny;
      angle += rng.range(-0.6, 0.6);
    }
  }
}
