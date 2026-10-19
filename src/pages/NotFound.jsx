import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useTitle from '../lib/useTitle.js';
import { useSim } from '../lib/simState.jsx';
import { sfx } from '../lib/audio.js';
import { reducedMotion } from '../lib/scroll.js';
import SimMenu from '../ui/SimMenu.jsx';
import '../notfound.css';

// Where the frog can hop to on the lot (% of the lot), away from the Sim and the sign
const HOPS = [[16, 84], [78, 86], [26, 93], [88, 74], [10, 72], [70, 94]];

/**
 * 404 as an empty lot on Rabiya's street: every house is a project, and this one hasn't been built.
 * Click the Sim for the pie menu (directions, build, catch the frog, go home). The frog hops away
 * when clicked; three catches and it's yours.
 */
export default function NotFound() {
  useTitle('Lot not found');
  const navigate = useNavigate();
  const { toast } = useSim();
  const simRef = useRef(null);
  const [menu, setMenu] = useState(null);
  const [mood, setMood] = useState('lost'); // lost → helped (plumbob turns green)
  const [thought, setThought] = useState('?');
  const [built, setBuilt] = useState(false);
  const [glow, setGlow] = useState(false);
  const [frog, setFrog] = useState({ spot: 0, tries: 0, caught: false, hop: 0 });

  const openMenu = () => {
    const r = simRef.current.getBoundingClientRect();
    setMenu({ x: r.left + r.width / 2, y: r.top + r.height * 0.3 });
    sfx('chime', { volume: 0.4 });
  };

  const directions = useCallback(() => {
    setMood('helped'); setThought('→'); setGlow(true);
    toast({ title: 'Directions given', body: 'The street, the work and the mailbox are all just over there.' });
  }, [toast]);

  const build = useCallback(() => {
    if (built) { toast({ title: 'Already built', body: 'Still just a little placeholder. The real projects live on the street.' }); return; }
    setBuilt(true); setMood('helped'); setThought('!');
    toast({ kind: 'want', title: 'Built a tiny house', body: 'Nothing has been designed here yet, so it stays a placeholder.' });
  }, [built, toast]);

  const catchFrog = useCallback(() => {
    setFrog((f) => {
      if (f.caught) return f;
      const tries = f.tries + 1;
      if (tries >= 3) {
        toast({ kind: 'want', title: 'You caught the frog!', body: 'It was hiding on Lot 404 all along. Ribbit.' });
        setMood('helped'); setThought('♥');
        return { ...f, tries, caught: true };
      }
      sfx('chime', { volume: 0.35 });
      let spot; do { spot = Math.floor(Math.random() * HOPS.length); } while (spot === f.spot);
      return { spot, tries, caught: false, hop: f.hop + 1 };
    });
  }, [toast]);

  // The thought bubble settles back to the lost "?" a while after a happy moment, unless she's been helped for good
  useEffect(() => {
    if (thought === '?' || thought === '♥') return;
    const t = setTimeout(() => setThought(mood === 'helped' ? '♪' : '?'), 3500);
    return () => clearTimeout(t);
  }, [thought, mood]);

  const items = [
    { label: 'Ask for directions', icon: '🧭', onSelect: directions },
    { label: built ? 'Admire the house' : 'Build something here', icon: '🔨', onSelect: build },
    { label: frog.caught ? 'Pet the frog' : 'Catch the frog', icon: '🐸', onSelect: frog.caught ? () => toast({ title: 'Ribbit', body: 'The frog is very happy here.' }) : catchFrog },
    { label: 'Go home', icon: '🏡', onSelect: () => navigate('/') },
  ];
  const [fx, fy] = frog.caught ? [72, 92] : HOPS[frog.spot];

  return (
    <main id="main" className="lost">
      <div className="lost__copy">
        <p className="story-kicker">404 · Lot not found</p>
        <h1 className="lost__title">This lot is <em>still empty.</em></h1>
        <p className="lost__lede">The page you were looking for hasn’t been built yet, or it moved house. Click Rabiya and she’ll help you find your way.</p>
        <div className={`lost__ways${glow ? ' is-glow' : ''}`}>
          <Link className="button" to="/">Back to the street <span aria-hidden="true">→</span></Link>
          <Link className="ghost-button" to="/work">See the work</Link>
          <Link className="ghost-button" to="/contact">Say hello</Link>
        </div>
      </div>

      <div className={`lost__scene${reducedMotion() ? ' is-still' : ''}`}>
        <div className="lot" aria-hidden="true">
          <div className="lot__grass" />
          <svg className="lot__fence" viewBox="0 0 400 40" preserveAspectRatio="none">
            <path d="M0 22h400M0 32h400" />
            {Array.from({ length: 21 }, (_, i) => <path key={i} d={`M${i * 20 + 4} 40V10l6-8 6 8v30z`} />)}
          </svg>
          <div className={`lot__house${built ? ' is-built' : ''}`}>
            <svg viewBox="0 0 120 110">
              <rect className="h-wall" x="20" y="48" width="80" height="58" rx="3" />
              <path className="h-roof" d="M10 52 60 12l50 40z" />
              <rect className="h-door" x="50" y="70" width="20" height="36" rx="2" />
              <rect className="h-win" x="28" y="60" width="16" height="14" rx="2" />
              <rect className="h-win" x="76" y="60" width="16" height="14" rx="2" />
              <rect className="h-chim" x="82" y="22" width="10" height="20" />
            </svg>
          </div>
          <div className="lot__sign">
            <svg viewBox="0 0 120 110">
              <rect x="56" y="40" width="8" height="70" rx="2" className="s-post" />
              <rect x="4" y="6" width="112" height="56" rx="8" className="s-board" />
              <text x="60" y="27" textAnchor="middle" className="s-small">FOR SALE</text>
              <text x="60" y="51" textAnchor="middle" className="s-big">LOT 404</text>
            </svg>
          </div>
        </div>

        <button
          ref={simRef} className={`lost__sim is-${mood}`} onClick={openMenu}
          aria-haspopup="menu" aria-label="Rabiya looks lost. Click her for options."
        >
          <span className="lost__plumbob" aria-hidden="true" />
          <span className="lost__thought" aria-hidden="true" key={thought}>{thought}</span>
          <img src="/img/about/sim-full.webp" alt="" />
        </button>

        <button
          className={`lost__frog${frog.caught ? ' is-caught' : ''}`} key={frog.hop}
          style={{ left: `${fx}%`, top: `${fy}%` }}
          onClick={catchFrog} disabled={frog.caught}
          aria-label={frog.caught ? 'The frog is caught' : `A frog. Click to catch it (${3 - frog.tries} to go)`}
        >
          <svg viewBox="0 0 64 52" aria-hidden="true">
            <ellipse cx="32" cy="34" rx="24" ry="16" className="f-body" />
            <ellipse cx="32" cy="38" rx="14" ry="9" className="f-belly" />
            <circle cx="20" cy="16" r="10" className="f-body" /><circle cx="44" cy="16" r="10" className="f-body" />
            <circle cx="20" cy="16" r="6" fill="#fff" /><circle cx="44" cy="16" r="6" fill="#fff" />
            <circle cx="21" cy="17" r="3" fill="#1b1b1b" /><circle cx="45" cy="17" r="3" fill="#1b1b1b" />
            <path d="M24 32q8 6 16 0" className="f-mouth" />
            <circle cx="16" cy="30" r="3" className="f-blush" /><circle cx="48" cy="30" r="3" className="f-blush" />
          </svg>
        </button>
      </div>

      {menu && <SimMenu x={menu.x} y={menu.y} items={items} onClose={() => setMenu(null)} label="What should Rabiya do?" />}
    </main>
  );
}
