import { useCallback, useEffect, useRef, useState } from 'react';
import { sfx } from '../lib/audio.js';
import ChaiGlass3D from './ChaiGlass3D.jsx';

// Sims 2 style: Rabiya at the stove making doodh patti chai. "Make Chai" goes into an action queue
// (up to 3, click one to cancel, like the game); the running one plays the real recipe step by step.
const DURATION = 7600; // ms for one cup
const STEPS = [
  { at: 0, caption: 'Boiling the water' },
  { at: 0.2, caption: 'Adding the patti' },
  { at: 0.38, caption: 'Pouring in the doodh' },
  { at: 0.56, caption: 'Uballa! Watching it rise' },
  { at: 0.74, caption: 'Pouring a cup' },
  { at: 0.96, caption: 'Chai’s ready' },
];
const MAX_QUEUE = 3;
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// colour helpers: water → dark tea → doodh patti caramel
const mix = (a, b, k) => {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',')})`;
};
const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));

export default function ChaiStove({ orders = 0, onDone }) {
  const [queue, setQueue] = useState([]); // ids
  const [p, setP] = useState(0); // progress of the running cup, 0..1
  const [served, setServed] = useState(0);
  const [glass3d, setGlass3d] = useState(false);
  const seq = useRef(0);
  const t0 = useRef(null);
  const poured = useRef(false);
  const done = useRef(onDone);
  done.current = onDone;

  const enqueue = useCallback(() => {
    setQueue((q) => (q.length >= MAX_QUEUE ? q : [...q, ++seq.current]));
    sfx('open', { volume: 0.5 });
  }, []);
  // The card's "Make chai" button orders a cup
  useEffect(() => { if (orders) enqueue(); }, [orders, enqueue]);

  // Run the first action in the queue
  const running = queue[0];
  useEffect(() => {
    if (!running) return;
    t0.current = performance.now(); poured.current = false;
    const dur = still() ? 1800 : DURATION;
    let raf;
    const tick = (now) => {
      const k = Math.min(1, (now - t0.current) / dur);
      setP(k);
      if (k >= 0.74 && !poured.current) { poured.current = true; sfx('splash', { volume: 0.5 }); }
      if (k < 1) raf = requestAnimationFrame(tick);
      else {
        setServed((n) => n + 1);
        done.current?.();
        setTimeout(() => { setQueue((q) => q.slice(1)); setP(0); }, 900);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancel = (id) => {
    if (id === running) { setQueue((q) => q.slice(1)); setP(0); } else setQueue((q) => q.filter((x) => x !== id));
    sfx('toggle', { volume: 0.5 });
  };

  // ---- the scene, derived from progress
  const busy = !!running;
  const boil = busy && p < 0.74;
  const tea = p < 0.2 ? '#cfe1e6' : p < 0.38 ? mix('#cfe1e6', '#4a2412', seg(p, 0.2, 0.36)) : mix('#4a2412', '#c4894f', seg(p, 0.38, 0.54));
  const leaves = seg(p, 0.2, 0.34);
  const patti = p >= 0.18 && p < 0.36; // the Danedar jar is tipped
  const milk = p >= 0.38 && p < 0.56;   // the Nurpur pack is tipped
  const milkFlow = p >= 0.41 && p < 0.54; // (pours once it has arrived)
  const foam = p >= 0.56 && p < 0.76 ? Math.sin(seg(p, 0.56, 0.74) * Math.PI) : 0;
  const tilt = p >= 0.74 ? Math.sin(seg(p, 0.74, 0.97) * Math.PI) * 30 : 0;
  const pouring = p >= 0.76 && p < 0.94;
  const cup = busy ? seg(p, 0.77, 0.93) : served ? 1 : 0;
  const flame = busy ? (foam > 0 ? 1 + foam * 0.6 : 1) : 0;
  const step = busy ? [...STEPS].reverse().find((s) => p >= s.at) : null;

  return (
    <div className={`chai${busy ? ' is-busy' : ''}`}>
      <svg className="chai__scene" viewBox="0 0 320 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="chai-steel" x1="0" x2="1"><stop offset="0" stopColor="#9aa1aa" /><stop offset=".35" stopColor="#e4e8ec" /><stop offset="1" stopColor="#7d848d" /></linearGradient>
          <linearGradient id="chai-wood" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#b07a4f" /><stop offset=".12" stopColor="#8a5a3a" /><stop offset="1" stopColor="#5e3b25" /></linearGradient>
          <pattern id="chai-tiles" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" fill="none" stroke="#fff" strokeOpacity=".28" /></pattern>
          <clipPath id="chai-glass"><path d="M270 96h28l-3 22h-22z" /></clipPath>
        </defs>
        <rect width="320" height="118" fill="url(#chai-tiles)" />

        {/* Rabiya, her plumbob, and a thought bubble when she's idle */}
        <image href="/img/portrait-160.webp" x="22" y="20" width="96" height="120" />
        <g className="chai__plumbob"><path d="M70 2 76 11 70 20 64 11Z" fill="#5fe08a" /><path d="M70 2 76 11H64Z" fill="#fff" opacity=".35" /></g>
        {!busy && (
          <g className="chai__thought">
            <circle cx="112" cy="40" r="3" fill="#fff" /><circle cx="119" cy="31" r="4.5" fill="#fff" />
            <ellipse cx="138" cy="18" rx="17" ry="13" fill="#fff" />
            <path d="M131 14h12v5a6 6 0 0 1-12 0Z" fill="#c4894f" stroke="#5e3b25" strokeWidth="1.2" /><path d="M143 15.5h2a2 2 0 0 1 0 4h-2" fill="none" stroke="#5e3b25" strokeWidth="1.2" />
          </g>
        )}

        {/* counter and stove */}
        <rect y="118" width="320" height="32" fill="url(#chai-wood)" />
        <rect x="150" y="112" width="102" height="8" rx="2" fill="#2a2b31" />
        <g className="chai__flame" style={{ opacity: flame ? 1 : 0, transform: `scaleY(${flame || 1})` }}>
          <path d="M184 112c3-5 2-8 5-10 0 4 3 5 3 10z M196 112c2-6 4-8 5-11 1 5 3 6 3 11z M208 112c3-4 2-7 5-9 0 4 3 5 3 9z" fill="#4fa3ff" />
          <path d="M187 112c2-3 2-5 3-6 0 3 2 4 2 6z M199 112c1-3 3-5 3-7 1 3 2 4 2 7z M211 112c2-3 2-5 3-6 0 3 2 4 2 6z" fill="#ffb347" />
        </g>

        {/* The shelf: Tapal Danedar and Nurpur, the real ones. They breathe while they wait, then
            each lifts and tips into the patila on its step (patti, then doodh) */}
        <rect x="162" y="56" width="82" height="3.5" rx="1" fill="#7a5032" />
        <path d="M170 59.5v5h3M236 59.5v5h-3" fill="none" stroke="#5e3b25" strokeWidth="1.4" />
        <g className={`chai__item${patti ? ' is-pouring' : ''}`} style={{ transform: patti ? 'translate(2.5px, -5.5px) rotate(120deg)' : 'none' }}>
          <image className="chai__breathe" href="/img/chai/danedar.webp" x="170" y="21" width="17" height="35" />
        </g>
        <g className={`chai__item${milk ? ' is-pouring' : ''}`} style={{ transform: milk ? 'translate(3px, 12.5px) rotate(-100deg)' : 'none' }}>
          <image className="chai__breathe" href="/img/chai/nurpur.webp" x="216" y="26" width="17.5" height="30" style={{ animationDelay: '-1.6s' }} />
        </g>

        {/* patti dropping in from the jar */}
        {leaves > 0.15 && leaves < 1 && [0, 1, 2].map((i) => (
          <ellipse key={i} cx={194 + i * 4} cy={44 + leaves * 34 + i * 4} rx="2" ry="1.2" fill="#2f1a0e" transform={`rotate(${30 + i * 40} ${194 + i * 4} ${44 + leaves * 34 + i * 4})`} />
        ))}
        {/* doodh pouring from the Nurpur pack */}
        {milkFlow && <path d="M214 62 Q208 70 206 81" fill="none" stroke="#fbfbf8" strokeWidth="2.6" strokeLinecap="round" className="chai__stream" />}

        {/* the patila: tilts toward the glass to pour */}
        <g style={{ transform: `rotate(${tilt}deg)`, transformOrigin: '232px 80px' }}>
          <rect x="138" y="84" width="32" height="5" rx="2.5" fill="#3a3a40" />
          <path d="M168 80h64v24a6 6 0 0 1-6 6h-52a6 6 0 0 1-6-6z" fill="url(#chai-steel)" />
          <ellipse cx="200" cy="81" rx="31" ry="5" fill={busy || served ? tea : '#cfe1e6'} />
          {foam > 0 && <ellipse cx="200" cy={81 - foam * 7} rx={31 + foam * 2} ry={5 + foam * 5} fill="#f0d6b4" opacity=".95" />}
          <ellipse cx="200" cy="80" rx="32" ry="5.4" fill="none" stroke="#b9bfc6" strokeWidth="1.5" />
          {boil && [0, 1, 2, 3].map((i) => <circle key={i} className="chai__bubble" cx={186 + i * 9} cy="81" r="1.8" fill="#fff" opacity=".8" style={{ animationDelay: `${i * 0.18}s` }} />)}
        </g>
        {pouring && <path d={glass3d ? 'M236 86 Q266 70 283 76' : 'M236 86 Q262 82 283 99'} fill="none" stroke={tea} strokeWidth="3" strokeLinecap="round" className="chai__stream" />}

        {/* the cutting-chai glass: a real 3D model when WebGL is available, a drawing otherwise */}
        <foreignObject x="250" y="58" width="66" height="64">
          <ChaiGlass3D fill={cup} onReady={() => setGlass3d(true)} />
        </foreignObject>
        {!glass3d && (
          <>
            <path d="M270 96h28l-3 22h-22z" fill="#fff" fillOpacity=".35" />
            <g clipPath="url(#chai-glass)">
              <rect x="268" y={118 - cup * 20} width="32" height="22" fill="#9a5a2c" />
              <rect x="268" y={118 - cup * 20} width="32" height="2.2" fill="#e8c49a" opacity={cup ? 0.9 : 0} />
            </g>
            <path d="M270 96h28l-3 22h-22z" fill="none" stroke="#4a2c18" strokeOpacity=".7" strokeWidth="1.3" />
            <path d="M273 99l-1.4 15" stroke="#fff" strokeOpacity=".75" strokeWidth="1.4" strokeLinecap="round" />
          </>
        )}
        {cup >= 1 && (
          <g className="chai__steam" transform={glass3d ? 'translate(0 -22)' : undefined}>
            <path d="M278 92c-3-4 3-6 0-10M285 92c-3-4 3-6 0-10M292 92c-3-4 3-6 0-10" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          </g>
        )}
      </svg>

      {/* Sims 2 action queue */}
      <ol className="chai__queue" aria-label="Action queue">
        {queue.map((id, i) => (
          <li key={id}>
            <button type="button" onClick={() => cancel(id)} className={i === 0 ? 'is-running' : ''} style={i === 0 ? { '--p': p } : undefined} aria-label={i === 0 ? 'Making chai, click to cancel' : 'Queued: make chai, click to cancel'}>
              <span aria-hidden="true">☕</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="chai__caption" aria-live="polite">{step ? <><b>Rabiya</b> · {step.caption}</> : served ? `${served} cup${served > 1 ? 's' : ''} made · Chai Tank full` : 'Click the stove to make chai'}</p>
      {p >= 0.96 && <span className="chai__plus" aria-hidden="true">+ Chai Tank</span>}
      <button type="button" className="chai__stove" onClick={enqueue} aria-label="Stove: make chai" />
    </div>
  );
}
