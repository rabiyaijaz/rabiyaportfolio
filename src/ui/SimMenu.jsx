import { useEffect, useRef } from 'react';

/** Modern pie menu around the Sim (the Sims pie menu, rethought): options sit on an oval ring,
 *  starting at the top and going clockwise. */
export default function SimMenu({ x, y, items, onClose, label = 'Rabiya' }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.querySelector('button')?.focus();
    const onDown = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const t = setTimeout(() => addEventListener('pointerdown', onDown), 0);
    addEventListener('keydown', onKey);
    return () => { clearTimeout(t); removeEventListener('pointerdown', onDown); removeEventListener('keydown', onKey); };
  }, [onClose]);
  const narrow = innerWidth < 560;
  const rx = narrow ? 105 : 175, ry = narrow ? 150 : 112;
  const cx = Math.min(innerWidth - rx - 80, Math.max(rx + 80, x));
  const cy = Math.min(innerHeight - ry - 40, Math.max(ry + 40, y));
  return (
    <div className="sim-menu" style={{ left: cx, top: cy }} role="menu" aria-label={label} ref={ref}>
      {items.map((it, i) => {
        const a = (-90 + (i * 360) / items.length) * (Math.PI / 180);
        return (
          <button key={it.label} role="menuitem" style={{ '--i': i, '--x': `${Math.cos(a) * rx}px`, '--y': `${Math.sin(a) * ry}px` }} onClick={() => { onClose(); it.onSelect(); }}>
            {it.icon && <span className="sim-menu__icon" aria-hidden="true">{it.icon}</span>}{it.label}
          </button>
        );
      })}
    </div>
  );
}
