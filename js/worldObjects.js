import * as THREE from 'three';

export class WorldObjectsBuilder {
  constructor(scene, tileSize) {
    this.scene = scene;
    this.tileSize = tileSize;
    this.torches = [];
    this.doors = [];
  }

  createFloor(x, z, isSafe) {
    const floorGeo = new THREE.BoxGeometry(this.tileSize, 0.4, this.tileSize);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x4a4238, roughness: 0.7 });
    const safeFloorMat = new THREE.MeshStandardMaterial({ color: 0x2e5b75, roughness: 0.5 });

    const mat = isSafe ? safeFloorMat : floorMat;
    const floor = new THREE.Mesh(floorGeo, mat);
    floor.position.set(x, -0.2, z);
    this.scene.add(floor);
  }

  createWall(x, z) {
    const wallGeo = new THREE.BoxGeometry(this.tileSize, 5.0, this.tileSize);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x7c7c8c, roughness: 0.6, metalness: 0.1 });
    
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(x, 2.5, z);
    this.scene.add(wall);
  }

  createSconce(x, y, z) {
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffaa33 }));
    flame.position.set(x, y, z);
    this.scene.add(flame);

    const light = new THREE.PointLight(0xff9922, 2.0, 12);
    light.position.set(x, y, z);
    this.scene.add(light);
    this.torches.push(light);
  }

  createSwingingDoors(x, z) {
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8 });
    
    const leftGroup = new THREE.Group();
    const rightGroup = new THREE.Group();

    const panelGeo = new THREE.BoxGeometry(1.8, 4.2, 0.2);
    
    const leftMesh = new THREE.Mesh(panelGeo, doorMat);
    leftMesh.position.set(-0.9, 2.1, 0);
    leftGroup.add(leftMesh);

    const rightMesh = new THREE.Mesh(panelGeo, doorMat);
    rightMesh.position.set(0.9, 2.1, 0);
    rightGroup.add(rightMesh);

    leftGroup.position.set(x - 1.0, 0, z);
    rightGroup.position.set(x + 1.0, 0, z);

    this.scene.add(leftGroup);
    this.scene.add(rightGroup);
    this.doors.push({ left: leftGroup, right: rightGroup, isOpen: false });
  }
}
