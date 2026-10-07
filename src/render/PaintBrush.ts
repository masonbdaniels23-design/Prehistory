import type Phaser from 'phaser';
import type { Rng } from '../util/Random';

/**
 * Hand-painted drawing helpers. Every shape is drawn with a little random
 * jitter and uneven thickness so nothing looks perfectly geometric.
 * The geometry helpers are pure so they can be unit tested.
 */

export interface Point {
  x: number;
  y: number;
}

/** Split a straight line into segments with sideways jitter. */
export function jitterLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rng: Rng,
  jitter: number,
  segmentLength = 8,
): Point[] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(len / segmentLength));
  const nx = len > 0 ? -dy / len : 0;
  const ny = len > 0 ? dx / len : 0;
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Endpoints stay put so strokes connect cleanly.
    const off = i === 0 || i === steps ? 0 : rng.range(-jitter, jitter);
    points.push({ x: x1 + dx * t + nx * off, y: y1 + dy * t + ny * off });
  }
  return points;
}

/** Points around an irregular ellipse. */
export function blobPoints(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rng: Rng,
  irregularity = 0.12,
  count = 18,
): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const k = 1 + rng.range(-irregularity, irregularity);
    points.push({ x: cx + Math.cos(a) * rx * k, y: cy + Math.sin(a) * ry * k });
  }
  return points;
}

/** Draw a polyline with uneven thickness and round joints. */
export function strokePath(
  g: Phaser.GameObjects.Graphics,
  points: Point[],
  width: number,
  color: number,
  rng: Rng,
  alpha = 1,
): void {
  for (let i = 0; i < points.length - 1; i++) {
    const w = width * rng.range(0.75, 1.2);
    const a = points[i];
    const b = points[i + 1];
    g.lineStyle(w, color, alpha);
    g.lineBetween(a.x, a.y, b.x, b.y);
    g.fillStyle(color, alpha);
    g.fillCircle(b.x, b.y, w / 2);
  }
  if (points.length > 0) {
    g.fillStyle(color, alpha);
    g.fillCircle(points[0].x, points[0].y, (width * 0.9) / 2);
  }
}

/** A single rough brush stroke from (x1,y1) to (x2,y2). */
export function stroke(
  g: Phaser.GameObjects.Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  color: number,
  rng: Rng,
  alpha = 1,
  jitter = width * 0.35,
): void {
  strokePath(g, jitterLine(x1, y1, x2, y2, rng, jitter), width, color, rng, alpha);
}

/** A filled irregular blob, painted in two passes for a pigment-on-stone look. */
export function blob(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: number,
  rng: Rng,
  alpha = 1,
  irregularity = 0.12,
): Point[] {
  const pts = blobPoints(cx, cy, rx, ry, rng, irregularity);
  g.fillStyle(color, alpha);
  g.fillPoints(pts, true);
  // Second, slightly offset thinner pass gives uneven pigment density.
  const inner = blobPoints(cx + rng.range(-1, 1), cy + rng.range(-1, 1), rx * 0.8, ry * 0.8, rng, irregularity);
  g.fillStyle(color, Math.min(1, alpha * 0.35));
  g.fillPoints(inner, true);
  return pts;
}

/** Rough outline around a set of points (e.g. a blob's edge). */
export function outline(
  g: Phaser.GameObjects.Graphics,
  points: Point[],
  width: number,
  color: number,
  rng: Rng,
  alpha = 1,
): void {
  const closed = [...points, points[0]];
  strokePath(g, closed, width, color, rng, alpha);
}

/** A dashed circle (used for awareness rings and telegraphs). */
export function dashedCircle(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  radius: number,
  width: number,
  color: number,
  alpha = 1,
  dashes = 28,
): void {
  g.lineStyle(width, color, alpha);
  const step = (Math.PI * 2) / dashes;
  for (let i = 0; i < dashes; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.55;
    g.beginPath();
    g.arc(cx, cy, radius, a0, a1, false);
    g.strokePath();
  }
}
