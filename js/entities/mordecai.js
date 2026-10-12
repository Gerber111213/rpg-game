export class Mordecai3D {
  constructor(scene, x, z) {
    this.scene = scene;
    this.group = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.4), mat);
    body.position.y = 0.9;
    this.group.add(body);
    this.group.position.set(x, 0, z);
    this.scene.add(this.group);
  }
}
