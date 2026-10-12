const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Player Object (Carl)
const player = {
  x: 400,
  y: 300,
  targetX: 400,
  targetY: 300,
  speed: 3,
  size: 20
};

// Listen for mouse clicks (RuneScape Click-to-Move Mechanic)
canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  player.targetX = event.clientX - rect.left;
  player.targetY = event.clientY - rect.top;
});

// Update game mechanics
function update() {
  const dx = player.targetX - player.x;
  const dy = player.targetY - player.y;
  const distance = Math.hypot(dx, dy);

  if (distance > player.speed) {
    player.x += (dx / distance) * player.speed;
    player.y += (dy / distance) * player.speed;
  } else {
    player.x = player.targetX;
    player.y = player.targetY;
  }
}

// Render game frame
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw Player (Carl)
  ctx.fillStyle = '#00ffcc';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fill();

  // Draw Target Click Indicator
  if (player.x !== player.targetX || player.y !== player.targetY) {
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.targetX, player.targetY, 6, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Main Game Loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
