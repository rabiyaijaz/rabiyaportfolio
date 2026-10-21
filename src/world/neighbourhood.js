// The landing's playable neighbourhood (Direction v4).
// A crescent of project houses around a ring road and a little park. The Sim walks where you click
// (or with the arrow keys); reaching a door opens that project. setView(0 → 1) lifts the camera from
// the street into a top-down map, and setClock(hours) runs the sky from morning to night.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { createHouse } from './house.js';
import { createRangeenHouse } from './rangeen.js';
import { createKites } from './kites.js';
import { TRACK_R, WALK_R, createOutskirts } from './outskirts.js';
import { BASIN_R, PLAZA_R, createFountain } from './fountain.js';
import { createForest, createPlumbob, createSimCutout, createStreetLamp, bakeStatic, canvasTexture, mat, seeded } from './assets.js';

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// Sky keyframes by hour. Values between keys are blended, so scrolling feels like time passing.
const KEYS = [
  [6, { skyTop: 0x8fb3e0, skyBottom: 0xf7d9b8, fog: 0xe9dccb, ground: 0x84a95e, hemiSky: 0xfff0dc, hemiGround: 0x6d7f4c, hemi: 1.0, sun: 0xffd6a3, sunI: 1.8, sunPos: [-60, 22, 30], window: 0.2, lamps: 0.2, stars: 0, exposure: 1.0 }],
  [10, { skyTop: 0x76aee6, skyBottom: 0xeaf2f0, fog: 0xdfe9ea, ground: 0x86ad62, hemiSky: 0xe6f1ff, hemiGround: 0x7a8f55, hemi: 1.15, sun: 0xfff3dd, sunI: 2.3, sunPos: [-30, 55, 25], window: 0.05, lamps: 0, stars: 0, exposure: 1.0 }],
  [16, { skyTop: 0x76aee6, skyBottom: 0xf2ece0, fog: 0xe5e3dc, ground: 0x84aa5e, hemiSky: 0xfff1df, hemiGround: 0x7a8f55, hemi: 1.1, sun: 0xffeccc, sunI: 2.1, sunPos: [40, 40, 20], window: 0.05, lamps: 0, stars: 0, exposure: 1.0 }],
  [19, { skyTop: 0x2c2f6e, skyBottom: 0xf0a477, fog: 0xb98a86, ground: 0x4c6342, hemiSky: 0xffc9a8, hemiGround: 0x2f3b3a, hemi: 0.75, sun: 0xffa463, sunI: 1.5, sunPos: [70, 10, -30], window: 0.9, lamps: 1, stars: 0.35, exposure: 1.0 }],
  [22, { skyTop: 0x050821, skyBottom: 0x1b2352, fog: 0x0d1333, ground: 0x18261f, hemiSky: 0x5a6db8, hemiGround: 0x0b1210, hemi: 0.45, sun: 0x9fb4ff, sunI: 0.55, sunPos: [35, 40, -20], window: 1.4, lamps: 1, stars: 1, exposure: 1.1 }],
];
function paletteAt(h) {
  // Clamp into the keyed range so the ends still go through the colour conversion below
  h = Math.min(KEYS[KEYS.length - 1][0], Math.max(KEYS[0][0], h));
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [h0, a] = KEYS[i], [h1, b] = KEYS[i + 1];
    if (h <= h1) {
      const t = (h - h0) / (h1 - h0);
      const out = {};
      for (const k of Object.keys(a)) {
        if (k === 'sunPos') out[k] = a[k].map((v, j) => v + (b[k][j] - v) * t);
        else if (k.match(/sky|fog|ground|hemiSky|hemiGround|^sun$/)) out[k] = new THREE.Color(a[k]).lerp(new THREE.Color(b[k]), t);
        else out[k] = a[k] + (b[k] - a[k]) * t;
      }
      return out;
    }
  }
  return KEYS[KEYS.length - 1][1];
}

const RING = 26;       // ring road radius
const HOUSE_R = 37;    // house centres
const DOOR_R = 31.4;   // where the front path meets the sidewalk
const UP = new THREE.Vector3(0, 1, 0);
const SIM_H = 3.3;    // the Sim's height: larger than life so she reads in the hero
const INTRO_HOLD = 0.7, INTRO_OUT = 1.0; // seconds on the close-up, then the ease out to the street
// First-visit prologue (before the intro above): the white sculpt alone in the mist, the camera
// orbiting her with plumbob shards drifting past (WHITE s), then she "formulates" into the colour
// model from the feet up while the mist clears to reveal the street (MORPH s). The intro hold that
// follows is shortened to PROLOGUE_HOLD, so the whole thing is about four seconds.
const WHITE = 1.8, MORPH = 1.05, PROLOGUE_HOLD = 0.15;
const ORBIT_FROM = 0.95; // where the prologue orbit starts (rad, around her)
const START = new THREE.Vector3(4, 0, -17); // inner sidewalk, Crewnity dead ahead
const ROOF_SCALE = 0.62; // her size up on the Rangeen roof (about 2 m)
const NO_KEYS = new Set();
export const MAP_ZOOM_MAX = 2.6; // how far the map pulls back (1 = the crescent framed)
const ROOF_SKY_TOP = new THREE.Color(0x9fcab5), ROOF_SKY_BOTTOM = new THREE.Color(0xeee6cf); // mint over a warm haze

/** Angle a is measured from -Z (north), clockwise seen from above. */
const polar = (r, a) => new THREE.Vector3(Math.sin(a) * r, 0, -Math.cos(a) * r);

export class NeighbourhoodScene {
  /**
   * @param {HTMLElement} container
   * @param {{ lots: {id, name, wall, roof, flat, storeys}[], reducedMotion?: boolean }} opts
   */
  constructor(container, { lots, reducedMotion = false, mapOnly = false }) {
    this.container = container;
    this.reducedMotion = reducedMotion;
    this.mapOnly = mapOnly; // Work page banner: always the map, clicks open projects
    this.listeners = new Map();
    this.view = mapOnly ? 1 : 0;
    this.zoom = 1;
    this.pan = new THREE.Vector3();
    this.orbit = { yaw: 0, pitch: 0, dist: 1 }; // street camera, changed by dragging
    this.active = true;
    const small = innerWidth < 768;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.25 : 1.6));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.5, 1400);
    this.hemi = new THREE.HemisphereLight();
    this.sun = new THREE.DirectionalLight();
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.setScalar(small ? 1024 : 2048);
    Object.assign(this.sun.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, near: 1, far: 260 });
    this.sun.shadow.bias = -0.0006;
    this.scene.add(this.hemi, this.sun, this.sun.target);

    this.build(lots);
    this.setClock(8);

    this.sim = { pos: START.clone(), target: null, goal: null, speed: 12.4, keys: new Set(), near: null, step: 0, walk: 0, facing: 0 };
    // Intro: hold a close-up of the Sim, then ease out to the street. It starts once the model has
    // loaded (or after 7 s with the cutout, on very slow connections), and is skipped under reduced motion.
    this.intro = reducedMotion || mapOnly ? 0 : 1;
    this.introStart = null;
    this.introHold = INTRO_HOLD;
    // stage: 'loading' → 'white' → 'morph' → 'done' (null = no prologue: reduced motion / Work map)
    this.prologue = this.intro ? { stage: 'loading', t0: 0, morphT0: 0, colourReady: false } : null;
    this.fogK = this.prologue ? 1 : 0; // 1 = close mist around her, 0 = the normal haze
    if (this.prologue) this.loadWhiteModel('/models/rabiya-white.glb');
    this.introTimer = setTimeout(() => this.startIntro(), 7000);
    this.clock = new THREE.Clock();
    this.camPos = new THREE.Vector3();
    this.camLook = new THREE.Vector3();
    this.resize = this.resize.bind(this);
    addEventListener('resize', this.resize);
    this.resize();
    this.bindInput();
    this.snapCamera();
    this.raf = requestAnimationFrame(this.frame);
  }

  on(evt, fn) {
    if (!this.listeners.has(evt)) this.listeners.set(evt, new Set());
    this.listeners.get(evt).add(fn);
    return () => this.listeners.get(evt)?.delete(fn);
  }
  emit(evt, d) { this.listeners.get(evt)?.forEach((fn) => fn(d)); }

  // ------------------------------------------------------------------ world
  build(lots) {
    const { scene } = this;
    const rand = seeded(7);

    this.skyUniforms = { top: { value: new THREE.Color() }, bottom: { value: new THREE.Color() } };
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(700, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: this.skyUniforms,
      vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying float h; void main(){ float k = smoothstep(-0.05, 0.55, h); gl_FragColor = vec4(mix(bottom, top, k), 1.); }',
    })));

    const starPos = [];
    for (let i = 0; i < 900; i++) {
      const th = rand() * Math.PI * 2, ph = Math.acos(0.08 + rand() * 0.9);
      starPos.push(Math.sin(ph) * Math.cos(th) * 600, Math.cos(ph) * 600, Math.sin(ph) * Math.sin(th) * 600);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    this.starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, depthWrite: false, fog: false });
    scene.add(new THREE.Points(starGeo, this.starMat));

    // Ground, flat out to the railway round the edge of town, gently rolling beyond it
    this.groundMat = new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true });
    const groundGeo = new THREE.PlaneGeometry(900, 900, 90, 90);
    groundGeo.rotateX(-Math.PI / 2);
    const gp = groundGeo.attributes.position, FLAT = TRACK_R + 8;
    for (let i = 0; i < gp.count; i++) {
      const d = Math.hypot(gp.getX(i), gp.getZ(i));
      if (d > FLAT) gp.setY(i, (rand() - 0.3) * Math.min(7, (d - FLAT) * 0.06));
    }
    groundGeo.computeVertexNormals();
    const ground = new THREE.Mesh(groundGeo, this.groundMat);
    ground.receiveShadow = true;
    scene.add(ground);
    this.ground = ground;

    // Ring road + sidewalks + dashes, and a park in the middle
    const root = new THREE.Group();
    const ring = (r0, r1, y, color) => {
      const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 128, 1), mat(color, { roughness: 0.95 }));
      m.rotation.x = -Math.PI / 2; m.position.y = y; root.add(m);
    };
    ring(RING - 6.8, RING + 6.8, 0.02, 0xc9c4b8);   // sidewalks
    ring(RING - 3.65, RING + 3.65, 0.035, 0x9d9a92); // kerbs
    ring(RING - 3.5, RING + 3.5, 0.05, 0x4d5257);    // asphalt
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 1.5), mat(0xf4f1e2));
      dash.position.copy(polar(RING, a)).setY(0.065);
      dash.rotation.y = Math.PI / 2 - a; // along the tangent
      root.add(dash);
    }
    // Park: four paths from the inner sidewalk to a round plaza with the frog fountain
    const pathFrom = PLAZA_R - 0.3, pathTo = RING - 6.6, pathLen = pathTo - pathFrom;
    for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const path = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.03, pathLen), mat(0xd9d2c2));
      path.position.copy(polar(pathFrom + pathLen / 2, a)).setY(0.03);
      path.rotation.y = Math.PI - a; // radial
      root.add(path);
    }
    const fountain = createFountain(rand);
    scene.add(fountain.group);
    this.fountain = fountain;
    this.frogs = fountain.frogs;
    this.frogTrail = [];     // where she has walked, for caught frogs to follow
    this.caughtFrogs = [];

    // Street lamps around the ring
    const glowTex = canvasTexture(128, 128, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,214,150,.9)'); g.addColorStop(0.3, 'rgba(255,190,120,.35)'); g.addColorStop(1, 'rgba(255,190,120,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    });
    this.glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + Math.PI / 12; // none directly north, where the Sim starts
      const lamp = createStreetLamp();
      lamp.position.copy(polar(RING - 5.6, a));
      lamp.rotation.y = -a + Math.PI / 2;
      root.add(lamp);
      const glow = new THREE.Sprite(this.glowMat);
      glow.scale.setScalar(4.5);
      glow.position.copy(polar(RING - 5.0, a)).setY(3.2);
      scene.add(glow);
    }
    scene.add(bakeStatic(root));
    this.windowMat = mat(0x9cc7e6, { roughness: 0.15, metalness: 0.2, emissive: 0x23384d, emissiveIntensity: 0.25 });

    // Project houses: a crescent across the north, each facing the ring
    const n = lots.length;
    const spread = Math.min(1.35, 0.2 * (n - 1)); // half-angle
    const ringTex = canvasTexture(128, 128, (ctx, w, h) => {
      ctx.strokeStyle = '#5fe08a'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2 - 8, 0, Math.PI * 2); ctx.stroke();
    });
    // Shared pieces for featured houses
    const starShape = new THREE.Shape();
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? 0.62 : 1.5, t = (k / 10) * Math.PI * 2 + Math.PI / 2;
      k ? starShape.lineTo(Math.cos(t) * r, Math.sin(t) * r) : starShape.moveTo(Math.cos(t) * r, Math.sin(t) * r);
    }
    starShape.closePath();
    const badgeGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.4, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 2 });
    badgeGeo.center();
    const starMat = new THREE.MeshStandardMaterial({ color: 0xf2c85b, emissive: 0xb07a00, emissiveIntensity: 0.25, metalness: 0.4, roughness: 0.35 });
    const beamTex = canvasTexture(4, 128, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(255,226,140,0.9)'); g.addColorStop(1, 'rgba(255,226,140,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    });
    const beamMat = new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false });
    this.lots = lots.map((lot, i) => {
      const a = lot.angle != null ? THREE.MathUtils.degToRad(lot.angle) : n === 1 ? 0 : -spread + (i / (n - 1)) * spread * 2;
      const center = polar(HOUSE_R, a);
      const house = createHouse({
        name: lot.name, logo: lot.logo, storeys: lot.storeys || 1, wall: lot.wall, roof: lot.roof,
        accent: lot.sign || '#1f6b3f', extras: lot.extras || [], pathLen: 2.6, rand,
      });
      const g = bakeStatic(house);
      g.position.copy(center);
      g.rotation.y = -a; // front (+Z) faces the centre
      g.traverse((o) => { o.userData.lot = lot.id; });
      scene.add(g);
      const door = polar(DOOR_R, a);
      const marker = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, depthWrite: false, opacity: 0.35 }));
      marker.rotation.x = -Math.PI / 2; marker.position.copy(door).setY(0.09);
      scene.add(marker);
      // Featured projects: a spinning gold star over the roof and a soft beam of light
      let star = null;
      if (lot.featured) {
        star = new THREE.Group();
        const gem = new THREE.Mesh(badgeGeo, starMat);
        // Small star just above the roof, with a faint glow beneath it
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.4, 4, 32, 1, true), beamMat);
        beam.position.y = -1.6;
        star.add(gem, beam);
        star.position.copy(center).setY(9.6);
        gem.scale.setScalar(0.55);
        star.userData = { gem, beam, seed: i };
        scene.add(star);
      }
      return { ...lot, angle: a, center, door, group: g, marker, star, label: polar(HOUSE_R, a).setY(lot.featured ? 11 : 9) };
    });

    // The Rangeen house: not a project, a place to visit, at the free west end of the crescent
    {
      const a = THREE.MathUtils.degToRad(-86);
      const r = createRangeenHouse();
      const body = bakeStatic(r.group);
      const at = polar(HOUSE_R + 0.5, a);
      for (const o of [body, r.glow]) { o.position.copy(at); o.rotation.y = -a; scene.add(o); }
      // the house's own frame (+Z out of its front), for the kites and her spot on the roof
      const frame = new THREE.Group(); frame.position.copy(at); frame.rotation.y = -a; scene.add(frame);
      frame.updateMatrixWorld(true);
      this.kites = createKites({ reducedMotion: this.reducedMotion });
      this.kites.onEvent((e) => this.emit('kitegame', e)); // challenger · pech · win · lose · relaunch · gone
      frame.add(this.kites.group);
      this.rangeen = { ...r, angle: a, center: at, door: polar(DOOR_R, a), frame };
    }

    // The outskirts past the ring road: cricket ground, bazaar, dhaba, lake, railway, rickshaws (outskirts.js)
    this.outskirts = createOutskirts({ reducedMotion: this.reducedMotion });
    // its lamps glow like the ring road's (on at dusk); the floodlights are bigger
    {
      const lampRoot = new THREE.Group();
      for (const at of this.outskirts.lamps) {
        const lamp = createStreetLamp(); lamp.position.copy(at); lamp.rotation.y = Math.atan2(at.x, at.z); lampRoot.add(lamp);
        const glow = new THREE.Sprite(this.glowMat); glow.scale.setScalar(5); glow.position.copy(at).setY(3.2); scene.add(glow);
      }
      for (const at of this.outskirts.floods) { const glow = new THREE.Sprite(this.glowMat); glow.scale.setScalar(16); glow.position.copy(at); scene.add(glow); }
      this.outskirts.stat.add(lampRoot);
    }
    scene.add(bakeStatic(this.outskirts.stat), this.outskirts.live);
    this.obstacles = [...this.outskirts.obstacles, ...this.outskirts.lamps.map((p) => ({ x: p.x, z: p.z, r: 0.5 }))];

    // Forest: a belt beyond the railway, plus woods behind the crescent of houses (clear of the lake).
    // The near trees are obstacles now that she can walk out this far.
    const spots = [];
    while (spots.length < 170) {
      const a = rand() * Math.PI * 2, r = TRACK_R + 7 + rand() * 75;
      spots.push({ x: Math.sin(a) * r, z: -Math.cos(a) * r, scale: 0.9 + rand() * 1.2, pine: rand() < 0.45 });
    }
    for (let n = 0; n < 60;) {
      const a = THREE.MathUtils.degToRad(-100 + rand() * 175), r = 50 + rand() * 52; // -100° … 75°, north of the lake
      const x = Math.sin(a) * r, z = -Math.cos(a) * r;
      spots.push({ x, z, scale: 0.9 + rand() * 1.0, pine: rand() < 0.5 });
      this.obstacles.push({ x, z, r: 1.4 });
      n++;
    }
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (rand() - 0.5) * 2.2, r = RING + 9 + rand() * 6; // the southern verge
      spots.push({ x: Math.sin(a) * r, z: -Math.cos(a) * r, scale: 1 + rand() * 0.5, pine: rand() < 0.5 });
    }
    // Park trees stay to the sides so they never stand between the camera and the Sim
    for (const [x, z] of [[-14, -4], [14, 3], [-12, 11], [11, 12], [-15, 5]]) spots.push({ x, z, scale: 1.1 + rand() * 0.4, pine: false });
    scene.add(createForest(spots, rand));

    // The Sim, plus a big plumbob that marks her on the map
    this.simGroup = new THREE.Group();
    this.simGroup.position.copy(START);
    // An invisible hit box around her, so a click on her opens the action menu (cheaper than testing the model)
    this.simHit = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, SIM_H, 10), new THREE.MeshBasicMaterial({ visible: false }));
    this.simHit.position.y = SIM_H / 2;
    this.simGroup.add(this.simHit);
    // No 2D stand-in: the 3D model appears as soon as it loads. The flat cutout is only a
    // fallback if the model fails or takes over 7 s (see useFallbackSim).
    this.mapBob = createPlumbob({ size: 1.4, light: false });
    this.mapBob.userData.baseY = 5;
    this.mapBob.visible = false;
    this.simGroup.add(this.mapBob);
    scene.add(this.simGroup);

    // Where a click landed
    this.tapMark = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.5, 32), new THREE.MeshBasicMaterial({ color: 0x5fe08a, transparent: true, opacity: 0, depthWrite: false }));
    this.tapMark.rotation.x = -Math.PI / 2;
    scene.add(this.tapMark);

    // ~400k-triangle, 2048px-webp build of assets-raw/models/rabiya-full.glb (gltf-transform optimize, ratio 0.2)
    this.loadCharacterModel('/models/rabiya-lite.glb'); // (the white sculpt for the prologue loads from the constructor)
  }

  // ------------------------------------------------------------------ prologue: white sculpt → colour
  /** The white sculpt (assets-raw/whiterabiya-v1.glb, simplified to ~1 MB) the prologue starts with. */
  loadWhiteModel(url) {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    this.renderer.localClippingEnabled = true;
    // Clipping planes in world space: colour shows below the scan line, white above it
    this.clipColour = new THREE.Plane(new THREE.Vector3(0, -1, 0), -0.05);
    this.clipWhite = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.05);
    loader.load(url, (gltf) => {
      if (!this.prologue || this.prologue.stage === 'done') return;
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      model.scale.setScalar(SIM_H / (box.getSize(new THREE.Vector3()).y || 1));
      box.setFromObject(model);
      model.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
      const clay = new THREE.MeshStandardMaterial({ color: 0xf4efe9, roughness: 0.6, metalness: 0, clippingPlanes: [this.clipWhite] });
      model.traverse((o) => { if (o.isMesh) { o.material = clay; o.castShadow = true; } });
      model.rotation.y = -Math.PI / 2; // modelled facing +X, like the colour model
      const white = new THREE.Group();
      white.add(model);
      this.simGroup.add(white);
      this.white = white;
      this.whiteMat = clay;
      this.buildPrologueFx();
      this.prologuePending = 2; // start once she has actually been drawn
    }, undefined, () => this.endPrologue()); // no sculpt: go straight to the normal intro
  }

  /** Plumbob shards drifting around her, and the green scan line that turns her into colour. */
  buildPrologueFx() {
    const rand = (a, b) => a + Math.random() * (b - a);
    const shardGeo = new THREE.OctahedronGeometry(1, 0); shardGeo.scale(0.6, 1, 0.6);
    this.shardMat = new THREE.MeshStandardMaterial({ color: 0x5fe08a, emissive: 0x1d7a3d, emissiveIntensity: 0.7, roughness: 0.35, transparent: true, opacity: 0.9 });
    this.shards = new THREE.Group();
    for (let i = 0; i < 22; i++) {
      const m = new THREE.Mesh(shardGeo, this.shardMat);
      const a = rand(0, Math.PI * 2), r = rand(1.6, 6.5);
      m.position.set(Math.cos(a) * r, rand(0.2, 5), Math.sin(a) * r);
      m.scale.setScalar(rand(0.05, 0.12));
      m.userData = { spin: rand(0.4, 1.4), bob: rand(0, 6), base: m.position.y };
      this.shards.add(m);
    }
    this.simGroup.add(this.shards);
    const scanMat = new THREE.MeshBasicMaterial({ color: 0x8ff0b3, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
    this.scan = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.03, 8, 64), scanMat);
    ring.rotation.x = Math.PI / 2;
    const glow = new THREE.Mesh(new THREE.RingGeometry(0.2, 1.35, 64), scanMat.clone());
    glow.rotation.x = -Math.PI / 2; glow.material.opacity = 0;
    this.scan.add(ring, glow);
    this.scan.visible = false;
    this.simGroup.add(this.scan);
  }

  /** Colour materials get the clip plane so they can be revealed from the feet up. */
  clipColourModel(on) {
    this.simMesh?.traverse((o) => {
      if (!o.isMesh) return;
      for (const m of [].concat(o.material)) { m.clippingPlanes = on ? [this.clipColour] : []; m.needsUpdate = true; }
    });
  }

  /** Runs every frame while the prologue is on: orbit timing, the morph, the mist. */
  tickPrologue(now, time, dt) {
    const P = this.prologue;
    if (this.prologuePending && --this.prologuePending === 0) { P.stage = 'white'; P.t0 = now; this.emit('prologue', 'white'); }
    if (P.stage === 'loading') return;
    const t = (now - P.t0) / 1000;
    if (P.stage === 'white' && t >= WHITE && P.colourReady) { P.stage = 'morph'; P.morphT0 = now; this.scan.visible = true; this.emit('prologue', 'morph'); }
    let m = 0;
    if (P.stage === 'morph') {
      m = clamp01((now - P.morphT0) / 1000 / MORPH);
      const h = -0.05 + ease(m) * (SIM_H + 0.4);
      this.clipColour.constant = h; this.clipWhite.constant = -h;
      this.scan.position.y = h;
      const s = 0.85 + Math.sin(m * Math.PI) * 0.35; // the ring hugs her: wider at the hips than the feet or hat
      this.scan.scale.set(s, 1, s);
      const glowOn = Math.sin(m * Math.PI);
      this.scan.children[0].material.opacity = glowOn;
      this.scan.children[1].material.opacity = glowOn * 0.35;
      this.fogK = 1 - ease(m);
      if (m >= 1) this.endPrologue();
    }
    // Shards drift and spin; they fade out as she turns to colour
    if (this.shards) {
      this.shards.rotation.y = time * 0.12;
      this.shards.children.forEach((s) => { s.rotation.y += dt * s.userData.spin; s.position.y = s.userData.base + Math.sin(time * 1.2 + s.userData.bob) * 0.12; });
      this.shardMat.opacity = 0.9 * (P.stage === 'morph' ? 1 - m : 1);
    }
  }

  /** Where the prologue camera is on its orbit: 0 at the start, 1 when the morph ends. */
  prologueOrbit() {
    const P = this.prologue;
    if (!P || P.stage === 'loading') return 0;
    const now = performance.now();
    if (P.stage === 'white') return Math.min(0.62, ((now - P.t0) / 1000 / WHITE) * 0.62); // waits here if the colour model is late
    return 0.62 + 0.38 * clamp01((now - P.morphT0) / 1000 / MORPH);
  }

  /** Finish the prologue (naturally, or because the visitor skipped): colour on, sculpt and effects off. */
  endPrologue() {
    const P = this.prologue;
    if (!P || P.stage === 'done') return;
    P.stage = 'done';
    this.fogK = 0;
    if (this.white) { this.simGroup.remove(this.white); this.white.traverse((o) => o.geometry?.dispose()); this.whiteMat.dispose(); this.white = null; }
    for (const k of ['shards', 'scan']) if (this[k]) { this.simGroup.remove(this[k]); this[k].traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); }); this[k] = null; }
    this.clipColourModel(false);
    // (renderer clipping stays on: switching it off under materials compiled with clip planes breaks
    // their uniforms and every later frame throws; with empty clip lists it costs nothing)
    this.emit('prologue', 'done');
    // Hand over to the normal intro (a short hold, then the ease out to the street)
    if (this.intro) {
      this.introHold = PROLOGUE_HOLD;
      if (this.simModel) this.startIntro(); else this.introPending = 0;
    }
  }

  loadCharacterModel(url) {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;

        // Measure bounding box to normalize scale to SIM_H
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const targetHeight = SIM_H;
        const scale = targetHeight / (size.y || 1);
        model.scale.setScalar(scale);

        // Center on X and Z, and place feet at y = 0
        box.setFromObject(model);
        model.position.x = -(box.min.x + box.max.x) / 2;
        model.position.z = -(box.min.z + box.max.z) / 2;
        model.position.y = -box.min.y;

        // Enable shadows and standard PBR settings
        model.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            if (o.material) {
              o.material.roughness = Math.max(o.material.roughness ?? 0.6, 0.45);
              // Crisp textures at grazing angles when the camera orbits around her
              const aniso = this.renderer.capabilities.getMaxAnisotropy();
              for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap']) if (o.material[k]) o.material[k].anisotropy = aniso;
            }
          }
        });

        // container (position) › face (turns) › gait (bounce, sway, lean; pivots at the feet) › model
        model.rotation.y = -Math.PI / 2; // the model's front is its +X side; turn it to face +Z
        const container = new THREE.Group();
        const face = new THREE.Group();
        const gait = new THREE.Group();
        gait.add(model);
        face.add(gait);
        container.add(face);

        // Ground shadow blob
        const shadowTex = canvasTexture(128, 128, (ctx, w, h) => {
          const grd = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
          grd.addColorStop(0, 'rgba(0,0,0,0.45)');
          grd.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grd;
          ctx.fillRect(0, 0, w, h);
        });
        const blobMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
        const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.15), blobMat);
        blob.rotation.x = -Math.PI / 2;
        blob.position.y = 0.02;
        container.add(blob);

        // Street plumbob floating above her head
        // A soft fill that travels with her (stronger at night), so she never turns into a silhouette
        const fill = new THREE.PointLight(0xfff1e0, 0, 9, 1.4);
        fill.position.set(0.6, SIM_H * 0.7, 2.6);
        container.add(fill);
        this.simFill = fill;
        this.simFill.intensity = this.fillLevel ?? 6;

        const bob = createPlumbob({ size: 0.26, light: false });
        bob.userData.baseY = targetHeight + 0.45;
        container.add(bob);

        if (this.cutout) { this.simGroup.remove(this.cutout); this.cutout = null; }
        this.simGroup.add(container);
        this.simModel = container;
        this.simMesh = model;
        this.simFace = face;
        this.simGait = gait;
        this.simBlob = blob;
        this.simBob = bob;
        if (this.prologue && this.prologue.stage !== 'done') {
          // Hidden below the scan line until the white sculpt "formulates" into her
          this.clipColourModel(true);
          this.prologue.colourReady = true;
          if (this.prologue.skipped) this.endPrologue(); // the visitor already moved on: swap straight away
        } else {
          this.introPending = 2; // start the hold once she has actually been drawn (uploading the model stalls a frame)
        }
      },
      undefined,
      (err) => {
        console.warn('Could not load 3D character, using the 2D cutout:', err);
        this.useFallbackSim();
      }
    );
  }

  // ------------------------------------------------------------------ time and camera
  /** Hours on the in-game clock, 6 → 23. */
  setClock(h) {
    const P = paletteAt(h);
    this.skyUniforms.top.value.copy(P.skyTop);
    this.skyUniforms.bottom.value.copy(P.skyBottom);
    if (!this.scene.fog) this.scene.fog = new THREE.Fog(0xffffff, 90, 420);
    this.scene.fog.color.copy(P.fog);
    this.groundMat.color.copy(P.ground);
    this.hemi.color.copy(P.hemiSky); this.hemi.groundColor.copy(P.hemiGround); this.hemi.intensity = P.hemi;
    this.sun.color.copy(P.sun); this.sun.intensity = P.sunI; this.sun.position.set(...P.sunPos);
    this.renderer.toneMappingExposure = P.exposure;
    this.windowMat.emissive.set(P.window > 0.5 ? 0xffb866 : 0x23384d);
    this.windowMat.emissiveIntensity = P.window;
    this.glowMat.opacity = P.lamps;
    this.rangeen?.setLights(Math.min(1, Math.max(0, P.lamps)));
    this.kites?.setNight(clamp01((P.stars - 0.35) / 0.65));
    this.outskirts?.setLights(clamp01(P.lamps));
    // kept so the roof can tint the sky (see frame)
    this.skyBase = { top: P.skyTop.clone(), bottom: P.skyBottom.clone(), day: 1 - clamp01(P.stars / 0.35) };
    this.roofSky = -1; // re-apply
    this.starMat.opacity = P.stars;
    this.fillLevel = 4 + P.stars * 26 + P.lamps * 6;
    if (this.simFill) this.simFill.intensity = this.fillLevel;
    if (this.cutout?.children?.[0]?.material?.color) {
      this.cutout.children[0].material.color.setScalar(1 - Math.min(0.3, P.stars * 0.3));
    }
  }

  skipIntro() {
    if (!this.intro) return;
    this.intro = 0;
    this.fogK = 0;
    if (this.prologue?.colourReady || !this.white) this.endPrologue();
    else this.prologue.skipped = true; // the sculpt stays until the colour model arrives, then swaps instantly
    this.emit('intro', 'out'); this.emit('intro', 'done');
  }
  useFallbackSim() {
    if (this.simModel || this.cutout) return;
    this.cutout = createSimCutout('/img/sim-fullbody.webp', { height: SIM_H });
    this.simGroup.add(this.cutout);
  }
  startIntro() {
    clearTimeout(this.introTimer);
    // The 7 s safety timer while the prologue is still waiting: give up on it and show what we have
    if (this.prologue && this.prologue.stage !== 'done') { this.endPrologue(); return; }
    if (!this.simModel) this.useFallbackSim();
    if (this.introStart === null) this.introStart = performance.now();
  }
  /** 1 = the close-up, 0 = the normal street camera. */
  introAmount() {
    if (!this.intro) return 0;
    if (this.introStart === null) return 1;
    const t = (performance.now() - this.introStart) / 1000;
    const k = 1 - ease(clamp01((t - this.introHold) / INTRO_OUT));
    if (t > this.introHold * 0.3 && !this.introOut) { this.introOut = true; this.emit('intro', 'out'); }
    if (k <= 0) { this.intro = 0; this.emit('intro', 'done'); }
    return k;
  }

  /** 0 = street level behind the Sim, 1 = the map from above. */
  setView(t) {
    this.view = clamp01(t);
    if (this.view > 0.02) this.skipIntro(); // scrolling skips the intro
  }
  setActive(on) { this.active = on; if (on) this.clock.getDelta(); }

  cameraFor(view) {
    const portrait = this.camera.aspect < 0.9;
    const s = this.sim.pos;
    // Street: a three-quarter Sims camera that follows the Sim, looking north into the crescent
    // (landscape keeps the Sim right of centre and the three flagship houses in the middle)
    // Landscape looks a little left of the Sim so Vettio, Crewnity and Flownet all sit right of the intro panel
    // The default framing keeps her right of the hero text; once the visitor orbits or zooms in, centre her
    // Near the Rangeen house the camera swings round to face its front (it faces east, the street looks north)
    const at = this.autoTurn || 0;
    const O = at ? { ...this.orbit, yaw: this.orbit.yaw + at * 1.4, dist: this.orbit.dist * (1 - at * 0.32) } : this.orbit;
    const lat = (portrait ? 3 : 12) * clamp01(1 - Math.abs(O.yaw) * 1.5) * clamp01((O.dist - 0.35) / 0.65);
    const follow = new THREE.Vector3(s.x - lat, portrait ? 11 : 9.5, s.z + (portrait ? 25 : 27));
    const followLook = new THREE.Vector3(s.x - lat, 3.6, s.z - 18);
    if (this.kiteMode) {
      // On the roof: over her right shoulder at head height, so she stands on the right with the
      // parapet and the street in front of her, and the string runs up to the kite in the sky.
      // The higher the kite, the further back the camera eases, so both stay in frame.
      const K = this.kites, F = this.rangeen.frame, el = K.fly.el, h = K.hand;
      // (the camera stays inside the terrace: from behind the back parapet it would block the view)
      const back = Math.min(h.z - this.rangeen.roof.back - 0.4, (portrait ? 4.2 : 3.6) + el * 1.2);
      const cam = new THREE.Vector3(h.x + (portrait ? 0.6 : 1.4), h.y + 0.15, h.z - back);
      // tilt up toward the kite, but never so far that she drops out of the bottom of the frame
      const look = h.clone().setY(h.y - 0.6).lerp(K.kitePos, 0.5);
      const pitchOf = (p) => Math.atan2(p.y - cam.y, Math.hypot(p.x - cam.x, p.z - cam.z));
      const half = THREE.MathUtils.degToRad((this.baseFov + 18) / 2);
      // (on a phone the controls take the bottom of the screen, so she sits higher)
      const maxPitch = pitchOf(h.clone().setY(h.y - 0.6)) + half * (portrait ? 0.4 : 0.85);
      const lp = pitchOf(look);
      if (lp > maxPitch) { const flat = Math.hypot(look.x - cam.x, look.z - cam.z); look.y = cam.y + Math.tan(maxPitch) * flat; }
      follow.copy(F.localToWorld(cam));
      followLook.copy(F.localToWorld(look));
    }
    // Visitor orbit (drag on the street): swing the camera around her, tilt it, move closer or further
    else if (O.yaw || O.pitch || O.dist !== 1) {
      const pivot = new THREE.Vector3(s.x, 0, s.z);
      const turn = (v) => v.sub(pivot).applyAxisAngle(UP, O.yaw).add(pivot);
      turn(follow); turn(followLook);
      const off = follow.clone().sub(pivot);
      off.y = Math.max(1.6, off.y * (1 + O.pitch));
      off.multiplyScalar(O.dist);
      follow.copy(pivot).add(off);
      followLook.y = Math.max(1.2, followLook.y - O.pitch * 2.4);
      followLook.sub(pivot).multiplyScalar(Math.max(0.6, O.dist)).add(pivot);
      // Never put the camera inside a house: pull in toward her, then rise over the roof if needed
      // (houses are ~8 m wide, so 4.8 m from the centre is just outside the walls)
      const inside = (p) => this.lots.some((l) => Math.hypot(p.x - l.center.x, p.z - l.center.z) < 4.8);
      const flatDist = () => Math.hypot(follow.x - pivot.x, follow.z - pivot.z);
      for (let i = 0; i < 12 && inside(follow) && flatDist() > 4; i++) follow.lerp(new THREE.Vector3(pivot.x, follow.y, pivot.z), 0.18);
      if (inside(follow)) follow.y = Math.max(follow.y, 10.5);
      // Once the visitor takes the camera, it looks at her rather than down the street
      const k = clamp01(Math.abs(O.yaw) * 2 + (1 - O.dist) * 2 + Math.abs(O.pitch));
      followLook.lerp(new THREE.Vector3(pivot.x, SIM_H * 0.55, pivot.z), k);
    }
    // Map: high above the park, tilted a touch so the houses still read as houses.
    // Landscape shifts the town left so the legend panel never covers a lot.
    // (the Work page banner is very wide, so it flies lower and needs no room for a legend)
    const shift = 0; // centred: nothing on screen competes with the map any more
    const wide = this.camera.aspect > 2;
    const tall = portrait && this.mapOnly ? 125 : 235; // the Work banner on a phone is short, so fly lower
    // Looks at z≈-5, the middle of everything (the crescent at -37…-14 and the ring down to +32)
    const map = new THREE.Vector3(shift, portrait ? tall : wide ? 92 : 128, portrait ? (this.mapOnly ? 36 : 62) : wide ? 22 : 40);
    const mapLook = new THREE.Vector3(shift, 0, portrait ? (this.mapOnly ? -10 : -4) : wide ? -20 : -5);
    // Visitor zoom and pan on the map: move along the view line, slide across the ground
    map.sub(mapLook).multiplyScalar(this.zoom).add(mapLook).add(this.pan);
    mapLook.add(this.pan);
    const k = ease(view);
    const pos = follow.lerp(map, k), look = followLook.lerp(mapLook, k);
    // Intro close-up: in front of her and a little to the side, framing head to knees
    const i = this.introAmount();
    if (i > 0) {
      const close = new THREE.Vector3(s.x - (portrait ? 0.6 : 2.4), SIM_H * 0.66, s.z + (portrait ? 8.4 : 7.2));
      const closeLook = new THREE.Vector3(s.x - (portrait ? 0 : 0.6), SIM_H * 0.56, s.z);
      // Prologue: orbit around her and arrive at the close-up's own angle, rising from hip to face height
      const P = this.prologue;
      if (P && P.stage !== 'done') {
        const u = ease(this.prologueOrbit());
        const ox = close.x - s.x, oz = close.z - s.z;
        const r = Math.hypot(ox, oz), end = Math.atan2(ox, oz);
        const a = ORBIT_FROM + (end - ORBIT_FROM) * u;
        close.set(s.x + Math.sin(a) * r * (1.08 - 0.08 * u), SIM_H * (0.42 + 0.24 * u), s.z + Math.cos(a) * r * (1.08 - 0.08 * u));
        closeLook.lerp(new THREE.Vector3(s.x, SIM_H * 0.6, s.z), 1 - u);
      }
      pos.lerp(close, i); look.lerp(closeLook, i);
    }
    return { pos, look };
  }
  snapCamera() {
    const { pos, look } = this.cameraFor(this.view);
    this.camPos.copy(pos); this.camLook.copy(look);
  }

  resize() {
    const w = this.container.clientWidth || innerWidth, h = this.container.clientHeight || innerHeight;
    this.camera.aspect = w / h;
    this.baseFov = this.camera.aspect < 0.9 ? 44 : 36;
    this.camera.fov = this.kiteMode ? this.baseFov + 18 : this.baseFov; // a wider lens on the roof (see frame)
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  // ------------------------------------------------------------------ input
  bindInput() {
    const el = this.renderer.domElement;
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const pick = (e) => {
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, this.camera);
      // Easter egg: wild frogs can be clicked (no hover highlight, nothing tells you)
      if (this.view < 0.5 && !this.mapOnly) {
        if (!this.kiteMode && !this.intro && ray.intersectObject(this.simHit)[0]) return { sim: true }; // her: the action menu
        const wild = this.frogs.filter((f) => !f.userData.caught);
        const fh = ray.intersectObjects(wild, true)[0];
        if (fh) { let o = fh.object; while (o && !wild.includes(o)) o = o.parent; if (o) return { frog: o }; }
      }
      const lotHit = ray.intersectObjects(this.lots.map((l) => l.group), true)[0];
      if (lotHit) return { lot: lotHit.object.userData.lot };
      const g = ray.intersectObject(this.ground)[0];
      return g ? { point: g.point } : {};
    };
    // Gestures. Map: drag to pan. Street: drag to orbit around her. Both: pinch / ctrl+wheel / buttons zoom.
    const pointers = new Map();
    let drag = null, pinch = null, dragged = false;
    const street = () => this.view < 0.45 && !this.mapOnly;
    this.onDown = (e) => {
      if (!street() && this.view < 0.6) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      dragged = false;
      if (pointers.size === 1) drag = { x: e.clientX, y: e.clientY };
      if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom: this.currentZoom() }; drag = null; }
    };
    this.onUp = (e) => { pointers.delete(e.pointerId); if (pointers.size < 2) pinch = null; if (!pointers.size) { drag = null; el.style.cursor = ''; } };
    this.onMove = (e) => {
      if (pointers.has(e.pointerId)) {
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pinch && pointers.size === 2) {
          const [a, b] = [...pointers.values()];
          this.setZoom(pinch.zoom * pinch.d / Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)));
          dragged = true; return;
        }
        if (drag) {
          const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
          if (Math.abs(dx) + Math.abs(dy) > 4) dragged = true;
          if (dragged && this.kiteMode) { this.kites.drag(dx, dy); drag = { x: e.clientX, y: e.clientY }; return; } // on the roof a drag flies the kite
          if (dragged && street()) {
            // Orbit: sideways swings around her, up/down tilts the camera
            this.skipIntro();
            this.orbit.yaw -= dx * 0.006;
            this.orbit.pitch = Math.min(0.9, Math.max(-0.55, this.orbit.pitch - dy * 0.004));
            drag = { x: e.clientX, y: e.clientY };
            el.style.cursor = 'grabbing';
            this.emit('zoom', this.currentZoom());
            return;
          }
          if (dragged) {
            // Screen pixels → ground units at the current map height
            const units = (this.camera.position.y * 2 * Math.tan((this.camera.fov * Math.PI) / 360)) / el.clientHeight;
            this.panBy(-dx * units, -dy * units);
            drag = { x: e.clientX, y: e.clientY };
            el.style.cursor = 'grabbing';
            return;
          }
        }
      }
      const { lot, sim } = pick(e);
      if (lot !== this.hovered || sim !== this.hoverSim) {
        this.hoverSim = sim;
        el.style.cursor = lot || sim ? 'pointer' : this.view < 0.5 ? 'crosshair' : this.view > 0.6 ? 'grab' : '';
        if (lot !== this.hovered) { this.hovered = lot; this.emit('hover', lot || null); }
      }
    };
    this.onClick = (e) => {
      if (dragged) { dragged = false; return; } // the end of a pan isn't a click
      if (this.kiteMode) return;
      this.skipIntro();
      const { lot, point, frog, sim } = pick(e);
      if (sim) { const r = el.getBoundingClientRect(); this.emit('simClick', { x: e.clientX - r.left, y: e.clientY - r.top }); return; }
      if (frog) { this.goCatch(frog); return; }
      if (lot) { if (this.view > 0.5) this.emit('enter', lot); else this.walkTo(lot); return; }
      if (point && this.view < 0.5 && !this.mapOnly) this.walkToPoint(point);
    };
    // Trackpad pinch arrives as ctrl+wheel; a plain wheel keeps scrolling the page
    this.onWheel = (e) => {
      if ((!street() && this.view < 0.6) || !e.ctrlKey) return;
      e.preventDefault();
      this.setZoom(this.currentZoom() * Math.exp(e.deltaY * 0.01));
    };
    this.onDbl = (e) => { if (this.view > 0.6) { e.preventDefault(); this.zoomBy(0.7); } };
    el.addEventListener('pointerdown', this.onDown);
    el.addEventListener('pointerup', this.onUp);
    el.addEventListener('pointercancel', this.onUp);
    el.addEventListener('pointermove', this.onMove);
    el.addEventListener('click', this.onClick);
    el.addEventListener('wheel', this.onWheel, { passive: false });
    el.addEventListener('dblclick', this.onDbl);
  }

  // ------------------------------------------------------------------ map zoom & pan
  /** zoom < 1 is closer, > 1 further out. Clamped to the neighbourhood. */
  // On the street, "zoom" is the orbit distance (0.35 close-up … 1.4); on the map it's the map zoom.
  onStreet() { return this.view < 0.45 && !this.mapOnly; }
  currentZoom() { return this.onStreet() ? this.orbit.dist : this.zoom; }
  setZoom(z) {
    if (this.onStreet()) {
      this.skipIntro();
      this.orbit.dist = Math.min(1.4, Math.max(0.35, z));
      this.emit('zoom', this.orbit.dist);
      return;
    }
    this.zoom = Math.min(MAP_ZOOM_MAX, Math.max(0.4, z)); // > 1 pulls back to show the outskirts too
    this.panBy(0, 0); // re-clamp the pan for the new zoom
    this.emit('zoom', this.zoom);
  }
  zoomBy(f) { this.setZoom(this.currentZoom() * f); }
  resetView() {
    if (this.onStreet()) { this.orbit = { yaw: 0, pitch: 0, dist: 1 }; this.emit('zoom', 1); }
    else this.resetMap();
  }
  panBy(dx, dz) {
    // The closer you are, the further you may wander (the town is ~110 m across), but never off the map
    const lim = 25 + 60 * clamp01((MAP_ZOOM_MAX - this.zoom) / (MAP_ZOOM_MAX - 0.4));
    this.pan.x = Math.min(lim, Math.max(-lim, this.pan.x + dx));
    this.pan.z = Math.min(lim, Math.max(-lim, this.pan.z + dz));
  }
  resetMap() { this.pan.set(0, 0, 0); this.setZoom(1); }

  /** Arrow keys / WASD, fed by the page while the game has focus. */
  key(code, down) {
    const map = { ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd', ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r' };
    const k = map[code];
    if (!k) return false;
    this.skipIntro();
    const held = (this.keyAt ||= {}), real = (this.realKeys ||= new Set());
    if (down) {
      if (!real.has(k)) held[k] = performance.now();
      real.add(k); this.sim.keys.add(k); this.sim.target = null; this.sim.goal = null; this.sim.arrive = null; this.sim.catching = null;
    } else {
      // A quick tap still takes a small step: keep the key "down" for at least 160 ms
      real.delete(k);
      const left = 160 - (performance.now() - (held[k] || 0));
      if (left > 0) setTimeout(() => { if (!real.has(k)) this.sim.keys.delete(k); }, left);
      else this.sim.keys.delete(k);
    }
    return true;
  }
  releaseKeys() { this.sim.keys.clear(); this.realKeys?.clear(); this.sim.running = false; }
  /** Shift held: she breaks into a jog. */
  setRun(on) { this.sim.running = !!on; }

  /** Up on the Rangeen roof flying a kite (true), or back down at its door (false).
   *  The page fades to black around this, so the jump and the camera cut are hidden. */
  setKite(on) {
    const R = this.rangeen, S = this.sim;
    if (!R || this.mapOnly || !!on === !!this.kiteMode) return;
    this.kiteMode = !!on;
    this.releaseKeys(); S.target = null; S.goal = null; S.catching = null; S.walk = 0;
    this.tapMark.material.opacity = 0;
    if (on) {
      S.pos.copy(R.frame.localToWorld(R.roof.spot.clone())).setY(0);
      this.kites.launch();
    } else {
      // back on the path, a step out from the door, facing the street
      S.pos.copy(R.door).addScaledVector(R.door.clone().setY(0).normalize(), -1.4);
      this.kites.land();
    }
    // on the roof she's life-size (the street Sim is larger than life), so the parapet comes to her waist
    this.simGroup.scale.setScalar(on ? ROOF_SCALE : 1);
    this.simGroup.position.set(S.pos.x, on ? R.roof.y : 0, S.pos.z);
    this.autoTurn = on ? 0 : this.autoTurn;
    this.camera.fov = this.baseFov + (on ? 18 : 0); this.camera.updateProjectionMatrix();
    this.snapCamera();
  }

  /** Wild frogs do the odd little hop on the spot; caught frogs hop along her trail, one behind another. */
  tickFrogs(time, dt) {
    const S = this.sim, still = this.reducedMotion;
    for (const f of this.frogs) {
      if (f.userData.caught || still) continue;
      const u = f.userData;
      u.nextHop -= dt;
      if (u.nextHop <= 0) { u.hopT = 1; u.nextHop = 3 + Math.random() * 7; u.turn = (Math.random() - 0.5) * 1.2; }
      if (u.hopT > 0) {
        u.hopT = Math.max(0, u.hopT - dt * 2.4);
        const k = 1 - u.hopT;
        f.position.y = u.home.y + Math.sin(k * Math.PI) * 0.35;
        f.rotation.y += u.turn * dt * 2.4;
      }
    }
    if (!this.caughtFrogs.length) return;
    // Record her path every half metre
    const trail = this.frogTrail;
    if (!trail.length || trail[trail.length - 1].distanceTo(S.pos) > 0.5) { trail.push(S.pos.clone()); if (trail.length > 80) trail.shift(); }
    this.caughtFrogs.forEach((f, i) => {
      const u = f.userData;
      // Leap from the pond to her side first
      if (u.jump) {
        u.jump.t = Math.min(1, u.jump.t + dt * 1.3);
        const k = u.jump.t, to = S.pos.clone().add(new THREE.Vector3(1.2, 0, 1.2));
        f.position.lerpVectors(u.jump.from, to, k);
        f.position.y = THREE.MathUtils.lerp(u.jump.from.y, 0, k) + Math.sin(k * Math.PI) * 2.2;
        f.rotation.y = Math.atan2(to.x - u.jump.from.x, to.z - u.jump.from.z);
        if (k >= 1) { u.jump = null; u.hop = 0; }
        return;
      }
      // Target: a spot ~1.8 m × (place in line) back along her trail
      const back = 1.8 * (i + 1);
      let target = trail[0], acc = 0;
      for (let j = trail.length - 1; j > 0; j--) {
        acc += trail[j].distanceTo(trail[j - 1]);
        if (acc >= back) { target = trail[j - 1]; break; }
      }
      const to = target.clone().sub(f.position).setY(0);
      const dist = to.length();
      if (dist > 0.6 && !still) {
        u.hop = (u.hop || 0) + dt * 3.2;
        const step = Math.min(dist, dt * Math.max(4, dist * 2.2));
        f.position.addScaledVector(to.normalize(), step);
        f.position.y = Math.abs(Math.sin(u.hop * Math.PI)) * 0.45;
        f.rotation.y = Math.atan2(to.x, to.z);
      } else {
        f.position.y = Math.max(0, f.position.y - dt * 3);
        if (still) f.position.copy(target).setY(0);
      }
    });
  }

  /** Walk to the nearest spot on the plaza beside a frog; the catch happens on arrival. */
  goCatch(frog) {
    const wp = frog.getWorldPosition(new THREE.Vector3()).setY(0);
    const t = this.clampWalkable(wp.clone());
    this.sim.target = t; this.sim.goal = null; this.sim.catching = frog; this.sim.arrive = null;
    this.tapMark.position.copy(t).setY(0.1);
    this.tapMark.material.opacity = 0.9;
  }
  catchFrog(frog) {
    const S = this.sim;
    frog.userData.caught = true;
    frog.userData.jump = { from: frog.getWorldPosition(new THREE.Vector3()), t: 0 };
    // Re-parent to the scene so it can roam freely
    this.scene.attach(frog);
    this.caughtFrogs.push(frog);
    this.frogTrail = [S.pos.clone()];
    this.emit('frog', this.caughtFrogs.length);
  }

  // ------------------------------------------------------------------ actions (her pie menu on the street)
  // Each one walks her there first, then does the thing on arrival. Taking over (a click, a key) cancels it.
  /** Walk to `p`, then call `then`. */
  walkThen(p, then) {
    this.walkToPoint(p);
    this.sim.arrive = then;
  }
  /** The nearest frog still in the fountain, or null once they're all caught. */
  nearestFrog() {
    const S = this.sim, wp = new THREE.Vector3();
    let best = null, bd = Infinity;
    for (const f of this.frogs) {
      if (f.userData.caught) continue;
      const d = f.getWorldPosition(wp).distanceTo(S.pos);
      if (d < bd) { bd = d; best = f; }
    }
    return best;
  }
  /** Catch a frog: walk to the fountain's edge beside the nearest one, and catch it there. */
  actCatchFrog() {
    const f = this.nearestFrog();
    if (!f) return false;
    this.goCatch(f);
    return true;
  }
  /** Walk up the Rangeen house's path to its door, then `then` (the page takes her up to the roof). */
  actGoToRangeen(then) {
    const R = this.rangeen;
    if (!R) return;
    this.walkThen(R.door.clone().addScaledVector(R.door.clone().setY(0).normalize(), -0.8), then);
  }
  /** Walk to a project house's door, then `then` (the page opens it). */
  actVisit(id, then) {
    this.walkTo(id);
    this.sim.arrive = then;
  }
  /** The project house nearest to her, for "Visit …". */
  nearestLot() {
    let best = null, bd = Infinity;
    for (const l of this.lots) { const d = l.door.distanceTo(this.sim.pos); if (d < bd) { bd = d; best = l; } }
    return best;
  }
  /** A little dance on the spot: a spin and a few hops. */
  dance() { this.sim.dance = 1.8; this.sim.target = null; this.sim.arrive = null; }

  walkToPoint(p) {
    const t = this.clampWalkable(p.clone().setY(0));
    this.sim.target = t; this.sim.goal = null; this.sim.catching = null; this.sim.arrive = null;
    this.tapMark.position.copy(t).setY(0.1);
    this.tapMark.material.opacity = 0.9;
  }
  walkTo(id) {
    const lot = this.lots.find((l) => l.id === id);
    if (!lot) return;
    this.sim.target = lot.door.clone(); this.sim.goal = id; this.sim.catching = null; this.sim.arrive = null;
    this.tapMark.position.copy(lot.door).setY(0.1);
    this.tapMark.material.opacity = 0.9;
  }

  clampWalkable(p) {
    const r = Math.hypot(p.x, p.z);
    if (r > WALK_R) p.multiplyScalar(WALK_R / r); // out to the railway, not over it
    // Round things she walks around: stalls, the dhaba, trees, the scoreboard; the lake is an oval
    for (const o of this.obstacles || []) {
      const sx = o.sx || 1, dx = (p.x - o.x) / sx, dz = p.z - o.z, d = Math.hypot(dx, dz);
      if (d < o.r) { const k = o.r / Math.max(d, 0.001); p.x = o.x + dx * k * sx; p.z = o.z + dz * k; }
    }
    // Walk around the fountain, not through it
    const keep = BASIN_R + 0.6;
    if (r < keep) { if (r < 0.01) p.set(0, 0, keep); else p.multiplyScalar(keep / r); }
    for (const l of this.lots) {
      const d = p.clone().sub(l.center);
      if (d.length() < 5.2) p.copy(l.center).add(d.setLength(5.2));
    }
    // The Rangeen row (house plus neighbours) is wide: keep her out of its footprint, pushing to the nearest edge
    if (this.rangeen) {
      const R = this.rangeen, half = R.width / 2 + 0.3, back = -3.6, front = 3.9;
      const local = p.clone().sub(R.center).applyAxisAngle(UP, R.angle); // into the house's own frame (front = +Z)
      if (Math.abs(local.x) < half && local.z > back && local.z < front) {
        const out = [[half - Math.abs(local.x), 'x'], [front - local.z, 'f'], [local.z - back, 'b']].sort((u, v) => u[0] - v[0])[0][1];
        if (out === 'x') local.x = Math.sign(local.x || 1) * half; else if (out === 'f') local.z = front; else local.z = back;
        p.copy(local.applyAxisAngle(UP, -R.angle).add(R.center)).setY(0);
      }
    }
    return p;
  }

  // ------------------------------------------------------------------ queries for the page
  /** Screen positions of each lot's label, for the HTML map pins. */
  lotScreenPositions() {
    const r = this.renderer.domElement.getBoundingClientRect();
    return this.lots.map((l) => {
      const v = l.label.clone().project(this.camera);
      return { id: l.id, x: ((v.x + 1) / 2) * r.width, y: ((1 - v.y) / 2) * r.height, visible: v.z < 1 };
    });
  }
  simScreenPosition() {
    const v = this.simGroup.position.clone().add(new THREE.Vector3(0, SIM_H + 0.6, 0)).project(this.camera);
    const r = this.renderer.domElement.getBoundingClientRect();
    return { x: ((v.x + 1) / 2) * r.width, y: ((1 - v.y) / 2) * r.height };
  }
  highlight(id) { this.highlighted = id; }

  // ------------------------------------------------------------------ loop
  frame = () => {
    this.raf = requestAnimationFrame(this.frame);
    if (!this.active) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const time = this.clock.elapsedTime;
    const S = this.sim;

    // Movement: keys steer relative to the camera (north is up), clicks walk to a target
    const move = new THREE.Vector3();
    if (S.keys.size) {
      if (S.keys.has('u')) move.z -= 1; if (S.keys.has('d')) move.z += 1;
      if (S.keys.has('l')) move.x -= 1; if (S.keys.has('r')) move.x += 1;
      move.applyAxisAngle(UP, this.orbit.yaw + (this.autoTurn || 0) * 1.4); // "up" always walks away from the camera
    } else if (S.target) {
      move.subVectors(S.target, S.pos).setY(0);
      // Stuck against a wall or the fountain (the walk is a straight line)? Count it as arrived.
      const d = move.length();
      if (S.trackFor !== S.target) { S.trackFor = S.target; S.bestD = d; S.stuckT = 0; }
      if (d < S.bestD - 0.05) { S.bestD = d; S.stuckT = 0; } else S.stuckT += dt;
      if (d < 0.25 || S.stuckT > 1.2) {
        S.target = null; move.set(0, 0, 0);
        this.tapMark.material.opacity = 0;
        S.goal = null; // arriving at a door only offers "Go inside"; the visitor decides (unless an action asked for it)
        if (S.catching) {
          const f = S.catching; S.catching = null;
          if (!f.userData.caught && f.getWorldPosition(new THREE.Vector3()).setY(0).distanceTo(S.pos) < 5) this.catchFrog(f);
        }
        const then = S.arrive; S.arrive = null; then?.(); // an action from her menu finishes here
      }
    }
    const moving = move.lengthSq() > 0 && this.view < 0.6 && !this.intro && !this.kiteMode; // on the roof the keys fly the kite
    // Shift + keys: ease up to a jog (0 walk → 1 run), and back down when Shift is let go
    S.run = (S.run || 0) + (((moving && S.running && S.keys.size) ? 1 : 0) - (S.run || 0)) * Math.min(1, dt * 5);
    if (moving) {
      // Ease into the stride instead of snapping to full speed
      move.normalize().multiplyScalar(S.speed * (1 + 0.75 * S.run) * (0.35 + 0.65 * S.walk) * dt);
      const next = this.clampWalkable(S.pos.clone().add(move));
      S.pos.copy(next);
      const before = Math.floor(S.step / Math.PI);
      S.step += dt * (12 + 5 * S.run); // stride keeps pace with the speed
      if (Math.floor(S.step / Math.PI) !== before) this.emit('step'); // one per footfall
    }
    S.walk += ((moving ? 1 : 0) - S.walk) * Math.min(1, dt * 7); // 0 idle → 1 full stride
    const R = this.rangeen, kite = this.kiteMode;
    this.simGroup.position.set(S.pos.x, kite ? R.roof.y : 0, S.pos.z);

    // The kites over the Rangeen house (her own only while she's on its roof)
    let kw = null;
    if (this.kites) {
      this.kites.group.visible = this.view < 0.5 && !this.mapOnly;
      if (this.kites.group.visible || kite) {
        // her hand: raised in front of her chest, toward the kite
        const F = this.kites.fly, spot = R.roof.spot;
        const hand = new THREE.Vector3(Math.sin(F.az) * 0.35, spot.y + SIM_H * ROOF_SCALE * 0.68, spot.z + Math.cos(F.az) * 0.35);
        this.kites.tick(dt, time, kite ? S.keys : NO_KEYS, hand.setX(spot.x + hand.x));
        if (kite) kw = R.frame.localToWorld(this.kites.kitePos.clone());
      }
    }

    if (this.simFace) {
      // Face where she's walking; when idle, turn to the camera like a Sim waiting for you
      // (during the prologue she holds still, matching the white sculpt, so the camera orbits her;
      // on the roof she faces her kite)
      const want = kw ? Math.atan2(kw.x - S.pos.x, kw.z - S.pos.z)
        : moving ? Math.atan2(move.x, move.z)
        : this.prologue && this.prologue.stage !== 'done' ? 0
          : Math.atan2(this.camera.position.x - S.pos.x, this.camera.position.z - S.pos.z);
      let diff = want - S.facing;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      S.facing += diff * Math.min(1, dt * (moving ? 10 : 3));
      this.simFace.rotation.y = S.facing;

      // Walk cycle on a rigid model: a bounce per footfall, hips rocking side to side,
      // a slight forward lean and a soft squash on landing. Idle: slow breathing.
      const g = this.simGait, w = this.reducedMotion ? 0 : S.walk, ph = S.step;
      const stepUp = Math.abs(Math.sin(ph));
      g.position.y = stepUp * 0.13 * w;
      g.rotation.z = Math.sin(ph) * 0.07 * w;
      g.rotation.x = (0.09 + 0.08 * (S.run || 0)) * w + Math.cos(ph * 2) * 0.015 * w; // leans in more when jogging
      g.rotation.y = Math.sin(ph) * 0.1 * w;
      const breathe = this.reducedMotion ? 0 : Math.sin(time * 1.7) * 0.008 * (1 - w);
      const squash = (1 - stepUp) * 0.035 * w;
      g.scale.set(1 + squash * 0.5, 1 - squash + breathe, 1 + squash * 0.5);
      this.simBlob.scale.setScalar(1 - stepUp * 0.15 * w);
      if (S.dance > 0) {
        // the little dance: a full spin with three hops and a sway
        S.dance = Math.max(0, S.dance - dt);
        const k = 1 - S.dance / 1.8;
        g.rotation.y = this.reducedMotion ? 0 : k * Math.PI * 2;
        g.position.y = this.reducedMotion ? 0 : Math.abs(Math.sin(k * Math.PI * 3)) * 0.35;
        g.rotation.z = this.reducedMotion ? 0 : Math.sin(k * Math.PI * 6) * 0.08;
      }
      if (kw && !this.reducedMotion) {
        // Flying: she leans back against the line, harder and with a yank on each pull, and sways
        // into the turns; giving line, she steps forward a touch
        const F = this.kites.fly;
        const yank = F.tug * (0.5 + 0.5 * Math.sin(time * 11));
        g.rotation.x = -0.05 - 0.1 * yank + (S.keys.has('d') ? 0.06 : 0) + Math.sin(time * 1.3) * 0.015;
        g.rotation.z = -F.steer * 0.08 + Math.sin(time * 0.9) * 0.02;
        g.rotation.y = F.steer * 0.12;
        g.position.y = yank * 0.04;
      }
    }

    if (this.tapMark.material.opacity > 0 && !S.target) this.tapMark.material.opacity = Math.max(0, this.tapMark.material.opacity - dt * 2);

    // Doors: which one is the Sim standing at?
    let near = null;
    for (const l of this.lots) {
      const d = l.door.distanceTo(S.pos);
      if (d < 2.2) near = l.id;
      if (l.star) {
        const { gem, beam, seed } = l.star.userData;
        gem.rotation.y = this.reducedMotion ? 0.4 : time * 0.8 + seed;
        gem.position.y = this.reducedMotion ? 0 : Math.sin(time * 1.4 + seed) * 0.15;
        l.star.scale.setScalar(1 + this.view * 1.2);
        beam.material.opacity = 0.1 * (1 - this.view * 0.6);
      }
      const on = l.id === near || l.id === this.hovered || l.id === this.highlighted || l.featured;
      const target = on ? 1 : 0.32;
      l.marker.material.opacity += (target - l.marker.material.opacity) * Math.min(1, dt * 8);
      const pulse = on && !this.reducedMotion ? 1 + Math.sin(time * 4) * 0.08 : 1;
      l.marker.scale.setScalar(pulse * (1 + this.view * 1.6));
    }
    if (near !== S.near) { S.near = near; this.emit('near', near); }

    // The Rangeen house: its song swells as she walks up (0 far → 1 at the door), the camera turns to
    // face its front as she arrives, and standing on its path offers "Go inside"
    if (this.rangeen && !this.mapOnly) {
      const R = this.rangeen, d = R.door.distanceTo(S.pos);
      const street = clamp01(1 - this.view * 2.5); // fades out as the camera rises to the map
      const song = kite ? 1 : clamp01((24 - d) / 18) * street;
      if (Math.abs(song - (R.song ?? -1)) > 0.015 || (song === 0 && R.song !== 0)) { R.song = song; this.emit('rangeen', song); }
      const turn = kite ? 0 : ease(clamp01((15 - d) / 9)) * street;
      this.autoTurn = (this.autoTurn || 0) + (turn - (this.autoTurn || 0)) * Math.min(1, dt * 2.5);
      const atDoor = d < 2.6 && street > 0.5 && !kite;
      if (atDoor !== !!R.atDoor) { R.atDoor = atDoor; this.emit('rangeenDoor', atDoor); }
    }

    // Map marker grows as the camera rises
    this.mapBob.visible = this.view > 0.15;
    this.mapBob.scale.setScalar(Math.max(0.01, (this.view - 0.15) / 0.85));
    this.mapBob.userData.tick(this.reducedMotion ? 0 : time);

    if (this.prologue && this.prologue.stage !== 'done') this.tickPrologue(performance.now(), time, dt);

    // On the roof by day the sky eases to the pastel mint of the Rangeen video's painted backdrop
    if (this.skyBase) {
      const want = kite ? this.skyBase.day : 0;
      const k = (this.roofSkyK || 0) + (want - (this.roofSkyK || 0)) * Math.min(1, dt * 1.5);
      this.roofSkyK = Math.abs(k - want) < 0.002 ? want : k;
      if (this.roofSkyK !== this.roofSky) {
        this.roofSky = this.roofSkyK;
        this.skyUniforms.top.value.copy(this.skyBase.top).lerp(ROOF_SKY_TOP, this.roofSky * 0.9);
        this.skyUniforms.bottom.value.copy(this.skyBase.bottom).lerp(ROOF_SKY_BOTTOM, this.roofSky * 0.9);
      }
    }

    // On the roof the lens widens so she and her kite fit in one shot
    const fov = this.baseFov + (kite ? 18 : 0);
    if (Math.abs(this.camera.fov - fov) > 0.05) { this.camera.fov += (fov - this.camera.fov) * Math.min(1, dt * 4); this.camera.updateProjectionMatrix(); }

    // Camera eases toward where the view wants it
    const { pos, look } = this.cameraFor(this.view);
    const k = this.reducedMotion ? 1 : 1 - Math.exp(-dt * 5);
    this.camPos.lerp(pos, k); this.camLook.lerp(look, k);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    this.sun.target.position.set(0, 0, 0);
    // Push the haze back as the camera climbs, so the map stays crisp
    // (the prologue starts in a close mist that only she stands clear of)
    if (this.scene.fog) {
      const f = this.fogK;
      this.scene.fog.near = (90 + this.view * 220) * (1 - f) + 9 * f;
      this.scene.fog.far = (420 + this.view * 520) * (1 - f) + 26 * f;
    }

    this.fountain.tick(time, dt, this.reducedMotion);
    this.outskirts.tick(dt, time, this.view, S.pos, this.zoom);
    this.tickFrogs(time, dt);

    if (this.simBob) {
      this.simBob.userData.tick(this.reducedMotion ? 0 : time);
    } else if (this.cutout && this.cutout.parent && this.cutout.userData?.tick) {
      this.cutout.userData.tick(this.reducedMotion ? 0 : time, this.camera);
      if (this.cutout.children[0]) {
        this.cutout.children[0].rotation.y = Math.atan2(this.camera.position.x - S.pos.x, this.camera.position.z - S.pos.z);
      }
    }

    this.renderer.render(this.scene, this.camera);
    if (this.introPending && --this.introPending === 0) this.startIntro();
    this.emit('frame');
  };

  dispose() {
    clearTimeout(this.introTimer);
    cancelAnimationFrame(this.raf);
    removeEventListener('resize', this.resize);
    const el = this.renderer.domElement;
    el.removeEventListener('pointermove', this.onMove);
    el.removeEventListener('click', this.onClick);
    el.removeEventListener('pointerdown', this.onDown);
    el.removeEventListener('pointerup', this.onUp);
    el.removeEventListener('pointercancel', this.onUp);
    el.removeEventListener('wheel', this.onWheel);
    el.removeEventListener('dblclick', this.onDbl);
    this.renderer.dispose();
    el.remove();
    this.listeners.clear();
  }
}
