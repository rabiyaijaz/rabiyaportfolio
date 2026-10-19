// A project house for the neighbourhood: pitched front-gable roof with overhang and chimney,
// a name board sized to its text (so names never clip), the project's logo in a roundel in the gable,
// and the brand colour on the door, canopy and shutters. Front faces +Z, resting on y = 0.
// One small prop hints at each case study (a ramp for Access Adda, a cross for Flownet, a flag for Banao).
import * as THREE from 'three';
import { canvasTexture, createMailbox, mat, PALETTE } from './assets.js';

const STOREY = 2.7, BASE = 0.3;
const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; };
const shade = (hex, k) => new THREE.Color(hex).multiplyScalar(k).getHex();

/** Name board: canvas measured to the text, plank sized to the canvas. Never clips. */
function nameBoard(text, color, maxW) {
  const font = '800 76px "Nunito Sans", "Geist Variable", Arial, sans-serif';
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = font;
  const cw = Math.ceil(probe.measureText(text).width) + 96, ch = 128;
  const tex = canvasTexture(cw, ch, (ctx, w, h) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(0, 0, w, h, 26); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(9, 9, w - 18, h - 18, 18); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 4);
  });
  let H = 0.64, W = (H * cw) / ch;
  if (W > maxW) { W = maxW; H = (W * ch) / cw; }
  // Softly self-lit so the name stays readable at dusk and night
  const face = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.55 });
  const edge = mat(0xffffff, { roughness: 0.6 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.08), [edge, edge, edge, edge, face, edge]);
  return { mesh: m, H };
}

// Logos with a dedicated roundel texture in public/img/logos/house/ (512px, flattened on white)
const HOUSE_ROUNDELS = new Set(['vettio']);

/** Logo roundel: white ring + the project's logo (or a monogram). */
function roundel(logo, name, color, r) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.CircleGeometry(r * 1.22, 40), mat(0xffffff, { roughness: 0.5, emissive: 0xffffff, emissiveIntensity: 0.35 }));
  const discMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, emissive: 0xffffff, emissiveIntensity: 0.5 });
  if (logo) {
    // A dedicated 512px roundel (logo on white, padded for the circle) where one exists in
    // img/logos/house/, otherwise the regular logo. Mipmaps + anisotropy keep it crisp at an angle.
    const url = HOUSE_ROUNDELS.has(logo) ? `/img/logos/house/${logo}.webp` : `/img/logos/${logo}.webp`;
    new THREE.TextureLoader().load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; discMat.map = t; discMat.emissiveMap = t; discMat.needsUpdate = true; });
  } else {
    discMat.map = discMat.emissiveMap = canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = color; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff'; ctx.font = '800 110px "Nunito Sans", Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(name.replace(/[^A-Z]/g, '').slice(0, 2) || name[0], w / 2, h / 2 + 6);
    });
  }
  const disc = new THREE.Mesh(new THREE.CircleGeometry(r, 40), discMat);
  disc.position.z = 0.012;
  g.add(ring, disc);
  return g;
}

export function createHouse({ name, logo, w = 7.2, d = 6, storeys = 1, wall = 0xf2e6cf, roof = 0x9b3d33, accent = '#1f6b3f', extras = [], pathLen = 2.6, rand = Math.random }) {
  const g = new THREE.Group();
  const acc = new THREE.Color(accent).getHex();
  const wallMat = mat(wall, { roughness: 0.85 });
  const trim = mat(0xffffff, { roughness: 0.6 });
  const roofMat = mat(roof, { roughness: 0.72, flatShading: true });
  const accMat = mat(acc, { roughness: 0.55 });
  // Same material as the other buildings so the scene can light windows at night
  const glassMat = mat(0x9cc7e6, { roughness: 0.15, metalness: 0.2, emissive: 0x23384d, emissiveIntensity: 0.25 });
  const H = STOREY * storeys, top = BASE + H, front = d / 2;

  // Plinth and walls, with a trim band between storeys
  g.add(box(w + 0.3, BASE, d + 0.3, mat(0x9a948a), 0, BASE / 2, 0));
  g.add(box(w, H, d, wallMat, 0, BASE + H / 2, 0));
  for (let s = 1; s < storeys; s++) g.add(box(w + 0.06, 0.12, d + 0.06, trim, 0, BASE + s * STOREY, 0));

  // Front-gable roof: wall infill triangle, two thick slopes with overhang, fascia, chimney
  const half = w / 2, rh = w * 0.38, over = 0.45;
  const tri = new THREE.Shape(); tri.moveTo(-half, 0); tri.lineTo(0, rh); tri.lineTo(half, 0); tri.closePath();
  const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: d, bevelEnabled: false }), wallMat);
  gable.position.set(0, top, -front);
  g.add(gable);
  const run = half + over, slope = Math.hypot(run, rh * (run / half)), ang = Math.atan2(rh, half);
  for (const side of [-1, 1]) {
    const slab = box(slope, 0.22, d + over * 2, roofMat);
    slab.position.set(side * run / 2 - side * over / 2 + side * 0.02, top + rh / 2 + 0.06 - (over * Math.tan(ang)) / 2, 0);
    slab.rotation.z = -side * ang;
    g.add(slab);
    // White fascia along the front edge of each slope
    const fas = box(slope, 0.16, 0.08, trim);
    fas.position.set(slab.position.x, slab.position.y - 0.02, front + over + 0.02);
    fas.rotation.z = slab.rotation.z;
    g.add(fas);
  }
  g.add(box(0.32, 0.32, d + over * 2 + 0.04, mat(shade(roof, 0.75), { roughness: 0.7 }), 0, top + rh + 0.08, 0)); // ridge cap
  g.add(box(0.6, rh * 0.9, 0.6, mat(0x8c4a3c, { roughness: 0.8 }), w * 0.24, top + rh * 0.62, -d * 0.18));
  g.add(box(0.74, 0.12, 0.74, mat(0x6f3a2f), w * 0.24, top + rh * 1.07, -d * 0.18));

  // The project's emblem in the gable
  const emb = roundel(logo, name, accent, Math.min(0.62, rh * 0.26));
  emb.position.set(0, top + rh * 0.42, front + 0.02);
  g.add(emb);

  // Windows: frame, glass, mullion, brand-coloured shutters and a flower box
  const flowers = [0xe2556b, 0xf2d04b, 0xffffff, 0xb36be0, 0xf08a3c];
  const window = (x, y, ww = 1.1, hh = 1.05, box_ = true) => {
    g.add(box(ww, hh, 0.06, trim, x, y, front + 0.03));
    g.add(box(ww - 0.16, hh - 0.16, 0.08, glassMat, x, y, front + 0.04));
    g.add(box(0.06, hh - 0.16, 0.1, trim, x, y, front + 0.05));
    for (const s of [-1, 1]) g.add(box(0.26, hh, 0.05, accMat, x + s * (ww / 2 + 0.17), y, front + 0.03));
    if (box_) {
      g.add(box(ww + 0.1, 0.18, 0.28, mat(0x7a5536), x, y - hh / 2 - 0.08, front + 0.14));
      for (let i = 0; i < 4; i++) {
        const f = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), mat(flowers[Math.floor(rand() * flowers.length)]));
        f.position.set(x - ww / 2 + 0.15 + i * ((ww - 0.3) / 3), y - hh / 2 + 0.05, front + 0.17);
        g.add(f);
      }
    }
  };
  const gy = BASE + STOREY * 0.55;
  window(-w * 0.31, gy); window(w * 0.31, gy);
  for (let s = 1; s < storeys; s++) { const y = BASE + s * STOREY + STOREY * 0.55; window(-w * 0.27, y); window(0, y, 1.0, 1.05, false); window(w * 0.27, y); }
  // Side windows so the houses read from the map too
  for (const sx of [-1, 1]) for (let s = 0; s < storeys; s++) {
    const fw = new THREE.Group();
    fw.add(box(1.0, 0.95, 0.06, trim), box(0.84, 0.79, 0.08, glassMat));
    fw.position.set(sx * (half + 0.03), BASE + s * STOREY + STOREY * 0.55, 0); fw.rotation.y = sx * Math.PI / 2;
    g.add(fw);
  }

  // Door in the brand colour, with a canopy and a step (or a ramp)
  g.add(box(1.2, 2.1, 0.06, trim, 0, BASE + 1.05, front + 0.02));
  g.add(box(0.94, 1.92, 0.08, accMat, 0, BASE + 0.96, front + 0.04));
  g.add(box(0.08, 0.08, 0.06, mat(0xe8c66a, { metalness: 0.6, roughness: 0.3 }), 0.32, BASE + 0.95, front + 0.1));
  const can = box(1.7, 0.1, 0.75, accMat, 0, BASE + 2.28, front + 0.38); can.rotation.x = 0.16; g.add(can);
  if (extras.includes('ramp')) {
    // Access Adda: a gentle ramp with a handrail instead of a step
    const ramp = box(1.3, 0.06, 2.2, mat(0xb5afa3), 0, BASE / 2, front + 1.2); ramp.rotation.x = Math.atan2(BASE, 2.2); g.add(ramp);
    const rail = box(0.06, 0.06, 2.2, mat(0x2c3136, { metalness: 0.5 }), 0.68, BASE + 0.85, front + 1.2); rail.rotation.x = ramp.rotation.x; g.add(rail);
    for (const z of [0.3, 1.2, 2.1]) g.add(box(0.05, 0.85, 0.05, mat(0x2c3136, { metalness: 0.5 }), 0.68, BASE * (1 - z / 2.2) + 0.42, front + z));
  } else {
    g.add(box(1.6, 0.18, 0.7, mat(0xb5afa3), 0, 0.09, front + 0.45));
  }

  // Name board between the door canopy and the roof / upper floor, sized to the name
  const boardMaxW = w - 1.0;
  const { mesh: board, H: bh } = nameBoard(name, accent, boardMaxW);
  const roomAbove = (storeys > 1 ? BASE + STOREY + 0.55 : top - 0.08) - (BASE + 2.45);
  board.position.set(0, BASE + 2.45 + Math.min(roomAbove, bh + 0.1) / 2 + 0.04, front + 0.09);
  g.add(board);

  // Case-study props
  if (extras.includes('cross')) {
    const c = mat(0x2fb043, { emissive: 0x1a7a2a, emissiveIntensity: 0.45 });
    const y = top - 0.75;
    g.add(box(0.9, 0.3, 0.1, c, half - 0.75, y, front + 0.06), box(0.3, 0.9, 0.1, c, half - 0.75, y, front + 0.06));
  }
  if (extras.includes('flag')) {
    g.add(box(0.08, 5.5, 0.08, mat(0xdddddd, { metalness: 0.6 }), half + 1.1, 2.75, front + 1));
    g.add(box(1.2, 0.7, 0.03, accMat, half + 1.7, 5.1, front + 1));
  }

  // Front path, mailbox and hedges
  g.add(box(1.2, 0.04, pathLen, mat(PALETTE.sidewalk, { roughness: 0.95 }), 0, 0.02, front + 0.8 + pathLen / 2));
  const mailbox = createMailbox(); mailbox.position.set(1.15, 0, front + 0.8 + pathLen - 0.4); g.add(mailbox);
  const bushGeo = new THREE.IcosahedronGeometry(0.3, 0);
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const b = new THREE.Mesh(bushGeo, mat(0x4f8a35, { flatShading: true }));
    b.position.set(side * (1.2 + i * 0.55), 0.24, front + 0.45 + rand() * 0.15);
    g.add(b);
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
