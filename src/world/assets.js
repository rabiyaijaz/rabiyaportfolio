// Procedural Sims-2-neighborhood asset kit (ported from /3d-lab).
// Every factory returns a THREE.Group in metres, front facing +Z, resting on y = 0.
// Static pieces are later merged by `bakeStatic` so the whole town costs ~40 draw calls.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------- materials (memoised so identical looks share one material) ----------
const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...opts }));
  return matCache.get(key);
}

function shadowed(obj) {
  obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return obj;
}

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  return m;
}

export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function seeded(seed = 1) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export const PALETTE = {
  grass: 0x86b94f,
  asphalt: 0x4d5257,
  sidewalk: 0xc9c4b8,
  taxiYellow: 0xf3c02b,
  chrome: 0xd9dde3,
  rubber: 0x1d1f22,
  glass: 0x2b3f55,
  plumbob: 0x4be15a,
};

// ---------- Plumbob ----------
export function createPlumbob({ size = 0.5, color = PALETTE.plumbob, light = true } = {}) {
  const g = new THREE.Group();
  const geo = new THREE.OctahedronGeometry(size, 0);
  geo.scale(0.62, 1.35, 0.62);
  const material = new THREE.MeshPhysicalMaterial({
    color, emissive: color, emissiveIntensity: 0.45, roughness: 0.12,
    clearcoat: 1, transparent: true, opacity: 0.92, flatShading: true,
  });
  const gem = new THREE.Mesh(geo, material);
  g.add(gem);
  if (light) g.add(new THREE.PointLight(color, 2.2, 4, 2));
  g.userData = {
    baseY: 0, gem, material,
    tick(t) {
      gem.rotation.y = t * 1.6;
      g.position.y = g.userData.baseY + Math.sin(t * 2.2) * 0.08;
    },
  };
  return g;
}

// ---------- Taxi ----------
export function createTaxi() {
  const outer = new THREE.Group();
  const car = new THREE.Group(); // modelled nose-on-+X, rotated so it faces +Z
  car.rotation.y = -Math.PI / 2;
  outer.add(car);

  const paint = mat(PALETTE.taxiYellow, { roughness: 0.35, metalness: 0.15 });
  const chrome = mat(PALETTE.chrome, { roughness: 0.2, metalness: 0.9 });
  const glass = mat(PALETTE.glass, { roughness: 0.1, metalness: 0.3 });
  const dark = mat(0x222428, { roughness: 0.6 });

  const body = new THREE.Mesh(new RoundedBoxGeometry(4.5, 0.78, 1.86, 4, 0.22), paint);
  body.position.y = 0.78;
  const cabin = new THREE.Mesh(new RoundedBoxGeometry(2.35, 0.72, 1.7, 4, 0.24), paint);
  cabin.position.set(-0.25, 1.45, 0);
  car.add(body, cabin);

  for (const z of [0.86, -0.86]) {
    car.add(box(0.95, 0.46, 0.02, glass, 0.28, 1.47, z));
    car.add(box(0.95, 0.46, 0.02, glass, -0.82, 1.47, z));
  }
  const wind = box(0.03, 0.52, 1.5, glass, 0.93, 1.45, 0);
  wind.rotation.z = -0.38;
  const rear = box(0.03, 0.5, 1.5, glass, -1.43, 1.45, 0);
  rear.rotation.z = 0.38;
  car.add(wind, rear);

  const checker = canvasTexture(256, 16, (ctx, w, h) => {
    const s = 8;
    for (let x = 0; x < w; x += s) for (let y = 0; y < h; y += s) {
      ctx.fillStyle = ((x + y) / s) % 2 ? '#111' : '#f4f1e8';
      ctx.fillRect(x, y, s, s);
    }
  });
  const stripeMat = new THREE.MeshStandardMaterial({ map: checker, roughness: 0.5 });
  for (const z of [0.935, -0.935]) car.add(box(3.6, 0.16, 0.01, stripeMat, -0.1, 0.98, z));

  const signTex = canvasTexture(256, 96, (ctx, w, h) => {
    ctx.fillStyle = '#fff6d5'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 64px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('TAXI', w / 2, h / 2 + 4);
  });
  const signFace = new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xffe9a0, emissiveIntensity: 0.25 });
  const signSide = mat(0xfff6d5);
  const sign = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.28, 0.8, 2, 0.05), [signFace, signFace, signSide, signSide, signSide, signSide]);
  sign.position.set(-0.25, 1.95, 0);
  car.add(sign);

  car.add(box(0.14, 0.2, 1.9, chrome, 2.28, 0.45, 0));
  car.add(box(0.14, 0.2, 1.9, chrome, -2.28, 0.45, 0));
  car.add(box(0.05, 0.34, 0.9, chrome, 2.25, 0.78, 0));
  const head = new THREE.MeshStandardMaterial({ color: 0xfff7d6, emissive: 0xfff2b0, emissiveIntensity: 0.8 });
  const tail = new THREE.MeshStandardMaterial({ color: 0xc8231d, emissive: 0x8a0f0a, emissiveIntensity: 0.6 });
  for (const z of [0.62, -0.62]) {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 18), head);
    h.rotation.z = Math.PI / 2; h.position.set(2.24, 0.86, z);
    car.add(h, box(0.05, 0.16, 0.3, tail, -2.25, 0.86, z));
  }

  // Rear passenger door on the right-hand (kerb) side, hinged at its front edge.
  // Car-local +Z becomes the outer group's right-hand side after the -90° turn.
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-0.35, 0, 0.95);
  const door = new THREE.Group();
  door.add(box(1.05, 0.62, 0.05, paint, -0.52, 0.86, 0));
  door.add(box(0.9, 0.42, 0.03, glass, -0.5, 1.45, 0.02));
  door.add(box(1.05, 0.16, 0.06, stripeMat, -0.52, 0.98, 0));
  doorPivot.add(door);
  car.add(doorPivot);

  const wheels = [];
  const tyreGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 24);
  const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.32, 16);
  for (const x of [1.4, -1.4]) for (const z of [0.85, -0.85]) {
    const w = new THREE.Group();
    const tyre = new THREE.Mesh(tyreGeo, mat(PALETTE.rubber, { roughness: 0.9 }));
    const hub = new THREE.Mesh(hubGeo, chrome);
    tyre.rotation.x = hub.rotation.x = Math.PI / 2;
    w.add(tyre, hub);
    w.position.set(x, 0.4, z);
    car.add(w);
    wheels.push(w);
  }
  for (const x of [1.4, -1.4]) for (const z of [0.93, -0.93]) car.add(box(0.95, 0.08, 0.02, dark, x, 0.84, z));

  outer.userData = {
    spin: (dist) => wheels.forEach((w) => { w.rotation.z = -dist / 0.4; }),
    setDoor: (open) => { doorPivot.rotation.y = open * 1.1; },
  };
  return shadowed(outer);
}

// ---------- Buildings ----------
function signTexture(text, bg, fg) {
  return canvasTexture(512, 128, (ctx, w, h) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 8; ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.fillStyle = fg; ctx.font = 'bold 64px "Nunito Sans", Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 4);
  });
}

/**
 * Parametric lot building.
 * roof: 'gable' | 'flat'; extras: ['flag', 'awning', 'cross']
 */
export function createBuilding({
  w = 6, d = 5, h = 2.8, storeys = 1, wall = 0xf2e6cf, roof = 0x9b3d33, roofStyle = 'gable',
  sign, signColor = '#3e4cb6', extras = [], pathLen = 4, rand = Math.random,
} = {}) {
  const g = new THREE.Group();
  const wallMat = mat(wall, { roughness: 0.85 });
  const trim = mat(0xffffff, { roughness: 0.6 });
  const glassMat = mat(0x9cc7e6, { roughness: 0.15, metalness: 0.2, emissive: 0x23384d, emissiveIntensity: 0.25 });
  const totalH = h * storeys;
  const top = 0.3 + totalH;

  g.add(box(w + 0.3, 0.3, d + 0.3, mat(0x9a948a), 0, 0.15, 0));
  g.add(box(w, totalH, d, wallMat, 0, 0.3 + totalH / 2, 0));

  if (roofStyle === 'gable') {
    const rh = Math.min(w, d) * 0.42;
    const shape = new THREE.Shape();
    shape.moveTo(-(d / 2 + 0.45), 0); shape.lineTo(0, rh); shape.lineTo(d / 2 + 0.45, 0); shape.closePath();
    const roofGeo = new THREE.ExtrudeGeometry(shape, { depth: w + 0.5, bevelEnabled: false });
    roofGeo.translate(0, 0, -(w + 0.5) / 2);
    const roofMesh = new THREE.Mesh(roofGeo, mat(roof, { roughness: 0.75, flatShading: true }));
    roofMesh.rotation.y = Math.PI / 2;
    roofMesh.position.y = top;
    g.add(roofMesh);
    g.add(box(0.55, rh + 0.4, 0.55, mat(0x8c4a3c), w * 0.28, top + rh * 0.25, -d * 0.12));
  } else {
    g.add(box(w + 0.2, 0.25, d + 0.2, mat(roof, { roughness: 0.8 }), 0, top + 0.12, 0));
    g.add(box(w * 0.3, 0.6, d * 0.3, mat(0xb9bcc2), -w * 0.2, top + 0.55, -d * 0.15)); // rooftop unit
  }

  // Door
  g.add(box(1.15, 2.15, 0.06, trim, 0, 0.3 + 1.075, d / 2 + 0.02));
  g.add(box(0.9, 1.95, 0.08, roofStyle === 'flat' ? glassMat : mat(0x5a3a26, { roughness: 0.6 }), 0, 0.3 + 0.975, d / 2 + 0.04));
  g.add(box(1.6, 0.18, 0.7, mat(0xb5afa3), 0, 0.09, d / 2 + 0.45));

  // Windows
  const win = (x, y, z, rotY, ww = 1.1) => {
    const fw = new THREE.Group();
    fw.add(box(ww, 1.0, 0.06, trim), box(ww - 0.16, 0.84, 0.08, glassMat), box(0.06, 0.84, 0.1, trim));
    fw.position.set(x, y, z); fw.rotation.y = rotY;
    g.add(fw);
  };
  for (let s = 0; s < storeys; s++) {
    const y = 0.3 + s * h + h * 0.55;
    if (roofStyle === 'flat' && s > 0) {
      g.add(box(w - 0.8, 1.0, 0.08, glassMat, 0, y, d / 2 + 0.03)); // ribbon glazing
    } else {
      win(-w * 0.3, y, d / 2 + 0.03, 0);
      win(w * 0.3, y, d / 2 + 0.03, 0);
    }
    win(w / 2 + 0.03, y, 0, Math.PI / 2);
    win(-w / 2 - 0.03, y, 0, -Math.PI / 2);
  }

  if (sign) {
    const tex = signTexture(sign, signColor, '#fff');
    const board = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.8, 0.08), [mat(0xffffff), mat(0xffffff), mat(0xffffff), mat(0xffffff), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), mat(0xffffff)]);
    board.position.set(0, 0.3 + 2.75, d / 2 + 0.08);
    g.add(board);
  }
  if (extras.includes('awning')) {
    const stripes = canvasTexture(128, 32, (ctx) => { for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#e2556b'; ctx.fillRect(i * 16, 0, 16, 32); } });
    const aw = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, 0.08, 1.2), new THREE.MeshStandardMaterial({ map: stripes }));
    aw.position.set(0, 0.3 + 2.35, d / 2 + 0.6); aw.rotation.x = 0.25;
    g.add(aw);
  }
  if (extras.includes('flag')) {
    g.add(box(0.08, 6, 0.08, mat(0xdddddd, { metalness: 0.6 }), w / 2 + 1.2, 3, d / 2 + 1));
    g.add(box(1.2, 0.7, 0.03, mat(0x3e4cb6), w / 2 + 1.8, 5.55, d / 2 + 1));
  }
  if (extras.includes('cross')) {
    const c = mat(0x2fb043, { emissive: 0x1a7a2a, emissiveIntensity: 0.4 });
    g.add(box(0.9, 0.3, 0.1, c, w / 2 - 0.9, top - 0.6, d / 2 + 0.06), box(0.3, 0.9, 0.1, c, w / 2 - 0.9, top - 0.6, d / 2 + 0.06));
  }

  // Front path, mailbox, flower beds
  g.add(box(1.1, 0.04, pathLen, mat(PALETTE.sidewalk, { roughness: 0.95 }), 0, 0.02, d / 2 + 0.8 + pathLen / 2));
  const mailbox = createMailbox();
  mailbox.position.set(1.0, 0, d / 2 + 0.8 + pathLen - 0.4);
  g.add(mailbox);
  const flowers = [0xe2556b, 0xf2d04b, 0xffffff, 0xb36be0, 0xf08a3c];
  const bushGeo = new THREE.IcosahedronGeometry(0.26, 0);
  const flowerGeo = new THREE.SphereGeometry(0.07, 6, 4);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const b = new THREE.Mesh(bushGeo, mat(0x4f8a35, { flatShading: true }));
      b.position.set(side * (0.95 + i * 0.45), 0.22, d / 2 + 0.45 + rand() * 0.2);
      const f = new THREE.Mesh(flowerGeo, mat(flowers[Math.floor(rand() * flowers.length)]));
      f.position.set(b.position.x + (rand() - 0.5) * 0.2, 0.42, b.position.z + 0.1);
      g.add(b, f);
    }
  }
  return shadowed(g);
}

export function createMailbox() {
  const g = new THREE.Group();
  const metal = mat(0xb9bdc2, { metalness: 0.6, roughness: 0.35 });
  g.add(box(0.12, 1.0, 0.12, mat(0x7a5536), 0, 0.5, 0));
  g.add(box(0.34, 0.3, 0.5, metal, 0, 1.12, 0));
  g.add(box(0.03, 0.18, 0.1, mat(0xd23b2f), 0.19, 1.22, 0.08));
  return shadowed(g);
}

export function createStreetLamp() {
  const g = new THREE.Group();
  const iron = mat(0x2c3136, { metalness: 0.5, roughness: 0.4 });
  g.add(box(0.12, 3.4, 0.12, iron, 0, 1.7, 0), box(0.7, 0.08, 0.08, iron, 0.3, 3.35, 0));
  g.add(box(0.3, 0.2, 0.3, mat(0xfff3c4, { emissive: 0xffe7a1, emissiveIntensity: 0.7 }), 0.6, 3.22, 0));
  return shadowed(g);
}

// ---------- Forest: every tree merged into one vertex-coloured mesh ----------
export function createForest(spots, rand) {
  const parts = [];
  const tint = (geo, hex) => {
    const g = geo.index ? geo.toNonIndexed() : geo;
    g.deleteAttribute('uv');
    const c = new THREE.Color(hex);
    const arr = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < arr.length; i += 3) { arr[i] = c.r; arr[i + 1] = c.g; arr[i + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    return g;
  };
  const greens = [0x4e8b34, 0x5f9e3b, 0x3f7a2e, 0x6aa845];
  for (const { x, z, scale, pine } of spots) {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rand() * 6.28, 0)), new THREE.Vector3(scale, scale, scale));
    const add = (geo, hex, px, py, pz, rot) => {
      const local = new THREE.Matrix4().compose(new THREE.Vector3(px, py, pz), new THREE.Quaternion().setFromEuler(new THREE.Euler(...(rot || [0, 0, 0]))), new THREE.Vector3(1, 1, 1));
      parts.push(tint(geo, hex).applyMatrix4(new THREE.Matrix4().multiplyMatrices(m, local)));
    };
    add(new THREE.CylinderGeometry(0.14, 0.22, 1.6, 7), 0x6b4a2f, 0, 0.8, 0);
    if (pine) {
      for (let i = 0; i < 3; i++) add(new THREE.ConeGeometry(1.3 - i * 0.32, 1.5, 8), 0x2f6b3a, 0, 1.6 + i * 0.75, 0);
    } else {
      for (let i = 0; i < 3; i++) add(new THREE.IcosahedronGeometry(0.9 + rand() * 0.35, 0), greens[Math.floor(rand() * 4)], (rand() - 0.5) * 0.9, 2.1 + rand() * 0.6, (rand() - 0.5) * 0.9, [rand() * 3, rand() * 3, rand() * 3]);
    }
  }
  const mesh = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85 }));
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

// ---------- Road ----------
function ribbon(curve, width, y, material, segments = 400) {
  const pos = [], idx = [], uv = [];
  const up = new THREE.Vector3(0, 1, 0);
  const len = curve.getLength();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = curve.getPointAt(t % 1);
    const n = new THREE.Vector3().crossVectors(up, curve.getTangentAt(t % 1)).normalize().multiplyScalar(width / 2);
    pos.push(p.x + n.x, y, p.z + n.z, p.x - n.x, y, p.z - n.z);
    uv.push(0, (t * len) / width, 1, (t * len) / width);
    if (i < segments) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, material);
  m.receiveShadow = true;
  return m;
}

export function createRoad(curve, { width = 7 } = {}) {
  const g = new THREE.Group();
  g.add(ribbon(curve, width + 3.2, 0.02, mat(PALETTE.sidewalk, { roughness: 0.95 })));
  g.add(ribbon(curve, width + 0.3, 0.035, mat(0x9d9a92)));
  g.add(ribbon(curve, width, 0.05, mat(PALETTE.asphalt, { roughness: 0.92 })));
  const dashMat = mat(0xf4f1e2, { roughness: 0.6 });
  const count = Math.floor(curve.getLength() / 3);
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const dash = box(0.18, 0.02, 1.4, dashMat, p.x, 0.065, p.z);
    dash.rotation.y = Math.atan2(tan.x, tan.z);
    g.add(dash);
  }
  return g;
}

// ---------- The Sim: camera-facing cutout of the render ----------
export function createSimCutout(textureUrl, { height = 1.8 } = {}) {
  const g = new THREE.Group();
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.translate(0, 0.5, 0);
  const material = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.35 });
  const plane = new THREE.Mesh(geo, material);
  plane.scale.set(height * 0.66, height, 1);
  new THREE.TextureLoader().load(textureUrl, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    material.map = t; material.needsUpdate = true;
    plane.scale.set((t.image.width / t.image.height) * height, height, 1);
  });
  g.add(plane);

  const shadowTex = canvasTexture(128, 128, (ctx, w, h) => {
    const grd = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grd.addColorStop(0, 'rgba(0,0,0,0.45)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
  });
  const blobMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), blobMat);
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.02;
  g.add(blob);

  const bob = createPlumbob({ size: 0.2, light: false });
  bob.userData.baseY = height + 0.4;
  g.add(bob);

  g.userData = {
    tick(t, camera) {
      plane.rotation.y = Math.atan2(camera.position.x - g.position.x, camera.position.z - g.position.z);
      bob.userData.tick(t);
    },
    setOpacity(o) {
      material.opacity = o; blobMat.opacity = o; bob.userData.material.opacity = 0.92 * o;
      material.alphaTest = o < 1 ? 0.01 : 0.35;
      g.visible = o > 0.01;
    },
  };
  return g;
}

// ---------- Merge static meshes by material ----------
export function bakeStatic(root) {
  root.updateMatrixWorld(true);
  const groups = new Map();
  root.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material)) return;
    const geo = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(o.matrixWorld);
    for (const name of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(name)) geo.deleteAttribute(name);
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    if (!groups.has(o.material)) groups.set(o.material, []);
    groups.get(o.material).push(geo);
  });
  const baked = new THREE.Group();
  for (const [material, geos] of groups) {
    const m = new THREE.Mesh(mergeGeometries(geos), material);
    m.castShadow = m.receiveShadow = true;
    baked.add(m);
  }
  // Multi-material meshes (signs) stay as they are
  const keep = [];
  root.traverse((o) => { if (o.isMesh && Array.isArray(o.material)) keep.push(o); });
  for (const o of keep) {
    const clone = o.clone();
    o.matrixWorld.decompose(clone.position, clone.quaternion, clone.scale);
    baked.add(clone);
  }
  return baked;
}
