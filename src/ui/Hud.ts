import Phaser from 'phaser';
import { FONT_FAMILY } from '../config';
import { PALETTE, PALETTE_HEX } from '../data/palette';
import { createRng } from '../util/Random';
import { blob } from '../render/PaintBrush';

const BAR = { x: 24, y: 24, width: 220, height: 16 } as const;

export interface HudState {
  health: number;
  maxHealth: number;
  message: string;
}

/** Anything that can feed the HUD (the hunt scene). */
export interface HudSource {
  getHudState(): HudState;
}

/**
 * Screen-space HUD, run as an overlay scene so the hunt camera's zoom
 * never affects it. Pulls its state from the hunt every frame.
 */
export class Hud extends Phaser.Scene {
  private source!: HudSource;
  private bar!: Phaser.GameObjects.Graphics;
  private message!: Phaser.GameObjects.Text;
  private lastHealth = -1;

  constructor() {
    super('Hud');
  }

  init(data: { source: HudSource }): void {
    this.source = data.source;
    this.lastHealth = -1;
  }

  create(): void {
    const backing = this.add.graphics();
    blob(backing, BAR.x + BAR.width / 2, BAR.y + BAR.height / 2, BAR.width / 2 + 10, BAR.height / 2 + 8, PALETTE.charcoal, createRng(3), 0.55, 0.05);

    this.bar = this.add.graphics();
    this.message = this.add
      .text(this.scale.width / 2, this.scale.height * 0.2, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '34px',
        fontStyle: 'bold',
        color: PALETTE_HEX.kaolin,
        stroke: PALETTE_HEX.charcoal,
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5);
  }

  override update(): void {
    const state = this.source.getHudState();
    this.drawHealth(state.health, state.maxHealth);
    if (this.message.text !== state.message) this.message.setText(state.message);
  }

  private drawHealth(health: number, max: number): void {
    if (health === this.lastHealth) return;
    this.lastHealth = health;
    const frac = Phaser.Math.Clamp(health / max, 0, 1);
    this.bar.clear();
    this.bar.fillStyle(PALETTE.stoneDark, 0.9);
    this.bar.fillRect(BAR.x, BAR.y, BAR.width, BAR.height);
    this.bar.fillStyle(PALETTE.redOchre, 1);
    this.bar.fillRect(BAR.x, BAR.y, BAR.width * frac, BAR.height);
    this.bar.lineStyle(2, PALETTE.charcoal, 1);
    this.bar.strokeRect(BAR.x, BAR.y, BAR.width, BAR.height);
  }
}
