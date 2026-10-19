import { useEffect, useRef, useState } from 'react';
import { reducedMotion } from '../lib/scroll.js';

/**
 * The landing page's "keep going" guide: a chapter rail on the right that fills as you scroll
 * (each dot jumps to its chapter), and a nudge naming the next chapter whenever the visitor stops.
 * `chapters`: [{ id, label, at: () => the scroll position where the chapter starts }]. `hidden` while walking the street or in the prologue.
 */
export default function PageGuide({ chapters, hidden }) {
  const [cur, setCur] = useState(0);
  const [idle, setIdle] = useState(false);
  const fill = useRef(null);

  useEffect(() => {
    let t, raf = 0;
    const read = () => {
      raf = 0;
      // A chapter counts as reached a little before its scroll target, once it's well into view
      let i = 0;
      chapters.forEach((c, k) => { if (c.at() - innerHeight * 0.35 <= scrollY) i = k; });
      // At the very bottom the last chapter is the current one, even if it's short
      if (scrollY + innerHeight >= document.documentElement.scrollHeight - 4) i = chapters.length - 1;
      setCur(i);
      const max = document.documentElement.scrollHeight - innerHeight;
      fill.current?.style.setProperty('--fill', String(max > 0 ? Math.min(1, scrollY / max) : 0));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
      setIdle(false);
      clearTimeout(t);
      t = setTimeout(() => setIdle(true), 2600);
    };
    read();
    t = setTimeout(() => setIdle(true), 1500);
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); clearTimeout(t); cancelAnimationFrame(raf); };
  }, [chapters]);

  const go = (i) => scrollTo({ top: chapters[i].at(), behavior: reducedMotion() ? 'auto' : 'smooth' });
  const next = chapters[cur + 1];

  return (
    <div className={`pguide${hidden ? ' is-hidden' : ''}`}>
      <nav className="pguide__rail" aria-label="Home page sections" ref={fill}>
        <span className="pguide__track" aria-hidden="true"><i /></span>
        <ol>
          {chapters.map((c, i) => (
            <li key={c.id} className={i === cur ? 'is-on' : i < cur ? 'is-past' : ''}>
              <button onClick={() => go(i)} aria-current={i === cur ? 'step' : undefined}>
                <span className="pguide__label">{c.label}</span><span className="pguide__dot" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
      </nav>
      {next && (
        <button className={`pguide__nudge${idle ? ' is-on' : ''}`} onClick={() => go(cur + 1)} tabIndex={idle ? 0 : -1} aria-hidden={!idle}>
          <span className="pguide__mouse" aria-hidden="true"><span /></span>
          <span><small>Keep scrolling</small>Next: {next.label}</span>
          <span className="pguide__chev" aria-hidden="true">↓</span>
        </button>
      )}
    </div>
  );
}
