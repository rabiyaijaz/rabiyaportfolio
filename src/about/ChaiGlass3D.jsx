import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// A cutting-chai glass, modelled here from scratch (after the classic faceted Indian tea glass):
// a tapered tumbler with flat facets, a thick base and a smooth rim. `fill` (0..1) pours real
// chai into it from the bottom, topped with a thin layer of froth. Units are roughly centimetres.
const H = 8.4; // height
const R_BASE = 2.5, R_TOP = 3.25, WALL = 0.16, BASE = 0.55;
const FACETS = 14;
const radiusAt = (y) => R_BASE + (R_TOP - R_BASE) * (y / H); // outer radius at height y

function glassGeometry() {
  // One closed profile, outside up then inside down, so the wall has real thickness
  const pts = [
    [0, 0], [R_BASE - 0.15, 0], [R_BASE, 0.15], [radiusAt(H - 0.2), H - 0.2], [R_TOP - 0.02, H], [R_TOP - WALL, H],
    [radiusAt(BASE + 0.2) - WALL, BASE + 0.2], [radiusAt(BASE) - WALL - 0.18, BASE], [0, BASE],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, FACETS);
}

function chaiGeometry(level) {
  // The liquid follows the inside of the glass up to the fill level
  const top = BASE + 0.02 + (H - BASE - 0.5) * level;
  const inner = (y) => radiusAt(y) - WALL - 0.04;
  const pts = [[0, BASE + 0.02], [inner(BASE + 0.2) - 0.12, BASE + 0.02], [inner(BASE + 0.2), BASE + 0.2], [inner(top), top], [0, top]];
  return { geo: new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 40), top, r: inner(top) };
}

export default function ChaiGlass3D({ fill = 0, onReady }) {
  const ref = useRef(null);
  const fillRef = useRef(fill);
  fillRef.current = fill;
  const [ok, setOk] = useState(true);

  useEffect(() => {
    const canvas = ref.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch { setOk(false); return undefined; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
    camera.position.set(0, 9.5, 21);
    camera.lookAt(0, 3.9, 0);

    const group = new THREE.Group();
    scene.add(group);
    // Glass: clear, slightly green-tinted like real cutting-chai glass, faceted
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xdff0e6, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.22, clearcoat: 1, clearcoatRoughness: 0.03,
      envMapIntensity: 1.8, flatShading: true, side: THREE.DoubleSide, depthWrite: false,
    });
    const glass = new THREE.Mesh(glassGeometry(), glassMat);
    glass.renderOrder = 2;
    group.add(glass);
    // A bright rim and base catch the light the way thick glass does
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R_TOP - WALL / 2, WALL / 2, 8, 48), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.7, envMapIntensity: 2 }));
    rim.rotation.x = Math.PI / 2; rim.position.y = H; rim.renderOrder = 3;
    group.add(rim);

    // Doodh patti chai and its froth
    const chaiMat = new THREE.MeshStandardMaterial({ color: 0x7e4219, roughness: 0.3, envMapIntensity: 0.7 });
    const frothMat = new THREE.MeshStandardMaterial({ color: 0xd9a86e, roughness: 0.75, envMapIntensity: 0.6 });
    const chai = new THREE.Mesh(undefined, chaiMat);
    const froth = new THREE.Mesh(new THREE.CircleGeometry(1, 40), frothMat);
    froth.rotation.x = -Math.PI / 2;
    group.add(chai, froth);
    let level = -1;
    const setLevel = (k) => {
      if (Math.abs(k - level) < 0.004) return;
      level = k;
      chai.geometry?.dispose();
      const c = chaiGeometry(Math.max(0.001, k));
      chai.geometry = c.geo; chai.visible = froth.visible = k > 0.01;
      froth.position.y = c.top + 0.01; froth.scale.setScalar(c.r * 0.98);
    };

    // A soft shadow on the counter
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(3.3, 40), new THREE.MeshBasicMaterial({ color: 0x2a160a, transparent: true, opacity: 0.28, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.02; shadow.scale.set(1.25, 1, 0.6);
    scene.add(shadow);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

    // Only animate while the card is on screen; turn slowly to show off the facets
    let visible = false, raf = 0, last = performance.now();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!reduce) group.rotation.y += dt * 0.35;
      setLevel(fillRef.current);
      renderer.render(scene, camera);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) { last = performance.now(); raf = requestAnimationFrame(loop); }
    });
    io.observe(canvas);
    setLevel(fillRef.current); renderer.render(scene, camera);
    onReady?.();

    return () => {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
      scene.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((m) => m.dispose()); });
      pmrem.dispose(); renderer.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return ok ? <canvas ref={ref} className="chai__glass3d" aria-hidden="true" /> : null;
}
