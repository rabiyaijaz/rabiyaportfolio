import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { search } from '../content/search.js';
import { sfx } from '../lib/audio.js';
import '../search.css';

/**
 * Quick search, everywhere: the search pill in the nav, Ctrl/⌘+K, "/" or Ctrl/⌘+F.
 * (Ctrl+F opens this the first time; pressed again with the search open, it hands over to the browser's own find.)
 * Before anything is typed it suggests what recruiters usually look for. ↑ ↓ to move, Enter to go, Esc to close.
 */
export function SearchButton() {
  return (
    <button type="button" className="search-pill" onClick={() => openSearch()} aria-label="Search the portfolio (Ctrl+K)" aria-keyshortcuts="Control+K">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
      <span className="search-pill__text">Search</span>
      <kbd className="search-pill__kbd">{isMac() ? '⌘' : 'Ctrl'} K</kbd>
    </button>
  );
}

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const OPEN = 'rn:search';
export const openSearch = (q = '') => dispatchEvent(new CustomEvent(OPEN, { detail: q }));

export default function SearchPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const openRef = useRef(false);
  openRef.current = open;

  const results = useMemo(() => search(q), [q]);
  useEffect(() => setSel(0), [q]);

  // the shortcuts, page-wide
  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o); return; }
      // Ctrl+F: ours first; a second press while open is the browser's find
      if (mod && e.key.toLowerCase() === 'f' && !e.shiftKey && !e.altKey) {
        if (openRef.current) { setOpen(false); return; }
        e.preventDefault(); setOpen(true); return;
      }
      if (e.key === '/' && !typing && !openRef.current) { e.preventDefault(); setOpen(true); }
    };
    const onOpen = (e) => { setQ(e.detail || ''); setOpen(true); };
    addEventListener('keydown', onKey);
    addEventListener(OPEN, onOpen);
    return () => { removeEventListener('keydown', onKey); removeEventListener(OPEN, onOpen); };
  }, []);

  useEffect(() => {
    if (!open) return;
    sfx('open', { volume: 0.5 });
    const back = document.activeElement;
    requestAnimationFrame(() => { inputRef.current?.focus(); inputRef.current?.select(); });
    return () => { back?.focus?.(); };
  }, [open]);

  // keep the highlighted row in view
  useEffect(() => { listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }); }, [sel, open]);

  const go = (it) => {
    if (!it) return;
    setOpen(false); setQ('');
    sfx('tap', { volume: 0.6 });
    if (it.href) {
      const a = document.createElement('a');
      a.href = it.href;
      if (it.download) a.download = '';
      if (it.external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      a.click();
      return;
    }
    navigate(it.to);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[sel]); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  };

  if (!open) return null;
  // results come grouped, in the order they first appear
  let last = null;
  return createPortal(
    <div className="search" role="presentation" onPointerDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="search__box" role="dialog" aria-modal="true" aria-label="Search the portfolio">
        <div className="search__field">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
          <input
            ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKeyDown}
            placeholder="Search projects, skills, references, the CV…" aria-label="Search" spellCheck={false}
            role="combobox" aria-expanded="true" aria-controls="search-results" aria-activedescendant={results[sel] ? `sr-${sel}` : undefined}
          />
          <button type="button" className="search__esc" onClick={() => setOpen(false)}>Esc</button>
        </div>
        <ul className="search__list" id="search-results" role="listbox" ref={listRef} aria-label={q ? 'Results' : 'Suggested'}>
          {!q && <li className="search__group" role="presentation">Suggested</li>}
          {results.map((it, i) => {
            const head = q && it.group !== last ? <li className="search__group" role="presentation" key={`g-${it.group}-${i}`}>{it.group}</li> : null;
            last = it.group;
            return [head,
              <li key={it.title + i} id={`sr-${i}`} role="option" aria-selected={i === sel} className="search__item"
                onPointerMove={() => setSel(i)} onClick={() => go(it)}>
                <span className="search__title">{it.title}</span>
                {it.sub && <span className="search__sub">{it.sub}</span>}
                <span className="search__go" aria-hidden="true">{it.href ? (it.download ? '↓' : '↗') : '↵'}</span>
              </li>];
          })}
          {q && !results.length && (
            <li className="search__empty" role="presentation">
              Nothing for “{q}”. Try “references”, “skills”, “CV” or a project name, or <button type="button" onClick={() => { setOpen(false); navigate('/contact'); }}>ask her directly</button>.
            </li>
          )}
        </ul>
        <p className="search__foot" aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> move · <kbd>↵</kbd> open · <kbd>Esc</kbd> close · <kbd>{isMac() ? '⌘' : 'Ctrl'} F</kbd> twice for the browser’s find</p>
      </div>
    </div>,
    document.body,
  );
}
