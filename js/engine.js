// js/engine.js
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const SCREEN_WIDTH = canvas.width;
const SCREEN_HEIGHT = canvas.height;
const FOV = Math.PI / 3; // 60 degrees field of view
const MAX_DEPTH = 16;   // Max view distance

// Input tracking for smooth motion
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

function updatePlayer() {
    let moveSpeed = 0.04;
    let rotSpeed = 0.03;

    // Rotation controls (Left/Right arrows or A/D)
    if (keys['ArrowLeft'] || keys['a']) player.angle -= rotSpeed;
    if (keys['ArrowRight'] || keys['d']) player.angle += rotSpeed;

    // Movement calculations (Up/Down or W/S)
    let dx = Math.cos(player.angle) * moveSpeed;
    let dy = Math.sin(player.angle) * moveSpeed;

    let targetX = player.x;
    let targetY = player.y;

    if (keys['ArrowUp'] || keys['w']) {
        targetX += dx;
        targetY += dy;
    }
    if (keys['ArrowDown'] || keys['s']) {
        targetX -= dx;
        targetY -= dy;
    }

    // Grid collision check (Wall is 1, open space is 0)
    let gridX = Math.floor(targetX);
    let gridY = Math.floor(targetY);
    
    if (MAP_DATA.grid[gridY] && MAP_DATA.grid[gridY][gridX] === 0) {
        player.x = targetX;
        player.y = targetY;
    }
}

function castRays() {
    // 1. Draw Ceiling and Floor gradients
    ctx.fillStyle = "#111118"; // Ceiling
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT / 2);
    
    ctx.fillStyle = "#1f1f1f"; // Floor
    ctx.fillRect(0, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT / 2);

    // 2. Raycasting loop across screen columns
    let numRays = SCREEN_WIDTH;
    let halfFOV = FOV / 2;

    for (let i = 0; i < numRays; i++) {
        let rayAngle = player.angle - halfFOV + (i / numRays) * FOV;
        let distanceToWall = 0;
        let hitWall = false;

        let eyeX = Math.cos(rayAngle);
        let eyeY = Math.sin(rayAngle);

        while (!hitWall && distanceToWall < MAX_DEPTH) {
            distanceToWall += 0.05;
            let testX = Math.floor(player.x + eyeX * distanceToWall);
            let testY = Math.floor(player.y + eyeY * distanceToWall);

            if (testX < 0 || testX >= MAP_DATA.width || testY < 0 || testY >= MAP_DATA.height) {
                hitWall = true;
                distanceToWall = MAX_DEPTH;
            } else if (MAP_DATA.grid[testY][testX] === 1) {
                hitWall = true;
            }
        }

        // Correct fish-eye distortion
        let correctedDist = distanceToWall * Math.cos(rayAngle - player.angle);
        let wallHeight = Math.min(SCREEN_HEIGHT, (SCREEN_HEIGHT / correctedDist));
        let ceiling = (SCREEN_HEIGHT - wallHeight) / 2;

        // Distance-based lighting shading
        let shade = Math.max(10, 240 - (distanceToWall * 15));
        ctx.fillStyle = `rgb(${shade / 2}, ${shade / 3}, ${shade / 4})`;

        // Draw vertical wall strip
        ctx.fillRect(i, ceiling, 1, wallHeight);
    }
}

function gameLoop() {
    updatePlayer();
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    castRays();
    requestAnimationFrame(gameLoop);
}

gameLoop();
