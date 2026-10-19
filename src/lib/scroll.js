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
