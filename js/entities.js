import * as THREE from 'three';

export class Carl3D {
  constructor(scene, x, z, dungeonGrid) {
    this.scene = scene;
    this.hp = 100;
    this.maxHp = 100;
    this.stamina = 100;
    this.maxStamina = 100;
    this.walkSpeed = 5;
    this.runSpeed = 10;
    this.speed = this.walkSpeed;
    this.isRunning = false;
    this.isDead = false;
    this.name = "Carl";
    this.grid = dungeonGrid;
    this.tileSize = 4;

    this.group = new THREE.Group();

    const skinMat = new THREE.MeshLambertMaterial({ color: 0xd2a679 });
    const boxerMat = new THREE.MeshLambertMaterial({ color: 0xff3366 });
    const vestMat = new THREE.MeshLambertMaterial({ color: 0x3b5323 });
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });

    const torsoGeo = new THREE.BoxGeometry(0.7, 1.0, 0.4);
    this.torso = new THREE.Mesh(torsoGeo, vestMat);
    this.torso.position.y = 1.1;
    this.torso.castShadow = true;
    this.group.add(this.torso);

    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.8;
    this.torso.add(head);

    const hairGeo = new THREE.BoxGeometry(0.54, 0.2, 0.54);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 0.2, 0);
    head.add(hair);

    const shortsGeo = new THREE.BoxGeometry(0.68, 0.5, 0.42);
    const shorts = new THREE.Mesh(shortsGeo, boxerMat);
    shorts.position.y = -0.75;
    this.torso.add(shorts);

    const armGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    this.leftArm = new THREE.Mesh(armGeo, skinMat);
    this.leftArm.position.set(-0.52, 0.1, 0);
    this.torso.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, skinMat);
    this.rightArm.position.set(0.52, 0.1, 0);
    this.torso.add(this.rightArm);

    const legGeo = new THREE.BoxGeometry(0.28, 0.9, 0.28);
    this.leftLeg = new THREE.Mesh(legGeo, skinMat);
    this.leftLeg.position.set(-0.18, -1.2, 0);
    this.torso.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, skinMat);
    this.rightLeg.position.set(0.18, -1.2, 0);
    this.torso.add(this.rightLeg);

    this.headlight = new THREE.PointLight(0xfffaee, 4.0, 20);
    this.headlight.position.set(0, 2.5, 1);
    this.group.add(this.headlight);

    this.group.position.set(x, 0, z);
    this.scene.add(this.group);
  }

  toggleRun() {
    if (this.isDead) return false;
    if (!this.isRunning && this.stamina <= 5) return false; // Can't run if out of stamina
    this.isRunning = !this.isRunning;
    this.speed = this.isRunning ? this.runSpeed : this.walkSpeed;
    return this.isRunning;
  }

  updateStamina(delta, isMoving) {
    if (this.isDead) return;
    
    if (this.isRunning && isMoving) {
      this.stamina = Math.max(0, this.stamina - 25 * delta);
      if (this.stamina <= 0) {
        this.isRunning = false;
        this.speed = this.walkSpeed;
      }
    } else {
      // Regenerate stamina when walking or standing still
      const regenRate = isMoving ? 15 : 30;
      this.stamina = Math.min(this.maxStamina, this.stamina + regenRate * delta);
    }

    // Update Stamina UI Bar
    const pct = (this.stamina / this.maxStamina) * 100;
    const fill = document.getElementById('carl-stam-bar');
    const text = document.getElementById('stam-text');
    if (fill) fill.style.width = `${pct}%`;
    if (text) text.textContent = `Stamina: ${Math.floor(this.stamina)} / ${this.maxStamina}`;
  }

  getPosition() { return this.group.position; }

  isWalkable(x, z) {
    if (!this.grid) return true;
    const col = Math.floor(x / this.tileSize + 0.5);
    const row = Math.floor(z / this.tileSize + 0.5);
    if (row < 0 || row >= this.grid.length || col < 0 || col >= this.grid[0].length) return false;
    return this.grid[row][col] > 0;
  }

  moveTo(targetVec, delta) {
    if (this.isDead) return false;
    const currentPos = this.group.position;
    const dir = new THREE.Vector3().subVectors(targetVec, currentPos);
    dir.y = 0;

    const isMoving = dir.length() > 0.1;
    this.updateStamina(delta, isMoving);

    if (isMoving) {
      dir.normalize();
      const step = dir.clone().multiplyScalar(this.speed * delta);
      const buffer = 0.4;
      let nextX = currentPos.x + step.x;
      let nextZ = currentPos.z + step.z;

      const xTestOffset = step.x > 0 ? buffer : -buffer;
      if (this.isWalkable(nextX + xTestOffset, currentPos.z - buffer) && 
          this.isWalkable(nextX + xTestOffset, currentPos.z + buffer)) {
        currentPos.x = nextX;
      }

      const zTestOffset = step.z > 0 ? buffer : -buffer;
      if (this.isWalkable(currentPos.x - buffer, nextZ + zTestOffset) && 
          this.isWalkable(currentPos.x + buffer, nextZ + zTestOffset)) {
        currentPos.z = nextZ;
      }

      this.group.lookAt(targetVec.x, currentPos.y, targetVec.z);

      const animMultiplier = this.isRunning ? 0.03 : 0.015;
      const time = Date.now() * animMultiplier;
      this.leftArm.rotation.x = Math.sin(time) * 0.6;
      this.rightArm.rotation.x = -Math.sin(time) * 0.6;
      this.leftLeg.rotation.x = -Math.sin(time) * 0.6;
      this.rightLeg.rotation.x = Math.sin(time) * 0.6;
      return true;
    } else {
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      return false;
    }
  }

  takeDamage(amt) {
    if (this.isDead) return;
    this.hp = Math.max(0, this.hp - amt);
    const pct = (this.hp / this.maxHp) * 100;
    const fill = document.getElementById('carl-hp-bar');
    const text = document.getElementById('hp-text');
    if (fill) fill.style.width = `${pct}%`;
    if (text) text.textContent = `Carl HP: ${this.hp} / ${this.maxHp}`;

    if (this.hp <= 0) {
      this.isDead = true;
      this.group.rotation.x = Math.PI / 2;
      this.group.position.y = 0.2;
    }
  }

  heal(amt) {
    if (this.isDead) return;
    this.hp = Math.min(this.maxHp, this.hp + amt);
    const pct = (this.hp / this.maxHp) * 100;
    const fill = document.getElementById('carl-hp-bar');
    const text = document.getElementById('hp-text');
    if (fill) fill.style.width = `${pct}%`;
    if (text) text.textContent = `Carl HP: ${this.hp} / ${this.maxHp}`;
  }
}

export class Donut3D {
  constructor(scene, x, z) {
    this.scene = scene;
    this.name = "Princess Donut";
    this.speed = 9;

    this.group = new THREE.Group();

    const furMat = new THREE.MeshLambertMaterial({ color: 0xd49b57 });
    const patchMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const collarMat = new THREE.MeshLambertMaterial({ color: 0x00ffff });

    const bodyGeo = new THREE.BoxGeometry(0.5, 0.4, 0.9);
    this.body = new THREE.Mesh(bodyGeo, furMat);
    this.body.position.y = 0.4;
    this.body.castShadow = true;
    this.group.add(this.body);

    const chestGeo = new THREE.BoxGeometry(0.48, 0.35, 0.3);
    const chest = new THREE.Mesh(chestGeo, whiteMat);
    chest.position.set(0, -0.02, 0.32);
    this.body.add(chest);

    const headGeo = new THREE.BoxGeometry(0.46, 0.4, 0.4);
    this.head = new THREE.Mesh(headGeo, furMat);
    this.head.position.set(0, 0.25, 0.55);
    this.body.add(this.head);

    const eyeGeo = new THREE.BoxGeometry(0.1, 0.1, 0.05);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.12, 0.05, 0.21);
    this.head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.12, 0.05, 0.21);
    this.head.add(rightEye);

    const earGeo = new THREE.BoxGeometry(0.12, 0.15, 0.08);
    const leftEar = new THREE.Mesh(earGeo, patchMat);
    leftEar.position.set(-0.16, 0.28, -0.05);
    this.head.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, patchMat);
    rightEar.position.set(0.16, 0.28, -0.05);
    this.head.add(rightEar);

    const collarGeo = new THREE.BoxGeometry(0.48, 0.08, 0.42);
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, -0.05, 0.2);
    this.head.add(collar);

    const legGeo = new THREE.BoxGeometry(0.12, 0.35, 0.12);
    this.frontLeftLeg = new THREE.Mesh(legGeo, furMat);
    this.frontLeftLeg.position.set(-0.18, -0.35, 0.32);
    this.body.add(this.frontLeftLeg);

    this.frontRightLeg = new THREE.Mesh(legGeo, furMat);
    this.frontRightLeg.position.set(0.18, -0.35, 0.32);
    this.body.add(this.frontRightLeg);

    this.backLeftLeg = new THREE.Mesh(legGeo, furMat);
    this.backLeftLeg.position.set(-0.18, -0.35, -0.32);
    this.body.add(this.backLeftLeg);

    this.backRightLeg = new THREE.Mesh(legGeo, furMat);
    this.backRightLeg.position.set(0.18, -0.35, -0.32);
    this.body.add(this.backRightLeg);

    const tailGeo = new THREE.BoxGeometry(0.12, 0.12, 0.6);
    this.tail = new THREE.Mesh(tailGeo, patchMat);
    this.tail.position.set(0, 0.15, -0.6);
    this.tail.rotation.x = 0.4;
    this.body.add(this.tail);

    this.group.position.set(x, 0, z);
    this.scene.add(this.group);
  }

  getPosition() { return this.group.position; }

  follow(targetPos, delta) {
    const currentPos = this.group.position;
    const dist = currentPos.distanceTo(targetPos);

    if (dist > 3.0) {
      const dir = new THREE.Vector3().subVectors(targetPos, currentPos);
      dir.y = 0;
      dir.normalize();
      
      currentPos.addScaledVector(dir, this.speed * delta);
      this.group.lookAt(targetPos.x, currentPos.y, targetPos.z);

      const time = Date.now() * 0.02;
      this.frontLeftLeg.rotation.x = Math.sin(time) * 0.7;
      this.frontRightLeg.rotation.x = -Math.sin(time) * 0.7;
      this.backLeftLeg.rotation.x = -Math.sin(time) * 0.7;
      this.backRightLeg.rotation.x = Math.sin(time) * 0.7;
    } else {
      this.frontLeftLeg.rotation.x = 0;
      this.frontRightLeg.rotation.x = 0;
      this.backLeftLeg.rotation.x = 0;
      this.backRightLeg.rotation.x = 0;
    }
  }
}

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
    this.speed = 2.5;
    this.attackCooldown = 0;
    this.corpseLoot = null;

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

    if (distToCarl < 16.0) {
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
      if (this.uiElement) {
        this.uiElement.remove();
        this.uiElement = null;
      }
      return true;
    }
    return false;
  }
}

export class Mordecai3D {
  constructor(scene, x, z) {
    this.scene = scene;
    this.name = "Mordecai";
    this.group = new THREE.Group();

    const coatMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xd2a679 });
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.0, 0.4), coatMat);
    body.position.y = 0.9;
    body.castShadow = true;
    this.group.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), skinMat);
    head.position.y = 0.8;
    body.add(head);

    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.5), hairMat);
    hair.position.set(0, 0.2, 0);
    head.add(hair);

    this.group.position.set(x, 0, z);
    this.scene.add(this.group);
  }

  getPosition() { return this.group.position; }
}
