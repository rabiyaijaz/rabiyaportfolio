import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { PhaseProvider } from './lib/phase.jsx';
import { SimProvider } from './lib/simState.jsx';
import TopNav from './ui/TopNav.jsx';
import PhaseSwitch from './ui/PhaseSwitch.jsx';
import SoundControl from './ui/SoundControl.jsx';
import SoundFx from './ui/SoundFx.jsx';
import Ambient from './ui/Ambient.jsx';
import Landing from './pages/Landing.jsx';
import Work from './pages/Work.jsx';
import CaseStudy from './pages/CaseStudy.jsx';
import About from './pages/About.jsx';
import Resume from './pages/Resume.jsx';
import Contact from './pages/Contact.jsx';
import NotFound from './pages/NotFound.jsx';
import SearchPalette from './ui/SearchPalette.jsx';

const ROOM_PANELS = new Set(['needs', 'traits', 'skills', 'people', 'items', 'offwork', 'wants']);
import './story/story.css'; // story headers, buttons and plumbob styles are shared by every page

export default function App() {
  const { pathname, state, hash } = useLocation();
  const landing = pathname === '/';
  useEffect(() => { if (!location.hash) scrollTo(0, 0); }, [pathname]);
  // A link to a section (from search, the deck, anywhere): wait for it to render, bring it into view, and
  // let it glow for a moment. About's room panels (#people, #skills…) are opened by the room itself.
  useEffect(() => {
    const id = decodeURIComponent(hash.slice(1));
    if (!id || ROOM_PANELS.has(id)) return;
    let n = 0, t;
    const find = () => {
      const el = document.getElementById(id);
      if (!el) { if (n++ < 40) t = setTimeout(find, 100); return; }
      const align = () => scrollTo({ top: el.getBoundingClientRect().top + scrollY - 96, behavior: 'auto' });
      align();
      // images above it can still be loading and push it down: re-align a few times, unless the visitor scrolls
      let mine = true;
      const stop = () => { mine = false; };
      ['wheel', 'touchstart', 'keydown'].forEach((e) => addEventListener(e, stop, { once: true, passive: true }));
      [250, 700, 1500, 2600].forEach((ms) => setTimeout(() => { if (mine) align(); }, ms));
      setTimeout(() => ['wheel', 'touchstart', 'keydown'].forEach((e) => removeEventListener(e, stop)), 2700);
      const glow = el.querySelector('h1, h2, h3') || el; // its heading glows, not the whole (often huge) section
      glow.classList.remove('is-found'); void glow.offsetWidth; glow.classList.add('is-found');
      setTimeout(() => glow.classList.remove('is-found'), 1900);
    };
    t = setTimeout(find, 60);
    return () => clearTimeout(t);
  }, [pathname, hash]);

  return (
    <PhaseProvider>
    <SimProvider>
      <a className="skip-link" href="#main">Skip to content</a>
      {!landing && <Ambient dim={/^\/work\/.+/.test(pathname)} />}
      <TopNav floating={landing || pathname === '/about'} />
      <Routes>
        {/* The logo stamps `replay`, which remounts the landing so its intro plays from the start */}
        <Route path="/" element={<Landing key={state?.replay || 'home'} />} />
        <Route path="/work" element={<Work />} />
        <Route path="/work/:id" element={<CaseStudy />} />
        <Route path="/about" element={<About />} />
        <Route path="/resume" element={<Resume />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <SearchPalette />
      <PhaseSwitch />
      <SoundControl />
      <SoundFx />
    </SimProvider>
    </PhaseProvider>
  );
}
