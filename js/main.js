// Ensure Three.js is loaded correctly
console.log("[SYSTEM AI]: Booting 3D Crawler script...");

let scene, camera, renderer, cube;

function init() {
    const container = document.getElementById('game-container');
    if (!container) {
        console.error("FATAL: #game-container not found!");
        return;
    }

    // 1. Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111118);

    // 2. Camera (Isometric view looking down at origin)
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 10);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // 4. Lights (Crucial: prevents black screen)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffaa00, 1.5, 50);
    pointLight.position.set(0, 5, 5);
    scene.add(pointLight);

    // 5. Test Geometry (A glowing red box to represent Carl's starting zone)
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({ color: 0xe74c3c, roughness: 0.3 });
    cube = new THREE.Mesh(geometry, material);
    cube.position.y = 1;
    scene.add(cube);

    // Ground plane
    const planeGeo = new THREE.PlaneGeometry(20, 20);
    const planeMat = new THREE.MeshStandardMaterial({ color: 0x33333d, roughness: 0.9 });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    // 6. Window Resize Handler
    window.addEventListener('resize', onWindowResize);

    // 7. Inventory Toggle ('I' key)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'i' || e.key === 'I') {
            const modal = document.getElementById('inventory-modal');
            modal.classList.toggle('hidden');
        }
    });

    // Start render loop
    animate();
    console.log("[SYSTEM AI]: Engine active. Press 'I' for inventory.");
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // Subtle rotation to prove the render loop is running
    if (cube) {
        cube.rotation.y += 0.01;
    }

    renderer.render(scene, camera);
}

// Initialize on load
init();
