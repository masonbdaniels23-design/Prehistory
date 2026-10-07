import { describe, expect, it } from 'vitest';
import { angleDiff, applyDamage, isInArc } from '../src/systems/Combat';

const base = { originX: 0, originY: 0, facing: 0, range: 60, arcDegrees: 60, targetRadius: 0 };

describe('angleDiff', () => {
  it('wraps around the circle', () => {
    expect(angleDiff(0.1, Math.PI * 2 - 0.1)).toBeCloseTo(0.2);
    expect(angleDiff(Math.PI * 2 - 0.1, 0.1)).toBeCloseTo(-0.2);
  });
});

describe('isInArc', () => {
  it('hits a target straight ahead within range', () => {
    expect(isInArc({ ...base, targetX: 50, targetY: 0 })).toBe(true);
  });
  it('misses targets beyond range', () => {
    expect(isInArc({ ...base, targetX: 70, targetY: 0 })).toBe(false);
  });
  it('target radius extends reach', () => {
    expect(isInArc({ ...base, targetX: 70, targetY: 0, targetRadius: 15 })).toBe(true);
  });
  it('misses targets outside the 60 degree arc', () => {
    // 45 degrees off-axis is outside a +/-30 degree arc.
    expect(isInArc({ ...base, targetX: 30, targetY: 30 })).toBe(false);
    expect(isInArc({ ...base, targetX: -40, targetY: 0 })).toBe(false);
  });
  it('respects facing', () => {
    expect(isInArc({ ...base, facing: Math.PI / 2, targetX: 0, targetY: 50 })).toBe(true);
  });
});

describe('applyDamage', () => {
  it('never goes below zero', () => {
    expect(applyDamage(10, 25)).toBe(0);
    expect(applyDamage(30, 10)).toBe(20);
    expect(applyDamage(30, -5)).toBe(30);
  });
});
