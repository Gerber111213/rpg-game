import * as THREE from 'three';
import { AudioManager } from './audioManager.js';
import { CombatEngine } from './combatEngine.js';
import { DungeonBuilder } from './dungeonBuilder.js';
import { InventoryManager } from './inventoryManager.js';
import { Carl3D, Donut3D, Mordecai3D } from './entities.js';
import { Monster3D } from './monster.js';
import { MinimapManager } from './minimap.js';

console.log("[SYSTEM AI]: Booting Dungeon Crawler Carl Complete Engine...");

let scene, camera, renderer;
let audioManager, combatEngine, dungeonBuilder, inventoryManager, minimapManager;
let carl, donut, mordecai;
let monsters = [];
let dungeonGrid = [];
let spawnX = 0, spawnZ = 0;
let clock = new THREE.Clock();

let isMouseDown = false;
let targetPosition = new THREE.Vector3();
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let planeMesh;

function init() {
    const container = document.getElementById('game-container');
    if (!container) return;

    // 1. Scene & Camera
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050508);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

    // 2. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // 4. Build Dungeon & Subsystems
    dungeonBuilder = new DungeonBuilder(scene);
    const dungeonData = dungeonBuilder.build();
    dungeonGrid = dungeonData.grid;

    audioManager = new AudioManager();
    inventoryManager = new InventoryManager();
    inventoryManager.game = window; 
    combatEngine = new CombatEngine(scene, inventoryManager);
    minimapManager = new MinimapManager();

    // Spawn Characters in First Safe Room
    const spawnRoom = dungeonData.rooms[0];
    spawnX = (spawnRoom.x + Math.floor(spawnRoom.w / 2)) * dungeonBuilder.tileSize;
    spawnZ = (spawnRoom.y + Math.floor(spawnRoom.h / 2)) * dungeonBuilder.tileSize;

    carl = new Carl3D(scene, spawnX, spawnZ, dungeonGrid);
    targetPosition.copy(carl.getPosition());

    donut = new Donut3D(scene, spawnX + 2, spawnZ, dungeonGrid);
    mordecai = new Mordecai3D(scene, spawnX - 2, spawnZ);

    // Spawn Monsters across OTHER rooms
    spawnMonsters(dungeonData);

    // Invisible Floor Plane for Click-and-Hold Raycasting
    const planeGeo = new THREE.PlaneGeometry(500, 500);
    const planeMat = new THREE.MeshBasicMaterial({ visible: false });
    planeMesh = new THREE.Mesh(planeGeo, planeMat);
    planeMesh.rotation.x = -Math.PI / 2;
    scene.add(planeMesh);

    // 5. Event Listeners
    window.addEventListener('resize', onWindowResize);
    
    window.addEventListener('mousedown', (e) => {
        if (carl && carl.isDead) return;
        if (e.button !== 0) return; 
        if (e.target.closest('#hud') || e.target.closest('#inventory-modal') || e.target.closest('#quick-belt') || e.target.closest('#heatmap-container')) return;
        isMouseDown = true;
        updateMouseTarget(e);
    });
    window.addEventListener('mousemove', (e) => {
        if (isMouseDown) updateMouseTarget(e);
    });
    window.addEventListener('mouseup', () => { isMouseDown = false; });

    const respawnBtn = document.getElementById('respawn-btn');
    if (respawnBtn) {
        respawnBtn.addEventListener('click', () => {
            const deathModal = document.getElementById('death-modal');
            if (deathModal) deathModal.classList.add('hidden');
            
            // Clean up old monster DOM tags and meshes
            monsters.forEach(m => {
                if (m.uiElement) m.uiElement.remove();
                if (m.group) scene.remove(m.group);
            });
            monsters = [];

            // Respawn Carl & Donut
            carl.respawn(spawnX, spawnZ);
            targetPosition.copy(carl.getPosition());
            if (donut) donut.group.position.set(spawnX + 2, 0, spawnZ);

            // Re-spawn fresh monsters across the dungeon
            spawnMonsters(dungeonData);
            minimapManager.exploredTiles.clear();

            logMessage("[SYSTEM AI]: Checkpoint reloaded. Back in action with Mordecai!");
        });
    }

    window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (e.target.closest('#hud') || e.target.closest('#inventory-modal') || e.target.closest('#quick-belt') || e.target.closest('#heatmap-container')) return;

        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const deadMonsters = monsters.filter(m => m.isDead && m.group);
        const monsterMeshes = deadMonsters.map(m => m.group);
        const intersects = raycaster.intersectObjects(monsterMeshes, true);

        if (intersects.length > 0) {
            let hitGroup = intersects[0].object;
            while (hitGroup.parent && !monsters.some(m => m.group === hitGroup)) {
                hitGroup = hitGroup.parent;
            }

            const targetMonster = monsters.find(m => m.group === hitGroup);
            if (targetMonster && targetMonster.isDead) {
                const message = combatEngine.lootCorpse(targetMonster);
                logMessage(`[SYSTEM AI]: ${message}`);
            }
        }
    });

    window.addEventListener('keydown', (e) => {
        if (carl && carl.isDead) return;

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
                        logMessage(`[SYSTEM AI]: Defeated ${m.name}! Corpse salvageable. Right-click body to loot.`);
                    }
                }
            });
        }
        if (e.key === 'p' || e.key === 'P') {
            triggerDonutLaser();
        }
    });

    animate();
    logMessage("[SYSTEM AI]: Engine initialized successfully.");
}

function spawnMonsters(dungeonData) {
    for (let i = 1; i < dungeonData.rooms.length; i++) {
        if (Math.random() < 0.7) {
            const r = dungeonData.rooms[i];
            const mx = (r.x + Math.floor(r.w / 2)) * dungeonBuilder.tileSize;
            const mz = (r.y + Math.floor(r.h / 2)) * dungeonBuilder.tileSize;
            const type = Math.random() < 0.5 ? 'Rage Ibis' : 'Goblin Scavenger';
            monsters.push(new Monster3D(scene, type, mx, mz, dungeonGrid));
        }
    }
}

function triggerDonutLaser() {
    audioManager.playSpell();
    logMessage(`[SYSTEM AI]: PRINCESS DONUT activates skill: Royal Laser Purr! Cyan death beams strike all surrounding foes!`);
    monsters.forEach(m => {
        if (!m.isDead && m.group.position.distanceTo(donut.getPosition()) < 8.0) {
            const killed = m.takeDamage(35);
            if (killed) {
                combatEngine.handleCorpseCollapse(m);
                logMessage(`[SYSTEM AI]: Donut obliterated ${m.name}! Such majesty! Right-click body to loot.`);
            }
        }
    });
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

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (carl) {
        carl.moveTo(targetPosition, delta);
        const carlPos = carl.getPosition();

        camera.position.set(carlPos.x, carlPos.y + 16, carlPos.z + 12);
        camera.lookAt(carlPos);

        if (donut) {
            donut.updateAI(carlPos, monsters, delta, (targetMonster) => {
                audioManager.playSpell();
                const killed = targetMonster.takeDamage(30);
                logMessage(`[SYSTEM AI]: Donut zaps ${targetMonster.name} with a mini laser purr!`);
                if (killed) {
                    combatEngine.handleCorpseCollapse(targetMonster);
                    logMessage(`[SYSTEM AI]: Donut defeated ${targetMonster.name}! Right-click body to loot.`);
                }
            });
        }

        if (carl.isDead) {
            const deathModal = document.getElementById('death-modal');
            if (deathModal && deathModal.classList.contains('hidden')) {
                deathModal.classList.remove('hidden');
                logMessage("[SYSTEM AI]: Carl has fallen. Respawn at checkpoint with Mordecai.");
            }
        }
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

    const canvas = document.getElementById('heatmap-canvas');
    if (canvas && carl) {
        minimapManager.drawFogOfWar(canvas, carl.getPosition(), dungeonGrid, dungeonBuilder, monsters);
    }

    renderer.render(scene, camera);
}

init();
