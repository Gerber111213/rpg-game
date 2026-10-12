export class DungeonBuilder {
  constructor(scene) {
    this.scene = scene;
    this.tileSize = 4; // 3D scale per grid block
    this.gridCols = 100;
    this.gridRows = 100;
    this.grid = Array.from({ length: this.gridRows }, () => Array(this.gridCols).fill(0));
    this.rooms = [];
    this.safeRooms = [];
  }

  build() {
    this.generateRoomsAndCorridors();
    this.createMaterials();
    this.render3DWorld();
    return { grid: this.grid, rooms: this.rooms, safeRooms: this.safeRooms };
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
        const isSafe = (i === 0); // First room is designated Safe Room
        for (let rx = x; rx < x + w; rx++) {
          for (let ry = y; ry < y + h; ry++) {
            this.grid[ry][rx] = isSafe ? 2 : 1; // 1 = Normal Floor, 2 = Safe Room Floor
          }
        }
        const roomObj = { x, y, w, h, isSafe };
        this.rooms.push(roomObj);
        if (isSafe) this.safeRooms.push(roomObj);

        // Connect corridors
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

  createMaterials() {
    // Dirt/Rock Floor Material
    this.floorMat = new THREE.MeshStandardMaterial({ color: 0x3b2d23, roughness: 0.9, metalness: 0.1 });
    this.safeFloorMat = new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.5, metalness: 0.3 });
    // Concrete/Manufactured Brick Wall Material
    this.wallMat = new THREE.MeshStandardMaterial({ color: 0x555259, roughness: 0.7, metalness: 0.2 });
  }

  render3DWorld() {
    const floorGeo = new THREE.BoxGeometry(this.tileSize, 0.4, this.tileSize);
    const wallGeo = new THREE.BoxGeometry(this.tileSize, 5.0, this.tileSize);

    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const posX = c * this.tileSize;
        const posZ = r * this.tileSize;

        if (this.grid[r][c] > 0) {
          // Render Floor
          const mat = this.grid[r][c] === 2 ? this.safeFloorMat : this.floorMat;
          const floor = new THREE.Mesh(floorGeo, mat);
          floor.position.set(posX, -0.2, posZ);
          floor.receiveShadow = true;
          this.scene.add(floor);
        } else {
          // Render Manufactured Wall
          const wall = new THREE.Mesh(wallGeo, this.wallMat);
          wall.position.set(posX, 2.5, posZ);
          wall.castShadow = true;
          wall.receiveShadow = true;
          this.scene.add(wall);
        }
      }
    }
  }
}
