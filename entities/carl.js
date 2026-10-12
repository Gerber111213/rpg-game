export class Carl extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'carl_walk', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.body.setSize(20, 16); 
    this.body.setOffset(14, 30);

    this.hp = 100;
    this.speed = 180;
    this.currentDirection = 'south';
    this.name = "Carl";
  }

  moveToTarget(targetX, targetY) {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    if (dist > 10) {
      this.scene.physics.moveTo(this, targetX, targetY, this.speed);
      this.updateAnimation(true);
    } else {
      this.body.setVelocity(0, 0);
      this.updateAnimation(false);
    }
  }

  updateAnimation(isMoving) {
    const vx = this.body.velocity.x;
    const vy = this.body.velocity.y;
    let animKey = 'carl_walk_south';

    if (Math.abs(vx) > Math.abs(vy)) {
      this.currentDirection = (vx > 0) ? 'east' : 'west';
    } else if (Math.abs(vy) > 0) {
      this.currentDirection = (vy > 0) ? 'south' : 'north';
    }

    if (isMoving) {
      animKey = `carl_walk_${this.currentDirection}`;
      if (this.anims.currentAnim?.key !== animKey) {
        this.play(animKey, true);
      }
    } else {
      this.anims.stop();
      switch(this.currentDirection) {
        case 'south': this.setFrame(0); break;
        case 'east':  this.setFrame(4); break;
        case 'north': this.setFrame(8); break;
        case 'west':  this.setFrame(12); break;
      }
    }
  }
}
