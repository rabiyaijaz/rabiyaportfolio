import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CHAPTERS } from './story.js';
import { glideTo, progressOf, reducedMotion, useScrollFrame } from '../lib/scroll.js';
import Lightbox from '../ui/Lightbox.jsx';
import StoryHeader from '../ui/StoryHeader.jsx';
import PlumbobCanvas from '../ui/PlumbobCanvas.jsx';
import Arrow from '../ui/Arrow.jsx';

/**
 * My design process, told by the plumbob.
 * A pinned stage scrubs the plumbob (whole → shards → threads → wireframe → green glass)
 * while five steps of real process artefacts change beside it.
 * Under reduced motion it becomes five plain sections with one still frame each.
 */
export default function ProcessStory() {
  const [still] = useState(reducedMotion);
  const [lightbox, setLightbox] = useState(null);
  const gallery = CHAPTERS.map((c) => ({ src: c.img, alt: c.alt, caption: `${c.name}: ${c.headline}` }));

  return (
    <section className="process" aria-labelledby="process-title">
      <StoryHeader
        className="process__intro" label="Design process" id="process-title"
        title={<>How I take a product <em>from fuzzy to shipped.</em></>}
        lede="The five steps I follow on every project, each shown with a real example from CysterCare, a lifelong AI detection and care system for PCOS/PMOS. Watch the plumbob change as the work does."
      />
      {still ? <Still onOpen={setLightbox} /> : <Scrub onOpen={setLightbox} />}
      {lightbox !== null && <Lightbox images={gallery} index={lightbox} onIndex={setLightbox} onClose={() => setLightbox(null)} />}
    </section>
  );
}

function Chapter({ c, i, active, onOpen }) {
  const hidden = active === false;
  return (
    <article className={`chapter${active ? ' is-active' : ''}`} aria-hidden={hidden || undefined}>
      <p className="story-kicker"><span>{String(i + 1).padStart(2, '0')}</span> {c.name} · {c.method}</p>
      <h3 className="chapter__title">{c.headline}</h3>
      <p className="chapter__body">{c.body}</p>
      <p className="chapter__example"><span>Example · CysterCare</span>{c.example}</p>
      <button className="chapter__shot" onClick={() => onOpen(i)} tabIndex={hidden ? -1 : 0} aria-label={`View larger: ${c.alt}`}>
        {c.live === 'deliver' && active !== undefined
          ? <DeliverStage />
          : <img src={c.img} alt={c.alt} loading="lazy" width="1600" height="1040" />}
      </button>
      {c.link && <Link className="chapter__link" to={c.link.to} tabIndex={hidden ? -1 : 0}>{c.link.label} <Arrow dir="right" /></Link>}
    </article>
  );
}

// Deliver, live: the shipped screens pop in one by one and then keep floating, with the outcomes
// landing last. Positions are % of the 1200×780 artboard (same layout as /img/process/ship.webp).
const DELIVER = [
  { kind: 'browser', src: '/img/cs/vettio/ph-1.webp', x: 4, y: 9, w: 47, r: -1.5, d: 0 },
  { kind: 'phone', src: '/img/process/screens/welcome.webp', x: 53, y: 15, w: 15, r: -5, d: 160 },
  { kind: 'phone', src: '/img/process/screens/home.webp', x: 67, y: 7, w: 15.5, r: 0, d: 300 },
  { kind: 'phone', src: '/img/process/screens/agent.webp', x: 81.5, y: 14, w: 15, r: 5, d: 440 },
  { kind: 'badge', x: 5, y: 63, b: '+30%', t: 'recruiter efficiency · Vettio', dot: '#1f8a4c', d: 820 },
  { kind: 'badge', x: 5, y: 78, b: 'Launched', t: 'on Product Hunt · Vettio', dot: '#da552f', d: 960 },
  { kind: 'badge', x: 54, y: 79, b: '5th prize', t: 'Imaginathon · CysterCare', dot: '#7b5cf0', d: 1100 },
  { kind: 'note', x: 76, y: 76, t: 'A usability study with people managing PCOS/PMOS', r: 3, d: 1300 },
];
function DeliverStage() {
  return (
    <span className="deliver" aria-hidden="true">
      {DELIVER.map((it, k) => (
        <span key={k} className={`dl dl--${it.kind}`} style={{ left: `${it.x}%`, top: `${it.y}%`, width: it.w ? `${it.w}%` : undefined, '--r': `${it.r || 0}deg`, '--d': `${it.d}ms`, '--f': `${4.2 + (k % 3) * 0.9}s` }}>
          <span className="dl__float">
            {it.kind === 'browser' && <><span className="dl__bar"><i /><i /><i /></span><img src={it.src} alt="" loading="lazy" /></>}
            {it.kind === 'phone' && <img src={it.src} alt="" loading="lazy" />}
            {it.kind === 'badge' && <><i className="dl__dot" style={{ background: it.dot }} /><span><b>{it.b}</b><br />{it.t}</span></>}
            {it.kind === 'note' && <><small>Next</small>{it.t}</>}
          </span>
        </span>
      ))}
    </span>
  );
}

function Scrub({ onOpen }) {
  const ref = useRef(null);
  const [active, setActive] = useState(0);
  useScrollFrame(() => {
    const p = progressOf(ref.current);
    setActive(Math.min(CHAPTERS.length - 1, Math.floor(p * CHAPTERS.length * 0.999)));
  });
  const jump = (i) => {
    const el = ref.current;
    const run = el.offsetHeight - innerHeight;
    glideTo(el.getBoundingClientRect().top + scrollY + run * ((i + 0.5) / CHAPTERS.length));
  };

  return (
    <div className="process__run" ref={ref} style={{ '--chapters': CHAPTERS.length }}>
      <div className="process__stage">
        <div className="process__bob">
          <PlumbobCanvas progress={() => progressOf(ref.current)} />
          <ol className="process__steps" aria-label="Process steps">
            {CHAPTERS.map((c, i) => (
              <li key={c.id}>
                <button aria-current={i === active ? 'step' : undefined} onClick={() => jump(i)}>
                  <span className="process__dot" />{c.name}
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div className="process__chapters" aria-live="polite">
          {CHAPTERS.map((c, i) => <Chapter key={c.id} c={c} i={i} active={i === active} onOpen={onOpen} />)}
        </div>
      </div>
    </div>
  );
}

function Still({ onOpen }) {
  return (
    <div className="process__still">
      {CHAPTERS.map((c, i) => (
        <div className="process__still-row" key={c.id}>
          <PlumbobCanvas className="process__still-bob" still={c.frame} progress={() => 0} />
          <Chapter c={c} i={i} onOpen={onOpen} />
        </div>
      ))}
    </div>
  );
}
