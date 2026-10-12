export class Donut3D {
  constructor(scene, x, z) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Persian Cat Mesh with Ruby Tiara
    const bodyGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf0e6d2 });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.position.y = 0.5;
    this.body.castShadow = true;
    this.group.add(this.body);

    // Ruby Tiara
    const tiaraGeo = new THREE.ConeGeometry(0.2, 0.3, 8);
    const tiaraMat = new THREE.MeshStandardMaterial({ color: 0xcc0033, metalness: 0.8, roughness: 0.2 });
    const tiara = new THREE.Mesh(tiaraGeo, tiaraMat);
    tiara.position.set(0, 0.9, 0);
    this.group.add(tiara);

    this.group.position.set(x, 0, z);
    this.scene.add(this.group);
  }

  follow(targetPos, delta) {
    const dist = this.group.position.distanceTo(targetPos);
    if (dist > 3.0) {
      const dir = new THREE.Vector3().subVectors(targetPos, this.group.position);
      dir.y = 0;
      dir.normalize();
      this.group.position.addScaledVector(dir, 10 * delta);
      this.group.lookAt(targetPos.x, this.group.position.y, targetPos.z);
    }
  }
}
