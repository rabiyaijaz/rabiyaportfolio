import { PHASES, usePhase } from '../lib/phase.jsx';
import { Plumbob } from './Logo.jsx';
import { sfx } from '../lib/audio.js';

const LABEL = { day: 'Day', dusk: 'Dusk', night: 'Night' };
const GLYPH = {
  day: <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3.2" fill="currentColor" /><g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M8 1.2v1.6M8 13.2v1.6M1.2 8h1.6M13.2 8h1.6M3.2 3.2l1.1 1.1M11.7 11.7l1.1 1.1M3.2 12.8l1.1-1.1M11.7 4.3l1.1-1.1" /></g></svg>,
  dusk: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 11.5h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M4.2 11.5a3.8 3.8 0 0 1 7.6 0Z" fill="currentColor" /><path d="M2.5 14h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity=".5" /></svg>,
  night: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.8 1.8A6.4 6.4 0 1 0 14.2 11 5.2 5.2 0 0 1 10.8 1.8Z" fill="currentColor" /></svg>,
};

/**
 * The Sims clock, made modern. It starts on the visitor's own time of day;
 * picking another phase re-themes every page (and the 3D street).
 */
export default function PhaseSwitch() {
  const { phase, local, now, choose } = usePhase();
  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return (
    <div className="phase-switch" role="radiogroup" aria-label={`Time of day. Your local time is ${time}, ${LABEL[local].toLowerCase()}.`}>
      <span className="phase-switch__time" aria-hidden="true"><Plumbob size={10} />{time}</span>
      {PHASES.map((p) => (
        <button
          key={p} role="radio" aria-checked={phase === p} onClick={() => { if (p !== phase) sfx('chime', { volume: 0.6 }); choose(p); }}
          className={p === local ? 'is-local' : ''} title={p === local ? `${LABEL[p]} (your time)` : LABEL[p]}
        >
          {GLYPH[p]}<span>{LABEL[p]}</span>
        </button>
      ))}
    </div>
  );
}
