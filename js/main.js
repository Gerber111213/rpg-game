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
    window.gameInstance = this;
    this.container = document.getElementById('game-container');
    this.currentFloor = 1;
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060609);
    this.scene.fog = new THREE.FogExp2(0x060609, 0.03);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.cameraOffset = new THREE.Vector3(0, 30, 22);

    const ambientLight = new THREE.AmbientLight(0x333344, 0.5);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x666688, 0.3);
    dirLight.position.set(20, 40, 20);
    this.scene.add(dirLight);

    this.audio = new AudioManager();
    this.inventory = new InventoryManager();
    this.combat = new CombatEngine(this.scene, this.inventory);

    this.initFloor();

    this.setupUI();
    this.setupMinimap();
    this.setupInputs();
    this.clock = new THREE.Clock();

    logMessage(`[SYSTEM AI]: Welcome to Floor 1. Right-click interactive objects for options.`, 'sys-msg');

    this.animate();
  }

  initFloor() {
    this.dungeon = new DungeonBuilder(this.scene);
    this.mapData = this.dungeon.build();

    const spawnRoom = this.mapData.rooms[0];
    const spawnX = spawnRoom.x * 4 + (spawnRoom.w * 2);
    const spawnZ = spawnRoom.y * 4 + (spawnRoom.h * 2);

    if (!this.carl) {
      this.carl = new Carl3D(this.scene, spawnX, spawnZ, this.mapData.grid);
      this.donut = new Donut3D(this.scene, spawnX - 2, spawnZ);
      this.mordecai = new Mordecai3D(this.scene, spawnX + 3, spawnZ);

      this.carlLight = new THREE.PointLight(0xff9944, 6.4, 28);
      this.carlLight.position.set(spawnX, 2.0, spawnZ);
      this.scene.add(this.carlLight);
    } else {
      this.carl.group.position.set(spawnX, 0, spawnZ);
      this.carl.grid = this.mapData.grid;
      this.donut.group.position.set(spawnX - 2, 0, spawnZ);
      this.mordecai.group.position.set(spawnX + 3, 0, spawnZ);
    }

    this.monsters = [];
    this.projectiles = [];
    this.spawnMonsters();
    this.targetPos = this.carl.getPosition().clone();
    this.isMouseDown = false;
    this.inSafeRoom = true;
  }

  setupUI() {
    const hud = document.createElement('div');
    hud.id = 'hud-overlay';
    hud.innerHTML = `
      <div class="hud-title">CRAWLER CARL (FLOOR <span id="floor-num">1</span>)</div>
      <div class="hud-row">HP: <span id="hp-text">100/100</span><div class="hp-bar-container"><div id="player-hp-fill"></div></div></div>
    `;
    document.body.appendChild(hud);

    // Spellbar Hotbar
    const spellbar = document.createElement('div');
    spellbar.id = 'spellbar';
    spellbar.innerHTML = `
      <div class="spell-slot" title="Magic Missile">✨<span>1</span></div>
      <div class="spell-slot" title="Health Potion">🧪<span>2</span></div>
      <div class="spell-slot" title="Donut Wrath">🐾<span>3</span></div>
    `;
    document.body.appendChild(spellbar);

    // Syndicate Banner
    const banner = document.createElement('div');
    banner.id = 'announcement-banner';
    banner.className = 'hidden';
    document.body.appendChild(banner);
  }

  showAnnouncement(text) {
    const banner = document.getElementById('announcement-banner');
    if (!banner) return;
    banner.textContent = text;
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 4000);
  }

  setupMinimap() {
    const container = document.createElement('div');
    container.id = 'minimap-container';
    container.innerHTML = `<canvas id="minimap-canvas" width="180" height="180"></canvas>`;
    document.body.appendChild(container);
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas.getContext('2d');
  }

  updateHUD() {
    const hpText = document.getElementById('hp-text');
    const hpFill = document.getElementById('player-hp-fill');
    const floorNum = document.getElementById('floor-num');
    if (hpText && hpFill) {
      hpText.textContent = `${this.carl.hp}/${this.carl.maxHp}`;
      hpFill.style.width = `${(this.carl.hp / this.carl.maxHp) * 100}%`;
    }
    if (floorNum) floorNum.textContent = this.currentFloor;
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

    // Left Click Attack
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
            const defeated = targetMonster.takeDamage(25);
            logMessage(`CARL strikes ${targetMonster.name} for 25 damage!`, 'combat-msg');
            if (defeated) {
              this.combat.handleCorpseCollapse(targetMonster);
              this.spawnBloodEffect(targetMonster.group.position);
              logMessage(`${targetMonster.name} was obliterated! Corpse ready for looting.`, 'sys-msg');
            }
          }
        }
      }
    });

    // Right-Click Context Menu Options
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // 1. Check Mordecai
      const mordecaiIntersect = this.raycaster.intersectObject(this.mordecai.group, true);
      if (mordecaiIntersect.length > 0 && this.carl.getPosition().distanceTo(this.mordecai.getPosition()) < 6.0) {
        this.showContextMenu(e.clientX, e.clientY, [
          { text: "Talk to Mordecai", action: () => this.showMordecaiDialogue() }
        ]);
        return;
      }

      // 2. Check Tutorial Chest
      if (this.mapData.tutorialChest && this.carl.getPosition().distanceTo(this.mapData.tutorialChest) < 5.0) {
        this.showContextMenu(e.clientX, e.clientY, [
          { text: "Open Tutorial Chest", action: () => {
            document.getElementById('inventory-modal').classList.remove('hidden');
            logMessage(`[CHEST]: Opened inventory & tutorial gear.`, 'sys-msg');
          }}
        ]);
        return;
      }

      // 3. Check Doors
      if (this.mapData.safeRoomDoors) {
        for (let door of this.mapData.safeRoomDoors) {
          if (this.carl.getPosition().distanceTo(door.position) < 5.0) {
            this.showContextMenu(e.clientX, e.clientY, [
              { text: "Use Blast Door / Enter", action: () => {
                logMessage(`[SYSTEM]: Blast door accessed. Safe room seal verified.`, 'sys-msg');
              }}
            ]);
            return;
          }
        }
      }

      // 4. Check Monster Corpses
      const monsterMeshes = this.monsters.map(m => m.torso);
      const hitMonsters = this.raycaster.intersectObjects(monsterMeshes);
      if (hitMonsters.length > 0) {
        const clickedMesh = hitMonsters[0].object;
        const targetMonster = this.monsters.find(m => m.torso === clickedMesh || m.group.children.includes(clickedMesh));
        if (targetMonster && targetMonster.isDead) {
          this.showContextMenu(e.clientX, e.clientY, [
            { text: `Loot ${targetMonster.name}`, action: () => {
              const msg = this.combat.lootCorpse(targetMonster);
              logMessage(msg, 'sys-msg');
            }}
          ]);
          return;
        }
      }

      // 5. Default Donut Inspection option
      this.showContextMenu(e.clientX, e.clientY, [
        { text: "Inspect Princess Donut's Inventory", action: () => {
          document.getElementById('inventory-modal').classList.remove('hidden');
          document.querySelector('.inv-tab[data-target="donut"]').click();
        }}
      ]);
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'i' || e.key === 'I') {
        document.getElementById('inventory-modal').classList.toggle('hidden');
      }
      if (e.key === '1') this.castSpell('magic_missile');
      if (e.key === '2' || e.key === 'q' || e.key === 'Q') {
        const potion = this.inventory.belt[0];
        if (potion) this.usePotion(potion);
      }
    });
  }

  spawnBloodEffect(pos) {
    const bloodGeo = new THREE.BufferGeometry();
    const count = 30;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = pos.x + (Math.random() - 0.5) * 1.5;
      positions[i+1] = 0.1;
      positions[i+2] = pos.z + (Math.random() - 0.5) * 1.5;
    }
    bloodGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const bloodMat = new THREE.PointsMaterial({ color: 0xcc0000, size: 0.2 });
    const bloodSplatter = new THREE.Points(bloodGeo, bloodMat);
    this.scene.add(bloodSplatter);
  }

  castSpell(type) {
    if (type === 'magic_missile') {
      const liveMonsters = this.monsters.filter(m => !m.isDead);
      if (liveMonsters.length > 0) {
        const nearest = liveMonsters.reduce((prev, curr) => 
          prev.group.position.distanceTo(this.carl.getPosition()) < curr.group.position.distanceTo(this.carl.getPosition()) ? prev : curr
        );
        if (nearest.group.position.distanceTo(this.carl.getPosition()) < 18.0) {
          this.audio.playSpell();
          const defeated = nearest.takeDamage(40);
          logMessage(`CARL casts MAGIC MISSILE for 40 arcane damage!`, 'combat-msg');
          if (defeated) {
            this.combat.handleCorpseCollapse(nearest);
            this.spawnBloodEffect(nearest.group.position);
          }
        }
      }
    }
  }

  usePotion(potion) {
    if (this.carl.hp < this.carl.maxHp) {
      this.carl.hp = Math.min(this.carl.maxHp, this.carl.hp + potion.heal);
      this.audio.playPotion();
      logMessage(`[ITEM]: Used Health Potion! Restored 50 HP.`, 'sys-msg');
      this.updateHUD();
      this.inventory.belt[0] = null;
      this.inventory.updateUI();
    } else {
      logMessage(`HP is already full!`, 'sys-msg');
    }
  }

  showMordecaiDialogue() {
    const modal = document.getElementById('dialogue-modal');
    const textEl = document.getElementById('dialogue-text');
    const optionsEl = document.getElementById('dialogue-options');
    if (!modal) return;

    modal.classList.remove('hidden');
    textEl.textContent = `"Listen up, Carl. Floor ${this.currentFloor} is escalating. Watch your step and keep Donut safe!"`;
    optionsEl.innerHTML = `
      <li data-reply="1">"How do we advance to the next floor?"</li>
      <li data-reply="2">"Close dialogue."</li>
    `;
    optionsEl.querySelectorAll('li').forEach(li => {
      li.onclick = (e) => {
        if (e.target.dataset.reply === "1") {
          textEl.textContent = `"Find the glowing stairwell at the far end of the labyrinth and step right on it."`;
        } else {
          modal.classList.add('hidden');
        }
      };
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
      li.onclick = () => { opt.action(); this.hideContextMenu(); };
      contextOptions.appendChild(li);
    });
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.classList.remove('hidden');
  }

  hideContextMenu() { if (contextMenu) contextMenu.classList.add('hidden'); }

  renderMinimap() {
    if (!this.minimapCtx) return;
    const ctx = this.minimapCtx;
    const width = this.minimapCanvas.width;
    const height = this.minimapCanvas.height;

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);

    const carlPos = this.carl.getPosition();
    const scale = 3.5;

    for (let m of this.monsters) {
      if (!m.isDead) {
        const mPos = m.group.position;
        const dx = (mPos.x - carlPos.x) * scale + width / 2;
        const dz = (mPos.z - carlPos.z) * scale + height / 2;
        if (dx >= 0 && dx <= width && dz >= 0 && dz <= height) {
          ctx.fillStyle = '#ff4444';
          ctx.beginPath(); ctx.arc(dx, dz, 3, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    const mordPos = this.mordecai.getPosition();
    const mdx = (mordPos.x - carlPos.x) * scale + width / 2;
    const mdz = (mordPos.z - carlPos.z) * scale + height / 2;
    if (mdx >= 0 && mdx <= width && mdz >= 0 && mdz <= height) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(mdx, mdz, 3.5, 0, Math.PI * 2); ctx.fill();
    }

    ctx.fillStyle = '#00ffff';
    ctx.beginPath(); ctx.arc(width / 2, height / 2, 4, 0, Math.PI * 2); ctx.fill();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();

    this.carl.moveTo(this.targetPos, delta);
    this.donut.follow(this.carl.getPosition(), delta);

    for (let m of this.monsters) {
      m.updateAI(this.carl.getPosition(), delta, {
        onMelee: (dmg) => {
          this.carl.hp = Math.max(0, this.carl.hp - dmg);
          logMessage(`[COMBAT]: ${m.name} strikes Carl for ${dmg} damage!`, 'combat-msg');
          this.updateHUD();
        }
      });
      m.updateUI(this.camera);
    }

    const carlPos = this.carl.getPosition();
    this.carlLight.position.set(carlPos.x, carlPos.y + 2.0, carlPos.z);

    if (this.mapData.stairwell && carlPos.distanceTo(this.mapData.stairwell) < 2.5) {
      this.currentFloor++;
      this.showAnnouncement(`[FLOOR ${this.currentFloor}]: Borant Corporation escalates the labyrinth!`);
      logMessage(`[SYNDICATE]: Advancing to Floor ${this.currentFloor}!`, 'sys-msg');
      this.initFloor();
    }

    this.renderMinimap();
    this.renderer.render(this.scene, this.camera);
  }
}

window.onload = () => { new Game3D(); };
