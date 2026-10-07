import type { AnimalDef } from '../../data/animals';
import type { AnimalBehavior } from '../Animal';
import { DeerBehavior } from './DeerBehavior';

/** Behavior id (from animal data) to behavior instance. */
export function createBehavior(id: AnimalDef['behavior']): AnimalBehavior {
  switch (id) {
    case 'deer':
      return new DeerBehavior();
  }
}
