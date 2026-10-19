// js/engine.js
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE_SIZE = 50; // Size of each grid block in pixels

// Player state (Crawler Carl archetype)
let player = {
    x: 1, // Grid X
    y: 1, // Grid Y
    color: '#ff5555',
    radius: 15
};

// Tutorial state machine messages
const tutorialSteps = [
    { text: "System Announcement: The collapse has begun! Use Arrow Keys to move along the street.", check: () => true },
    { text: "Tutorial: Find the glowing golden stairwell descending into Floor 1.", check: () => mapAt(player.x, player.y) === 4 }
];
let currentStep = 0;

function mapAt(x, y) {
    if (y < 0 || y >= MAP_DATA.height || x < 0 || x >= MAP_DATA.width) return 0;
    return MAP_DATA.grid[y][x];
}

// Handle Keyboard Input
window.addEventListener('keydown', (e) => {
    let newX = player.x;
    let newY = player.y;

    if (e.key === 'ArrowUp') newY--;
    if (e.key === 'ArrowDown') newY++;
    if (e.key === 'ArrowLeft') newX--;
    if (e.key === 'ArrowRight') newX++;

    // Check collision against tile data
    let targetTileID = mapAt(newX, newY);
    let targetTile = TILES[targetTileID];

    if (targetTile && !targetTile.solid) {
        player.x = newX;
        player.y = newY;
        
        // Check win condition (stairwell)
        if (targetTile.isGoal) {
            document.getElementById("dialogue-box").innerText = "Achievement Unlocked: First Blood & Descent! Entering Floor 1...";
            document.getElementById("quest-tracker").innerText = "Objective Complete!";
        }
    }
});

// Render Loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Map Grid
    for (let y = 0; y < MAP_DATA.height; y++) {
        for (let x = 0; x < MAP_DATA.width; x++) {
            let tileID = MAP_DATA.grid[y][x];
            let tile = TILES[tileID];
            
            ctx.fillStyle = tile.color;
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            
            // Grid cell borders for clean Diablo-like tactical look
            ctx.strokeStyle = '#111';
            ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    // 2. Draw Player Character
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(
        (player.x * TILE_SIZE) + (TILE_SIZE / 2),
        (player.y * TILE_SIZE) + (TILE_SIZE / 2),
        player.radius,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    requestAnimationFrame(gameLoop);
}

// Start the loop
gameLoop();
