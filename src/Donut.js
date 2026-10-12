class Donut extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'donut');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setCollideWorldBounds(true);
    this.speed = 170;
  }

  follow(targetX, targetY) {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    if (dist > 50) {
      this.scene.physics.moveTo(this, targetX, targetY, this.speed);
    } else {
      this.body.setVelocity(0, 0);
    }
  }
}
