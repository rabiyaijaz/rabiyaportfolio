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

  // Volume: the slider sets the level; 0 means muted, and raising it from 0 unmutes
  const [vol, setVol] = useState(1);
  const unmute = (v) => { v.muted = false; setMuted(false); if (v.paused && !v.dataset.userPaused) { v.play(); setPaused(false); } };
  const toggleSound = () => {
    const v = ref.current;
    if (v.muted) {
      if (vol === 0) { v.volume = 0.6; setVol(0.6); } // unmuting from a dragged-to-zero slider brings back a sensible level
      unmute(v);
    } else { v.muted = true; setMuted(true); }
  };
  const setVolume = (x) => {
    const v = ref.current;
    const to = Math.round(Math.max(0, Math.min(1, x)) * 100) / 100;
    v.volume = to; setVol(to);
    if (to === 0) { v.muted = true; setMuted(true); } else if (v.muted) unmute(v);
  };
  const level = muted ? 0 : vol;
  const onVolKey = (e) => {
    const step = { ArrowLeft: -0.1, ArrowDown: -0.1, ArrowRight: 0.1, ArrowUp: 0.1 }[e.key];
    if (step) { e.preventDefault(); setVolume(level + step); }
    else if (e.key === 'Home') { e.preventDefault(); setVolume(0); }
    else if (e.key === 'End') { e.preventDefault(); setVolume(1); }
  };
  // Full screen: the whole frame (so the custom controls come along); iPhones only allow the video's own player
  const [full, setFull] = useState(false);
  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === frameRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  const toggleFull = () => {
    const f = frameRef.current, v = ref.current;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (f.requestFullscreen) f.requestFullscreen().catch(() => v.webkitEnterFullscreen?.());
    else v.webkitEnterFullscreen?.();
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
          <button className="hero-video__full" onClick={toggleFull} aria-label={full ? 'Exit full screen' : 'Full screen'}>
            {full
              ? <svg viewBox="0 0 24 24"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>
              : <svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>}
          </button>
          <div className="hero-video__audio">
            <input
              className="hero-video__vol" type="range" min="0" max="1" step="0.01" value={level}
              style={{ '--p': `${level * 100}%` }}
              aria-label="Volume" aria-valuetext={`${Math.round(level * 100)}%`}
              onInput={(e) => setVolume(+e.target.value)} onChange={() => {}} onKeyDown={onVolKey}
            />
            <button onClick={toggleSound} aria-pressed={!muted} aria-label={muted ? 'Unmute' : 'Mute'} className="hero-video__sound">
              {muted
                ? <svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9zM16 9l5 6M21 9l-5 6" /></svg>
                : vol < 0.5
                  ? <svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7" /></svg>
                  : <svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>}
              <span aria-hidden="true">{muted ? 'Tap for sound' : 'Sound on'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
