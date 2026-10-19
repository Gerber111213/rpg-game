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
    for (let i = 0; i < targetRooms; i++) {
      const w = Math.floor(Math.random() * (maxSize - minSize)) + minSize;
      const h = Math.floor(Math.random() * (maxSize - minSize)) + minSize;
      const x = i === 0 ? 25 : Math.floor(Math.random() * (this.gridCols - w - 4)) + 2;
      const y = i === 0 ? 25 : Math.floor(Math.random() * (this.gridRows - h - 4)) + 2;

      let overlap = false;
      for (let r of this.rooms) {
        if (x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y) {
          overlap = true;
          break;
        }
      }

      if (!overlap || i === 0) {
        const isSafe = (i === 0 || i % 7 === 0); 
        for (let rx = x; rx < x + w; rx++) {
          for (let ry = y; ry < y + h; ry++) {
            if (ry >= 0 && ry < this.gridRows && rx >= 0 && rx < this.gridCols) {
              this.grid[ry][rx] = isSafe ? 2 : 1;
            }
          }
        }
        const roomObj = { x, y, w, h, isSafe };
        this.rooms.push(roomObj);

        if (this.rooms.length > 1) {
          const prev = this.rooms[this.rooms.length - 2];
          const bridgeX = Math.floor(prev.x + prev.w/2);
          const bridgeZ = Math.floor(prev.y + prev.h/2);
          const targetX = Math.floor(x + w/2);
          const targetZ = Math.floor(y + h/2);

          this.carveCorridor(bridgeX, targetX, bridgeZ, targetZ);

          if (i === 1) {
            this.worldBuilder.createSwingingDoors(bridgeX * this.tileSize, bridgeZ * this.tileSize);
          }
        }
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
