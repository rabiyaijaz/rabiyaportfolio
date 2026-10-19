import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PROFILE } from '../content/projects.js';
import useTitle from '../lib/useTitle.js';
import { useSim } from '../lib/simState.jsx';
import { clamp01 } from '../lib/scroll.js';
import StoryHeader from '../ui/StoryHeader.jsx';
import PlumbobCanvas from '../ui/PlumbobCanvas.jsx';
import NightCta from '../ui/NightCta.jsx';

import { COMMUNITY, EDUCATION, EXPERIENCE, PROJECTS } from '../content/career.js';
import OrgLogo from '../ui/Logos.jsx';
import Arrow from '../ui/Arrow.jsx';

const SECTIONS = [
  ['experience', 'Experience', EXPERIENCE],
  ['projects', 'Projects', PROJECTS],
  ['community', 'Community', COMMUNITY],
  ['education', 'Education', EDUCATION],
];

export default function Resume() {
  useTitle('Resume');
  const { fulfil } = useSim();
  const lineRef = useRef(null);
  const [level, setLevel] = useState('Experience');

  // Entries rise in as they arrive; the section in view names the plumbob's "level"
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) e.target.classList.add('is-in'); }), { rootMargin: '0px 0px -10% 0px' });
    const sec = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setLevel(e.target.dataset.name); }), { rootMargin: '-45% 0px -50% 0px' });
    lineRef.current.querySelectorAll('.tl-item').forEach((el) => io.observe(el));
    lineRef.current.querySelectorAll('[data-name]').forEach((el) => sec.observe(el));
    return () => { io.disconnect(); sec.disconnect(); };
  }, []);
  const progress = () => {
    const r = lineRef.current?.getBoundingClientRect();
    return r ? clamp01((innerHeight * 0.55 - r.top) / r.height) : 0;
  };

  return (
    <main id="main" className="resume-page">
      <div className="page page--flush">
        <StoryHeader
          as="h1" label="Resume"
          title={<>The short version, <em>with dates.</em></>}
          lede="4+ years of product design across AI, healthcare, recruitment, finance and education."
        >
          <p className="resume__cta"><a className="button" href={PROFILE.cv} download onClick={() => fulfil('cv')}>Download the PDF</a></p>
        </StoryHeader>
      </div>

      <div className="story-wrap resume-grid">
        <aside className="resume-bob" aria-hidden="true">
          <PlumbobCanvas progress={progress} />
          <p className="story-kicker"><span>Level</span> {level}</p>
        </aside>
        <div className="timeline" ref={lineRef}>
          {SECTIONS.map(([id, name, items]) => (
            <section key={id} className="tl-section" data-name={name} aria-labelledby={`tl-${id}`}>
              <h2 id={`tl-${id}`} className="tl-section__title">{name}</h2>
              <ol className="tl-list">
                {items.map((x) => (
                  <li key={x.org + x.role} className="tl-item">
                    <span className="tl-node" aria-hidden="true" />
                    <div className="tl-item__head">
                      <strong><OrgLogo name={x.logo} size={26} />{x.role}, {x.org}</strong>
                      <span className="muted">{x.when}{x.where ? ` · ${x.where}` : ''}</span>
                    </div>
                    {x.what && <p>{x.what}</p>}
                    {x.link && <Link className="tl-item__link" to={x.link}>See the work <Arrow dir="right" /></Link>}
                  </li>
                ))}
              </ol>
            </section>
          ))}
          <section className="tl-section" data-name="Extras" aria-labelledby="tl-extras">
            <h2 id="tl-extras" className="tl-section__title">Certificates & languages</h2>
            <ol className="tl-list">
              <li className="tl-item"><span className="tl-node" aria-hidden="true" /><p>Google Foundations of UX Design · Web Page Design with HTML5/CSS3 · Practical Python for Beginners</p><p className="muted">Urdu (native) · English (C2, writing C1)</p></li>
            </ol>
          </section>
        </div>
      </div>
      <NightCta title={<>Like what you see? <em>Let’s talk.</em></>} />
    </main>
  );
}
