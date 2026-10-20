import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PROJECTS, PROFILE, titleOf, wipToast } from '../content/projects.js';
import { useSim } from '../lib/simState.jsx';
import useTitle from '../lib/useTitle.js';
import StoryHeader from '../ui/StoryHeader.jsx';
import MapBanner from '../ui/MapBanner.jsx';
import NightCta from '../ui/NightCta.jsx';
import { Plumbob } from '../ui/Logo.jsx';

const hasTag = (t) => (p) => p.tags?.includes(t);
const FILTERS = [
  { label: 'All', test: () => true },
  { label: 'Human–AI', test: hasTag('Human–AI') },
  { label: 'Research', test: hasTag('Research') },
  { label: 'Healthcare', test: hasTag('Healthcare') },
  { label: 'Service design', test: hasTag('Service design') },
  { label: 'Passion projects', test: (p) => p.passion },
];

export default function Work() {
  useTitle('Work');
  const [tag, setTag] = useState('All');
  const [hot, setHot] = useState(null);
  // A short, fixed set of filters. Accessibility isn't one: it's part of every project.
  // "Passion projects" are her personal projects, so that filter shows all three together.
  const tags = FILTERS.map((f) => f.label);
  const match = FILTERS.find((f) => f.label === tag)?.test || (() => true);
  const shown = PROJECTS.filter(match);
  const main = shown.filter((p) => !p.passion);
  const passion = shown.filter((p) => p.passion);
  const card = (p, i, eager) => <Card key={p.id} p={p} i={i} eager={eager} onHot={setHot} />;

  return (
    <main id="main" className="work-page">
      <div className="page page--flush">
        <StoryHeader
          as="h1" label="Work"
          title={<>Every lot, <em>one project.</em></>}
          lede="Products I’ve designed around real people, from AI hiring and finance to healthcare and accessibility. Pick a house on the map, or browse them all below."
        />
        <p className="work__pdf"><a href={PROFILE.portfolio} download>Prefer a document? Download the portfolio (PDF)</a></p>
      </div>
      <MapBanner highlight={hot} />

      <div className="page page--flush work-list">
        <div className="filters" role="toolbar" aria-label="Filter projects">
          {tags.map((t) => (
            <button key={t} aria-pressed={tag === t} onClick={() => setTag(t)}>{t}</button>
          ))}
        </div>
        <p className="sr-only" aria-live="polite">{shown.length} projects shown</p>

        {main.length > 0 && <ul className="work-grid" key={`m-${tag}`}>{main.map((p, i) => card(p, i, i < 2))}</ul>}
        {passion.length > 0 && (
          <>
            <p className="story-kicker work-list__kicker">Passion projects</p>
            <ul className="work-grid work-grid--small" key={`p-${tag}`}>{passion.map((p, i) => card(p, i))}</ul>
          </>
        )}
      </div>
      <NightCta />
    </main>
  );
}

function Card({ p, i, eager, onHot }) {
  const { toast } = useSim();
  const [knock, setKnock] = useState(0); // bumps the tape's wobble each time a WIP card is clicked
  // Work in progress: still a link (so it can be focused and announced), but clicking only says it's being built
  const wip = p.wip ? {
    'aria-disabled': true,
    'aria-label': `${p.name}, work in progress. Not open yet.`,
    onClick: (e) => { e.preventDefault(); setKnock((k) => k + 1); toast(wipToast(p)); },
  } : {};
  return (
    <li className={`card${p.wip ? ' card--wip' : ''}`} style={{ '--i': i }} onMouseEnter={() => onHot(p.id)} onMouseLeave={() => onHot(null)}>
      <Link to={`/work/${p.id}`} onFocus={() => onHot(p.id)} onBlur={() => onHot(null)} {...wip}>
        <span className={`card__media${p.contain ? ' card__media--contain' : ''}`} style={{ '--tint': p.tint }}>
          <img src={p.cover || p.hero} alt="" loading={eager ? 'eager' : 'lazy'} />
          {p.wip && (
            <span className="wip-tape" aria-hidden="true" key={knock}>
              <span>Work in progress · Work in progress · Work in progress · Work in progress ·</span>
            </span>
          )}
          <span className="card__bob" aria-hidden="true">
            {p.wip ? <>🚧 Under construction</> : <><Plumbob size={12} /> Step inside</>}
          </span>
        </span>
        <span className="card__text">
          <span className="card__title">{titleOf(p)}</span>
          <span className="card__meta">{p.type} • {p.year}</span>
        </span>
        {p.tags && <span className="tags tags--card">{p.tags.slice(0, 4).map((t) => <span key={t}>{t}</span>)}</span>}
      </Link>
    </li>
  );
}
