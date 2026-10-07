/** Base player tuning. Gear modifiers are applied on top of these. */
export interface PlayerStats {
  maxHealth: number;
  speed: number;
  radius: number;
  stab: {
    cooldown: number; // seconds
    arcDegrees: number;
    range: number; // px from player centre
    duration: number; // seconds the thrust animation lasts
  };
}

export const PLAYER_STATS: PlayerStats = {
  maxHealth: 100,
  speed: 180,
  radius: 14,
  stab: {
    cooldown: 0.35,
    arcDegrees: 60,
    range: 60,
    duration: 0.15,
  },
};
