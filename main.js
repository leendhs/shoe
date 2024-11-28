import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


document.getElementById('order-btn').addEventListener('click', () => {
  const orderMessage = document.getElementById('order-message');
  orderMessage.style.display = 'block';
  setTimeout(() => {
    orderMessage.style.display = 'none';
  }, 3000); // verdwijnt na 3 seconden
});

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Environment Texture
const loader = new THREE.TextureLoader();
const texture360 = loader.load('/texture/garage.png');
const sphereGeometry = new THREE.SphereGeometry(500, 60, 40);
const sphereMaterial = new THREE.MeshBasicMaterial({ map: texture360, side: THREE.BackSide });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(10, 10, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Camera position
camera.position.set(0, 10, 30);
camera.lookAt(0, 0, 0);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Load GLB model
const gltfLoader = new GLTFLoader();
let selectedObject = null;

gltfLoader.load(
  '/Shoe_compressed.glb',
  (gltf) => {
    const model = gltf.scene;
    model.scale.set(50, 50, 50);
    model.position.set(0, 0, 0);
    model.rotation.y = Math.PI / 40;

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = new THREE.MeshStandardMaterial({ color: 0xffffff });
      }
    });

    scene.add(model);
    console.log('Model added to the scene:', model);
  },
  undefined,
  (error) => {
    console.error('Error loading model:', error);
  }
);

// Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function changeColor(mesh, color) {
  if (mesh && mesh.material) {
    mesh.material.color.set(color);
    mesh.material.needsUpdate = true;
  }
}

function applyTexture(mesh, texture) {
  if (mesh && mesh.material) {
    mesh.material.map = texture;
    mesh.material.needsUpdate = true;
  }
}

// Load textures
const texture1 = loader.load('/texture/texture1.jpg');
const texture2 = loader.load('/texture/texture2.jpg');

// Mouse click handler
window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    selectedObject = intersects[0].object;

    if (selectedObject.isMesh) {
      const colorMenu = document.getElementById('color-menu');
      colorMenu.style.display = 'block';
      colorMenu.style.left = `${event.clientX}px`;
      colorMenu.style.top = `${event.clientY}px`;
    }
  } else {
    document.getElementById('color-menu').style.display = 'none';
  }
});

// Event listeners for buttons
document.getElementById('blue-btn').addEventListener('click', () => {
  if (selectedObject) changeColor(selectedObject, 'blue');
});
document.getElementById('red-btn').addEventListener('click', () => {
  if (selectedObject) changeColor(selectedObject, 'red');
});
document.getElementById('green-btn').addEventListener('click', () => {
  if (selectedObject) changeColor(selectedObject, 'green');
});

document.getElementById('texture1-btn').addEventListener('click', () => {
  if (selectedObject) applyTexture(selectedObject, texture1);
});
document.getElementById('texture2-btn').addEventListener('click', () => {
  if (selectedObject) applyTexture(selectedObject, texture2);
});

// Animation loop
function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
