/** Pure combat geometry and damage helpers. */

/** Smallest signed difference between two angles, in radians (-PI..PI]. */
export function angleDiff(a: number, b: number): number {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

export interface ArcQuery {
  originX: number;
  originY: number;
  /** Facing angle in radians. */
  facing: number;
  range: number;
  arcDegrees: number;
  targetX: number;
  targetY: number;
  /** Target collision radius, extends the reach. */
  targetRadius: number;
}

/**
 * True when a circular target overlaps a melee arc in front of the attacker.
 * Targets overlapping the attacker's own position always count as hit.
 */
export function isInArc(q: ArcQuery): boolean {
  const dx = q.targetX - q.originX;
  const dy = q.targetY - q.originY;
  const dist = Math.hypot(dx, dy);
  if (dist > q.range + q.targetRadius) return false;
  if (dist <= q.targetRadius) return true;
  const halfArc = (q.arcDegrees * Math.PI) / 360;
  // Allow the target's body to poke into the arc even if its centre is outside.
  const slack = Math.asin(Math.min(1, q.targetRadius / dist));
  return Math.abs(angleDiff(Math.atan2(dy, dx), q.facing)) <= halfArc + slack;
}

/** Apply damage to a health pool, never going below zero. */
export function applyDamage(health: number, amount: number): number {
  return Math.max(0, health - Math.max(0, amount));
}
