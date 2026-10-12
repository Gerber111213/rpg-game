export class Donut extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'donut_walk', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.body.setSize(18, 14);
    this.body.setOffset(15, 17);

    this.speed = 170;
    this.currentDirection = 'south';
    this.name = "Princess Donut";
  }

  follow(targetX, targetY) {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    if (dist > 45) {
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
    let animKey = 'donut_walk_south';

    if (Math.abs(vx) > Math.abs(vy)) {
      this.currentDirection = (vx > 0) ? 'east' : 'west';
    } else if (Math.abs(vy) > 0) {
      this.currentDirection = (vy > 0) ? 'south' : 'north';
    }

    if (isMoving) {
      animKey = `donut_walk_${this.currentDirection}`;
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
