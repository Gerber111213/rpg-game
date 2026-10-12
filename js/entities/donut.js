export class Donut3D {
  constructor(scene, x, z) {
    this.scene = scene;
    this.name = "Princess Donut";

    const textureLoader = new THREE.TextureLoader();
    this.texture = textureLoader.load('assets/donut_walk.png', (tex) => {
      tex.repeat.set(0.25, 0.25);
      tex.offset.set(0, 0.75); // Show Frame 0
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.needsUpdate = true;
    });

    const material = new THREE.SpriteMaterial({ map: this.texture, transparent: true });
    this.sprite = new THREE.Sprite(material);
    this.sprite.scale.set(2.0, 2.0, 1);
    this.sprite.position.set(x, 1.0, z);

    this.scene.add(this.sprite);
  }

  follow(targetPos, delta) {
    const dist = this.sprite.position.distanceTo(targetPos);
    if (dist > 3.0) {
      const dir = new THREE.Vector3().subVectors(targetPos, this.sprite.position);
      dir.y = 0;
      dir.normalize();
      this.sprite.position.addScaledVector(dir, 11 * delta);
    }
  }
}
