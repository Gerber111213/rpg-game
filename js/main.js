// Main Entry Point for Dungeon Crawler Carl 3D Engine

let scene, camera, renderer, player;
let clock = new THREE.Clock();

function init() {
  // 1. Container Check & Setup
  const container = document.getElementById('game-container');
  if (!container) {
    console.error("Critical Error: #game-container element missing from DOM.");
    return;
  }

  // 2. Scene Initialization
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0e12);

  // 3. Camera Setup (Diablo-style Isometric Top-Down Angle)
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 15, 12);
  camera.lookAt(0, 0, 0);

  // 4. Renderer Setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  // 5. Mandatory Lighting (Prevents the Black Screen issue)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(10, 20, 15);
  dirLight.castShadow = true;
  scene.add(dirLight);

  // 6. Temporary Test Geometry (Carl's Placeholder Avatar / Floor)
  const floorGeo = new THREE.PlaneGeometry(30, 30);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x222629, roughness: 0.8 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Placeholder Player Mesh (Carl in his boxers)
  const playerGeo = new THREE.BoxGeometry(1, 2, 1);
  const playerMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c });
  player = new THREE.Mesh(playerGeo, playerMat);
  player.position.y = 1;
  player.castShadow = true;
  scene.add(player);

  // 7. Event Listeners for UI toggles (e.g., Press 'I' for Inventory)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'i' || e.key === 'I') {
      const modal = document.getElementById('inventory-modal');
      modal.classList.toggle('hidden');
    }
  });

  // Window Resize Handling
  window.addEventListener('resize', onWindowResize);

  // 8. Start Game Loop
  animate();
  
  console.log("[SYSTEM AI]: 3D Engine initialized successfully. Press 'I' to toggle inventory.");
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  // Optional subtle rotation or animation tick for testing loop
  const delta = clock.getDelta();

  renderer.render(scene, camera);
}

// Kick off engine execution
init();
