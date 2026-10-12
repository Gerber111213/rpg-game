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
    // Adjust physics body size to match isometric feet placement
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
      this.updateAnimation(true); // Moving
    } else {
      this.body.setVelocity(0, 0);
      this.updateAnimation(false); // Idle
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

// --- OTHER ENTITY CLASSES ---
class Donut extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) { super(scene, x, y, 'donut'); scene.add.existing(this); scene.physics.add.existing(this); this.setCollideWorldBounds(true); this.speed = 170; }
  follow(targetX, targetY) { const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY); if (dist > 50) { this.scene.physics.moveTo(this, targetX, targetY, this.speed); } else { this.body.setVelocity(0, 0); } }
}

class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey, name, hp, damage) { super(scene, x, y, textureKey); scene.add.existing(this); scene.physics.add.existing(this); this.name = name; this.hp = hp; this.damage = damage; this.setCollideWorldBounds(true); }
  takeDamage(amount) { this.hp -= amount; if (this.hp <= 0) { this.destroy(); return true; } return false; }
}

class Mordecai extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) { super(scene, x, y, 'mordecai'); scene.add.existing(this); scene.physics.add.existing(this); this.setImmovable(true); this.name = "Mordecai"; this.dialogueIndex = 0; this.quotes = ["Listen to me, Carl. Do NOT touch glowing objects.", "Put on a good show for the Syndicate AI.", "Donut, stop drinking the health potions."]; }
  getAdvice() { const advice = this.quotes[this.dialogueIndex % this.quotes.length]; this.dialogueIndex++; return advice; }
}

// --- MAIN GAME SCENE ---
class DungeonScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DungeonScene' });
  }

  preload() {
    // 1. Load Carl's PNG Spritesheet from assets folder (32x64 frame size)
    this.load.spritesheet('carl_walk', 'assets/carl_walk.png', { frameWidth: 32, frameHeight: 64 });

    // Procedural Floor, Wall, and Entity textures
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    
    // Spooky Rock Floor
    g.fillStyle(0x15141c, 1); g.fillRect(0, 0, 48, 48); g.lineStyle(1, 0x08070a, 1); g.beginPath(); g.moveTo(10, 0); g.lineTo(18, 22); g.lineTo(38, 44); g.strokePath(); g.generateTexture('floor', 48, 48); g.clear();
    
    // Dungeon Wall
    g.fillStyle(0x282633, 1); g.fillRect(0, 0, 48, 48); g.lineStyle(2, 0x14131a, 1); g.strokeRect(0, 0, 48, 48); g.generateTexture('wall', 48, 48); g.clear();
    
    // Companions & Mobs
    g.fillStyle(0xffffff, 1); g.fillCircle(12, 12, 8); g.fillStyle(0xff88cc, 1); g.fillRect(7, 2, 10, 4); g.generateTexture('donut', 24, 24); g.clear();
    g.fillStyle(0x44cc44, 1); g.fillRect(0, 0, 24, 24); g.generateTexture('goblin', 24, 24); g.clear();
    g.fillStyle(0x8b5a2b, 1); g.fillRect(0, 0, 28, 28); g.generateTexture('mordecai', 28, 28); g.clear();
    g.fillStyle(0x00e5ff, 1); g.fillCircle(6, 6, 6); g.generateTexture('missile', 12, 12); g.clear();
  }

  create() {
    // Prevent default browser context menu
    this.game.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // 2. Define Directional Animations for Carl
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

    // Spawn Player, Companions, and Enemies
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

    // Camera Settings (Locked on Carl, Zoomed in 2.2x for claustrophobic dungeon feel)
    this.cameras.main.setBounds(0, 0, this.mapCols * this.tileSize, this.mapRows * this.tileSize);
    this.cameras.main.startFollow(this.carl, true, 0.1, 0.1);
    this.cameras.main.setZoom(2.2);

    this.targetX = this.carl.x; this.targetY = this.carl.y;
    this.donutCooldown = 0;

    // Pointer Input (Left-click to move, Right-click for menu)
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

    // Donut Combat AI
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
    } else { this.donutCooldown--; }

    // Projectile Hits
    this.physics.add.overlap(this.projectiles, this.enemies, (missile, enemy) => {
      missile.destroy();
      const defeated = enemy.takeDamage(15);
      logMessage(`[Magic Missile] hit ${enemy.name} for 15 damage!`, 'combat-msg');
      if (defeated) { logMessage(`${enemy.name} was obliterated!`, 'sys-msg'); }
    });
  }

  handleRightClick(pointer) {
    contextOptions.innerHTML = '';
    const worldX = pointer.worldX; 
    const worldY = pointer.worldY;

    const mordecaiBounds = new Phaser.Geom.Rectangle(this.mordecai.x - 14, this.mordecai.y - 14, 28, 28);
    if (mordecaiBounds.contains(worldX, worldY)) { 
      this.addMenuOption("Talk to Mordecai", () => { logMessage(`MORDECAI: "${this.mordecai.getAdvice()}"`, 'sys-msg'); }); 
    }

    const clickedEnemy = this.enemies.getChildren().find(e => e.getBounds().contains(worldX, worldY));
    if (clickedEnemy) { 
      this.addMenuOption(`Attack ${clickedEnemy.name}`, () => { this.targetX = clickedEnemy.x; this.targetY = clickedEnemy.y; logMessage(`Carl advances on ${clickedEnemy.name}!`, 'combat-msg'); }); 
    }

    this.addMenuOption("Walk Here", () => { this.targetX = worldX; this.targetY = worldY; });
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

// Phaser Game Config
const config = { 
  type: Phaser.AUTO, 
  width: window.innerWidth, 
  height: window.innerHeight, 
  backgroundColor: '#08080a', 
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } }, 
  scene: DungeonScene, 
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH } 
};

const game = new Phaser.Game(config);
