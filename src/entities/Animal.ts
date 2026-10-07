import Phaser from 'phaser';
import type { AnimalDef } from '../data/animals';
import { PALETTE } from '../data/palette';
import { AnimalPainting } from '../render/AnimalPainter';
import { blob } from '../render/PaintBrush';
import { applyDamage } from '../systems/Combat';
import type { Bounds } from '../systems/Steering';
import { turnToward } from '../systems/Steering';
import { createRng, type Rng } from '../util/Random';

export type AnimalState =
  | 'idle'
  | 'wander'
  | 'alert'
  | 'flee'
  | 'chase'
  | 'telegraph'
  | 'attack'
  | 'recover'
  | 'stunned'
  | 'trapped'
  | 'dead';

/** World information an animal's behavior needs each frame. */
export interface AnimalContext {
  playerX: number;
  playerY: number;
  bounds: Bounds;
}

/** Each behavior file decides state transitions for one kind of animal. */
export interface AnimalBehavior {
  update(animal: Animal, ctx: AnimalContext, dt: number): void;
  /** Called after the animal takes damage (and survives). */
  onHit(animal: Animal, ctx: AnimalContext): void;
}

const TURN_RATE = 9; // radians per second
const HIT_FLASH_TIME = 0.1;

export class Animal {
  readonly def: AnimalDef;
  readonly container: Phaser.GameObjects.Container;
  readonly body: Phaser.Physics.Arcade.Body;
  readonly rng: Rng;
  health: number;
  state: AnimalState = 'idle';
  /** Seconds spent in the current state. */
  stateTime = 0;
  /** Duration chosen for timed states such as idle or wander. */
  stateDuration = 0;
  /** Seconds since this animal was last hit. */
  sinceHit = Infinity;
  /** Current heading in radians (the way the painting faces). */
  heading: number;

  private readonly painting: AnimalPainting;
  private readonly behavior: AnimalBehavior;
  private flashTimer = 0;
  private animTime = 0;

  constructor(scene: Phaser.Scene, def: AnimalDef, x: number, y: number, behavior: AnimalBehavior, seed: number) {
    this.def = def;
    this.behavior = behavior;
    this.rng = createRng(seed);
    this.health = def.health;
    this.heading = this.rng.range(0, Math.PI * 2);

    this.painting = new AnimalPainting(scene, def, seed);
    this.container = scene.add.container(x, y, [this.painting.root]);
    this.container.setDepth(5);
    this.container.rotation = this.heading;

    scene.physics.add.existing(this.container);
    this.body = this.container.body as Phaser.Physics.Arcade.Body;
    this.body.setCircle(def.size, -def.size, -def.size);
    this.body.setCollideWorldBounds(true);
  }

  get x(): number {
    return this.container.x;
  }

  get y(): number {
    return this.container.y;
  }

  get dead(): boolean {
    return this.state === 'dead';
  }

  get speed(): number {
    return Math.hypot(this.body.velocity.x, this.body.velocity.y);
  }

  setState(state: AnimalState, duration = 0): void {
    this.state = state;
    this.stateTime = 0;
    this.stateDuration = duration;
  }

  /** Move along an angle at a speed (px/s); the painting turns to match. */
  move(angle: number, speed: number): void {
    this.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    if (speed > 0) this.heading = angle;
  }

  stop(): void {
    this.body.setVelocity(0, 0);
  }

  distanceTo(x: number, y: number): number {
    return Math.hypot(this.x - x, this.y - y);
  }

  update(dt: number, ctx: AnimalContext): void {
    if (this.dead) return;
    this.stateTime += dt;
    this.sinceHit += dt;
    this.behavior.update(this, ctx, dt);

    this.container.rotation = turnToward(this.container.rotation, this.heading, TURN_RATE * dt);
    this.animTime += dt;
    this.painting.animate(this.animTime, this.speed / this.def.speed);

    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) this.painting.setFlash(false);
    }
  }

  /** Returns true if this hit killed the animal. */
  takeDamage(amount: number, ctx: AnimalContext): boolean {
    if (this.dead) return false;
    this.health = applyDamage(this.health, amount);
    this.sinceHit = 0;
    this.flashTimer = HIT_FLASH_TIME;
    this.painting.setFlash(true);
    if (this.health <= 0) {
      this.die();
      return true;
    }
    this.behavior.onHit(this, ctx);
    return false;
  }

  private die(): void {
    this.setState('dead');
    this.stop();
    this.body.enable = false;
    this.painting.setFlash(false);
    this.painting.collapse();
    this.container.setDepth(2);
    // Red ochre pool painted under the body.
    const scene = this.container.scene;
    const pool = scene.add.graphics();
    blob(pool, 0, 0, this.def.size * 1.3, this.def.size * 0.9, PALETTE.redOchre, this.rng, 0.55, 0.3);
    this.container.addAt(pool, 0);
    this.painting.root.setAlpha(0.8);
  }
}
