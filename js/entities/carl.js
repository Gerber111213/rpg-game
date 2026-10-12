export class Carl3D {
  constructor(scene, x, z) {
    this.scene = scene;
    this.hp = 100;
    this.maxHp = 100;
    this.speed = 12;

    // Diablo-style 3D Character Rig (Heart Boxers, Vest, Bare Feet)
    this.group = new THREE.Group();
    
    // Body Mesh
    const bodyGeo = new THREE.CylinderGeometry(0.6, 0.5, 2.2, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd2a679 });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.position.y = 1.1;
    this.body.castShadow = true;
    this.group.add(this.body);

    // Heart Boxers
    const shortsGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.6, 16);
    const shortsMat = new THREE.MeshStandardMaterial({ color: 0xff4466 });
    const shorts = new THREE.Mesh(shortsGeo, shortsMat);
    shorts.position.y = 0.6;
    this.group.add(shorts);

    this.group.position.set(x, 0, z);
    this.scene.add(this.group);
  }

  getPosition() { return this.group.position; }

  moveTo(targetVec, delta) {
    const dir = new THREE.Vector3().subVectors(targetVec, this.group.position);
    dir.y = 0;
    if (dir.length() > 0.2) {
      dir.normalize();
      this.group.position.addScaledVector(dir, this.speed * delta);
      this.group.lookAt(targetVec.x, this.group.position.y, targetVec.z);
    }
  }
}
