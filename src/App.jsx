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
import './story/story.css'; // story headers, buttons and plumbob styles are shared by every page

export default function App() {
  const { pathname, state } = useLocation();
  const landing = pathname === '/';
  useEffect(() => { if (!location.hash) scrollTo(0, 0); }, [pathname]);

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
      <PhaseSwitch />
      <SoundControl />
      <SoundFx />
    </SimProvider>
    </PhaseProvider>
  );
}
