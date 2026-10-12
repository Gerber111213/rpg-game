export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey, name, hp, damage) {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.name = name;
    this.hp = hp;
    this.damage = damage;
    this.setCollideWorldBounds(true);
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }
}
