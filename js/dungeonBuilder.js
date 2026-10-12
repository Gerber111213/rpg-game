export class DungeonBuilder {
  constructor(scene) {
    this.scene = scene;
    this.tileSize = 4;
    this.gridCols = 100;
    this.gridRows = 100;
    this.grid = Array.from({ length: this.gridRows }, () => Array(this.gridCols).fill(0));
    this.rooms = [];
    this.torches = [];
    this.stairwellPosition = null;
  }

  build() {
    this.generateRoomsAndCorridors();
    this.placeStairwell();
    this.render3DWorld();
    return { grid: this.grid, rooms: this.rooms, stairwell: this.stairwellPosition };
  }

  generateRoomsAndCorridors() {
    const minSize = 6, maxSize = 14, targetRooms = 30;
    for (let i = 0; i < targetRooms; i++) {
      const w = Math.floor(Math.random() * (maxSize - minSize)) + minSize;
      const h = Math.floor(Math.random() * (maxSize - minSize)) + minSize;
      const x = Math.floor(Math.random() * (this.gridCols - w - 4)) + 2;
      const y = Math.floor(Math.random() * (this.gridRows - h - 4)) + 2;

      let overlap = false;
      for (let r of this.rooms) {
        if (x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y) {
          overlap = true;
          break;
        }
      }

      if (!overlap) {
        const isSafe = (i === 0);
        for (let rx = x; rx < x + w; rx++) {
          for (let ry = y; ry < y + h; ry++) {
            this.grid[ry][rx] = isSafe ? 2 : 1;
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
      if (y1 >= 0 && y1 < this.gridRows) this.grid[y1][x] = 1; 
      if (y1 + 1 >= 0 && y1 + 1 < this.gridRows) this.grid[y1 + 1][x] = 1; 
    }
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) { 
      if (x2 >= 0 && x2 < this.gridCols) this.grid[y][x2] = 1; 
      if (x2 + 1 >= 0 && x2 + 1 < this.gridCols) this.grid[y][x2 + 1] = 1; 
    }
  }

  placeStairwell() {
    if (this.rooms.length < 2) return;
    // Pick the furthest room from the spawn room (room 0)
    const spawnRoom = this.rooms[0];
    let furthestRoom = this.rooms[1];
    let maxDist = 0;

    for (let i = 1; i < this.rooms.length; i++) {
      const r = this.rooms[i];
      const dist = Math.hypot(r.x - spawnRoom.x, r.y - spawnRoom.y);
      if (dist > maxDist) {
        maxDist = dist;
        furthestRoom = r;
      }
    }

    const stairX = (furthestRoom.x + Math.floor(furthestRoom.w / 2)) * this.tileSize;
    const stairZ = (furthestRoom.y + Math.floor(furthestRoom.h / 2)) * this.tileSize;
    this.stairwellPosition = new THREE.Vector3(stairX, 0, stairZ);

    // Build 3D Stairwell Mesh
    const stairGroup = new THREE.Group();
    const stairMat = new THREE.MeshLambertMaterial({ color: 0x555566 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

    for (let s = 0; s < 4; s++) {
      const stepGeo = new THREE.BoxGeometry(2.0 - s * 0.4, 0.2, 2.0 - s * 0.4);
      const step = new THREE.Mesh(stepGeo, stairMat);
      step.position.set(0, s * 0.2, 0);
      stairGroup.add(step);
    }

    // Portal glowing core
    const coreGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 16);
    const core = new THREE.Mesh(coreGeo, glowMat);
    core.position.set(0, 0.8, 0);
    stairGroup.add(core);

    const stairLight = new THREE.PointLight(0x00ffff, 3.0, 10);
    stairLight.position.set(stairX, 1.5, stairZ);
    this.scene.add(stairLight);

    stairGroup.position.set(stairX, 0, stairZ);
    this.scene.add(stairGroup);
  }

  render3DWorld() {
    const floorGeo = new THREE.BoxGeometry(this.tileSize, 0.4, this.tileSize);
    const wallGeo = new THREE.BoxGeometry(this.tileSize, 5.0, this.tileSize);

    const floorMat = new THREE.MeshLambertMaterial({ color: 0x4a3b32 });
    const safeFloorMat = new THREE.MeshLambertMaterial({ color: 0x2b4c66 });
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x6e6875 });

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
          const wall = new THREE.Mesh(wallGeo, wallMat);
          wall.position.set(posX, 2.5, posZ);
          this.scene.add(wall);

          if (Math.random() < 0.05) {
            this.addTorch(posX, 3.0, posZ);
          }
        }
      }
    }
  }

  addTorch(x, y, z) {
    const flameGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(x, y, z);
    this.scene.add(flame);

    const light = new THREE.PointLight(0xffaa44, 2.5, 20);
    light.position.set(x, y, z);
    this.scene.add(light);
    this.torches.push(light);
  }
}
