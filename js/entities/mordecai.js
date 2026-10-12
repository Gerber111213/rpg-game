export class Mordecai3D {
  constructor(scene, x, z) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Mordecai Manager Model
    const geo = new THREE.CylinderGeometry(0.7, 0.7, 2.5, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0x774422 });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.y = 1.25;
    this.group.add(this.mesh);

    this.group.position.set(x, 0, z);
    this.scene.add(this.group);

    this.quotes = [
      "Welcome to the Safe Room. Monsters cannot cross the threshold.",
      "Check your inventory, Carl. Identify glowing items before equipping them.",
      "Donut, stop complaining about the lighting. The Syndicate doesn't do chandeliers."
    ];
    this.dialogueIndex = 0;
  }

  getAdvice() {
    const q = this.quotes[this.dialogueIndex % this.quotes.length];
    this.dialogueIndex++;
    return q;
  }
}
