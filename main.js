import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // Import OrbitControls
import * as dat from 'dat.gui'; // dat.GUI

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;  // Enable shadows in the renderer
renderer.shadowMap.type = THREE.PCFSoftShadowMap;  // Type of shadow (soft shadows)
document.body.appendChild(renderer.domElement);

// Load the 360 texture (this will be used for reflections)
const loader = new THREE.TextureLoader();
const texture360 = loader.load('/texture/garage.png', () => {
  console.log('Texture loaded successfully');
}, undefined, (err) => {
  console.error('Error loading texture:', err);
});

// Create a sphere for the environment (360-degree texture)
const geometry = new THREE.SphereGeometry(500, 60, 40); // Large sphere
const material = new THREE.MeshBasicMaterial({ map: texture360, side: THREE.BackSide }); // Texture on inside
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Ambient Light (for global illumination)
const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);

// Directional Light (to simulate sunlight)
const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(10, 10, 10);
directionalLight.castShadow = true;  // Enable shadow casting for this light
scene.add(directionalLight);

// Set camera position
camera.position.set(0, 10, 30);
camera.lookAt(0, 0, 0);

// Initialize OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Load GLB model
const gltfLoader = new GLTFLoader();
let penguin;

gltfLoader.load(
  '/Shoe_compressed.glb',
  (gltf) => {
    penguin = gltf.scene;
    penguin.scale.set(50, 50, 50);
    penguin.position.set(0, 0, 0);
    penguin.rotation.y = Math.PI / 40;

    // Enable shadow casting and receiving for all meshes in the model
    penguin.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(penguin);
    console.log('Model added to the scene:', penguin);

    // Load the cube texture for environment reflection
    const cubeLoader = new THREE.CubeTextureLoader();
    const cubeTexture = cubeLoader.load([ 
      'posx.jpg', 'negx.jpg',
      'posy.jpg', 'negy.jpg',
      'posz.jpg', 'negz.jpg',
    ]);
    scene.background = cubeTexture;
    scene.environment = cubeTexture;

    // Apply a standard material
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xFFFFFF,
          roughness: 0.5,
          metalness: 0.0,
          envMap: cubeTexture,
          envMapIntensity: 1.0
        });
      }
    });
  },
  undefined,
  (error) => {
    console.error('Error loading model:', error);
  }
);

// Add a ground plane to receive the shadows
const groundGeometry = new THREE.PlaneGeometry(500, 500);
const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;  // Rotate the plane to lie flat
ground.position.y = -5;  // Position it below the model
ground.receiveShadow = true;  // This plane will receive shadows
scene.add(ground);

// dat.GUI - Adding sliders for adjusting light, camera position, zoom and object rotation
const gui = new dat.GUI();

// Light settings
const lightParams = {
  ambientIntensity: 20,
  directionalIntensity: 30,
  directionalX: 10,
  directionalY: 10,
  directionalZ: 10,
};

// Camera settings
const cameraParams = {
  cameraX: 0,
  cameraY: 10,
  cameraZ: 30,
  fov: 75,
};

// Object rotation settings
const rotationParams = {
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
};

// Create folders for light, camera settings, and object rotation in the GUI
const lightFolder = gui.addFolder('Lighting');
lightFolder.add(lightParams, 'ambientIntensity', 0, 100).onChange(updateLighting);
lightFolder.add(lightParams, 'directionalIntensity', 0, 100).onChange(updateLighting);
lightFolder.add(lightParams, 'directionalX', -50, 50).onChange(updateLighting);
lightFolder.add(lightParams, 'directionalY', -50, 50).onChange(updateLighting);
lightFolder.add(lightParams, 'directionalZ', -50, 50).onChange(updateLighting);
lightFolder.open();

// Create camera folder in the GUI
const cameraFolder = gui.addFolder('Camera Position');
cameraFolder.add(cameraParams, 'cameraX', -50, 50).onChange(updateCameraPosition);
cameraFolder.add(cameraParams, 'cameraY', -50, 50).onChange(updateCameraPosition);
cameraFolder.add(cameraParams, 'cameraZ', 1, 100).onChange(updateCameraPosition);
cameraFolder.add(cameraParams, 'fov', 10, 150).onChange(updateCameraPosition);
cameraFolder.open();

// Create object rotation folder in the GUI
const rotationFolder = gui.addFolder('Object Rotation');
rotationFolder.add(rotationParams, 'rotateX', 0, Math.PI * 2).onChange(updateRotation);
rotationFolder.add(rotationParams, 'rotateY', 0, Math.PI * 2).onChange(updateRotation);
rotationFolder.add(rotationParams, 'rotateZ', 0, Math.PI * 2).onChange(updateRotation);
rotationFolder.open();

// Update lighting based on GUI sliders
function updateLighting() {
  ambientLight.intensity = lightParams.ambientIntensity;
  directionalLight.intensity = lightParams.directionalIntensity;
  directionalLight.position.set(lightParams.directionalX, lightParams.directionalY, lightParams.directionalZ);
}

// Update camera position and zoom based on GUI sliders
function updateCameraPosition() {
  camera.position.set(cameraParams.cameraX, cameraParams.cameraY, cameraParams.cameraZ);
  camera.fov = cameraParams.fov;
  camera.updateProjectionMatrix();
}

// Update object rotation based on GUI sliders
function updateRotation() {
  if (penguin) {
    penguin.rotation.x = rotationParams.rotateX;
    penguin.rotation.y = rotationParams.rotateY;
    penguin.rotation.z = rotationParams.rotateZ;
  }
}

// Animation loop
function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Start animation loop
animate();


