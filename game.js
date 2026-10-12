const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const contextMenu = document.getElementById('context-menu');
const contextOptions = document.getElementById('context-options');
const logBox = document.getElementById('log-box');

const TILE_SIZE = 48;
let cols = Math.floor(window.innerWidth / TILE_SIZE);
let rows = Math.floor(window.innerHeight / TILE_SIZE);

// Handle Fullscreen Resizing
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  cols = Math.floor(canvas.width / TILE_SIZE);
  rows = Math.floor(canvas.height / TILE_SIZE);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Dungeon Map Grid: 1 = Wall, 0 = Floor, 2 = Door
const dungeonMap = [];
function generateDungeon() {
  for (let r = 0; r < 50; r++) {
    dungeonMap[r] = [];
    for (let c = 0; c < 50; c++) {
      // Create outer boundaries and corridor walls
      if (r === 0 || c === 0 || r === 49 || c === 49 || (r % 4 === 0 && c % 4 === 0)) {
        dungeonMap[r][c] = 1;
      } else if (r % 6 === 0 && c % 2 !== 0) {
        dungeonMap[r][c] = (c % 3 === 0) ? 2 : 1; // Doors and walls
      } else {
        dungeonMap[r][c] = 0; // Walkable corridor
      }
    }
  }
}
generateDungeon();

// Player (Carl)
const player = {
  tileX: 2,
  tileY: 2,
  realX: 2 * TILE_SIZE + TILE_SIZE / 2,
  realY: 2 * TILE_SIZE + TILE_SIZE / 2,
  targetTileX: 2,
  targetTileY: 2,
  speed: 4
};

// Donut Companion
const donut = {
  realX: 2 * TILE_SIZE,
  realY: 2 * TILE_SIZE,
  speed: 3.5,
  attackRange: TILE_SIZE * 4,
  cooldown: 0
};

// Entities in Dungeon Floor 1
const entities = [
  { id: 1, name: 'Goblin Scavenger', tileX: 5, tileY: 2, hp: 25, type: 'mob' },
  { id: 2, name: 'Rage Shroom', tileX: 10, tileY: 5, hp: 40, type: 'mob' },
  { id: 3, name: 'Bronze Syndicate Box', tileX: 3, tileY: 4, type: 'box' }
];

// Visual Spell Projectiles
const spellProjectiles = [];

function logMessage(text, className = '') {
  const p = document.createElement('p');
  p.className = className;
  p.textContent = text;
  logBox.appendChild(p);
  logBox.scrollTop = logBox.scrollHeight;
}

// Controls: Movement
canvas.addEventListener('click', (e) => {
  hideContextMenu();
  const rect = canvas.getBoundingClientRect();
  const clickTileX = Math.floor((e.clientX - rect.left) / TILE_SIZE);
  const clickTileY = Math.floor((e.clientY - rect.top) / TILE_SIZE);

  if (dungeonMap[clickTileY] && dungeonMap[clickTileY][clickTileX] !== 1) {
    player.targetTileX = clickTileX;
    player.targetTileY = clickTileY;
  }
});

// Controls: Context Menu
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const tileX = Math.floor((e.clientX - rect.left) / TILE_SIZE);
  const tileY = Math.floor((e.clientY - rect.top) / TILE_SIZE);

  const targetEntity = entities.find(ent => ent.tileX === tileX && ent.tileY === tileY);
  showContextMenu(e.clientX, e.clientY, tileX, tileY, targetEntity);
});

function showContextMenu(screenX, screenY, tileX, tileY, entity) {
  contextOptions.innerHTML = '';

  if (entity) {
    if (entity.type === 'mob') {
      addMenuOption(`Attack ${entity.name}`, () => {
        player.targetTileX = entity.tileX;
        player.targetTileY = entity.tileY;
        logMessage(`Carl advances to smash the ${entity.name}!`, 'combat-msg');
      });
      addMenuOption(`Examine ${entity.name}`, () => {
        logMessage(`[AI]: It's a standard level 1 floor inhabitant. Try not to die.`, 'sys-msg');
      });
    } else if (entity.type === 'box') {
      addMenuOption(`Smash ${entity.name}`, () => {
        logMessage(`You crushed the Bronze Box! Obtained: Dirty Bandage.`, 'sys-msg');
      });
    }
  }

  if (dungeonMap[tileY] && dungeonMap[tileY][tileX] !== 1) {
    addMenuOption('Walk Here', () => {
      player.targetTileX = tileX;
      player.targetTileY = tileY;
    });
  }

  contextMenu.style.left = `${screenX}px`;
  contextMenu.style.top = `${screenY}px`;
  contextMenu.classList.remove('hidden');
}

function addMenuOption(text, action) {
  const li = document.createElement('li');
  li.textContent = text;
  li.addEventListener('click', () => { action(); hideContextMenu(); });
  contextOptions.appendChild(li);
}

function hideContextMenu() { contextMenu.classList.add('hidden'); }

// --- GAME UPDATES ---
function update() {
  // Move Player
  const targetX = player.targetTileX * TILE_SIZE + TILE_SIZE / 2;
  const targetY = player.targetTileY * TILE_SIZE + TILE_SIZE / 2;
  const pdx = targetX - player.realX;
  const pdy = targetY - player.realY;
  const pdist = Math.hypot(pdx, pdy);

  if (pdist > player.speed) {
    player.realX += (pdx / pdist) * player.speed;
    player.realY += (pdy / pdist) * player.speed;
  } else {
    player.realX = targetX;
    player.realY = targetY;
    player.tileX = player.targetTileX;
    player.tileY = player.targetTileY;
  }

  // AI Companion Donut (Follow Carl)
  const ddx = player.realX - donut.realX;
  const ddy = player.realY - donut.realY;
  const ddist = Math.hypot(ddx, ddy);

  if (ddist > TILE_SIZE * 1.5) {
    donut.realX += (ddx / ddist) * donut.speed;
    donut.realY += (ddy / ddist) * donut.speed;
  }

  // Donut AI Combat (Magic Missile Range Check)
  if (donut.cooldown <= 0) {
    entities.forEach(ent => {
      if (ent.type === 'mob' && ent.hp > 0) {
        const entX = ent.tileX * TILE_SIZE + TILE_SIZE / 2;
        const entY = ent.tileY * TILE_SIZE + TILE_SIZE / 2;
        const range = Math.hypot(entX - donut.realX, entY - donut.realY);

        if (range <= donut.attackRange) {
          // Cast Magic Missile
          spellProjectiles.push({
            x: donut.realX, y: donut.realY,
            targetX: entX, targetY: entY,
            speed: 7, targetEntity: ent
          });
          donut.cooldown = 120; // Attack cooldown ticks
          logMessage(`DONUT: "DIE, YOU DISGUSTING CREATURE!"`, 'donut-msg');
          logMessage(`Donut cast [Magic Missile]!`, 'combat-msg');
        }
      }
    });
  } else {
    donut.cooldown--;
  }

  // Update Projectiles
  for (let i = spellProjectiles.length - 1; i >= 0; i--) {
    const proj = spellProjectiles[i];
    const dx = proj.targetX - proj.x;
    const dy = proj.targetY - proj.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 8) {
      proj.targetEntity.hp -= 15;
      logMessage(`[Magic Missile] struck ${proj.targetEntity.name} for 15 damage!`, 'combat-msg');
      if (proj.targetEntity.hp <= 0) {
        logMessage(`${proj.targetEntity.name} was obliterated!`, 'sys-msg');
      }
      spellProjectiles.splice(i, 1);
    } else {
      proj.x += (dx / dist) * proj.speed;
      proj.y += (dy / dist) * proj.speed;
    }
  }
}

// --- RENDER GAME WORLD ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Render Labyrinth Tiles
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = dungeonMap[r] ? dungeonMap[r][c] : 1;
      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;

      if (tile === 1) {
        // Dungeon Wall
        ctx.fillStyle = '#1c1b24';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#0d0d12';
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
      } else if (tile === 2) {
        // Doorway
        ctx.fillStyle = '#6e4723';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      } else {
        // Dungeon Floor
        ctx.fillStyle = '#0f0f14';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#181822';
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  // Render Mobs / Objects
  entities.forEach(ent => {
    if (ent.hp === undefined || ent.hp > 0) {
      const x = ent.tileX * TILE_SIZE + TILE_SIZE / 4;
      const y = ent.tileY * TILE_SIZE + TILE_SIZE / 4;
      ctx.fillStyle = ent.type === 'mob' ? '#44cc44' : '#cd7f32';
      ctx.fillRect(x, y, TILE_SIZE / 2, TILE_SIZE / 2);
    }
  });

  // Render Spell Projectiles
  spellProjectiles.forEach(proj => {
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  // Render Donut (Persian Cat)
  ctx.fillStyle = '#ffffff'; // White fluffy body
  ctx.beginPath();
  ctx.arc(donut.realX, donut.realY, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff88cc'; // Crown
  ctx.fillRect(donut.realX - 5, donut.realY - 14, 10, 4);

  // Render Carl (Heart Boxers & Tactical Rig)
  const cx = player.realX;
  const cy = player.realY;

  // Bare legs/feet
  ctx.fillStyle = '#e0ac69';
  ctx.fillRect(cx - 6, cy + 2, 4, 10);
  ctx.fillRect(cx + 2, cy + 2, 4, 10);

  // Pink Heart Boxer Shorts
  ctx.fillStyle = '#ff66b2';
  ctx.fillRect(cx - 8, cy - 4, 16, 8);

  // Tactical Vest/Rig
  ctx.fillStyle = '#2b2b2b';
  ctx.fillRect(cx - 7, cy - 14, 14, 10);

  // Head
  ctx.fillStyle = '#e0ac69';
  ctx.beginPath();
  ctx.arc(cx, cy - 18, 7, 0, Math.PI * 2);
  ctx.fill();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
