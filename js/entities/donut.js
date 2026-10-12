export class Donut3D {
  constructor(scene, x, z) {
    this.scene = scene;
    this.name = "Princess Donut";
    this.speed = 11;

    this.group = new THREE.Group();

    // --- MATERIALS (Tortoiseshell Persian Cat Palette) ---
    const furMat = new THREE.MeshLambertMaterial({ color: 0xd49b57 });      // Golden-brown Persian fur
    const patchMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });    // Dark tortie patches
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });    // Chest / Paw white fluff
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });        // Gorgeous amber eyes
    const collarMat = new THREE.MeshLambertMaterial({ color: 0x00ffff });   // Magical cyan collar

    // --- CAT BODY ---
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.4, 0.9);
    this.body = new THREE.Mesh(bodyGeo, furMat);
    this.body.position.y = 0.4;
    this.body.castShadow = true;
    this.group.add(this.body);

    // Fluffy chest patch
    const chestGeo = new THREE.BoxGeometry(0.48, 0.35, 0.3);
    const chest = new THREE.Mesh(chestGeo, whiteMat);
    chest.position.set(0, -0.02, 0.32);
    this.body.add(chest);

    // --- HEAD ---
    const headGeo = new THREE.BoxGeometry(0.46, 0.4, 0.4);
    this.head = new THREE.Mesh(headGeo, furMat);
    this.head.position.set(0, 0.25, 0.55);
    this.body.add(this.head);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.1, 0.1, 0.05);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.12, 0.05, 0.21);
    this.head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.12, 0.05, 0.21);
    this.head.add(rightEye);

    // Floppy/Fluffy Persian Ears
    const earGeo = new THREE.BoxGeometry(0.12, 0.15, 0.08);
    const leftEar = new THREE.Mesh(earGeo, patchMat);
    leftEar.position.set(-0.16, 0.28, -0.05);
    leftEar.rotation.z = -0.1;
    this.head.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, patchMat);
    rightEar.position.set(0.16, 0.28, -0.05);
    rightEar.rotation.z = 0.1;
    this.head.add(rightEar);

    // Magical Cyan Collar
    const collarGeo = new THREE.BoxGeometry(0.48, 0.08, 0.42);
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, -0.05, 0.2);
    this.head.add(collar);

    // --- LEGS (4 Paws) ---
    const legGeo = new THREE.BoxGeometry(0.12, 0.35, 0.12);

    this.frontLeftLeg = new THREE.Mesh(legGeo, furMat);
    this.frontLeftLeg.position.set(-0.18, -0.35, 0.32);
    this.body.add(this.frontLeftLeg);

    this.frontRightLeg = new THREE.Mesh(legGeo, furMat);
    this.frontRightLeg.position.set(0.18, -0.35, 0.32);
    this.body.add(this.frontRightLeg);

    this.backLeftLeg = new THREE.Mesh(legGeo, furMat);
    this.backLeftLeg.position.set(-0.18, -0.35, -0.32);
    this.body.add(this.backLeftLeg);

    this.backRightLeg = new THREE.Mesh(legGeo, furMat);
    this.backRightLeg.position.set(0.18, -0.35, -0.32);
    this.body.add(this.backRightLeg);

    // --- TAIL ---
    const tailGeo = new THREE.BoxGeometry(0.12, 0.12, 0.6);
    this.tail = new THREE.Mesh(tailGeo, patchMat);
    this.tail.position.set(0, 0.15, -0.6);
    this.tail.rotation.x = 0.4;
    this.body.add(this.tail);

    this.group.position.set(x, 0, z);
    this.scene.add(this.group);
  }

  getPosition() { return this.group.position; }

  follow(targetPos, delta) {
    const currentPos = this.group.position;
    const dist = currentPos.distanceTo(targetPos);

    if (dist > 3.0) {
      const dir = new THREE.Vector3().subVectors(targetPos, currentPos);
      dir.y = 0;
      dir.normalize();
      
      currentPos.addScaledVector(dir, this.speed * delta);
      this.group.lookAt(targetPos.x, currentPos.y, targetPos.z);

      // Quadrupedal running trot animation
      const time = Date.now() * 0.02;
      this.frontLeftLeg.rotation.x = Math.sin(time) * 0.7;
      this.frontRightLeg.rotation.x = -Math.sin(time) * 0.7;
      this.backLeftLeg.rotation.x = -Math.sin(time) * 0.7;
      this.backRightLeg.rotation.x = Math.sin(time) * 0.7;
      this.tail.rotation.y = Math.cos(time * 0.5) * 0.3;
    } else {
      // Idle breathing / tail flick
      this.frontLeftLeg.rotation.x = 0;
      this.frontRightLeg.rotation.x = 0;
      this.backLeftLeg.rotation.x = 0;
      this.backRightLeg.rotation.x = 0;
      this.tail.rotation.y = 0;
    }
  }
}
