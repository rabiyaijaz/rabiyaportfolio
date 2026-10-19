import { useState } from 'react';
import { Link } from 'react-router-dom';
import StoryHeader from '../ui/StoryHeader.jsx';
import OrgLogo from '../ui/Logos.jsx';
import { COMMUNITY, EXPERIENCE, PROJECTS } from '../content/career.js';
import Arrow from '../ui/Arrow.jsx';

const ALL = [...EXPERIENCE, ...PROJECTS, ...COMMUNITY];
const FILTERS = [
  ['all', 'Everything', ALL.length],
  ['work', 'Work', EXPERIENCE.length + PROJECTS.length],
  ['community', 'Community', COMMUNITY.length],
];

/**
 * Experience and community as one set of cards, newest first within each kind.
 * Cards size to their content; current roles glow like an active plumbob.
 */
export default function Journey() {
  const [show, setShow] = useState('all');
  const list = ALL.filter((x) => show === 'all' || x.kind === show);
  return (
    <section className="journey" aria-labelledby="journey-title">
      <div className="story-wrap">
        <StoryHeader
          label="Experience & community" id="journey-title"
          title={<>Where I’ve worked, <em>and the clubs I’ve run.</em></>}
          lede="Product teams in Saudi Arabia, Dubai, Sweden and Peshawar, plus six years of building design and tech communities."
        />
        <div className="journey__filters" role="tablist" aria-label="Show">
          {FILTERS.map(([id, label, n]) => (
            <button key={id} role="tab" aria-selected={show === id} onClick={() => setShow(id)}>
              {label}<span>{n}</span>
            </button>
          ))}
        </div>
        <ul className="journey__grid" key={show}>
          {list.map((x, i) => (
            <li key={x.id} className={`jcard jcard--${x.kind}${x.now ? ' is-now' : ''}`} style={{ '--i': i }}>
              <div className="jcard__top">
                <OrgLogo name={x.logo} />
                <span className="jcard__tag">{x.kind === 'community' ? 'Community' : 'Work'}</span>
                {x.now && <span className="jcard__now"><i aria-hidden="true" />Now</span>}
              </div>
              <h3>{x.role}</h3>
              <p className="jcard__org">{x.org}</p>
              <p className="jcard__when">{x.when}{x.where ? ` · ${x.where}` : ''}</p>
              {x.what && <p className="jcard__what">{x.what}</p>}
              {x.link && <Link className="chapter__link" to={x.link}>See the work <Arrow dir="right" /></Link>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
