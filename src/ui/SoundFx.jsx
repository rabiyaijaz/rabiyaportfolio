import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { initAudio, sfx } from '../lib/audio.js';

// Game-feel sounds across the whole site, wired by delegation so every page gets them:
// a tap on anything clickable, a faint tick when hovering primary targets, a whoosh between pages.
const CLICKABLE = 'a, button, [role="tab"], [role="radio"], [role="switch"], summary, label';
const HOVERABLE = '.button, .ghost-button, .pin, .topnav a, .card > a, .hud-tabs button, .hud-dial a, .hud-dial button, .journey__filters button, .filters button, .process__steps button, .flow__rail button, .phase-switch button';

export default function SoundFx() {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => { initAudio(); }, []);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    sfx('whoosh', { volume: 0.7 });
  }, [pathname]);

  useEffect(() => {
    let lastHover = null, lastT = 0;
    const onDown = (e) => {
      const el = e.target.closest?.(CLICKABLE);
      if (!el || el.disabled || el.closest('.sound')) return;
      sfx(el.closest('.hud-tabs, .dock, .journey__filters, .filters, .process__steps, .flow__rail') ? 'open' : 'tap');
    };
    const onOver = (e) => {
      if (e.pointerType !== 'mouse') return;
      const el = e.target.closest?.(HOVERABLE);
      const now = performance.now();
      if (!el || el === lastHover || now - lastT < 70) return;
      lastHover = el; lastT = now;
      sfx('hover');
    };
    const onOut = (e) => { if (e.target.closest?.(HOVERABLE) === lastHover && !lastHover?.contains(e.relatedTarget)) lastHover = null; };
    addEventListener('pointerdown', onDown, true);
    addEventListener('pointerover', onOver, true);
    addEventListener('pointerout', onOut, true);
    return () => { removeEventListener('pointerdown', onDown, true); removeEventListener('pointerover', onOver, true); removeEventListener('pointerout', onOut, true); };
  }, []);
  return null;
}
