import { useState } from 'react';

// Small marks for the orgs on the About and Resume pages. Simplified drawings, not official artwork:
// community orgs get a recognisable shape, companies a monogram in their product colour.
const MONO = {
  crewnity: ['C', '#1f6b3f'],
  vettio: ['V', '#3e4cb6'],
  flownet: ['F', '#2f6f8f'],
  cystercare: ['Cc', '#6a4fd8'],
  conceptfreaks: ['CF', '#b5432f'],
  apptex: ['A', '#d9822b'],
  tyut: ['T', '#1f8a8a'],
};

const MARKS = {
  // Google Developer clubs: the coloured angle brackets
  gdsc: (
    <svg viewBox="0 0 40 40">
      <path d="M15 11 5.5 17.5a3 3 0 0 0 0 5L15 29" fill="none" stroke="#ea4335" strokeWidth="5" strokeLinecap="round" />
      <path d="M15 11 5.5 17.5" fill="none" stroke="#4285f4" strokeWidth="5" strokeLinecap="round" />
      <path d="m25 11 9.5 6.5a3 3 0 0 1 0 5L25 29" fill="none" stroke="#34a853" strokeWidth="5" strokeLinecap="round" />
      <path d="m25 29 9.5-6.5" fill="none" stroke="#fbbc04" strokeWidth="5" strokeLinecap="round" />
    </svg>
  ),
  // Microsoft Learn ambassadors: four squares
  mlsa: (
    <svg viewBox="0 0 40 40">
      <rect x="8" y="8" width="11" height="11" fill="#f25022" /><rect x="21" y="8" width="11" height="11" fill="#7fba00" />
      <rect x="8" y="21" width="11" height="11" fill="#00a4ef" /><rect x="21" y="21" width="11" height="11" fill="#ffb900" />
    </svg>
  ),
  // Lincoln Corner: a columned building
  lincoln: (
    <svg viewBox="0 0 40 40" fill="#2b3a67">
      <path d="M20 6 6 13v3h28v-3Z" /><rect x="9" y="18" width="3.4" height="12" rx="1" /><rect x="15.2" y="18" width="3.4" height="12" rx="1" />
      <rect x="21.4" y="18" width="3.4" height="12" rx="1" /><rect x="27.6" y="18" width="3.4" height="12" rx="1" /><rect x="6" y="31" width="28" height="3" rx="1" />
    </svg>
  ),
  // Banao: the brick B with its loose gold brick
  banao: (
    <svg viewBox="0 0 40 40">
      {[[10, 7], [16, 7], [22, 7], [10, 13], [26, 13], [10, 19], [16, 19], [22, 19], [10, 25], [26, 25], [10, 31], [16, 31], [22, 31]].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="5" height="5" rx="1.4" fill="#144a30" />
      ))}
      <rect x="27" y="4.5" width="5" height="5" rx="1.4" fill="#cdb878" transform="rotate(14 29.5 7)" />
    </svg>
  ),
  school: (
    <svg viewBox="0 0 40 40"><path d="M20 9 4 16l16 7 16-7Z" fill="#15201a" /><path d="M10 19v7c0 2.5 4.5 5 10 5s10-2.5 10-5v-7l-10 4.4Z" fill="#15201a" opacity=".75" /><path d="M34 16v9" stroke="#15201a" strokeWidth="2" strokeLinecap="round" /></svg>
  ),
};

// Real logo files live in public/img/logos/<name>.webp (made by scripts/optimize.mjs from assets-raw/logos).
// Each one is tried first; a missing file falls back to the drawing or monogram below.
// (Banao uses its crisp drawn brick B below rather than its blurry file.)
const HAS_FILE = new Set(['vettio', 'cystercare', 'crewnity', 'flownet', 'apptex', 'tyut', 'gdsc', 'mlsa', 'lincoln']);

export default function OrgLogo({ name, size = 44 }) {
  const [broken, setBroken] = useState(false);
  if (HAS_FILE.has(name) && !broken) {
    return (
      <span className="org-logo" style={{ width: size, height: size }} aria-hidden="true">
        <img src={`/img/logos/${name}.webp`} alt="" onError={() => setBroken(true)} />
      </span>
    );
  }
  if (MARKS[name]) return <span className="org-logo" style={{ width: size, height: size }} aria-hidden="true">{MARKS[name]}</span>;
  const [txt, c] = MONO[name] || ['•', '#15201a'];
  return (
    <span className="org-logo org-logo--mono" style={{ width: size, height: size, '--c': c, fontSize: size * (txt.length > 1 ? 0.34 : 0.44) }} aria-hidden="true">{txt}</span>
  );
}
