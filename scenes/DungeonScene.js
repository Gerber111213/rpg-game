import { Carl } from '../entities/carl.js';
import { Donut } from '../entities/donut.js';
import { Enemy } from '../entities/enemy.js';
import { Mordecai } from '../entities/mordecai.js';

const logBox = document.getElementById('log-box');
const contextMenu = document.getElementById('context-menu');
const contextOptions = document.getElementById('context-options');

function logMessage(text, className = '') {
  const p = document.createElement('p');
  p.className = className;
  p.textContent = text;
  logBox.appendChild(p);
  logBox.scrollTop = logBox.scrollHeight;
}

export class DungeonScene extends Phaser.Scene {
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
    this.setupAnimations();

    this.tileSize = 48;
    this.mapCols = 250;
    this.mapRows = 250;
    
    this.walls = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();

    this.dungeonGrid = Array.from({ length: this.mapRows }, () => Array(this.mapCols).fill(null));
    const rooms = this.generateMassiveRoomsAndCorridors();

    // Register all solid walls in physics
    for (let r = 0; r < this.mapRows; r++) {
      for (let c = 0; c < this.mapCols; c++) {
        if (this.dungeonGrid[r][c].type === 0) {
          const posX = c * this.tileSize + this.tileSize / 2;
          const posY = r * this.tileSize + this.tileSize / 2;
          this.walls.create(posX, posY, this.dungeonGrid[r][c].texture).setVisible(false);
        }
      }
    }

    const spawnRoom = rooms[0];
    const spawnX = (spawnRoom.x + Math.floor(spawnRoom.w / 2)) * this.tileSize;
    const spawnY = (spawnRoom.y + Math.floor(spawnRoom.h / 2)) * this.tileSize;

    this.carl = new Carl(this, spawnX, spawnY);
    this.donut = new Donut(this, spawnX - 30, spawnY);
    this.mordecai = new Mordecai(this, spawnX + 40, spawnY);

    // Populate Goblins across rooms
    for (let i = 1; i < rooms.length; i++) {
      const room = rooms[i];
      if (Math.random() > 0.25) {
        const gx = (room.x + Math.floor(room.w / 2)) * this.tileSize;
        const gy = (room.y + Math.floor(room.h / 2)) * this.tileSize;
        const goblin = new Enemy(this, gx, gy, 'goblin', `Floor 1 Goblin Scavenger #${i}`, 30, 5);
        this.enemies.add(goblin);
      }
    }

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

    logMessage(`[SYSTEM ANNOUNCEMENT]: Welcome to Floor 1 Sprawling Labyrinth!`, 'sys-msg');
    logMessage(`[SYNDICATE AI]: Crawler Carl detected. Barefoot penalty active.`, 'sys-msg');

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
    // Fill with walls initially
    for (let r = 0; r < this.mapRows; r++) {
      for (let c = 0; c < this.mapCols; c++) {
        const wallTex = Phaser.Utils.Array.GetRandom(this.wallVariants);
        this.dungeonGrid[r][c] = { type: 0, texture: wallTex };
      }
    }

    const rooms = [];
    const minSize = 8;
    const maxSize = 18;
    const targetRooms = 120; // Sprawling layout across the 250x250 grid

    for (let i = 0; i < targetRooms; i++) {
      const w = Phaser.Math.Between(minSize, maxSize);
      const h = Phaser.Math.Between(minSize, maxSize);
      const x = Phaser.Math.Between(5, this.mapCols - w - 5);
      const y = Phaser.Math.Between(5, this.mapRows - h - 5);

      const newRoom = { x, y, w, h };
      let overlaps = false;

      for (let existing of rooms) {
        if (
          newRoom.x < existing.x + existing.w + 4 &&
          newRoom.x + newRoom.w + 4 > existing.x &&
          newRoom.y < existing.y + existing.h + 4 &&
          newRoom.y + newRoom.h + 4 > existing.y
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
      if (y > 0 && y < this.mapRows) {
        this.dungeonGrid[y][x] = { type: 1, texture: floorTex1 };
        this.dungeonGrid[y + 1][x] = { type: 1, texture: floorTex2 };
      }
    }
  }

  carveHallwayV(y1, y2, x) {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
      const floorTex1 = Phaser.Utils.Array.GetRandom(this.floorVariants);
      const floorTex2 = Phaser.Utils.Array.GetRandom(this.floorVariants);
      if (x > 0 && x < this.mapCols) {
        this.dungeonGrid[y][x] = { type: 1, texture: floorTex1 };
        this.dungeonGrid[y][x + 1] = { type: 1, texture: floorTex2 };
      }
    }
  }

  // --- VISION & LINE OF SIGHT (18 Tiles Range, Blocked by Walls) ---
  updateVisionAndTiles() {
    const carlTileX = Math.floor(this.carl.x / this.tileSize);
    const carlTileY = Math.floor(this.carl.y / this.tileSize);

    if (carlTileX === this.lastCarlTileX && carlTileY === this.lastCarlTileY) return;
    this.lastCarlTileX = carlTileX;
    this.lastCarlTileY = carlTileY;

    const sightRange = 18; // Expanded to 18 tiles view distance
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

      // Walls block line of sight
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

    this.announcementTimer++;
    if (this.announcementTimer === 600) {
      const chatter = [
        `[GALACTIC CHAT]: Viewer 'Zylox_9' tipped 500 coin: "Go Carl! Show those goblins what a barefoot human can do!"`,
        `[SYNDICATE AI]: Reminder: Betting closes on Crawler Carl's foot durability in 10 minutes.`,
        `DONUT: "Carl, if you don't find me a velvet cushion soon, I am firing you."`
      ];
      logMessage(Phaser.Utils.Array.GetRandom(chatter), 'sys-msg');
      this.announcementTimer = 0;
    }

    if (this.donutCooldown <= 0) {
      this.enemies.getChildren().forEach(enemy => {
        const range = Phaser.Math.Distance.Between(this.donut.x, this.donut.y, enemy.x, enemy.y);
        if (range <= 280) {
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
        logMessage(`[EXAMINE]: Princess Donut - Grand Champion Persian. Wearing a ruby tiara and pink collar.`, 'donut-msg');
      });
      this.addMenuOption("Talk to Donut", () => {
        logMessage(`DONUT: "CARL! WHY DO YOU ALWAYS SMELL LIKE BASEMENT MOLD?!"`, 'donut-msg');
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
