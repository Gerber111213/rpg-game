export class Carl3D {
  constructor(scene, x, z, dungeonGrid) {
    this.scene = scene;
    this.hp = 100;
    this.maxHp = 100;
    this.speed = 10;
    this.name = "Carl";
    this.grid = dungeonGrid;
    this.tileSize = 4;

    this.group = new THREE.Group();

    // --- MATERIALS ---
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xd2a679 });
    const boxerMat = new THREE.MeshLambertMaterial({ color: 0xff3366 }); // Pink Heart Boxers
    const vestMat = new THREE.MeshLambertMaterial({ color: 0x3b5323 });  // Tactical Vest
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });  // Brown Hair

    // --- TORSO ---
    const torsoGeo = new THREE.BoxGeometry(0.7, 1.0, 0.4);
    this.torso = new THREE.Mesh(torsoGeo, vestMat);
    this.torso.position.y = 1.1;
    this.torso.castShadow = true;
    this.group.add(this.torso);

    // Head
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.8;
    this.torso.add(head);

    // Hair
    const hairGeo = new THREE.BoxGeometry(0.54, 0.2, 0.54);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 0.2, 0);
    head.add(hair);

    // Heart Boxers
    const shortsGeo = new THREE.BoxGeometry(0.68, 0.5, 0.42);
    const shorts = new THREE.Mesh(shortsGeo, boxerMat);
    shorts.position.y = -0.75;
    this.torso.add(shorts);

    // --- ARMS ---
    const armGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    
    this.leftArm = new THREE.Mesh(armGeo, skinMat);
    this.leftArm.position.set(-0.52, 0.1, 0);
    this.torso.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, skinMat);
    this.rightArm.position.set(0.52, 0.1, 0);
    this.torso.add(this.rightArm);

    // --- LEGS & BARE FEET ---
    const legGeo = new THREE.BoxGeometry(0.28, 0.9, 0.28);

    this.leftLeg = new THREE.Mesh(legGeo, skinMat);
    this.leftLeg.position.set(-0.18, -1.2, 0);
    this.torso.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, skinMat);
    this.rightLeg.position.set(0.18, -1.2, 0);
    this.torso.add(this.rightLeg);

    this.group.position.set(x, 0, z);
    this.scene.add(this.group);
  }

  getPosition() { return this.group.position; }

  isWalkable(x, z) {
    if (!this.grid) return true;
    
    // Convert world position to grid indices correctly matching DungeonBuilder layout
    const col = Math.floor(x / this.tileSize + 0.5);
    const row = Math.floor(z / this.tileSize + 0.5);

    if (row < 0 || row >= this.grid.length || col < 0 || col >= this.grid[0].length) {
      return false;
    }
    
    // Grid value > 0 means floor / safe room. 0 means solid manufactured wall.
    return this.grid[row][col] > 0;
  }

  moveTo(targetVec, delta) {
    const currentPos = this.group.position;
    const dir = new THREE.Vector3().subVectors(targetVec, currentPos);
    dir.y = 0;

    if (dir.length() > 0.1) {
      dir.normalize();
      const step = dir.clone().multiplyScalar(this.speed * delta);

      // Check collision box buffer (adds a 0.4 radius check so Carl doesn't clip into wall corners)
      const buffer = 0.4;
      let nextX = currentPos.x + step.x;
      let nextZ = currentPos.z + step.z;

      // Test X axis movement with buffer
      const xTestOffset = step.x > 0 ? buffer : -buffer;
      if (this.isWalkable(nextX + xTestOffset, currentPos.z - buffer) && 
          this.isWalkable(nextX + xTestOffset, currentPos.z + buffer)) {
        currentPos.x = nextX;
      }

      // Test Z axis movement with buffer
      const zTestOffset = step.z > 0 ? buffer : -buffer;
      if (this.isWalkable(currentPos.x - buffer, nextZ + zTestOffset) && 
          this.isWalkable(currentPos.x + buffer, nextZ + zTestOffset)) {
        currentPos.z = nextZ;
      }

      this.group.lookAt(targetVec.x, currentPos.y, targetVec.z);

      // Walking limb swing animation
      const time = Date.now() * 0.015;
      this.leftArm.rotation.x = Math.sin(time) * 0.6;
      this.rightArm.rotation.x = -Math.sin(time) * 0.6;
      this.leftLeg.rotation.x = -Math.sin(time) * 0.6;
      this.rightLeg.rotation.x = Math.sin(time) * 0.6;
    } else {
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
    }
  }
}
