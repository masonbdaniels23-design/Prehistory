import { describe, expect, it } from 'vitest';
import { blobPoints, jitterLine } from '../src/render/PaintBrush';
import { createRng } from '../src/util/Random';

describe('createRng', () => {
  it('is deterministic per seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 5; i++) expect(a.next()).toBe(b.next());
  });
  it('int stays in range', () => {
    const r = createRng(1);
    for (let i = 0; i < 200; i++) {
      const v = r.int(2, 5);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(5);
    }
  });
});

describe('jitterLine', () => {
  it('keeps endpoints fixed', () => {
    const pts = jitterLine(0, 0, 100, 0, createRng(3), 5);
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[pts.length - 1]).toEqual({ x: 100, y: 0 });
    expect(pts.some((p) => p.y !== 0)).toBe(true);
  });
});

describe('blobPoints', () => {
  it('stays near the requested ellipse', () => {
    const pts = blobPoints(0, 0, 10, 10, createRng(9), 0.1, 20);
    expect(pts).toHaveLength(20);
    for (const p of pts) {
      const r = Math.hypot(p.x, p.y);
      expect(r).toBeGreaterThan(8.9);
      expect(r).toBeLessThan(11.1);
    }
  });
});
