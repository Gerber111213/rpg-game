import { AudioManager } from './audioManager.js';
import { CombatEngine } from './combatEngine.js';
import { DungeonBuilder } from './dungeonBuilder.js';
import { InventoryManager } from './inventoryManager.js';
import { Carl3D, Donut3D, Monster3D, Mordecai3D } from './entities.js';

console.log("[SYSTEM AI]: Booting Dungeon Crawler Carl Complete Engine...");

let scene, camera, renderer;
let audioManager, combatEngine, dungeonBuilder, inventoryManager;
let carl, donut, mordecai;
let monsters = [];
let clock = new THREE.Clock();

let isMouseDown = false;
let targetPosition = new THREE.Vector3();
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let planeMesh;

function init() {
    const container = document.getElementById('game-container');
    if (!container) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050508);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    dungeonBuilder = new DungeonBuilder(scene);
    const dungeonData = dungeonBuilder.build();

    audioManager = new AudioManager();
    inventoryManager = new InventoryManager();
    inventoryManager.game = window;
    combatEngine = new CombatEngine(scene, inventoryManager);

    const spawnRoom = dungeonData.rooms[0];
    const spawnX = (spawnRoom.x + Math.floor(spawnRoom.w / 2)) * dungeonBuilder.tileSize;
    const spawnZ = (spawnRoom.y + Math.floor(spawnRoom.h / 2)) * dungeonBuilder.tileSize;

    carl = new Carl3D(scene, spawnX, spawnZ, dungeonData.grid);
    targetPosition.copy(carl.getPosition());

    donut = new Donut3D(scene, spawnX + 2, spawnZ);
    mordecai = new Mordecai3D(scene, spawnX - 2, spawnZ);

    for (let i = 1; i < dungeonData.rooms.length; i++) {
        if (Math.random() < 0.7) {
            const r = dungeonData.rooms[i];
            const mx = (r.x + Math.floor(r.w / 2)) * dungeonBuilder.tileSize;
            const mz = (r.y + Math.floor(r.h / 2)) * dungeonBuilder.tileSize;
            const type = Math.random() < 0.5 ? 'Rage Ibis' : 'Goblin Scavenger';
            monsters.push(new Monster3D(scene, type, mx, mz, dungeonData.grid));
        }
    }

    const planeGeo = new THREE.PlaneGeometry(500, 500);
    const planeMat = new THREE.MeshBasicMaterial({ visible: false });
    planeMesh = new THREE.Mesh(planeGeo, planeMat);
    planeMesh.rotation.x = -Math.PI / 2;
    scene.add(planeMesh);

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousedown', (e) => {
        if (e.target.closest('#hud') || e.target.closest('#inventory-modal') || e.target.closest('#quick-belt') || e.target.closest('#heatmap-container')) return;
        isMouseDown = true;
        updateMouseTarget(e);
    });
    window.addEventListener('mousemove', (e) => {
        if (isMouseDown) updateMouseTarget(e);
    });
    window.addEventListener('mouseup', () => { isMouseDown = false; });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'i' || e.key === 'I') {
            const modal = document.getElementById('inventory-modal');
            if (modal) {
                modal.classList.toggle('hidden');
                audioManager.playPotion();
            }
        }
        if (e.key === 'r' || e.key === 'R') {
            const running = carl.toggleRun();
            logMessage(`[SYSTEM AI]: Carl is now ${running ? 'RUNNING' : 'WALKING'}.`);
        }
        if (e.key === 'a' || e.key === 'A') {
            audioManager.playSpell();
            logMessage(`[SYSTEM AI]: Carl activates skill: Crush Counter! Area shockwave unleashed.`);
            monsters.forEach(m => {
                if (!m.isDead && m.group.position.distanceTo(carl.getPosition()) < 6.0) {
                    const killed = m.takeDamage(25);
                    if (killed) {
                        combatEngine.handleCorpseCollapse(m);
                        logMessage(`[SYSTEM AI]: Defeated ${m.name}! Corpse salvageable.`);
                    }
                }
            });
        }
    });

    animate();
    logMessage("[SYSTEM AI]: Engine initialized successfully.");
}

function updateMouseTarget(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(planeMesh);
    if (intersects.length > 0) {
        targetPosition.copy(intersects[0].point);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.usePotion = function(item, index) {
    if (item.type === 'potion') {
        carl.heal(item.heal);
        inventoryManager.removeItem('carl', index);
        audioManager.playPotion();
        logMessage(`[SYSTEM AI]: Carl consumed ${item.name} and recovered 50 HP.`);
    }
};

window.showContextMenu = function(x, y, item, bagName, index) {
    const menu = document.getElementById('context-menu');
    const options = document.getElementById('context-options');
    options.innerHTML = `<li>Use / Equip</li><li>Drop Item</li>`;
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.classList.remove('hidden');

    const closeMenu = () => {
        menu.classList.add('hidden');
        window.removeEventListener('click', closeMenu);
    };
    setTimeout(() => window.addEventListener('click', closeMenu), 10);
};

function logMessage(text) {
    const box = document.getElementById('log-box');
    if (box) {
        const p = document.createElement('p');
        p.className = 'sys-msg';
        p.textContent = text;
        box.appendChild(p);
        box.scrollTop = box.scrollHeight;
    }
}

function drawHeatmap() {
    const canvas = document.getElementById('heatmap-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const carlPos = carl.getPosition();
    const scale = 1.2;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.fillStyle = '#00ffcc';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    monsters.forEach(m => {
        if (!m.isDead) {
            const mPos = m.group.position;
            const dx = (mPos.x - carlPos.x) * scale;
            const dz = (mPos.z - carlPos.z) * scale;
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(cx + dx, cy + dz, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (carl) {
        carl.moveTo(targetPosition, delta);
        const carlPos = carl.getPosition();

        camera.position.set(carlPos.x, carlPos.y + 16, carlPos.z + 12);
        camera.lookAt(carlPos);

        if (donut) donut.follow(carlPos, delta);
    }

    monsters.forEach(m => {
        m.updateAI(carl.getPosition(), delta, {
            onMelee: (damage) => {
                carl.takeDamage(damage);
                audioManager.playSlash();
                logMessage(`[SYSTEM AI]: ${m.name} hit Carl for ${damage} damage!`);
            }
        });
        m.updateUI(camera);
    });

    drawHeatmap();
    renderer.render(scene, camera);
}

init();
