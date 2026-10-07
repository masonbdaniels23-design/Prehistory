import type { PaletteName } from './palette';

/** Shape parameters for the procedural top-down painting (all in px, facing right). */
export interface PaintingShape {
  bodyLength: number;
  bodyWidth: number;
  headLength: number;
  headWidth: number;
  neckLength: number;
  legLength: number;
  legWidth: number;
  /** Leg swing frequency in radians per second at full speed. */
  stepRate: number;
  /** Max leg swing in radians. */
  swingAmount: number;
  antlers?: boolean;
  tailLength?: number;
}

export interface AnimalDef {
  id: string;
  name: string;
  tier: number;
  health: number;
  /** Top running speed (flee / chase), px/s. */
  speed: number;
  /** Calm wandering speed, px/s. */
  wanderSpeed: number;
  attack: null;
  awarenessRadius: number;
  behavior: 'deer';
  xp: number;
  shells: number;
  /** Collision radius, px. */
  size: number;
  color: PaletteName;
  paintingShape: PaintingShape;
  /** Seconds without being hit before a fleeing animal calms down. */
  fleeCalmTime: number;
  /** Range of seconds spent idle / wandering between decisions. */
  idleTime: [number, number];
  wanderTime: [number, number];
}

export const ANIMALS: Record<string, AnimalDef> = {
  deer: {
    id: 'deer',
    name: 'Deer',
    tier: 1,
    health: 30,
    speed: 200,
    wanderSpeed: 55,
    attack: null,
    awarenessRadius: 170,
    behavior: 'deer',
    xp: 50,
    shells: 12,
    size: 18,
    color: 'ochre',
    fleeCalmTime: 6,
    idleTime: [1.5, 3.5],
    wanderTime: [2, 4],
    paintingShape: {
      bodyLength: 46,
      bodyWidth: 20,
      headLength: 16,
      headWidth: 11,
      neckLength: 10,
      legLength: 12,
      legWidth: 4,
      stepRate: 18,
      swingAmount: 0.6,
      antlers: true,
      tailLength: 6,
    },
  },
};
