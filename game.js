const contextMenu = document.getElementById('context-menu');
const contextOptions = document.getElementById('context-options');
const logBox = document.getElementById('log-box');

function logMessage(text, className = '') {
  const p = document.createElement('p');
  p.className = className;
  p.textContent = text;
  logBox.appendChild(p);
  logBox.scrollTop = logBox.scrollHeight;
}

// --- CARL PLAYER CLASS ---
class Carl extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    // Reference the loaded spritesheet 'carl_walk' and start on frame 0 (South Idle)
    super(scene, x, y, 'carl_walk', 0);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setCollideWorldBounds(true);
    // Adjust physics body size to match isometric feet footprint
    this.body.setSize(20, 10); 
    this.body.setOffset(6, 50);

    this.hp = 100;
    this.speed = 180;
    this.currentDirection = 'south';
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

    // Determine 4-way direction based on movement velocity
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
      // Stopped: Set single idle frame based on direction
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

// --- PRINCESS DONUT CLASS ---
class Donut extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    // Reference the loaded spritesheet 'donut_walk' and start on frame 0 (South Idle)
    super(scene, x, y, 'donut_walk', 0);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setCollideWorldBounds(true);
    this.body.setSize(18, 14);
    this.body.setOffset(3, 10);

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

// --- OTHER ENTITY CLASSES ---
class Enemy extends Phaser.Physics.Arcade.Sprite {
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

class Mordecai extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'mordecai');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);
    this.name = "Mordecai";
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

// --- MAIN GAME SCENE ---
class DungeonScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DungeonScene' });
  }

  preload() {
    // 1. Load External Spritesheets from assets/ folder
    this.load.spritesheet('carl_walk', 'assets/carl_walk.png', { frameWidth: 32, frameHeight: 64 });
    this.load.spritesheet('donut_walk', 'assets/donut_walk.png', { frameWidth: 24, frameHeight: 24 });

    // Procedural Floor, Wall, and Placeholder Textures
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    
    // Spooky Dungeon Floor Texture
    g.fillStyle(0x15141c, 1); g.fillRect(0, 0, 48, 48);
    g.lineStyle(1, 0x08070a, 1); g.beginPath(); g.moveTo(10, 0); g.lineTo(18, 22); g.lineTo(38, 44); g.strokePath();
    g.generateTexture('floor', 48, 48); g.clear();
    
    // Dungeon Wall Texture
    g.fillStyle(0x282633, 1); g.fillRect(0, 0, 48, 48);
    g.lineStyle(2, 0x14131a, 1); g.strokeRect(0, 0, 48, 48);
    g.generateTexture('wall', 48, 48); g.clear();
    
    // Goblin, Mordecai, and Projectile Shapes
    g.fillStyle(0x44cc44, 1); g.fillRect(0, 0, 24, 24); g.generateTexture('goblin', 24, 24); g.clear();
    g.fillStyle(0x8b5a2b, 1); g.fillRect(0, 0, 28, 28); g.generateTexture('mordecai', 28, 28); g.clear();
    g.fillStyle(0x00e5ff, 1); g.fillCircle(6, 6, 6); g.generateTexture('missile', 12, 12); g.clear();
  }

  create() {
    // Disable standard browser right-click menu
    this.game.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // 2. Define Animations (Carl)
    this.anims.create({
      key: 'carl_walk_south',
      frames: this.anims.generateFrameNumbers('carl_walk', { start: 1, end: 3 }),
      frameRate: 8, repeat: -1
    });
    this.anims.create({
      key: 'carl_walk_east',
      frames: this.anims.generateFrameNumbers('carl_walk', { start: 5, end: 7 }),
      frameRate: 8, repeat: -1
    });
    this.anims.create({
      key: 'carl_walk_north',
      frames: this.anims.generateFrameNumbers('carl_walk', { start: 9, end: 11 }),
      frameRate: 8, repeat: -1
    });
    this.anims.create({
      key: 'carl_walk_west',
      frames: this.anims.generateFrameNumbers('carl_walk', { start: 13, end: 15 }),
      frameRate: 8, repeat: -1
    });

    // 3. Define Animations (Donut)
    this.anims.create({
      key: 'donut_walk_south',
      frames: this.anims.generateFrameNumbers('donut_walk', { start: 1, end: 3 }),
      frameRate: 8, repeat: -1
    });
    this.anims.create({
      key: 'donut_walk_east',
      frames: this.anims.generateFrameNumbers('donut_walk', { start: 5, end: 7 }),
      frameRate: 8, repeat: -1
    });
    this.anims.create({
      key: 'donut_walk_north',
      frames: this.anims.generateFrameNumbers('donut_walk', { start: 9, end: 11 }),
      frameRate: 8, repeat: -1
    });
    this.anims.create({
      key: 'donut_walk_west',
      frames: this.anims.generateFrameNumbers('donut_walk', { start: 13, end: 15 }),
      frameRate: 8, repeat: -1
    });

    this.tileSize = 48;
    this.mapCols = 50; this.mapRows = 50;
    this.walls = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();

    // Build Labyrinth Map
    for (let r = 0; r < this.mapRows; r++) {
      for (let c = 0; c < this.mapCols; c++) {
        const x = c * this.tileSize + this.tileSize / 2;
        const y = r * this.tileSize + this.tileSize / 2;
        if (r === 0 || c === 0 || r === this.mapRows - 1 || c === this.mapCols - 1 || (r % 4 === 0 && c % 4 === 0)) {
          this.walls.create(x, y, 'wall');
        } else {
          this.add.image(x, y, 'floor');
        }
      }
    }

    // Spawn Characters
    this.carl = new Carl(this, this.tileSize * 2.5, this.tileSize * 2.5);
    this.donut = new Donut(this, this.tileSize * 2, this.tileSize * 2.5);
    this.mordecai = new Mordecai(this, this.tileSize * 4, this.tileSize * 2.5);
    
    const goblin = new Enemy(this, this.tileSize * 8, this.tileSize * 4, 'goblin', 'Goblin Scavenger', 30, 5);
    this.enemies.add(goblin);

    // Collisions
    this.physics.add.collider(this.carl, this.walls);
    this.physics.add.collider(this.donut, this.walls);
    this.physics.add.collider(this.mordecai, this.walls);
    this.physics.add.collider(this.enemies, this.walls);

    // Camera (Lock on Carl, Zoomed in 2.2x for claustrophobic dungeon view)
    this.cameras.main.setBounds(0, 0, this.mapCols * this.tileSize, this.mapRows * this.tileSize);
    this.cameras.main.startFollow(this.carl, true, 0.1, 0.1);
    this.cameras.main.setZoom(2.2);

    this.targetX = this.carl.x;
    this.targetY = this.carl.y;
    this.donutCooldown = 0;

    // Click Input Handler
    this.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown() || pointer.button === 2) {
        this.handleRightClick(pointer);
      } else if (pointer.leftButtonDown() || pointer.button === 0) {
        this.hideContextMenu();
        this.targetX = pointer.worldX;
        this.targetY = pointer.worldY;
      }
    });
  }

  update() {
    this.carl.moveToTarget(this.targetX, this.targetY);
    this.donut.follow(this.carl.x, this.carl.y);

    // Donut Auto Combat AI
    if (this.donutCooldown <= 0) {
      this.enemies.getChildren().forEach(enemy => {
        const range = Phaser.Math.Distance.Between(this.donut.x, this.donut.y, enemy.x, enemy.y);
        if (range <= 220) {
          const missile = this.projectiles.create(this.donut.x, this.donut.y, 'missile');
          this.physics.moveToObject(missile, enemy, 350);
          this.donutCooldown = 120;
          logMessage(`DONUT: "TAKE THIS, YOU BRUTE!"`, 'donut-msg');
        }
      });
    } else {
      this.donutCooldown--;
    }

    // Projectile Overlap with Enemies
    this.physics.add.overlap(this.projectiles, this.enemies, (missile, enemy) => {
      missile.destroy();
      const defeated = enemy.takeDamage(15);
      logMessage(`[Magic Missile] hit ${enemy.name} for 15 damage!`, 'combat-msg');
      if (defeated) {
        logMessage(`${enemy.name} was obliterated!`, 'sys-msg');
      }
    });
  }

  handleRightClick(pointer) {
    contextOptions.innerHTML = '';
    const worldX = pointer.worldX; 
    const worldY = pointer.worldY;

    // Check Right-Click on Princess Donut
    const donutBounds = new Phaser.Geom.Rectangle(this.donut.x - 12, this.donut.y - 12, 24, 24);
    if (donutBounds.contains(worldX, worldY)) {
      this.addMenuOption("Examine Princess Donut", () => {
        logMessage(`[EXAMINE]: Princess Donut - Level 1 Grand Champion Persian Cat. She is wearing a pink sequined collar and a tiny ruby tiara.`, 'donut-msg');
      });
      this.addMenuOption("Talk to Donut", () => {
        logMessage(`DONUT: "CARL! THIS FLOOR IS FILTHY! WHY ARE THERE NO CARPETS?!"`, 'donut-msg');
      });
    }

    // Check Right-Click on Mordecai
    const mordecaiBounds = new Phaser.Geom.Rectangle(this.mordecai.x - 14, this.mordecai.y - 14, 28, 28);
    if (mordecaiBounds.contains(worldX, worldY)) {
      this.addMenuOption("Talk to Mordecai", () => {
        logMessage(`MORDECAI: "${this.mordecai.getAdvice()}"`, 'sys-msg');
      });
    }

    // Check Right-Click on Enemies
    const clickedEnemy = this.enemies.getChildren().find(e => e.getBounds().contains(worldX, worldY));
    if (clickedEnemy) {
      this.addMenuOption(`Attack ${clickedEnemy.name}`, () => {
        this.targetX = clickedEnemy.x;
        this.targetY = clickedEnemy.y;
        logMessage(`Carl advances on ${clickedEnemy.name}!`, 'combat-msg');
      });
    }

    // Default Walk Here option
    this.addMenuOption("Walk Here", () => {
      this.targetX = worldX;
      this.targetY = worldY;
    });

    contextMenu.style.left = `${pointer.event.clientX}px`;
    contextMenu.style.top = `${pointer.event.clientY}px`;
    contextMenu.classList.remove('hidden');
  }

  addMenuOption(text, action) {
    const li = document.createElement('li');
    li.textContent = text;
    li.addEventListener('click', () => { action(); this.hideContextMenu(); });
    contextOptions.appendChild(li);
  }

  hideContextMenu() {
    contextMenu.classList.add('hidden');
  }
}

// Game Configuration
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#08080a',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: DungeonScene,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

const game = new Phaser.Game(config);
