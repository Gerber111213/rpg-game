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
    this.safeRoomDoors = [];
    this.tutorialChestPos = null;
  }

  build() {
    this.generateRoomsAndCorridors();
    this.placeStairwell();
    this.render3DWorld();
    return { 
      grid: this.grid, 
      rooms: this.rooms, 
      stairwell: this.stairwellPosition,
      safeRoomDoors: this.safeRoomDoors,
      tutorialChest: this.tutorialChestPos
    };
  }

  generateRoomsAndCorridors() {
    const minSize = 8, maxSize = 14, targetRooms = 30;
    for (let i = 0; i < targetRooms; i++) {
      const w = Math.floor(Math.random() * (maxSize - minSize)) + minSize;
      const h = Math.floor(Math.random() * (maxSize - minSize)) + minSize;
      const x = i === 0 ? 45 : Math.floor(Math.random() * (this.gridCols - w - 4)) + 2;
      const y = i === 0 ? 45 : Math.floor(Math.random() * (this.gridRows - h - 4)) + 2;

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

    const stairGroup = new THREE.Group();
    const stairMat = new THREE.MeshLambertMaterial({ color: 0x444455 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

    for (let s = 0; s < 5; s++) {
      const stepGeo = new THREE.BoxGeometry(2.4 - s * 0.4, 0.25, 2.4 - s * 0.4);
      const step = new THREE.Mesh(stepGeo, stairMat);
      step.position.set(0, s * 0.25, s * 0.2);
      stairGroup.add(step);
    }

    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.5, 16), glowMat);
    core.position.set(0, 1.2, 0.8);
    stairGroup.add(core);

    const stairLight = new THREE.PointLight(0x00ffff, 3.5, 12);
    stairLight.position.set(stairX, 2.0, stairZ);
    this.scene.add(stairLight);

    stairGroup.position.set(stairX, 0, stairZ);
    this.scene.add(stairGroup);
  }

  render3DWorld() {
    const floorGeo = new THREE.BoxGeometry(this.tileSize, 0.4, this.tileSize);
    const wallGeo = new THREE.BoxGeometry(this.tileSize, 5.0, this.tileSize);

    const floorMat = new THREE.MeshStandardMaterial({ color: 0x4c4238, roughness: 0.6 });
    const safeFloorMat = new THREE.MeshStandardMaterial({ color: 0x2a4d66, roughness: 0.5 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x8a8294, roughness: 0.7, metalness: 0.1 });

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

          if (Math.random() < 0.08) {
            this.addSconce(posX, 3.2, posZ);
          }
        }
      }
    }

    const spawnRoom = this.rooms[0];
    const introLight = new THREE.PointLight(0xfff5ee, 6.0, 35);
    introLight.position.set(
      (spawnRoom.x + spawnRoom.w / 2) * this.tileSize,
      3.5,
      (spawnRoom.y + spawnRoom.h / 2) * this.tileSize
    );
    this.scene.add(introLight);

    const chestX = (spawnRoom.x + 2) * this.tileSize;
    const chestZ = (spawnRoom.y + 2) * this.tileSize;
    const chestGroup = new THREE.Group();
    const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 0.8), new THREE.MeshLambertMaterial({ color: 0xc0392b }));
    chestMesh.position.y = 0.4;
    chestGroup.add(chestMesh);
    chestGroup.position.set(chestX, 0, chestZ);
    this.scene.add(chestGroup);
    this.tutorialChestPos = chestGroup.position;

    this.buildSafeRoomDoors();
  }

  buildSafeRoomDoors() {
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const frameMat = new THREE.MeshLambertMaterial({ color: 0x7f8c8d });
    const lightMat = new THREE.MeshBasicMaterial({ color: 0x2ecc71 });

    let count = 0;
    for (let room of this.rooms) {
      if (room.isSafe) {
        const colsToCheck = count === 0 ? [room.x + 2, room.x + room.w - 3] : [room.x + Math.floor(room.w / 2)];
        
        for (let doorCol of colsToCheck) {
          const doorRow = room.y - 1;
          if (doorRow >= 0 && this.grid[doorRow][doorCol] === 1) {
            const doorX = doorCol * this.tileSize;
            const doorZ = doorRow * this.tileSize;

            const doorGroup = new THREE.Group();
            doorGroup.add(new THREE.Mesh(new THREE.BoxGeometry(this.tileSize, 4.5, 0.6), frameMat)).position.set(0, 2.25, 0);
            
            const panel = new THREE.Mesh(new THREE.BoxGeometry(this.tileSize - 0.4, 4.0, 0.4), doorMat);
            panel.position.set(0, 2.0, 0);
            doorGroup.add(panel);

            const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), lightMat);
            beacon.position.set(0, 4.0, 0.3);
            doorGroup.add(beacon);

            const beaconLight = new THREE.PointLight(0x2ecc71, 2.0, 6);
            beaconLight.position.set(doorX, 4.0, doorZ);
            this.scene.add(beaconLight);

            doorGroup.position.set(doorX, 0, doorZ);
            this.scene.add(doorGroup);

            this.safeRoomDoors.push({
              position: new THREE.Vector3(doorX, 0, doorZ),
              mesh: doorGroup,
              isIntroDoor: (count === 0 && doorCol === colsToCheck[0]),
              room: room
            });
          }
        }
        count++;
      }
    }
  }

  addSconce(x, y, z) {
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffaa33 }));
    flame.position.set(x, y, z);
    this.scene.add(flame);

    const light = new THREE.PointLight(0xff9922, 3.0, 16);
    light.position.set(x, y, z);
    this.scene.add(light);
    this.torches.push(light);
  }
}
