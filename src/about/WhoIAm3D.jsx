import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { progressOf, seg, useScrollFrame } from '../lib/scroll.js';
import StoryHeader from '../ui/StoryHeader.jsx';

// "Who I am" as a scroll-driven 3D scene: the white sculpt of Rabiya (public/models/rabiya-white.glb,
// simplified from assets-raw/whiterabiya-v1.glb). Scrolling flies the camera around her in four shots,
// and the text arrives in four beats, always on the side of the frame she isn't in.
const MODEL = '/models/rabiya-white.glb';
const MODEL_YAW = -Math.PI / 2; // the sculpt is modelled facing +x; turn it to face the camera at az = 0

// Camera shots: az = orbit angle (rad), el = height angle, dist, look = target height,
// shift = where she sits in the frame (+ right, − left, as a share of the half-width)
const SHOTS = [
  { at: 0.0, az: 0.25, el: 0.04, dist: 1.25, look: 0.34, shift: 0.42 },
  { at: 0.33, az: -0.95, el: 0.14, dist: 1.7, look: 0.2, shift: -0.42 },
  { at: 0.64, az: 1.0, el: -0.08, dist: 1.85, look: 0.1, shift: 0.42 },
  { at: 0.92, az: -0.3, el: 0.06, dist: 2.7, look: 0.02, shift: 0.4 },
];
const ease = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, k) => a + (b - a) * k;
function shotAt(p) {
  let i = 0;
  while (i < SHOTS.length - 2 && p > SHOTS[i + 1].at) i++;
  const a = SHOTS[i], b = SHOTS[i + 1];
  const k = ease(seg(p, a.at, b.at));
  return Object.fromEntries(['az', 'el', 'dist', 'look', 'shift'].map((key) => [key, lerp(a[key], b[key], k)]));
}

// Text beats: [from, to] in scroll progress; side is where the text sits (opposite her)
const BEATS = [
  { range: [0, 0.27], side: 'left' },
  { range: [0.27, 0.56], side: 'right' },
  { range: [0.56, 0.82], side: 'left' },
  { range: [0.82, 1.01], side: 'left' },
];

export default function WhoIAm3D({ facts }) {
  const runRef = useRef(null);
  const hostRef = useRef(null);
  const beatRefs = useRef([]);
  const hintRef = useRef(null);
  const api = useRef(null);
  const [loaded, setLoaded] = useState(false);

  // ---------------------------------------------------------------- the scene
  useEffect(() => {
    const host = hostRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0, 0);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;
    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 50);

    // Clay-white lighting: warm key, cool fill, plumbob-green rim
    const hemi = new THREE.HemisphereLight(0xfff4ea, 0x2a2140, 0.9);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfff1e2, 2.2); key.position.set(-1.2, 2, 2.2); scene.add(key);
    const rim = new THREE.DirectionalLight(0x6fe39a, 2.6); rim.position.set(1.4, 1.2, -2); scene.add(rim);
    const rim2 = new THREE.DirectionalLight(0xffb27a, 1.1); rim2.position.set(-1.6, 0.4, -1.6); scene.add(rim2);

    // A soft shadow and a faint ring where she stands
    const shadowTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 4, 64, 64, 64);
      r.addColorStop(0, 'rgba(10,6,20,0.55)'); r.addColorStop(1, 'rgba(10,6,20,0)');
      g.fillStyle = r; g.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    })();
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.489;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.345, 96), new THREE.MeshBasicMaterial({ color: 0x6fe39a, transparent: true, opacity: 0.45, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = -0.487;
    scene.add(shadow, ring);

    // Parallax: plumbob shards and dust at many depths around her
    const shards = new THREE.Group();
    const shardGeo = new THREE.OctahedronGeometry(1, 0); shardGeo.scale(0.6, 1, 0.6);
    const shardMat = new THREE.MeshStandardMaterial({ color: 0x5fe08a, emissive: 0x1d7a3d, emissiveIntensity: 0.6, roughness: 0.35, transparent: true, opacity: 0.85 });
    const rand = (a, b) => a + Math.random() * (b - a);
    for (let i = 0; i < 26; i++) {
      const m = new THREE.Mesh(shardGeo, shardMat);
      const a = rand(0, Math.PI * 2), r = rand(0.55, 2.4);
      m.position.set(Math.cos(a) * r, rand(-0.45, 1.0), Math.sin(a) * r);
      m.scale.setScalar(rand(0.012, 0.03));
      m.userData = { spin: rand(0.3, 1.2), bob: rand(0, 6) };
      shards.add(m);
    }
    const dustGeo = new THREE.BufferGeometry();
    const dust = new Float32Array(240 * 3);
    for (let i = 0; i < 240; i++) { const a = rand(0, Math.PI * 2), r = rand(0.4, 3.2); dust.set([Math.cos(a) * r, rand(-0.5, 1.4), Math.sin(a) * r], i * 3); }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dust, 3));
    const dustPts = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xfff1e2, size: 0.008, transparent: true, opacity: 0.7, depthWrite: false }));
    scene.add(shards, dustPts);

    // The sculpt
    const figure = new THREE.Group();
    scene.add(figure);
    const clay = new THREE.MeshStandardMaterial({ color: 0xf3eee8, roughness: 0.62, metalness: 0 });
    const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
    let alive = true;
    loader.load(MODEL, (gltf) => {
      if (!alive) return;
      const m = gltf.scene;
      m.traverse((o) => { if (o.isMesh) { o.material = clay; } });
      m.rotation.y = MODEL_YAW;
      figure.add(m);
      setLoaded(true);
    });

    // Sizing
    const resize = () => {
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize); ro.observe(host); resize();

    // Camera follows scroll (target) with a little easing, plus a gentle lean toward the pointer
    const cur = { ...shotAt(0) }, want = { ...cur };
    const pointer = { x: 0, y: 0, cx: 0, cy: 0 };
    const onPointer = (e) => { pointer.x = e.clientX / innerWidth - 0.5; pointer.y = e.clientY / innerHeight - 0.5; };
    addEventListener('pointermove', onPointer, { passive: true });
    const target = new THREE.Vector3(), right = new THREE.Vector3();
    let raf = 0, visible = true, last = performance.now();
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const k = 1 - Math.exp(-dt * 6);
      for (const key of Object.keys(cur)) cur[key] += (want[key] - cur[key]) * k;
      pointer.cx += (pointer.x - pointer.cx) * k; pointer.cy += (pointer.y - pointer.cy) * k;
      const az = cur.az + pointer.cx * 0.25, el = cur.el - pointer.cy * 0.1;
      const portrait = camera.aspect < 0.9;
      const dist = cur.dist * (portrait ? 1.55 : 1); // phones: step back so she fits the tall frame
      target.set(0, cur.look, 0);
      camera.position.set(Math.sin(az) * Math.cos(el) * dist, cur.look + Math.sin(el) * dist, Math.cos(az) * Math.cos(el) * dist);
      camera.lookAt(target);
      // Slide the frame sideways so she sits left or right of the text (narrow screens: centred)
      const half = Math.tan((camera.fov * Math.PI) / 360) * dist * camera.aspect;
      const shift = cur.shift * (portrait ? 0.15 : 1);
      right.setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(-shift * half);
      camera.position.add(right); target.add(right);
      // Phones: lift her into the top half of the frame, above the text panel
      if (portrait) {
        const halfH = Math.tan((camera.fov * Math.PI) / 360) * dist;
        right.setFromMatrixColumn(camera.matrixWorld, 1).multiplyScalar(-0.22 * halfH);
        camera.position.add(right); target.add(right);
      }
      camera.lookAt(target);
      // On the light Day theme a white sculpt needs moodier light to keep its shape
      const day = document.documentElement.dataset.phase === 'day';
      hemi.intensity = day ? 0.35 : 0.9;
      scene.environmentIntensity = day ? 0.3 : 0.55;
      clay.color.setHex(day ? 0xe4dbd0 : 0xf3eee8);
      const t = now / 1000;
      shards.children.forEach((s) => { s.rotation.y += dt * s.userData.spin; s.position.y += Math.sin(t + s.userData.bob) * dt * 0.02; });
      shards.rotation.y = t * 0.03; dustPts.rotation.y = -t * 0.015;
      ring.material.opacity = 0.3 + Math.sin(t * 1.6) * 0.15;
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; last = performance.now(); });
    io.observe(host);

    api.current = { setProgress: (p) => Object.assign(want, shotAt(p)) };
    return () => {
      alive = false; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); removeEventListener('pointermove', onPointer);
      scene.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((mm) => { mm.map?.dispose(); mm.dispose(); }); });
      pmrem.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);

  // ---------------------------------------------------------------- scroll: camera and text beats
  useScrollFrame(() => {
    const p = progressOf(runRef.current);
    api.current?.setProgress(p);
    if (hintRef.current) hintRef.current.style.opacity = String(1 - seg(p, 0.02, 0.08));
    BEATS.forEach((b, i) => {
      const el = beatRefs.current[i];
      if (!el) return;
      const [a, z] = b.range;
      const local = seg(p, a, z);
      const fadeIn = i === 0 ? 1 : seg(local, 0, 0.22);
      const fadeOut = i === BEATS.length - 1 ? 1 : 1 - seg(local, 0.8, 1);
      const o = Math.min(fadeIn, fadeOut);
      el.style.opacity = String(o);
      // Parallax: each beat drifts up at its own pace while it's on screen
      el.style.transform = `translate3d(0, ${(0.5 - local) * 70}px, 0)`;
      el.style.visibility = o < 0.01 ? 'hidden' : '';
      el.style.filter = o < 1 ? `blur(${(1 - o) * 6}px)` : '';
    });
  });

  const beat = (i, children) => (
    <div className={`who3d__beat who3d__beat--${BEATS[i].side}`} ref={(el) => { beatRefs.current[i] = el; }}>{children}</div>
  );

  return (
    <section className={`who3d${loaded ? ' is-loaded' : ''}`} aria-labelledby="intro-title">
      <div className="who3d__run" ref={runRef}>
        <div className="who3d__stage">
          <div className="who3d__glow" aria-hidden="true" />
          <div className="who3d__scene" ref={hostRef} aria-hidden="true" />
          {beat(0, <StoryHeader label="Who I am" id="intro-title" title={<>I design products <em>around the people who live with them.</em></>} />)}
          {beat(1, <p className="who3d__lead">I’m Rabiya, a product designer in Peshawar. Over 4+ years across recruitment, finance, healthcare and AI, I’ve done the same thing: made complicated systems feel human.</p>)}
          {beat(2, <p className="who3d__lead"><strong>What I do:</strong> take products from research to shipped UI. Interviews and synthesis, service blueprints and flows, design systems, and prototypes built with AI tools.</p>)}
          {beat(3, (
            <>
              <p className="who3d__lead"><strong>What I’m looking forward to:</strong> more AI products people can trust. Systems that explain themselves, keep people in control and work for everyone, including people with disabilities.</p>
              <ul className="about-intro__facts">{facts.map((f) => <li key={f}>{f}</li>)}</ul>
            </>
          ))}
          <p className="who3d__scroll" aria-hidden="true" ref={hintRef}>Scroll to walk around her ↓</p>
        </div>
      </div>
    </section>
  );
}
