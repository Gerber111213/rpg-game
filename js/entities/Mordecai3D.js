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
