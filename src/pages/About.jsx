import { useEffect, useRef, useState } from 'react';
import useTitle from '../lib/useTitle.js';
import Room from '../ui/Room.jsx';
import StoryHeader from '../ui/StoryHeader.jsx';
import NightCta from '../ui/NightCta.jsx';
import ToolFlow from '../about/ToolFlow.jsx';
import OffWork from '../about/OffWork.jsx';
import WhoIAm3D from '../about/WhoIAm3D.jsx';
import { reducedMotion } from '../lib/scroll.js';
import '../about/about.css';

const FACTS = ['Peshawar, Pakistan', '4+ years', 'Lead Product Designer at Crewnity', 'Open to new projects'];

export default function About() {
  useTitle('About');
  // The room runs under a transparent nav
  // The Sims nav and HUD styling only apply while the room fills the screen
  useEffect(() => {
    const onScroll = () => document.body.classList.toggle('has-room', scrollY < innerHeight * 0.6);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => { removeEventListener('scroll', onScroll); document.body.classList.remove('has-room'); };
  }, []);
  // "Who I am" is a scroll-driven 3D scene, or the photo version for reduced motion / no WebGL
  const [use3d] = useState(() => !reducedMotion() && hasWebGL());

  return (
    <main id="main" className="about-page">
      <h1 className="sr-only">About Rabiya Ijaz</h1>
      <Room />
      {use3d ? <WhoIAm3D facts={FACTS} /> : <IntroStatic />}
      <ToolFlow />
      <OffWork />
      <NightCta />
    </main>
  );
}

const hasWebGL = () => {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
};

/** The photo version of "Who I am", with its own entrance animation. */
function IntroStatic() {
  // "Who I am" plays its entrance once, the first time it scrolls into view
  const introRef = useRef(null);
  const [introIn, setIntroIn] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setIntroIn(true); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(introRef.current);
    return () => io.disconnect();
  }, []);
  // The portrait leans a little toward the cursor
  const tilt = (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = e.currentTarget, r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
    el.style.setProperty('--mx', `${((x + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${((y + 0.5) * 100).toFixed(1)}%`);
  };
  const untilt = (e) => { ['--rx', '--ry'].forEach((p) => e.currentTarget.style.setProperty(p, '0deg')); };

  return (
      <section className={`about-intro${introIn ? ' is-in' : ''}`} ref={introRef} aria-labelledby="intro-title">
        <div className="story-wrap about-intro__grid">
          <figure className="about-intro__portrait rv" style={{ '--i': 0 }} onPointerMove={tilt} onPointerLeave={untilt}>
            <img src="/img/portrait-640.webp" alt="Rabiya in a green frog bucket hat and a black graphic tee" width="640" height="800" loading="lazy" />
            <span className="about-intro__sheen" aria-hidden="true" />
          </figure>
          <div>
            <div className="rv" style={{ '--i': 1 }}>
              <StoryHeader label="Who I am" id="intro-title" title={<>I design products <em>around the people who live with them.</em></>} />
            </div>
            <div className="about-intro__copy">
              <p className="rv" style={{ '--i': 2 }}>I’m Rabiya, a product designer in Peshawar. Over 4+ years across recruitment, finance, healthcare and AI, I’ve done the same thing: made complicated systems feel human.</p>
              <p className="rv" style={{ '--i': 3 }}><strong>What I do:</strong> take products from research to shipped UI. Interviews and synthesis, service blueprints and flows, design systems, and prototypes built with AI tools.</p>
              <p className="rv" style={{ '--i': 4 }}><strong>What I’m looking forward to:</strong> more AI products people can trust. Systems that explain themselves, keep people in control and work for everyone, including people with disabilities.</p>
            </div>
            <ul className="about-intro__facts">{FACTS.map((f, k) => <li key={f} className="rv rv--pop" style={{ '--i': 5 + k * 0.6 }}>{f}</li>)}</ul>
          </div>
        </div>
      </section>
  );
}
