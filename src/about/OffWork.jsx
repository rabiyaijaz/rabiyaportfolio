import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './icons.jsx';
import PhotoTrail from './PhotoTrail.jsx';
import ChaiStove from './ChaiStove.jsx';
import StoryHeader from '../ui/StoryHeader.jsx';
import { OFF_WORK } from '../content/about.js';
import { useSim } from '../lib/simState.jsx';
import { holdMusic, sfx } from '../lib/audio.js';

/** Off work, Sims-style: each thing has an action you can take, and a reason it's here. */
export default function OffWork() {
  const { boost, fulfil, toast } = useSim();
  const [shots, setShots] = useState(0);
  const [flash, setFlash] = useState(0);
  const [orders, setOrders] = useState(0);
  // A cup is done (the Sim finished the action): only now does the Chai Tank fill
  const served = useCallback(() => {
    sfx('complete', { volume: 0.6 });
    boost('chai', 100); fulfil('chai');
    toast({ title: 'Chai Tank refilled', body: 'A fresh cup of doodh patti chai. Productivity restored.' });
  }, [boost, fulfil, toast]);

  // Clicking into the Spotify player moves focus into its frame: pause the Sims music while
  // the visitor is on this page (it comes back when they leave About)
  const spotifyRef = useRef(null);
  useEffect(() => {
    const onBlur = () => setTimeout(() => { if (document.activeElement === spotifyRef.current) holdMusic(true); }, 0);
    addEventListener('blur', onBlur);
    return () => { removeEventListener('blur', onBlur); holdMusic(false); };
  }, []);

  const act = (id) => {
    if (id === 'camera') {
      sfx('camera');
      setShots((n) => n + 1); setFlash((n) => n + 1);
      if (shots === 0) toast({ kind: 'skill', title: 'Skill increased', body: 'Photography +1' });
    }
    if (id === 'chai') setOrders((n) => n + 1); // queue the action; the stove plays it out
  };
  const label = (o) => (o.id === 'camera' && shots ? `${o.action} (${shots})` : o.action);

  return (
    <section className="offwork" aria-labelledby="off-title">
      <div className="story-wrap">
        <StoryHeader label="Off work" id="off-title" title={<>What keeps the <em>Sim happy.</em></>} />
        <ul className="offwork__grid">
          {OFF_WORK.map((o) => (
            <li key={o.id} className={`odd odd--${o.id}`}>
              {o.spotify ? (
                // The real playlist: playing it pauses the site's own music so the two never clash
                <iframe
                  ref={spotifyRef} className="odd__player" src={o.spotify} title={`${o.label}: Spotify playlist`}
                  height="152" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"
                />
              ) : o.id === 'camera' ? (
                <div className="odd__art odd__art--photos" aria-hidden="true">
                  <PhotoTrail shots={shots} />
                  {flash > 0 && <span className="odd__flash" key={flash} />}
                </div>
              ) : o.id === 'chai' ? (
                <div className="odd__art odd__art--chai"><ChaiStove orders={orders} onDone={served} /></div>
              ) : (
                <div className="odd__art" aria-hidden="true"><Icon name={o.icon} size={56} /></div>
              )}
              <h3>{o.label}</h3>
              <p>{o.why}</p>
              <div className="odd__actions">
                {o.action && <button className="ghost-button" onClick={() => act(o.id)}>{label(o)}</button>}
                {o.cta.to ? <Link className="chapter__link" to={o.cta.to}>{o.cta.label} →</Link> : <a className="chapter__link" href={o.cta.href} target="_blank" rel="noreferrer">{o.cta.label} ↗</a>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
