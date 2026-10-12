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

// --- CHARACTER CLASSES ---
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
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // 1. Spooky Dungeon Rock Floor Texture
    g.fillStyle(0x15141c, 1); // Dark stone base
    g.fillRect(0, 0, 48, 48);
    // Rocky variation patches & shadows
    g.fillStyle(0x0e0d12, 1);
    g.fillRect(2, 2, 20, 20);
    g.fillRect(26, 26, 20, 20);
    g.fillStyle(0x1c1a26, 1);
    g.fillRect(24, 4, 20, 18);
    g.fillRect(4, 26, 18, 18);
    // Crevice/Crack details
    g.lineStyle(1, 0x08070a, 1);
    g.beginPath();
    g.moveTo(10, 0); g.lineTo(18, 22); g.lineTo(38, 44);
    g.strokePath();
    g.generateTexture('floor', 48, 48);
    g.clear();

    // 2. Rugged Dungeon Wall Texture
    g.fillStyle(0x282633, 1);
    g.fillRect(0, 0, 48, 48);
    g.lineStyle(2, 0x14131a, 1);
    g.strokeRect(0, 0, 48, 48);
    g.fillStyle(0x1a1921, 1);
    g.fillRect(6, 6, 36, 36);
    g.generateTexture('wall', 48, 48);
    g.clear();

    // 3. Carl
    g.fillStyle(0xe0ac69, 1);
    g.fillCircle(16, 16, 10);
    g.fillStyle(0xff66b2, 1);
    g.fillRect(8, 20, 16, 8);
    g.generateTexture('carl', 32, 32);
    g.clear();

    // 4. Donut
    g.fillStyle(0xffffff, 1);
    g.fillCircle(12, 12, 8);
    g.fillStyle(0xff88cc, 1);
    g.fillRect(7, 2, 10, 4);
    g.generateTexture('donut', 24, 24);
    g.clear();

    // 5. Goblin
    g.fillStyle(0x44cc44, 1);
    g.fillRect(0, 0, 24, 24);
    g.generateTexture('goblin', 24, 24);
    g.clear();

    // 6. Mordecai
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(0, 0, 28, 28);
    g.generateTexture('mordecai', 28, 28);
    g.clear();

    // 7. Missile
    g.fillStyle(0x00e5ff, 1);
    g.fillCircle(6, 6, 6);
    g.generateTexture('missile', 12, 12);
    g.clear();
  }

  create() {
    this.tileSize = 48;
    this.mapCols = 50;
    this.mapRows = 50;

    this.walls = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();

    // Build Labyrinth
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

    // Camera Settings: Locked on Carl AND Zoomed In for a claustrophobic dungeon feel
    this.cameras.main.setBounds(0, 0, this.mapCols * this.tileSize, this.mapRows * this.tileSize);
    this.cameras.main.startFollow(this.carl, true, 0.1, 0.1);
    this.cameras.main.setZoom(2.2); // Zooms in so you see a tight 6-tile radius around Carl

    this.targetX = this.carl.x;
    this.targetY = this.carl.y;
    this.donutCooldown = 0;

    // Inputs
    this.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown()) {
        this.handleRightClick(pointer);
      } else {
        this.hideContextMenu();
        this.targetX = pointer.worldX;
        this.targetY = pointer.worldY;
      }
    });

    this.game.canvas.oncontextmenu = (e) => e.preventDefault();
  }

  update() {
    this.carl.moveToTarget(this.targetX, this.targetY);
    this.donut.follow(this.carl.x, this.carl.y);

    // Donut combat AI
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

    // Projectile overlap
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

    const mordecaiBounds = new Phaser.Geom.Rectangle(this.mordecai.x - 14, this.mordecai.y - 14, 28, 28);
    if (mordecaiBounds.contains(worldX, worldY)) {
      this.addMenuOption("Talk to Mordecai", () => {
        logMessage(`MORDECAI: "${this.mordecai.getAdvice()}"`, 'sys-msg');
      });
    }

    const clickedEnemy = this.enemies.getChildren().find(e => e.getBounds().contains(worldX, worldY));
    if (clickedEnemy) {
      this.addMenuOption(`Attack ${clickedEnemy.name}`, () => {
        this.targetX = clickedEnemy.x;
        this.targetY = clickedEnemy.y;
        logMessage(`Carl advances on ${clickedEnemy.name}!`, 'combat-msg');
      });
    }

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
