// js/engine.js
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 768;
canvas.height = 432;

const SCREEN_WIDTH = canvas.width;
const SCREEN_HEIGHT = canvas.height;
const FOV = Math.PI / 3;
const MAX_DEPTH = 16;

const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

function updatePlayer() {
    if (typeof player === 'undefined') return;
    let moveSpeed = 0.04;
    let rotSpeed = 0.03;

    if (keys['ArrowLeft'] || keys['a']) player.angle -= rotSpeed;
    if (keys['ArrowRight'] || keys['d']) player.angle += rotSpeed;

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

    let gridX = Math.floor(targetX);
    let gridY = Math.floor(targetY);
    
    if (typeof MAP_DATA !== 'undefined' && MAP_DATA.grid[gridY] && MAP_DATA.grid[gridY][gridX] === 0) {
        player.x = targetX;
        player.y = targetY;
    }
}

function castRays() {
    // 1. Draw Ceiling and Floor
    ctx.fillStyle = "#1a1a24";
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT / 2);
    
    ctx.fillStyle = "#33333f";
    ctx.fillRect(0, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT / 2);

    if (typeof MAP_DATA === 'undefined' || typeof player === 'undefined') return;

    // 2. Raycasting loop
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

        let correctedDist = distanceToWall * Math.cos(rayAngle - player.angle);
        let wallHeight = Math.min(SCREEN_HEIGHT, (SCREEN_HEIGHT / correctedDist));
        let ceiling = (SCREEN_HEIGHT - wallHeight) / 2;

        let shade = Math.max(20, 255 - (distanceToWall * 14));
        ctx.fillStyle = `rgb(${shade}, ${shade / 2}, ${shade / 4})`;
        ctx.fillRect(i, ceiling, 1, wallHeight);
    }
}

function gameLoop() {
    updatePlayer();
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    castRays();
    requestAnimationFrame(gameLoop);
}

// Start game loop once DOM and scripts are verified
window.addEventListener('load', () => {
    gameLoop();
});
// Fallback direct call just in case
gameLoop();
