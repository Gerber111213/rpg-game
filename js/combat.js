export class CombatEngine {
  constructor(scene) {
    this.scene = scene;
    this.bloodDecals = [];
  }

  spawnBloodSplatter(x, z) {
    const geo = new THREE.CircleGeometry(Math.random() * 0.8 + 0.6, 12);
    const mat = new THREE.MeshBasicMaterial({ color: 0x880000, side: THREE.DoubleSide });
    const decal = new THREE.Mesh(geo, mat);
    decal.rotation.x = -Math.PI / 2;
    decal.position.set(x, 0.01, z); // Sits right above floor tile
    this.scene.add(decal);
    this.bloodDecals.push(decal);
  }

  handleCorpseCollapse(monster) {
    // Collapse monster mesh onto floor as permanent corpse body
    monster.group.rotation.x = Math.PI / 2;
    monster.group.position.y = 0.2;
    this.spawnBloodSplatter(monster.group.position.x, monster.group.position.z);
  }
}
