// The park's centrepiece: a stone plaza with a two-tier fountain (a frog statue spouting water),
// a lily pond with lotus flowers, paddling ducks and a few frogs. The frogs are an Easter egg:
// the neighbourhood lets the Sim catch them (see NeighbourhoodScene), so they're returned separately.
import * as THREE from 'three';
import { mat } from './assets.js';

export const PLAZA_R = 8.6;
export const BASIN_R = 5.3;   // outer edge of the basin rim (the Sim walks around it)
const WATER_R = 4.6, RIM_H = 0.7, WATER_Y = 0.48;

const stone = () => mat(0xd8d0bf, { roughness: 0.9 });
const stoneDark = () => mat(0xb9ae98, { roughness: 0.9 });

/** A small, round, friendly frog (~0.8 m long), sitting, facing +Z. */
export function createFrog(rand = Math.random) {
  const g = new THREE.Group();
  const greens = [0x5aa63c, 0x6cb84a, 0x4e9a36];
  const skin = mat(greens[Math.floor(rand() * greens.length)], { roughness: 0.55 });
  const belly = mat(0xd8eab0, { roughness: 0.6 });
  const white = mat(0xffffff, { roughness: 0.3 });
  const black = mat(0x15161c, { roughness: 0.2 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 12), skin);
  body.scale.set(1.1, 0.72, 1.2); body.position.y = 0.26;
  const tum = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 10), belly);
  tum.scale.set(0.95, 0.55, 0.9); tum.position.set(0, 0.2, 0.08);
  g.add(body, tum);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), white); eye.position.set(s * 0.17, 0.5, 0.18);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), black); pupil.position.set(s * 0.18, 0.52, 0.27);
    const thigh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), skin); thigh.scale.set(0.8, 0.6, 1.3); thigh.position.set(s * 0.3, 0.12, -0.12);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 6), skin); foot.scale.set(1.3, 0.35, 1); foot.position.set(s * 0.18, 0.03, 0.3);
    g.add(eye, pupil, thigh, foot);
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 6, 16, Math.PI), black);
  smile.rotation.set(Math.PI * 0.1, 0, Math.PI); smile.position.set(0, 0.33, 0.39);
  g.add(smile);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.userData.body = body;
  return g;
}

function createDuck() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 10), mat(0xc9b28f, { roughness: 0.7 }));
  body.scale.set(0.9, 0.62, 1.3); body.position.y = 0.12;
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 8), mat(0x8a6a48));
  tail.rotation.x = -Math.PI / 2.6; tail.position.set(0, 0.24, -0.4);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), mat(0x2f7a4a, { roughness: 0.4, metalness: 0.1 }));
  head.position.set(0, 0.46, 0.3);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 6, 16), mat(0xffffff));
  ring.rotation.x = Math.PI / 2; ring.position.set(0, 0.32, 0.3);
  const beak = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.16), mat(0xf2a33a)); beak.position.set(0, 0.43, 0.5);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), mat(0x15161c)); e.position.set(s * 0.09, 0.5, 0.42); g.add(e); }
  g.add(body, tail, head, ring, beak);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function lotus(rand) {
  const g = new THREE.Group();
  const pink = mat(0xf4a7c4, { roughness: 0.5 }), pale = mat(0xfbd9e6, { roughness: 0.5 });
  for (let i = 0; i < 7; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), i % 2 ? pink : pale);
    const a = (i / 7) * Math.PI * 2 + rand();
    p.scale.set(0.55, 0.45, 1.3); p.position.set(Math.sin(a) * 0.1, 0.1, Math.cos(a) * 0.1); p.rotation.y = a; p.rotation.x = -0.6;
    g.add(p);
  }
  const c = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(0xf2d04b)); c.position.y = 0.14;
  g.add(c);
  return g;
}

export function createFountain(rand = Math.random) {
  const g = new THREE.Group();

  // Plaza: paving disc with a darker border and a ring of benches
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(PLAZA_R, 64), mat(0xdcd4c4, { roughness: 0.95 }));
  plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.04; plaza.receiveShadow = true;
  const border = new THREE.Mesh(new THREE.RingGeometry(PLAZA_R - 0.35, PLAZA_R, 64), mat(0xb9ae98, { roughness: 0.95 }));
  border.rotation.x = -Math.PI / 2; border.position.y = 0.05;
  g.add(plaza, border);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2; // between the paths
    const bench = new THREE.Group();
    const wood = mat(0x8a5a3b, { roughness: 0.8 }), iron = mat(0x2c3136, { metalness: 0.5, roughness: 0.4 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.55), wood); seat.position.y = 0.5;
    const back = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 0.08), wood); back.position.set(0, 0.85, -0.25);
    bench.add(seat, back);
    for (const lx of [-0.85, 0.85]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.48), iron); leg.position.set(lx, 0.25, 0); bench.add(leg); }
    bench.position.set(Math.sin(a) * (PLAZA_R - 1.2), 0, -Math.cos(a) * (PLAZA_R - 1.2));
    bench.rotation.y = -a; // facing the fountain
    bench.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    g.add(bench);
  }

  // Basin: a stone ring wall with a wide coping, and the pond inside
  const ringShape = new THREE.Shape(); ringShape.absarc(0, 0, BASIN_R - 0.15, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, WATER_R, 0, Math.PI * 2, true); ringShape.holes.push(hole);
  const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(ringShape, { depth: RIM_H, bevelEnabled: false, curveSegments: 64 }), stone());
  wall.rotation.x = -Math.PI / 2; wall.castShadow = wall.receiveShadow = true;
  const coping = new THREE.Mesh(new THREE.RingGeometry(WATER_R - 0.08, BASIN_R, 72), stoneDark());
  coping.rotation.x = -Math.PI / 2; coping.position.y = RIM_H + 0.01; coping.receiveShadow = true;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(WATER_R, 48), mat(0x3e7d86, { roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = 0.08;
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x77c4d4, roughness: 0.06, metalness: 0.15, transparent: true, opacity: 0.86, emissive: 0x0d3340, emissiveIntensity: 0.25 });
  const water = new THREE.Mesh(new THREE.CircleGeometry(WATER_R, 64), waterMat);
  water.rotation.x = -Math.PI / 2; water.position.y = WATER_Y; water.receiveShadow = true;
  g.add(wall, coping, floor, water);

  // Two-tier fountain with a frog statue on top
  const tier = new THREE.Group();
  const s = stone();
  const add = (geo, m, y) => { const o = new THREE.Mesh(geo, m); o.position.y = y; o.castShadow = o.receiveShadow = true; tier.add(o); return o; };
  add(new THREE.CylinderGeometry(0.55, 0.85, 1.4, 24), s, 0.7);                // pedestal
  add(new THREE.CylinderGeometry(1.9, 1.2, 0.45, 32), s, 1.55);                // lower bowl
  add(new THREE.CircleGeometry(1.75, 32).rotateX(-Math.PI / 2), waterMat, 1.79);
  add(new THREE.CylinderGeometry(0.3, 0.42, 1.1, 18), s, 2.3);                 // stem
  add(new THREE.CylinderGeometry(1.0, 0.6, 0.32, 28), s, 2.95);                // upper bowl
  add(new THREE.CircleGeometry(0.9, 28).rotateX(-Math.PI / 2), waterMat, 3.12);
  const statue = createFrog(() => 0.5);
  // Carved stone, keeping the dark eyes
  statue.traverse((o) => { if (o.isMesh) o.material = o.material.color?.getHex() === 0x15161c ? o.material : mat(0xc9c1ae, { roughness: 0.85 }); });
  statue.scale.setScalar(1.25); statue.position.y = 3.12;
  tier.add(statue);
  g.add(tier);

  // Falling water sheets from both bowls, and ripples where they land
  const sheetMat = new THREE.MeshStandardMaterial({ color: 0xd8f2f8, transparent: true, opacity: 0.32, roughness: 0.1, side: THREE.DoubleSide, depthWrite: false });
  const sheetLow = new THREE.Mesh(new THREE.CylinderGeometry(1.92, 2.05, 1.25, 40, 1, true), sheetMat); sheetLow.position.y = 1.12;
  const sheetHigh = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.15, 1.25, 32, 1, true), sheetMat); sheetHigh.position.y = 2.4;
  g.add(sheetLow, sheetHigh);
  const rippleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, depthWrite: false });
  const ripples = [0, 1, 2].map(() => { const r = new THREE.Mesh(new THREE.RingGeometry(1.95, 2.05, 48), rippleMat.clone()); r.rotation.x = -Math.PI / 2; r.position.y = WATER_Y + 0.01; g.add(r); return r; });

  // Spray: droplets arcing out of the frog's mouth into the top bowl, and from the top bowl outward
  const N = 140, drops = new Float32Array(N * 3), seeds = [];
  for (let i = 0; i < N; i++) seeds.push({ a: rand() * Math.PI * 2, p: rand(), up: i < 40 });
  const dropGeo = new THREE.BufferGeometry(); dropGeo.setAttribute('position', new THREE.BufferAttribute(drops, 3));
  const spray = new THREE.Points(dropGeo, new THREE.PointsMaterial({ color: 0xe6f8ff, size: 0.09, transparent: true, opacity: 0.85, depthWrite: false }));
  g.add(spray);

  // Lily pads with lotus flowers
  const padMat = mat(0x4f9a43, { roughness: 0.7, side: THREE.DoubleSide }), padDark = mat(0x3f8236, { roughness: 0.7, side: THREE.DoubleSide });
  const pads = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rand() * 0.4, r = 2.6 + rand() * 1.6, size = 0.45 + rand() * 0.35;
    const pad = new THREE.Mesh(new THREE.CircleGeometry(size, 20, 0.25, Math.PI * 2 - 0.5), i % 3 ? padMat : padDark);
    pad.rotation.x = -Math.PI / 2; pad.rotation.z = rand() * 6;
    pad.position.set(Math.sin(a) * r, WATER_Y + 0.02, -Math.cos(a) * r);
    g.add(pad);
    pads.push({ pos: pad.position.clone(), size });
    if (i % 3 === 1) { const f = lotus(rand); f.position.copy(pad.position).setY(WATER_Y + 0.03); f.position.x += size * 0.35; g.add(f); }
  }

  // Ducks paddling around the fountain
  const ducks = [0, Math.PI].map((phase) => { const d = createDuck(); d.userData.phase = phase; g.add(d); return d; });

  // Frogs: on lily pads and on the rim (some reachable from the plaza)
  const frogSpots = [
    pads[0].pos, pads[3].pos, pads[6].pos,
    new THREE.Vector3(Math.sin(2.2) * (BASIN_R - 0.35), RIM_H, -Math.cos(2.2) * (BASIN_R - 0.35)),
    new THREE.Vector3(Math.sin(-0.9) * (BASIN_R - 0.35), RIM_H, -Math.cos(-0.9) * (BASIN_R - 0.35)),
  ];
  const frogs = frogSpots.map((p, i) => {
    const f = createFrog(rand);
    f.position.set(p.x, i < 3 ? WATER_Y + 0.03 : RIM_H + 0.02, p.z);
    f.rotation.y = Math.atan2(p.x, p.z) + Math.PI + (rand() - 0.5); // mostly facing outward, at you
    f.userData.home = f.position.clone();
    f.userData.nextHop = 2 + rand() * 6;
    f.userData.hopT = 0;
    f.scale.setScalar(0.9);
    g.add(f);
    return f;
  });

  const tick = (time, dt, still = false) => {
    if (still) return;
    waterMat.emissiveIntensity = 0.22 + Math.sin(time * 1.3) * 0.04;
    sheetMat.opacity = 0.26 + Math.sin(time * 7) * 0.05;
    ripples.forEach((r, i) => {
      const k = ((time * 0.45 + i / 3) % 1);
      r.scale.setScalar(1 + k * 0.9); r.material.opacity = 0.42 * (1 - k);
    });
    for (let i = 0; i < N; i++) {
      const sd = seeds[i], k = (time * (sd.up ? 0.9 : 0.6) + sd.p) % 1;
      let x, y, z;
      if (sd.up) { const r = k * 0.75; x = Math.sin(sd.a) * r; z = Math.cos(sd.a) * r; y = 3.75 + 0.9 * k - 1.6 * k * k; }
      else { const r = 1.0 + k * 1.1; x = Math.sin(sd.a) * r; z = Math.cos(sd.a) * r; y = 3.1 + 0.25 * k - 2.6 * k * k; }
      drops[i * 3] = x; drops[i * 3 + 1] = Math.max(WATER_Y, y); drops[i * 3 + 2] = z;
    }
    dropGeo.attributes.position.needsUpdate = true;
    ducks.forEach((d) => {
      const a = time * 0.12 + d.userData.phase, r = 3.4 + Math.sin(time * 0.3 + d.userData.phase) * 0.35;
      d.position.set(Math.sin(a) * r, WATER_Y + Math.sin(time * 2 + d.userData.phase) * 0.02, -Math.cos(a) * r);
      d.rotation.y = -a - Math.PI / 2 + Math.PI; // swimming along the circle
    });
  };
  return { group: g, frogs, tick };
}
