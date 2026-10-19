// About House content, from the Figma HUD screens (ffigma/SimDesktop - InGame*.png).
// trend: -2 / -1 / 0 / 1 / 2 → ◀◀ ◀ ▶ ▶▶ beside a need.
// `drain` is points lost per tick while the visitor is around (live needs).
// `action` is what the visitor can do to help.

export const NEEDS = [
  { id: 'hunger', label: 'Hunger', value: 34, drain: 0.5, action: { label: 'Grab a snack', gain: 40 } },
  { id: 'fun', label: 'Fun', value: 82, drain: 0.4, action: { label: 'Read a case study', to: '/work' } },
  { id: 'screen', label: 'Screen rest', value: 70, drain: 0.6, action: { label: 'Look out the window', gain: 30 } },
  { id: 'social', label: 'Social', value: 80, drain: 0.3, action: { label: 'Say hi', hi: true } },
  { id: 'flow', label: 'Flow state', value: 84, drain: 0.2 },
  { id: 'energy', label: 'Energy', value: 92, drain: 0.3 },
  { id: 'chai', label: 'Chai Tank', value: 12, drain: 0.8, action: { label: 'Make chai', gain: 100 } },
  { id: 'environment', label: 'Environment', value: 55, drain: 0.1 },
];

export const PERSONALITY = [
  { label: 'Empathetic', value: 9 },
  { label: 'Playful', value: 8 },
  { label: 'Outgoing', value: 7 },
  { label: 'Active', value: 9 },
  { label: 'Sensitive', value: 7 },
];

export const CAREER = {
  facts: [
    ['Job title', 'Lead Product Designer'],
    ['Community work', 'Ambassador, Banao.pk'],
    ['Hours', 'Mon–Fri, 10am–6pm'],
  ],
  skills: [
    { label: 'AI & Agentic Flows', value: 9 },
    { label: 'User Research & Interview', value: 9 },
    { label: 'Design Systems', value: 10 },
    { label: 'Figma & Prototyping', value: 9 },
    { label: 'Claude, Codex & Antigravity', value: 8 },
    { label: 'Accessibility & WCAG', value: 9 },
    { label: 'IA & Systems Logic', value: 8 },
    { label: 'Facilitation & Mentorship', value: 7 },
  ],
};

// References first (quotes drawn from their letters of recommendation), then friends and family
// (just for fun). Hovering, focusing or tapping a person shows their quote in the panel.
export const RELATIONSHIPS = [
  // Lightly condensed from each person's signed letter (in E:\Rabiya's Documents\References and experiences)
  { name: 'Dr. Shabana Gul', role: 'Research Methodology Professor', img: 'rel-shabana', level: 88, kind: 'reference', quote: 'Keen observation and critical analysis, the foundations of a good researcher, showed in everything she handed in. Even as an intern, her ideas made our convocation ceremony flow better.' },
  { name: 'Mohsin Ali Khan', role: 'Founder, Vettio', img: 'rel-mohsin', level: 90, kind: 'reference', quote: 'Rather than focusing only on interface aesthetics, she consistently examined how users interpret information, make decisions and respond to system feedback. In AI recruitment, that’s where clarity and trust are won.' },
  { name: 'Hamad Muhammad Salim', role: 'Sr. Design Leader', img: 'rel-hamad', level: 85, kind: 'reference', quote: 'She translated abstract AI capabilities into practical, usable experiences, balancing system intelligence with human control. She absorbed intense feedback, iterated fast and kept raising the bar.' },
  { name: 'Mostafa Hashemi', role: 'Founder & Project Lead – FLOW', img: 'rel-mostafa', level: 92, kind: 'reference', quote: 'She independently built a full Figma design system that turned complex regulatory frameworks into simple, human-centred experiences. Her designs are both visually refined and strategically intelligent.' },
  { name: 'Sarim Sikandar', role: 'Kaand Partner', img: 'rel-sarim', level: 100, kind: 'personal', quote: 'She once turned our trip plan into a user journey map, pain points and all. We still got lost, but very intentionally.' },
  { name: 'Ijaz Muhammad', role: 'Dad, also bestie4life', img: 'rel-ijaz', level: 100, kind: 'personal', quote: 'She’s been fixing my phone settings since she was eight. Now she calls it “usability testing” and I’m the participant.' },
];

// `note` only where the fact is documented. Add your own stories here.
export const INVENTORY = [
  { id: 'lenovo', label: 'Lenovo Legion', img: 'inv-lenovo' },
  { id: 'medals', label: 'Hackathon Rewards', img: 'inv-medals', note: 'CysterCare took 5th prize and the 2nd-highest vote at Team Peshawar × Imaginathon.', link: '/work/cystercare' },
  { id: 'wallet', label: 'Wallet', img: 'inv-wallet' },
  { id: 'banao', label: 'Banao.pk Ambassador', img: 'inv-banao', note: 'Helping Pakistan’s builder community grow and run its events. I led design strategy for Tamasha, its talent show.', link: '/work/tamasha' },
  { id: 'camera', label: 'Camera', img: 'inv-camera' },
  { id: 'tailwind', label: 'Tailwind + shadcn/ui', img: 'inv-tailwind' },
];

// Wants a visitor can make come true (tracked site-wide in lib/simState)
export const VISITOR_WANTS = [
  { id: 'read', label: 'Someone reads one of my case studies', hint: 'Open any project in Work' },
  { id: 'hi', label: 'Get a hello', hint: 'Click the Sim and say hi' },
  { id: 'cv', label: 'Hand someone my CV', hint: 'Download the resume' },
  { id: 'chai', label: 'A fresh cup of chai', hint: 'Make chai from Needs' },
  { id: 'letter', label: 'Receive a letter', hint: 'Send a message from Contact' },
];

// Her own lifetime wants and fears (icons from output/sims2-wants-fears)
export const WANTS = [
  { id: 'travel', label: 'Travel', img: 'want-travel' },
  { id: 'concert', label: 'Go to a concert', img: 'want-concert' },
  { id: 'movies', label: 'Movie night', img: 'want-movies' },
  { id: 'friends', label: 'Time with friends', img: 'want-friends' },
];
export const FEARS = [
  { id: 'lost', label: 'Losing unsaved work', img: 'fear-lost-work' },
  { id: 'deadline', label: 'Missed deadlines', img: 'fear-missed-deadlines' },
  { id: 'block', label: 'Creative block', img: 'fear-creative-block' },
];

// Off work: three things, each tied back to how I work, each with something to do
export const OFF_WORK = [
  {
    id: 'music', label: 'Billie Eilish on loop', icon: 'headphones',
    why: 'My deep-work soundtrack for long design sessions. Press play and work alongside me.',
    spotify: 'https://open.spotify.com/embed/playlist/0fZm7ygIaFLpTX7AEd38WT?utm_source=generator&si=67ae4939ecc64e1d',
    cta: { label: 'Send me your focus song', to: '/contact' },
  },
  {
    id: 'camera', label: 'A camera close by', icon: 'camera',
    why: 'Practice for noticing light, framing and small details. It’s the same eye I bring to design reviews.',
    action: 'Take a shot', cta: { label: 'More on Instagram', href: 'https://www.instagram.com/bloheart666/' },
  },
  {
    id: 'chai', label: 'Doodh patti chai', icon: 'chai',
    why: 'Good design conversations deserve a good cup.',
    action: 'Make chai', cta: { label: 'Let’s talk over chai', to: '/contact' },
  },
];
