import { useEffect, useRef } from 'react';
import { usePhase } from '../lib/phase.jsx';

/**
 * Whisper-quiet background for the inner pages: three drifting star layers
 * (dust motes by day), a rare shooting star, and a faint low-poly horizon of the
 * neighborhood along the bottom edge. Cursor nudges the layers a few pixels.
 * Not scroll-driven. Frozen for reduced motion, paused in hidden tabs.
 */
const LAYERS = [
  { density: 0.22, size: 0.7, alpha: 0.32, drift: 1.5, parallax: 3 },
  { density: 0.1, size: 1.1, alpha: 0.48, drift: 3, parallax: 8 },
  { density: 0.035, size: 1.7, alpha: 0.7, drift: 5, parallax: 15 },
];

function seeded(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function rgb(cssColor) {
  const m = cssColor.trim().match(/^#([0-9a-f]{6})$/i);
  if (!m) return [233, 235, 245];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export default function Ambient({ dim = false }) {
  const ref = useRef(null);
  const { phase } = usePhase();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = matchMedia('(pointer: fine)').matches;
    // Same values as --ink in styles.css (read here directly so a phase change never lags a frame)
    const ink = rgb({ day: '#15161c', dusk: '#f1ebf3', night: '#e9ebf5' }[phase]);
    const day = phase === 'day';
    const strength = (day ? 0.55 : 0.75) * (dim ? 0.6 : 1);
    // Stars are cool white at night, warm at dusk; by day they become soft dust
    const starColor = day ? [120, 110, 90] : phase === 'dusk' ? [255, 228, 205] : [225, 232, 255];

    let w = 0, h = 0, dpr = 1, stars = [], horizon = [], raf = 0, last = 0;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let shooting = null, nextShot = performance.now() + 9000 + Math.random() * 12000;

    const build = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      const rand = seeded(42);
      stars = [];
      LAYERS.forEach((L, li) => {
        const count = Math.round((w * h / 10000) * L.density);
        for (let i = 0; i < count; i++) {
          stars.push({ li, x: rand() * w, y: rand() * h * 0.92, r: L.size * (0.7 + rand() * 0.6), tw: rand() * Math.PI * 2, sp: 0.4 + rand() * 1.2 });
        }
      });
      // Horizon: far hills + near rooftops and trees, deterministic
      const base = h;
      const band = Math.min(150, h * 0.16);
      const far = [], near = [];
      for (let x = -60; x <= w + 60; x += 70 + rand() * 60) far.push([x, base - band * (0.45 + rand() * 0.4)]);
      let x = -40;
      while (x < w + 60) {
        const kind = rand();
        if (kind < 0.35) { // house: walls + gable
          const hw = 26 + rand() * 22, hh = band * (0.22 + rand() * 0.12);
          near.push([x, base - hh], [x + hw / 2, base - hh - hw * 0.45], [x + hw, base - hh]);
          x += hw + 6 + rand() * 30;
        } else if (kind < 0.7) { // pine
          const tw = 10 + rand() * 10, th = band * (0.3 + rand() * 0.25);
          near.push([x, base - band * 0.16], [x + tw / 2, base - th], [x + tw, base - band * 0.16]);
          x += tw + rand() * 18;
        } else { // low ground
          near.push([x, base - band * (0.12 + rand() * 0.06)]);
          x += 30 + rand() * 50;
        }
      }
      horizon = [far, near];
    };

    const fill = (alpha, color = ink) => `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;

    const draw = (t) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;

      // A soft moon / sun haze in the top-right corner
      const g = ctx.createRadialGradient(w * 0.82, h * 0.08, 0, w * 0.82, h * 0.08, Math.max(w, h) * 0.45);
      g.addColorStop(0, fill(day ? 0.05 : 0.045, day ? [255, 214, 150] : phase === 'dusk' ? [255, 170, 120] : [150, 170, 255]));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Stars / motes
      const sec = t / 1000;
      for (const s of stars) {
        const L = LAYERS[s.li];
        let x = s.x + (reduced ? 0 : sec * L.drift * (day ? 0.6 : 1));
        let y = s.y - (day && !reduced ? sec * L.drift * 0.5 : 0);
        x = ((x % (w + 20)) + w + 20) % (w + 20) - 10;
        y = ((y % h) + h) % h;
        x += mouse.x * L.parallax; y += mouse.y * L.parallax * 0.6;
        const twinkle = reduced ? 1 : 0.65 + 0.35 * Math.sin(sec * s.sp + s.tw);
        ctx.fillStyle = fill(L.alpha * twinkle * strength, starColor);
        ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI * 2); ctx.fill();
      }

      // Rare shooting star (not by day)
      if (!day && !reduced) {
        if (!shooting && t > nextShot) shooting = { x: w * (0.2 + Math.random() * 0.6), y: h * (0.05 + Math.random() * 0.25), t0: t };
        if (shooting) {
          const k = (t - shooting.t0) / 900;
          if (k >= 1) { shooting = null; nextShot = t + 18000 + Math.random() * 20000; }
          else {
            const len = 120, hx = shooting.x + k * 260, hy = shooting.y + k * 110;
            const grad = ctx.createLinearGradient(hx, hy, hx - len, hy - len * 0.42);
            grad.addColorStop(0, fill(0.55 * strength * (1 - k), starColor)); grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.strokeStyle = grad; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - len, hy - len * 0.42); ctx.stroke();
          }
        }
      }

      // Horizon silhouette: far hills, then rooftops and pines
      const [far, near] = horizon;
      const shape = (pts, dx, alpha) => {
        ctx.fillStyle = fill(alpha * strength);
        ctx.beginPath(); ctx.moveTo(-80, h);
        for (const [px, py] of pts) ctx.lineTo(px + dx, py);
        ctx.lineTo(w + 80, h); ctx.closePath(); ctx.fill();
      };
      shape(far, mouse.x * 5, day ? 0.035 : 0.04);
      shape(near, mouse.x * 11, day ? 0.05 : 0.065);
      // A few lit windows at night, like the landing street
      if (!day) {
        ctx.fillStyle = `rgba(255,205,140,${0.18 * strength})`;
        for (let i = 2; i < near.length; i += 9) {
          const [px, py] = near[i];
          ctx.fillRect(px + mouse.x * 11 - 2, py + 10, 3, 4);
        }
      }
    };

    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden || t - last < 33) return; // ~30fps is plenty for ambience
      last = t;
      draw(t);
    };
    const onMove = (e) => { mouse.tx = (e.clientX / w - 0.5) * 2; mouse.ty = (e.clientY / h - 0.5) * 2; };
    const onResize = () => { build(); draw(performance.now()); };

    build();
    if (reduced) draw(0); else raf = requestAnimationFrame(loop);
    if (fine && !reduced) addEventListener('pointermove', onMove, { passive: true });
    addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove);
      removeEventListener('resize', onResize);
    };
  }, [phase, dim]);

  return <canvas ref={ref} className="ambient" aria-hidden="true" />;
}
