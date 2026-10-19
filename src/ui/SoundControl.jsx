import { useEffect, useRef, useState } from 'react';
import { getAudio, nextTrack, onAudio, setAudio, sfx } from '../lib/audio.js';

/**
 * One sound button for the whole site. Click: mute / unmute everything.
 * Hover or focus: a small menu to switch sound effects and music separately, and skip the track.
 */
export default function SoundControl() {
  const [a, setA] = useState(getAudio);
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const closeT = useRef(null);
  useEffect(() => onAudio(setA), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); wrap.current?.querySelector('button')?.focus(); } };
    const onDoc = (e) => { if (!wrap.current?.contains(e.target)) setOpen(false); };
    addEventListener('keydown', onKey); addEventListener('pointerdown', onDoc);
    return () => { removeEventListener('keydown', onKey); removeEventListener('pointerdown', onDoc); };
  }, [open]);

  const show = () => { clearTimeout(closeT.current); setOpen(true); };
  const hide = () => { closeT.current = setTimeout(() => setOpen(false), 220); };
  const silent = a.muted || (!a.sfx && !a.music);
  const label = silent ? 'Sound off' : !a.music ? 'Effects on, music off' : !a.sfx ? 'Music on, effects off' : 'Sound on';

  return (
    <div className={`sound${open ? ' is-open' : ''}`} ref={wrap} onPointerEnter={show} onPointerLeave={hide} onFocus={show} onBlur={(e) => { if (!wrap.current.contains(e.relatedTarget)) hide(); }}>
      <div className="sound__menu" role="group" aria-label="Sound settings" hidden={!open}>
        <label className="sound__row">
          <span><strong>Sound effects</strong><small>Clicks, steps and rewards</small></span>
          <input type="checkbox" role="switch" checked={a.sfx && !a.muted} onChange={(e) => { setAudio({ sfx: e.target.checked, muted: false }); if (e.target.checked) setTimeout(() => sfx('toggle'), 30); }} />
        </label>
        <label className="sound__row">
          <span><strong>Music</strong><small>{a.track && a.music && !a.muted ? `Now playing · ${a.track}` : 'The Sims soundtrack'}</small></span>
          <input type="checkbox" role="switch" checked={a.music && !a.muted} onChange={(e) => setAudio({ music: e.target.checked, muted: false })} />
        </label>
        {a.music && !a.muted && <button className="sound__next" onClick={nextTrack}>Next track ›</button>}
      </div>
      <button
        className="sound__btn" aria-pressed={!silent} aria-label={`${label}. Click to ${silent ? 'turn sound on' : 'mute'}; hover for options`}
        onClick={() => setAudio(silent ? { muted: false, sfx: true, music: true } : { muted: true })}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
          {silent
            ? <path d="m16 9.5 5 5m0-5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            : <><path d="M15.5 9a4 4 0 0 1 0 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <path d="M18 6.5a7.5 7.5 0 0 1 0 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity={a.music ? 1 : 0.35} /></>}
        </svg>
        {a.playing && !silent && <span className="sound__eq" aria-hidden="true"><i /><i /><i /></span>}
      </button>
    </div>
  );
}
