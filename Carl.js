class Carl extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'carl');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setCollideWorldBounds(true);
    this.hp = 100;
    this.speed = 180;
  }

  moveToTarget(targetX, targetY) {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    if (dist > 5) {
      this.scene.physics.moveTo(this, targetX, targetY, this.speed);
    } else {
      this.body.setVelocity(0, 0);
    }
  }
}
