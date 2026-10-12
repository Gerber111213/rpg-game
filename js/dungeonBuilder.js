export class DungeonBuilder {
  constructor(scene) {
    this.scene = scene;
    this.tileSize = 4;
    this.gridCols = 100;
    this.gridRows = 100;
    this.grid = Array.from({ length: this.gridRows }, () => Array(this.gridCols).fill(0));
    this.rooms = [];
    this.torches = [];
  }

  build() {
    this.generateRoomsAndCorridors();
    this.render3DWorld();
    return { grid: this.grid, rooms: this.rooms };
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
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) { this.grid[y1][x] = 1; this.grid[y1+1][x] = 1; }
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) { this.grid[y][x2] = 1; this.grid[y][x2+1] = 1; }
  }

  render3DWorld() {
    const floorGeo = new THREE.BoxGeometry(this.tileSize, 0.4, this.tileSize);
    const wallGeo = new THREE.BoxGeometry(this.tileSize, 5.0, this.tileSize);

    // Reliable materials that react perfectly to point lights and ambient lighting
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x3b302a, roughness: 0.8, metalness: 0.1 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x5a5561, roughness: 0.6, metalness: 0.2 });

    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const posX = c * this.tileSize;
        const posZ = r * this.tileSize;

        if (this.grid[r][c] > 0) {
          const floor = new THREE.Mesh(floorGeo, floorMat);
          floor.position.set(posX, -0.2, posZ);
          floor.receiveShadow = true;
          this.scene.add(floor);
        } else {
          const wall = new THREE.Mesh(wallGeo, wallMat);
          wall.position.set(posX, 2.5, posZ);
          wall.castShadow = true;
          wall.receiveShadow = true;
          this.scene.add(wall);

          if (Math.random() < 0.08) {
            this.addTorch(posX, 2.0, posZ);
          }
        }
      }
    }
  }

  addTorch(x, y, z) {
    const light = new THREE.PointLight(0xff7722, 3.0, 15);
    light.position.set(x, y, z);
    this.scene.add(light);
    this.torches.push(light);
  }
}
