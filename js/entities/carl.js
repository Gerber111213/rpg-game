export class Carl3D {
  constructor(scene, x, z) {
    this.scene = scene;
    this.hp = 100;
    this.maxHp = 100;
    this.speed = 14;
    this.name = "Carl";

    const textureLoader = new THREE.TextureLoader();
    this.texture = textureLoader.load('assets/carl_walk.png');
    this.texture.magFilter = THREE.NearestFilter; // Crisp pixel art scaling

    const material = new THREE.SpriteMaterial({ map: this.texture });
    this.sprite = new THREE.Sprite(material);
    this.sprite.scale.set(2.5, 2.5, 1);
    this.sprite.position.set(x, 1.25, z);
    
    this.scene.add(this.sprite);
  }

  getPosition() { return this.sprite.position; }

  moveTo(targetVec, delta) {
    const dir = new THREE.Vector3().subVectors(targetVec, this.sprite.position);
    dir.y = 0;
    if (dir.length() > 0.2) {
      dir.normalize();
      this.sprite.position.addScaledVector(dir, this.speed * delta);
    }
  }
}
