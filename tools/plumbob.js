// The landing's plumbob, told in five states as one continuous sequence (f = 0 → 1):
//   Listen     0.00–0.18  one whole glass gem, turning
//   Make sense 0.18–0.38  its eight faces drift apart into shards
//   Map        0.38–0.55  the shards are joined by threads, like a blueprint
//   Shape      0.55–0.75  the glass falls away to a wireframe as it pulls back together
//   Ship       0.75–1.00  solid green glass again, lit from inside
// window.renderFrame(f) draws one frame; the page background must match BG.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const BG = '#eef0ea';
const SIZE = 1000;

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const seg = (f, a, b) => clamp01((f - a) / (b - a));
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const mix = (a, b, t) => a + (b - a) * t;

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(SIZE, SIZE);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(BG);
const pmrem = new THREE.PMREMGenerator(renderer);
// Studio environment: a pale room with three hard softboxes, so every facet catches a clean highlight as it turns
const studio = new RoomEnvironment();
const softbox = (w, h, x, y, z, k) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide }));
  m.position.set(x, y, z); m.lookAt(0, 0, 0); studio.add(m);
};
softbox(10, 2.2, 0, 9, 4, 14);    // long strip overhead
softbox(2.5, 9, -9, 1, 2, 9);     // tall strip, left
softbox(2, 6, 8, 0, -5, 6);       // kicker, back right
scene.environment = pmrem.fromScene(studio, 0.01).texture;

const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
camera.position.set(0, 0.15, 7.4);
camera.lookAt(0, 0, 0);

const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(-3, 5, 4);
const rim = new THREE.DirectionalLight(0xd8ffe6, 1.4);
rim.position.set(4, -1, -3);
scene.add(key, rim, new THREE.AmbientLight(0xffffff, 0.3));

// Backdrop: a soft white glow in the middle that fades exactly into the page colour
function radialTexture(stops) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// Opaque on purpose: transmission only refracts opaque objects, so the rings live in the backdrop itself
// The visible part of the plane is its central ~60%, so everything settles to BG by half radius
const backdropTex = radialTexture([[0, '#ffffff'], [0.22, '#f7f8f4'], [0.48, BG], [1, BG]]);
{
  const ctx = backdropTex.image.getContext('2d');
  const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 112);
  g.addColorStop(0, 'rgba(31,107,63,.04)'); g.addColorStop(0.55, 'rgba(31,107,63,.2)'); g.addColorStop(1, 'rgba(31,107,63,0)');
  ctx.strokeStyle = g;
  for (let r = 8; r < 112; r += 7) { ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(256, 256, r, 0, Math.PI * 2); ctx.stroke(); }
  backdropTex.needsUpdate = true;
}
const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: backdropTex, toneMapped: false }));
backdrop.position.z = -2.5;
scene.add(backdrop);

// Glow behind the gem for the Ship state
const halo = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({
  map: radialTexture([[0, 'rgba(110,231,150,0.55)'], [0.35, 'rgba(110,231,150,0.18)'], [1, 'rgba(110,231,150,0)']]),
  transparent: true, depthWrite: false, toneMapped: false,
}));
halo.position.z = -1.2;
scene.add(halo);

// Contact shadow under the gem
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.5), new THREE.MeshBasicMaterial({
  map: radialTexture([[0, 'rgba(30,45,35,0.30)'], [1, 'rgba(30,45,35,0)']]), transparent: true, depthWrite: false, toneMapped: false,
}));
shadow.position.set(0, -1.75, 0);
shadow.rotation.x = -1.35;
scene.add(shadow);

// ---------- the gem: an elongated octahedron built from eight separable shards ----------
const H = 1.35, R = 0.78, T = 0.12; // half-height, equator radius, shard thickness
const top = new THREE.Vector3(0, H, 0), bottom = new THREE.Vector3(0, -H, 0);
const eq = [0, 1, 2, 3].map((i) => new THREE.Vector3(Math.cos(i * Math.PI / 2 + Math.PI / 4) * R, 0, Math.sin(i * Math.PI / 2 + Math.PI / 4) * R));
const faces = [];
for (let i = 0; i < 4; i++) {
  const a = eq[i], b = eq[(i + 1) % 4];
  faces.push([top, b, a], [bottom, a, b]);
}

const glass = new THREE.MeshPhysicalMaterial({
  color: 0xffffff, transmission: 1, thickness: 2.2, roughness: 0.02, ior: 1.7, dispersion: 1.2,
  iridescence: 0.5, iridescenceIOR: 1.3, clearcoat: 1, clearcoatRoughness: 0.02,
  attenuationColor: new THREE.Color(0x8fe3b0), attenuationDistance: 1.6,
  specularIntensity: 1, envMapIntensity: 1.6, flatShading: true, transparent: true,
});

const gem = new THREE.Group();
scene.add(gem);
const shards = faces.map(([p0, p1, p2]) => {
  const centroid = new THREE.Vector3().add(p0).add(p1).add(p2).divideScalar(3);
  const normal = new THREE.Vector3().subVectors(p1, p0).cross(new THREE.Vector3().subVectors(p2, p0)).normalize();
  if (normal.dot(centroid) < 0) normal.negate();
  // Local coordinates around the centroid so each shard can drift and tumble on its own
  const front = [p0, p1, p2].map((p) => p.clone().sub(centroid));
  const back = front.map((p) => p.clone().addScaledVector(normal, -T).multiplyScalar(0.92));
  const tris = [front, [back[0], back[2], back[1]]];
  for (let k = 0; k < 3; k++) {
    const k2 = (k + 1) % 3;
    tris.push([front[k], back[k], back[k2]], [front[k], back[k2], front[k2]]);
  }
  const pos = [];
  tris.forEach((t) => t.forEach((v) => pos.push(v.x, v.y, v.z)));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, glass);
  mesh.position.copy(centroid);
  gem.add(mesh);
  const spin = new THREE.Vector3(Math.sin(centroid.x * 9.1), Math.cos(centroid.y * 7.3), Math.sin(centroid.z * 5.7)).normalize();
  return { mesh, centroid, normal, spin };
});

// Inner light
const coreMat = new THREE.MeshBasicMaterial({ color: 0x9ff5bd, transparent: true, toneMapped: false });
const core = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 16), coreMat);
gem.add(core);

// Tubes for the wireframe (gem edges) and the blueprint threads (shard to shard)
const ink = new THREE.MeshBasicMaterial({ color: 0x1f6b3f, transparent: true, toneMapped: false });
const thread = new THREE.MeshBasicMaterial({ color: 0x2f8f57, transparent: true, toneMapped: false });
function tube(material, r = 0.012) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 10, 1, true), material);
  gem.add(m);
  return m;
}
function placeTube(m, a, b, grow = 1) {
  const end = new THREE.Vector3().lerpVectors(a, b, grow);
  const len = a.distanceTo(end);
  m.visible = len > 1e-3;
  m.position.lerpVectors(a, end, 0.5);
  m.scale.set(1, len || 1e-3, 1);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(a).normalize());
}
const edgePairs = [];
for (let i = 0; i < 4; i++) edgePairs.push([top, eq[i]], [bottom, eq[i]], [eq[i], eq[(i + 1) % 4]]);
const edges = edgePairs.map(() => tube(ink, 0.014));
const nodes = [top, bottom, ...eq].map(() => { const n = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 8), ink); gem.add(n); return n; });
const nodeAnchors = [top, bottom, ...eq];
// Threads join neighbouring shards: each upper shard to its lower twin and to the next upper shard
const threadPairs = [];
for (let i = 0; i < 4; i++) threadPairs.push([i * 2, i * 2 + 1], [i * 2, ((i + 1) % 4) * 2], [i * 2 + 1, ((i + 1) % 4) * 2 + 1]);
const threads = threadPairs.map(() => tube(thread, 0.008));
const knots = shards.map(() => { const k = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 8), thread); gem.add(k); return k; });

const neutral = new THREE.Color(0xa8e6c2), green = new THREE.Color(0x22c55e);

// Thin bands behind the gem give the glass something to bend
const bands = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({
  map: (() => {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = 'rgba(40,120,80,.22)';
    for (let r = 30; r < 256; r += 26) { ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(256, 256, r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.globalCompositeOperation = 'destination-in'; ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })(),
  transparent: true, depthWrite: false, toneMapped: false,
}));
bands.position.z = -1.6;
bands.visible = false; // superseded by the rings in the backdrop

window.renderFrame = (f) => {
  const apart = ease(seg(f, 0.18, 0.38)) * (1 - ease(seg(f, 0.55, 0.72))); // shards out, then back
  const threadsIn = ease(seg(f, 0.4, 0.53)) * (1 - seg(f, 0.56, 0.64));
  const glassOn = 1 - ease(seg(f, 0.55, 0.68)) + ease(seg(f, 0.76, 0.9)); // fades to wireframe, then back
  const wire = ease(seg(f, 0.58, 0.7)) * (1 - ease(seg(f, 0.8, 0.92)));
  const ship = ease(seg(f, 0.78, 1));

  gem.rotation.set(0.12 + Math.sin(f * Math.PI) * 0.12, f * Math.PI * 2.5 + 0.35, Math.sin(f * Math.PI * 2) * 0.05);
  gem.position.y = Math.sin(f * Math.PI * 4) * 0.05 + 0.05;

  shards.forEach((s, i) => {
    s.mesh.position.copy(s.centroid).addScaledVector(s.normal, apart * (0.62 + (i % 3) * 0.08));
    s.mesh.quaternion.setFromAxisAngle(s.spin, apart * 0.55);
  });
  glass.opacity = clamp01(glassOn);
  glass.visible = glass.opacity > 0.01;
  glass.attenuationColor.copy(neutral).lerp(green, 0.35 + ship * 0.65);
  glass.attenuationDistance = mix(1.8, 1.05, ship);
  glass.color.copy(new THREE.Color(0xffffff)).lerp(new THREE.Color(0xd6fbe3), ship);
  bands.rotation.z = f * 0.6;
  bands.material.opacity = 0.7 + ship * 0.3;

  // Wireframe hugs the gem's outline
  edges.forEach((m, i) => { placeTube(m, edgePairs[i][0], edgePairs[i][1], wire); });
  ink.opacity = wire;
  nodes.forEach((n, i) => { n.position.copy(nodeAnchors[i]); n.visible = wire > 0.02; n.scale.setScalar(wire); });

  // Threads between shard centres
  shards.forEach((s, i) => { knots[i].position.copy(s.mesh.position); knots[i].scale.setScalar(threadsIn); knots[i].visible = threadsIn > 0.02; });
  threads.forEach((m, i) => { const [a, b] = threadPairs[i]; placeTube(m, shards[a].mesh.position, shards[b].mesh.position, threadsIn); });
  thread.opacity = threadsIn;

  core.scale.setScalar(mix(0.7, 1.25, ship) * (1 - apart * 0.4));
  coreMat.color.set(0xd8f5e2).lerp(new THREE.Color(0x6df2a0), ship);
  coreMat.opacity = mix(0.55, 1, ship) * Math.max(clamp01(glassOn), 0.35);
  halo.material.opacity = 0.35 + ship * 0.65;
  halo.scale.setScalar(mix(0.6, 1.1, ship));
  shadow.material.opacity = mix(0.9, 0.55, apart);
  shadow.scale.setScalar(mix(1, 1.35, apart));

  renderer.render(scene, camera);
  return true;
};

// Mask pass for the transparent sequence: the gem's coverage in white on black.
// The capture script uses it as the alpha channel of the normal render.
const maskOf = new Map();
const white = (opacity) => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity, toneMapped: false });
window.renderMask = (f) => {
  window.renderFrame(f);
  const hidden = [backdrop, halo, shadow, bands, core];
  hidden.forEach((o) => { o.userData.was = o.visible; o.visible = false; });
  scene.background = new THREE.Color(0x000000);
  const env = scene.environment; scene.environment = null;
  gem.traverse((o) => {
    if (!o.isMesh || o === core) return;
    maskOf.set(o, o.material);
    const op = o.material === glass ? (glass.visible ? glass.opacity : 0) : o.material.opacity;
    o.material = white(op);
  });
  renderer.render(scene, camera);
  gem.traverse((o) => { if (maskOf.has(o)) { o.material.dispose(); o.material = maskOf.get(o); } });
  maskOf.clear();
  hidden.forEach((o) => { o.visible = o.userData.was; });
  scene.background = new THREE.Color(BG);
  scene.environment = env;
  return true;
};

const f = Number(new URLSearchParams(location.search).get('f') ?? 0);
window.renderFrame(f);
window.ready = true;
