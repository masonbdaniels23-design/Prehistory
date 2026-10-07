/** Pure steering helpers for animal movement. */

export interface Bounds {
  width: number;
  height: number;
}

export interface Vec {
  x: number;
  y: number;
}

/**
 * Direction for an animal fleeing from a threat while staying inside the map.
 * Near a wall the component pointing into the wall is removed so the animal
 * slides along it. If that leaves nothing (running straight at a wall) it
 * picks the wall tangent leading away from the threat. Pinned in a corner it
 * returns {0,0}.
 */
export function fleeDirection(
  x: number,
  y: number,
  threatX: number,
  threatY: number,
  bounds: Bounds,
  margin: number,
): Vec {
  let dx = x - threatX;
  let dy = y - threatY;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len;
  dy /= len;

  const blockLeft = x < margin;
  const blockRight = x > bounds.width - margin;
  const blockTop = y < margin;
  const blockBottom = y > bounds.height - margin;

  if ((blockLeft && dx < 0) || (blockRight && dx > 0)) dx = 0;
  if ((blockTop && dy < 0) || (blockBottom && dy > 0)) dy = 0;

  const mag = Math.hypot(dx, dy);
  if (mag > 0.25) return { x: dx / mag, y: dy / mag };

  // Running into a wall: slide along it, away from the threat's side.
  const xBlocked = blockLeft || blockRight;
  const yBlocked = blockTop || blockBottom;
  if (xBlocked && !yBlocked) {
    const dir = y >= threatY ? 1 : -1;
    if ((dir > 0 && blockBottom) || (dir < 0 && blockTop)) return { x: 0, y: 0 };
    return { x: 0, y: dir };
  }
  if (yBlocked && !xBlocked) {
    const dir = x >= threatX ? 1 : -1;
    return { x: dir, y: 0 };
  }
  if (mag > 0) return { x: dx / mag, y: dy / mag };
  return { x: 0, y: 0 };
}

/** Rotate `current` toward `target` by at most `maxStep` radians. */
export function turnToward(current: number, target: number, maxStep: number): number {
  let d = (target - current) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  if (Math.abs(d) <= maxStep) return target;
  return current + Math.sign(d) * maxStep;
}
