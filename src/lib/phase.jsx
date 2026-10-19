import { createContext, useContext, useEffect, useState } from 'react';
import { phaseForHour } from '../world/scene.js';

// The Sims clock, made modern: the site's mood follows the visitor's local time,
// and anyone can switch it (Day / Dusk / Night) from the switch on every page.
const PhaseContext = createContext(null);
export const usePhase = () => useContext(PhaseContext);

export const PHASES = ['day', 'dusk', 'night'];

export function PhaseProvider({ children }) {
  const [now, setNow] = useState(() => new Date());
  const [override, setOverride] = useState(null);
  const local = phaseForHour(now.getHours());
  const phase = override || local;

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { document.documentElement.dataset.phase = phase; }, [phase]);

  /** Pick a phase; picking the visitor's own local phase goes back to following their clock. */
  const choose = (p) => setOverride(p === local ? null : p);
  return <PhaseContext.Provider value={{ phase, local, now, choose, isOverride: !!override }}>{children}</PhaseContext.Provider>;
}
