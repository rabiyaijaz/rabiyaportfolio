// Every project, in the order the Work page shows them.
// Facts follow DESIGN.md §8: titles and dates from the CV, no unverified metrics.
// `headline` describes the thing in plain words (Direction v3 voice).

// `cover` is the Work card image, `hero` the case-study hero (falls back to cover).
// `tags` drive the Work filters (tags used by 2+ projects become chips).
export const PROJECTS = [
  {
    id: 'vettio', name: 'Vettio', type: 'AI recruitment', year: '2024–26',
    headline: 'An AI hiring platform that keeps candidates and recruiters in the loop',
    cover: '/img/work/vettio.webp', hero: '/img/cs/vettio/ph-1.webp', heroVideo: '/video/vettio-intro.mp4', tint: '#eef0ff',
    tags: ['Human–AI', 'Research', 'Recruitment'],
    meta: { Role: 'Senior Product Designer', Timeline: 'Sep 2024 – May 2026', Context: 'Vettio, Dubai (remote)', Status: 'Shipped, launched on Product Hunt' },
  },
  {
    id: 'crewnity', name: 'Crewnity', type: 'AI finance', year: '2026',
    headline: 'Designing human-AI collaboration for small and medium-sized Saudi businesses’ finances',
    cover: '/img/work/crewnity.webp', hero: '/img/cs/crewnity/dashboard.webp', heroVideo: '/video/crewnity-intro.mp4', tint: '#eef4ef',
    tags: ['Human–AI', 'Conversational AI', 'Fintech', 'Trust'],
    meta: { Role: 'Lead Product Designer', Timeline: 'Jul 2026 – present', Context: 'Crewnity, Saudi Arabia (remote)', Status: 'Ongoing' },
  },
  {
    id: 'flownet', name: 'Flownet', type: 'Clinical training', year: '2025',
    headline: 'Designing shared workspaces for apprenticeships in Swedish government hospitals',
    cover: '/img/work/flownet-card.webp', hero: '/img/cs/flownet/landing.webp', tint: '#eaf3f7',
    tags: ['Healthcare', 'Clinical workflows', 'Research', 'Role-based'],
    meta: { Role: 'Lead Product Designer & Advisor', Timeline: 'Sep – Dec 2025', Context: 'Swedish government hospitals', Status: 'MVP' },
  },
  {
    id: 'cystercare', name: 'CysterCare', type: 'Women’s health · AI', year: '2026',
    headline: 'A lifelong AI detection and care system for PCOS/PMOS',
    cover: '/img/work/cystercare-card.webp', hero: '/img/cs/cystercare/prototype.webp', tint: '#f4ecff',
    heroVideo: '/video/cystercare-intro.mp4', heroPoster: '/img/cs/cystercare/video-poster.webp',
    live: {
      href: 'https://cystercare-eqfs.vercel.app/', label: 'Try the live app', embed: true,
      headline: 'Tap through the working prototype.',
      note: 'This is the real CysterCare app, running live. Tap the phone to start, meet Cyster, the AI care assistant, and try the tracking and care flows yourself.',
    },
    tags: ['Healthcare', 'Research', 'Service design', 'Hackathon'],
    meta: { Role: 'Service Design Lead', Timeline: 'Research 2025 · Build Jan – Apr 2026', Context: 'Team Peshawar × Imaginathon', Status: 'Hackathon MVP, 5th prize' },
  },
  {
    id: 'access-adda', name: 'Access Adda', type: 'Accessibility game', year: 'Personal', passion: true,
    headline: 'An interactive card game translating Peshawar’s physical barriers into universal design interventions',
    cover: '/img/work/access-adda-card.webp', hero: '/img/cs/access-adda/cover.webp', tint: '#2a1d14',
    tags: ['Game', 'WCAG', 'Personal'],
    meta: { Role: 'Design and build', Context: 'Personal project', Status: 'Playable prototype' },
  },
  {
    id: 'tamasha', name: 'Tamasha Banao', type: 'Community · Brand and UX', year: '2026',
    headline: 'Design strategy for a talent night at Banao.pk, Pakistan’s builder community',
    cover: '/img/work/tamasha-card.webp', hero: '/img/cs/tamasha/stage-hero.webp', heroEmbed: '/embeds/tamasha-stage.html', tint: '#144a30',
    tags: ['Community', 'Brand', 'Research', 'Service design'],
    meta: { Role: 'Banao.pk ambassador, design strategy', Context: 'Banao.pk community (volunteer)', Status: 'Style direction v1 presented, Oct 2026' },
  },
  {
    id: 'repshep', name: 'RepShep', type: 'Gym management · AI', year: 'Personal', passion: true,
    headline: 'An all-in-one gym system with AI retention on WhatsApp',
    // Card: the reel's 16:9 cover, padded top and bottom with its own edge colour to fit the 16:11 card uncropped
    cover: '/img/work/repshep.webp', hero: '/img/cs/repshep/cover.webp', heroVideo: '/video/repshep-intro.mp4', tint: '#2b2b9c',
    tags: ['Human–AI', 'AI workflows', 'WhatsApp', 'Personal'],
    meta: { Role: 'Designer', Context: 'Personal project', Status: 'In progress' },
  },
  {
    // wip: shown everywhere, but can't be opened yet (cards, pins and the house say "under construction")
    id: 'devmode', name: 'DevMode', type: 'Learning concept', year: 'Personal', passion: true, wip: true,
    headline: 'A course that teaches designers to build with AI, in their own language',
    cover: '/img/work/devmode.webp', tint: '#f1f1f4',
    tags: ['Human–AI', 'EdTech', 'Personal'],
    meta: { Role: 'Designer', Context: 'Personal exploration', Status: 'Work in progress' },
  },
];

export const projectById = (id) => PROJECTS.find((p) => p.id === id);
// Work-in-progress projects are listed but can't be opened yet; this is the toast every way in shows instead
export const wipToast = (p) => ({ kind: 'info', title: `${p.name} is still being built`, body: 'Its case study is under construction. Check back soon!' });
// "Vettio: an AI hiring platform that…": the name leads every project title
export const titleOf = (p) => `${p.name}: ${p.headline.charAt(0).toLowerCase()}${p.headline.slice(1)}`;

export const PROFILE = {
  name: 'Rabiya Ijaz',
  line: 'Product designer for human–AI collaboration. Open to new projects.',
  email: 'rabiyaijaz99@gmail.com',
  linkedin: 'https://www.linkedin.com/in/rabiya-ijaz-05ab32202/',
  socials: [
    { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/rabiya-ijaz-05ab32202/' },
    { id: 'behance', label: 'Behance', href: 'https://www.behance.net/bloheart666' },
    { id: 'upwork', label: 'Upwork', href: 'https://www.upwork.com/freelancers/~01e7e61860c43d4c00' },
    // Discord profiles can't be linked by username, so this one copies it instead
    { id: 'discord', label: 'Discord', copy: 'froggie2320' },
  ],
  location: 'Peshawar, Pakistan',
  cv: '/cv/Rabiya-Ijaz-CV.pdf',
  // The downloadable portfolio, made from this site's content by `npm run portfolio:pdf`
  portfolio: '/cv/Rabiya-Ijaz-Portfolio.pdf',
};
