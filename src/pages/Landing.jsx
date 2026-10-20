import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NeighbourhoodScene } from '../world/neighbourhood.js';
import { PROJECTS, PROFILE, wipToast } from '../content/projects.js';
import { CAREER } from '../content/about.js';
import StoryHeader from '../ui/StoryHeader.jsx';
import { HOUSES } from '../story/story.js';
import ProcessStory from '../story/ProcessStory.jsx';
import { Plumbob } from '../ui/Logo.jsx';
import { usePhase } from '../lib/phase.jsx';
import NightCta from '../ui/NightCta.jsx';
import OrgLogo from '../ui/Logos.jsx';

/** "Open to work", Sims-style: every few seconds a little envelope flies in and drops into the mailbox,
 *  which bounces, pops its flag and lets out a couple of hearts. Hovering the card speeds it up. */
function Mailbox() {
  return (
    <span className="mailbox" aria-hidden="true">
      <svg className="mailbox__fly" viewBox="0 0 18 13" width="18" height="13">
        <rect x=".5" y=".5" width="17" height="12" rx="2" fill="#fffdf6" stroke="#cbbf9f" />
        <path d="M1 1.3 9 7.6l8-6.3" fill="none" stroke="#cbbf9f" strokeWidth="1.1" />
        <path d="M9 10.4c-1.4-1-2.3-1.8-2.3-2.7a1.2 1.2 0 0 1 2.3-.7 1.2 1.2 0 0 1 2.3.7c0 .9-.9 1.7-2.3 2.7z" fill="#e2483d" />
      </svg>
      <span className="mailbox__heart mailbox__heart--a">♥</span>
      <span className="mailbox__heart mailbox__heart--b">♥</span>
      <svg className="mailbox__box" viewBox="5 -9 44 55" width="38" height="44">
        <rect x="21.5" y="26" width="5" height="18" rx="1.5" fill="#8a5a3a" />
        <rect x="14" y="42" width="20" height="3" rx="1.5" fill="#5e3b25" opacity=".5" />
        <g className="mailbox__letter">
          <rect x="15" y="1" width="17" height="12" rx="1.5" fill="#fffdf6" stroke="#cbbf9f" />
          <path d="M15.5 1.8 23.5 8l8-6.2" fill="none" stroke="#cbbf9f" strokeWidth="1.2" />
          <path d="M23.5 10.6c-1.6-1.2-2.6-2-2.6-3a1.4 1.4 0 0 1 2.6-.8 1.4 1.4 0 0 1 2.6.8c0 1-1 1.8-2.6 3z" fill="#e2483d" />
        </g>
        <path d="M9 18a8 8 0 0 1 8-8h14a8 8 0 0 1 8 8v10H9z" fill="#3fa766" />
        <path d="M9 18a8 8 0 0 1 16 0v10H9z" fill="#2f8a52" />
        <rect x="11.5" y="19" width="11" height="3" rx="1.5" fill="#1d5c36" />
        <g className="mailbox__flag">
          <rect x="37.5" y="9" width="2.2" height="15" rx="1" fill="#6b6b6b" />
          <path d="M39.7 9h7l-2 3.2 2 3.2h-7z" fill="#e2483d" />
        </g>
      </svg>
    </span>
  );
}
import MapZoom from '../ui/MapZoom.jsx';
import PageGuide from '../ui/PageGuide.jsx';
import { sfx, zoneMusic } from '../lib/audio.js';
import RangeenRoom from '../ui/RangeenRoom.jsx';

// Rangeen by Hassan Raheem, played by the Rangeen house (louder the closer she is)
const RANGEEN_SONG = '/music/rangeen.mp3';
import { useSim } from '../lib/simState.jsx';
import { PinFace, pinClass, pinStyle } from '../ui/Pin.jsx';
import { progressOf, reducedMotion, seg, useScrollFrame } from '../lib/scroll.js';
import '../story/story.css';
import Arrow from '../ui/Arrow.jsx';

// `name` is the house sign: Tamasha's house reads Banao.pk
const LOTS = PROJECTS.map((p) => ({ id: p.id, ...HOUSES[p.id], name: HOUSES[p.id].label || p.name }));
const byId = Object.fromEntries(PROJECTS.map((p) => [p.id, p]));

// The home page's chapters for the scroll guide (where each one starts, in page scroll)
const topOf = (sel) => { const el = document.querySelector(sel); return el ? el.getBoundingClientRect().top + scrollY : 0; };
const hoodAt = (p) => { const el = document.querySelector('.hood'); return el ? topOf('.hood') + p * (el.offsetHeight - innerHeight) : 0; };
const CHAPTERS = [
  { id: 'street', label: 'The street', at: () => 0 },
  { id: 'map', label: 'The map', at: () => hoodAt(0.8) },
  { id: 'process', label: 'My process', at: () => topOf('.process') },
  { id: 'skills', label: 'Skills', at: () => topOf('.evening') },
  { id: 'hello', label: 'Say hello', at: () => topOf('#main > :last-child') },
];

// The street's sky for each phase of the Day / Dusk / Night switch
const SKY_HOUR = { day: 11, dusk: 18.9, night: 22.5 };

export default function Landing() {
  const navigate = useNavigate();
  const { toast } = useSim();
  const toastRef = useRef(toast); // the scene and key listeners are set once; this keeps them on the current toast
  toastRef.current = toast;
  const { phase } = usePhase();
  const heroRef = useRef(null);
  const hostRef = useRef(null);
  const sceneRef = useRef(null);
  const introRef = useRef(null);
  const stageRef = useRef(null);
  const pinsRef = useRef({});
  const viewRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [near, setNear] = useState(null);
  const [hover, setHover] = useState(null);
  const [mapOn, setMapOn] = useState(false);
  const [sceneObj, setSceneObj] = useState(null);
  // The controls guide shows in full when walking starts, then folds to a small "Controls" pill
  const [guideOpen, setGuideOpen] = useState(true);
  useEffect(() => {
    if (!playing) return;
    setGuideOpen(true);
    const t = setTimeout(() => setGuideOpen(false), 4000);
    return () => clearTimeout(t);
  }, [playing]);
  // Leaving the map (scrolling back to the street) resets any zoom and pan
  useEffect(() => { if (!mapOn) sceneRef.current?.resetMap(); }, [mapOn]); // the street orbit is kept
  // The Rangeen house: at its door, and inside it
  const [atRangeen, setAtRangeen] = useState(false);
  const [inRangeen, setInRangeen] = useState(false);
  const roomRef = useRef(false);
  const songRef = useRef(0);
  const enterRangeen = () => { roomRef.current = true; setInRangeen(true); setPlaying(false); zoneMusic('rangeen', RANGEEN_SONG, 1); sfx('coin'); };
  const leaveRangeen = () => { roomRef.current = false; setInRangeen(false); zoneMusic('rangeen', RANGEEN_SONG, songRef.current); };
  const enterRangeenRef = useRef(enterRangeen);
  enterRangeenRef.current = enterRangeen;
  const [intro, setIntro] = useState(() => !reducedMotion());
  const [prologue, setPrologue] = useState(() => (reducedMotion() ? 'done' : 'loading'));

  // ---------------------------------------------------------------- the 3D neighbourhood
  useEffect(() => {
    const s = new NeighbourhoodScene(hostRef.current, { lots: LOTS, reducedMotion: reducedMotion() });
    sceneRef.current = s;
    setSceneObj(s);
    const offs = [
      s.on('near', setNear),
      s.on('hover', setHover),
      s.on('enter', (id) => { if (byId[id]?.wip) { toastRef.current(wipToast(byId[id])); return; } sfx('coin'); navigate(`/work/${id}`); }),
      s.on('step', () => sfx('step', { volume: 0.55 })),
      // Easter egg: catching a frog from the fountain
      s.on('frog', (n) => toast({ kind: 'want', title: n === 1 ? 'You caught a frog!' : `Frog #${n} joined the parade`, body: n === 1 ? 'It’ll hop along behind you now. Ribbit.' : 'They follow wherever you walk.' })),
      s.on('near', (id) => { if (id) sfx('open', { volume: 0.6 }); }),
      s.on('frame', placePins),
      // The hero text waits for the intro close-up, then fades in as the camera pulls back
      s.on('intro', (st) => { if (st === 'out') setIntro(false); }),
      // The white-sculpt prologue: 'white' → 'morph' → 'done'
      s.on('prologue', (st) => { setPrologue(st); if (st === 'morph') sfx('want', { volume: 0.5 }); }),
      // The Rangeen house: its song swells as she walks up; at its door she can go inside
      s.on('rangeen', (k) => { songRef.current = k; zoneMusic('rangeen', RANGEEN_SONG, roomRef.current ? 1 : k); }),
      s.on('rangeenDoor', (on) => { setAtRangeen(on); if (on) sfx('open', { volume: 0.6 }); }),
    ];
    // Only render (and only play the house's song) while the hero is on screen
    const io = new IntersectionObserver(([e]) => {
      s.setActive(e.isIntersecting);
      if (!roomRef.current) zoneMusic('rangeen', RANGEEN_SONG, e.isIntersecting ? songRef.current : 0);
    });
    io.observe(heroRef.current);
    if (import.meta.env.DEV) window.__hood = s;
    return () => { offs.forEach((off) => off()); io.disconnect(); s.dispose(); zoneMusic('rangeen', RANGEEN_SONG, 0); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { sceneRef.current?.setClock(SKY_HOUR[phase]); }, [phase]);

  // Map pins follow their houses on screen
  const placePins = () => {
    const s = sceneRef.current;
    if (!s) return;
    const v = viewRef.current;
    for (const p of s.lotScreenPositions()) {
      const el = pinsRef.current[p.id];
      if (el) el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%) scale(${0.85 + v * 0.15})`;
    }
  };

  // ---------------------------------------------------------------- scroll: camera and overlays
  const lastMap = useRef(false);
  useScrollFrame(() => {
    const s = sceneRef.current;
    const p = progressOf(heroRef.current);
    const view = seg(p, 0.22, 0.78);
    viewRef.current = view;
    s?.setView(view);
    if (introRef.current) {
      const out = seg(p, 0.04, 0.26);
      introRef.current.style.opacity = String(1 - out);
      introRef.current.style.transform = `translateY(${-out * 24}px)`;
      introRef.current.style.visibility = out >= 1 ? 'hidden' : '';
    }
    const m = seg(p, 0.62, 0.82);
    stageRef.current?.style.setProperty('--map', String(m));
    if (m > 0.5 !== lastMap.current) { lastMap.current = m > 0.5; setMapOn(m > 0.5); }
  });

  // ---------------------------------------------------------------- keyboard play
  const startPlaying = () => { sceneRef.current?.skipIntro(); setPlaying(true); };

  // Keyboard play is page-wide: arrow keys / WASD walk on the street the moment the page opens,
  // intro or not, wherever focus is (no click into the scene needed). Esc and Enter work once walking.
  const keyState = useRef({});
  keyState.current = { playing, near, atRangeen, inRangeen };
  useEffect(() => {
    const WALK = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD']);
    const typing = (t) => t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
    // Any walk key starts walking while the street is on screen, however far it has scrolled.
    // Up/Down still scroll the page once the camera has risen into the map, so the keyboard can get past it;
    // sideways keys bring the camera back down to the street from anywhere in the neighbourhood.
    const SIDE = new Set(['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD']);
    const inHood = () => { const r = heroRef.current.getBoundingClientRect(); return r.top <= 1 && r.bottom > innerHeight * 0.6; };
    const down = (e) => {
      const s = sceneRef.current, { playing: on, near: at, atRangeen: atR, inRangeen: inR } = keyState.current;
      if (!s || inR || typing(e.target) || e.altKey || e.ctrlKey || e.metaKey) return; // inside the house, the room has the keys
      if (atR && e.key === 'Enter' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') { e.preventDefault(); s.releaseKeys(); enterRangeenRef.current(); return; }
      if (on && e.key === 'Escape') { setPlaying(false); return; }
      if (on && e.key === 'Enter' && at && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') { e.preventDefault(); if (byId[at]?.wip) toastRef.current(wipToast(byId[at])); else navigate(`/work/${at}`); return; }
      if (e.key === 'Shift') { s.setRun(true); return; }
      if (!WALK.has(e.code) || !inHood()) return;
      if (!s.onStreet() && !SIDE.has(e.code)) return;
      e.preventDefault(); // the street, not the page, gets the arrows
      // Ease the page back to the street view if it had scrolled
      const top = heroRef.current.getBoundingClientRect().top + scrollY;
      if (scrollY - top > 2) scrollTo({ top, behavior: reducedMotion() ? 'auto' : 'smooth' });
      if (!on) startPlaying();
      s.setRun(e.shiftKey); // Shift + arrows: jog
      s.key(e.code, true);
    };
    const up = (e) => {
      if (e.key === 'Shift') sceneRef.current?.setRun(false);
      sceneRef.current?.key(e.code, false);
    };
    const blur = () => sceneRef.current?.releaseKeys(); // a key held while switching tabs never gets its keyup
    addEventListener('keydown', down);
    addEventListener('keyup', up);
    addEventListener('blur', blur);
    return () => { removeEventListener('keydown', down); removeEventListener('keyup', up); removeEventListener('blur', blur); };
  }, [navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const nearP = near && byId[near];
  const hoverP = hover && byId[hover];

  return (
    <main id="main" className="story">
      {/* ---------------- Morning: the street, then the map ---------------- */}
      <section className="hood" ref={heroRef} aria-label="Rabiya’s neighbourhood">
        <div
          className={`hood__stage${playing ? ' is-playing' : ''}${mapOn ? ' is-map' : ''}${intro ? ' is-intro' : ''}`} ref={stageRef} tabIndex={-1}
          onPointerDown={(e) => { if (!playing && e.target.tagName === 'CANVAS') setPlaying(true); }}
          aria-describedby="hood-help"
        >
          <div className="hood__scene" ref={hostRef} aria-hidden="true" />
          {/* The scene blurs and darkens behind the type, so it reads on any sky without a box */}
          <div className="hood__blur" aria-hidden="true" />
          <div className="hood__veil" aria-hidden="true" />
          <div className="hood__topveil" aria-hidden="true" />

          {/* First-visit prologue: the white sculpt in the mist, before she turns into colour */}
          {prologue !== 'done' && intro && (
            <div className={`hood__prologue is-${prologue}`}>
              <p className="story-kicker">Welcome to my neighbourhood</p>
              <p className="hood__prologue-title">Hi, I’m <em>Rabiya.</em></p>
              <button className="hood__skip" onClick={() => sceneRef.current?.skipIntro()}>Skip intro</button>
            </div>
          )}

          <div className="hood__intro" ref={introRef}>
            <p className="story-kicker">Product designer · Peshawar</p>
            <h1>{PROFILE.name}</h1>
            <p className="hood__line">Product designer for human–AI collaboration. Every house on this street is something I designed.</p>
            <div className="hood__actions">
              <Link className="button" to="/work">See the work <Arrow dir="right" /></Link>
              <button className="ghost-button" onClick={startPlaying}><Plumbob size={10} /> Walk the street</button>
            </div>
          </div>

          <div className={`hood__help${playing ? ' is-on' : ''}${guideOpen ? '' : ' is-mini'}`}>
            <p id="hood-help" role="status" className="sr-only">
              {playing ? 'Click the ground or use the arrow keys to walk, hold Shift to run, drag to look around. At a door, press Enter or Go inside.' : ''}
            </p>
            {playing && (
              <button className="hood__guide-toggle" aria-expanded={guideOpen} onClick={(e) => { e.stopPropagation(); setGuideOpen((o) => !o); }} aria-label={guideOpen ? 'Hide controls' : 'Show controls'}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 15h10M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm2 4h.01M11 10h.01M15 10h.01" /></svg>
                <span>{guideOpen ? 'Hide' : 'Controls'}</span>
              </button>
            )}
            {playing && guideOpen && (
              <ul className="hood__keys" aria-hidden="true">
                <li><span className="hood__key-ico"><svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18M12 3l-3 3m3-3 3 3M12 21l-3-3m3 3 3-3M3 12l3-3m-3 3 3 3M21 12l-3-3m3 3-3 3" /></svg></span><span><b>Walk</b><small>Click or <kbd>←↑↓→</kbd> · <kbd>Shift</kbd> to run</small></span></li>
                <li><span className="hood__key-ico"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" /></svg></span><span><b>Look around</b><small>Drag · pinch to zoom</small></span></li>
                <li><span className="hood__key-ico"><svg viewBox="0 0 24 24"><path d="M4 21V9l8-6 8 6v12h-6v-6h-4v6Z" /></svg></span><span><b>Go inside</b><small>At a door, <kbd>Enter</kbd></small></span></li>
              </ul>
            )}
            {playing && <button className="hood__exit" onClick={(e) => { e.stopPropagation(); setPlaying(false); }}>Exit <kbd>Esc</kbd></button>}
          </div>

          {nearP && viewRef.current < 0.5 && (
            <div className="door" role="status">
              <span className="muted">At the door of</span> <strong>{nearP.name}</strong>
              {nearP.wip
                ? <button className="button button--small door__wip" onClick={() => toast(wipToast(nearP))}>🚧 Under construction</button>
                : <Link className="button button--small" to={`/work/${nearP.id}`}>Go inside <kbd>↵</kbd></Link>}
            </div>
          )}
          {atRangeen && !inRangeen && viewRef.current < 0.5 && (
            <div className="door" role="status">
              <span className="muted">At the door of</span> <strong>the Rangeen house</strong>
              <button className="button button--small" onClick={enterRangeen}>Go inside <kbd>↵</kbd></button>
            </div>
          )}
          {inRangeen && <RangeenRoom onClose={leaveRangeen} />}

          {/* Pins: the hovered house on the street, every house on the map */}
          <div className="hood__pins" aria-hidden={!mapOn}>
            {LOTS.map((l, i) => {
              const p = byId[l.id];
              // Featured projects keep their starred pin on the street too
              const on = mapOn || ((l.featured || hover === l.id) && near !== l.id && !playing);
              return (
                <Link
                  key={l.id} to={`/work/${l.id}`} className={`pin${on ? ' is-on' : ''}${p.passion ? ' pin--small' : ''}${pinClass(l)}`}
                  ref={(el) => { pinsRef.current[l.id] = el; }} tabIndex={mapOn ? 0 : -1} style={pinStyle(l, i)}
                  onMouseEnter={() => sceneRef.current?.highlight(l.id)} onMouseLeave={() => sceneRef.current?.highlight(null)}
                  onFocus={() => sceneRef.current?.highlight(l.id)} onBlur={() => sceneRef.current?.highlight(null)}
                  {...(p.wip ? { 'aria-disabled': true, onClick: (e) => { e.preventDefault(); toast(wipToast(p)); } } : {})}
                >
                  <PinFace p={p} lot={l} />
                </Link>
              );
            })}
          </div>

          {/* On the street (while walking) these zoom the camera around her; on the map they zoom the map */}
          <MapZoom scene={sceneObj} hidden={!(mapOn || playing)} street={!mapOn} />
          {/* The map's caption: one line, no panel. The pins themselves are the list. */}
          <p className="hood__mapline" aria-hidden={!mapOn}>
            <span className="story-kicker">The neighbourhood</span>
            <span className="hood__mapline-title">Every house, <em>one project.</em> Tap one to step inside.</span>
          </p>
          {hoverP && !mapOn && <span className="sr-only" role="status">{hoverP.name}</span>}
        </div>
      </section>

      {/* Fixed on screen; kept before the last section so `#main > :last-child` stays the contact band */}
      <PageGuide chapters={CHAPTERS} hidden={playing || (intro && prologue !== 'done')} />
      <ProcessStory />
      <Skills />
      <NightCta title={<>Got a product in mind? <em>Let’s talk.</em></>} />
    </main>
  );
}

function Skills() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <section className={`evening${seen ? ' is-seen' : ''}`} ref={ref} aria-labelledby="evening-title">
      <div className="story-wrap">
        <StoryHeader label="Skills" id="evening-title" title={<>Skills, <em>levelled up over four years.</em></>} />
        <div className="evening__grid">
          <ul className="skills" aria-label="Skills, out of 10">
            {CAREER.skills.map((s, i) => (
              <li key={s.label} style={{ '--i': i }}>
                <span>{s.label}</span>
                <span className="skills__pips" role="img" aria-label={`${s.value} out of 10`}>
                  {Array.from({ length: 10 }, (_, k) => <i key={k} className={k < s.value ? 'on' : ''} style={{ '--k': k }} />)}
                </span>
              </li>
            ))}
          </ul>
          {/* "Right now": one Sims-style status card. What she's doing now, and that she's available. */}
          <aside className="status" aria-label="Right now">
            <header className="status__head">
              <img className="status__face" src="/img/portrait-160.webp" alt="" width="160" height="200" />
              <div>
                <p className="story-kicker">Right now</p>
                <p className="status__name">Rabiya Ijaz</p>
              </div>
              <span className="status__live"><i aria-hidden="true" />Available</span>
            </header>
            <ul className="status__rows">
              <li>
                <Link to="/work/crewnity">
                  <OrgLogo name="crewnity" size={36} />
                  <span><small>Job</small>Lead Product Designer, Crewnity</span>
                  <b><Arrow dir="right" /></b>
                </Link>
              </li>
              <li>
                <Link to="/work/tamasha">
                  <OrgLogo name="banao" size={36} />
                  <span><small>Community</small>Ambassador, Banao.pk</span>
                  <b><Arrow dir="right" /></b>
                </Link>
              </li>
            </ul>
            <div className="status__open">
              <Mailbox />
              <p><strong>Open to new product design work</strong><span>Remote, hybrid or on-site, anywhere</span></p>
              <Link className="button status__cta" to="/contact">Say hello</Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
