import { useEffect, useRef, useState } from 'react';

/**
 * Case-study hero video: starts muted and looping (autoplay-safe), with a
 * sound toggle. A soft glow of the poster breathes behind the frame, and the
 * frame tilts a touch toward the cursor. Reduced motion: no autoplay, no tilt.
 */
export default function HeroVideo({ src, poster, title }) {
  const ref = useRef(null);
  const frameRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const v = ref.current;
    if (reduced) { v?.pause(); setPaused(true); return; }
    // Muted autoplay can be deferred in background tabs; start once visible
    const tryPlay = () => { if (!document.hidden && v?.paused && !v.dataset.userPaused) v.play().catch(() => setPaused(true)); };
    tryPlay();
    document.addEventListener('visibilitychange', tryPlay);
    return () => document.removeEventListener('visibilitychange', tryPlay);
  }, [reduced]);

  const toggleSound = () => {
    const v = ref.current;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted && v.paused) { v.play(); setPaused(false); }
  };
  const togglePlay = () => {
    const v = ref.current;
    if (v.paused) { delete v.dataset.userPaused; v.play(); setPaused(false); } else { v.dataset.userPaused = '1'; v.pause(); setPaused(true); }
  };

  const onMove = (e) => {
    if (reduced) return;
    const r = frameRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    frameRef.current.style.setProperty('--rx', `${-y * 3}deg`);
    frameRef.current.style.setProperty('--ry', `${x * 4}deg`);
  };
  const onLeave = () => { frameRef.current.style.setProperty('--rx', '0deg'); frameRef.current.style.setProperty('--ry', '0deg'); };

  return (
    <div className="hero-video" style={{ '--poster': `url(${poster})` }} onPointerMove={onMove} onPointerLeave={onLeave}>
      <span className="hero-video__glow" aria-hidden="true" />
      <div className="hero-video__frame" ref={frameRef}>
        <video ref={ref} src={src} poster={poster} autoPlay={!reduced} muted loop playsInline preload="metadata" aria-label={title} onClick={togglePlay} />
        <div className="hero-video__controls">
          <button onClick={togglePlay} aria-label={paused ? 'Play video' : 'Pause video'}>
            {paused ? <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg> : <svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>}
          </button>
          <button onClick={toggleSound} aria-pressed={!muted} className="hero-video__sound">
            {muted
              ? <svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9zM16 9l5 6M21 9l-5 6" /></svg>
              : <svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>}
            <span>{muted ? 'Tap for sound' : 'Sound on'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
