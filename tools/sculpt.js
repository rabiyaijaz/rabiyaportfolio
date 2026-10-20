import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const q = new URLSearchParams(location.search);
const n = (k, d) => (q.has(k) ? parseFloat(q.get(k)) : d);
const W = n('w', 1200), H = n('h', 1600);
const shot = { az: n('az', 0.25), el: n('el', 0.04), dist: n('dist', 1.6), look: n('look', 0.2) };

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0, 0);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;
scene.add(new THREE.HemisphereLight(0xfff4ea, 0x2a2140, 0.9));
const key = new THREE.DirectionalLight(0xfff1e2, 2.2); key.position.set(-1.2, 2, 2.2); scene.add(key);
const rim = new THREE.DirectionalLight(0x6fe39a, 2.6); rim.position.set(1.4, 1.2, -2); scene.add(rim);
const rim2 = new THREE.DirectionalLight(0xffb27a, 1.1); rim2.position.set(-1.6, 0.4, -1.6); scene.add(rim2);

const camera = new THREE.PerspectiveCamera(30, W / H, 0.01, 50);
camera.position.set(Math.sin(shot.az) * Math.cos(shot.el) * shot.dist, shot.look + Math.sin(shot.el) * shot.dist, Math.cos(shot.az) * Math.cos(shot.el) * shot.dist);
camera.lookAt(0, shot.look, 0);

const clay = new THREE.MeshStandardMaterial({ color: 0xf3eee8, roughness: 0.62, metalness: 0 });
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
loader.load('/models/rabiya-white.glb', (gltf) => {
  const m = gltf.scene;
  m.traverse((o) => { if (o.isMesh) o.material = clay; });
  m.rotation.y = -Math.PI / 2; // faces the camera at az = 0
  scene.add(m);
  renderer.render(scene, camera);
  window.__done = true;
});
