export class Monster3D {
  constructor(scene, type, x, z) {
    this.scene = scene;
    this.type = type;
    this.hp = type === 'Rage Ibis' ? 45 : 30;
    this.damage = type === 'Rage Ibis' ? 12 : 6;
    this.group = new THREE.Group();

    let color = 0x33aa33; // Goblin Green
    if (type === 'Rage Ibis') color = 0xcc2222; // Feather Red
    if (type === 'Gnome Driller') color = 0x885522; // Dirt Brown

    const geo = new THREE.BoxGeometry(1.2, 1.6, 1.2);
    const mat = new THREE.MeshStandardMaterial({ color });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.y = 0.8;
    this.mesh.castShadow = true;
    this.group.add(this.mesh);

    this.group.position.set(x, 0, z);
    this.scene.add(this.group);
    this.isDead = false;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0 && !this.isDead) {
      this.isDead = true;
      return true; // Triggers corpse collapse & blood decal
    }
    return false;
  }
}
