// Fishing off the jetty on the Sardaryab. One button (Space / ↑ / the big button / a tap), held or pressed:
//   Cast:   hold to charge (the power swings up and down), let go to cast. More power, further out.
//   Wait:   the bobber floats; small nibbles shake it. Pressing now is too soon: it spooks the fish.
//   Bite:   it plunges under for a moment. Press then to hook it. Miss two bites and it swims off.
//   Reel:   hold to reel it in, let go to ease off. Each fish pulls in surges; if the line's tension
//           hits the top it snaps, and if you give it too much slack it gets away. Bigger fish pull harder.
//   Caught: it leaps out onto the jetty, and the catch is named and weighed.
// World space throughout. The rod is in her hands (the scene mounts `rod` on her); the line runs from its tip.
import * as THREE from 'three';
import { mat } from './assets.js';

const clamp01 = (x) => Math.min(1, Math.max(0, x));
// what's in the river: name, colour, weight range (kg), how likely
const FISH = [
  { name: 'Rohu', color: 0xc9b8b0, kg: [1, 4], p: 0.3 },
  { name: 'Mahseer', color: 0xd9a441, kg: [1.5, 6], p: 0.27 },
  { name: 'Brown trout', color: 0x8a9a5a, kg: [0.4, 2], p: 0.2 },
  { name: 'Catfish', color: 0x4a4a52, kg: [2, 8], p: 0.16 },
  { name: 'Golden mahseer', color: 0xf2c230, kg: [5, 12], p: 0.07 },
];
const pickFish = () => {
  let r = Math.random();
  const f = FISH.find((x) => (r -= x.p) < 0) || FISH[0];
  return { ...f, kg: +(f.kg[0] + Math.random() * (f.kg[1] - f.kg[0])).toFixed(1) };
};

export function createFishing({ spot, forward, water, reducedMotion = false }) {
  const live = new THREE.Group();
  const still = reducedMotion;
  const side = new THREE.Vector3(-forward.z, 0, forward.x); // to her right as she faces the water

  // ---------- the rod (in her hands; built in metres, she faces +Z in its frame) ----------
  const rod = new THREE.Group();
  const pivot = new THREE.Group(); pivot.position.set(0.16, 1.0, 0.22); rod.add(pivot);
  const blank = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.02, 2.4, 6), mat(0x2b2d31, { roughness: 0.4 }));
  blank.position.y = 1.2; pivot.add(blank);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.38, 8), mat(0x7a5032, { roughness: 0.8 })); handle.position.y = 0.05; pivot.add(handle);
  const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 10), mat(0xc9ccd1, { metalness: 0.7, roughness: 0.3 }));
  reel.rotation.z = Math.PI / 2; reel.position.set(0.05, 0.25, 0); pivot.add(reel);
  const tip = new THREE.Object3D(); tip.position.y = 2.4; pivot.add(tip);
  rod.visible = false;

  // ---------- bobber, line, ripples, the fish ----------
  const bobber = new THREE.Group();
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xe2483d, { roughness: 0.4 }));
  const bot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0xf6efe2, { roughness: 0.4 }));
  bobber.add(top, bot); bobber.visible = false; live.add(bobber);
  const LN = 24;
  const lineGeo = new THREE.BufferGeometry(); lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(LN * 3), 3));
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xf6efe2, transparent: true, opacity: 0.85 }));
  line.frustumCulled = false; line.visible = false; live.add(line);
  const ripples = [0, 1, 2].map(() => {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
    r.rotation.x = -Math.PI / 2; r.position.y = water + 0.02; live.add(r); r.userData.t = 1; return r;
  });
  let ri = 0;
  const ripple = (at, size = 1) => { const r = ripples[ri++ % ripples.length]; r.position.set(at.x, water + 0.02, at.z); r.userData.t = 0; r.userData.size = size; };
  const fishBody = new THREE.Group();
  const fishMat = new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.35, metalness: 0.3 });
  const fb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), fishMat); fb.scale.set(1, 0.55, 2.3); fishBody.add(fb);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.26, 4), fishMat); tail.rotation.x = -Math.PI / 2; tail.position.z = -0.45; tail.scale.set(0.3, 1, 1); fishBody.add(tail);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), mat(0x111111)); eye.position.set(0.06, 0.03, 0.26); fishBody.add(eye);
  fishBody.visible = false; live.add(fishBody);

  // ---------- the game ----------
  const tipW = new THREE.Vector3(), tmp = new THREE.Vector3(), target = new THREE.Vector3(), castFrom = new THREE.Vector3();
  const S = { on: false, phase: 'ready', t: 0, power: 0, held: false, caught: 0, best: null, misses: 0, fish: null, tension: 0, progress: 0, onEvent: null };
  const emit = (type, d = {}) => S.onEvent?.({ type, phase: S.phase, caught: S.caught, best: S.best, ...d });
  const go = (phase, d) => { S.phase = phase; S.t = 0; emit('phase', d); };
  const surfaceAt = (dist, out) => out.copy(spot).addScaledVector(forward, dist).setY(water + 0.04);

  function reelIn(reason, d) { S.lineCut = reason === 'snap'; go('reelin', { reason, ...d }); }

  const api = {
    live, rod, state: S,
    /** Start fishing (she's on the jetty). */
    start(onEvent) { Object.assign(S, { on: true, onEvent, misses: 0 }); rod.visible = true; go('ready'); },
    stop() { S.on = false; rod.visible = false; bobber.visible = line.visible = fishBody.visible = false; S.held = false; },
    /** The one button: down / up. */
    press(down) {
      if (!S.on) return;
      const was = S.held; S.held = down;
      if (down && !was) {
        if (S.phase === 'ready') { go('charge'); S.power = 0; }
        else if (S.phase === 'wait') { S.misses = 0; reelIn('spooked'); } // too soon: it spooks
        else if (S.phase === 'bite') { S.fish = pickFish(); S.tension = 0.2; S.progress = 0.15; go('reel', { fish: S.fish.name }); }
      }
      if (!down && was && S.phase === 'charge') go('cast', { power: S.power });
    },
    /** For the page's meters. */
    hud() { return { phase: S.phase, power: S.power, tension: S.tension, progress: S.progress }; },
    /** dt, time; her pose comes back as { lean, whip } for the scene to apply. */
    tick(dt, time) {
      if (!S.on) return null;
      S.t += dt;
      tip.getWorldPosition(tipW); // (updates the rod's matrices on the way)
      let rodTilt = 0.75, lean = 0, whip = 0;
      const B = bobber.position;

      if (S.phase === 'ready') {
        bobber.visible = line.visible = false; S.lineCut = false;
      } else if (S.phase === 'charge') {
        // the power swings up and down while held; the rod comes back over her shoulder
        S.power = still ? Math.min(1, S.t * 0.8) : 1 - Math.abs(((S.t * 0.9) % 2) - 1);
        rodTilt = 0.75 - Math.min(1, S.t * 3) * 1.15; whip = -Math.min(1, S.t * 3);
      } else if (S.phase === 'cast') {
        // whip forward, then the bobber sails out on an arc and lands
        const k = clamp01(S.t / 0.18);
        rodTilt = -0.4 + k * 1.65; whip = k;
        const dist = 2.6 + S.power * 4.6, fly = 0.5 + S.power * 0.45;
        if (S.t < 0.12) { castFrom.copy(tipW); }
        const f = clamp01((S.t - 0.12) / fly);
        surfaceAt(dist, target);
        B.lerpVectors(castFrom, target, f); B.y = Math.max(B.y + Math.sin(f * Math.PI) * (1.2 + S.power * 2.2), target.y);
        bobber.visible = line.visible = S.t > 0.12;
        if (f >= 1) { ripple(B, 1.2); S.castDist = dist; S.biteAt = 2 + Math.random() * 4; S.nibbleAt = 0.8 + Math.random(); go('wait', { dist: +dist.toFixed(1) }); }
      } else if (S.phase === 'wait') {
        // it floats, bobbing; a nibble now and then shakes it; then the bite
        B.y = water + 0.04 + (still ? 0 : Math.sin(time * 2.4) * 0.015);
        if (S.t > S.nibbleAt && S.t < S.nibbleAt + 0.18) { B.y -= 0.05; if (!S.nibbled) { S.nibbled = true; ripple(B, 0.5); emit('nibble'); } }
        if (S.t > S.nibbleAt + 0.18) { S.nibbled = false; S.nibbleAt += 0.7 + Math.random() * 1.4; }
        if (S.t > S.biteAt) { ripple(B, 1); go('bite'); }
      } else if (S.phase === 'bite') {
        // under it goes, for a moment
        B.y = water - 0.1 - Math.sin(S.t * 30) * 0.03;
        if (S.t > 0.8) {
          S.misses++;
          if (S.misses >= 2) { S.misses = 0; reelIn('missed'); }
          else { S.biteAt = 1.8 + Math.random() * 2.5; S.nibbleAt = 0.6; go('wait', { missed: true }); }
        }
      } else if (S.phase === 'reel') {
        // the fight: it pulls in surges, harder the bigger it is; holding reels in and raises the tension
        const f = S.fish, str = 0.45 + f.kg / 14;
        S.surge = S.surge > 0 ? S.surge - dt : (Math.random() < dt * 0.55 ? 0.7 : 0);
        const pull = clamp01(0.3 * str + 0.22 * str * Math.sin(S.t * 2.3 + f.kg) + (S.surge > 0 ? 0.5 * str : 0));
        const want = S.held ? 0.22 + pull * 0.95 : pull * 0.4;
        S.tension += (want - S.tension) * Math.min(1, dt * 3.2);
        S.progress = clamp01(S.progress + (S.held ? 0.2 * (1.15 - pull * 0.75) : -0.07 * (0.5 + pull)) * dt);
        rodTilt = 0.75 + S.tension * 0.55; lean = S.tension;
        // the bobber, dragged about by the fish, comes closer as she wins line back
        surfaceAt(0.9 + (1 - S.progress) * (S.castDist || 5), target);
        target.addScaledVector(side, Math.sin(S.t * 1.7) * 0.8 * (1 - S.progress));
        B.lerp(target, Math.min(1, dt * 4)); B.y = water - 0.05 + Math.sin(S.t * 20) * 0.03 * pull;
        if (S.surge > 0 && Math.random() < dt * 6) ripple(B, 0.6);
        if (S.tension >= 1) { reelIn('snap'); line.visible = false; }
        else if (S.progress >= 1) { S.caught++; if (!S.best || f.kg > S.best.kg) S.best = { name: f.name, kg: f.kg }; fishMat.color.setHex(f.color); go('caught', { fish: f.name, kg: f.kg, caught: S.caught }); }
        else if (S.progress <= 0) reelIn('escaped');
      } else if (S.phase === 'caught') {
        // it leaps out of the water and up into her hands, wriggling
        const k = clamp01(S.t / 0.7);
        fishBody.visible = true; bobber.visible = false; line.visible = S.t < 0.7;
        tmp.copy(spot).addScaledVector(forward, 0.7).setY(1.15 + 0.43);
        fishBody.position.lerpVectors(B, tmp, k); fishBody.position.y += Math.sin(k * Math.PI) * 1.2;
        fishBody.lookAt(fishBody.position.clone().add(side));
        fishBody.rotation.z += Math.sin(time * 18) * 0.25 * (still ? 0 : 1);
        fishBody.scale.setScalar(0.8 + Math.min(1, S.fish.kg / 8) * 0.9);
        rodTilt = 0.3; lean = -0.3;
        if (S.t > 2.8) { fishBody.visible = false; go('ready'); }
      } else if (S.phase === 'reelin') {
        // winding the line back in after a miss, a snap or an escape
        surfaceAt(0.6, target); B.lerp(target, Math.min(1, dt * 3)); B.y = water + 0.04;
        bobber.visible = line.visible = !S.lineCut; // a snapped line leaves nothing to wind in
        if (S.t > 1.1) go('ready');
      }

      // the rod, and the line from its tip to the bobber (a gentle sag; taut while she reels)
      pivot.rotation.x = rodTilt;
      if (line.visible) {
        const p = lineGeo.attributes.position, sag = S.phase === 'reel' ? 0.05 * (1 - S.tension) : 0.5;
        for (let i = 0; i < LN; i++) { const u = i / (LN - 1); tmp.lerpVectors(tipW, B, u); tmp.y -= Math.sin(u * Math.PI) * sag; p.setXYZ(i, tmp.x, tmp.y, tmp.z); }
        p.needsUpdate = true;
      }
      // ripples spread and fade
      for (const r of ripples) { r.userData.t = Math.min(1, r.userData.t + dt * 0.9); const s = (0.15 + r.userData.t * 0.9) * (r.userData.size || 1); r.scale.setScalar(s); r.material.opacity = 0.7 * (1 - r.userData.t); }
      return { lean, whip };
    },
  };
  return api;
}
