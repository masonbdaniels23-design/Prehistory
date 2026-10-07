import { describe, expect, it } from 'vitest';
import { fleeDirection, turnToward } from '../src/systems/Steering';

const bounds = { width: 1000, height: 1000 };

describe('fleeDirection', () => {
  it('runs directly away in open ground', () => {
    const d = fleeDirection(500, 500, 400, 500, bounds, 50);
    expect(d.x).toBeCloseTo(1);
    expect(d.y).toBeCloseTo(0);
  });
  it('slides along a wall instead of running into it', () => {
    const d = fleeDirection(980, 500, 900, 480, bounds, 50);
    expect(d.x).toBe(0);
    expect(d.y).toBe(1);
  });
  it('is pinned in a corner', () => {
    const d = fleeDirection(980, 980, 900, 900, bounds, 50);
    expect(d).toEqual({ x: 0, y: 0 });
  });
});

describe('turnToward', () => {
  it('takes the short way round', () => {
    expect(turnToward(0.1, Math.PI * 2 - 0.1, 1)).toBeCloseTo(Math.PI * 2 - 0.1);
    expect(turnToward(0, 2, 0.5)).toBeCloseTo(0.5);
  });
});
