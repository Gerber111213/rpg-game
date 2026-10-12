const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const contextMenu = document.getElementById('context-menu');
const contextOptions = document.getElementById('context-options');

// --- GRID CONFIGURATION ---
const TILE_SIZE = 40;
const COLS = 20;
const ROWS = 15;

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

// --- PLAYER ---
const player = {
  tileX: 1,
  tileY: 1,
  realX: 1 * TILE_SIZE + TILE_SIZE / 2,
  realY: 1 * TILE_SIZE + TILE_SIZE / 2,
  targetTileX: 1,
  targetTileY: 1,
  speed: 4
};

// --- INTERACTIVE ENTITIES IN THE DUNGEON ---
const entities = [
  { id: 1, name: 'Goblin Hoarder', tileX: 4, tileY: 1, color: '#44aa44', type: 'mob', hp: 20 },
  { id: 2, name: 'Princess Donut', tileX: 2, tileY: 1, color: '#ff69b4', type: 'npc' },
  { id: 3, name: 'Bronze Loot Box', tileX: 6, tileY: 3, color: '#cd7f32', type: 'object' }
];

// --- LEFT CLICK (MOVEMENT & CLOSING MENU) ---
canvas.addEventListener('click', (e) => {
  hideContextMenu();
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const clickedTileX = Math.floor(mouseX / TILE_SIZE);
  const clickedTileY = Math.floor(mouseY / TILE_SIZE);

  if (dungeonMap[clickedTileY] && dungeonMap[clickedTileY][clickedTileX] !== 1) {
    player.targetTileX = clickedTileX;
    player.targetTileY = clickedTileY;
  }
});

// --- RIGHT CLICK (CONTEXT MENU) ---
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault(); // Prevent standard browser right-click menu

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const tileX = Math.floor(mouseX / TILE_SIZE);
  const tileY = Math.floor(mouseY / TILE_SIZE);

  // Check if an entity exists on clicked tile
  const clickedEntity = entities.find(ent => ent.tileX === tileX && ent.tileY === tileY);

  showContextMenu(e.clientX, e.clientY, tileX, tileY, clickedEntity);
});

function showContextMenu(screenX, screenY, tileX, tileY, entity) {
  contextOptions.innerHTML = '';

  if (entity) {
    if (entity.type === 'mob') {
      addMenuOption(`Attack ${entity.name}`, () => attackEntity(entity));
      addMenuOption(`Examine ${entity.name}`, () => alert(`An annoying ${entity.name} with ${entity.hp} HP.`));
    } else if (entity.type === 'npc') {
      addMenuOption(`Talk to ${entity.name}`, () => alert(`"Carl! What are you wearing?!"`));
      addMenuOption(`Examine ${entity.name}`, () => alert("A tortoiseshell Persian cat who judges your choices."));
    } else if (entity.type === 'object') {
      addMenuOption(`Open ${entity.name}`, () => alert("You opened the box! Obtained: Extra Spicy Sauce."));
      addMenuOption(`Examine ${entity.name}`, () => alert("A shiny Bronze Loot Box provided by the Syndicate."));
    }
  }

  // Always show "Walk Here" option
  if (dungeonMap[tileY] && dungeonMap[tileY][tileX] !== 1) {
    addMenuOption('Walk Here', () => {
      player.targetTileX = tileX;
      player.targetTileY = tileY;
    });
  }

  addMenuOption('Cancel', hideContextMenu);

  contextMenu.style.left = `${screenX}px`;
  contextMenu.style.top = `${screenY}px`;
  contextMenu.classList.remove('hidden');
}

function addMenuOption(text, action) {
  const li = document.createElement('li');
  li.textContent = text;
  li.addEventListener('click', () => {
    action();
    hideContextMenu();
  });
  contextOptions.appendChild(li);
}

function hideContextMenu() {
  contextMenu.classList.add('hidden');
}

function attackEntity(mob) {
  alert(`You attack the ${mob.name}!`);
}

// --- UPDATE & DRAW LOOPS ---
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

function drawMap() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tile = dungeonMap[r][c];

      if (tile === 1) {
        ctx.fillStyle = '#2c2c3b';
        ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#181824';
        ctx.strokeRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      } else if (tile === 2) {
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      } else {
        ctx.fillStyle = '#141419';
        ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#1e1e28';
        ctx.strokeRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}

function drawEntities() {
  // Draw Entities (Mobs, NPCs, Boxes)
  entities.forEach(ent => {
    ctx.fillStyle = ent.color;
    ctx.fillRect(ent.tileX * TILE_SIZE + 8, ent.tileY * TILE_SIZE + 8, TILE_SIZE - 16, TILE_SIZE - 16);
  });

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
