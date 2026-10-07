/** Canvas and physics configuration. */
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const WORLD = {
  width: 2400,
  height: 2400,
} as const;

/** Hunt camera zoom (world px to screen px). */
export const CAMERA_ZOOM = 1.25;

export const PHYSICS = {
  debug: false,
} as const;

/** System font stack used for all text (no font files). */
export const FONT_FAMILY =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
