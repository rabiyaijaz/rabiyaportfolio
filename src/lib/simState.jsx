import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { NEEDS, VISITOR_WANTS } from '../content/about.js';
import { sfx } from './audio.js';

// Site-wide "live mode": Rabiya's needs drain slowly while you browse, and the
// things you do (read a case study, download the CV, say hi…) fulfil her wants.
const SimContext = createContext(null);
export const useSim = () => useContext(SimContext);

const KEY = 'rn.sim.v1';
const load = () => { try { return JSON.parse(sessionStorage.getItem(KEY)); } catch { return null; } };

export function SimProvider({ children }) {
  const saved = load();
  const [needs, setNeeds] = useState(() => NEEDS.map((n) => ({ ...n, value: saved?.needs?.[n.id] ?? n.value })));
  const [wants, setWants] = useState(() => saved?.wants || {});
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify({ needs: Object.fromEntries(needs.map((n) => [n.id, n.value])), wants })); } catch { /* ignore */ }
  }, [needs, wants]);

  const toast = useCallback((t) => {
    sfx(t.kind === 'want' ? 'want' : t.kind === 'skill' ? 'skill' : 'chime', { volume: 0.8 });
    const id = ++toastId.current;
    setToasts((ts) => [...ts.slice(-2), { id, ...t }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4200);
  }, []);

  const boost = useCallback((id, gain) => {
    setNeeds((ns) => ns.map((n) => (n.id === id ? { ...n, value: Math.min(100, n.value + gain) } : n)));
  }, []);

  const fulfil = useCallback((id) => {
    setWants((w) => {
      if (w[id]) return w;
      const want = VISITOR_WANTS.find((x) => x.id === id);
      if (want) toast({ kind: 'want', title: 'Want fulfilled', body: want.label });
      return { ...w, [id]: true };
    });
  }, [toast]);

  // Game speed, as in the Sims clock: 0 pause, 1 normal, 2 fast, 3 ultra. It sets how fast needs drain.
  const [speed, setSpeed] = useState(1);
  // Needs drain gently (paused for reduced motion and hidden tabs)
  useEffect(() => {
    if (speed === 0 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => {
      if (document.hidden) return;
      setNeeds((ns) => ns.map((n) => ({ ...n, value: Math.max(5, +(n.value - n.drain * speed).toFixed(1)) })));
    }, 4000);
    return () => clearInterval(t);
  }, [speed]);

  // CV downloads and emails anywhere on the site count as wants
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest?.('a');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (href.endsWith('.pdf')) fulfil('cv');
      if (href.startsWith('mailto:')) { fulfil('letter'); boost('social', 20); }
    };
    addEventListener('click', onClick);
    return () => removeEventListener('click', onClick);
  }, [fulfil, boost]);

  const mood = needs.reduce((s, n) => s + n.value, 0) / needs.length;
  const value = { needs, wants, mood, boost, fulfil, toast, speed, setSpeed };

  return (
    <SimContext.Provider value={value}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.kind || 'info'}`}>
            <span className="toast__icon" aria-hidden="true">{t.kind === 'want' ? '✓' : t.kind === 'skill' ? '▲' : '◆'}</span>
            <span><strong>{t.title}</strong>{t.body && <span>{t.body}</span>}</span>
          </div>
        ))}
      </div>
    </SimContext.Provider>
  );
}

export const moodLabel = (m) => (m >= 72 ? 'Inspired' : m >= 52 ? 'Doing fine' : m >= 35 ? 'Could use a break' : 'Needs chai, urgently');
export const moodColor = (m) => (m >= 60 ? 'var(--accent)' : m >= 38 ? '#f2c94c' : 'var(--low)');
