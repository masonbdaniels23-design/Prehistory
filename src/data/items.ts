/** Gear definitions. Milestone 1 only needs spears; other slots arrive later. */
import type { PaletteName } from './palette';
export type MaterialTier = 'wood' | 'flint' | 'obsidian' | 'bone';

export interface SpearItem {
  id: string;
  name: string;
  slot: 'spear';
  tier: MaterialTier;
  price: number;
  unlockLevel: number;
  damage: number;
  braceWindowBonus: number; // seconds
  description: string;
}

export const SPEARS: readonly SpearItem[] = [
  { id: 'spear_wood', name: 'Wood spear', slot: 'spear', tier: 'wood', price: 0, unlockLevel: 1, damage: 10, braceWindowBonus: 0, description: 'A fire-hardened point. Better than bare hands.' },
  { id: 'spear_flint', name: 'Flint spear', slot: 'spear', tier: 'flint', price: 50, unlockLevel: 3, damage: 16, braceWindowBonus: 0, description: 'A knapped flint head bound with sinew.' },
  { id: 'spear_obsidian', name: 'Obsidian spear', slot: 'spear', tier: 'obsidian', price: 300, unlockLevel: 13, damage: 24, braceWindowBonus: 0.1, description: 'Volcanic glass, sharper than any blade.' },
  { id: 'spear_bone', name: 'Bone spear', slot: 'spear', tier: 'bone', price: 1000, unlockLevel: 25, damage: 34, braceWindowBonus: 0.2, description: 'Carved from a mammoth rib. Heavy and true.' },
];

export function getSpear(id: string): SpearItem {
  const spear = SPEARS.find((s) => s.id === id);
  if (!spear) throw new Error(`Unknown spear: ${id}`);
  return spear;
}

/** Spear tip colour per material tier (see art rules). */
export const TIER_TIP_COLOR: Record<MaterialTier, PaletteName> = {
  wood: 'yellowOchre',
  flint: 'stoneDark',
  obsidian: 'charcoal',
  bone: 'kaolin',
};
