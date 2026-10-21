import { useEffect, useRef } from 'react';

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
/** 0 → 1 as x moves from a to b. */
export const seg = (x, a, b) => clamp01((x - a) / (b - a));
export const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** How far a tall (sticky) section has been scrolled through: 0 at its top, 1 when its end reaches the viewport bottom. */
export function progressOf(el) {
  if (!el) return 0;
  const r = el.getBoundingClientRect();
  const run = r.height - innerHeight;
  return run > 0 ? clamp01(-r.top / run) : clamp01(1 - r.bottom / (innerHeight + r.height));
}

/**
 * Glide the page to `top`, then call `done`. Our own easing instead of scrollTo({ behavior: 'smooth' }), which
 * on this page sometimes stalls after a pixel (the 3D scene keeps the main thread busy), so buttons seemed dead.
 * Always lands: if frames are throttled it jumps to the end on a timer. A wheel, touch or key from the
 * visitor hands control back to them. Instant under reduced motion.
 */
let glide = null;
export function glideTo(top, done) {
  glide?.stop();
  top = Math.max(0, Math.min(top, document.documentElement.scrollHeight - innerHeight));
  const from = scrollY, dist = top - from;
  if (reducedMotion() || Math.abs(dist) < 2) { scrollTo(0, top); done?.(); return; }
  const ms = Math.min(1400, 500 + Math.abs(dist) * 0.25), t0 = performance.now();
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  let raf = 0, over = false;
  const finish = () => { if (over) return; stop(); scrollTo(0, top); done?.(); };
  const stop = () => { over = true; cancelAnimationFrame(raf); clearTimeout(timer); USER.forEach((e) => removeEventListener(e, stop)); glide = null; };
  const step = (now) => { const k = Math.min(1, (now - t0) / ms); scrollTo(0, from + dist * ease(k)); if (k < 1) raf = requestAnimationFrame(step); else finish(); };
  const timer = setTimeout(finish, ms + 400);
  USER.forEach((e) => addEventListener(e, stop, { passive: true }));
  raf = requestAnimationFrame(step);
  glide = { stop };
}
const USER = ['wheel', 'touchstart', 'keydown'];

/**
 * Calls fn once per animation frame while the page scrolls or resizes (and once on mount).
 * fn gets no arguments; read whatever geometry you need inside it. Never re-renders React.
 */
export function useScrollFrame(fn, deps = []) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    let queued = false;
    const tick = () => { queued = false; fnRef.current(); };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(tick); } };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    queue();
    return () => { removeEventListener('scroll', queue); removeEventListener('resize', queue); };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}
