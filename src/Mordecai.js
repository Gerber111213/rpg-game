class Mordecai extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'mordecai');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setImmovable(true);
    this.name = "Mordecai";
    this.role = "Dungeon Guide";
    this.dialogueIndex = 0;
    
    this.quotes = [
      "Listen to me, Carl. Do NOT touch anything glowing without identifying it first.",
      "The Syndicate AI loves drama. Put on a good show or floor two will kill you both.",
      "Donut, please stop drinking the health potions. Those are for combat emergencies."
    ];
  }

  getAdvice() {
    const advice = this.quotes[this.dialogueIndex % this.quotes.length];
    this.dialogueIndex++;
    return advice;
  }
}
