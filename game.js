const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- GRID & MAP CONFIGURATION ---
const TILE_SIZE = 40; // Each tile is 40x40 pixels
const COLS = 20;      // 800px width / 40px = 20 columns
const ROWS = 15;      // 600px height / 40px = 15 rows

// Map Tile Definitions: 0 = Floor, 1 = Wall/Dungeon Obstacle, 2 = Door/Stairs
const dungeonMap = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1],
  [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 1, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

// --- PLAYER OBJECT ---
const player = {
  tileX: 1, // Grid column position
  tileY: 1, // Grid row position
  realX: 1 * TILE_SIZE + TILE_SIZE / 2,
  realY: 1 * TILE_SIZE + TILE_SIZE / 2,
  targetTileX: 1,
  targetTileY: 1,
  speed: 4
};

// Handle Tile Clicks
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const clickedTileX = Math.floor(mouseX / TILE_SIZE);
  const clickedTileY = Math.floor(mouseY / TILE_SIZE);

  // Check if tile is walkable (0 = floor, 2 = stairs)
  if (dungeonMap[clickedTileY] && dungeonMap[clickedTileY][clickedTileX] !== 1) {
    player.targetTileX = clickedTileX;
    player.targetTileY = clickedTileY;
  }
});

// Movement Logic (Interpolates smooth movement between tile centers)
function updatePlayer() {
  const targetRealX = player.targetTileX * TILE_SIZE + TILE_SIZE / 2;
  const targetRealY = player.targetTileY * TILE_SIZE + TILE_SIZE / 2;

  const dx = targetRealX - player.realX;
  const dy = targetRealY - player.realY;
  const dist = Math.hypot(dx, dy);

  if (dist > player.speed) {
    player.realX += (dx / dist) * player.speed;
    player.realY += (dy / dist) * player.speed;
  } else {
    player.realX = targetRealX;
    player.realY = targetRealY;
    player.tileX = player.targetTileX;
    player.tileY = player.targetTileY;
  }
}

// Render Tile Grid
function drawMap() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tile = dungeonMap[r][c];

      if (tile === 1) {
        // Wall
        ctx.fillStyle = '#2c2c3b';
        ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#181824';
        ctx.strokeRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      } else if (tile === 2) {
        // Stairs / Door
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      } else {
        // Walkable Floor
        ctx.fillStyle = '#141419';
        ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#1e1e28';
        ctx.strokeRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}

// Render Target Click Marker & Player
function drawEntities() {
  // Target Indicator
  const targetRealX = player.targetTileX * TILE_SIZE + TILE_SIZE / 2;
  const targetRealY = player.targetTileY * TILE_SIZE + TILE_SIZE / 2;

  if (player.realX !== targetRealX || player.realY !== targetRealY) {
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(targetRealX, targetRealY, 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Draw Player (Carl)
  ctx.fillStyle = '#00e5ff';
  ctx.beginPath();
  ctx.arc(player.realX, player.realY, TILE_SIZE / 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updatePlayer();
  drawMap();
  drawEntities();
  requestAnimationFrame(gameLoop);
}

gameLoop();
