import { useEffect, useRef } from 'react';
import { clamp01, reducedMotion, useScrollFrame } from '../lib/scroll.js';

// The transparent plumbob sequence (app/tools/plumbob.html → public/seq/plumbob-t), shared by every page.
// Frames: 0 whole · 30 shards · 47 threads · 68 wireframe · 97 green glass.
export const FRAMES = 100;
const src = (i) => `/seq/plumbob-t/${String(i).padStart(3, '0')}.webp`;
const cache = [];
const waiting = new Set();
function load() {
  if (cache.length) return;
  for (let i = 0; i < FRAMES; i++) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => waiting.forEach((fn) => fn(i));
    img.src = src(i);
    cache.push(img);
  }
}
const ready = (img) => img?.complete && img.naturalWidth > 0;
function nearest(i) {
  for (let d = 0; d < FRAMES; d++) {
    if (ready(cache[i - d])) return i - d;
    if (ready(cache[i + d])) return i + d;
  }
  return -1;
}

/** How far an element has travelled through the viewport: 0 as it enters at the bottom, 1 as it leaves at the top. */
export function viewportProgress(el) {
  if (!el) return 0;
  const r = el.getBoundingClientRect();
  return clamp01((innerHeight - r.top) / (innerHeight + r.height));
}

/**
 * <PlumbobCanvas progress={() => 0..1} />           scrubbed by scroll (from → to)
 * <PlumbobCanvas play={{ duration: 2400 }} loop />  plays from → to once, then rocks gently near the end
 * <PlumbobCanvas ending from={30} />            the end-of-page plumbob: plays itself, a slow forward-and-back loop
 * Under reduced motion it shows the `still` frame (default: `to`).
 */
export default function PlumbobCanvas({ progress, play, loop = false, ending = false, from = 0, to = FRAMES - 1, still, className = '', size = 480 }) {
  const ref = useRef(null);
  const shown = useRef(-1);
  const want = useRef(still ?? to);
  const rm = useRef(reducedMotion());

  const draw = (i, force) => {
    const c = ref.current;
    const k = nearest(Math.round(i));
    if (!c || k < 0 || (!force && k === shown.current)) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(cache[k], 0, 0, c.width, c.height);
    shown.current = k;
  };

  // Load when near, redraw as frames arrive
  useEffect(() => {
    const onLoad = (i) => { if (Math.abs(i - want.current) < 3 || shown.current < 0) draw(want.current, true); };
    waiting.add(onLoad);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { load(); io.disconnect(); draw(want.current, true); } }, { rootMargin: '100% 0px' });
    io.observe(ref.current);
    return () => { waiting.delete(onLoad); io.disconnect(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll-driven
  useScrollFrame(() => {
    if (!progress) return;
    want.current = rm.current ? (still ?? to) : from + (to - from) * clamp01(progress());
    draw(want.current);
  });

  // Time-driven: play once, then (optionally) rock between the last frames
  useEffect(() => {
    if (!play) return;
    if (rm.current) { want.current = still ?? to; draw(want.current, true); return; }
    let raf, t0;
    const tick = (t) => {
      t0 ??= t;
      const k = (t - t0) / (play.duration || 2400);
      if (k < 1) want.current = from + (to - from) * (1 - Math.pow(1 - k, 3));
      else if (loop) want.current = to - 4 + Math.sin((t - t0) / 900) * 4; // rock between to-8 and to
      else { want.current = to; draw(to); return; }
      draw(want.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Ending mode, for the plumbob at the very end of a page, where there's no scroll left to drive it.
  // It runs on its own, independent of scroll, hover or clicks: a slow ping-pong through its frames
  // (shards → threads → wireframe → green glass and its spin), a short pause, then back again.
  // Ping-pong rather than a loop, so it never jumps from the last frame to the first.
  useEffect(() => {
    if (!ending) return undefined;
    const el = ref.current;
    if (rm.current) { want.current = 86; draw(86, true); return undefined; } // still: front-facing glass
    const GO = 6500, PAUSE_END = 1400, BACK = 6500, PAUSE_START = 900;
    const CYCLE = GO + PAUSE_END + BACK + PAUSE_START;
    const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2); // smooth in and out
    let raf = 0, visible = false, clock = 0, last = 0;
    want.current = from;
    const frameAt = (ms) => {
      const t = ms % CYCLE;
      if (t < GO) return from + (to - from) * ease(t / GO);
      if (t < GO + PAUSE_END) return to;
      if (t < GO + PAUSE_END + BACK) return to - (to - from) * ease((t - GO - PAUSE_END) / BACK);
      return from;
    };
    const tick = (now) => {
      raf = 0;
      if (!visible) return;
      clock += Math.min(50, now - (last || now)); last = now; // pauses while off screen, resumes where it was
      want.current = frameAt(clock);
      draw(want.current);
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) { last = 0; raf = requestAnimationFrame(tick); }
    });
    io.observe(el);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [ending]); // eslint-disable-line react-hooks/exhaustive-deps

  return <canvas ref={ref} className={`bob-canvas ${className}`} width={size} height={size} aria-hidden="true" />;
}
