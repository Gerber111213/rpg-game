export class Carl3D {
  constructor(scene, x, z, dungeonGrid) {
    this.scene = scene;
    this.hp = 100;
    this.maxHp = 100;
    this.walkSpeed = 6;
    this.runSpeed = 12;
    this.speed = this.walkSpeed;
    this.isRunning = false;
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

    this.group.position.set(x, 0, z);
    this.scene.add(this.group);
  }

  toggleRun() {
    this.isRunning = !this.isRunning;
    this.speed = this.isRunning ? this.runSpeed : this.walkSpeed;
    return this.isRunning;
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
    const currentPos = this.group.position;
    const dir = new THREE.Vector3().subVectors(targetVec, currentPos);
    dir.y = 0;

    if (dir.length() > 0.1) {
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
    } else {
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
    }
  }
}
