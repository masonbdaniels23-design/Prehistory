import Phaser from 'phaser';

/** Nothing to load (no asset files); hands straight over to the hunt. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.scene.start('Hunt');
  }
}
