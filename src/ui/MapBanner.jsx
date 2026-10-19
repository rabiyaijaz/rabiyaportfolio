import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NeighbourhoodScene } from '../world/neighbourhood.js';
import { PROJECTS } from '../content/projects.js';
import { HOUSES } from '../story/story.js';
import { reducedMotion } from '../lib/scroll.js';
import { usePhase } from '../lib/phase.jsx';
import { PinFace, pinClass, pinStyle } from './Pin.jsx';
import MapZoom from './MapZoom.jsx';

const SKY_HOUR = { day: 10, dusk: 18.9, night: 22.5 };

const LOTS = PROJECTS.map((p) => ({ id: p.id, ...HOUSES[p.id], name: HOUSES[p.id].label || p.name }));

/** The neighbourhood from above, as the Work page's banner. Every house is a link. */
export default function MapBanner({ highlight }) {
  const host = useRef(null);
  const scene = useRef(null);
  const pins = useRef({});
  const navigate = useNavigate();
  const [hover, setHover] = useState(null);
  const [sceneObj, setSceneObj] = useState(null);

  useEffect(() => {
    const s = new NeighbourhoodScene(host.current, { lots: LOTS, reducedMotion: reducedMotion(), mapOnly: true });
    scene.current = s;
    setSceneObj(s);
    s.snapCamera();
    const place = () => {
      for (const p of s.lotScreenPositions()) {
        const el = pins.current[p.id];
        if (el) el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%)`;
      }
    };
    const offs = [s.on('frame', place), s.on('enter', (id) => navigate(`/work/${id}`)), s.on('hover', setHover)];
    const io = new IntersectionObserver(([e]) => s.setActive(e.isIntersecting));
    io.observe(host.current);
    return () => { offs.forEach((o) => o()); io.disconnect(); s.dispose(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { scene.current?.highlight(highlight || hover); }, [highlight, hover]);
  const { phase } = usePhase();
  useEffect(() => { scene.current?.setClock(SKY_HOUR[phase]); }, [phase]);

  return (
    <div className="map-banner">
      <div className="map-banner__scene" ref={host} aria-hidden="true" />
      <div className="hood__pins" aria-label="Projects on the map">
        {PROJECTS.map((p, i) => (
          <Link
            key={p.id} to={`/work/${p.id}`} className={`pin is-on${p.passion ? ' pin--small' : ''}${pinClass(LOTS[i])}${hover === p.id || highlight === p.id ? ' is-hot' : ''}`}
            ref={(el) => { pins.current[p.id] = el; }} style={pinStyle(LOTS[i], i)}
            onMouseEnter={() => scene.current?.highlight(p.id)} onMouseLeave={() => scene.current?.highlight(null)}
          >
            <PinFace p={p} lot={LOTS[i]} />
          </Link>
        ))}
      </div>
      <p className="map-banner__hint" aria-hidden="true">Click a house to step inside</p>
      <MapZoom scene={sceneObj} />
    </div>
  );
}
