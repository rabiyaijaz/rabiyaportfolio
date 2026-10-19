import { useEffect, useRef, useState } from 'react';
import Icon from './icons.jsx';

// Photos from Rabiya's Instagram (@bloheart666), cropped to 4:5 in public/img/insta
// The Canon shot leads, so it sits on top of the resting pile, with the forest and mountain behind it
const ORDER = [3, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11];
const PHOTOS = ORDER.map((n) => `/img/insta/photo-${String(n).padStart(2, '0')}.webp`);
// [top, left, right]: the top print sits in the middle, the other two fan out to either side
const STACK = [{ rot: -3, x: 0 }, { rot: -12, x: -66 }, { rot: 11, x: 66 }];
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The camera card's art: a little pile of polaroids. Moving the pointer across it leaves a trail of
 * photos that pop up and fade; each "Take a shot" (shots++) develops a fresh print on top of the pile.
 */
export default function PhotoTrail({ shots = 0 }) {
  const [top, setTop] = useState(0);
  const [trail, setTrail] = useState([]);
  const last = useRef(null);
  const next = useRef(3);
  const seq = useRef(0);

  // A new shot: the next photo develops on top of the pile
  useEffect(() => { if (shots) setTop((t) => (t + 1) % PHOTOS.length); }, [shots]);

  const onMove = (e) => {
    if (e.pointerType !== 'mouse' || still()) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (last.current && Math.hypot(x - last.current.x, y - last.current.y) < 46) return;
    last.current = { x, y };
    const id = ++seq.current;
    const src = PHOTOS[next.current++ % PHOTOS.length];
    setTrail((t) => [...t.slice(-6), { id, x, y, src, rot: Math.round(Math.random() * 28 - 14) }]);
    setTimeout(() => setTrail((t) => t.filter((p) => p.id !== id)), 1100);
  };

  return (
    <div className="photos" onPointerMove={onMove} onPointerLeave={() => { last.current = null; }}>
      <div className="photos__stack">
        {[2, 1, 0].map((k) => {
          const i = (top + k) % PHOTOS.length;
          return (
            <span key={k === 0 ? `top-${top}-${shots}` : `s-${k}`} className={`polaroid${k === 0 && shots ? ' is-developing' : ''}`} style={{ '--rot': `${STACK[k].rot}deg`, '--x': `${STACK[k].x}px` }}>
              <img src={PHOTOS[i]} alt="" loading="lazy" />
            </span>
          );
        })}
      </div>
      {trail.map((p) => (
        <span key={p.id} className="polaroid polaroid--trail" style={{ left: p.x, top: p.y, '--rot': `${p.rot}deg` }}>
          <img src={p.src} alt="" />
        </span>
      ))}
      <span className="photos__hint" aria-hidden="true"><Icon name="camera" size={13} /> Move across · Take a shot</span>
    </div>
  );
}
