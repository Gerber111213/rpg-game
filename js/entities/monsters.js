export class Monster3D {
  constructor(scene, type, x, z) {
    this.scene = scene;
    this.type = type;
    this.hp = type === 'Rage Ibis' ? 45 : 30;
    this.maxHp = this.hp;
    this.damage = type === 'Rage Ibis' ? 12 : 6;
    this.name = type;
    this.isDead = false;

    this.group = new THREE.Group();

    // High detail 3D model for monster
    const bodyGeo = new THREE.BoxGeometry(1.2, 1.8, 1.2);
    const mat = new THREE.MeshStandardMaterial({ 
      color: type === 'Rage Ibis' ? 0xb30000 : 0x2e7d32,
      roughness: 0.6 
    });
    this.mesh = new THREE.Mesh(bodyGeo, mat);
    this.mesh.position.y = 0.9;
    this.mesh.castShadow = true;
    this.group.add(this.mesh);

    this.group.position.set(x, 0, z);
    this.scene.add(this.group);
  }

  updateAI(targetPos, delta) {
    if (this.isDead) return;
    const dist = this.group.position.distanceTo(targetPos);
    if (dist < 15.0 && dist > 1.5) {
      const dir = new THREE.Vector3().subVectors(targetPos, this.group.position);
      dir.y = 0;
      dir.normalize();
      this.group.position.addScaledVector(dir, 5.0 * delta); // Chase Carl
      this.group.lookAt(targetPos.x, this.group.position.y, targetPos.z);
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
