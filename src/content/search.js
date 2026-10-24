// What the quick search (ui/SearchPalette.jsx) can find. Each entry: a title, a short line under it, where it
// goes (`to`, a route with an optional #section; or `href` for a download / outside link) and `keys`: the
// words people might type for it, including ones that never appear on the page ("testimonials" → references).
// Case study sections are added from caseStudies.js, so new sections are searchable without touching this file.
import { CASE_STUDIES } from './caseStudies.js';
import { PROFILE, PROJECTS } from './projects.js';

const PAGES = [
  { group: 'Pages', title: 'Home', sub: 'The neighbourhood: walk the street or see the map', to: '/', keys: 'home start landing street game play neighbourhood intro' },
  { group: 'Pages', title: 'Work', sub: 'Every case study, on the map and as cards', to: '/work', keys: 'work projects portfolio case studies all projects' },
  { group: 'Pages', title: 'About', sub: 'Her Sim room: needs, personality, skills, references', to: '/about', keys: 'about me who bio story profile' },
  { group: 'Pages', title: 'Resume', sub: 'Experience, education and certificates, with dates', to: '/resume', keys: 'resume cv timeline history' },
  { group: 'Pages', title: 'Contact', sub: 'Send a message, or find her elsewhere', to: '/contact', keys: 'contact hire email message reach get in touch talk' },
];

const ABOUT = [
  { group: 'About', title: 'References & testimonials', sub: 'What founders, design leads and professors say about her', to: '/about#people', keys: 'testimonials references recommendations letters reviews quotes endorsements relationships what people say feedback referees' },
  { group: 'About', title: 'Career & skills', sub: 'Job title, hours and skill levels', to: '/about#skills', keys: 'skills strengths career job title tools figma ai research design systems accessibility wcag prototyping claude' },
  { group: 'About', title: 'Personality', sub: 'Traits, the Sims way', to: '/about#traits', keys: 'personality traits character values working style' },
  { group: 'About', title: 'Inventory & rewards', sub: 'Hackathon prize, Banao.pk ambassador and her kit', to: '/about#items', keys: 'awards rewards achievements prize hackathon inventory ambassador banao' },
  { group: 'About', title: 'Wants & fears', sub: 'What she’s after, and what she’d rather avoid', to: '/about#wants', keys: 'wants fears goals aspirations motivations' },
  { group: 'About', title: 'Off work', sub: 'Music, chai and what keeps her going', to: '/about#offwork', keys: 'hobbies interests off work music spotify fun personal life chai' },
  { group: 'About', title: 'Who I am', sub: 'The short intro: 4+ years, Peshawar, what she does', to: '/about#who-i-am', keys: 'intro introduction summary who i am background location peshawar pakistan experience years' },
  { group: 'About', title: 'How I work', sub: 'Her toolkit and workflow, step by step', to: '/about#how-i-work', keys: 'process workflow tools toolkit how i work methods figma claude' },
];

const HOME = [
  { group: 'Home', title: 'Design process', sub: 'Five steps from fuzzy to shipped, with a real example', to: '/#process', keys: 'process design process methodology approach steps discover define ideate research method' },
  { group: 'Home', title: 'Skills, levelled up', sub: 'Skills and the years behind them', to: '/#skills', keys: 'skills levels experience expertise abilities' },
];

const RESUME = [
  { group: 'Resume', title: 'Experience', sub: 'Roles at Crewnity, Vettio and more', to: '/resume#experience', keys: 'experience jobs roles employment work history companies crewnity vettio' },
  { group: 'Resume', title: 'Education', sub: 'BSc Accounting & Finance, IMSciences Peshawar', to: '/resume#education', keys: 'education degree university bachelor bsc study school imsciences' },
  { group: 'Resume', title: 'Community', sub: 'Ambassador and volunteer work', to: '/resume#community', keys: 'community volunteer ambassador banao leadership' },
  { group: 'Resume', title: 'Certificates & languages', sub: 'Google UX, HTML/CSS, Python · Urdu, English', to: '/resume#certificates', keys: 'certificates certifications courses google ux languages english urdu' },
];

const QUICK = [
  { group: 'Quick actions', title: 'Download the CV', sub: 'PDF', href: PROFILE.cv, download: true, keys: 'cv resume download pdf' },
  { group: 'Quick actions', title: 'Download the portfolio', sub: 'PDF, every case study', href: PROFILE.portfolio, download: true, keys: 'portfolio pdf download document deck' },
  { group: 'Quick actions', title: 'Email Rabiya', sub: PROFILE.email, href: `mailto:${PROFILE.email}`, keys: 'email mail contact hire write' },
  { group: 'Quick actions', title: 'LinkedIn', sub: 'Her profile', href: PROFILE.linkedin, external: true, keys: 'linkedin profile social network' },
  { group: 'Quick actions', title: 'Try a live demo', sub: 'CysterCare runs right in the page', to: '/work/cystercare#try', keys: 'demo live prototype try play app interactive' },
  { group: 'Quick actions', title: 'Play Access Adda', sub: 'The accessibility card game, playable', to: '/work/access-adda#play', keys: 'game play access adda card demo playable' },
];

const projectItems = PROJECTS.filter((p) => !p.wip).flatMap((p) => {
  const cs = CASE_STUDIES[p.id];
  const top = {
    group: 'Case studies', title: p.name, sub: p.headline, to: `/work/${p.id}`,
    keys: `${p.type} ${(p.tags || []).join(' ')} ${Object.values(p.meta || {}).join(' ')} case study project`,
  };
  const parts = (cs?.sections || []).map((s) => ({
    group: 'Inside a case study', title: `${p.name}: ${s.toc}`, sub: s.label, to: `/work/${p.id}#${s.id}`,
    keys: `${p.name} ${s.label} ${s.toc}`,
  }));
  return [top, ...parts];
});

export const SEARCH = [...QUICK, ...PAGES, ...ABOUT, ...projectItems, ...RESUME, ...HOME];

/** What shows before anything is typed: what a recruiter usually looks for first. */
export const SUGGESTED = [
  'Download the CV', 'References & testimonials', 'Experience', 'Work', 'Career & skills', 'Try a live demo', 'Email Rabiya',
].map((t) => SEARCH.find((x) => x.title === t)).filter(Boolean);

// Scoring: every word typed must match somewhere (title, keys or the line under it), as a word start;
// titles count most. A few common misspellings and plurals are forgiven by the prefix match.
const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9#&]+/g, ' ');
const index = SEARCH.map((x) => ({ x, t: ` ${norm(x.title)}`, k: ` ${norm(x.keys || '')}`, s: ` ${norm(x.sub || '')}` }));
export function search(q) {
  const words = norm(q).split(' ').filter(Boolean);
  if (!words.length) return SUGGESTED;
  const out = [];
  for (const it of index) {
    let score = 0, ok = true;
    for (const w of words) {
      const stem = w.length > 4 ? w.replace(/(ies|es|s)$/, '') : w; // testimonials → testimonial
      const hit = (f) => f.includes(` ${w}`) || f.includes(` ${stem}`);
      const sc = hit(it.t) ? 6 : hit(it.k) ? 3 : hit(it.s) ? 1 : (it.t + it.k + it.s).includes(stem) ? 0.5 : 0;
      if (!sc) { ok = false; break; }
      score += sc;
    }
    if (ok) out.push({ score: score - (it.x.group === 'Inside a case study' ? 0.5 : 0), x: it.x });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 12).map((r) => r.x);
}
