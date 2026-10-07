import type { Animal, AnimalBehavior, AnimalContext } from '../Animal';
import { fleeDirection } from '../../systems/Steering';

/** How far from the map edge an animal starts sliding along it. */
const WALL_MARGIN = 50;

/**
 * Deer: grazes and wanders, bolts the instant the player enters its
 * awareness ring, and calms down after a while without being hit.
 */
export class DeerBehavior implements AnimalBehavior {
  update(animal: Animal, ctx: AnimalContext): void {
    const def = animal.def;
    const dist = animal.distanceTo(ctx.playerX, ctx.playerY);

    if (animal.state !== 'flee' && dist < def.awarenessRadius) {
      animal.setState('flee');
    }

    switch (animal.state) {
      case 'idle':
        animal.stop();
        if (animal.stateTime >= animal.stateDuration) this.startWander(animal);
        break;
      case 'wander':
        this.wander(animal, ctx);
        break;
      case 'flee':
        this.flee(animal, ctx, dist);
        break;
      default:
        this.startIdle(animal);
    }
  }

  onHit(animal: Animal): void {
    // Attacking always makes it aware.
    if (animal.state !== 'flee') animal.setState('flee');
  }

  private startIdle(animal: Animal): void {
    const [min, max] = animal.def.idleTime;
    animal.setState('idle', animal.rng.range(min, max));
  }

  private startWander(animal: Animal): void {
    const [min, max] = animal.def.wanderTime;
    animal.setState('wander', animal.rng.range(min, max));
    animal.heading += animal.rng.range(-1.6, 1.6);
  }

  private wander(animal: Animal, ctx: AnimalContext): void {
    // Turn back toward the middle when drifting near an edge.
    const m = WALL_MARGIN * 3;
    const { width, height } = ctx.bounds;
    if (animal.x < m || animal.x > width - m || animal.y < m || animal.y > height - m) {
      animal.heading = Math.atan2(height / 2 - animal.y, width / 2 - animal.x);
    }
    animal.move(animal.heading, animal.def.wanderSpeed);
    if (animal.stateTime >= animal.stateDuration) this.startIdle(animal);
  }

  private flee(animal: Animal, ctx: AnimalContext, dist: number): void {
    const calm = animal.sinceHit >= animal.def.fleeCalmTime && animal.stateTime >= animal.def.fleeCalmTime;
    if (calm && dist > animal.def.awarenessRadius) {
      this.startWander(animal);
      return;
    }
    const dir = fleeDirection(animal.x, animal.y, ctx.playerX, ctx.playerY, ctx.bounds, WALL_MARGIN);
    if (dir.x === 0 && dir.y === 0) {
      // Cornered: freeze and face the threat.
      animal.stop();
      animal.heading = Math.atan2(ctx.playerY - animal.y, ctx.playerX - animal.x);
      return;
    }
    animal.move(Math.atan2(dir.y, dir.x), animal.def.speed);
  }
}
