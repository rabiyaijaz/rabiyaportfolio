import { useEffect, useRef, useState } from 'react';
import { glideTo } from '../lib/scroll.js';

/**
 * The landing page's "keep going" guide: a chapter rail on the right that fills as you scroll
 * (each dot jumps to its chapter), and a nudge naming the next chapter whenever the visitor stops.
 * `chapters`: [{ id, label, at: () => the scroll position where the chapter starts }]. `hidden` while walking the street or in the prologue.
 * `onPlay`: starts the street game; through the first two chapters (street, map) a bar offers it beside "Keep scrolling".
 */
export default function PageGuide({ chapters, hidden, onPlay, choiceWhile }) {
  const [cur, setCur] = useState(0);
  const [idle, setIdle] = useState(false);
  const [top, setTop] = useState(true); // still on the hero, before any scrolling
  const [inHood, setInHood] = useState(true); // the street/map section still fills the screen
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
      setTop(scrollY < innerHeight * 0.12);
      setInHood(choiceWhile ? choiceWhile() : i <= 1);
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

  const go = (i) => glideTo(chapters[i].at());
  const next = chapters[cur + 1];
  const choice = cur <= 1 && inHood && !!next; // the street and the map: offer play or scroll

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
      {/* Through the street and the map: one bar, bottom centre, with the two ways on.
          Play the game (walk the street) or keep scrolling (the rest of the page is below). */}
      <div className={`pguide__choice${choice ? ' is-on' : ''}`} role="group" aria-label="Play or keep scrolling" aria-hidden={!choice}>
        {onPlay && (
          <button className="pguide__play" onClick={onPlay} tabIndex={choice ? 0 : -1}>
            <svg className="pguide__gem" viewBox="0 0 12 20" aria-hidden="true"><path d="M6 0 12 10 6 20 0 10Z" /><path d="M6 0 12 10H0Z" opacity=".35" fill="#fff" /></svg>
            <span><b>Play the game</b><small>Walk the street</small></span>
          </button>
        )}
        <button className="pguide__down" onClick={() => go(cur + 1)} tabIndex={choice ? 0 : -1}>
          <span><b>Keep scrolling</b><small>{top ? 'Map, process, skills' : `Next: ${next?.label}`}</small></span>
          <span className="pguide__hero-arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
            <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
          </span>
        </button>
      </div>
      {next && (
        <button className={`pguide__nudge${idle && !choice ? ' is-on' : ''}`} onClick={() => go(cur + 1)} tabIndex={idle && !choice ? 0 : -1} aria-hidden={!idle || choice}>
          <span className="pguide__mouse" aria-hidden="true"><span /></span>
          <span><small>Keep scrolling</small>Next: {next.label}</span>
          <span className="pguide__chev" aria-hidden="true">↓</span>
        </button>
      )}
    </div>
  );
}
