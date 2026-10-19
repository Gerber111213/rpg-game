export class MinimapManager {
  constructor() {
    this.exploredTiles = new Set();
  }

  drawFogOfWar(canvas, carlPos, dungeonGrid, dungeonBuilder, monsters) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const tileSize = dungeonBuilder.tileSize;
    const carlCol = Math.floor(carlPos.x / tileSize + 0.5);
    const carlRow = Math.floor(carlPos.z / tileSize + 0.5);

    // Reveal tiles within line-of-sight radius
    const visionRadius = 8;
    for (let r = carlRow - visionRadius; r <= carlRow + visionRadius; r++) {
      for (let c = carlCol - visionRadius; c <= carlCol + visionRadius; c++) {
        if (r >= 0 && r < dungeonGrid.length && c >= 0 && c < dungeonGrid[0].length) {
          const dist = Math.hypot(c - carlCol, r - carlRow);
          if (dist <= visionRadius) {
            this.exploredTiles.add(`${c},${r}`);
          }
        }
      }
    }

    const scale = 3.5; 
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Render explored dungeon map tiles (Fog of War)
    this.exploredTiles.forEach(coordStr => {
      const [c, r] = coordStr.split(',').map(Number);
      const tileX = c * tileSize;
      const tileZ = r * tileSize;

      const dx = (tileX - carlPos.x) * scale;
      const dz = (tileZ - carlPos.z) * scale;

      if (Math.abs(dx) < canvas.width && Math.abs(dz) < canvas.height) {
        const tileVal = dungeonGrid[r][c];
        if (tileVal > 0) {
          ctx.fillStyle = tileVal === 2 ? '#2e5b75' : '#332b22'; // Safe room floor vs standard floor
        } else {
          ctx.fillStyle = '#1a1a24'; // Wall
        }
        ctx.fillRect(cx + dx - 1.5, cy + dz - 1.5, 3, 3);
      }
    });

    // Draw Monsters (Red Dots if explored)
    monsters.forEach(m => {
      if (!m.isDead) {
        const mPos = m.group.position;
        const mc = Math.floor(mPos.x / tileSize + 0.5);
        const mr = Math.floor(mPos.z / tileSize + 0.5);
        if (this.exploredTiles.has(`${mc},${mr}`)) {
          const dx = (mPos.x - carlPos.x) * scale;
          const dz = (mPos.z - carlPos.z) * scale;
          ctx.fillStyle = '#e74c3c';
          ctx.beginPath();
          ctx.arc(cx + dx, cy + dz, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    // Draw Carl (Cyan Dot)
    ctx.fillStyle = '#00ffcc';
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
