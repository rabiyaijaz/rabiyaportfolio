import { useEffect, useRef, useState } from 'react';
import Icon from './icons.jsx';
import ToolIcon from '../ui/ToolIcon.jsx';
import StoryHeader from '../ui/StoryHeader.jsx';
import PlumbobCanvas from '../ui/PlumbobCanvas.jsx';
import { progressOf, reducedMotion, useScrollFrame } from '../lib/scroll.js';

// How I work: the tools, in the order a project uses them. The plumbob changes with each step,
// the same way it does in the landing's process story. Testing tools only appear once there's
// something to test; Discover happens before anything exists, so it lists methods, not tools.
export const STEPS = [
  { id: 'discover', step: 'Discover', icon: 'listen', methods: ['User interviews', 'Desk research', 'Stakeholder chats'], line: 'Before anything is built: talking to the people it’s for and reading what’s already known, to find where it actually hurts.' },
  { id: 'define', step: 'Define', icon: 'sense', tools: ['Miro'], line: 'Affinity maps and synthesis boards, where the research turns into decisions.' },
  { id: 'design', step: 'Design', icon: 'design', tools: ['Figma', 'Framer', 'Webflow'], line: 'Every flow, component and design system starts in Figma; marketing sites and landing pages go live in Framer and Webflow.' },
  { id: 'prototype', step: 'Prototype', icon: 'prototype', tools: ['Framer', 'Lovable', 'Figma Make'], line: 'Real, clickable prototypes when a static frame isn’t enough to test an idea.' },
  { id: 'test', step: 'Test', icon: 'screen', tools: ['UserTesting', 'Hotjar'], line: 'Usability sessions on the prototype before it’s built, then heatmaps once it’s live, to see what people actually do.' },
  { id: 'ai', step: 'Build with AI', icon: 'ai', tools: ['Claude', 'Codex', 'Antigravity'], line: 'AI build partners for prototypes and for this site. I design and direct, then review what they make.' },
  { id: 'code', step: 'Hand off', icon: 'code', tools: ['Tailwind', 'HTML', 'CSS', 'Python'], line: 'Enough code to speak engineering and hand off cleanly.' },
];

export default function ToolFlow() {
  const [still] = useState(reducedMotion);
  const runRef = useRef(null);
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);
  const railRef = useRef(null);
  // On a phone the steps are one swipeable row: keep the current step in view
  useEffect(() => {
    const rail = railRef.current, el = rail?.children[active];
    if (!rail || !el || rail.scrollWidth <= rail.clientWidth) return;
    rail.scrollTo({ left: el.offsetLeft - (rail.clientWidth - el.offsetWidth) / 2, behavior: 'smooth' });
  }, [active]);

  useScrollFrame(() => {
    if (still || !trackRef.current) return;
    const p = progressOf(runRef.current);
    const f = p * (STEPS.length - 1);
    trackRef.current.style.setProperty('--f', f.toFixed(3));
    trackRef.current.querySelectorAll('.flow-card').forEach((el, i) => el.style.setProperty('--d', Math.min(1, Math.abs(i - f)).toFixed(3)));
    setActive(Math.round(f));
  });

  const jump = (i) => {
    const el = runRef.current;
    const run = el.offsetHeight - innerHeight;
    scrollTo({ top: el.getBoundingClientRect().top + scrollY + run * (i / (STEPS.length - 1)), behavior: 'smooth' });
  };

  const header = (
    <StoryHeader
      label="How I work" id="how-title"
      title={<>From first interview <em>to shipped code.</em></>}
      lede="The tools I reach for at each step of a project. Scroll to follow the flow."
    />
  );

  if (still) {
    return (
      <section className="flow flow--still" aria-labelledby="how-title">
        <div className="story-wrap">{header}
          <ol className="flow-grid">{STEPS.map((s, i) => <li key={s.id}><Card s={s} i={i} /></li>)}</ol>
        </div>
      </section>
    );
  }

  return (
    <section className="flow" aria-labelledby="how-title">
      <div className="flow__run" ref={runRef} style={{ height: `${STEPS.length * 55 + 100}vh` }}>
        <div className="flow__stage">
          <div className="story-wrap flow__head">{header}</div>
          <ol className="flow__rail" aria-label="Steps" ref={railRef}>
            {STEPS.map((s, i) => (
              <li key={s.id}>
                <button aria-current={i === active ? 'step' : undefined} onClick={() => jump(i)}>
                  <span className="flow__node" />{s.step}
                </button>
              </li>
            ))}
          </ol>
          <div className="flow__body">
            <div className="flow__bob"><PlumbobCanvas progress={() => progressOf(runRef.current)} /></div>
            <div className="flow__window">
              <ol className="flow__track" ref={trackRef}>
                {STEPS.map((s, i) => <li key={s.id} className="flow-card" aria-current={i === active ? 'step' : undefined}><Card s={s} i={i} /></li>)}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Card({ s, i }) {
  return (
    <article className="flow-card__inner">
      <div className="flow-card__top">
        <span className="flow-card__icon"><Icon name={s.icon} /></span>
        <span className="flow-card__n">{String(i + 1).padStart(2, '0')}</span>
      </div>
      <h3>{s.step}</h3>
      <p>{s.line}</p>
      {s.tools ? (
        <ul className="tool-chips" aria-label="Tools">
          {s.tools.map((t) => <li key={t}><ToolIcon name={t} />{t}</li>)}
        </ul>
      ) : (
        <ul className="tool-chips tool-chips--methods" aria-label="Methods">
          {s.methods.map((m) => <li key={m}>{m}</li>)}
        </ul>
      )}
    </article>
  );
}
