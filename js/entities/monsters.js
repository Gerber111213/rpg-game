export class Monster3D {
  constructor(scene, type, x, z, dungeonGrid) {
    this.scene = scene;
    this.type = type;
    this.hp = type === 'Rage Ibis' ? 45 : 30;
    this.maxHp = this.hp;
    this.name = type;
    this.isDead = false;
    this.grid = dungeonGrid;
    this.tileSize = 4;
    this.speed = 3.5; // Slow moving

    this.group = new THREE.Group();

    // --- MATERIALS ---
    const skinMat = new THREE.MeshLambertMaterial({ 
      color: type === 'Rage Ibis' ? 0xcc2222 : 0x2e7d32 
    });
    const detailMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

    // Torso / Body
    const bodyGeo = new THREE.BoxGeometry(0.9, 1.2, 0.6);
    this.torso = new THREE.Mesh(bodyGeo, skinMat);
    this.torso.position.y = 0.9;
    this.torso.castShadow = true;
    this.group.add(this.torso);

    // Head
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.9;
    this.torso.add(head);

    // Limbs for walking animation
    const limbGeo = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    this.leftArm = new THREE.Mesh(limbGeo, detailMat);
    this.leftArm.position.set(-0.55, 0, 0);
    this.torso.add(this.leftArm);

    this.rightArm = new THREE.Mesh(limbGeo, detailMat);
    this.rightArm.position.set(0.55, 0, 0);
    this.torso.add(this.rightArm);

    this.group.position.set(x, 0, z);
    this.scene.add(this.group);

    // Random wander target direction timer
    this.wanderTimer = Math.random() * 3;
    this.wanderDir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
  }

  isWalkable(x, z) {
    if (!this.grid) return true;
    const col = Math.floor(x / this.tileSize + 0.5);
    const row = Math.floor(z / this.tileSize + 0.5);
    if (row < 0 || row >= this.grid.length || col < 0 || col >= this.grid[0].length) return false;
    return this.grid[row][col] > 0;
  }

  updateAI(targetPos, delta) {
    if (this.isDead) return;

    const currentPos = this.group.position;
    const distToCarl = currentPos.distanceTo(targetPos);

    let moveDir = new THREE.Vector3();

    if (distToCarl < 12.0) {
      // Chase Carl if nearby
      moveDir.subVectors(targetPos, currentPos);
      moveDir.y = 0;
      moveDir.normalize();
    } else {
      // Random slow wandering
      this.wanderTimer -= delta;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = Math.random() * 4 + 2;
        this.wanderDir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
      }
      moveDir.copy(this.wanderDir);
    }

    const step = moveDir.clone().multiplyScalar(this.speed * delta);
    let nextX = currentPos.x + step.x;
    let nextZ = currentPos.z + step.z;

    if (this.isWalkable(nextX, currentPos.z)) currentPos.x = nextX;
    if (this.isWalkable(currentPos.x, nextZ)) currentPos.z = nextZ;

    if (moveDir.length() > 0.1) {
      this.group.lookAt(currentPos.x + moveDir.x, currentPos.y, currentPos.z + moveDir.z);
      // Walking bob/swing animation
      const time = Date.now() * 0.01;
      this.leftArm.rotation.x = Math.sin(time) * 0.5;
      this.rightArm.rotation.x = -Math.sin(time) * 0.5;
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0 && !this.isDead) {
      this.isDead = true;
      this.group.rotation.x = Math.PI / 2;
      this.group.position.y = 0.2;
      return true;
    }
    return false;
  }
}
