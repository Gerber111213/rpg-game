import { DungeonBuilder } from './dungeonBuilder.js';
import { Carl3D } from './entities/carl.js';
import { Donut3D } from './entities/donut.js';
import { Mordecai3D } from './entities/mordecai.js';
import { Monster3D } from './entities/monsters.js';
import { CombatEngine } from './combat.js';
import { AudioManager } from './audioManager.js';
import { InventoryManager } from './inventory.js';

const logBox = document.getElementById('log-box');
const contextMenu = document.getElementById('context-menu');
const contextOptions = document.getElementById('context-options');

function logMessage(text, className = '') {
  const p = document.createElement('p');
  p.className = className;
  p.textContent = text;
  if (logBox) {
    logBox.appendChild(p);
    logBox.scrollTop = logBox.scrollHeight;
  }
}

class Game3D {
  constructor() {
    this.container = document.getElementById('game-container');
    
    // Scene setup with dark dungeon atmosphere and fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060609);
    this.scene.fog = new THREE.FogExp2(0x060609, 0.035); // Atmospheric dark fog

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.cameraOffset = new THREE.Vector3(0, 30, 22);

    // Dim ambient light so the dungeon feels dark and foreboding
    const ambientLight = new THREE.AmbientLight(0x222233, 0.4);
    this.scene.add(ambientLight);

    // Subtle overhead directional light
    const dirLight = new THREE.DirectionalLight(0x444466, 0.3);
    dirLight.position.set(20, 40, 20);
    this.scene.add(dirLight);

    this.audio = new AudioManager();
    this.audio.attachToCamera(this.camera);

    this.inventory = new InventoryManager();
    this.combat = new CombatEngine(this.scene, this.inventory);

    this.dungeon = new DungeonBuilder(this.scene);
    this.mapData = this.dungeon.build();

    const spawnRoom = this.mapData.rooms[0];
    const spawnX = spawnRoom.x * 4 + (spawnRoom.w * 2);
    const spawnZ = spawnRoom.y * 4 + (spawnRoom.h * 2);

    this.carl = new Carl3D(this.scene, spawnX, spawnZ, this.mapData.grid);
    this.donut = new Donut3D(this.scene, spawnX - 2, spawnZ);
    this.mordecai = new Mordecai3D(this.scene, spawnX + 3, spawnZ);

    // Carl's personal torch light remains warm and bright around him
    this.carlLight = new THREE.PointLight(0xff8833, 3.2, 16);
    this.carlLight.position.set(spawnX, 2.0, spawnZ);
    this.scene.add(this.carlLight);

    this.monsters = [];
    this.projectiles = [];
    this.donutCooldown = 0;

    this.spawnMonsters();

    this.targetPos = this.carl.getPosition().clone();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.setupInputs();
    this.clock = new THREE.Clock();

    logMessage(`[SYSTEM AI]: Floor 1 darkened. Crawler Carl, watch your step in the shadows!`, 'sys-msg');

    this.animate();
  }

  spawnMonsters() {
    for (let i = 1; i < this.mapData.rooms.length; i++) {
      const r = this.mapData.rooms[i];
      const mx = r.x * 4 + (r.w * 2);
      const mz = r.y * 4 + (r.h * 2);
      const type = Math.random() > 0.5 ? 'Rage Ibis' : 'Goblin Scavenger';
      this.monsters.push(new Monster3D(this.scene, type, mx, mz));
    }
  }

  setupInputs() {
    window.addEventListener('click', (e) => {
      this.hideContextMenu();
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      
      const monsterMeshes = this.monsters.map(m => m.mesh);
      const hitMonsters = this.raycaster.intersectObjects(monsterMeshes);
      
      if (hitMonsters.length > 0) {
        const clickedMesh = hitMonsters[0].object;
        const targetMonster = this.monsters.find(m => m.mesh === clickedMesh);
        if (targetMonster && !targetMonster.isDead) {
          const defeated = targetMonster.takeDamage(20);
          logMessage(`CARL strikes ${targetMonster.name} for 20 damage!`, 'combat-msg');
          if (defeated) {
            this.combat.handleCorpseCollapse(targetMonster);
            logMessage(`${targetMonster.name} was obliterated! Corpse ready for looting.`, 'sys-msg');
          }
          return;
        }
      }

      const intersects = this.raycaster.intersectObjects(this.scene.children, true);
      if (intersects.length > 0) {
        this.targetPos.copy(intersects[0].point);
        this.targetPos.y = 0;
      }
    });

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);

      const monsterMeshes = this.monsters.map(m => m.mesh);
      const hitMonsters = this.raycaster.intersectObjects(monsterMeshes);

      if (hitMonsters.length > 0) {
        const clickedMesh = hitMonsters[0].object;
        const targetMonster = this.monsters.find(m => m.mesh === clickedMesh);
        
        if (targetMonster && targetMonster.isDead) {
          this.showContextMenu(e.clientX, e.clientY, [
            {
              text: `Loot ${targetMonster.name} Corpse`,
              action: () => {
                const msg = this.combat.lootCorpse(targetMonster);
                logMessage(msg, 'sys-msg');
              }
            }
          ]);
          return;
        }
      }
      this.hideContextMenu();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'i' || e.key === 'I') {
        const modal = document.getElementById('inventory-modal');
        if (modal) modal.classList.toggle('hidden');
      }
    });
  }

  showContextMenu(x, y, options) {
    if (!contextMenu || !contextOptions) return;
    contextOptions.innerHTML = '';
    options.forEach(opt => {
      const li = document.createElement('li');
      li.textContent = opt.text;
      li.addEventListener('click', () => {
        opt.action();
        this.hideContextMenu();
      });
      contextOptions.appendChild(li);
    });
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.classList.remove('hidden');
  }

  hideContextMenu() {
    if (contextMenu) contextMenu.classList.add('hidden');
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();

    this.carl.moveTo(this.targetPos, delta);
    this.donut.follow(this.carl.getPosition(), delta);

    for (let m of this.monsters) {
      m.updateAI(this.carl.getPosition(), delta);
    }

    const carlPos = this.carl.getPosition();
    this.carlLight.position.set(carlPos.x, carlPos.y + 2.0, carlPos.z);

    this.camera.position.copy(carlPos).add(this.cameraOffset);
    this.camera.lookAt(carlPos.x, carlPos.y + 1, carlPos.z);

    this.renderer.render(this.scene, this.camera);
  }
}

window.onload = () => { new Game3D(); };
