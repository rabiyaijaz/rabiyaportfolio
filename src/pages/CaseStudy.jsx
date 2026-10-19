import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PROJECTS, projectById, PROFILE, titleOf } from '../content/projects.js';
import { CASE_STUDIES } from '../content/caseStudies.js';
import useTitle from '../lib/useTitle.js';
import { useSim } from '../lib/simState.jsx';
import Lightbox from '../ui/Lightbox.jsx';
import HeroVideo from '../ui/HeroVideo.jsx';
import StageEmbed from '../ui/StageEmbed.jsx';
import Arrow from '../ui/Arrow.jsx';
import NotFound from './NotFound.jsx';

// The playable Access Adda prototype only loads on its own case study
const AccessAdda = lazy(() => import('../game/AccessAdda.jsx'));
const AddaDeck = lazy(() => import('../game/AddaDeck.jsx'));

export default function CaseStudy() {
  const { id } = useParams();
  const p = projectById(id);
  const cs = CASE_STUDIES[id];
  useTitle(p ? titleOf(p) : undefined);
  const { fulfil, boost, toast } = useSim();
  const articleRef = useRef(null);
  const endRef = useRef(null);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    scrollTo(0, 0);
    if (p) { fulfil('read'); boost('fun', 30); }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Finishing a case study is a Sims-style skill-up
  useEffect(() => {
    if (!cs?.skill || !endRef.current) return;
    let done = false;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done) {
        done = true;
        toast({ kind: 'skill', title: 'Skill increased', body: `${cs.skill} +1 · thanks for reading ${p.name}` });
      }
    }, { threshold: 1 });
    io.observe(endRef.current);
    return () => io.disconnect();
  }, [id, cs, p, toast]);

  // Every image on the page, in order, for the lightbox
  const gallery = useMemo(() => (cs?.sections || []).flatMap((s) => [
    ...(s.images || []),
    ...(s.iterations || []).map((it) => ({ ...it, caption: `${it.name}. ${it.note}` })),
  ]), [cs]);

  if (!p) return <NotFound />;
  const i = PROJECTS.indexOf(p);
  const next = PROJECTS[(i + 1) % PROJECTS.length];
  const open = (img) => setLightbox(gallery.indexOf(img));

  return (
    <main id="main" className="page case">
      <header className="case__head">
        <p className="eyebrow">{p.type} • {p.year}</p>
        {/* The project name stands out; the description after it stays light */}
        <h1 className="display display--case"><strong>{p.name}:</strong> {titleOf(p).slice(p.name.length + 2)}</h1>
        {p.tags && <ul className="tags">{p.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
        {/* A working build people can try for themselves */}
        {p.live && (
          <a className="button case__live" href={p.live.href} target="_blank" rel="noopener noreferrer">
            {p.live.label} <Arrow dir="out" /><span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
      </header>
      {p.heroVideo ? (
        <HeroVideo src={p.heroVideo} poster={p.heroPoster || p.hero || p.cover} title={`${p.name} product video`} />
      ) : p.heroEmbed ? (
        <StageEmbed src={p.heroEmbed} tint={p.tint} title={`${p.name}: the live stage hero. The curtains open, and Replay the parda plays it again.`} />
      ) : (
        <figure className="case__hero" style={{ '--tint': p.tint }}>
          <img src={p.hero || p.cover} alt={`${p.name}: ${p.headline}`} className={p.contain ? 'is-contain' : ''} />
        </figure>
      )}
      <dl className="case__meta">
        {Object.entries(p.meta).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>

      {cs?.play && (
        <section className="case__play" id="play" aria-labelledby="play-title">
          <p className="case__label">Play it</p>
          <h2 id="play-title" className="case__playtitle">{cs.play.headline}</h2>
          <p className="muted">{cs.play.note}</p>
          <Suspense fallback={<p className="muted">Shuffling the deck…</p>}><AccessAdda /></Suspense>
        </section>
      )}

      {p.live?.embed && <LiveApp live={p.live} name={p.name} />}

      <div className="case__layout">
        <aside className="case__toc" aria-label="On this page">
          <Link to="/work" className="case__back"><Arrow />Work</Link>
          {cs?.sections && <Toc sections={cs.sections} articleRef={articleRef} />}
        </aside>
        <article className="case__body" ref={articleRef}>
          {cs ? (
            <>
              {cs.stats && <Stats stats={cs.stats} />}
              {cs.intro?.map((t, k) => <p key={k} className="case__intro">{t}</p>)}
              {cs.sections.map((s) => (
                <section key={s.id} id={s.id} className="case__section">
                  <p className="case__label">{s.label}</p>
                  <h2>{s.headline}</h2>
                  {s.body.map((t, k) => <p key={k}>{t}</p>)}
                  {s.list && <ul className="case__list">{s.list.map((t) => <li key={t}>{t}</li>)}</ul>}
                  {s.iterations && (
                    <ol className="iters" aria-label="Design directions, in order">
                      {s.iterations.map((it, k) => {
                        const img = gallery.find((g) => g.src === it.src);
                        return (
                          <li key={it.src} className={`iter${it.tall ? ' iter--tall' : ''}`}>
                            <button className="iter__shot" onClick={() => open(img)} aria-label={`View larger: ${it.alt}`}>
                              <img src={it.src} alt={it.alt} loading="lazy" />
                            </button>
                            <p className="iter__name"><span>{String(k + 1).padStart(2, '0')}</span>{it.name}</p>
                            <p className="iter__note">{it.note}</p>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                  {s.deck && <Suspense fallback={<p className="muted">Laying out the deck…</p>}><AddaDeck /></Suspense>}
                  {s.compare && (
                    <div className="compare">
                      {s.compare.map((col) => (
                        <div key={col.title} className={`compare__col${col.after ? ' is-after' : ''}`}>
                          <p className="compare__title">{col.title}</p>
                          <ol>{col.steps.map((st) => <li key={st}>{st}</li>)}</ol>
                        </div>
                      ))}
                    </div>
                  )}                  {s.images && (
                    <div className={`case__shots case__shots--${s.layout || (s.images.length > 1 ? 'grid' : 'single')}`}>
                      {s.images.map((im) => (
                        <figure key={im.src} className={im.phone ? 'is-phone' : ''}>
                          <button className="shot" onClick={() => open(im)} aria-label={`View larger: ${im.alt}`}>
                            <img src={im.src} alt={im.alt} loading="lazy" />
                          </button>
                          {im.caption && <figcaption>{im.caption}</figcaption>}
                        </figure>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </>
          ) : (
            <p className="case__intro muted">The full write-up for {p.name} is on its way. Meanwhile, <a href={PROFILE.cv} download>the CV</a> has the summary, or <Link to="/contact">ask me about it</Link>.</p>
          )}
          <nav className="case__next" aria-label="Next project" ref={endRef}>
            <span className="muted">Next lot</span>
            <Link to={`/work/${next.id}`}>{titleOf(next)} <Arrow dir="right" /></Link>
          </nav>
        </article>
      </div>
      {lightbox !== null && <Lightbox images={gallery} index={lightbox} onIndex={setLightbox} onClose={() => setLightbox(null)} />}
    </main>
  );
}

/** "Try it yourself": the deployed app running inside a phone frame (it's a mobile app), loaded only when
 *  the section is close to the screen, plus a link to open it full size in a new tab. */
function LiveApp({ live, name }) {
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: '400px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <section className="case__try" id="try" aria-labelledby="try-title" ref={ref}>
      <div className="case__try-copy">
        <p className="case__label">Try it yourself</p>
        <h2 id="try-title" className="case__playtitle">{live.headline}</h2>
        <p className="muted">{live.note}</p>
        <a className="ghost-button" href={live.href} target="_blank" rel="noopener noreferrer">
          Open in a new tab <Arrow dir="out" /><span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
      <div className="case__phone">
        <div className="case__phone-screen">
          {near
            ? <iframe src={live.href} title={`${name}, the live app`} loading="lazy" allow="clipboard-write" />
            : <span className="case__phone-wait">Loading the app…</span>}
        </div>
      </div>
    </section>
  );
}

/** Sticky contents with a plumbob that fills as you read. */
function Toc({ sections, articleRef }) {
  const [active, setActive] = useState(sections[0]?.id);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach((s) => { const el = document.getElementById(s.id); if (el) io.observe(el); });
    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // Read = how much of the article has passed the bottom of the screen, so it reaches 100% when the
      // article's end comes into view (and always at the very bottom of the page)
      const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
      setProgress(atEnd ? 1 : Math.min(1, Math.max(0, (innerHeight - r.top) / r.height)));
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    // Images and embeds load in and change the page height: keep the reading in step with them
    const ro = new ResizeObserver(onScroll);
    if (articleRef.current) ro.observe(articleRef.current);
    return () => { io.disconnect(); ro.disconnect(); removeEventListener('scroll', onScroll); };
  }, [sections, articleRef]);
  return (
    <>
      <div className="toc-bob" role="progressbar" aria-label="Reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
        <svg viewBox="0 0 20 32" aria-hidden="true">
          <defs><clipPath id="bob"><path d="M10 0 20 16 10 32 0 16Z" /></clipPath></defs>
          <path d="M10 0 20 16 10 32 0 16Z" className="toc-bob__shell" />
          <rect clipPath="url(#bob)" x="0" width="20" y={32 - 32 * progress} height={32 * progress} className="toc-bob__fill" />
        </svg>
        <span>{Math.round(progress * 100)}%</span>
      </div>
      <ul>
        {sections.map((s) => (
          <li key={s.id}><a href={`#${s.id}`} aria-current={active === s.id ? 'true' : undefined}>{s.toc}</a></li>
        ))}
      </ul>
    </>
  );
}

function Stats({ stats }) {
  const ref = useRef(null);
  const [k, setK] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setK(1); return; }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t) => { const x = Math.min(1, (t - t0) / 1200); setK(1 - Math.pow(1 - x, 3)); if (x < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <dl className="stats" ref={ref}>
      {stats.map((s) => (
        <div key={s.label}>
          <dt>{s.label}</dt>
          <dd>{Math.round(s.value * k)}{s.suffix || ''}</dd>
        </div>
      ))}
    </dl>
  );
}
