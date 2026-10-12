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
    this.createHighDetailTextures();
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

  // --- PROCEDURAL HIGH-DETAIL CANVAS TEXTURES ---
  createHighDetailTextures() {
    this.floorMaterials = [];
    this.wallMaterials = [];

    // Generate 4 randomized high-res floor textures (dirt, rock, cracked slate)
    for (let i = 0; i < 4; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 512;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = i === 0 ? '#2b221e' : (i === 1 ? '#1f2421' : '#26222b');
      ctx.fillRect(0, 0, 512, 512);

      // Add high-detail noise & speckles
      for (let p = 0; p < 3000; p++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.08)';
        ctx.fillRect(Math.random() * 512, Math.random() * 512, Math.random() * 6 + 2, Math.random() * 6 + 2);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      this.floorMaterials.push(new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85, metalness: 0.1 }));
    }

    // Generate 4 randomized manufactured stone/brick wall textures
    for (let i = 0; i < 4; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 512;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#3d3a42';
      ctx.fillRect(0, 0, 512, 512);

      // Brick mortar lines
      ctx.strokeStyle = '#1a181c';
      ctx.lineWidth = 6;
      for (let y = 0; y < 512; y += 64) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
      }
      for (let x = 0; x < 512; x += 128) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
      }

      // Grit & weathering
      for (let p = 0; p < 2000; p++) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 4, 4);
      }

      const texture = new THREE.CanvasTexture(canvas);
      this.wallMaterials.push(new THREE.MeshStandardMaterial({ map: texture, roughness: 0.7, metalness: 0.2 }));
    }
  }

  render3DWorld() {
    const floorGeo = new THREE.BoxGeometry(this.tileSize, 0.4, this.tileSize);
    const wallGeo = new THREE.BoxGeometry(this.tileSize, 5.0, this.tileSize);

    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const posX = c * this.tileSize;
        const posZ = r * this.tileSize;

        if (this.grid[r][c] > 0) {
          const mat = this.floorMaterials[Math.floor(Math.random() * this.floorMaterials.length)];
          const floor = new THREE.Mesh(floorGeo, mat);
          floor.position.set(posX, -0.2, posZ);
          floor.receiveShadow = true;
          this.scene.add(floor);
        } else {
          const mat = this.wallMaterials[Math.floor(Math.random() * this.wallMaterials.length)];
          const wall = new THREE.Mesh(wallGeo, mat);
          wall.position.set(posX, 2.5, posZ);
          wall.castShadow = true;
          wall.receiveShadow = true;
          this.scene.add(wall);

          // Sporadic Wall Torches
          if (Math.random() < 0.08) {
            this.addTorch(posX, 2.0, posZ);
          }
        }
      }
    }
  }

  addTorch(x, y, z) {
    const bracketGeo = new THREE.BoxGeometry(0.2, 0.2, 0.4);
    const bracketMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const bracket = new THREE.Mesh(bracketGeo, bracketMat);
    bracket.position.set(x, y, z);
    this.scene.add(bracket);

    const flameGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(x, y + 0.3, z);
    this.scene.add(flame);

    const light = new THREE.PointLight(0xff7722, 2.0, 12);
    light.position.set(x, y + 0.3, z);
    this.scene.add(light);
    this.torches.push(light);
  }
}
