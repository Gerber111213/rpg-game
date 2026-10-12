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

// --- PRINCESS DONUT CLASS ---
class Donut extends Phaser.Physics.Arcade.Sprite {
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

// --- ENTITY CLASSES ---
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
      "Listen to me, Carl. Do NOT touch glowing syndicate chests without checking for traps.",
      "The Syndicate AI loves high-drama ratings. Put on a show or the collapse will get us.",
      "Donut, stop demanding custom carpeting from the goblins. They don't have interior decorators."
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
    this.load.spritesheet('carl_walk', 'assets/carl_walk.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('donut_walk', 'assets/donut_walk.png', { frameWidth: 48, frameHeight: 48 });

    const g = this.make.graphics({ x: 0, y: 0, add: false });
    
    // Floor Variants
    g.fillStyle(0x1a1824, 1); g.fillRect(0, 0, 48, 48); g.lineStyle(1, 0x0d0c14, 1); g.strokeRect(2, 2, 44, 44); g.generateTexture('floor_1', 48, 48); g.clear();
    g.fillStyle(0x171520, 1); g.fillRect(0, 0, 48, 48); g.lineStyle(1, 0x09080e, 1); g.strokeRect(2, 2, 44, 44); g.beginPath(); g.moveTo(8, 8); g.lineTo(20, 24); g.lineTo(36, 40); g.strokePath(); g.generateTexture('floor_2', 48, 48); g.clear();
    g.fillStyle(0x161c17, 1); g.fillRect(0, 0, 48, 48); g.fillStyle(0x28402d, 0.6); g.fillCircle(14, 14, 6); g.fillCircle(32, 28, 8); g.lineStyle(1, 0x0a120b, 1); g.strokeRect(2, 2, 44, 44); g.generateTexture('floor_3', 48, 48); g.clear();
    g.fillStyle(0x1c1a29, 1); g.fillRect(0, 0, 48, 48); g.lineStyle(1, 0x3d3566, 0.8); g.strokeCircle(24, 24, 12); g.generateTexture('floor_4', 48, 48); g.clear();

    // Wall Variants
    g.fillStyle(0x2d2a3d, 1); g.fillRect(0, 0, 48, 48); g.lineStyle(2, 0x14121c, 1); g.strokeRect(0, 0, 48, 48); g.lineStyle(1, 0x1d1b28, 1); g.lineBetween(0, 24, 48, 24); g.generateTexture('wall_1', 48, 48); g.clear();
    g.fillStyle(0x273029, 1); g.fillRect(0, 0, 48, 48); g.fillStyle(0x3e5e43, 0.7); g.fillRect(4, 4, 16, 20); g.fillRect(24, 28, 18, 14); g.lineStyle(2, 0x101711, 1); g.strokeRect(0, 0, 48, 48); g.generateTexture('wall_2', 48, 48); g.clear();
    g.fillStyle(0x363342, 1); g.fillRect(0, 0, 48, 48); g.lineStyle(1, 0x16151c, 1); g.beginPath(); g.moveTo(4, 4); g.lineTo(24, 22); g.lineTo(44, 40); g.strokePath(); g.lineStyle(2, 0x181621, 1); g.strokeRect(0, 0, 48, 48); g.generateTexture('wall_3', 48, 48); g.clear();

    // Entity shapes
    g.fillStyle(0x44cc44, 1); g.fillRect(0, 0, 24, 24); g.generateTexture('goblin', 24, 24); g.clear();
    g.fillStyle(0x8b5a2b, 1); g.fillRect(0, 0, 28, 28); g.generateTexture('mordecai', 28, 28); g.clear();
    g.fillStyle(0x00e5ff, 1); g.fillCircle(6, 6, 6); g.generateTexture('missile', 12, 12); g.clear();

    this.floorVariants = ['floor_1', 'floor_1', 'floor_1', 'floor_2', 'floor_3', 'floor_4'];
    this.wallVariants = ['wall_1', 'wall_1', 'wall_2', 'wall_3'];
  }

  create() {
    // Lock out native browser right-click context menu entirely
    this.game.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, false);

    this.setupAnimations();

    this.tileSize = 48;
    this.mapCols = 250;
    this.mapRows = 250;
    
    this.walls = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();

    // 1. Generate grid and populate ALL static wall physics colliders upfront
    this.dungeonGrid = Array.from({ length: this.mapRows }, () => Array(this.mapCols).fill(null));
    const rooms = this.generateMassiveRoomsAndCorridors();

    for (let r = 0; r < this.mapRows; r++) {
      for (let c = 0; c < this.mapCols; c++) {
        if (this.dungeonGrid[r][c].type === 0) {
          const posX = c * this.tileSize + this.tileSize / 2;
          const posY = r * this.tileSize + this.tileSize / 2;
          this.walls.create(posX, posY, this.dungeonGrid[r][c].texture).setVisible(false);
        }
      }
    }

    // 2. Spawn Characters in the Starting Room
    const spawnRoom = rooms[0];
    const spawnX = (spawnRoom.x + Math.floor(spawnRoom.w / 2)) * this.tileSize;
    const spawnY = (spawnRoom.y + Math.floor(spawnRoom.h / 2)) * this.tileSize;

    this.carl = new Carl(this, spawnX, spawnY);
    this.donut = new Donut(this, spawnX - 30, spawnY);
    this.mordecai = new Mordecai(this, spawnX + 40, spawnY);

    // Populate Goblins across rooms
    for (let i = 1; i < rooms.length; i++) {
      const room = rooms[i];
      if (Math.random() > 0.3) {
        const gx = (room.x + Math.floor(room.w / 2)) * this.tileSize;
        const gy = (room.y + Math.floor(room.h / 2)) * this.tileSize;
        const goblin = new Enemy(this, gx, gy, 'goblin', `Floor 1 Goblin Scavenger #${i}`, 30, 5);
        this.enemies.add(goblin);
      }
    }

    // Collisions
    this.physics.add.collider(this.carl, this.walls);
    this.physics.add.collider(this.donut, this.walls);
    this.physics.add.collider(this.mordecai, this.walls);
    this.physics.add.collider(this.enemies, this.walls);

    this.cameras.main.setBounds(0, 0, this.mapCols * this.tileSize, this.mapRows * this.tileSize);
    this.cameras.main.startFollow(this.carl, true, 0.1, 0.1);
    this.cameras.main.setZoom(2.2);

    this.targetX = this.carl.x;
    this.targetY = this.carl.y;
    this.donutCooldown = 0;
    this.announcementTimer = 0;

    this.activeTileSprites = new Map();
    this.lastCarlTileX = -999;
    this.lastCarlTileY = -999;

    // --- IMMERSIVE BOOK-ACCURATE OPENING LOGS ---
    logMessage(`[SYSTEM ANNOUNCEMENT]: Welcome, Crawlers, to Floor 1 of the Crawler World Dungeon!`, 'sys-msg');
    logMessage(`[SYNDICATE AI]: Crawler Bradley Frederick Bruce Hamblin detected. Current footwear: NONE. Barefoot penalty active!`, 'sys-msg');
    logMessage(`DONUT: "Carl! Tell these alien monsters my tiara is crooked and it's giving me a migraine!"`, 'donut-msg');

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

  generateMassiveRoomsAndCorridors() {
    for (let r = 0; r < this.mapRows; r++) {
      for (let c = 0; c < this.mapCols; c++) {
        const wallTex = Phaser.Utils.Array.GetRandom(this.wallVariants);
        this.dungeonGrid[r][c] = { type: 0, texture: wallTex };
      }
    }

    const rooms = [];
    const minSize = 6;
    const maxSize = 14;
    const targetRooms = 80;

    for (let i = 0; i < targetRooms; i++) {
      const w = Phaser.Math.Between(minSize, maxSize);
      const h = Phaser.Math.Between(minSize, maxSize);
      const x = Phaser.Math.Between(3, this.mapCols - w - 3);
      const y = Phaser.Math.Between(3, this.mapRows - h - 3);

      const newRoom = { x, y, w, h };
      let overlaps = false;

      for (let existing of rooms) {
        if (
          newRoom.x < existing.x + existing.w + 3 &&
          newRoom.x + newRoom.w + 3 > existing.x &&
          newRoom.y < existing.y + existing.h + 3 &&
          newRoom.y + newRoom.h + 3 > existing.y
        ) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        for (let rx = x; rx < x + w; rx++) {
          for (let ry = y; ry < y + h; ry++) {
            const floorTex = Phaser.Utils.Array.GetRandom(this.floorVariants);
            this.dungeonGrid[ry][rx] = { type: 1, texture: floorTex };
          }
        }

        if (rooms.length > 0) {
          const prev = rooms[rooms.length - 1];
          const prevX = Math.floor(prev.x + prev.w / 2);
          const prevY = Math.floor(prev.y + prev.h / 2);
          const currX = Math.floor(x + w / 2);
          const currY = Math.floor(y + h / 2);

          if (Math.random() > 0.5) {
            this.carveHallwayH(prevX, currX, prevY);
            this.carveHallwayV(prevY, currY, currX);
          } else {
            this.carveHallwayV(prevY, currY, prevX);
            this.carveHallwayH(prevX, currX, currY);
          }
        }
        rooms.push(newRoom);
      }
    }
    return rooms;
  }

  carveHallwayH(x1, x2, y) {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
      const floorTex1 = Phaser.Utils.Array.GetRandom(this.floorVariants);
      const floorTex2 = Phaser.Utils.Array.GetRandom(this.floorVariants);
      this.dungeonGrid[y][x] = { type: 1, texture: floorTex1 };
      this.dungeonGrid[y + 1][x] = { type: 1, texture: floorTex2 };
    }
  }

  carveHallwayV(y1, y2, x) {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
      const floorTex1 = Phaser.Utils.Array.GetRandom(this.floorVariants);
      const floorTex2 = Phaser.Utils.Array.GetRandom(this.floorVariants);
      this.dungeonGrid[y][x] = { type: 1, texture: floorTex1 };
      this.dungeonGrid[y][x + 1] = { type: 1, texture: floorTex2 };
    }
  }

  updateVisionAndTiles() {
    const carlTileX = Math.floor(this.carl.x / this.tileSize);
    const carlTileY = Math.floor(this.carl.y / this.tileSize);

    if (carlTileX === this.lastCarlTileX && carlTileY === this.lastCarlTileY) return;
    this.lastCarlTileX = carlTileX;
    this.lastCarlTileY = carlTileY;

    const sightRange = 6;
    const visibleKeys = new Set();

    for (let ty = carlTileY - sightRange - 2; ty <= carlTileY + sightRange + 2; ty++) {
      for (let tx = carlTileX - sightRange - 2; tx <= carlTileX + sightRange + 2; tx++) {
        if (tx < 0 || tx >= this.mapCols || ty < 0 || ty >= this.mapRows) continue;

        const dist = Math.hypot(tx - carlTileX, ty - carlTileY);
        if (dist <= sightRange + 0.5) {
          if (this.hasLineOfSight(carlTileX, carlTileY, tx, ty)) {
            const key = `${tx},${ty}`;
            visibleKeys.add(key);

            if (!this.activeTileSprites.has(key)) {
              const posX = tx * this.tileSize + this.tileSize / 2;
              const posY = ty * this.tileSize + this.tileSize / 2;
              const tileData = this.dungeonGrid[ty][tx];
              const isFloor = tileData.type === 1;

              const img = this.add.image(posX, posY, tileData.texture);
              img.setDepth(isFloor ? 0 : 5);
              this.activeTileSprites.set(key, img);
            } else {
              this.activeTileSprites.get(key).setVisible(true);
            }
          }
        }
      }
    }

    for (let [key, sprite] of this.activeTileSprites.entries()) {
      if (!visibleKeys.has(key)) {
        sprite.setVisible(false);
      }
    }
  }

  hasLineOfSight(x0, y0, x1, y1) {
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    let cx = x0;
    let cy = y0;

    while (true) {
      if (cx === x1 && cy === y1) return true;

      if ((cx !== x0 || cy !== y0) && this.dungeonGrid[cy][cx].type === 0) {
        if (cx === x1 && cy === y1) return true;
        return false;
      }

      let e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        cx += sx;
      }
      if (e2 < dx) {
        err += dx;
        cy += sy;
      }
    }
  }

  setupAnimations() {
    this.anims.create({ key: 'carl_walk_south', frames: this.anims.generateFrameNumbers('carl_walk', { start: 1, end: 3 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'carl_walk_east', frames: this.anims.generateFrameNumbers('carl_walk', { start: 5, end: 7 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'carl_walk_north', frames: this.anims.generateFrameNumbers('carl_walk', { start: 9, end: 11 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'carl_walk_west', frames: this.anims.generateFrameNumbers('carl_walk', { start: 13, end: 15 }), frameRate: 8, repeat: -1 });

    this.anims.create({ key: 'donut_walk_south', frames: this.anims.generateFrameNumbers('donut_walk', { start: 1, end: 3 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'donut_walk_east', frames: this.anims.generateFrameNumbers('donut_walk', { start: 5, end: 7 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'donut_walk_north', frames: this.anims.generateFrameNumbers('donut_walk', { start: 9, end: 11 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'donut_walk_west', frames: this.anims.generateFrameNumbers('donut_walk', { start: 13, end: 15 }), frameRate: 8, repeat: -1 });
  }

  update() {
    this.carl.moveToTarget(this.targetX, this.targetY);
    this.donut.follow(this.carl.x, this.carl.y);

    this.updateVisionAndTiles();

    // Random Galactic Chat / Syndicate Flavor Ticker
    this.announcementTimer++;
    if (this.announcementTimer === 600) {
      const chatter = [
        `[GALACTIC CHAT]: Viewer 'Zylox_9' tipped 500 coin: "Go Carl! Show those goblins what a barefoot human can do!"`,
        `[SYNDICATE AI]: Reminder to all viewers: Betting closes on Crawler Carl's foot durability in 10 minutes.`,
        `DONUT: "Carl, if you don't find me a velvet cushion to sit on in the next five minutes, I am going to fire you as my manager."`
      ];
      logMessage(Phaser.Utils.Array.GetRandom(chatter), 'sys-msg');
      this.announcementTimer = 0;
    }

    // Donut Combat AI
    if (this.donutCooldown <= 0) {
      this.enemies.getChildren().forEach(enemy => {
        const range = Phaser.Math.Distance.Between(this.donut.x, this.donut.y, enemy.x, enemy.y);
        if (range <= 220) {
          const missile = this.projectiles.create(this.donut.x, this.donut.y, 'missile');
          this.physics.moveToObject(missile, enemy, 350);
          this.donutCooldown = 120;
          logMessage(`DONUT: "TAKE THIS, YOU WRETCHED HOOLIGAN!"`, 'donut-msg');
        }
      });
    } else {
      this.donutCooldown--;
    }

    this.physics.add.overlap(this.projectiles, this.enemies, (missile, enemy) => {
      missile.destroy();
      const defeated = enemy.takeDamage(15);
      logMessage(`[Magic Missile] hit ${enemy.name} for 15 damage!`, 'combat-msg');
      if (defeated) {
        logMessage(`${enemy.name} was obliterated! Syndicate rating increased by +0.04%!`, 'sys-msg');
      }
    });
  }

  handleRightClick(pointer) {
    contextOptions.innerHTML = '';
    const worldX = pointer.worldX; 
    const worldY = pointer.worldY;

    const donutBounds = new Phaser.Geom.Rectangle(this.donut.x - 12, this.donut.y - 12, 24, 24);
    if (donutBounds.contains(worldX, worldY)) {
      this.addMenuOption("Examine Princess Donut", () => {
        logMessage(`[EXAMINE]: Princess Donut - Grand Champion Persian. Wearing a ruby tiara and pink collar. Status: Outraged by dungeon sanitation.`, 'donut-msg');
      });
      this.addMenuOption("Talk to Donut", () => {
        logMessage(`DONUT: "CARL! WHY DO YOU ALWAYS SMELL LIKE BASEMENT MOLD AND GOBLIN BLOOD?"`, 'donut-msg');
      });
    }

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
        logMessage(`Carl advances on ${clickedEnemy.name} with grim tactical resolve!`, 'combat-msg');
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

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#000000',
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
