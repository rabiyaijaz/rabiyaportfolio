import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ChaiStove from '../about/ChaiStove.jsx';
import { useSim } from '../lib/simState.jsx';
import { sfx } from '../lib/audio.js';
import '../about/about.css';
import '../rangeen.css';

/**
 * Inside the Rangeen house: one warm room after the set in the video, with two things to do.
 * The mirror (mint frame, a shelf of comb, brush and bottle): check yourself out, put on the red shades,
 * fix your hair. And the chai corner (the same stove as on the About page). Esc or "Step outside" leaves.
 */
export default function RangeenRoom({ onClose, onChai }) {
  const { toast } = useSim();
  const [look, setLook] = useState(false);   // has she looked in the mirror yet
  const [shades, setShades] = useState(false);
  const [fix, setFix] = useState(0);         // bumps the hair-fix wiggle
  const [orders, setOrders] = useState(0);
  const closeRef = useRef(null);

  useEffect(() => {
    const back = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { removeEventListener('keydown', onKey); document.body.style.overflow = ''; back?.focus?.(); };
  }, [onClose]);

  const checkOut = () => { setLook(true); sfx('want', { volume: 0.5 }); toast({ kind: 'want', title: 'Looking rangeen', body: 'The mirror approves. ✨' }); };
  const toggleShades = () => { setLook(true); setShades((s) => !s); sfx('toggle', { volume: 0.5 }); };
  const fixHair = () => { setLook(true); setFix((n) => n + 1); sfx('open', { volume: 0.4 }); };
  const makeChai = () => { setOrders((n) => n + 1); onChai?.(); };

  return createPortal(
    <div className="rgr" role="dialog" aria-modal="true" aria-labelledby="rgr-title">
      <div className="rgr__room">
        {/* the room itself: fairy lights and tinsel along the top, floral wallpaper, red satin below */}
        <div className="rgr__lights" aria-hidden="true">{Array.from({ length: 34 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</div>
        <div className="rgr__tinsel" aria-hidden="true" />
        <div className="rgr__satin" aria-hidden="true" />

        <header className="rgr__head">
          <p className="rgr__kicker">Rangeen house</p>
          <h2 id="rgr-title">Come in, make yourself at home.</h2>
          <button ref={closeRef} className="rgr__out" onClick={onClose}>Step outside <kbd>Esc</kbd></button>
        </header>

        <div className="rgr__stations">
          {/* ---- the mirror ---- */}
          <section className="rgr__mirror" aria-label="The mirror">
            <button className={`mirror${look ? ' is-on' : ''}`} onClick={checkOut} aria-label="Look in the mirror">
              <span className="mirror__glass">
                <span className="mirror__wall" aria-hidden="true"><span className="mirror__window" /><span className="mirror__door" /></span>
                <span className={`mirror__me${fix ? ' is-fixing' : ''}`} key={fix} aria-hidden="true">
                  <img src="/img/about/sim-full.webp" alt="" />
                  {shades && (
                    <svg className="mirror__shades" viewBox="0 0 100 34" aria-hidden="true">
                      <path d="M4 10h92" stroke="#c9a46a" strokeWidth="2" />
                      <circle cx="28" cy="18" r="14" fill="#c4232b" fillOpacity=".85" stroke="#d8b57a" strokeWidth="2.4" />
                      <circle cx="72" cy="18" r="14" fill="#c4232b" fillOpacity=".85" stroke="#d8b57a" strokeWidth="2.4" />
                      <path d="M42 16q8-5 16 0" fill="none" stroke="#d8b57a" strokeWidth="2.4" />
                      <path d="M20 12q6-4 12 0M64 12q6-4 12 0" stroke="#fff" strokeOpacity=".55" strokeWidth="2" fill="none" />
                    </svg>
                  )}
                </span>
                {!look && <span className="mirror__fog">Click to take a look</span>}
                <span className="mirror__shine" aria-hidden="true" />
              </span>
            </button>
            <div className="mirror__shelf" aria-hidden="true">
              <span className="shelf__comb" /><span className="shelf__brush"><i /></span><span className="shelf__bottle" /><span className="shelf__tube" />
            </div>
            <div className="rgr__actions">
              <button onClick={checkOut}>👀 Check yourself out</button>
              <button onClick={toggleShades} aria-pressed={shades}>🕶 {shades ? 'Shades off' : 'Shades on'}</button>
              <button onClick={fixHair}>💇 Fix your hair</button>
            </div>
          </section>

          {/* ---- the chai corner ---- */}
          <section className="rgr__chai" aria-label="The chai corner">
            <p className="rgr__label">Chai corner</p>
            <div className="rgr__stove">
              <ChaiStove orders={orders} onDone={() => toast({ kind: 'want', title: 'Chai’s ready', body: 'Doodh patti, Rangeen style. ☕' })} />
            </div>
            <button className="button rgr__brew" onClick={makeChai}>☕ Make chai</button>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
