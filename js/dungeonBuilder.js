import { WorldObjectsBuilder } from './worldObjects.js';

export class DungeonBuilder {
  constructor(scene) {
    this.scene = scene;
    this.tileSize = 4;
    this.gridCols = 60;
    this.gridRows = 60;
    this.grid = Array.from({ length: this.gridRows }, () => Array(this.gridCols).fill(0));
    this.rooms = [];
    this.worldBuilder = new WorldObjectsBuilder(scene, this.tileSize);
  }

  build() {
    this.generateRoomsAndCorridors();
    this.render3DWorld();
    return { 
      grid: this.grid, 
      rooms: this.rooms,
      doors: this.worldBuilder.doors
    };
  }

  generateRoomsAndCorridors() {
    const minSize = 6, maxSize = 12, targetRooms = 20;

    // Room 0: Dedicated Isolated Starting Safe Room
    const startX = 26;
    const startZ = 26;
    const startW = 8;
    const startH = 8;

    for (let rx = startX; rx < startX + startW; rx++) {
      for (let ry = startZ; ry < startZ + startH; ry++) {
        this.grid[ry][rx] = 2; // Safe Room Floor
      }
    }
    const safeRoom = { x: startX, y: startZ, w: startW, h: startH, isSafe: true };
    this.rooms.push(safeRoom);

    // Carve the single exit corridor from the middle-right wall of Room 0
    const exitCorridorX = startX + startW;
    const exitCorridorZ = startZ + Math.floor(startH / 2);
    
    for (let x = exitCorridorX; x < exitCorridorX + 4; x++) {
      this.grid[exitCorridorZ][x] = 1;
      this.grid[exitCorridorZ + 1][x] = 1;
    }

    // Place the double swinging doors right at the safe room exit threshold
    this.worldBuilder.createSwingingDoors(exitCorridorX * this.tileSize, (exitCorridorZ + 0.5) * this.tileSize);

    // Generate remaining random rooms connected from the exit point
    let prevRoom = { x: exitCorridorX + 2, y: exitCorridorZ, w: 4, h: 4 };

    for (let i = 1; i < targetRooms; i++) {
      const w = Math.floor(Math.random() * (maxSize - minSize)) + minSize;
      const h = Math.floor(Math.random() * (maxSize - minSize)) + minSize;
      const x = Math.floor(Math.random() * (this.gridCols - w - 4)) + 15;
      const y = Math.floor(Math.random() * (this.gridRows - h - 4)) + 5;

      let overlap = false;
      for (let r of this.rooms) {
        if (x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y) {
          overlap = true;
          break;
        }
      }

      if (!overlap) {
        const isSafe = (i % 7 === 0); 
        for (let rx = x; rx < x + w; rx++) {
          for (let ry = y; ry < y + h; ry++) {
            if (ry >= 0 && ry < this.gridRows && rx >= 0 && rx < this.gridCols) {
              this.grid[ry][rx] = isSafe ? 2 : 1;
            }
          }
        }
        const roomObj = { x, y, w, h, isSafe };
        this.rooms.push(roomObj);

        const bridgeX = Math.floor(prev.x + prev.w/2);
        const bridgeZ = Math.floor(prev.y + prev.h/2);
        const targetX = Math.floor(x + w/2);
        const targetZ = Math.floor(y + h/2);

        this.carveCorridor(bridgeX, targetX, bridgeZ, targetZ);
        prevRoom = roomObj;
      }
    }
  }

  carveCorridor(x1, x2, y1, y2) {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) { 
      if (y1 >= 0 && y1 < this.gridRows && x >= 0 && x < this.gridCols) this.grid[y1][x] = 1; 
      if (y1 + 1 >= 0 && y1 + 1 < this.gridRows && x >= 0 && x < this.gridCols) this.grid[y1 + 1][x] = 1; 
    }
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) { 
      if (x2 >= 0 && x2 < this.gridCols && y >= 0 && y < this.gridRows) this.grid[y][x2] = 1; 
      if (x2 + 1 >= 0 && x2 + 1 < this.gridCols && y >= 0 && y < this.gridRows) this.grid[y][x2 + 1] = 1; 
    }
  }

  render3DWorld() {
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const posX = c * this.tileSize;
        const posZ = r * this.tileSize;

        if (this.grid[r][c] > 0) {
          const isSafe = this.grid[r][c] === 2;
          this.worldBuilder.createFloor(posX, posZ, isSafe);
        } else {
          if (this.hasAdjacentFloor(r, c)) {
            this.worldBuilder.createWall(posX, posZ);
            if (Math.random() < 0.05) {
              this.worldBuilder.createSconce(posX, 3.0, posZ);
            }
          }
        }
      }
    }
  }

  hasAdjacentFloor(r, c) {
    const directions = [[0,1], [0,-1], [1,0], [-1,0]];
    for (let [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < this.gridRows && nc >= 0 && nc < this.gridCols) {
        if (this.grid[nr][nc] > 0) return true;
      }
    }
    return false;
  }
}
