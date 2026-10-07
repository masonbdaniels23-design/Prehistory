import Phaser from 'phaser';
import { getSpear, TIER_TIP_COLOR, type SpearItem } from '../data/items';
import { PALETTE } from '../data/palette';
import { PLAYER_STATS } from '../data/player';
import { applyDamage } from '../systems/Combat';
import { PlayerPainting } from '../render/PlayerPainter';

export interface PlayerInput {
  moveX: number;
  moveY: number;
  aimX: number;
  aimY: number;
  stab: boolean;
}

export interface StabEvent {
  x: number;
  y: number;
  facing: number;
  range: number;
  arcDegrees: number;
  damage: number;
}

export class Player {
  readonly container: Phaser.GameObjects.Container;
  readonly body: Phaser.Physics.Arcade.Body;
  readonly spear: SpearItem;
  readonly maxHealth: number;
  health: number;
  facing = 0;

  private readonly painting: PlayerPainting;
  private stabCooldown = 0;
  private stabTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, spearId: string) {
    this.spear = getSpear(spearId);
    this.maxHealth = PLAYER_STATS.maxHealth;
    this.health = this.maxHealth;

    this.painting = new PlayerPainting(scene, {
      bodyColor: PALETTE.ochre,
      tipColor: PALETTE[TIER_TIP_COLOR[this.spear.tier]],
    });
    this.container = scene.add.container(x, y, [this.painting.root]);
    this.container.setDepth(10);

    scene.physics.add.existing(this.container);
    this.body = this.container.body as Phaser.Physics.Arcade.Body;
    const r = PLAYER_STATS.radius;
    this.body.setCircle(r, -r, -r);
    this.body.setCollideWorldBounds(true);
  }

  get x(): number {
    return this.container.x;
  }

  get y(): number {
    return this.container.y;
  }

  get dead(): boolean {
    return this.health <= 0;
  }

  /** Advance one frame. Returns a stab event when a stab starts this frame. */
  update(dt: number, input: PlayerInput): StabEvent | null {
    if (this.dead) {
      this.body.setVelocity(0, 0);
      return null;
    }
    this.stabCooldown = Math.max(0, this.stabCooldown - dt);
    this.stabTimer = Math.max(0, this.stabTimer - dt);

    const len = Math.hypot(input.moveX, input.moveY);
    const speed = PLAYER_STATS.speed;
    if (len > 0) {
      this.body.setVelocity((input.moveX / len) * speed, (input.moveY / len) * speed);
    } else {
      this.body.setVelocity(0, 0);
    }

    this.facing = Math.atan2(input.aimY - this.y, input.aimX - this.x);
    this.container.rotation = this.facing;

    // Thrust animation: quick out, ease back.
    const stab = PLAYER_STATS.stab;
    const t = this.stabTimer / stab.duration;
    this.painting.setThrust(t > 0 ? Math.sin(t * Math.PI) * 16 : 0);

    if (input.stab && this.stabCooldown <= 0) {
      this.stabCooldown = stab.cooldown;
      this.stabTimer = stab.duration;
      return {
        x: this.x,
        y: this.y,
        facing: this.facing,
        range: stab.range,
        arcDegrees: stab.arcDegrees,
        damage: this.spear.damage,
      };
    }
    return null;
  }

  takeDamage(amount: number): void {
    this.health = applyDamage(this.health, amount);
  }
}
