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
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060609);
    this.scene.fog = new THREE.FogExp2(0x060609, 0.035);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.cameraOffset = new THREE.Vector3(0, 30, 22);

    const ambientLight = new THREE.AmbientLight(0x222233, 0.4);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x444466, 0.3);
    dirLight.position.set(20, 40, 20);
    this.scene.add(dirLight);

    this.audio = new AudioManager();
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

    this.carlLight = new THREE.PointLight(0xff9944, 6.4, 28);
    this.carlLight.position.set(spawnX, 2.0, spawnZ);
    this.scene.add(this.carlLight);

    this.monsters = [];
    this.projectiles = [];
    this.spawnMonsters();

    this.targetPos = this.carl.getPosition().clone();
    this.isMouseDown = false;
    this.inSafeRoom = true;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.setupUI();
    this.setupInputs();
    this.clock = new THREE.Clock();

    logMessage(`[SYSTEM AI]: Welcome to Floor 1. Left door leads to Intro/Syndicate Broadcast; Right door leads to the Dungeon World!`, 'sys-msg');

    this.animate();
  }

  setupUI() {
    const hud = document.createElement('div');
    hud.id = 'hud-overlay';
    hud.innerHTML = `
      <div class="hud-title">CRAWLER CARL (LVL 1)</div>
      <div class="hud-row">HP: <span id="hp-text">100/100</span><div class="hp-bar-container"><div id="player-hp-fill"></div></div></div>
    `;
    document.body.appendChild(hud);
  }

  updateHUD() {
    const hpText = document.getElementById('hp-text');
    const hpFill = document.getElementById('player-hp-fill');
    if (hpText && hpFill) {
      hpText.textContent = `${this.carl.hp}/${this.carl.maxHp}`;
      hpFill.style.width = `${(this.carl.hp / this.carl.maxHp) * 100}%`;
    }
  }

  spawnMonsters() {
    for (let i = 1; i < this.mapData.rooms.length; i++) {
      const r = this.mapData.rooms[i];
      const mx = r.x * 4 + (r.w * 2);
      const mz = r.y * 4 + (r.h * 2);
      const type = Math.random() > 0.5 ? 'Rage Ibis' : 'Goblin Scavenger';
      this.monsters.push(new Monster3D(this.scene, type, mx, mz, this.mapData.grid));
    }
  }

  setupInputs() {
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isMouseDown = true;
        this.updateTargetFromMouse(e);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isMouseDown) {
        this.updateTargetFromMouse(e);
      }
    });

    window.addEventListener('mouseup', () => { this.isMouseDown = false; });

    window.addEventListener('click', (e) => {
      this.hideContextMenu();
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      
      const monsterMeshes = this.monsters.map(m => m.torso);
      const hitMonsters = this.raycaster.intersectObjects(monsterMeshes);
      
      if (hitMonsters.length > 0) {
        const clickedMesh = hitMonsters[0].object;
        const targetMonster = this.monsters.find(m => m.torso === clickedMesh || m.group.children.includes(clickedMesh));
        if (targetMonster && !targetMonster.isDead) {
          const dist = this.carl.getPosition().distanceTo(targetMonster.group.position);
          if (dist < 5.0) {
            this.audio.playSlash();
            this.showAttackSlash(targetMonster.group.position);
            const defeated = targetMonster.takeDamage(25);
            logMessage(`CARL strikes ${targetMonster.name} for 25 damage!`, 'combat-msg');
            if (defeated) {
              this.combat.handleCorpseCollapse(targetMonster);
              logMessage(`${targetMonster.name} was obliterated! Corpse ready for looting.`, 'sys-msg');
            }
          } else {
            logMessage(`Target too far away for melee strike.`, 'sys-msg');
          }
          return;
        }
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'i' || e.key === 'I') {
        const modal = document.getElementById('inventory-modal');
        if (modal) modal.classList.toggle('hidden');
      }
      if (e.key === '1') {
        const liveMonsters = this.monsters.filter(m => !m.isDead);
        if (liveMonsters.length > 0) {
          const nearest = liveMonsters.reduce((prev, curr) => 
            prev.group.position.distanceTo(this.carl.getPosition()) < curr.group.position.distanceTo(this.carl.getPosition()) ? prev : curr
          );
          if (nearest.group.position.distanceTo(this.carl.getPosition()) < 16.0) {
            this.audio.playShoot();
            const defeated = nearest.takeDamage(40);
            logMessage(`CARL casts MAGIC MISSILE! 40 arcane damage dealt to ${nearest.name}!`, 'combat-msg');
            if (defeated) {
              this.combat.handleCorpseCollapse(nearest);
              logMessage(`${nearest.name} was obliterated by magic!`, 'sys-msg');
            }
          }
        }
      }
    });

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);

      const monsterMeshes = this.monsters.map(m => m.torso);
      const hitMonsters = this.raycaster.intersectObjects(monsterMeshes);

      if (hitMonsters.length > 0) {
        const clickedMesh = hitMonsters[0].object;
        const targetMonster = this.monsters.find(m => m.torso === clickedMesh || m.group.children.includes(clickedMesh));
        
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
  }

  showAttackSlash(pos) {
    const slashGeo = new THREE.RingGeometry(0.5, 0.7, 12);
    const slashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const slash = new THREE.Mesh(slashGeo, slashMat);
    slash.position.copy(pos);
    slash.position.y += 1.0;
    slash.rotation.x = Math.PI / 2;
    this.scene.add(slash);

    setTimeout(() => {
      this.scene.remove(slash);
      slash.geometry.dispose();
      slash.material.dispose();
    }, 150);
  }

  spawnProjectile(fromPos, toPos) {
    const projGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const projMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
    const proj = new THREE.Mesh(projGeo, projMat);
    proj.position.copy(fromPos);
    proj.position.y += 1.0;
    this.scene.add(proj);

    this.projectiles.push({
      mesh: proj,
      dir: new THREE.Vector3().subVectors(toPos, fromPos).normalize(),
      speed: 12.0,
      life: 2.0
    });
  }

  updateTargetFromMouse(e) {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    if (intersects.length > 0) {
      this.targetPos.copy(intersects[0].point);
      this.targetPos.y = 0;
    }
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

  hideContextMenu() { if (contextMenu) contextMenu.classList.add('hidden'); }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();

    this.carl.moveTo(this.targetPos, delta);
    this.donut.follow(this.carl.getPosition(), delta);

    for (let m of this.monsters) {
      m.updateAI(this.carl.getPosition(), delta, {
        onMelee: (dmg) => {
          this.carl.hp = Math.max(0, this.carl.hp - dmg);
          this.audio.playHit();
          logMessage(`[COMBAT]: ${m.name} strikes Carl for ${dmg} damage!`, 'combat-msg');
          this.updateHUD();
          if (this.carl.hp <= 0) logMessage(`[FATAL]: Crawler Carl has perished!`, 'sys-msg');
        },
        onRanged: (fromPos, toPos) => {
          this.audio.playShoot();
          this.spawnProjectile(fromPos, toPos);
        }
      });
      m.updateUI(this.camera);
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.mesh.position.addScaledVector(p.dir, p.speed * delta);
      p.life -= delta;

      if (p.mesh.position.distanceTo(this.carl.getPosition()) < 1.0) {
        this.carl.hp = Math.max(0, this.carl.hp - 10);
        this.audio.playHit();
        logMessage(`[COMBAT]: Monster projectile hits Carl for 10 damage!`, 'combat-msg');
        this.updateHUD();
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      } else if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    const carlPos = this.carl.getPosition();
    this.carlLight.position.set(carlPos.x, carlPos.y + 2.0, carlPos.z);

    if (this.mapData.safeRoomDoors) {
      for (let door of this.mapData.safeRoomDoors) {
        if (carlPos.distanceTo(door.position) < 3.0) {
          if (door.isIntroDoor) {
            logMessage(`[SYNDICATE BROADCAST]: "Welcome Crawler! Borant Corporation reminds you that viewer ratings are mandatory for survival!"`, 'sys-msg');
          } else if (!this.inSafeRoom) {
            this.inSafeRoom = true;
            logMessage(`[SYNDICATE ANNOUNCEMENT]: Entered Safe Room sanctuary.`, 'sys-msg');
          }
        }
      }
    }

    if (this.mapData.stairwell && carlPos.distanceTo(this.mapData.stairwell) < 2.5) {
      this.audio.playVictory();
      logMessage(`[VICTORY]: Level 1 cleared! Advancing to Floor 2...`, 'sys-msg');
      const spawnRoom = this.mapData.rooms[0];
      carlPos.set(spawnRoom.x * 4 + (spawnRoom.w * 2), 0, spawnRoom.y * 4 + (spawnRoom.h * 2));
      this.targetPos.copy(carlPos);
    }

    this.camera.position.copy(carlPos).add(this.cameraOffset);
    this.camera.lookAt(carlPos.x, carlPos.y + 1, carlPos.z);

    this.renderer.render(this.scene, this.camera);
  }
}

window.onload = () => { new Game3D(); };
