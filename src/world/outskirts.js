// The outskirts: what lies past the ring road, so the map has more to find when you zoom out.
// All of it sits on the open south side and the far edge, away from the crescent of project houses:
//   a cricket ground with a match on (south), a bazaar of awning stalls (south-west), a chai dhaba (south-east),
//   a lake with two boats (east, behind the houses), a train looping round the edge of town, and
//   rickshaws driving the ring road. Static parts go in `stat` (the caller bakes them); moving parts in `live`.
// `obstacles` are circles she walks around; `labels` are map-only name tags.
import * as THREE from 'three';
import { canvasTexture, mat } from './assets.js';

const polar = (r, a) => new THREE.Vector3(Math.sin(a) * r, 0, -Math.cos(a) * r);
const deg = THREE.MathUtils.degToRad;
const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; };
const cyl = (r0, r1, h, m, x = 0, y = 0, z = 0, seg = 10) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), m); o.position.set(x, y, z); return o; };

export const TRACK_R = 112; // the railway, round the edge of town
export const WALK_R = TRACK_R - 7; // how far out she may walk

// ---------- textures ----------
const stripes = (a, b, n = 8) => canvasTexture(128, 64, (ctx, w, h) => {
  for (let i = 0; i < n; i++) { ctx.fillStyle = i % 2 ? b : a; ctx.fillRect((i * w) / n, 0, w / n + 1, h); }
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, h - 8, w, 8); // a scalloped edge's shadow
});
const mowed = () => canvasTexture(256, 256, (ctx, w, h) => {
  for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? '#79b457' : '#6aa64b'; ctx.fillRect(0, (i * h) / 12, w, h / 12 + 1); }
});
const signText = (text, { bg = '#f2d04b', ink = '#3a2416', w = 256, h = 96, font = 'bold 54px sans-serif' } = {}) => canvasTexture(w, h, (ctx) => {
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = ink; ctx.lineWidth = 6; ctx.strokeRect(3, 3, w - 6, h - 6);
  ctx.fillStyle = ink; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, w / 2, h / 2 + 2);
});
const windows = (body) => canvasTexture(256, 64, (ctx, w, h) => {
  ctx.fillStyle = body; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#f2d04b'; ctx.fillRect(0, h - 12, w, 5); // the yellow stripe
  ctx.fillStyle = '#cfe6ef'; for (let x = 12; x < w - 20; x += 30) ctx.fillRect(x, 12, 18, 22);
});
const labelTexture = (text) => canvasTexture(512, 128, (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  ctx.font = '600 52px Georgia, serif';
  const tw = ctx.measureText(text).width + 56;
  const x0 = (w - tw) / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath(); ctx.roundRect(x0, 22, tw, 84, 42); ctx.fill();
  ctx.fillStyle = '#15201a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, w / 2, 66);
});

// little low-poly people, for the cricket match and the dhaba
function person(shirt, skin = 0xc8956b) {
  const g = new THREE.Group();
  g.add(cyl(0.22, 0.26, 0.9, mat(shirt), 0, 1.0, 0, 8));
  g.add(cyl(0.12, 0.12, 0.55, mat(0xe9e6dc), -0.11, 0.28, 0, 6), cyl(0.12, 0.12, 0.55, mat(0xe9e6dc), 0.11, 0.28, 0, 6));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), mat(skin)); head.position.y = 1.65; g.add(head);
  return g;
}

export function createOutskirts({ reducedMotion = false } = {}) {
  const stat = new THREE.Group(), live = new THREE.Group();
  const obstacles = [], labels = [];
  const still = reducedMotion;
  const lanternMat = new THREE.MeshStandardMaterial({ color: 0xffb35c, emissive: 0xff8a26, emissiveIntensity: 0.4, roughness: 0.4 });
  const wood = mat(0x7a5032, { roughness: 0.8 }), darkWood = mat(0x4e3220, { roughness: 0.8 });
  const addLabel = (text, at, y = 9) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(text), transparent: true, depthWrite: false, depthTest: false, fog: false, toneMapped: false }));
    s.position.copy(at).setY(y); s.scale.set(16, 4, 1); s.renderOrder = 10; s.visible = false;
    live.add(s); labels.push(s);
  };

  // ---------- the cricket ground (south) ----------
  const C = new THREE.Vector3(0, 0, 66);
  {
    const g = new THREE.Group(); g.position.copy(C);
    const field = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshStandardMaterial({ map: mowed(), roughness: 1 }));
    field.rotation.x = -Math.PI / 2; field.scale.set(17, 13, 1); field.position.y = 0.04; g.add(field);
    const rope = new THREE.Mesh(new THREE.RingGeometry(0.975, 1, 96), mat(0xffffff, { roughness: 0.6 }));
    rope.rotation.x = -Math.PI / 2; rope.scale.set(17, 13, 1); rope.position.y = 0.07; g.add(rope);
    g.add(box(2.4, 0.03, 9.5, mat(0xd8c394, { roughness: 1 }), 0, 0.07, 0)); // the pitch
    for (const z of [-4.2, 4.2]) {
      for (const x of [-0.18, 0, 0.18]) g.add(cyl(0.035, 0.035, 0.9, mat(0xf2e6c8), x, 0.5, z, 6));
      g.add(box(2.4, 0.02, 0.06, mat(0xffffff), 0, 0.09, z - Math.sign(z) * 1.2)); // the crease
    }
    // a scoreboard and benches along the side facing town
    g.add(box(5, 3, 0.4, darkWood, -13, 2.6, -11.5));
    const board = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.2), new THREE.MeshBasicMaterial({ map: signText('PESHAWAR  142/3', { bg: '#1d2a22', ink: '#f2e6c8', w: 512, h: 256, font: 'bold 64px sans-serif' }) }));
    board.position.set(-13, 2.7, -11.28); g.add(board);
    g.add(box(0.3, 1.2, 0.3, darkWood, -14.8, 0.6, -11.5), box(0.3, 1.2, 0.3, darkWood, -11.2, 0.6, -11.5));
    for (const [x, z, r] of [[-6, -13.6, 0.1], [0, -14.2, 0], [6, -13.6, -0.1]]) { const b = box(4, 0.5, 0.9, wood, x, 0.5, z); b.rotation.y = r; g.add(b); }
    stat.add(g);
    obstacles.push({ x: C.x - 13, z: C.z - 11.5, r: 3 });
    addLabel('Cricket ground', C, 10);

    // the match: fielders spread round, a batter at one end, a bowler running in; the ball flies and is hit away
    const m = new THREE.Group(); m.position.copy(C); live.add(m);
    for (const [x, z] of [[-9, 2], [8, -3], [-4, 9], [5, 8], [-11, -5], [12, 4], [0, -9]]) { const f = person(0xf4f1ea); f.position.set(x, 0, z); f.rotation.y = Math.atan2(-x, -z); m.add(f); }
    const batter = person(0x2f8a52); batter.position.set(0.5, 0, 3.5); batter.rotation.y = Math.PI; m.add(batter);
    const bat = box(0.12, 0.08, 0.9, mat(0xd9b878), 0.45, 1.0, -0.2); batter.add(bat);
    const keeper = person(0xf4f1ea); keeper.position.set(0, 0, 6.2); keeper.rotation.y = Math.PI; m.add(keeper);
    const bowler = person(0x2f6fb5); m.add(bowler);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(0xb3261e, { roughness: 0.4 })); m.add(ball);
    // the bails on her stumps: they fly off when she's bowled
    const bails = [-0.09, 0.09].map((x) => { const b = box(0.17, 0.04, 0.04, mat(0xf2e6c8), x, 0.97, 4.2); m.add(b); return b; });
    live.userData.match = { batter, bat, bowler, ball, bails, keeper, t: 0 };
  }

  // ---------- the mini game: she bats one over (six balls) ----------
  // Two things to get right, like real batting:
  //   Where: each ball comes down a different line (outside off, at the stumps, down leg). She shuffles across
  //     the crease with ← → to get her bat in line; a ring on the pitch shows where it will bounce.
  //   When: swing (Space / ↑ / a tap) as it reaches the bat. Spot on is a six, close is a four, a bit off a run or two.
  // Bat in line and timed: a clean hit, sent where the line and timing take it (late to the off side, early to leg).
  // Bat nearly in line: an edge (a single, or caught behind if it's late). Not in line: a miss, and if the ball
  // was on the stumps the bails fly. Don't swing with the bat in line and she blocks it. Each ball is a bit quicker.
  // An early swing is a practice swing: she can go again. At contact the ball meets the blade (batPoint, from the scene).
  // Her bat (neighbourhood.js BAT_HAND, BAT_SWEET): hands 0.32 m to her right and 0.16 m in front, so at her guard
  // (feet at x -0.3) the hanging blade's middle is at x 0.02, z 3.39, 0.4 m up: where each ball arrives.
  const RELEASE = new THREE.Vector3(0.25, 2.0, -4.6), CONTACT_Z = 3.39, CROSS = 0.047, WINDOW = 0.25;
  const MIDDLE = 0.14, EDGE = 0.3; // how far the ball may be from the middle of the bat (m): a clean hit, an edge
  const cricket = {
    spot: C.clone().add(new THREE.Vector3(-0.3, 0, 3.55)),  // her guard: her bat (in her right hand) over the stumps' line (world)
    reach: 0.95,                                             // how far she can shuffle either side of her guard (m)
    batPoint: null, // () => the blade's sweet spot in world space (the scene sets it)
    approach: C.clone().add(new THREE.Vector3(2.4, 0, 6.2)), // where she walks to first (world)
    center: C.clone(),
    on: false, onEvent: null,
    g: null, // the current over: { balls, runs, wkts, phase, t, D, line, swing, hit }
    start(onEvent) {
      this.on = true; this.onEvent = onEvent;
      this.g = { balls: 0, runs: 0, wkts: 0, phase: 'wait', t: 0 };
      const M = live.userData.match; M.batter.visible = false; M.keeper.visible = false; // the camera stands where the keeper would
      this.emit('start', {});
    },
    stop() {
      this.on = false; const M = live.userData.match; M.batter.visible = true; M.keeper.visible = true; M.mark.visible = false;
      M.bails.forEach((b, i) => { b.position.set(i ? 0.09 : -0.09, 0.97, 4.2); b.rotation.set(0, 0, 0); });
    },
    emit(type, d) { this.onEvent?.({ type, ...d, runs: this.g?.runs ?? 0, wkts: this.g?.wkts ?? 0, balls: this.g?.balls ?? 0 }); },
    /** Swing. Returns null if she can't right now, else { delay }: how long to hold the backlift before bringing
     *  the bat through, so it crosses as the ball arrives. */
    swing() {
      const G = this.g;
      if (!this.on || !G || G.hit || G.cool > 0 || !(G.phase === 'runup' || G.phase === 'flight')) return null;
      G.cool = 0.35; // a practice swing takes a moment to recover from
      if (G.phase !== 'flight' || G.swing) { G.air = true; return { delay: 0 }; }
      const ideal = G.D - CROSS; // pressing then brings the bat across just as the ball arrives
      if (G.t < ideal - WINDOW) { G.air = true; return { delay: 0 }; } // too early: an air shot, she can go again
      G.swing = { t: G.t, q: Math.abs(G.t - ideal), late: G.t > ideal };
      G.contactAt = Math.max(G.D, G.t + CROSS);
      return { delay: Math.max(0, ideal - G.t) };
    },
  };
  // where the ball is at k (0 release → 1 at the crease), with one bounce on a good length, coming up to bat height
  const KB = 0.64;
  const ballAt = (k, line, out) => {
    out.set(RELEASE.x + (line - RELEASE.x) * Math.min(1, k), 0, RELEASE.z + (CONTACT_Z - RELEASE.z) * k);
    out.y = k < KB ? 0.1 + (RELEASE.y - 0.1) * (1 - Math.pow(k / KB, 1.6)) : 0.1 + 0.3 * Math.sin(Math.min(1, (k - KB) / (1 - KB)) * (Math.PI / 2));
    return out;
  };
  const verdict = (q) => {
    if (q <= 0.06) return { runs: 6, label: 'SIX!', kind: 'six' };
    if (q <= 0.12) return { runs: 4, label: 'FOUR!', kind: 'four' };
    if (q <= 0.18) return { runs: 2, label: '2 runs', kind: 'runs' };
    return { runs: 1, label: '1 run', kind: 'runs' };
  };
  const _bp = new THREE.Vector3();
  const hitVel = new THREE.Vector3();
  // how far the middle of her bat is from the ball's line, across the pitch (m)
  const offLine = (G) => (cricket.batPoint ? G.line - (_bp.copy(cricket.batPoint()).x - C.x) : 0);
  // the ring on the pitch where this ball will bounce
  {
    const M = live.userData.match;
    M.mark = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.24, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
    M.mark.rotation.x = -Math.PI / 2; M.mark.visible = false; M.ball.parent.add(M.mark);
  }
  function tickCricket(dt) {
    const G = cricket.g, M = live.userData.match;
    if (!G) return;
    G.t += dt;
    G.cool = Math.max(0, (G.cool || 0) - dt);
    if (G.phase === 'wait') {
      // the bowler walks back to his mark; then he's off
      M.bowler.position.set(0.2, 0, -11); M.ball.position.set(0.4, 1.3, -10.8); M.mark.visible = false;
      if (G.t > 1.4) {
        G.phase = 'runup'; G.t = 0; G.swing = null; G.contactAt = null; G.air = false; G.blocked = false;
        // anywhere from well outside off to down leg; she has to move to it
        G.line = -0.6 + Math.random() * 1.25;
        G.D = Math.max(0.62, 0.98 - G.balls * 0.04 + Math.random() * 0.06);
        cricket.emit('bowl', {});
      }
    } else if (G.phase === 'runup') {
      const k = Math.min(1, G.t / 1.3);
      M.bowler.position.set(0.2, Math.abs(Math.sin(k * Math.PI * 7)) * 0.12, -11 + k * 6.3);
      M.ball.position.set(0.4, 1.3 + k * 0.6, M.bowler.position.z + 0.2);
      if (k >= 1) {
        G.phase = 'flight'; G.t = 0;
        ballAt(KB, G.line, M.mark.position); M.mark.position.y = 0.09; M.mark.visible = true; // where it'll pitch
      }
    } else if (G.phase === 'flight') {
      const k = G.t / G.D;
      ballAt(k, G.line, M.ball.position);
      M.mark.material.opacity = Math.min(0.85, G.t * 3) * (k < KB ? 1 : Math.max(0, 1 - (k - KB) * 4));
      const s = G.swing;
      if (s && G.t >= G.contactAt && !G.hit) {
        // the bat comes across: is it in line?
        const off = Math.abs(offLine(G));
        if (off <= EDGE) {
          const edge = off > MIDDLE;
          const r = edge ? (s.late && Math.random() < 0.45 ? { runs: 0, label: 'Edged… caught behind!', kind: 'out' } : { runs: 1, label: 'Edged for one', kind: 'runs' }) : verdict(s.q);
          G.hit = r; G.phase = 'hit'; G.t = 0;
          if (cricket.batPoint) M.ball.position.copy(_bp.copy(cricket.batPoint()).sub(C)); // the ball meets the blade
          // where it goes: the line and timing choose the side (off-side balls and late swings go to the off side)
          const ang = Math.max(-1.1, Math.min(1.1, G.line * 0.9 + (s.late ? 1 : -1) * Math.min(1, s.q / 0.12) * 0.45 + (Math.random() - 0.5) * 0.2));
          const sp = r.kind === 'six' ? 24 : r.kind === 'four' ? 26 : edge ? 7 : 11;
          hitVel.set(Math.sin(ang) * sp, r.kind === 'six' ? 15 : r.kind === 'four' ? 2 : 4, -Math.cos(ang) * sp);
          if (edge) hitVel.set(Math.sign(G.line || 1) * 2.5, 4, r.kind === 'out' ? 5 : -3); // off the edge: behind, or squirting away
          cricket.emit('contact', { kind: r.kind });
        } else { G.air = true; G.swing = null; G.contactAt = null; } // swung at nothing: it carries on through
      } else if (!s && !G.blocked && k >= 1 && Math.abs(offLine(G)) <= MIDDLE) {
        // she didn't swing, but her bat is in line: blocked, dead at her feet
        G.blocked = true; G.hit = { runs: 0, label: 'Defended', kind: 'dot' }; G.phase = 'miss'; G.t = 0;
        cricket.emit('contact', { kind: 'dot' });
      } else if (!G.swing && G.t > G.D - CROSS + WINDOW) {
        // missed it (or let it go): it carries on through, and hits the stumps if it was on them
        const onStumps = Math.abs(G.line) < 0.14;
        G.hit = onStumps ? { runs: 0, label: 'Bowled!', kind: 'out' } : { runs: 0, label: G.air ? 'Swing and a miss' : 'Left alone', kind: 'dot' };
        G.phase = 'miss'; G.t = 0;
      }
    } else if (G.phase === 'hit') {
      const b = M.ball.position;
      hitVel.y -= 9.8 * dt;
      b.addScaledVector(hitVel, dt);
      if (b.y < 0.12) { b.y = 0.12; hitVel.y = Math.abs(hitVel.y) * 0.4; hitVel.x *= 0.82; hitVel.z *= 0.82; }
      if (G.hit.kind === 'out' && G.t > 0.7) b.set(0, -2, 6.0); // into the keeper's gloves, behind the camera
      if (G.t > 2.4) finishBall();
    } else if (G.phase === 'miss') {
      const b = M.ball.position;
      if (G.blocked) {
        // dropped dead in front of her bat
        b.y = Math.max(0.12, b.y - dt * 1.5); b.z -= dt * 0.6 * Math.max(0, 1 - G.t);
      } else if (G.hit.label === 'Bowled!') {
        // into the stumps: the bails fly
        b.set(G.line, 0.5, 4.2);
        M.bails.forEach((x, i) => { x.position.x += (i ? 1 : -1) * dt * 2; x.position.y = 0.97 + Math.sin(Math.min(1, G.t * 1.6) * Math.PI) * 0.9 - G.t * 0.3; x.rotation.z += dt * 9; });
      } else {
        const k = 1 + G.t / G.D;
        ballAt(Math.min(k, 1.25), G.line, b);
        if (k > 1.25) b.set(0, -2, 6.0); // through to the keeper, behind the camera
      }
      if (G.t > 2.0) finishBall();
    }
  }
  function finishBall() {
    const G = cricket.g, M = live.userData.match;
    G.balls++; G.runs += G.hit.runs; if (G.hit.kind === 'out') G.wkts++;
    cricket.emit('result', { label: G.hit.label, kind: G.hit.kind, scored: G.hit.runs });
    M.bails.forEach((b, i) => { b.position.set(i ? 0.09 : -0.09, 0.97, 4.2); b.rotation.set(0, 0, 0); });
    G.hit = null; G.swing = null;
    if (G.balls >= 6) { G.phase = 'done'; cricket.emit('over', {}); }
    else { G.phase = 'wait'; G.t = 0; }
  }

  // ---------- the bazaar (south-west): two rows of stalls facing a lane ----------
  {
    const a = deg(228), at = polar(63, a);
    const g = new THREE.Group(); g.position.copy(at); g.rotation.y = -a; // local X runs along the lane
    const awnings = [['#c4232b', '#f6efe2'], ['#2f8a52', '#f6efe2'], ['#f2c230', '#2f6fb5'], ['#e8336f', '#f6efe2'], ['#2fa59a', '#f2d04b']];
    const goods = [0xf08a24, 0xc4232b, 0x8bc34a, 0xf2c230, 0x7b3fa0];
    for (const side of [-1, 1]) for (let i = 0; i < 5; i++) {
      const x = -10 + i * 5, z = side * 4.2, k = (i + (side > 0 ? 2 : 0)) % 5;
      const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = side > 0 ? Math.PI : 0;
      s.add(box(4.2, 2.6, 0.2, mat(0xe3cf9e, { roughness: 0.9 }), 0, 1.3, -1.6)); // back wall
      for (const px of [-2, 2]) s.add(box(0.14, 2.6, 0.14, darkWood, px, 1.3, 1.2));
      s.add(box(4.2, 0.9, 1.1, wood, 0, 0.45, 0.6)); // the counter
      const aw = box(4.6, 0.08, 2.4, new THREE.MeshStandardMaterial({ map: stripes(...awnings[k]), roughness: 0.8 }), 0, 2.75, 0.4); aw.rotation.x = 0.28; s.add(aw);
      // a heap of fruit on the counter
      for (let j = 0; j < 9; j++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 7, 5), mat(goods[(k + j) % 5])); b.position.set(-1.5 + (j % 5) * 0.7, 1.02 + Math.floor(j / 5) * 0.2, 0.55 + (j % 2) * 0.2); s.add(b); }
      // a lantern under the awning
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), lanternMat); l.position.set(0, 2.25, 1.0); s.add(l);
      g.add(s);
      obstacles.push({ ...(() => { const p = new THREE.Vector3(x, 0, z + side * 0.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), -a).add(at); return { x: p.x, z: p.z }; })(), r: 2.6 });
    }
    // a string of bunting down the lane
    for (let i = 0; i < 14; i++) { const f = box(0.5, 0.4, 0.02, mat([0xc4232b, 0x2f8a52, 0xf2c230, 0x2f6fb5][i % 4]), -11 + i * 1.7, 3.6 - Math.sin((i / 13) * Math.PI) * 0.5, 0); g.add(f); }
    const arch = signText('QISSA KHWANI', { bg: '#2f8a52', ink: '#f6efe2', w: 512, h: 96, font: 'bold 56px sans-serif' });
    // the arch sign reads the right way round from both sides: two faces, back to back
    const signMat = new THREE.MeshStandardMaterial({ map: arch, roughness: 0.7 });
    for (const s of [1, -1]) { const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.1), signMat); sign.position.set(-13.2 - s * 0.03, 4.2, 0); sign.rotation.y = -s * Math.PI / 2; g.add(sign); }
    g.add(box(0.04, 1.1, 6, darkWood, -13.2, 4.2, 0));
    for (const z of [-2.6, 2.6]) g.add(box(0.25, 4.6, 0.25, darkWood, -13.2, 2.3, z));
    stat.add(g);
    addLabel('Bazaar', at, 10);
  }

  // ---------- the chai dhaba (south-east) ----------
  let steam = null;
  {
    const a = deg(140), at = polar(58, a);
    const g = new THREE.Group(); g.position.copy(at); g.rotation.y = -a; // its front (+Z) faces in, toward the ring road
    g.add(box(5, 2.8, 3.4, mat(0xd9b48a, { roughness: 0.95 }), 0, 1.4, -1.2));
    const roof = box(6.2, 0.12, 4.6, new THREE.MeshStandardMaterial({ map: stripes('#9c7b74', '#c9a59c', 16), roughness: 0.6, metalness: 0.3 }), 0, 3.0, -0.6); roof.rotation.x = 0.1; g.add(roof);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.9), new THREE.MeshBasicMaterial({ map: signText('CHAI') }));
    sign.position.set(0, 3.5, 0.55); g.add(sign);
    g.add(box(2.6, 1.0, 0.9, wood, 0, 0.5, 0.75)); // the counter
    // the stove and a big kettle, steaming
    g.add(cyl(0.45, 0.5, 0.5, mat(0x3a3a40), -1.6, 1.25, 0.6, 12));
    g.add(cyl(0.32, 0.4, 0.5, mat(0xc9ccd1, { metalness: 0.8, roughness: 0.3 }), -1.6, 1.75, 0.6, 12));
    // a clay tandoor and two charpais out front
    g.add(cyl(0.6, 0.75, 1.0, mat(0xb5764a, { roughness: 1 }), 2.6, 0.5, 1.2, 12));
    for (const [x, z, r] of [[-1.6, 3.4, 0.2], [1.6, 3.6, -0.15]]) {
      const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = r;
      c.add(box(1.9, 0.06, 0.95, mat(0xd8c39a, { roughness: 1 }), 0, 0.46, 0));
      for (const sx of [-0.9, 0.9]) for (const sz of [-0.42, 0.42]) c.add(cyl(0.05, 0.04, 0.46, wood, sx, 0.23, sz, 6));
      g.add(c);
    }
    // fairy lights along the eave
    for (let i = 0; i < 16; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), lanternMat); b.position.set(-2.9 + i * 0.39, 2.75 - Math.sin((i / 15) * Math.PI) * 0.3, 1.6); g.add(b); }
    stat.add(g);
    obstacles.push({ x: at.x, z: at.z, r: 3.6 });
    // two regulars at the counter
    const p1 = person(0x7a5032), p2 = person(0x3a5f8a);
    const w = new THREE.Group(); w.position.copy(at); w.rotation.y = -a; p1.position.set(-0.6, 0, 1.6); p2.position.set(0.7, 0, 1.7); p1.rotation.y = p2.rotation.y = Math.PI; w.add(p1, p2); live.add(w);
    steam = new THREE.Group(); steam.position.set(-1.6, 2.1, 0.6); w.add(steam);
    const puff = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false });
    for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), puff.clone()); s.userData.k = i / 4; steam.add(s); }
    addLabel('Chai dhaba', at, 9);
  }

  // ---------- the lake (east, behind the houses), with a jetty and two boats ----------
  const boats = [];
  {
    const a = deg(102), at = polar(80, a);
    const shape = new THREE.Shape();
    for (let i = 0; i <= 48; i++) { const t = (i / 48) * Math.PI * 2, r = 13 + Math.sin(t * 3) * 1.6 + Math.cos(t * 5) * 0.9; const p = [Math.cos(t) * r * 1.25, Math.sin(t) * r]; i ? shape.lineTo(...p) : shape.moveTo(...p); }
    const shore = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat(0xd9c99a, { roughness: 1 })); shore.rotation.x = -Math.PI / 2; shore.scale.setScalar(1.12); shore.position.copy(at).setY(0.03); stat.add(shore);
    const water = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color: 0x4f9fc4, roughness: 0.15, metalness: 0.15 }));
    water.rotation.x = -Math.PI / 2; water.position.copy(at).setY(0.06); stat.add(water);
    // reeds round the edge, a little jetty
    for (let i = 0; i < 26; i++) { const t = (i / 26) * Math.PI * 2, r = 13.8 + Math.sin(i * 7) * 0.6; const reed = cyl(0.04, 0.05, 1.1 + (i % 3) * 0.3, mat(0x5c7a3a), at.x + Math.cos(t) * r * 1.25, 0.55, at.z - Math.sin(t) * r, 5); stat.add(reed); }
    const toTown = at.clone().setY(0).normalize().multiplyScalar(-1);
    const jetty = box(1.6, 0.15, 7, wood, 0, 0.35, 0);
    const jg = new THREE.Group(); jg.position.copy(at).addScaledVector(toTown, 11.5); jg.lookAt(at.x, 0, at.z); jg.add(jetty); stat.add(jg);
    obstacles.push({ x: at.x, z: at.z, r: 16, water: true, sx: 1.25 });
    for (const [c, ph, r] of [[0xc4232b, 0, 6], [0x2fa59a, 2.6, 8.5]]) {
      const b = new THREE.Group();
      const hull = box(2.4, 0.5, 1.0, mat(c, { roughness: 0.6 }), 0, 0.25, 0); b.add(hull);
      b.add(box(2.0, 0.08, 0.8, wood, 0, 0.52, 0), box(0.06, 1.6, 0.06, darkWood, 0.2, 1.3, 0));
      const sail = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.2), mat(0xf6efe2, { side: THREE.DoubleSide })); sail.position.set(0.65, 1.4, 0); b.add(sail);
      live.add(b); boats.push({ b, at, ph, r });
    }
    addLabel('The lake', at, 8);
  }

  // ---------- the railway: a loop round the edge of town ----------
  const trainCars = [];
  {
    const rail = mat(0x6b6f75, { metalness: 0.6, roughness: 0.4 });
    for (const off of [-0.75, 0.75]) { const r = new THREE.Mesh(new THREE.RingGeometry(TRACK_R + off - 0.06, TRACK_R + off + 0.06, 256, 1), rail); r.rotation.x = -Math.PI / 2; r.position.y = 0.22; stat.add(r); }
    const bed = new THREE.Mesh(new THREE.RingGeometry(TRACK_R - 1.8, TRACK_R + 1.8, 256, 1), mat(0x9a9488, { roughness: 1 })); bed.rotation.x = -Math.PI / 2; bed.position.y = 0.05; stat.add(bed);
    const sleeperMat = mat(0x5e4a38, { roughness: 1 });
    for (let i = 0; i < 300; i++) { const a = (i / 300) * Math.PI * 2; const s = box(2.4, 0.12, 0.35, sleeperMat); s.position.copy(polar(TRACK_R, a)).setY(0.12); s.rotation.y = Math.PI / 2 - a; stat.add(s); } // across the rails
    // a little station by the bazaar
    {
      const a = deg(205), at = polar(TRACK_R - 4.2, a);
      const st = new THREE.Group(); st.position.copy(at); st.rotation.y = -a;
      st.add(box(14, 0.6, 3, mat(0xc9c4b8), 0, 0.3, 0));
      for (const x of [-5, 0, 5]) st.add(box(0.25, 3, 0.25, darkWood, x, 1.8, -0.8));
      st.add(box(14.5, 0.15, 3.4, mat(0x9c3b2f, { roughness: 0.7 }), 0, 3.3, -0.2));
      const nm = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.9), new THREE.MeshBasicMaterial({ map: signText('PESHAWAR CANTT', { bg: '#f6efe2', ink: '#2f8a52', w: 512, h: 96, font: 'bold 52px sans-serif' }), side: THREE.DoubleSide }));
      nm.position.set(0, 2.6, 0.6); st.add(nm);
      stat.add(st);
      addLabel('Railway station', at, 9);
    }
    // the train: a green engine with a yellow stripe and four carriages
    const bodies = [0x1f6b3a, 0x2f8a52, 0x2f8a52, 0x2f8a52, 0x2f8a52];
    bodies.forEach((c, i) => {
      const car = new THREE.Group();
      const tex = windows('#' + c.toString(16).padStart(6, '0'));
      car.add(box(2.6, 2.2, 7.4, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), 0, 1.6, 0));
      car.add(box(2.7, 0.2, 7.6, mat(0x2b2d31), 0, 2.8, 0), box(2.2, 0.4, 7, mat(0x1d1d1f), 0, 0.45, 0));
      if (i === 0) { car.add(box(2.6, 0.8, 1.2, mat(0x2b2d31), 0, 3.2, 2.2)); car.add(cyl(0.35, 0.35, 0.6, mat(0x1d1d1f), 0, 3.4, -2.4, 10)); const lamp = cyl(0.25, 0.25, 0.1, lanternMat, 0, 2.2, 3.75, 10); lamp.rotation.x = Math.PI / 2; car.add(lamp); }
      live.add(car); trainCars.push(car);
    });
  }

  // ---------- rickshaws on the ring road ----------
  const rickshaws = [];
  {
    const colours = [[0x2f8a52, 0xf2c230], [0x1f4fa0, 0xf2c230], [0xc4232b, 0x2b2d31]];
    colours.forEach(([body, trim], i) => {
      const r = new THREE.Group();
      r.add(box(1.4, 0.8, 2.3, mat(body, { roughness: 0.5 }), 0, 0.75, 0));
      r.add(box(1.5, 0.9, 1.9, mat(0x1d1d1f, { roughness: 0.7 }), 0, 1.6, -0.2)); // the black canopy
      r.add(box(1.42, 0.12, 2.32, mat(trim), 0, 1.12, 0));
      for (const [x, z] of [[0, 1.15], [-0.6, -0.8], [0.6, -0.8]]) { const w = cyl(0.3, 0.3, 0.16, mat(0x1d1d1f), x, 0.3, z, 12); w.rotation.z = Math.PI / 2; r.add(w); }
      live.add(r);
      // inner lane runs clockwise, outer anticlockwise
      rickshaws.push({ r, a: (i / 3) * Math.PI * 2 + 0.6, lane: i === 1 ? 27.8 : 24.2, dir: i === 1 ? -1 : 1, speed: 0.22 + i * 0.03, hold: 0 });
    });
  }

  // Lamps the caller lights with the ring road's glow (on at dusk): street lamps along the bazaar lane,
  // by the dhaba and the station, and four floodlight masts round the cricket ground
  const lamps = [];
  for (const [r, d] of [[52, 220], [52, 236], [70, 222], [70, 234], [50, 132], [50, 148], [104, 198], [104, 212], [46, 180], [46, 100]]) lamps.push(polar(r, deg(d)));
  const floods = [];
  for (const [x, z] of [[-18, -10], [18, -10], [-18, 10], [18, 10]]) {
    const at = C.clone().add(new THREE.Vector3(x, 0, z));
    stat.add(cyl(0.18, 0.28, 14, mat(0x8a8f96, { metalness: 0.5 }), at.x, 7, at.z, 8));
    stat.add(box(2.2, 1.2, 0.3, lanternMat, at.x, 14.2, at.z));
    floods.push(at.clone().setY(14.2));
    obstacles.push({ x: at.x, z: at.z, r: 0.8 });
  }

  live.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  let trainA = 0;
  return {
    stat, live, obstacles, labels, lamps, floods, cricket,
    /** 0 day → 1 night: the lanterns and lights glow. */
    setLights(k) { lanternMat.emissiveIntensity = 0.4 + k * 1.4; },
    /** view: 0 street → 1 map (the name tags show on the map). sim: her position, so traffic waits for her. */
    tick(dt, time, view, sim, zoom = 1) {
      // the name tags show on the map, and grow as it pulls back so they stay readable
      const ls = 16 * Math.max(1, zoom * 0.95);
      labels.forEach((l) => { l.visible = view > 0.6; l.material.opacity = Math.min(1, (view - 0.6) / 0.25); l.scale.set(ls, ls / 4, 1); });
      if (cricket.on) tickCricket(dt); // she's batting: the game drives the match (even under reduced motion)
      if (still) return;
      // the match: the bowler runs in and bowls, the batter swings and the ball goes for four
      const M = live.userData.match;
      if (!cricket.on) {
        M.t = (M.t + dt) % 6;
        const t = M.t;
        const run = Math.min(1, t / 1.6);
        M.bowler.position.set(0.2, Math.abs(Math.sin(run * Math.PI * 6)) * 0.12 * (run < 1 ? 1 : 0), -9 + run * 4.4);
        M.bowler.rotation.y = 0;
        if (t < 1.6) M.ball.position.set(0.4, 1.4, M.bowler.position.z);
        else if (t < 2.2) { const k = (t - 1.6) / 0.6; M.ball.position.set(0.4, 1.9 - k * 1.2 + Math.sin(k * Math.PI) * 0.6 - (k > 0.7 ? (k - 0.7) * 1.5 : 0), -4.6 + k * 8); }
        else { const k = Math.min(1, (t - 2.2) / 2.2); M.ball.position.set(0.4 - k * 14, 0.2 + Math.sin(Math.min(1, k * 1.4) * Math.PI) * 6, 4.4 + k * 4); }
        M.bat.rotation.y = t > 2.0 && t < 2.5 ? -Math.sin(((t - 2.0) / 0.5) * Math.PI) * 1.6 : 0;
      }
      // the train goes round
      trainA += dt * 0.045;
      trainCars.forEach((c, i) => {
        const a = trainA - i * (8 / TRACK_R);
        c.position.copy(polar(TRACK_R, a));
        c.rotation.y = Math.PI / 2 - a; // along the track, nose first
        c.position.y = Math.sin(time * 9 + i) * 0.02;
      });
      // boats drift slowly round the lake, bobbing
      boats.forEach(({ b, at, ph, r }) => {
        const a = time * 0.05 + ph;
        b.position.set(at.x + Math.cos(a) * r * 1.2, Math.sin(time * 1.3 + ph) * 0.06, at.z + Math.sin(a) * r * 0.9);
        b.rotation.y = -a; b.rotation.z = Math.sin(time * 1.1 + ph) * 0.05;
      });
      // rickshaws: round the ring, waiting if she's in the road just ahead
      for (const k of rickshaws) {
        const next = polar(k.lane, k.a + k.dir * 0.12);
        const blocked = sim && Math.hypot(next.x - sim.x, next.z - sim.z) < 3.2;
        k.hold += ((blocked ? 0 : 1) - k.hold) * Math.min(1, dt * (blocked ? 8 : 2));
        k.a += k.dir * k.speed * k.hold * dt;
        k.r.position.copy(polar(k.lane, k.a)).setY(Math.abs(Math.sin(time * 14 + k.lane)) * 0.03 * k.hold);
        k.r.rotation.y = (k.dir > 0 ? Math.PI / 2 : -Math.PI / 2) - k.a; // nose along the way it's driving
      }
      // steam over the dhaba's kettle
      if (steam) steam.children.forEach((s) => { const u = (time * 0.4 + s.userData.k) % 1; s.position.set(Math.sin(u * 6) * 0.15, u * 1.6, 0); s.scale.setScalar(0.6 + u * 1.4); s.material.opacity = 0.35 * (1 - u); });
    },
  };
}
