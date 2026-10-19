// The landing scene (Direction v3): one quiet street, low camera, big sky.
// Mood follows the visitor's clock (day / dusk / night). Two interactions:
// calling a carpool, and clicking the Sim.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createTaxi, createBuilding, createForest, createPlumbob, createSimCutout, createStreetLamp, bakeStatic, canvasTexture, mat, seeded } from './assets.js';

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x) => 1 - Math.pow(1 - x, 3);

export function phaseForHour(h) {
  if (h >= 7 && h < 17) return 'day';
  if ((h >= 17 && h < 20) || (h >= 5 && h < 7)) return 'dusk';
  return 'night';
}

const PALETTES = {
  day: { skyTop: 0x7fb4e6, skyBottom: 0xeaf1ef, fog: 0xdfe9ea, ground: 0x86ad62, hemiSky: 0xe6f1ff, hemiGround: 0x7a8f55, hemi: 1.15, sun: 0xfff3dd, sunI: 2.2, sunPos: [-30, 45, 20], window: 0.05, lamps: 0, stars: 0, flies: 0, exposure: 1.0 },
  dusk: { skyTop: 0x2c2f6e, skyBottom: 0xf0a477, fog: 0xb98a86, ground: 0x4c6342, hemiSky: 0xffc9a8, hemiGround: 0x2f3b3a, hemi: 0.75, sun: 0xffa463, sunI: 1.6, sunPos: [-60, 8, -40], window: 0.9, lamps: 1, stars: 0.35, flies: 0.5, exposure: 1.0 },
  night: { skyTop: 0x050821, skyBottom: 0x1b2352, fog: 0x0d1333, ground: 0x18261f, hemiSky: 0x5a6db8, hemiGround: 0x0b1210, hemi: 0.45, sun: 0x9fb4ff, sunI: 0.55, sunPos: [35, 40, -20], window: 1.4, lamps: 1, stars: 1, flies: 1, exposure: 1.1 },
};

const SIM_SPOT = new THREE.Vector3(1.8, 0, 4.5);
const CAR_Z = 1.75; // near lane; the taxi drives +x so its kerb side faces the camera

export class StreetScene {
  constructor(container, { simUrl, modelUrl, phase, reducedMotion = false }) {
    this.container = container;
    this.reducedMotion = reducedMotion;
    this.listeners = new Map();
    const small = innerWidth < 768;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.25 : 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 1200);
    this.camTarget = new THREE.Vector3(0, 3.2, 0);

    this.hemi = new THREE.HemisphereLight();
    this.sun = new THREE.DirectionalLight();
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.setScalar(2048);
    Object.assign(this.sun.shadow.camera, { left: -30, right: 30, top: 20, bottom: -20, near: 1, far: 200 });
    this.sun.shadow.bias = -0.0005;
    this.scene.add(this.hemi, this.sun);

    this.build(simUrl, modelUrl);
    this.setPhase(phase);

    this.state = { mode: 'idle', t: 0, onDone: null };
    this.clock = new THREE.Clock();
    this.resize = this.resize.bind(this);
    addEventListener('resize', this.resize);
    this.resize();
    this.bindPointer();
    this.raf = requestAnimationFrame(this.frame);
  }

  on(evt, fn) {
    if (!this.listeners.has(evt)) this.listeners.set(evt, new Set());
    this.listeners.get(evt).add(fn);
    return () => this.listeners.get(evt)?.delete(fn);
  }
  emit(evt, d) { this.listeners.get(evt)?.forEach((fn) => fn(d)); }

  // ---------------------------------------------------------------- build
  build(simUrl, modelUrl) {
    const { scene } = this;
    const rand = seeded(11);

    // Sky dome with a vertical gradient
    this.skyUniforms = { top: { value: new THREE.Color() }, bottom: { value: new THREE.Color() } };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: this.skyUniforms,
      vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying float h; void main(){ float k = smoothstep(-0.05, 0.55, h); gl_FragColor = vec4(mix(bottom, top, k), 1.); }',
    }));
    scene.add(sky);

    // Stars
    const starPos = [];
    for (let i = 0; i < 900; i++) {
      const u = rand(), v = 0.08 + rand() * 0.9;
      const th = u * Math.PI * 2, ph = Math.acos(v);
      starPos.push(Math.sin(ph) * Math.cos(th) * 500, Math.cos(ph) * 500, Math.sin(ph) * Math.sin(th) * 500);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    this.starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, depthWrite: false, fog: false });
    scene.add(new THREE.Points(starGeo, this.starMat));

    // Moon / sun disc
    const discTex = canvasTexture(256, 256, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,255,255,1)');
      g.addColorStop(0.22, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    });
    this.disc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex, transparent: true, depthWrite: false, fog: false }));
    scene.add(this.disc);

    // Ground and far hills
    this.groundMat = new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true });
    const groundGeo = new THREE.PlaneGeometry(600, 400, 60, 40);
    groundGeo.rotateX(-Math.PI / 2);
    const gp = groundGeo.attributes.position;
    for (let i = 0; i < gp.count; i++) {
      const z = gp.getZ(i);
      if (z < -30) gp.setY(i, (rand() - 0.3) * Math.min(6, (-z - 30) * 0.08));
    }
    groundGeo.computeVertexNormals();
    const ground = new THREE.Mesh(groundGeo, this.groundMat);
    ground.receiveShadow = true;
    scene.add(ground);

    this.hillMat = new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true });
    for (let i = 0; i < 7; i++) {
      const hill = new THREE.Mesh(new THREE.ConeGeometry(40 + rand() * 50, 18 + rand() * 30, 5), this.hillMat);
      hill.position.set(-260 + i * 85 + rand() * 30, -2, -230 - rand() * 60);
      hill.rotation.y = rand() * 3;
      scene.add(hill);
    }

    // Street: road, kerbs, sidewalks, dashed line (static, baked)
    const root = new THREE.Group();
    const add = (w, h, d, color, x, y, z, opts) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, { roughness: 0.95, ...opts }));
      m.position.set(x, y, z); root.add(m);
    };
    add(260, 0.06, 7, 0x3b3f44, 0, 0.03, 0);
    add(260, 0.16, 0.3, 0x9c9a94, 0, 0.08, 3.65);
    add(260, 0.16, 0.3, 0x9c9a94, 0, 0.08, -3.65);
    add(260, 0.1, 3, 0xb9b5ab, 0, 0.05, 5.3);
    add(260, 0.1, 3, 0xb9b5ab, 0, 0.05, -5.3);
    for (let x = -130; x < 130; x += 4) add(1.6, 0.02, 0.16, 0xe9e4d4, x, 0.07, 0);

    // A short row of homes across the street
    // Homes sit to the right; the left stays open meadow so the type has sky behind it
    const homes = [
      { x: 2, w: 7, storeys: 2, wall: 0xe9e2d2, roof: 0x7d4a3c },
      { x: 14, w: 6.5, storeys: 1, wall: 0xdfe4e6, roof: 0x45566e },
      { x: 26, w: 7.5, storeys: 2, wall: 0xf0e3d3, roof: 0x8e5a44 },
      { x: 38, w: 6, storeys: 1, wall: 0xe5e1d6, roof: 0x4f5b4a },
    ];
    for (const h of homes) {
      const b = createBuilding({ ...h, d: 6, pathLen: 13.4, rand });
      b.position.set(h.x, 0, -23);
      root.add(b);
    }

    // Street lamps (near side) with soft glow sprites
    const glowTex = canvasTexture(128, 128, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,214,150,.9)'); g.addColorStop(0.3, 'rgba(255,190,120,.35)'); g.addColorStop(1, 'rgba(255,190,120,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    });
    this.glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    for (const x of [-30, 9, 40]) {
      const lamp = createStreetLamp();
      lamp.position.set(x, 0, 6.6);
      lamp.rotation.y = Math.PI / 2;
      root.add(lamp);
      const glow = new THREE.Sprite(this.glowMat);
      glow.scale.setScalar(4.5);
      glow.position.set(x, 3.2, 6.0);
      scene.add(glow);
    }
    this.lampLight = new THREE.PointLight(0xffc98a, 0, 14, 1.6);
    this.lampLight.position.set(9, 3.1, 6.2);
    scene.add(this.lampLight);

    scene.add(bakeStatic(root));
    // Shared window material (memoised in assets.js): we drive its glow per phase
    this.windowMat = mat(0x9cc7e6, { roughness: 0.15, metalness: 0.2, emissive: 0x23384d, emissiveIntensity: 0.25 });

    // Trees behind the homes and along the edges
    const spots = [];
    while (spots.length < 70) {
      const x = (rand() - 0.5) * 160, z = -28 - rand() * 60;
      spots.push({ x, z, scale: 0.9 + rand() * 0.9, pine: rand() < 0.45 });
    }
    // A few between the homes, and a lone tree in the meadow on the left
    for (const x of [8, 20, 32, 44]) spots.push({ x, z: -25 + rand() * 3, scale: 1 + rand() * 0.4, pine: rand() < 0.5 });
    spots.push({ x: -22, z: -14, scale: 1.5, pine: false }, { x: -17, z: -20, scale: 1.1, pine: true });
    scene.add(createForest(spots, rand));

    // Fireflies
    const flyPos = new Float32Array(60 * 3);
    this.flySeeds = [];
    for (let i = 0; i < 60; i++) {
      flyPos[i * 3] = (rand() - 0.5) * 40; flyPos[i * 3 + 1] = 0.4 + rand() * 2.5; flyPos[i * 3 + 2] = 4 + rand() * 6;
      this.flySeeds.push(rand() * 10);
    }
    const flyGeo = new THREE.BufferGeometry();
    flyGeo.setAttribute('position', new THREE.BufferAttribute(flyPos, 3));
    this.flyBase = flyPos.slice();
    this.flyMat = new THREE.PointsMaterial({ color: 0xffe08a, size: 5, sizeAttenuation: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, map: glowTex });
    this.flies = new THREE.Points(flyGeo, this.flyMat);
    scene.add(this.flies);

    // Taxi (parked off-screen until called)
    this.taxi = createTaxi();
    this.taxi.position.set(-60, 0.05, CAR_Z);
    this.taxi.rotation.y = Math.PI / 2; // face +x
    this.taxi.visible = false;
    scene.add(this.taxi);

    // The Sim: the 3D model if one exists, otherwise the render cutout
    this.simGroup = new THREE.Group();
    this.simGroup.position.copy(SIM_SPOT);
    scene.add(this.simGroup);
    this.useCutout(simUrl);
    if (modelUrl) this.tryModel(modelUrl);
  }

  useCutout(url) {
    this.cutout = createSimCutout(url, { height: 1.75 });
    this.simGroup.add(this.cutout);
    this.simHit = this.cutout.children[0];
  }

  /** Swap in rabiya.glb (idle / walk / wave clips) when it exists. */
  async tryModel(url) {
    try {
      const head = await fetch(url, { method: 'HEAD' });
      if (!head.ok || !(head.headers.get('content-type') || '').includes('model')) return;
      const gltf = await new GLTFLoader().loadAsync(url);
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      model.scale.setScalar(1.75 / (box.max.y - box.min.y));
      model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      this.simGroup.remove(this.cutout);
      const bob = createPlumbob({ size: 0.2, light: false });
      bob.userData.baseY = 2.15;
      this.simGroup.add(model, bob);
      this.modelBob = bob;
      this.simHit = model;
      this.mixer = new THREE.AnimationMixer(model);
      this.clips = Object.fromEntries(gltf.animations.map((c) => [c.name.toLowerCase(), this.mixer.clipAction(c)]));
      this.playClip('idle');
      this.model = model;
    } catch { /* keep the cutout */ }
  }

  playClip(name, { once = false } = {}) {
    const next = this.clips?.[name];
    if (!next) return;
    if (once) { next.setLoop(THREE.LoopOnce, 1); next.clampWhenFinished = true; }
    next.reset().fadeIn(0.3).play();
    if (this.currentClip && this.currentClip !== next) this.currentClip.fadeOut(0.3);
    this.currentClip = next;
  }

  // ---------------------------------------------------------------- mood
  setPhase(phase) {
    this.phase = phase;
    const P = PALETTES[phase];
    this.skyUniforms.top.value.set(P.skyTop);
    this.skyUniforms.bottom.value.set(P.skyBottom);
    this.scene.fog = new THREE.Fog(P.fog, 40, 260);
    this.groundMat.color.set(P.ground);
    this.hillMat.color.set(P.ground).lerp(new THREE.Color(P.fog), 0.55);
    this.hemi.color.set(P.hemiSky); this.hemi.groundColor.set(P.hemiGround); this.hemi.intensity = P.hemi;
    this.sun.color.set(P.sun); this.sun.intensity = P.sunI; this.sun.position.set(...P.sunPos);
    this.renderer.toneMappingExposure = P.exposure;
    this.windowMat.emissive.set(phase === 'day' ? 0x23384d : 0xffb866);
    this.windowMat.emissiveIntensity = P.window;
    this.glowMat.opacity = P.lamps;
    this.lampLight.intensity = P.lamps * 6;
    this.starMat.opacity = P.stars;
    this.flyMat.opacity = P.flies;
    const disc = this.disc.material;
    if (phase === 'night') { this.disc.position.set(120, 150, -400); this.disc.scale.setScalar(70); disc.color.set(0xe8ecff); }
    else if (phase === 'dusk') { this.disc.position.set(-160, 30, -420); this.disc.scale.setScalar(150); disc.color.set(0xffc58a); }
    else { this.disc.position.set(-150, 230, -380); this.disc.scale.setScalar(110); disc.color.set(0xfff8e8); }
    // The cutout is unlit; dim it to sit in the scene's light
    const simTint = { day: 1, dusk: 0.86, night: 0.72 }[phase];
    this.cutout?.children[0].material.color.setScalar(simTint);
    this.emit('phase', phase);
  }

  // ---------------------------------------------------------------- interactions
  /** Taxi pulls up, the Sim gets in, it drives off. Resolves at the end. */
  callCarpool() {
    if (this.state.mode === 'carpool') return this.state.promise;
    if (this.reducedMotion) return Promise.resolve();
    this.taxi.visible = true;
    this.playClip('walk');
    const promise = new Promise((resolve) => { this.state = { mode: 'carpool', t: 0, onDone: resolve }; });
    this.state.promise = promise;
    this.emit('carpool', 'start');
    return promise;
  }

  wave() {
    if (this.clips?.wave) { this.playClip('wave', { once: true }); setTimeout(() => this.playClip('idle'), 2200); }
    else this.waveT = 1; // cutout: a little hop
  }

  simScreenPosition() {
    const v = this.simGroup.position.clone().add(new THREE.Vector3(0, 1.9, 0)).project(this.camera);
    const r = this.renderer.domElement.getBoundingClientRect();
    return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
  }

  bindPointer() {
    const el = this.renderer.domElement;
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const overSim = (e) => {
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, this.camera);
      return ray.intersectObject(this.simHit, true).some((hit) => {
        const map = hit.object.material?.map;
        if (!map?.image || !hit.uv) return true;
        // Ignore clicks on transparent pixels of the cutout
        const c = this._alphaCanvas ||= (() => { const cv = document.createElement('canvas'); cv.width = map.image.width; cv.height = map.image.height; cv.getContext('2d').drawImage(map.image, 0, 0); return cv; })();
        const a = c.getContext('2d').getImageData(hit.uv.x * c.width, (1 - hit.uv.y) * c.height, 1, 1).data[3];
        return a > 40;
      });
    };
    this.onMove = (e) => {
      if (this.state.mode !== 'idle') return;
      const hot = overSim(e);
      if (hot !== this.simHot) { this.simHot = hot; el.style.cursor = hot ? 'pointer' : ''; }
    };
    this.onClick = (e) => {
      if (this.state.mode !== 'idle') return;
      if (overSim(e)) this.emit('simclick', this.simScreenPosition());
      else this.emit('emptyclick');
    };
    el.addEventListener('pointermove', this.onMove);
    el.addEventListener('click', this.onClick);
  }

  resize() {
    const w = this.container.clientWidth || innerWidth, h = this.container.clientHeight || innerHeight;
    this.camera.aspect = w / h;
    // Portrait screens step back and centre the Sim
    const portrait = this.camera.aspect < 0.9;
    // Low camera, horizon in the lower third, big sky for the type (like the reference)
    this.camBase = portrait ? new THREE.Vector3(SIM_SPOT.x - 0.5, 2.2, 26) : new THREE.Vector3(0, 1.9, 19);
    this.camTarget.set(portrait ? SIM_SPOT.x - 0.5 : 0, portrait ? 8 : 7.4, -12);
    this.camera.fov = portrait ? 44 : 38;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  // ---------------------------------------------------------------- loop
  frame = () => {
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const time = this.clock.elapsedTime;

    // Camera: gentle breathing drift + pointer parallax-free calm
    const cam = this.camBase.clone();
    if (!this.reducedMotion) { cam.x += Math.sin(time * 0.12) * 0.35; cam.y += Math.sin(time * 0.17) * 0.08; }

    if (this.state.mode === 'carpool') {
      const S = this.state;
      S.t += dt;
      const t = S.t;
      // 0–1.8s drive in, 1.8–2.2 door open, 2.0–2.8 Sim walks + fades, 2.8–3.1 close, 3.1–4.6 drive off
      const stopX = SIM_SPOT.x + 0.9;
      let x;
      if (t < 1.8) x = THREE.MathUtils.lerp(-34, stopX, easeOut(t / 1.8));
      else if (t < 3.1) x = stopX;
      else x = stopX + 40 * Math.pow(seg(t, 3.1, 4.6), 2);
      this.taxi.userData.spin(x);
      this.taxi.position.x = x;
      this.taxi.userData.setDoor(seg(t, 1.8, 2.15) - seg(t, 2.8, 3.1));
      const walk = easeInOut(seg(t, 2.0, 2.7));
      this.simGroup.position.lerpVectors(SIM_SPOT, new THREE.Vector3(stopX - 0.9, 0, CAR_Z + 1.4), walk);
      const fade = 1 - seg(t, 2.45, 2.8);
      if (this.cutout) this.cutout.userData.setOpacity(fade);
      if (this.model) this.simGroup.visible = fade > 0.05;
      cam.x += (x - cam.x) * 0.12 * seg(t, 3.1, 4.6);
      if (t > 4.4 && S.onDone) { const done = S.onDone; S.onDone = null; this.emit('carpool', 'done'); done(); }
    }

    // Cutout "wave": a small hop
    if (this.waveT > 0) {
      this.waveT = Math.max(0, this.waveT - dt * 1.6);
      this.simGroup.position.y = Math.sin((1 - this.waveT) * Math.PI * 2) * 0.12 * this.waveT;
    }

    this.camera.position.lerp(cam, 1 - Math.exp(-dt * 3));
    this.camera.lookAt(this.camTarget);

    // Fireflies drift
    if (this.flyMat.opacity > 0) {
      const p = this.flies.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const s = this.flySeeds[i];
        p.setXYZ(i, this.flyBase[i * 3] + Math.sin(time * 0.3 + s) * 1.2, this.flyBase[i * 3 + 1] + Math.sin(time * 0.7 + s * 2) * 0.4, this.flyBase[i * 3 + 2] + Math.cos(time * 0.25 + s) * 0.8);
      }
      p.needsUpdate = true;
      this.flyMat.size = 4 + Math.sin(time * 3) * 1.2;
    }

    this.cutout?.userData.tick(time, this.camera);
    this.modelBob?.userData.tick(time);
    this.mixer?.update(dt);
    this.renderer.render(this.scene, this.camera);
    this.emit('frame');
  };

  dispose() {
    cancelAnimationFrame(this.raf);
    removeEventListener('resize', this.resize);
    const el = this.renderer.domElement;
    el.removeEventListener('pointermove', this.onMove);
    el.removeEventListener('click', this.onClick);
    this.renderer.dispose();
    el.remove();
    this.listeners.clear();
  }
}
