export class Mordecai extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'mordecai');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);
    this.name = "Mordecai";
    this.dialogueIndex = 0;
    this.quotes = [
      "Listen to me, Carl. Do NOT touch glowing syndicate chests without checking for traps.",
      "The Syndicate AI loves high-drama ratings. Put on a show or the collapse will get us.",
      "Donut, stop demanding custom carpeting from the goblins. They don't have interior decorators."
    ];
  }

  getAdvice() {
    const advice = this.quotes[this.dialogueIndex % this.quotes.length];
    this.dialogueIndex++;
    return advice;
  }
}
