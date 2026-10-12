export class Monster3D {
  constructor(scene, type, x, z, dungeonGrid) {
    this.scene = scene;
    this.type = type;
    this.hp = type === 'Rage Ibis' ? 45 : 30;
    this.maxHp = this.hp;
    this.name = type === 'Rage Ibis' ? 'Rage Ibis [Level 1]' : 'Goblin Scavenger [Level 1]';
    this.isDead = false;
    this.grid = dungeonGrid;
    this.tileSize = 4;
    this.speed = 3.0;
    this.attackCooldown = 0;
    this.rangedCooldown = 0;

    this.group = new THREE.Group();

    const skinMat = new THREE.MeshLambertMaterial({ color: type === 'Rage Ibis' ? 0xcc2222 : 0x2e7d32 });
    const detailMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

    const bodyGeo = new THREE.BoxGeometry(0.9, 1.2, 0.6);
    this.torso = new THREE.Mesh(bodyGeo, skinMat);
    this.torso.position.y = 0.9;
    this.group.add(this.torso);

    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.9;
    this.torso.add(head);

    const limbGeo = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    this.leftArm = new THREE.Mesh(limbGeo, detailMat);
    this.leftArm.position.set(-0.55, 0, 0);
    this.torso.add(this.leftArm);

    this.rightArm = new THREE.Mesh(limbGeo, detailMat);
    this.rightArm.position.set(0.55, 0, 0);
    this.torso.add(this.rightArm);

    this.group.position.set(x, 0, z);
    this.scene.add(this.group);

    this.createUIElement();
    this.wanderTimer = Math.random() * 3;
    this.wanderDir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
  }

  createUIElement() {
    this.uiElement = document.createElement('div');
    this.uiElement.className = 'monster-tag';
    this.uiElement.innerHTML = `
      <div class="m-name">${this.name}</div>
      <div class="m-hp-bar"><div class="m-hp-fill" style="width: 100%;"></div></div>
    `;
    document.body.appendChild(this.uiElement);
  }

  updateUI(camera) {
    if (this.isDead || !this.uiElement) {
      if (this.uiElement) this.uiElement.style.display = 'none';
      return;
    }
    const pos = this.group.position.clone();
    pos.y += 2.2;
    pos.project(camera);
    const x = (pos.x *  .5 + .5) * window.innerWidth;
    const y = (pos.y * -.5 + .5) * window.innerHeight;

    if (pos.z < 1) {
      this.uiElement.style.left = `${x}px`;
      this.uiElement.style.top = `${y}px`;
      this.uiElement.style.display = 'block';
    } else {
      this.uiElement.style.display = 'none';
    }
  }

  isWalkable(x, z) {
    if (!this.grid) return true;
    const col = Math.floor(x / this.tileSize + 0.5);
    const row = Math.floor(z / this.tileSize + 0.5);
    if (row < 0 || row >= this.grid.length || col < 0 || col >= this.grid[0].length) return false;
    return this.grid[row][col] > 0;
  }

  updateAI(carlPos, delta, callbacks) {
    if (this.isDead) return;

    const currentPos = this.group.position;
    const distToCarl = currentPos.distanceTo(carlPos);

    let moveDir = new THREE.Vector3();

    if (distToCarl < 15.0) {
      moveDir.subVectors(carlPos, currentPos);
      moveDir.y = 0;
      moveDir.normalize();

      if (distToCarl <= 1.8) {
        moveDir.set(0, 0, 0);
        this.attackCooldown -= delta;
        if (this.attackCooldown <= 0) {
          this.attackCooldown = 1.8;
          if (callbacks.onMelee) callbacks.onMelee(this.type === 'Rage Ibis' ? 15 : 10);
        }
      } else {
        this.rangedCooldown -= delta;
        if (this.rangedCooldown <= 0 && distToCarl > 5.0 && distToCarl < 12.0) {
          this.rangedCooldown = 4.0;
          if (callbacks.onRanged) callbacks.onRanged(currentPos.clone(), carlPos.clone());
        }
      }
    } else {
      this.wanderTimer -= delta;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = Math.random() * 4 + 2;
        this.wanderDir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
      }
      moveDir.copy(this.wanderDir);
    }

    if (moveDir.length() > 0.01) {
      const step = moveDir.clone().multiplyScalar(this.speed * delta);
      let nextX = currentPos.x + step.x;
      let nextZ = currentPos.z + step.z;
      if (this.isWalkable(nextX, currentPos.z)) currentPos.x = nextX;
      if (this.isWalkable(currentPos.x, nextZ)) currentPos.z = nextZ;

      this.group.lookAt(currentPos.x + moveDir.x, currentPos.y, currentPos.z + moveDir.z);
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    const pct = Math.max(0, (this.hp / this.maxHp) * 100);
    if (this.uiElement) {
      const fill = this.uiElement.querySelector('.m-hp-fill');
      if (fill) fill.style.width = `${pct}%`;
    }

    if (this.hp <= 0 && !this.isDead) {
      this.isDead = true;
      this.group.rotation.x = Math.PI / 2;
      this.group.position.y = 0.2;
      if (this.uiElement) this.uiElement.style.display = 'none';
      return true;
    }
    return false;
  }
}
