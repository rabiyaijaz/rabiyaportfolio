// The "Rangeen" house: a two-storey Peshawar-style row house strung with fairy lights, after the set in
// Hassan Raheem's Rangeen video. Not a project house, a place to visit on the street.
// Ground floor: pale teal plaster, two barred windows and open double doors onto a room with floral
// wallpaper, a red satin skirt, white garlands and tinsel bunting. Upper floor: mustard plaster, a balcony with
// an iron railing, two wooden French doors under jali transoms. Fairy lights outline the openings and hang in
// swags from the balcony and the eave. Neighbours on both sides, a motorbike and potted plants in front.
// On top, a roof terrace for Basant (kites.js): jali parapets, a stair room, a charpai and a charkhi.
// Front faces +Z, resting on y = 0. `lights` (0–1) is set from the clock: the bulbs and rooms glow at dusk and night.
import * as THREE from 'three';
import { canvasTexture, mat } from './assets.js';

const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; };
const plane = (w, h, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); return o; };

// ---------- textures ----------
const plaster = (base, seed = 1) => canvasTexture(256, 256, (ctx, w, h) => {
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 2600; i++) {
    const a = r() * 0.07;
    ctx.fillStyle = r() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`;
    ctx.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
  }
  for (let i = 0; i < 14; i++) { // weather stains
    const g = ctx.createRadialGradient(r() * w, r() * h, 2, r() * w, r() * h, 30 + r() * 50);
    g.addColorStop(0, 'rgba(60,50,30,0.07)'); g.addColorStop(1, 'rgba(60,50,30,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
});
const wallpaper = () => canvasTexture(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#d9a46f'; ctx.fillRect(0, 0, w, h);
  const flower = (x, y, s) => {
    ctx.fillStyle = '#c9524a';
    for (let k = 0; k < 5; k++) { const t = (k / 5) * Math.PI * 2; ctx.beginPath(); ctx.ellipse(x + Math.cos(t) * s, y + Math.sin(t) * s, s * 0.8, s * 0.55, t, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#e88a6a'; ctx.beginPath(); ctx.arc(x, y, s * 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7e9a5a'; ctx.beginPath(); ctx.ellipse(x + s * 1.6, y + s * 0.8, s * 0.9, s * 0.35, 0.6, 0, Math.PI * 2); ctx.fill();
  };
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) flower(x * 64 + (y % 2) * 32 + 16, y * 64 + 24, 7);
});
const satin = () => canvasTexture(256, 64, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, w, 0);
  for (let i = 0; i <= 12; i++) g.addColorStop(i / 12, i % 2 ? '#a8141c' : '#d6342c');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
});
const jali = () => canvasTexture(256, 96, (ctx, w, h) => {
  ctx.fillStyle = '#f2c98a'; ctx.fillRect(0, 0, w, h); // lit from behind
  ctx.fillStyle = '#3a2416';
  ctx.fillRect(0, 0, w, 10); ctx.fillRect(0, h - 10, w, 10); ctx.fillRect(0, 0, 10, h); ctx.fillRect(w - 10, 0, 10, h);
  for (let x = 10; x < w - 10; x += 26) for (let y = 10; y < h - 10; y += 19) {
    // a stepped lattice: alternating long and short bars, like the carved transoms in the reference
    ctx.fillRect(x, y, 18, 5);
    if (((x / 26) | 0) % 2 === ((y / 19) | 0) % 2) ctx.fillRect(x + 6, y, 5, 14);
  }
});
const tinsel = () => canvasTexture(256, 64, (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  const cols = ['#5bb6e8', '#e85b9a', '#f2d04b', '#7be87b', '#c9c9d6', '#e8743c'];
  for (let i = 0; i < 24; i++) {
    ctx.fillStyle = cols[i % cols.length];
    for (let k = 0; k < 6; k++) ctx.fillRect(i * 10.6 + k * 1.6, 0, 1.2, h * (0.55 + ((i * 7 + k) % 5) * 0.09));
  }
});
const hexGlass = () => canvasTexture(128, 256, (ctx, w, h) => {
  ctx.fillStyle = '#e9a463'; ctx.fillRect(0, 0, w, h); // warm light behind frosted glass
  ctx.strokeStyle = '#2c4744'; ctx.lineWidth = 10; ctx.strokeRect(5, 5, w - 10, h - 10);
  ctx.lineWidth = 7;
  for (const cy of [h * 0.3, h * 0.72]) {
    ctx.beginPath();
    for (let k = 0; k < 6; k++) { const t = (k / 6) * Math.PI * 2 + Math.PI / 6; ctx.lineTo(w / 2 + Math.cos(t) * 26, cy + Math.sin(t) * 20); }
    ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, cy); ctx.lineTo(w / 2 - 26, cy); ctx.moveTo(w / 2 + 26, cy); ctx.lineTo(w - 5, cy); ctx.stroke();
  }
});

// the roof: a jali tile (two diamonds over a row of slits, like the parapets in the reference),
// terracotta floor tiles, corrugated tin and a charpai's rope weave
const jaliTile = () => {
  const t = canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#e8d6a6'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(120,90,40,0.18)'; ctx.fillRect(0, 0, 4, h); ctx.fillRect(w - 4, 0, 4, h);
    ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = '#000';
    const diamond = (x, y, r) => { ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.8, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.8, y); ctx.closePath(); ctx.fill(); };
    diamond(34, 36, 22); diamond(94, 36, 22); diamond(64, 18, 9); diamond(64, 56, 9);
    for (const x of [14, 38, 62, 86, 110]) ctx.fillRect(x - 4, 74, 9, 44);
  });
  t.wrapS = THREE.RepeatWrapping;
  return t;
};
const roofTiles = () => {
  const t = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#c89a78'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      ctx.fillStyle = (x + y) % 3 ? '#d4a886' : '#c1916f'; ctx.fillRect(x * 32 + 1, y * 32 + 1, 30, 30);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2.4);
  return t;
};
const corrugated = () => canvasTexture(128, 64, (ctx, w, h) => {
  for (let x = 0; x < w; x += 8) { const g = ctx.createLinearGradient(x, 0, x + 8, 0); g.addColorStop(0, '#9c7b74'); g.addColorStop(0.5, '#c9a59c'); g.addColorStop(1, '#8a6a63'); ctx.fillStyle = g; ctx.fillRect(x, 0, 8, h); }
});
const weave = () => canvasTexture(128, 128, (ctx, w, h) => {
  ctx.fillStyle = '#b89c6c'; ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x + y) % 2) { ctx.fillStyle = '#dcc69a'; ctx.fillRect(x * 8, y * 8, 8, 8); }
});

// ---------- fairy lights ----------
// Bulbs are tiny spheres collected into one mesh by bakeStatic; their material glows with `lights`.
const BULB_GAP = 0.17;
function along(points, out) {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1], len = a.distanceTo(b), n = Math.max(1, Math.round(len / BULB_GAP));
    for (let k = 0; k < n; k++) out.push(a.clone().lerp(b, k / n));
  }
  out.push(points[points.length - 1].clone());
}
const rect = (x, y, w, h, z) => [new THREE.Vector3(x - w / 2, y - h / 2, z), new THREE.Vector3(x - w / 2, y + h / 2, z), new THREE.Vector3(x + w / 2, y + h / 2, z), new THREE.Vector3(x + w / 2, y - h / 2, z), new THREE.Vector3(x - w / 2, y - h / 2, z)];
/** A hanging loop between two points, sagging `sag` metres in the middle. */
function swag(a, b, sag, z, steps = 12) {
  const pts = [];
  for (let i = 0; i <= steps; i++) { const t = i / steps; pts.push(new THREE.Vector3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - sag * 4 * t * (1 - t), z)); }
  return pts;
}

export function createRangeenHouse() {
  const g = new THREE.Group();
  const NW = 2.6; // neighbour bay width
  const W = 7.8, D = 6, G = 3.15, U = 3.0, BASE = 0.22; // width, depth, ground and upper storey heights
  const front = D / 2;
  const groundTop = BASE + G, slab = 0.28, upperBot = groundTop + slab, upperTop = upperBot + U;

  // Materials
  const teal = new THREE.MeshStandardMaterial({ map: plaster('#8fbab0', 3), roughness: 0.95 });
  const mustard = new THREE.MeshStandardMaterial({ map: plaster('#9c9154', 7), roughness: 0.95 });
  const neighbour = new THREE.MeshStandardMaterial({ map: plaster('#5f8682', 11), roughness: 0.95 });
  const band = mat(0x4f706d, { roughness: 0.8 });
  const darkFrame = mat(0x3d4f4d, { roughness: 0.7 });
  const iron = mat(0x2a302f, { roughness: 0.5, metalness: 0.5 });
  const wood = mat(0x5b3320, { roughness: 0.6 });
  const leaf = mat(0x56636a, { roughness: 0.6 }); // the grey-blue door leaves
  const redPanel = mat(0xb5432f, { roughness: 0.7, emissive: 0x5a1a10, emissiveIntensity: 0.2 });
  // The rooms behind the openings are lit from inside: their emissive follows `lights`
  const roomMat = new THREE.MeshStandardMaterial({ map: wallpaper(), roughness: 0.9, emissive: 0xffd9a8, emissiveIntensity: 0.25 });
  roomMat.emissiveMap = roomMat.map;
  const satinMat = new THREE.MeshStandardMaterial({ map: satin(), roughness: 0.35, metalness: 0.1, emissive: 0x7a0a0a, emissiveIntensity: 0.2 });
  const glowGlass = new THREE.MeshStandardMaterial({ color: 0xe8a35a, roughness: 0.3, emissive: 0xff9233, emissiveIntensity: 0.4 });
  const jaliMat = new THREE.MeshStandardMaterial({ map: jali(), roughness: 0.7, emissive: 0xffb15c, emissiveIntensity: 0.3, transparent: false });
  jaliMat.emissiveMap = jaliMat.map;
  const hexMat = new THREE.MeshStandardMaterial({ map: hexGlass(), roughness: 0.5, emissive: 0xffa04a, emissiveIntensity: 0.3 });
  hexMat.emissiveMap = hexMat.map;
  const tinselMat = new THREE.MeshStandardMaterial({ map: tinsel(), transparent: true, alphaTest: 0.2, roughness: 0.3, metalness: 0.6, side: THREE.DoubleSide });
  const garland = mat(0xf4f1ea, { roughness: 0.8, emissive: 0x6a6050, emissiveIntensity: 0.2 });
  // warm tungsten bulbs: orange so they stay orange under tone mapping instead of burning to white
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffb35c, emissive: 0xff8a26, emissiveIntensity: 1.2, roughness: 0.4 });
  const wire = mat(0x1a1a1a, { roughness: 0.9 });
  let jaliMat2;
  const jaliMatOf = () => (jaliMat2 ||= new THREE.MeshStandardMaterial({ map: jaliTile(), roughness: 0.9, alphaTest: 0.5, side: THREE.DoubleSide }));

  // ---------- body ----------
  g.add(box(W + 0.2, BASE, D + 0.2, mat(0x8d8a82), 0, BASE / 2, 0));
  // The ground floor is a core block set back 1.3 m, plus a front wall slab with the window and door
  // openings actually cut out, so the rooms behind them show (the shallow gap is closed at the sides)
  const CORE = 1.3;
  g.add(box(W, G, D - CORE, teal, 0, BASE + G / 2, -CORE / 2));
  for (const s of [-1, 1]) g.add(box(0.12, G, CORE, teal, s * (W / 2 - 0.06), BASE + G / 2, front - CORE / 2));
  g.add(box(W + 0.5, slab, D + 0.9, band, 0, groundTop + slab / 2, 0.45)); // floor slab = balcony floor, projecting
  g.add(box(W, U, D, mustard, 0, upperBot + U / 2, 0));
  g.add(box(W + 0.3, 0.32, D + 0.5, band, 0, upperTop + 0.16, 0.2));      // eave band = the roof slab
  const RY = upperTop + 0.32; // the roof terrace floor (see "the roof terrace" below)
  // pale lintel band over the ground openings, like the reference
  g.add(box(W, 0.36, 0.06, mat(0xbcd2cc, { roughness: 0.9 }), 0, BASE + G - 0.3, front + 0.02));

  const bulbs = [];

  // ---------- ground floor: two barred windows with the room behind ----------
  const winW = 2.0, winH = 2.35, winY = BASE + 0.45 + winH / 2;
  for (const sx of [-1, 1]) {
    const x = sx * 2.55;
    const z = front;
    // deep reveal: the room is set 0.45 m back
    g.add(plane(winW, winH, roomMat, x, winY, z - 0.45));
    g.add(box(winW, 0.62, 0.02, satinMat, x, winY - winH / 2 + 0.31, z - 0.42));       // red skirt along the sill inside
    const tin = plane(winW - 0.1, 0.3, tinselMat, x, winY + winH / 2 - 0.62, z - 0.3); g.add(tin);
    // reveal sides
    for (const s of [-1, 1]) g.add(box(0.06, winH, 0.45, teal, x + s * winW / 2, winY, z - 0.22));
    // frame, mullion, transom with its red panel, and the vertical bars
    const fz = z + 0.03;
    g.add(box(winW + 0.24, 0.14, 0.1, darkFrame, x, winY + winH / 2 + 0.07, fz));
    g.add(box(winW + 0.24, 0.14, 0.1, darkFrame, x, winY - winH / 2 - 0.07, fz));
    for (const s of [-1, 1]) g.add(box(0.14, winH + 0.28, 0.1, darkFrame, x + s * (winW / 2 + 0.05), winY, fz));
    g.add(box(winW, 0.1, 0.08, darkFrame, x, winY + winH / 2 - 0.42, fz));
    g.add(box(winW - 0.1, 0.3, 0.04, redPanel, x, winY + winH / 2 - 0.2, z - 0.05));
    g.add(box(0.07, winH - 0.42, 0.08, darkFrame, x, winY - 0.21, fz));
    g.add(box(winW, 0.07, 0.08, darkFrame, x, winY - 0.35, fz));
    for (let b = 1; b < 7; b++) g.add(box(0.025, winH - 0.5, 0.025, iron, x - winW / 2 + (b * winW) / 7, winY - 0.21, z - 0.02));
    along(rect(x, winY, winW + 0.42, winH + 0.42, front + 0.1), bulbs);
  }

  // ---------- the open double doors ----------
  const dW = 1.9, dH = 2.75, dY = BASE + dH / 2, dz = front;

  // The front wall slab with the three openings cut out
  {
    const sh = new THREE.Shape();
    sh.moveTo(-W / 2, BASE); sh.lineTo(W / 2, BASE); sh.lineTo(W / 2, groundTop); sh.lineTo(-W / 2, groundTop); sh.closePath();
    const hole = (x0, y0, x1, y1) => { const p = new THREE.Path(); p.moveTo(x0, y0); p.lineTo(x0, y1); p.lineTo(x1, y1); p.lineTo(x1, y0); p.closePath(); sh.holes.push(p); };
    for (const sx of [-1, 1]) hole(sx * 2.55 - winW / 2, winY - winH / 2, sx * 2.55 + winW / 2, winY + winH / 2);
    hole(-dW / 2, BASE, dW / 2, BASE + dH);
    const wallGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: false });
    // UVs from the extrusion are in metres; scale them so the plaster texture repeats about every 2.5 m
    const uv = wallGeo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) / 2.5, uv.getY(k) / 2.5);
    const wallMesh = new THREE.Mesh(wallGeo, teal); wallMesh.position.z = front - 0.22; g.add(wallMesh);
    // window reveals: sill and head, so the sides of the gap are never visible
    for (const sx of [-1, 1]) {
      g.add(box(winW, 0.06, 0.45, mat(0x8d8a82), sx * 2.55, winY - winH / 2, front - 0.22));
      g.add(box(winW, 0.06, 0.45, teal, sx * 2.55, winY + winH / 2, front - 0.22));
    }
    g.add(box(dW, 0.06, 1.1, mat(0xd9b48a), 0, BASE + dH, dz - 0.55)); // the door room's ceiling
  }
  g.add(plane(dW, dH, roomMat, 0, dY, dz - 1.1));                                     // back wall: floral paper
  for (const s of [-1, 1]) g.add(box(0.06, dH, 1.1, roomMat, s * dW / 2, dY, dz - 0.55)); // side walls of the room
  g.add(box(dW, 0.04, 1.1, mat(0xc7a57a), 0, BASE + 0.02, dz - 0.55));                // floor
  g.add(box(dW - 0.1, 1.1, 0.04, satinMat, 0, BASE + 0.55, dz - 1.05));                // red satin skirt (the little stage)
  g.add(box(dW - 0.1, 0.05, 0.5, satinMat, 0, BASE + 1.12, dz - 0.82));
  g.add(plane(dW - 0.08, 0.32, tinselMat, 0, dY + dH / 2 - 0.5, dz - 0.25));           // tinsel bunting across the top
  // white garland strands hanging down both sides
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
    const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 1.9 + k * 0.15, 6), garland);
    strand.position.set(s * (dW / 2 - 0.12 - k * 0.07), dY + dH / 2 - 0.35 - (1.9 + k * 0.15) / 2, dz - 0.2 - k * 0.05);
    g.add(strand);
    for (let j = 0; j < 8; j++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), garland);
      p.position.set(strand.position.x + (j % 2 ? 0.03 : -0.03), strand.position.y + 0.9 - j * 0.24, strand.position.z);
      g.add(p);
    }
  }
  // frame + transom with its red panel
  g.add(box(dW + 0.3, 0.16, 0.12, darkFrame, 0, dY + dH / 2 + 0.08, dz + 0.04));
  for (const s of [-1, 1]) g.add(box(0.16, dH + 0.1, 0.12, darkFrame, s * (dW / 2 + 0.08), dY, dz + 0.04));
  g.add(box(dW, 0.32, 0.04, redPanel, 0, dY + dH / 2 - 0.18, dz - 0.03));
  g.add(box(dW, 0.08, 0.1, darkFrame, 0, dY + dH / 2 - 0.36, dz + 0.02));
  // the two leaves, swung open towards the street
  for (const s of [-1, 1]) {
    const leafG = new THREE.Group();
    const lw = dW / 2 - 0.02, lh = dH - 0.42;
    leafG.add(box(lw, lh, 0.06, leaf, s * lw / 2, 0, 0));
    for (const py of [lh * 0.25, -lh * 0.22]) leafG.add(box(lw * 0.7, lh * 0.36, 0.03, mat(0x4a565c, { roughness: 0.6 }), s * lw / 2, py, 0.04));
    leafG.position.set(s * (dW / 2), BASE + lh / 2, dz + 0.04);
    leafG.rotation.y = s * -1.25; // about 72° open
    g.add(leafG);
  }
  g.add(box(dW + 0.6, 0.12, 0.6, mat(0x8d8a82), 0, BASE - 0.06, dz + 0.3)); // threshold step
  along(rect(0, dY + 0.04, dW + 0.5, dH + 0.36, front + 0.12), bulbs);

  // ---------- balcony ----------
  const balZ = front + 0.85, railH = 1.05, railY = upperBot;
  g.add(box(W - 0.4, 0.06, 0.06, iron, 0, railY + railH, balZ));
  g.add(box(W - 0.4, 0.04, 0.04, iron, 0, railY + 0.12, balZ));
  for (let x = -W / 2 + 0.2; x <= W / 2 - 0.2 + 1e-6; x += 0.12) g.add(box(0.022, railH - 0.12, 0.022, iron, x, railY + 0.06 + railH / 2, balZ));
  for (const x of [-W / 2 + 0.2, 0, W / 2 - 0.2]) {
    g.add(box(0.12, railH + 0.2, 0.12, iron, x, railY + (railH + 0.2) / 2, balZ));
    const fin = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), iron); fin.position.set(x, railY + railH + 0.26, balZ); g.add(fin);
  }
  for (const s of [-1, 1]) g.add(box(0.06, railH, 0.85, iron, s * (W / 2 - 0.2), railY + railH / 2, front + 0.43)); // side rails back to the wall

  // ---------- upper floor: two wooden French doors under jali transoms ----------
  const fW = 1.25, fH = 2.0, fY = upperBot + 0.12 + fH / 2;
  for (const sx of [-1, 1]) {
    const x = sx * 1.85, z = front;
    g.add(box(fW + 0.24, fH + 0.24, 0.1, wood, x, fY, z + 0.02));
    g.add(box(fW - 0.04, fH - 0.04, 0.06, glowGlass, x, fY, z + 0.05));
    // mullions: centre split, three cross bars and a lower panel per leaf
    g.add(box(0.07, fH, 0.1, wood, x, fY, z + 0.08));
    for (const t of [0.24, -0.08, -0.34]) g.add(box(fW, 0.06, 0.1, wood, x, fY + t * fH, z + 0.08));
    for (const s of [-1, 1]) g.add(box(0.05, fH * 0.55, 0.1, wood, x + s * fW / 4, fY + fH * 0.2, z + 0.08));
    g.add(box(fW, fH * 0.16, 0.08, wood, x, fY - fH / 2 + fH * 0.08, z + 0.08));
    // the jali transom above
    const jy = fY + fH / 2 + 0.42;
    g.add(box(fW + 0.24, 0.62, 0.08, wood, x, jy, z + 0.02));
    g.add(plane(fW, 0.48, jaliMat, x, jy, z + 0.07));
    along(rect(x, fY + 0.2, fW + 0.46, fH + 0.62, front + 0.12), bulbs);
  }

  // ---------- fairy-light swags: along the balcony rail and under the eave ----------
  const railTop = railY + railH;
  const xs = [];
  for (let x = -W / 2 + 0.2; x <= W / 2 - 0.2 + 1e-6; x += (W - 0.4) / 9) xs.push(x);
  for (let i = 0; i < xs.length - 1; i++) along(swag(new THREE.Vector3(xs[i], railTop, 0), new THREE.Vector3(xs[i + 1], railTop, 0), 0.45 + (i % 2) * 0.12, balZ + 0.05), bulbs);
  along([new THREE.Vector3(-W / 2 + 0.2, railTop + 0.02, balZ + 0.05), new THREE.Vector3(W / 2 - 0.2, railTop + 0.02, balZ + 0.05)], bulbs);
  const eaveY = upperTop - 0.12;
  const ex = [-W / 2 + 0.15, -W / 4, 0, W / 4, W / 2 - 0.15];
  for (let i = 0; i < ex.length - 1; i++) along(swag(new THREE.Vector3(ex[i], eaveY, 0), new THREE.Vector3(ex[i + 1], eaveY, 0), 0.55, front + 0.08), bulbs);
  // a few long strands draped down from the balcony, like the reference
  for (const x of [-2.9, -0.9, 1.0, 3.0]) along(swag(new THREE.Vector3(x, railTop, 0), new THREE.Vector3(x + 0.35, railY + 0.15, 0), -0.05, balZ + 0.06, 6), bulbs);

  // ---------- the roof terrace: Basant on the chhat ----------
  // After the rooftop kite scene: pale jali parapets (diamonds over slits) between square posts, a
  // stair room with a tin awning and a water tank, a charpai, and the fairy lights carried up to the parapet.
  const PH = 1.05;                                            // parapet height
  const cream = mat(0xe3cf9e, { roughness: 0.9 }), creamDark = mat(0xcbb27c, { roughness: 0.9 });
  g.add(box(W + 0.2, 0.03, D + 0.4, new THREE.MeshStandardMaterial({ map: roofTiles(), roughness: 0.95 }), 0, RY + 0.015, 0.2));
  const jaliWall = (x0, z0, x1, z1, y0 = RY) => {
    const L = Math.hypot(x1 - x0, z1 - z0), wall = new THREE.Group();
    wall.position.set((x0 + x1) / 2, y0, (z0 + z1) / 2); wall.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
    wall.add(box(L, 0.16, 0.22, creamDark, 0, 0.08, 0));                  // plinth
    wall.add(box(L + 0.1, 0.12, 0.32, cream, 0, PH + 0.06, 0));           // coping
    const panel = new THREE.PlaneGeometry(L, PH - 0.16);
    const uv = panel.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setX(k, uv.getX(k) * Math.max(1, Math.round(L / 0.9)));
    const m = new THREE.Mesh(panel, jaliMatOf()); m.position.y = 0.16 + (PH - 0.16) / 2; wall.add(m);
    const posts = Math.max(1, Math.round(L / 2));
    for (let i = 0; i <= posts; i++) wall.add(box(0.24, PH + 0.1, 0.28, cream, -L / 2 + (i * L) / posts, (PH + 0.1) / 2, 0));
    g.add(wall);
    return wall;
  };
  const TX = W / 2 + 0.05, TF = front + 0.3, TB = -D / 2 - 0.02;
  jaliWall(-TX, TF, TX, TF); jaliWall(-TX, TB, TX, TB); jaliWall(-TX, TB, -TX, TF); jaliWall(TX, TB, TX, TF);
  // the neighbours' roofs get the same parapet along their fronts
  for (const sx of [-1, 1]) jaliWall(sx * (W / 2 + 0.1), front - 0.75, sx * (W / 2 + NW - 0.05), front - 0.75, upperTop + 0.9);
  // stair room (mumty) at the back left, with a wooden door, a tin awning and a black water tank
  const mx = -2.75, mz = -1.95, mw = 2.2, md = 1.9, mh = 2.3;
  g.add(box(mw, mh, md, mustard, mx, RY + mh / 2, mz));
  g.add(box(mw + 0.2, 0.12, md + 0.2, cream, mx, RY + mh + 0.06, mz));
  g.add(box(0.9, 1.85, 0.06, wood, mx + 0.25, RY + 0.93, mz + md / 2 + 0.02));
  g.add(box(0.06, 1.6, 0.03, mat(0x3a2416), mx + 0.25, RY + 0.95, mz + md / 2 + 0.06));
  const tin = box(1.5, 0.05, 0.75, new THREE.MeshStandardMaterial({ map: corrugated(), roughness: 0.6, metalness: 0.3 }), mx + 0.25, RY + 2.0, mz + md / 2 + 0.33);
  tin.rotation.x = 0.32; g.add(tin);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.9, 16), mat(0x2b2d31, { roughness: 0.5 }));
  water.position.set(mx - 0.3, RY + mh + 0.12 + 0.45, mz - 0.1); g.add(water);
  // a charpai on the right, its rope weave catching the light
  {
    const cx = 2.45, cz = -1.7, cw = 1.0, cl = 1.9;
    g.add(box(cw, 0.04, cl, new THREE.MeshStandardMaterial({ map: weave(), roughness: 0.9 }), cx, RY + 0.46, cz));
    for (const s of [-1, 1]) { g.add(box(0.08, 0.08, cl + 0.1, wood, cx + s * cw / 2, RY + 0.46, cz)); g.add(box(cw + 0.1, 0.08, 0.08, wood, cx, RY + 0.46, cz + s * cl / 2)); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.46, 8), wood); leg.position.set(cx + sx * cw / 2, RY + 0.23, cz + sz * cl / 2); g.add(leg);
    }
  }
  // a charkhi (string spool) by where she stands
  {
    const ch = new THREE.Group();
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.26, 12), mat(0xe8336f, { roughness: 0.5 })); drum.rotation.z = Math.PI / 2; ch.add(drum);
    for (const s of [-1, 1]) { const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.03, 12), mat(0xf2c230)); rim.rotation.z = Math.PI / 2; rim.position.x = s * 0.14; ch.add(rim); }
    ch.add(box(0.04, 0.5, 0.04, wood, 0, -0.1, 0));
    ch.position.set(0.85, RY + 0.42, front - 0.6); ch.rotation.y = 0.5; g.add(ch);
  }
  // the fairy lights climb to the roof: along the front coping and in swags down its face
  const copeY = RY + PH + 0.13;
  along([new THREE.Vector3(-TX, copeY, TF + 0.17), new THREE.Vector3(TX, copeY, TF + 0.17)], bulbs);
  for (let i = 0; i < 6; i++) { const x0 = -TX + (i * 2 * TX) / 6; along(swag(new THREE.Vector3(x0, copeY - 0.05, 0), new THREE.Vector3(x0 + (2 * TX) / 6, copeY - 0.05, 0), 0.32, TF + 0.18), bulbs); }
  along([new THREE.Vector3(-TX, copeY, TB), new THREE.Vector3(-TX, copeY, TF)], bulbs);
  along([new THREE.Vector3(TX, copeY, TB), new THREE.Vector3(TX, copeY, TF)], bulbs);

  const bulbGeo = new THREE.SphereGeometry(0.045, 6, 4);
  for (const p of bulbs) { const b = new THREE.Mesh(bulbGeo, bulbMat); b.position.copy(p); g.add(b); }
  // the wire the bulbs hang on, as a thin dark line through each run would be costly; a faint band reads as wire
  g.add(box(W - 0.4, 0.012, 0.012, wire, 0, railTop + 0.02, balZ + 0.04));

  // ---------- neighbours on both sides (one bay each) ----------
  for (const sx of [-1, 1]) {
    const nx = sx * (W / 2 + NW / 2);
    const H2 = upperTop + 0.9;
    g.add(box(NW, H2, D - 0.4, neighbour, nx, H2 / 2, -0.2));
    g.add(box(NW + 0.1, 0.22, D, band, nx, groundTop + 0.11, 0));
    // ground: a door with hexagon glass, under a little canopy
    g.add(box(1.3, 2.55, 0.08, darkFrame, nx, BASE + 1.28, front - 0.36));
    for (const s of [-1, 1]) g.add(box(0.52, 2.3, 0.04, hexMat, nx + s * 0.29, BASE + 1.2, front - 0.3));
    g.add(box(1.7, 0.1, 0.55, band, nx, BASE + 2.75, front - 0.12));
    // upper: a lit window with a ledge of potted plants
    g.add(box(1.2, 1.5, 0.08, mat(0x8a3f2c, { roughness: 0.6 }), nx, upperBot + 1.25, front - 0.36));
    g.add(box(1.0, 1.3, 0.04, glowGlass, nx, upperBot + 1.25, front - 0.31));
    g.add(box(1.5, 0.12, 0.5, band, nx, upperBot + 0.45, front - 0.15));
  }

  // ---------- plants: pots along the front, a fern by the left door ----------
  const potMat = mat(0x6e6a63, { roughness: 0.8 }), leafMats = [mat(0x3f6b34, { flatShading: true }), mat(0x5c8a3e, { flatShading: true }), mat(0x2f5a2c, { flatShading: true })];
  const pot = (x, z, s = 1, k = 0, y0 = BASE) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * s, 0.12 * s, 0.3 * s, 10), potMat); p.position.set(x, y0 + 0.15 * s, z); g.add(p);
    for (let i = 0; i < 4; i++) {
      const l = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17 * s, 0), leafMats[(i + k) % 3]);
      l.position.set(x + Math.sin(i * 2.1) * 0.12 * s, y0 + 0.38 * s + i * 0.09 * s, z + Math.cos(i * 2.1) * 0.1 * s); g.add(l);
    }
  };
  // clusters of pots under each window and either side of the door, like the reference
  [[-1.4, 0.35, 1.6], [-1.15, 0.7, 1.2], [-1.75, 0.8, 1.0], [-2.3, 0.4, 1.3], [-2.9, 0.45, 1.5], [-3.5, 0.4, 1.7], [-3.75, 0.8, 1.1],
    [1.4, 0.35, 1.6], [1.2, 0.75, 1.1], [1.75, 0.8, 1.2], [2.4, 0.4, 1.4], [3.0, 0.45, 1.2], [3.55, 0.4, 1.8], [3.8, 0.8, 1.0]]
    .forEach(([x, dz2, s], k) => pot(x, front + dz2, s, k));
  for (let i = 0; i < 9; i++) { // a big fern beside the left neighbour's door
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.1, 4), leafMats[i % 3]);
    f.position.set(-W / 2 - 0.4, BASE + 0.55, front + 0.3); f.rotation.set(Math.sin(i) * 0.8, i, Math.cos(i * 1.3) * 0.8); g.add(f);
  }
  // pots on the balcony too
  for (const x of [-3.3, 3.3]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.11, 0.28, 10), potMat); p.position.set(x, upperBot + 0.14, front + 0.5); g.add(p);
    const l = new THREE.Mesh(new THREE.IcosahedronGeometry(0.25, 0), leafMats[1]); l.position.set(x, upperBot + 0.45, front + 0.5); g.add(l); }

  // and potted plants up on the roof terrace, in the corners and along the sides
  [[-3.5, 2.9, 1.5], [-3.1, 3.0, 1.1], [3.5, 2.9, 1.6], [3.55, 1.6, 1.2], [3.55, 0.5, 1.4], [-3.55, 0.6, 1.3], [-0.9, -2.6, 1.2]]
    .forEach(([x, z, s], k) => pot(x, z, s, k, RY));

  // ---------- the motorbike (a yellow 70cc, parked at the left) ----------
  const bike = new THREE.Group();
  const yellow = mat(0xc9a634, { roughness: 0.45, metalness: 0.2 }), chrome = mat(0xcfd3d6, { metalness: 0.9, roughness: 0.25 }), black = mat(0x1d1d1f, { roughness: 0.7 });
  for (const x of [-0.62, 0.62]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.06, 8, 20), black); wheel.position.set(x, 0.36, 0); bike.add(wheel);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 10), chrome); hub.rotation.x = Math.PI / 2; hub.position.set(x, 0.36, 0); bike.add(hub);
  }
  const tank = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 8), yellow); tank.scale.set(1.3, 0.75, 0.7); tank.position.set(0.12, 0.88, 0); bike.add(tank);
  bike.add(box(0.7, 0.12, 0.28, black, -0.32, 0.86, 0));                                    // seat
  bike.add(box(0.55, 0.22, 0.24, chrome, -0.05, 0.52, 0));                                  // engine
  bike.add(box(0.5, 0.18, 0.3, yellow, -0.55, 0.66, 0));                                    // side cover
  const fork = box(0.05, 0.62, 0.05, chrome, 0.52, 0.66, 0); fork.rotation.z = -0.35; bike.add(fork);
  bike.add(box(0.06, 0.06, 0.62, chrome, 0.44, 1.02, 0));                                   // handlebar
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), chrome); lamp.position.set(0.58, 0.92, 0); bike.add(lamp);
  bike.add(box(0.55, 0.05, 0.22, chrome, -0.2, 0.3, 0.16));                                 // exhaust
  bike.position.set(-W / 2 - 0.15, BASE, front + 1.05); bike.rotation.y = 0.35;
  g.add(bike);

  // ---------- the street lamp on a bracket at the top right ----------
  g.add(box(0.06, 0.9, 0.06, iron, W / 2 + 0.6, upperTop - 0.2, front - 0.15));
  const arm = box(0.05, 0.05, 0.9, iron, W / 2 + 0.6, upperTop + 0.22, front + 0.25); g.add(arm);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.24, 14, 1, true), iron); shade.position.set(W / 2 + 0.6, upperTop + 0.08, front + 0.68); g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), bulbMat); bulb.position.set(W / 2 + 0.6, upperTop - 0.02, front + 0.68); g.add(bulb);

  // front path to the ring
  g.add(box(2.4, 0.04, 2.8, mat(0x9a9488, { roughness: 0.95 }), 0, 0.02, front + 2.0));

  g.traverse((o) => { if (o.isMesh) { o.castShadow = o.material !== bulbMat; o.receiveShadow = true; } });

  // Warm light spilling out of the room and the balcony doors (not baked: it's live)
  const glow = new THREE.Group();
  const spill = new THREE.PointLight(0xffb066, 0, 9, 1.6); spill.position.set(0, BASE + 1.6, front + 0.9); glow.add(spill);
  const upper = new THREE.PointLight(0xffc27a, 0, 8, 1.6); upper.position.set(0, upperBot + 1.6, front + 1.4); glow.add(upper);

  /** 0 = day (bulbs faintly on), 1 = night (everything glowing). */
  const setLights = (k) => {
    bulbMat.emissiveIntensity = 0.45 + k * 1.15;
    roomMat.emissiveIntensity = 0.06 + k * 0.22;
    jaliMat.emissiveIntensity = 0.12 + k * 0.5;
    glowGlass.emissiveIntensity = 0.15 + k * 0.6;
    hexMat.emissiveIntensity = 0.12 + k * 0.5;
    satinMat.emissiveIntensity = 0.1 + k * 0.3;
    spill.intensity = k * 7; upper.intensity = k * 4;
  };
  setLights(0);
  // `roof`: where she stands to fly a kite (house-local), the terrace floor height and its front parapet
  return { group: g, glow, setLights, width: W + NW * 2, roof: { y: RY, spot: new THREE.Vector3(0, RY, front - 0.9), front: TF, back: TB } };
}
