import { useState } from 'react';
import { PROFILE } from '../content/projects.js';
import { useSim } from '../lib/simState.jsx';
import { BRANDS } from './brandIcons.js';

/** LinkedIn, Behance, Upwork and Discord as icon pills. `compact` shows icons only.
 *  Discord has no public profile link by username, so its pill copies the username. */
export default function Socials({ compact = false, className = '' }) {
  const { toast } = useSim();
  const [copied, setCopied] = useState(null);
  const copy = async (s) => {
    try { await navigator.clipboard.writeText(s.copy); } catch { /* clipboard blocked: the toast still shows the name */ }
    setCopied(s.id); setTimeout(() => setCopied(null), 1800);
    toast({ title: `${s.label} username copied`, body: `Add ${s.copy} on ${s.label} and say hi.` });
  };
  return (
    <ul className={`socials${compact ? ' socials--compact' : ''} ${className}`} aria-label="Find me on">
      {PROFILE.socials.map((s) => {
        const b = BRANDS[s.id];
        const icon = b && <svg viewBox="0 0 24 24" aria-hidden="true"><path d={b.path} fill="currentColor" /></svg>;
        return (
          <li key={s.id}>
            {s.copy ? (
              <button type="button" onClick={() => copy(s)} style={{ '--brand': b?.hex }} className={copied === s.id ? 'is-copied' : ''}
                aria-label={`${s.label}: ${s.copy}. Copy username`} title={`${s.label}: ${s.copy}`}>
                {icon}
                {!compact && <span>{copied === s.id ? 'Copied!' : s.copy} <span aria-hidden="true">{copied === s.id ? '✓' : '⧉'}</span></span>}
              </button>
            ) : (
              <a href={s.href} target="_blank" rel="noreferrer" aria-label={compact ? `${s.label} (opens in a new tab)` : undefined} style={{ '--brand': b?.hex }}>
                {icon}
                {!compact && <span>{s.label} <span aria-hidden="true">↗</span></span>}
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}
