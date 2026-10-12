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

class DungeonScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DungeonScene' });
  }

  preload() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Floor Tile
    g.fillStyle(0x121218, 1);
    g.fillRect(0, 0, 48, 48);
    g.lineStyle(1, 0x1e1e2a, 1);
    g.strokeRect(0, 0, 48, 48);
    g.generateTexture('floor', 48, 48);
    g.clear();

    // Wall Tile
    g.fillStyle(0x2d2b38, 1);
    g.fillRect(0, 0, 48, 48);
    g.lineStyle(1, 0x181720, 1);
    g.strokeRect(0, 0, 48, 48);
    g.generateTexture('wall', 48, 48);
    g.clear();

    // Carl
    g.fillStyle(0xe0ac69, 1);
    g.fillCircle(16, 16, 10);
    g.fillStyle(0xff66b2, 1);
    g.fillRect(8, 20, 16, 8);
    g.generateTexture('carl', 32, 32);
    g.clear();

    // Donut
    g.fillStyle(0xffffff, 1);
    g.fillCircle(12, 12, 8);
    g.fillStyle(0xff88cc, 1);
    g.fillRect(7, 2, 10, 4);
    g.generateTexture('donut', 24, 24);
    g.clear();

    // Goblin
    g.fillStyle(0x44cc44, 1);
    g.fillRect(0, 0, 24, 24);
    g.generateTexture('goblin', 24, 24);
    g.clear();

    // Mordecai NPC
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(0, 0, 28, 28);
    g.generateTexture('mordecai', 28, 28);
    g.clear();

    // Missile
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

    // Spawn Mobs
    const goblin = new Enemy(this, this.tileSize * 8, this.tileSize * 4, 'goblin', 'Goblin Scavenger', 30, 5);
    this.enemies.add(goblin);

    // Physics Collisions
    this.physics.add.collider(this.carl, this.walls);
    this.physics.add.collider(this.donut, this.walls);
    this.physics.add.collider(this.mordecai, this.walls);
    this.physics.add.collider(this.enemies, this.walls);

    // Camera Lock: Keeps Carl dead-center, scrolling the map around him
    this.cameras.main.setBounds(0, 0, this.mapCols * this.tileSize, this.mapRows * this.tileSize);
    this.cameras.main.startFollow(this.carl, true, 0.1, 0.1);

    this.targetX = this.carl.x;
    this.targetY = this.carl.y;
    this.donutCooldown = 0;

    // Input Handling
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
    // Move Carl to Click Destination
    this.carl.moveToTarget(this.targetX, this.targetY);

    // Donut follows Carl
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
    } else {
      this.donutCooldown--;
    }

    // Projectile Hits
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

    // Check Mordecai
    const mordecaiBounds = new Phaser.Geom.Rectangle(this.mordecai.x - 14, this.mordecai.y - 14, 28, 28);
    if (mordecaiBounds.contains(worldX, worldY)) {
      this.addMenuOption("Talk to Mordecai", () => {
        logMessage(`MORDECAI: "${this.mordecai.getAdvice()}"`, 'sys-msg');
      });
    }

    // Check Enemies
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

// Config
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
