import * as THREE from 'three';

export class DungeonBuilder {
  constructor(scene) {
    this.scene = scene;
    this.tileSize = 4;
    this.gridCols = 60;
    this.gridRows = 60;
    this.grid = Array.from({ length: this.gridRows }, () => Array(this.gridCols).fill(0));
    this.rooms = [];
    this.torches = [];
  }

  build() {
    this.generateRoomsAndCorridors();
    this.render3DWorld();
    return { 
      grid: this.grid, 
      rooms: this.rooms
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
        // Room 0 (Starting Room) is ALWAYS safe and completely monster-free!
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
          this.carveCorridor(Math.floor(prev.x + prev.w/2), Math.floor(x + w/2), Math.floor(prev.y + prev.h/2), Math.floor(y + h/2));
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
    const floorGeo = new THREE.BoxGeometry(this.tileSize, 0.4, this.tileSize);
    const wallGeo = new THREE.BoxGeometry(this.tileSize, 5.0, this.tileSize);

    const floorMat = new THREE.MeshStandardMaterial({ color: 0x4a4238, roughness: 0.7 });
    const safeFloorMat = new THREE.MeshStandardMaterial({ color: 0x2e5b75, roughness: 0.5 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x7c7c8c, roughness: 0.6, metalness: 0.1 });

    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const posX = c * this.tileSize;
        const posZ = r * this.tileSize;

        if (this.grid[r][c] > 0) {
          const mat = this.grid[r][c] === 2 ? safeFloorMat : floorMat;
          const floor = new THREE.Mesh(floorGeo, mat);
          floor.position.set(posX, -0.2, posZ);
          this.scene.add(floor);
        } else {
          if (this.hasAdjacentFloor(r, c)) {
            const wall = new THREE.Mesh(wallGeo, wallMat);
            wall.position.set(posX, 2.5, posZ);
            this.scene.add(wall);

            if (Math.random() < 0.05) {
              this.addSconce(posX, 3.0, posZ);
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

  addSconce(x, y, z) {
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffaa33 }));
    flame.position.set(x, y, z);
    this.scene.add(flame);

    const light = new THREE.PointLight(0xff9922, 2.0, 12);
    light.position.set(x, y, z);
    this.scene.add(light);
    this.torches.push(light);
  }
}
