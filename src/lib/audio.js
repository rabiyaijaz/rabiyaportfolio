// Site-wide audio, after the audio-design skill (Rabiya's works/access adda game/skills/.../audio-design):
// two buses (music, sfx) into a master, volumes set in dB, SFX pitch variation, and music ducked
// under reward sounds. Music is on by default and starts as early as the browser allows (see initAudio).
// Preferences persist per visitor: { muted, sfx, music }.

const KEY = 'rn.audio.v1';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const saved = read();
const prefs = { muted: !!saved.muted, sfx: saved.sfx ?? true, music: saved.music ?? true };
const listeners = new Set();
const save = () => {
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* private mode */ }
  listeners.forEach((fn) => fn({ ...prefs, track: current?.title || null, playing: !!(audioEl && !audioEl.paused) }));
};

const db = (d) => Math.pow(10, d / 20);
const LEVEL = { master: -2, sfx: -9, music: -17 }; // headroom: everything sums below 0 dBFS

// Music: the Sims 2 tracks in public/music (see README note on licensing before publishing)
export const TRACKS = [
  { src: '/music/theme.mp3', title: 'The Sims 2 Theme' },
  { src: '/music/sim-time-sim-place.mp3', title: 'Sim Time Sim Place' },
  { src: '/music/bare-bones.mp3', title: 'Bare Bones' },
  { src: '/music/makeover.mp3', title: 'Makeover' },
  { src: '/music/busy-sim.mp3', title: 'Busy Sim' },
];

let ctx, master, sfxBus, musicBus, audioEl, current, trackIndex = 0, unlocked = false;
const buffers = new Map();
const FILES = ['whoosh', 'coin', 'chime', 'want', 'skill', 'camera', 'splash', 'complete'];

function graph() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain(); master.connect(ctx.destination);
  sfxBus = ctx.createGain(); sfxBus.connect(master);
  musicBus = ctx.createGain(); musicBus.connect(master);
  applyGains(0);
  FILES.forEach((n) => fetch(`/sounds/ui/${n}.mp3`).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b)).then((buf) => buffers.set(n, buf)).catch(() => {}));
  return ctx;
}

function applyGains(ramp = 0.25) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const set = (node, v) => { node.gain.cancelScheduledValues(t); node.gain.setValueAtTime(node.gain.value, t); node.gain.linearRampToValueAtTime(v, t + ramp); };
  set(master, prefs.muted ? 0 : db(LEVEL.master));
  set(sfxBus, prefs.sfx ? db(LEVEL.sfx) : 0);
  set(musicBus, prefs.music ? db(LEVEL.music) * (1 - zoneLevel()) : 0); // the soundtrack makes way for a place's song
}

// ---------------------------------------------------------------- zone music
// A place on the street can play its own song, faded by how close the visitor is (0–1). While one plays,
// the soundtrack fades out by the same amount. It follows the music preference and the mute button.
const zones = new Map(); // name → { el, gain, level }
if (import.meta.env.DEV) window.__zones = zones;
const zoneLevel = () => Math.max(0, ...[...zones.values()].map((z) => z.level));
export function zoneMusic(name, src, level) {
  level = Math.max(0, Math.min(1, level));
  let z = zones.get(name);
  if (!z) {
    if (level <= 0 || !graph()) return;
    const el = new Audio(src); el.loop = true; el.preload = 'auto'; el.crossOrigin = 'anonymous';
    const gain = ctx.createGain(); gain.gain.value = 0;
    ctx.createMediaElementSource(el).connect(gain); gain.connect(master);
    z = { el, gain, level: 0 }; zones.set(name, z);
  }
  if (Math.abs(z.level - level) < 0.01 && !(level === 0 && !z.el.paused)) return;
  z.level = level;
  const audible = unlocked && prefs.music && !prefs.muted && !held && !document.hidden;
  const t = ctx.currentTime, target = audible ? level * level * db(LEVEL.music + 7) : 0; // squared: it swells as you arrive
  z.gain.gain.cancelScheduledValues(t); z.gain.gain.setValueAtTime(z.gain.gain.value, t); z.gain.gain.linearRampToValueAtTime(target, t + 0.3);
  if (audible && level > 0 && z.el.paused) { if (ctx.state === 'suspended') ctx.resume(); z.el.play().catch(() => {}); }
  if ((!audible || level === 0) && !z.el.paused) setTimeout(() => { if (z.level === 0 || !prefs.music || prefs.muted) z.el.pause(); }, 400);
  applyGains(0.3);
}

// ---------------------------------------------------------------- music
function loadTrack(i) {
  trackIndex = (i + TRACKS.length) % TRACKS.length;
  current = TRACKS[trackIndex];
  audioEl.src = current.src;
}
function ensureMusic() {
  if (audioEl || !graph()) return;
  audioEl = new Audio();
  audioEl.preload = 'auto';
  audioEl.crossOrigin = 'anonymous';
  ctx.createMediaElementSource(audioEl).connect(musicBus);
  audioEl.addEventListener('ended', () => { loadTrack(trackIndex + 1); audioEl.play().catch(() => {}); save(); });
  loadTrack(0);
}
// A page can hold the music for a while (e.g. while a Spotify embed is playing) without
// changing the visitor's saved preference
let held = false;
export function holdMusic(on) { held = !!on; syncMusic(); }
function syncMusic() {
  const want = unlocked && prefs.music && !prefs.muted && !held && !document.hidden;
  if (want) {
    ensureMusic();
    if (audioEl?.paused) {
      // Fade in rather than blasting in
      const t = ctx.currentTime;
      musicBus.gain.cancelScheduledValues(t); musicBus.gain.setValueAtTime(0, t); musicBus.gain.linearRampToValueAtTime(db(LEVEL.music) * (1 - zoneLevel()), t + 2.5);
      audioEl.play().then(save).catch(() => {});
    }
  }
  else if (audioEl && !audioEl.paused) { audioEl.pause(); save(); }
  // zone songs follow the same rules: re-apply their level now that the conditions changed
  for (const [name, z] of zones) { const l = z.level; z.level = -1; zoneMusic(name, z.el.src, l); }
}
export function nextTrack() {
  ensureMusic();
  if (!audioEl) return;
  loadTrack(trackIndex + 1);
  if (prefs.music && !prefs.muted) audioEl.play().catch(() => {});
  save();
}

/** Briefly lower the music under an important sound, then let it recover (sidechain-style). */
function duck(dbDown = -8, hold = 0.6) {
  if (!ctx || !prefs.music) return;
  const t = ctx.currentTime, base = db(LEVEL.music) * (1 - zoneLevel());
  musicBus.gain.cancelScheduledValues(t);
  musicBus.gain.setValueAtTime(musicBus.gain.value, t);
  musicBus.gain.linearRampToValueAtTime(base * db(dbDown), t + 0.04);
  musicBus.gain.setValueAtTime(base * db(dbDown), t + hold);
  musicBus.gain.linearRampToValueAtTime(base, t + hold + 0.45);
}

// ---------------------------------------------------------------- sfx
const vary = (x = 0.05) => 1 + (Math.random() * 2 - 1) * x;
/** Small synthesized UI sounds: crisp, tiny, no files. */
function synth(kind, gain = 1) {
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(sfxBus);
  o.start(t); // must start before each branch schedules its stop
  const env = (peak, a, d) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak * gain, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
  if (kind === 'tap') { o.type = 'triangle'; o.frequency.setValueAtTime(880 * vary(), t); o.frequency.exponentialRampToValueAtTime(520, t + 0.06); env(0.5, 0.004, 0.08); o.stop(t + 0.1); }
  if (kind === 'hover') { o.type = 'sine'; o.frequency.setValueAtTime(1320 * vary(0.03), t); env(0.12, 0.004, 0.05); o.stop(t + 0.07); }
  if (kind === 'open') { o.type = 'sine'; o.frequency.setValueAtTime(520 * vary(0.03), t); o.frequency.exponentialRampToValueAtTime(980, t + 0.09); env(0.35, 0.006, 0.12); o.stop(t + 0.15); }
  if (kind === 'toggle') { o.type = 'square'; o.frequency.setValueAtTime(660 * vary(0.02), t); env(0.12, 0.003, 0.05); o.stop(t + 0.07); }
  if (kind === 'step') { o.type = 'sine'; o.frequency.setValueAtTime(140 * vary(0.12), t); o.frequency.exponentialRampToValueAtTime(70, t + 0.07); env(0.4, 0.004, 0.08); o.stop(t + 0.1); }
}

const DUCK = new Set(['want', 'skill', 'complete', 'coin']);
/** Play a named sound: a synth ('tap' | 'hover' | 'open' | 'toggle' | 'step') or a file in /sounds/ui. */
export function sfx(name, { volume = 1 } = {}) {
  if (!unlocked || prefs.muted || !prefs.sfx || !graph()) return;
  if (ctx.state === 'suspended') ctx.resume();
  if (['tap', 'hover', 'open', 'toggle', 'step'].includes(name)) return synth(name, volume);
  const buf = buffers.get(name);
  if (!buf) return;
  const src = ctx.createBufferSource(), g = ctx.createGain();
  src.buffer = buf; src.playbackRate.value = vary(0.04);
  g.gain.value = volume;
  src.connect(g); g.connect(sfxBus); src.start();
  if (DUCK.has(name)) duck();
}

// ---------------------------------------------------------------- preferences
export const getAudio = () => ({ ...prefs, track: current?.title || null, playing: !!(audioEl && !audioEl.paused) });
export function setAudio(patch) {
  Object.assign(prefs, patch);
  applyGains();
  syncMusic();
  save();
}
export function onAudio(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/** The music is on by default. Sound starts on page load where the browser allows autoplay
 *  (sites people visit often, or with sound allowed); everywhere else it starts on the very first
 *  click, tap or key press, which is the earliest any browser permits. Visitors can mute any time. */
const GESTURES = ['pointerdown', 'pointerup', 'click', 'touchend', 'keydown'];
export function initAudio() {
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    GESTURES.forEach((e) => removeEventListener(e, unlock, true));
    if (graph()?.state === 'suspended') ctx.resume();
    syncMusic();
    save();
  };
  GESTURES.forEach((e) => addEventListener(e, unlock, true));
  document.addEventListener('visibilitychange', syncMusic);
  // Try straight away: if the browser lets the audio context run without a gesture, play now
  if (prefs.music && !prefs.muted && graph()) {
    ctx.resume().then(() => { if (ctx.state === 'running') unlock(); }).catch(() => {});
  }
}
