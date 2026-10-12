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
    // Generate programmatic textures for entities so no external images are needed
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });

    // 1. Floor Tile (48x48)
    graphics.fillStyle(0x121218, 1);
    graphics.fillRect(0, 0, 48, 48);
    graphics.lineStyle(1, 0x1e1e2a, 1);
    graphics.strokeRect(0, 0, 48, 48);
    graphics.generateTexture('floor', 48, 48);
    graphics.clear();

    // 2. Wall Tile (48x48)
    graphics.fillStyle(0x2d2b38, 1);
    graphics.fillRect(0, 0, 48, 48);
    graphics.lineStyle(1, 0x181720, 1);
    graphics.strokeRect(0, 0, 48, 48);
    graphics.generateTexture('wall', 48, 48);
    graphics.clear();

    // 3. Carl Texture
    graphics.fillStyle(0xe0ac69, 1); // Skin
    graphics.fillCircle(16, 16, 10);
    graphics.fillStyle(0xff66b2, 1); // Heart Boxers
    graphics.fillRect(8, 20, 16, 8);
    graphics.fillStyle(0x333333, 1); // Tactical Vest
    graphics.fillRect(9, 10, 14, 10);
    graphics.generateTexture('carl', 32, 32);
    graphics.clear();

    // 4. Donut Texture
    graphics.fillStyle(0xffffff, 1); // Fluffy cat body
    graphics.fillCircle(12, 12, 8);
    graphics.fillStyle(0xff88cc, 1); // Crown
    graphics.fillRect(7, 2, 10, 4);
    graphics.generateTexture('donut', 24, 24);
    graphics.clear();

    // 5. Enemy Texture (Goblin)
    graphics.fillStyle(0x44cc44, 1);
    graphics.fillRect(0, 0, 24, 24);
    graphics.generateTexture('goblin', 24, 24);
    graphics.clear();

    // 6. Magic Missile
    graphics.fillStyle(0x00e5ff, 1);
    graphics.fillCircle(6, 6, 6);
    graphics.generateTexture('missile', 12, 12);
    graphics.clear();
  }

  create() {
    this.tileSize = 48;
    this.mapCols = 40;
    this.mapRows = 40;

    // Create Arcade Physics Groups
    this.walls = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();

    // Build Labyrinth Grid
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

    // Spawn Carl (Player) with Physics
    this.carl = this.physics.add.sprite(this.tileSize * 2.5, this.tileSize * 2.5, 'carl');
    this.carl.setCollideWorldBounds(true);
    this.targetX = this.carl.x;
    this.targetY = this.carl.y;
    this.carlSpeed = 180;

    // Spawn Donut (AI Companion)
    this.donut = this.physics.add.sprite(this.carl.x - 30, this.carl.y, 'donut');
    this.donutCooldown = 0;

    // Spawn Enemies
    const mob1 = this.enemies.create(this.tileSize * 6.5, this.tileSize * 2.5, 'goblin');
    mob1.name = "Goblin Scavenger";
    mob1.hp = 30;

    const mob2 = this.enemies.create(this.tileSize * 10.5, this.tileSize * 5.5, 'goblin');
    mob2.name = "Rage Shroom";
    mob2.hp = 45;

    // Phaser Physics Collisions
    this.physics.add.collider(this.carl, this.walls);
    this.physics.add.collider(this.donut, this.walls);

    // Overlap: Magic Missiles striking Enemies
    this.physics.add.overlap(this.projectiles, this.enemies, (missile, enemy) => {
      missile.destroy();
      enemy.hp -= 15;
      logMessage(`[Magic Missile] struck ${enemy.name} for 15 damage!`, 'combat-msg');
      if (enemy.hp <= 0) {
        logMessage(`${enemy.name} was obliterated!`, 'sys-msg');
        enemy.destroy();
      }
    });

    // Camera Tracking
    this.cameras.main.setBounds(0, 0, this.mapCols * this.tileSize, this.mapRows * this.tileSize);
    this.cameras.main.startFollow(this.carl, true, 0.08, 0.08);

    // Mouse Controls (Point-and-click + Context Menu)
    this.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown()) {
        this.handleRightClick(pointer);
      } else {
        this.hideContextMenu();
        this.targetX = pointer.worldX;
        this.targetY = pointer.worldY;
      }
    });

    // Disable standard browser right-click menu
    this.game.canvas.oncontextmenu = (e) => e.preventDefault();
  }

  update(time, delta) {
    // 1. Player Movement toward Click Target
    const dist = Phaser.Math.Distance.Between(this.carl.x, this.carl.y, this.targetX, this.targetY);
    if (dist > 10) {
      this.physics.moveTo(this.carl, this.targetX, this.targetY, this.carlSpeed);
    } else {
      this.carl.body.setVelocity(0, 0);
    }

    // 2. Donut AI Movement (Follow Carl)
    const donutDist = Phaser.Math.Distance.Between(this.donut.x, this.donut.y, this.carl.x, this.carl.y);
    if (donutDist > 60) {
      this.physics.moveTo(this.donut, this.carl.x, this.carl.y, 140);
    } else {
      this.donut.body.setVelocity(0, 0);
    }

    // 3. Donut AI Combat (Auto-cast Magic Missile)
    if (this.donutCooldown <= 0) {
      this.enemies.getChildren().forEach(enemy => {
        const range = Phaser.Math.Distance.Between(this.donut.x, this.donut.y, enemy.x, enemy.y);
        if (range <= 200) {
          const missile = this.projectiles.create(this.donut.x, this.donut.y, 'missile');
          this.physics.moveToObject(missile, enemy, 350);
          this.donutCooldown = 120; // Cooldown ticks
          logMessage(`DONUT: "DIE, YOU DISGUSTING CREATURE!"`, 'donut-msg');
          logMessage(`Donut cast [Magic Missile]!`, 'combat-msg');
        }
      });
    } else {
      this.donutCooldown--;
    }
  }

  handleRightClick(pointer) {
    contextOptions.innerHTML = '';
    const worldX = pointer.worldX;
    const worldY = pointer.worldY;

    // Check if an enemy was right-clicked
    const clickedEnemy = this.enemies.getChildren().find(enemy => {
      return Phaser.Geom.Rectangle.Contains(enemy.getBounds(), worldX, worldY);
    });

    if (clickedEnemy) {
      this.addMenuOption(`Attack ${clickedEnemy.name}`, () => {
        this.targetX = clickedEnemy.x;
        this.targetY = clickedEnemy.y;
        logMessage(`Carl advances on ${clickedEnemy.name}!`, 'combat-msg');
      });
      this.addMenuOption(`Examine ${clickedEnemy.name}`, () => {
        logMessage(`[AI]: ${clickedEnemy.name} (HP: ${clickedEnemy.hp}). Unimposing.`, 'sys-msg');
      });
    }

    this.addMenuOption('Walk Here', () => {
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

// Phaser 3 Game Instance Config
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#08080a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: DungeonScene,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

const game = new Phaser.Game(config);
