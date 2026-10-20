// Basant over the Rangeen house: patangs in the sky, after the rooftop kite scene in the Rangeen video.
// A few neighbours' kites always fly over the street (a hint that the roof is worth a visit). Up on the
// roof she flies her own: it is tossed from her hand and climbs, then follows the keys (or a drag):
//   ← →  steer · ↑ pull the line (it climbs) · ↓ give line (it rides out further and lower).
// Flying into another kite cuts it: "Bo kata!", and it tumbles away down the wind.
// Everything here is in the house's local frame: +Z is out of its front, toward the street.
import * as THREE from 'three';
import { canvasTexture } from './assets.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ease = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);

// Patang designs: a diamond with a tail flap (pudhi), a bamboo spine (thhadda) and an arched bow (kaanp)
const DESIGNS = {
  rangeen: { kind: 'halves', a: '#e8336f', b: '#f2c230', c: '#2fa59a', tail: '#e8336f' },
  moons: { kind: 'moons', a: '#86c6a0', b: '#df4a4f', c: '#df4a4f', tail: '#df4a4f' },     // green with red discs
  candy: { kind: 'band', a: '#f5a8c9', b: '#f6d84a', c: '#f6d84a', tail: '#f08ab4' },
  violet: { kind: 'quarters', a: '#8d3fb5', b: '#f3efe6', c: '#f2c230', tail: '#8d3fb5' },
  peach: { kind: 'halves', a: '#f0b483', b: '#d98757', c: '#fff4e6', tail: '#d98757' },
  check: { kind: 'quarters', a: '#f3efe6', b: '#2b2b33', c: '#2b2b33', tail: '#2b2b33' },
};

function kiteTexture(d) {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const T = [128, 10], R = [246, 112], B = [128, 222], L = [10, 112], C = [128, 112];
    const path = (pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };
    const poly = (pts, fill) => { path(pts); ctx.fillStyle = fill; ctx.fill(); };
    const disc = (x, y, r, fill) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); };
    poly([[128, 206], [102, 252], [154, 252]], d.c); // the tail flap
    ctx.save(); path([T, R, B, L]); ctx.clip();
    ctx.fillStyle = d.a; ctx.fillRect(0, 0, w, h);
    if (d.kind === 'halves') { ctx.fillStyle = d.b; ctx.fillRect(128, 0, 128, h); disc(128, 112, 28, d.c); }
    if (d.kind === 'moons') { disc(94, 100, 30, d.b); disc(162, 100, 30, d.b); disc(128, 166, 14, d.b); }
    if (d.kind === 'band') { ctx.fillStyle = d.b; ctx.fillRect(0, 100, w, 30); poly([T, [176, 58], [80, 58]], d.c); }
    if (d.kind === 'quarters') { poly([T, R, C], d.b); poly([B, L, C], d.b); disc(128, 112, 12, d.c); }
    ctx.restore();
    ctx.lineJoin = 'round';
    path([T, R, B, L]); ctx.strokeStyle = 'rgba(60,35,20,0.5)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(...T); ctx.lineTo(...B); ctx.stroke();                       // spine
    ctx.beginPath(); ctx.moveTo(...L); ctx.quadraticCurveTo(128, 36, ...R); ctx.stroke();   // bow
  });
}
// a little paper bow for the tail
const bowTexture = (col) => canvasTexture(64, 32, (ctx) => {
  ctx.clearRect(0, 0, 64, 32);
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(32, 16); ctx.lineTo(4, 3); ctx.lineTo(4, 29); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(32, 16); ctx.lineTo(60, 3); ctx.lineTo(60, 29); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(28, 11, 8, 10);
});
// a soft pastel cloud, pink underneath, like the painted sky in the video
const cloudTexture = () => canvasTexture(256, 128, (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  const puffs = [[60, 86, 34], [100, 66, 44], [150, 60, 50], [196, 80, 36], [128, 92, 40], [86, 96, 30], [176, 96, 30]];
  for (const [x, y, r] of puffs) {
    const g = ctx.createLinearGradient(0, y - r, 0, y + r);
    g.addColorStop(0, '#fffaf6'); g.addColorStop(0.6, '#fbe2dc'); g.addColorStop(1, '#efc3c0');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
});

const TAIL = 7;
function makeKite(parent, design, size) {
  const d = DESIGNS[design];
  const tex = kiteTexture(d);
  const body = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({
    map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.25, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.85,
  }));
  body.castShadow = true;
  const g = new THREE.Group(); g.add(body); parent.add(g);
  // the tail: bows on a thread, each point trailing the one before it
  const bowMat = new THREE.SpriteMaterial({ map: bowTexture(d.tail), transparent: true, alphaTest: 0.3, fog: false });
  const bows = [], pts = [];
  for (let i = 0; i < TAIL; i++) {
    pts.push(new THREE.Vector3());
    if (i) { const s = new THREE.Sprite(bowMat); s.scale.set(size * 0.3, size * 0.15, 1); parent.add(s); bows.push(s); }
  }
  const thread = line(parent, TAIL, 0xffffff, 0.5);
  const string = line(parent, 32, 0xfdf6e8, 0.85);
  return { g, body, bows, pts, thread, string, size, seg: size * 0.26, placed: false };
}
function line(parent, n, color, opacity) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity, fog: false }));
  l.frustumCulled = false; parent.add(l);
  return l;
}
/** The string between a flyer's hand and the kite: a sagging curve (less sag when it's pulled taut). */
function drawString(l, a, b, sag) {
  const p = l.geometry.attributes.position, n = p.count;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    p.setXYZ(i, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - sag * 4 * t * (1 - t), a.z + (b.z - a.z) * t);
  }
  p.needsUpdate = true;
}
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
/** Point the kite at its flyer, lean it back into the wind, bank it, then let the tail follow. */
function pose(k, at, toward, roll, dt, wind, time, still) {
  k.g.position.copy(at);
  k.g.lookAt(toward);
  k.g.rotateZ(roll);
  k.g.rotateX(-0.35 + (still ? 0 : Math.sin(time * 3.1 + k.size) * 0.05)); // nose up, with a nod
  k.g.updateMatrix();
  // tail: the first bead hangs from the tail flap; the rest fall and drift downwind, a fixed gap apart
  const anchor = tmp.set(0, -k.size * 0.55, 0).applyMatrix4(k.g.matrix);
  if (!k.placed) { k.pts.forEach((p, i) => p.copy(anchor).add(tmp2.set(0, -i * k.seg, i * 0.1))); k.placed = true; }
  k.pts[0].copy(anchor);
  for (let i = 1; i < TAIL; i++) {
    const p = k.pts[i];
    p.y -= 2.2 * dt; p.addScaledVector(wind, dt);
    if (!still) p.x += Math.sin(time * 4 + i * 0.9) * 0.6 * dt;
    tmp2.subVectors(p, k.pts[i - 1]).setLength(k.seg); p.copy(k.pts[i - 1]).add(tmp2);
    k.bows[i - 1].position.copy(p);
  }
  const tp = k.thread.geometry.attributes.position;
  k.pts.forEach((p, i) => tp.setXYZ(i, p.x, p.y, p.z)); tp.needsUpdate = true;
}

export function createKites({ reducedMotion = false } = {}) {
  const group = new THREE.Group();
  const still = reducedMotion;

  // Neighbours' kites over the street, each flown from a roof out of sight beyond it
  const SPOTS = [
    { d: 'moons', at: [-18, 30, 34] }, { d: 'candy', at: [14, 32, 36] }, { d: 'violet', at: [30, 24, 30] },
    { d: 'check', at: [-30, 21, 40] }, { d: 'peach', at: [4, 44, 30] },
  ];
  const others = SPOTS.map((s, i) => {
    const k = makeKite(group, s.d, 2.4);
    const base = new THREE.Vector3(...s.at);
    return { k, base, ph: i * 1.7, anchor: new THREE.Vector3(base.x * 1.4 + (base.x < 0 ? -8 : 8), 6, base.z + 34), pos: base.clone(), cut: false, t: 0, vel: new THREE.Vector3(), spin: 0 };
  });

  // Clouds: only while she's up on the roof
  const cloudMat = new THREE.SpriteMaterial({ map: cloudTexture(), transparent: true, opacity: 0, fog: false, depthWrite: false, toneMapped: false });
  const clouds = [[-70, 62, 170, 30], [40, 78, 190, 34], [95, 52, 150, 22], [-120, 44, 140, 26], [10, 42, 230, 30], [-30, 96, 160, 20]].map(([x, y, z, s]) => {
    const c = new THREE.Sprite(cloudMat); c.position.set(x, y, z); c.scale.set(s, s / 2, 1); group.add(c); return c;
  });

  // Her kite
  const mine = makeKite(group, 'rangeen', 1.9);
  mine.g.visible = mine.string.visible = mine.thread.visible = false; mine.bows.forEach((b) => (b.visible = false));
  const fly = { on: false, t: 0, az: 0, el: 0.3, len: 1, vaz: 0, vel: 0, tug: 0, steer: 0, cuts: 0 };
  const hand = new THREE.Vector3(), kitePos = new THREE.Vector3();
  const wind = new THREE.Vector3(0, 0, 2.6);
  let night = 0, show = 0, onCut = null;

  const setMine = (v) => { mine.g.visible = mine.string.visible = mine.thread.visible = v; mine.bows.forEach((b) => (b.visible = v)); };

  return {
    group, fly, hand, kitePos, others,
    /** She tosses it up from her hand. */
    launch() { Object.assign(fly, { on: true, t: 0, az: 0, el: 0.3, len: 1, vaz: 0, vel: 0 }); mine.placed = false; setMine(true); },
    land() { fly.on = false; setMine(false); },
    onCut(fn) { onCut = fn; },
    setNight(k) { night = k; },
    /** A drag on the scene: sideways steers, upward pulls. */
    drag(dx, dy) { if (fly.t < 2.6) return; fly.az = clamp(fly.az - dx * 0.004, -1.15, 1.15); fly.el = clamp(fly.el - dy * 0.003, 0.28, 1.0); fly.vaz = -dx * 0.05; },
    /** keys: a Set of 'u' | 'd' | 'l' | 'r'; from: where her hand is (house-local). */
    tick(dt, time, keys, from) {
      const gust = still ? 0 : Math.sin(time * 0.37) * 0.6 + Math.sin(time * 1.13 + 1) * 0.3;
      wind.set(still ? 0 : Math.sin(time * 0.5) * 0.6, 0, 2.6 + gust);

      // the neighbours' kites wander; a cut one tumbles down the wind, then a new one rises in its place
      for (const o of others) {
        const { k } = o;
        if (!o.cut) {
          const rise = ease(o.t / 3); o.t += dt;
          o.pos.copy(o.base).add(tmp.set(Math.sin(time * 0.3 + o.ph) * 3, Math.sin(time * 0.5 + o.ph) * 2 - (1 - rise) * 18, Math.cos(time * 0.27 + o.ph) * 2.5));
          if (still) o.pos.copy(o.base);
          pose(k, o.pos, o.anchor, Math.sin(time * 0.6 + o.ph) * 0.25, dt, wind, time, still);
          drawString(k.string, o.anchor, o.pos, o.pos.distanceTo(o.anchor) * 0.06);
          // Bo kata: her kite has crossed this one
          if (fly.on && fly.t > 2.6 && kitePos.distanceTo(o.pos) < 2.6) {
            o.cut = true; o.t = 0; o.spin = 0; k.string.visible = false;
            o.vel.set((Math.random() - 0.5) * 3, -1.3, 3.2);
            fly.cuts++; onCut?.(fly.cuts);
          }
        } else {
          o.t += dt;
          o.vel.y = Math.max(-2.4, o.vel.y - 0.4 * dt);
          o.pos.addScaledVector(o.vel, dt).addScaledVector(wind, dt * 0.4);
          o.spin += dt * 2.4;
          k.g.position.copy(o.pos);
          k.g.rotation.set(Math.sin(o.spin * 1.3) * 1.2, o.spin, Math.sin(o.spin) * 0.9);
          k.g.updateMatrix();
          pose(k, o.pos, tmp2.copy(o.pos).add(tmp.set(Math.sin(o.spin) * 5, -3, -4)), o.spin * 2, dt, wind, time, still);
          if (o.t > 7) { o.cut = false; o.t = 0; k.string.visible = true; k.placed = false; }
        }
      }

      // her kite
      if (fly.on) {
        hand.copy(from);
        fly.t += dt;
        const u = keys.has('u'), d = keys.has('d'), lr = (keys.has('l') ? 1 : 0) - (keys.has('r') ? 1 : 0);
        if (fly.t < 2.6) {
          // the toss: out of her hand, a wobble, then it catches the wind and climbs
          const k = ease(fly.t / 2.6);
          fly.len = 1 + 21 * k; fly.el = 0.3 + 0.42 * k; fly.az = Math.sin(fly.t * 5) * 0.12 * (1 - k);
          fly.vaz = Math.cos(fly.t * 5) * 0.6 * (1 - k);
        } else {
          fly.vaz += (lr * 0.8 + gust * 0.1 - fly.az * 0.12 - fly.vaz) * Math.min(1, dt * 3);
          fly.az += fly.vaz * dt;
          if (Math.abs(fly.az) > 1.15) { fly.az = Math.sign(fly.az) * 1.15; fly.vaz = 0; }
          // pulling makes it climb (and reels a little in); giving line lets it ride out lower and further
          const target = u ? 0.98 : d ? 0.42 : 0.66 + gust * 0.06;
          fly.vel += ((target - fly.el) * 1.6 - fly.vel) * Math.min(1, dt * 3);
          fly.el = clamp(fly.el + fly.vel * dt, 0.28, 1.02);
          fly.len = clamp(fly.len + (d ? 7 : u ? -2.5 : 0) * dt, 14, 52);
        }
        fly.tug += ((u ? 1 : 0) - fly.tug) * Math.min(1, dt * 6);
        fly.steer += (lr - fly.steer) * Math.min(1, dt * 5);
        const bob = still ? 0 : 1;
        const jerk = fly.tug * Math.sin(time * 11) * 0.35 * bob; // each pull yanks it
        kitePos.set(Math.sin(fly.az) * Math.cos(fly.el), Math.sin(fly.el), Math.cos(fly.az) * Math.cos(fly.el)).multiplyScalar(fly.len).add(hand);
        kitePos.y += (Math.sin(time * 1.7) * 0.35 + jerk) * bob;
        kitePos.x += Math.sin(time * 0.9) * 0.3 * bob;
        pose(mine, kitePos, hand, fly.vaz * 0.9 + (still ? 0 : Math.sin(time * 5.3) * 0.07), dt, wind, time, still);
        drawString(mine.string, hand, kitePos, fly.len * (0.075 - fly.tug * 0.05));
      }

      // the clouds drift in while she's on the roof; after dark they fade away (the stars take over)
      show += ((fly.on ? 1 : 0) - show) * Math.min(1, dt * 1.5);
      cloudMat.opacity = show * (1 - night);
      if (!still) clouds.forEach((c, i) => { c.position.x += Math.sin(i) * 0.4 * dt; });
    },
  };
}
