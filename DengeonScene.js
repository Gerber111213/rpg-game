// Inside create() method of DungeonScene.js

// Spawn Mordecai near the starting corridor
this.mordecai = new Mordecai(this, this.tileSize * 3, this.tileSize * 2.5);

// Spawn a Goblin Scavenger
const goblin = new Enemy(this, this.tileSize * 8, this.tileSize * 4, 'goblin', 'Goblin Scavenger', 30, 5);
this.enemies.add(goblin);

// Right-click interaction with Mordecai
if (clickedEntity === this.mordecai) {
  this.addMenuOption(`Talk to ${this.mordecai.name}`, () => {
    logMessage(`MORDECAI: "${this.mordecai.getAdvice()}"`, 'sys-msg');
  });
}
