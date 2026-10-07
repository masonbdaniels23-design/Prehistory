import Phaser from 'phaser';
import { CAMERA_ZOOM, WORLD } from '../config';
import { ANIMALS } from '../data/animals';
import { Animal, type AnimalContext } from '../entities/Animal';
import { createBehavior } from '../entities/behaviors';
import { Player } from '../entities/Player';
import { createStoneTexture } from '../render/StoneTexture';
import { isInArc } from '../systems/Combat';
import type { HudSource, HudState } from '../ui/Hud';
import { createRng, randomSeed } from '../util/Random';

/** Minimum distance between the player's spawn and the target. */
const TARGET_MIN_DISTANCE = 900;
const SPAWN_EDGE_INSET = 120;

type Keys = Record<'W' | 'A' | 'S' | 'D' | 'R', Phaser.Input.Keyboard.Key>;

export class HuntScene extends Phaser.Scene implements HudSource {
  private player!: Player;
  private animals: Animal[] = [];
  private message = '';
  private keys!: Keys;
  private stabQueued = false;
  private finished = false;

  constructor() {
    super('Hunt');
  }

  create(): void {
    const seed = randomSeed();
    const rng = createRng(seed);
    this.animals = [];
    this.finished = false;
    this.stabQueued = false;

    this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);
    createStoneTexture(this, 0, 0, { width: WORLD.width, height: WORLD.height, seed }).setDepth(0);

    // Player spawns at a random map edge.
    const spawn = this.edgeSpawn(rng);
    this.player = new Player(this, spawn.x, spawn.y, 'spear_wood');

    // One deer, far enough away to make the player search for it.
    let tx = 0;
    let ty = 0;
    do {
      tx = rng.range(300, WORLD.width - 300);
      ty = rng.range(300, WORLD.height - 300);
    } while (Phaser.Math.Distance.Between(tx, ty, spawn.x, spawn.y) < TARGET_MIN_DISTANCE);
    const def = ANIMALS.deer;
    this.animals.push(new Animal(this, def, tx, ty, createBehavior(def.behavior), rng.int(1, 1e9)));

    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD.width, WORLD.height);
    cam.setZoom(CAMERA_ZOOM);
    cam.startFollow(this.player.container, true, 0.12, 0.12);

    this.message = 'Find the deer. Click to stab.';
    this.time.delayedCall(3500, () => {
      if (!this.finished) this.message = '';
    });
    this.scene.launch('Hud', { source: this });

    this.input.mouse?.disableContextMenu();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,R') as Keys;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.leftButtonDown()) this.stabQueued = true;
    });
  }

  override update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.05);
    const pointer = this.input.activePointer;
    pointer.updateWorldPoint(this.cameras.main);

    const k = this.keys;
    const stabEvent = this.player.update(dt, {
      moveX: (k.D.isDown ? 1 : 0) - (k.A.isDown ? 1 : 0),
      moveY: (k.S.isDown ? 1 : 0) - (k.W.isDown ? 1 : 0),
      aimX: pointer.worldX,
      aimY: pointer.worldY,
      stab: this.stabQueued,
    });
    this.stabQueued = false;

    const ctx: AnimalContext = {
      playerX: this.player.x,
      playerY: this.player.y,
      bounds: WORLD,
    };

    if (stabEvent) {
      for (const animal of this.animals) {
        if (animal.dead) continue;
        const hit = isInArc({
          originX: stabEvent.x,
          originY: stabEvent.y,
          facing: stabEvent.facing,
          range: stabEvent.range,
          arcDegrees: stabEvent.arcDegrees,
          targetX: animal.x,
          targetY: animal.y,
          targetRadius: animal.def.size,
        });
        if (hit && animal.takeDamage(stabEvent.damage, ctx)) this.onKill(animal);
      }
    }

    for (const animal of this.animals) animal.update(dt, ctx);

    if (this.finished && Phaser.Input.Keyboard.JustDown(k.R)) this.scene.restart();
  }

  getHudState(): HudState {
    return { health: this.player.health, maxHealth: this.player.maxHealth, message: this.message };
  }

  private onKill(animal: Animal): void {
    if (this.animals.every((a) => a.dead)) {
      this.finished = true;
      this.message = `${animal.def.name} down!\nPress R to hunt again`;
    }
  }

  private edgeSpawn(rng: ReturnType<typeof createRng>): { x: number; y: number } {
    const along = rng.range(SPAWN_EDGE_INSET, WORLD.width - SPAWN_EDGE_INSET);
    switch (rng.int(0, 3)) {
      case 0:
        return { x: SPAWN_EDGE_INSET, y: along };
      case 1:
        return { x: WORLD.width - SPAWN_EDGE_INSET, y: along };
      case 2:
        return { x: along, y: SPAWN_EDGE_INSET };
      default:
        return { x: along, y: WORLD.height - SPAWN_EDGE_INSET };
    }
  }
}
