import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CAREER, FEARS, INVENTORY, NEEDS, OFF_WORK, PERSONALITY, RELATIONSHIPS, WANTS } from '../content/about.js';
import { useSim } from '../lib/simState.jsx';
import { usePhase } from '../lib/phase.jsx';
import SimMenu from './SimMenu.jsx';
import Icon from '../about/icons.jsx';
import { sfx } from '../lib/audio.js';
import '../room.css';
import '../hud.css';
import Arrow from './Arrow.jsx';

const img = (n) => `/img/about/${n}.webp`;

// The Sims 2 HUD, after Rabiya's Figma frames (ffigma/SimDesktop - InGame*.png):
// mode dial · portrait + clock · wants & fears · a vertical tab strip · one panel at a time.
const TABS = [
  { id: 'needs', label: 'Needs', icon: 'needs' },
  { id: 'traits', label: 'Personality', icon: 'traits' },
  { id: 'skills', label: 'Career & Skills', icon: 'skills' },
  { id: 'people', label: 'Relationships & References', icon: 'people' },
  { id: 'items', label: 'Inventory & Rewards', icon: 'items' },
  { id: 'offwork', label: 'Off work', icon: 'chai' },
  { id: 'wants', label: 'Wants & Fears', icon: 'wants' },
];
// The mode dial: Live (needs) in the middle, the other sections around it, plus Build → Work and ••• → Contact
const DIAL = [
  { id: 'needs', label: 'Live mode · Needs', icon: 'people', center: true },
  { id: 'traits', label: 'Personality', icon: 'traits' },
  { id: 'skills', label: 'Career & Skills', icon: 'skills' },
  { id: 'people', label: 'Relationships', icon: 'empathetic' },
  { id: 'items', label: 'Inventory', icon: 'items' },
  { id: 'offwork', label: 'Off work', icon: 'chai' },
  { id: 'work', label: 'Build mode · See the work', icon: 'design', to: '/work',
    ask: { title: 'Leave the lot?', body: 'Head over to the Work page to see the projects I’ve designed?' } },
  { id: 'contact', label: 'Contact', icon: 'social', to: '/contact',
    ask: { title: 'Leave the lot?', body: 'Head over to the Contact page to send me a message?' } },
];
const NEED_ICON = { hunger: 'hunger', fun: 'fun', screen: 'screen', social: 'social', flow: 'flow', energy: 'energy', chai: 'chai', environment: 'environment' };

export default function Room() {
  const navigate = useNavigate();
  const { boost, fulfil, toast } = useSim();
  const { phase, now } = usePhase();
  const [panel, setPanel] = useState('needs');
  // A link to a panel (/about#people from search): open it, bring the room into view, and make the panel glow
  const { hash } = useLocation();
  useEffect(() => {
    const id = hash.slice(1);
    if (!TABS.some((t) => t.id === id)) return;
    setPanel(id);
    scrollTo({ top: 0, behavior: 'auto' });
    const t = setTimeout(() => {
      const el = document.getElementById('hud-panel');
      if (!el) return;
      el.classList.remove('is-found'); void el.offsetWidth; el.classList.add('is-found');
      setTimeout(() => el.classList.remove('is-found'), 1900);
    }, 80);
    return () => clearTimeout(t);
  }, [hash]);
  const [menu, setMenu] = useState(null);
  const [bubble, setBubble] = useState(false);
  const [leave, setLeave] = useState(null); // the dial item waiting for "leave the lot?" confirmation
  const simRef = useRef(null);

  // Her needs only change when the visitor does something for her from the pie menu.
  // Each action opens the Needs panel so the bar can be seen filling up.
  const [needs, setNeeds] = useState(ABOUT_NEEDS);
  const [popNeed, setPopNeed] = useState(null);
  const cheese = useRef(0);
  const care = useCallback((gains, sound) => {
    setNeeds((v) => Object.fromEntries(Object.entries(v).map(([k, x]) => [k, Math.min(100, x + (gains[k] || 0))])));
    setPanel('needs');
    setPopNeed(Object.keys(gains)); setTimeout(() => setPopNeed(null), 900);
    if (sound) sfx(sound, { volume: 0.6 });
  }, []);

  const sayHi = useCallback(() => { setBubble(true); fulfil('hi'); boost('social', 20); care({ social: 12 }); }, [fulfil, boost, care]);
  const makeChai = useCallback(() => {
    boost('chai', 100); fulfil('chai'); care({ chai: 100 }, 'splash');
    toast({ title: 'Chai Tank refilled', body: 'A fresh cup of doodh patti chai. Productivity restored.' });
  }, [boost, fulfil, toast, care]);
  const eatGrilledCheese = useCallback(() => {
    care({ hunger: 50 }, 'want');
    cheese.current += 1;
    // The Sims' hidden aspiration unlocks after three grilled cheese sandwiches
    if (cheese.current === 3) toast({ kind: 'want', title: 'Aspiration unlocked: Grilled Cheese', body: 'Three in a row. Every Simmer knows what that means.' });
    else toast({ title: 'Ate a grilled cheese', body: cheese.current === 1 ? 'The most Sims meal there is. Hunger going up.' : 'Another one. Something feels… aspirational.' });
  }, [care, toast]);
  const takeNap = useCallback(() => {
    care({ screen: 50, energy: 10 }, 'chime');
    toast({ title: 'Power nap taken', body: 'Twenty minutes, eyes off every screen. Zzz.' });
  }, [care, toast]);
  const waterPlants = useCallback(() => {
    care({ environment: 12, fun: 4 }, 'splash');
    toast({ title: 'Plants watered', body: 'The monstera says thank you.' });
  }, [care, toast]);
  useEffect(() => {
    if (!bubble) return;
    const t = setTimeout(() => setBubble(false), 6000);
    return () => clearTimeout(t);
  }, [bubble]);

  const openSimMenu = () => {
    const r = simRef.current.getBoundingClientRect();
    setMenu({ x: r.left + r.width / 2, y: r.top + r.height * 0.12 });
  };
  const tab = TABS.find((t) => t.id === panel);
  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <section className={`room room--${phase}`} aria-label="Rabiya's room, interactive">
      <div className="room__stage">
        <img className="room__bg" src={img('room')} alt="" />
        <div className="room__tint" aria-hidden="true" />
        {/* The room is backdrop only: the Sim and the HUD are the ways in */}
        <img className="room__sim" src={img('sim-full')} alt="Rabiya's avatar: a green frog bucket hat, long black hair, an oversized black anime tee and black cargo pants" />
        {/* Her mood is good, so the plumbob is green */}
        <span className="room__plumbob" style={{ '--mood': 'var(--accent)' }} aria-hidden="true" />
        <button ref={simRef} className="room__simhit" onClick={openSimMenu} aria-haspopup="menu" aria-label="Interact with Rabiya" />
        {bubble && (
          <div className="room__bubble" role="status">
            <p><strong>Sul sul!</strong> Thanks for stopping by. Want to see what I’ve been building?</p>
            <Link to="/work">See my work <Arrow dir="right" /></Link>
          </div>
        )}
      </div>

      {/* Household: the Sim's portrait on the left edge, as in the game */}
      <div className="household" aria-hidden="true">
        <img src="/img/portrait-160.webp" alt="" />
      </div>

      {/* The HUD, redrawn from Rabiya's Figma (assets-raw/hud-left.png) in the site's glass style:
          one bar with the mode dial, the Sim card, wants & fears, and the open panel. Everything is a way in. */}
      <div className="hud">
        <nav className="hud-dial" aria-label="Sim panels">
          <span className="hud-dial__ring" aria-hidden="true" />
          {DIAL.map((d, i) => {
            const style = d.center ? undefined : { '--a': `${-90 + (i - 1) * (360 / (DIAL.length - 1))}deg`, '--k': i };
            const cls = `hud-dial__btn hud-dial__btn--${d.id}${d.center ? ' hud-dial__btn--live' : ''}`;
            const inner = <><Icon name={d.icon} size={d.center ? 30 : 19} /><span className="hud-dial__tip">{d.label}</span></>;
            // Leaving the room asks first, Sims-style; modified clicks still open the page directly
            return d.to
              ? <Link key={d.id} className={cls} style={style} to={d.to} aria-label={d.label} aria-haspopup="dialog"
                  onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); sfx('chime', { volume: 0.5 }); setLeave(d); }}>{inner}</Link>
              : <button key={d.id} className={cls} style={style} aria-pressed={panel === d.id} aria-controls="hud-panel" onClick={() => setPanel(d.id)} aria-label={d.label}>{inner}</button>;
          })}
        </nav>

        <div className="hud-sim">
          <button className="hud-sim__face" onClick={sayHi} aria-label="Say hi to Rabiya">
            <img src="/img/portrait-160.webp" alt="" width="160" height="200" />
          </button>
          <div className="hud-sim__meta">
            <strong>Rabiya Ijaz</strong>
            <span>Lead Product Designer</span>
            <span className="hud-sim__mood" title="Mood: Inspired"><i style={{ width: '86%' }} /></span>
            <span className="hud-sim__clock"><Icon name="needs" size={12} /> {time} · Inspired</span>
          </div>
        </div>

        <button className="hud-wants" aria-pressed={panel === 'wants'} aria-controls="hud-panel" onClick={() => setPanel('wants')} aria-label="Wants and fears">
          <span className="hud-wants__label">Wants</span>
          <span className="hud-wants__row hud-wants__row--want">{WANTS.map((w) => <img key={w.id} src={img(w.img)} alt="" title={w.label} />)}</span>
          <span className="hud-wants__label">Fears</span>
          <span className="hud-wants__row hud-wants__row--fear">{FEARS.map((f) => <img key={f.id} src={img(f.img)} alt="" title={f.label} />)}</span>
        </button>

        <section className="hud-panel" id="hud-panel" role="region" aria-live="polite" aria-labelledby="hud-panel-title" key={panel}>
          <header className="hud-panel__head">
            <span className="hud-panel__icon" aria-hidden="true"><Icon name={tab.icon} size={16} /></span>
            <h2 id="hud-panel-title">{tab.label}</h2>
          </header>
          {panel === 'needs' && <NeedsPanel vals={needs} pop={popNeed} onCare={openSimMenu} />}
          {panel === 'traits' && <TraitsPanel />}
          {panel === 'skills' && <SkillsPanel />}
          {panel === 'people' && <PeoplePanel />}
          {panel === 'items' && <ItemsPanel />}
          {panel === 'offwork' && <OffWorkPanel />}
          {panel === 'wants' && <WantsPanel />}
        </section>
      </div>

      {menu && (
        <SimMenu
          x={menu.x} y={menu.y} onClose={() => setMenu(null)}
          items={[
            { label: 'Ask about work', icon: '💼', onSelect: () => navigate('/work') },
            { label: 'Make chai', icon: '☕', onSelect: makeChai },
            { label: 'Eat grilled cheese', icon: '🧀', onSelect: eatGrilledCheese },
            { label: 'Water the plants', icon: '🪴', onSelect: waterPlants },
            { label: 'Take a power nap', icon: '💤', onSelect: takeNap },
            { label: 'Say hi', icon: '👋', onSelect: sayHi },
          ]}
        />
      )}
      {leave && <LeaveDialog item={leave} onCancel={() => setLeave(null)} onGo={() => navigate(leave.to)} />}
    </section>
  );
}

// ---------------------------------------------------------------- panels
/** The Sims' "are you sure?" box: a question, a green tick and a red cross. Esc or the backdrop cancels. */
function LeaveDialog({ item, onCancel, onGo }) {
  const yes = useRef(null);
  const cancel = useRef(onCancel);
  cancel.current = onCancel;
  useEffect(() => {
    const back = document.activeElement;
    yes.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') cancel.current(); };
    addEventListener('keydown', onKey);
    return () => { removeEventListener('keydown', onKey); back?.focus?.(); };
  }, []);
  // Keep Tab inside the two buttons
  const trap = (e) => {
    if (e.key !== 'Tab') return;
    const [a, b] = e.currentTarget.querySelectorAll('button');
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
    else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
  };
  return createPortal(
    <div className="leave" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="leave__box" role="alertdialog" aria-modal="true" aria-labelledby="leave-title" aria-describedby="leave-body" onKeyDown={trap}>
        <span className="leave__bob" aria-hidden="true" />
        <p className="leave__title" id="leave-title">{item.ask.title}</p>
        <p className="leave__body" id="leave-body">{item.ask.body}</p>
        <div className="leave__actions">
          <button ref={yes} className="leave__btn leave__btn--yes" onClick={onGo} aria-label="Yes, take me there">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7" /></svg>
          </button>
          <button className="leave__btn leave__btn--no" onClick={onCancel} aria-label="No, stay here">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" /></svg>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

const tone = (v) => (v >= 60 ? 'good' : v >= 35 ? 'mid' : 'low');

function Bar({ value, max = 100, label }) {
  const pct = (value / max) * 100;
  return (
    <span className={`hud-bar hud-bar--${tone(pct)}`} role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)} aria-label={label}>
      <i style={{ width: `${pct}%` }} />
    </span>
  );
}

// A snapshot of her needs, not a live game: mostly green, with hunger, screen rest and chai
// running a little low (that's what a designer's day looks like).
const ABOUT_NEEDS = { hunger: 48, fun: 86, screen: 46, social: 84, flow: 96, energy: 90, chai: 40, environment: 88 };

/** Read-only bars. They fill when the visitor looks after her from the pie menu (click the Sim). */
function NeedsPanel({ vals, pop, onCare }) {
  return (
    <>
      <ul className="hud-needs">
        {NEEDS.map((n) => {
          const value = vals[n.id] ?? n.value;
          const t = tone(value);
          const arrows = value < 35 ? '◀◀' : value < 60 ? '◀' : value > 80 ? '▶▶' : '▶';
          return (
            <li key={n.id}>
              <div className={`hud-need${pop?.includes(n.id) ? ' is-pop' : ''}`}>
                <span className="hud-need__label"><Icon name={NEED_ICON[n.id] || 'needs'} size={13} />{n.label}</span>
                <span className="hud-need__row">
                  <span className={`hud-trend hud-trend--${t}`} aria-hidden="true">{arrows.includes('◀') ? arrows : ''}</span>
                  <Bar value={value} label={n.label} />
                  <span className={`hud-trend hud-trend--${t}`} aria-hidden="true">{arrows.includes('▶') ? arrows : ''}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <button className="hud-needs__hint" onClick={onCare}>
        <span aria-hidden="true">✦</span> Click Rabiya to look after her: chai, a grilled cheese, a nap…
      </button>
    </>
  );
}

function TraitsPanel() {
  return (
    <ul className="hud-traits">
      {PERSONALITY.map((p) => (
        <li key={p.label}>
          <span className="hud-traits__name"><Icon name={p.label.toLowerCase()} size={14} />{p.label}</span>
          <span className="hud-pips" role="meter" aria-valuemin={0} aria-valuemax={10} aria-valuenow={p.value} aria-label={p.label}>
            {Array.from({ length: 10 }, (_, i) => <i key={i} className={i < p.value ? 'on' : ''} style={{ '--i': i }} />)}
          </span>
          <b>{p.value}/10</b>
        </li>
      ))}
    </ul>
  );
}

function SkillsPanel() {
  return (
    <>
      <dl className="hud-facts">
        {CAREER.facts.map(([k, v]) => <div key={k}><dt>{k}:</dt><dd>{v}</dd></div>)}
      </dl>
      <ul className="hud-skills">
        {CAREER.skills.map((s) => (
          <li key={s.label}>
            <span>{s.label}</span>
            <span className="hud-segs" role="meter" aria-valuemin={0} aria-valuemax={10} aria-valuenow={s.value} aria-label={s.label}>
              {Array.from({ length: 10 }, (_, i) => <i key={i} className={i < s.value ? 'on' : ''} style={{ '--i': i }} />)}
            </span>
            <b>{s.value}/10</b>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Six people, as before. Hovering or focusing one opens their testimonial in a speech bubble beside
 *  the panel (above the card on narrow screens). It's portalled to <body> so the panel's scroll
 *  area can't clip it, and it closes again when the pointer or focus leaves. */
function PeoplePanel() {
  const [pop, setPop] = useState(null); // { person, side, x, y, tail }
  const openedAt = useRef(0); // a tap fires focus then click: don't let the click close what focus just opened
  const open = (r, el) => {
    openedAt.current = performance.now();
    const card = el.getBoundingClientRect();
    const panel = el.closest('.hud-panel')?.getBoundingClientRect() || card;
    const W = Math.min(320, innerWidth - 16), GAP = 14;
    if (panel.right + GAP + W <= innerWidth - 8) {
      // Beside the panel, level with the card; the tail points back at it
      const y = Math.min(Math.max(card.top + card.height / 2, 110), innerHeight - 110);
      setPop({ person: r, side: 'right', x: panel.right + GAP, y, w: W });
    } else {
      // No room on the right: float above the card
      const x = Math.min(Math.max(card.left + card.width / 2 - W / 2, 8), innerWidth - W - 8);
      setPop({ person: r, side: 'top', x, y: card.top - 10, w: W, tail: card.left + card.width / 2 - x });
    }
  };
  const close = () => setPop(null);
  useEffect(() => {
    if (!pop) return;
    // Scrolling moves the card away from its bubble, so close it, except for the scroll a tap
    // itself causes when the browser brings the focused card into view
    const off = () => { if (performance.now() - openedAt.current > 500) setPop(null); };
    addEventListener('scroll', off, true); addEventListener('resize', off);
    return () => { removeEventListener('scroll', off, true); removeEventListener('resize', off); };
  }, [pop]);

  return (
    <>
      <p className="hud-people__hint">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17c-2 0-3-1.5-3-3.5C4 10 6.5 7.5 9 7l.5 1.2C8 9 7.2 10.2 7.2 11.4c.3-.1.6-.1.9-.1 1.6 0 2.7 1.1 2.7 2.8S9.5 17 7 17Zm9 0c-2 0-3-1.5-3-3.5 0-3.5 2.5-6 5-6.5l.5 1.2c-1.5.8-2.3 2-2.3 3.2.3-.1.6-.1.9-.1 1.6 0 2.7 1.1 2.7 2.8S18.5 17 16 17Z" /></svg>
        <span className="hud-people__hint-hover">Hover a person to read what they said about her</span>
        <span className="hud-people__hint-touch">Tap a person to read what they said about her</span>
      </p>
      <ul className="hud-people">
        {RELATIONSHIPS.map((r) => (
          <li key={r.name}>
            <button
              className={pop?.person === r ? 'is-on' : ''} aria-describedby={pop?.person === r ? 'hud-testimonial' : undefined}
              onMouseEnter={(e) => open(r, e.currentTarget)} onMouseLeave={close}
              onFocus={(e) => open(r, e.currentTarget)} onBlur={close}
              onClick={(e) => { if (pop?.person !== r) open(r, e.currentTarget); else if (performance.now() - openedAt.current > 400) close(); }}
            >
              <img src={img(r.img)} alt="" />
              <span><strong>{r.name}</strong><small>{r.role}</small><Bar value={r.level} label={`Relationship with ${r.name}`} /></span>
              <i className="hud-people__quote" aria-hidden="true">“</i>
            </button>
          </li>
        ))}
      </ul>
      {pop && createPortal(<Testimonial {...pop} />, document.body)}
    </>
  );
}

/** The speech bubble. Words float in one after another, like a Sim thinking out loud. */
function Testimonial({ person, side, x, y, w, tail }) {
  const words = person.quote.split(' ');
  const style = side === 'right' ? { left: x, top: y, width: w } : { left: x, top: y, width: w, '--tail': `${tail}px` };
  return (
    <figure id="hud-testimonial" role="tooltip" className={`testimonial testimonial--${side} testimonial--${person.kind}`} style={style} key={person.name}>
      <span className="testimonial__mark" aria-hidden="true">“</span>
      <blockquote>
        {words.map((w, i) => <span key={i} className="testimonial__w" style={{ '--w': i }}>{w} </span>)}
      </blockquote>
      <figcaption style={{ '--w': words.length }}>
        <img src={img(person.img)} alt="" />
        <span><strong>{person.name}</strong><small>{person.kind === 'reference' ? 'From their letter of recommendation' : person.role}</small></span>
      </figcaption>
    </figure>
  );
}

function ItemsPanel() {
  const [sel, setSel] = useState(null);
  const item = INVENTORY.find((i) => i.id === sel);
  return (
    <>
      <ul className="hud-items">
        {INVENTORY.map((it) => (
          <li key={it.id}>
            <button aria-pressed={sel === it.id} onClick={() => setSel(sel === it.id ? null : it.id)}>
              <span className="hud-items__icon"><img src={img(it.img)} alt="" /></span><span>{it.label}</span>
            </button>
          </li>
        ))}
      </ul>
      {item && (
        <p className="hud-note" role="status">
          <strong>{item.label}.</strong> {item.note || 'A favourite from the inventory.'} {item.link && <Link to={item.link}>See the case study <Arrow dir="right" /></Link>}
        </p>
      )}
    </>
  );
}

function WantsPanel() {
  return (
    <div className="hud-wantlist">
      <p className="hud-sub">Lifetime wants</p>
      <ul>{WANTS.map((w) => <li key={w.id} className="is-want"><img src={img(w.img)} alt="" />{w.label}</li>)}</ul>
      <p className="hud-sub">Fears</p>
      <ul>{FEARS.map((f) => <li key={f.id} className="is-fear"><img src={img(f.img)} alt="" />{f.label}</li>)}</ul>
    </div>
  );
}

function OffWorkPanel() {
  return (
    <ul className="hud-offwork">
      {OFF_WORK.map((o) => (
        <li key={o.id}>
          <span className="hud-offwork__icon" aria-hidden="true"><Icon name={o.icon} size={20} /></span>
          <span><strong>{o.label}</strong><small>{o.why}</small></span>
        </li>
      ))}
    </ul>
  );
}
