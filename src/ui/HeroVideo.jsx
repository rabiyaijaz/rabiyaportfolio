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
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const scrubbing = useRef(false);
  // Touch screens have no hover: a tap wakes the controls for a few seconds instead
  const [awake, setAwake] = useState(false);
  const sleepT = useRef(0);
  const wasAwake = useRef(false); // were the controls already showing when this tap began?
  const wake = () => { setAwake(true); clearTimeout(sleepT.current); sleepT.current = setTimeout(() => setAwake(false), 3500); };
  useEffect(() => () => clearTimeout(sleepT.current), []);
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

  // Seek bar: follows playback smoothly (rAF while playing), and jumps wherever the visitor drags or clicks
  useEffect(() => {
    const v = ref.current;
    let raf = 0;
    const tick = () => { if (!scrubbing.current) setTime(v.currentTime); raf = v.paused ? 0 : requestAnimationFrame(tick); };
    const onMeta = () => setDur(v.duration || 0);
    const onPlay = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); };
    const onSeek = () => { if (!scrubbing.current) setTime(v.currentTime); };
    if (v.readyState >= 1) onMeta();
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('play', onPlay);
    v.addEventListener('seeked', onSeek);
    v.addEventListener('timeupdate', onSeek);
    if (!v.paused) onPlay();
    return () => { cancelAnimationFrame(raf); ['loadedmetadata', 'play', 'seeked', 'timeupdate'].forEach((n, i) => v.removeEventListener(n, [onMeta, onPlay, onSeek, onSeek][i])); };
  }, []);
  const seek = (t) => {
    const v = ref.current;
    const to = Math.max(0, Math.min(dur || v.duration || 0, t));
    v.currentTime = to; setTime(to);
  };
  const onSeekKey = (e) => {
    const step = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5 }[e.key];
    if (step) { e.preventDefault(); seek(time + step); }
    else if (e.key === 'Home') { e.preventDefault(); seek(0); }
    else if (e.key === 'End') { e.preventDefault(); seek(dur - 0.1); }
  };
  const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

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
      <div className={`hero-video__frame${awake ? ' is-awake' : ''}`} ref={frameRef} onPointerDown={(e) => { if (e.pointerType !== 'mouse') { wasAwake.current = awake; wake(); } }}>
        <video
          ref={ref} src={src} poster={poster} autoPlay={!reduced} muted loop playsInline preload="metadata" aria-label={title}
          // On touch, the first tap only shows the controls; a tap while they're showing plays or pauses
          onPointerUp={(e) => { if (e.pointerType === 'mouse' || wasAwake.current) togglePlay(); }}
        />
        <div className="hero-video__controls">
          <button onClick={togglePlay} aria-label={paused ? 'Play video' : 'Pause video'}>
            {paused ? <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg> : <svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>}
          </button>
          <div className="hero-video__seek">
            <span className="hero-video__time" aria-hidden="true">{clock(time)}</span>
            <input
              type="range" min="0" max={dur || 0} step="0.01" value={Math.min(time, dur || 0)}
              style={{ '--p': `${dur ? (time / dur) * 100 : 0}%` }}
              aria-label={`Video position`} aria-valuetext={`${clock(time)} of ${clock(dur)}`}
              onPointerDown={() => { scrubbing.current = true; addEventListener('pointerup', () => { scrubbing.current = false; }, { once: true }); }}
              onInput={(e) => seek(+e.target.value)} onChange={() => {}}
              onKeyDown={onSeekKey}
            />
            <span className="hero-video__time" aria-hidden="true">{clock(dur)}</span>
          </div>
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
