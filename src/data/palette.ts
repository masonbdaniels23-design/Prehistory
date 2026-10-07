/** Cave painting palette. Hex strings for text/CSS, numbers for Graphics. */
export const PALETTE_HEX = {
  stoneLight: '#d9c4a3',
  stoneDark: '#b89f7c',
  ochre: '#b5562b',
  redOchre: '#8e2b1d',
  yellowOchre: '#d49a3a',
  charcoal: '#2b2420',
  kaolin: '#efe6d6',
} as const;

export type PaletteName = keyof typeof PALETTE_HEX;

function hexToNumber(hex: string): number {
  return parseInt(hex.slice(1), 16);
}

export const PALETTE: Record<PaletteName, number> = {
  stoneLight: hexToNumber(PALETTE_HEX.stoneLight),
  stoneDark: hexToNumber(PALETTE_HEX.stoneDark),
  ochre: hexToNumber(PALETTE_HEX.ochre),
  redOchre: hexToNumber(PALETTE_HEX.redOchre),
  yellowOchre: hexToNumber(PALETTE_HEX.yellowOchre),
  charcoal: hexToNumber(PALETTE_HEX.charcoal),
  kaolin: hexToNumber(PALETTE_HEX.kaolin),
};
