// The PDF portfolio's words: few, big, and each one taken from the case studies (no new facts or numbers).
// Every project gets four pages in the HCI order: opener → question & method → finding → decision → outcome & reflection.
//   statement   the opener's big line (a few words)
//   question    the research question, in one sentence
//   method      2–4 short items (what was actually done)
//   stat        one verified number from the case study
//   findingLabel  'Finding' by default; 'Premise' where no research was run (be honest about it)
//   finding / decision   one sentence each
//   image       the one screen that shows the decision ({ src, fit: 'contain' } for phone shots)
//   outcome / next      where it stands, and what I'd do next
//   gallery     1–2 "Highlights" pages after the project: the key screens for context.
//               Each page: { layout: 'bento' (one big + two) | 'row' (2–4 equal columns) | 'grid' (2×2), items: [src | { src, caption }] }.
//               Captions come from the case study when the image is used there; tall images (phones, posters) sit contained.
const v = (n) => `/img/cs/vettio/${n}.webp`;
const c = (n) => `/img/cs/crewnity/${n}.webp`;
const f = (n) => `/img/cs/flownet/${n}.webp`;
const cc = (n) => `/img/cs/cystercare/${n}.webp`;
const a = (n) => `/img/cs/access-adda/${n}.webp`;
const r = (n) => `/img/cs/repshep/${n}.webp`;
const t = (n) => `/img/cs/tamasha/${n}.webp`;

export const STORY = {
  vettio: {
    statement: 'Hiring, as one conversation.',
    question: 'Why do candidates leave an AI interview halfway through?',
    method: ['Competitor review: Mercor, Teal, Workable', 'Candidate and recruiter journeys, mapped side by side', 'Session recordings and heatmaps in Hotjar'],
    stat: { value: '5', label: 'checkpoints, instead of a question count' },
    finding: 'They didn’t leave before the interview. They left during it.',
    decision: 'Show the end. Five checkpoints, never a question count.',
    image: { src: v('interview') },
    outcome: 'Shipped. Recruiter workflow efficiency up 30%.',
    next: 'Measure drop-off per checkpoint from the first release.',
    gallery: [
      { layout: 'bento', items: [v('profile'), v('intro'), v('complete')] },
      { layout: 'bento', items: [v('match'), v('jd-builder'), v('ph-2')] },
    ],
  },
  crewnity: {
    statement: 'A finance team you can talk to.',
    question: 'Can a conversation replace accounting knowledge?',
    method: ['Requirements validated with finance experts', 'Prototypes compared: traditional vs conversational UI', 'Five landing directions for one promise'],
    stat: { value: '4', label: 'AI agents behind one point of contact' },
    finding: 'Owners don’t speak accounting, and shouldn’t have to.',
    decision: 'Nothing the AI extracts becomes your books until you’ve seen it.',
    image: { src: c('review') },
    outcome: 'Ongoing. Not measured yet.',
    next: 'Test whether owners trust Lina with their books.',
    gallery: [
      { layout: 'bento', items: [c('dashboard'), c('crew'), c('upload')] },
      { layout: 'bento', items: [c('recon-report'), c('recon-chat-1'), c('pnl')] },
    ],
  },
  flownet: {
    statement: 'Sign-off, with the evidence in the room.',
    question: 'How do supervisors approve work they can’t see?',
    method: ['Interviews with doctors in Swedish training programmes', 'Two role journeys: doctor and supervisor'],
    stat: { value: '4', label: 'months, from first interviews to MVP' },
    finding: 'A file alone doesn’t prove a milestone. Evidence needs context.',
    decision: 'Bring the evidence into the sign-off decision.',
    image: { src: f('sign-off') },
    outcome: 'MVP for Swedish government hospitals.',
    next: 'Prototype the import of paper history first. That’s where adoption is won.',
    gallery: [
      { layout: 'bento', items: [f('doctor'), f('paths'), f('supervisor')] },
      { layout: 'row', items: [f('evidence'), f('milestone')] },
    ],
  },
  cystercare: {
    statement: 'Nobody holds the whole picture.',
    question: 'Where does PCOS/PMOS care break down, and what can people trust?',
    method: ['15+ papers, incl. the 2023 International PCOS Guideline', '7 interviews with people living with PCOS/PMOS', '3 specialist interviews', 'A service blueprint across seven care areas'],
    stat: { value: '10', label: 'conversations, after 15+ papers' },
    finding: 'People learn from other women more than from leaflets.',
    decision: 'Lived experience and evidence: side by side, never mixed.',
    image: { src: cc('pain-points') },
    outcome: '5th prize at Imaginathon.',
    next: 'A prize isn’t a usability result. Next: a study with people managing PCOS/PMOS.',
    gallery: [
      { layout: 'bento', items: [cc('prototype'), cc('research'), cc('specialists')] },
      { layout: 'row', items: [cc('feed'), cc('research-tab')] },
    ],
  },
  'access-adda': {
    statement: 'Access is a favour. It should be a feature.',
    question: 'How do you make people feel the difference between help and independence?',
    method: ['Real places and people from Peshawar', 'Scoring built on the four WCAG principles', 'An audit of my own first prototype'],
    stat: { value: '3', label: 'languages: English, Urdu, Pashto' },
    finding: 'The fix people reach for first keeps someone dependent.',
    decision: 'Make a bad fix visibly worse than a good one.',
    image: { src: a('cover') },
    outcome: 'Playable, in three languages.',
    next: 'Not yet played with people. Next: playtests with disabled people in Peshawar.',
    gallery: [
      { layout: 'grid', items: [
        { src: a('areeba'), caption: 'Areeba: a wheelchair user at her university.' },
        { src: a('brt'), caption: 'A blind commuter at the BRT.' },
        { src: a('qissa-khwani'), caption: 'A Deaf woman ordering kahwa in Qissa Khwani.' },
        { src: a('sethi-house'), caption: 'A power-wheelchair user at Sethi House.' },
      ] },
    ],
  },
  tamasha: {
    statement: 'Bricks, on strings.',
    question: 'How does a community of builders throw a show about performing?',
    method: ['A brand audit of banao.pk’s live stylesheet', 'Four puppet-theatre references, each turned into a rule'],
    stat: { value: '6', label: 'puppets, one rig' },
    finding: 'Banao’s logo already had one loose gold brick.',
    decision: 'The loose brick becomes every puppet’s head.',
    image: { src: t('cast') },
    outcome: 'Style direction v1, presented October 2026.',
    next: 'Lock a poster direction, then build the /tamasha page.',
    gallery: [
      { layout: 'bento', items: [t('stage-hero'), t('rig'), t('roots')] },
      { layout: 'row', items: [t('poster-a'), t('poster-b'), t('poster-c'), t('poster-d')] },
    ],
  },
  repshep: {
    statement: 'Every overdue payment is a person.',
    question: 'How can a big gym follow up with hundreds of members, personally?',
    method: ['Personal project, with mock data', 'No user research yet: flows first, then gym managers'],
    stat: { value: '4', label: 'steps in every nudge, ending in a confirm' },
    findingLabel: 'Premise',
    finding: 'At that scale, nobody can follow up by hand.',
    decision: 'AI drafts the nudge. The gym approves it.',
    image: { src: r('poke'), fit: 'contain' },
    outcome: 'In progress.',
    next: 'Test the flows with gym managers before building the AI.',
    gallery: [
      { layout: 'row', items: [r('whatsapp'), r('channels'), r('failed'), r('history')] },
    ],
  },
};
