import { useState } from 'react';
import { BRANDS } from './brandIcons.js';

// Which mark each tool uses: a simple-icons brand, or a logo file dropped in assets-raw/logos.
const TOOLS = {
  Figma: { brand: 'figma' }, 'Figma Make': { brand: 'figma' }, Miro: { brand: 'miro' }, Hotjar: { brand: 'hotjar' },
  Framer: { brand: 'framer' }, Webflow: { brand: 'webflow' }, Claude: { brand: 'claude' }, Codex: { brand: 'openai' }, Tailwind: { brand: 'tailwind' },
  'shadcn/ui': { brand: 'shadcn' }, HTML: { brand: 'html5' }, CSS: { brand: 'css3' }, Python: { brand: 'python' },
  Lovable: { file: 'lovable' }, UserTesting: { file: 'usertesting' }, Antigravity: { file: 'antigravity' },
};

/** A tool's real mark on a white chip; tools without one yet show their initials. */
export default function ToolIcon({ name, size = 24 }) {
  const [broken, setBroken] = useState(false);
  const t = TOOLS[name] || {};
  const b = t.brand && BRANDS[t.brand];
  let inner;
  if (b) inner = <svg viewBox="0 0 24 24" width="62%" height="62%"><path d={b.path} fill={b.hex} /></svg>;
  else if (t.file && !broken) inner = <img src={`/img/logos/${t.file}.webp`} alt="" onError={() => setBroken(true)} />;
  else inner = <span className="tool-icon__mono">{name.replace(/[^A-Za-z]/g, '').slice(0, 2)}</span>;
  return <span className="tool-icon" style={{ width: size, height: size }} aria-hidden="true">{inner}</span>;
}
