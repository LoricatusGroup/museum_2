import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);
scene.fog = new THREE.FogExp2(0x111111, 0.02);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 + 0.1;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

function buildEnvironment() {
    const floorGroup = new THREE.Group();
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });

    const hubFloor = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 0.1, 32), floorMat);
    floorGroup.add(hubFloor);

    const northFloor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.1, 30), floorMat);
    northFloor.position.set(0, 0, -15);
    floorGroup.add(northFloor);

    const eastFloor = new THREE.Mesh(new THREE.BoxGeometry(30, 0.1, 10), floorMat);
    eastFloor.position.set(15, 0, 0);
    floorGroup.add(eastFloor);

    const westFloor = new THREE.Mesh(new THREE.BoxGeometry(30, 0.1, 10), floorMat);
    westFloor.position.set(-15, 0, 0);
    floorGroup.add(westFloor);

    scene.add(floorGroup);
}
buildEnvironment();

let slots = [];
let exhibits = [];
const pedestals = new Map();
const loadedModels = new Map();
const cacheOrder = [];
const MAX_LOADED_MODELS = 3;

let currentInspectMode = null;
const WALK_TARGET = new THREE.Vector3(0, 2, 0);
let targetLookAt = WALK_TARGET.clone();

const uiTitle = document.createElement('div');
uiTitle.style.position = 'absolute';
uiTitle.style.top = '20px';
uiTitle.style.left = '50%';
uiTitle.style.transform = 'translateX(-50%)';
uiTitle.style.color = 'white';
uiTitle.style.background = 'rgba(0,0,0,0.5)';
uiTitle.style.padding = '10px';
uiTitle.style.borderRadius = '5px';
uiTitle.style.display = 'none';
uiTitle.style.textAlign = 'center';
document.body.appendChild(uiTitle);

const loadingEl = document.getElementById('loading');
const loader = new GLTFLoader();

function createPedestal(slot) {
    const geo = new THREE.BoxGeometry(2, 1, 2);
    const mat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(slot.position[0], 0.5, slot.position[2]);
    mesh.rotation.y = slot.rotation[1] || 0;
    scene.add(mesh);
    pedestals.set(slot.id, mesh);
}

Promise.all([
    fetch('assets/slots.json').then(r => r.json()),
    fetch('assets/exhibits.json').then(r => r.ok ? r.json() : [])
]).then(([sData, eData]) => {
    slots = sData;
    exhibits = eData;
    slots.forEach(slot => createPedestal(slot));
}).catch(e => console.error("Error loading museum metadata:", e));

function unloadModel(assetId) {
    const model = loadedModels.get(assetId);
    if (model) {
        scene.remove(model);
        model.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    Array.isArray(child.material) ? child.material.forEach(m => m.dispose()) : child.material.dispose();
                }
            }
        });
        loadedModels.delete(assetId);
    }
}

function ensureCache(newAssetId) {
    const index = cacheOrder.indexOf(newAssetId);
    if (index !== -1) cacheOrder.splice(index, 1);
    cacheOrder.push(newAssetId);

    if (cacheOrder.length > MAX_LOADED_MODELS) {
        const oldest = cacheOrder.shift();
        unloadModel(oldest);
        console.log("LRU Disposed:", oldest);
    }
}

function loadModelForSlot(slotId) {
    const exhibit = exhibits.find(e => e.slotId === slotId);
    if (!exhibit) return;

    if (loadedModels.has(exhibit.id)) {
        ensureCache(exhibit.id);
        return;
    }

    ensureCache(exhibit.id);
    loadingEl.style.display = 'block';

    loader.load(exhibit.modelUrl, (gltf) => {
        const model = gltf.scene;
        const slot = slots.find(s => s.id === slotId);

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3()).length();
        const scale = 2.5 / (size === 0 ? 1 : size);
        model.scale.setScalar(scale);

        box.setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        const group = new THREE.Group();
        group.add(model);
        group.position.set(slot.position[0], 2, slot.position[2]);
        group.rotation.y = slot.rotation[1] || 0;

        scene.add(group);
        loadedModels.set(exhibit.id, group);
        loadingEl.style.display = 'none';
    }, undefined, (e) => {
        console.error("Failed to load:", exhibit.modelUrl, e);
        loadingEl.style.display = 'none';
    });
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function getClosestSlot() {
    let closest = null;
    let minDist = Infinity;
    for (const slot of slots) {
        const dist = camera.position.distanceTo(new THREE.Vector3(slot.position[0], 1, slot.position[2]));
        if (dist < minDist) {
            minDist = dist;
            closest = slot;
        }
    }
    return { slot: closest, dist: minDist };
}

function updateInteraction() {
    const { slot, dist } = getClosestSlot();
    const INSPECT_DISTANCE = 6;
    const LOAD_DISTANCE = 15;

    if (slot) {
        if (dist < LOAD_DISTANCE) {
            loadModelForSlot(slot.id);
        }

        if (dist < INSPECT_DISTANCE) {
            if (currentInspectMode !== slot.id) {
                currentInspectMode = slot.id;
                targetLookAt.set(slot.position[0], 2, slot.position[2]);
                controls.autoRotate = true;
                controls.autoRotateSpeed = 2.0;

                const exhibit = exhibits.find(e => e.slotId === slot.id);
                if (exhibit) {
                    uiTitle.innerHTML = `<h2>${exhibit.title}</h2>by ${exhibit.author}`;
                    uiTitle.style.display = 'block';
                }
            }
        } else if (dist >= INSPECT_DISTANCE && currentInspectMode) {
            currentInspectMode = null;
            targetLookAt.copy(WALK_TARGET);
            controls.autoRotate = false;
            uiTitle.style.display = 'none';
        }
    }

    controls.target.lerp(targetLookAt, 0.05);
}

const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    updateInteraction();
    controls.update();
    renderer.render(scene, camera);
}
animate();
