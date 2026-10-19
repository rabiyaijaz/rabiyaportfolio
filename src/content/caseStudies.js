// Case-study bodies, written in the reference's voice: plain, short, honest about status.
// Facts follow DESIGN.md §8 (CV wins on titles and dates). Stats are verified counts only.
// Section: { id, toc, label, headline, body: [], list?: [], images?: [{ src, alt, caption, phone? }], layout?: 'grid'|'phones'|'single',
//            iterations?: [{ src, alt, name, note, tall? }] (a numbered strip of design directions) }

const v = (n) => `/img/cs/vettio/${n}.webp`;
const c = (n) => `/img/cs/crewnity/${n}.webp`;
const f = (n) => `/img/cs/flownet/${n}.webp`;
const cc = (n) => `/img/cs/cystercare/${n}.webp`;
const a = (n) => `/img/cs/access-adda/${n}.webp`;
const r = (n) => `/img/cs/repshep/${n}.webp`;
const d = (n) => `/img/cs/devmode/${n}.webp`;
const t = (n) => `/img/cs/tamasha/${n}.webp`;

export const CASE_STUDIES = {
  vettio: {
    skill: 'Human–AI design',
    stats: [
      { value: 1, label: 'Conversation with an AI agent, instead of a whole job hunt' },
      { value: 5, label: 'Checkpoints in the AI interview, instead of a question count' },
      { value: 30, suffix: '%', label: 'Gain in recruiter workflow efficiency after launch' },
    ],
    intro: [
      'Vettio is an AI recruitment platform that shortens hiring on both sides. Candidates have one conversation with an AI agent instead of a weeks-long job hunt; recruiters get matched, interviewed candidates within a day of sharing a job description.',
      'I was the Senior Product Designer from September 2024 to May 2026. It shipped and launched on Product Hunt; I’ve since moved on.',
    ],
    sections: [
      {
        id: 'problem', toc: 'Two people, one hire', label: 'Problem',
        headline: 'Hiring is slow on both sides, and each side only sees half of it.',
        body: [
          'A job seeker searches, filters, rewrites their CV for every role, applies, chases recruiters and sits through round after round of interviews. A recruiter posts a role, sifts through CVs, schedules screens and waits. Weeks, often a month, pass before the two actually meet.',
          'Designing one side alone would just move the friction to the other, so I treated both journeys as one system.',
        ],
      },
      {
        id: 'vision', toc: 'A month into a day', label: 'Approach',
        headline: 'Turn a month-long hiring loop into one conversation and one day.',
        body: [
          'For candidates, Sally, our AI agent, replaces the whole loop with a single conversation. For recruiters, the moment a job description comes in, we pull the relevant people from our pipeline and hand them over already interviewed, with a full profile, an AI match score and the interview itself, so recruiters can judge personality and fit for themselves.',
        ],
        compare: [
          { title: 'Before', steps: ['Search for jobs', 'Find the relevant ones', 'Tailor your CV and profile for each', 'Apply, one by one', 'Interview for each, often several rounds', 'Chase recruiters and hiring managers'] },
          { title: 'With Vettio', after: true, steps: ['Talk to Sally once', 'Get matched to relevant roles', 'Recruiters see your profile, score and interview', 'Hear back, often within a day'] },
        ],
      },
      {
        id: 'research', toc: 'Where people dropped', label: 'Research',
        headline: 'Candidates didn’t leave before the interview. They left during it.',
        body: [
          'I compared how Mercor, Teal and Workable handle AI screening, and mapped the candidate and recruiter journeys side by side. The clearest drop-off was inside the AI interview itself.',
        ],
        list: [
          'Commitment needs shape: people stay when they can see the end.',
          'Evidence needs lineage: a score is only useful if you can trace it.',
          'Judgment stays human: the AI informs, the recruiter decides.',
        ],
      },
      {
        id: 'decision', toc: 'Checkpoints, not questions', label: 'Decision',
        headline: 'Show progress as checkpoints, not a question count.',
        body: [
          'I explored three directions: Sally setting the pace in conversation, a structured progress view, and “Career Quest”, a game-like map. Career Quest was fun but felt wrong for a job interview, so it stayed an exploration.',
          'We shipped five checkpoints: Introduction, Resume walk-through, Experience deep dive, Role fit, Insights. Candidates always know where they are, and we never promise a fixed number of questions.',
        ],
        images: [
          { src: v('intro'), alt: 'Sally introduces herself and the five interview checkpoints', caption: 'Before starting, Sally shows the whole path.' },
          { src: v('interview'), alt: 'Live AI interview with transcript and current checkpoint 2 of 5', caption: 'During the interview, the current checkpoint stays visible.' },
          { src: v('complete'), alt: 'Interview completed with all five checkpoints ticked', caption: 'The end is an end: every checkpoint ticked.' },
        ],
      },
      {
        id: 'evidence', toc: 'Scores with receipts', label: 'Design',
        headline: 'Every match score shows its receipts.',
        body: [
          'On the recruiter side, each job requirement is matched to evidence from the CV or interview: Matched, Partially matched or Unmatched. Two more states, Inferred and Unaddressed, stop missing evidence from looking like evidence.',
          'The recruiter’s own notes sit next to the AI’s read, so the decision stays theirs.',
        ],
        images: [
          { src: v('match'), alt: 'Requirement match analysis with matched, partial, unmatched, inferred and unaddressed states', caption: 'Requirement match analysis: one state per requirement, each with its source.' },
          { src: v('profile'), alt: 'Candidate profile with overall match, CV and interview scores, snapshot and video interview', caption: 'The candidate profile: scores up top, evidence underneath.' },
        ],
      },
      {
        id: 'role', toc: 'Setting up a role', label: 'Design',
        headline: 'Recruiters set up the role with the AI, step by step.',
        body: [
          'Role setup is a guided roadmap (basic info, purpose, responsibilities) rather than a blank form, so Sally has the context she needs before she interviews anyone.',
        ],
        images: [{ src: v('jd-builder'), alt: 'Guided role setup with a building-roadmap checklist', caption: 'Setting up a role, one step at a time.' }],
      },
      {
        id: 'launch', toc: 'Launch', label: 'Launch',
        headline: 'Shipped, and launched on Product Hunt.',
        body: ['The visuals I designed for the launch.'],
        images: [
          { src: v('ph-1'), alt: 'Product Hunt visual: Vettio AI Recruitment Assistant, AI interview with Sally', caption: 'The AI interview.' },
          { src: v('ph-2'), alt: 'Product Hunt visual: AI interviews, AI-powered matching, fast CV screening', caption: 'What Vettio does.' },
          { src: v('ph-3'), alt: 'Product Hunt visual: candidate profile with video interview and requirement match analysis', caption: 'See beyond the resume.' },
          { src: v('ph-4'), alt: 'Product Hunt visual: candidate intake by link, manual upload or email integration', caption: 'Candidate intake.' },
        ],
      },
      {
        id: 'next', toc: 'Status and next time', label: 'Reflection',
        headline: 'It shipped, and recruiters moved faster.',
        body: [
          'After launch, recruiter workflow efficiency improved by 30%. Hiring that used to take weeks of sifting and scheduling started with a shortlist of interviewed candidates on day one.',
          'We watched real sessions and heatmaps in Hotjar to see where candidates hesitated and fed that back into the interview flow.',
          'Next time I’d instrument completion per checkpoint from the very first release, so we could measure exactly where candidates still drop instead of reading it from sessions.',
        ],
      },
    ],
  },

  crewnity: {
    skill: 'Conversational AI',
    stats: [
      { value: 4, label: 'AI agents working as your finance team' },
      { value: 1, label: 'Conversation to get your books set up' },
      { value: 0, label: 'Accounting knowledge needed to start' },
    ],
    intro: [
      'Crewnity gives small and medium businesses in Saudi Arabia a complete finance team they can simply talk to. A finance manager, a bookkeeper, an accountant and a financial analyst, all AI agents, working on your behalf. You drop in your documents and chat; they handle the books, VAT and ZATCA.',
      'I’m the Lead Product Designer, across IA, onboarding, the conversational experience, the financial workspace and the brand. It’s ongoing, so nothing here is measured yet.',
    ],
    sections: [
      {
        id: 'problem', toc: 'A team most can’t afford', label: 'Problem',
        headline: 'Most small businesses can’t afford a finance team, and can’t speak accounting.',
        body: [
          'A Saudi business owner is expected to keep clean books, file VAT, stay compliant with ZATCA and understand their numbers. Larger companies hire a whole team for that. Small ones get spreadsheets, an occasional freelancer and a lot of jargon.',
          'Existing finance software assumes you already know what a trial balance or a chart of accounts is. Most owners don’t, and shouldn’t have to.',
        ],
      },
      {
        id: 'crew', toc: 'A team you can talk to', label: 'Decision',
        headline: 'Replace the finance software with a finance team you can talk to.',
        body: [
          'Instead of forms and ledgers, Crewnity is a conversation. You talk to Lina, your finance manager and single point of contact, the way you’d talk to a person. Behind her, Jade keeps the books, Jenny handles accounting, VAT and ZATCA compliance, and Jaime turns the numbers into plain-language insight.',
          'Named roles make the AI easy to direct (“ask Jenny about VAT”) while the copy never pretends they’re human accountants.',
        ],
        images: [
          { src: c('crew'), alt: 'Meet your Finance Crew: Lina, Jade, Jenny and Jaime', caption: 'Meet your Finance Crew: one point of contact, three specialists behind her.' },
          { src: c('recommend'), alt: 'Crew recommendations: each issue matched to the agent who handles it, including VAT & ZATCA', caption: 'Every issue is routed to the agent who owns it.' },
        ],
      },
      {
        id: 'how', toc: 'Drop documents, then chat', label: 'Design',
        headline: 'Drop your documents in. The crew does the rest.',
        body: [
          'Setup happens inside the chat. Owners upload whatever they have; the crew reads it, builds the chart of accounts and comes back with opening balances and anything that needs attention, like duplicate payments or purchases without a valid tax invoice.',
          'Nothing the AI extracts becomes your books until you’ve seen it. Gaps stay visible instead of being quietly filled in.',
        ],
        images: [
          { src: c('upload'), alt: 'Chat asking the owner to upload financial documents', caption: 'Setup starts as a conversation, not a form.' },
          { src: c('review'), alt: 'Analysis complete with four items needing attention and a total', caption: 'The crew shows its work before anything is final.' },
        ],
      },
      {
        id: 'workspace', toc: 'The workspace', label: 'Product',
        headline: 'After setup, the whole business lives in one calm workspace.',
        body: [
          'The dashboard shows the month at a glance: revenue, profit, expenses, cash, how far the month-end close has got, and what needs attention. Customers, vendors, accounting and reporting are one click away, and Lina is always in the chat bar at the bottom.',
        ],
        images: [
          { src: c('dashboard'), alt: 'Crewnity dashboard with revenue, profit, expenses, cash balance, close progress and money in and out', caption: 'The month at a glance.' },
          { src: c('dashboard-2'), alt: 'Dashboard lower half: tasks needing attention, business profile and upcoming bills calendar', caption: 'What needs you, and what’s coming up.' },
          { src: c('nav'), alt: 'Accounting menu: journal entries, loans, assets, reconcile, tax returns, lock dates', caption: 'Everything an accountant expects, organised for an owner.' },
        ],
      },
      {
        id: 'accounting', toc: 'Accounting', label: 'Product',
        headline: 'Real accounting underneath, without the jargon on top.',
        body: [
          'Journal entries, assets and loans are proper ledgers, so an accountant would feel at home. The crew fills and checks them, and the owner only steps in to approve.',
        ],
        images: [
          { src: c('journals'), alt: 'Journal entries list with status per entry', caption: 'Journal entries, each with a clear status.' },
          { src: c('journal-new'), alt: 'Adding a new journal entry with debit and credit lines', caption: 'Adding an entry, when you want to.' },
          { src: c('assets'), alt: 'Assets register with depreciation model and book value', caption: 'Assets and depreciation.' },
          { src: c('loans'), alt: 'Loans register with amounts borrowed and outstanding balances', caption: 'Loans and what’s still owed.' },
        ],
      },
      {
        id: 'reconciliation', toc: 'Reconcile, two ways', label: 'Decision',
        headline: 'Reconcile in a dashboard, or just ask Jenny.',
        body: [
          'Bank reconciliation works both ways. There’s a familiar overview of accounts, periods and history for anyone who wants control. Or you can simply have the conversation: Jenny asks which account and period, takes the statement, matches it against the books and hands back a finished report.',
        ],
        images: [
          { src: c('recon-overview'), alt: 'Bank reconciliation overview with accounts, current period and history', caption: 'The overview: accounts, periods, history.' },
          { src: c('recon-chat-1'), alt: 'Chat: Jenny asks which bank account and statement period to reconcile', caption: 'Or the conversation: which account, which period.' },
          { src: c('recon-chat-2'), alt: 'Chat: uploading the bank statement and handing it to Jenny', caption: 'Drop the statement in; Jenny takes it from there.' },
          { src: c('recon-report'), alt: 'Reconciliation completed with matched transactions and a report', caption: 'Done: every line matched, ready to export.' },
        ],
      },
      {
        id: 'reporting', toc: 'Reporting', label: 'Product',
        headline: 'Statements an accountant would sign, from the same books.',
        body: [
          'Reporting covers the balance sheet, profit and loss, cash flow, trial balance and the general ledger, all generated from the books the crew keeps, and explainable in plain language when you ask.',
        ],
        images: [
          { src: c('pnl'), alt: 'Profit and loss statement for September 2026', caption: 'Profit & loss: net profit ties back to the dashboard.' },
          { src: c('balance-sheet'), alt: 'Balance sheet as of 30 September 2026, assets equal liabilities plus equity', caption: 'Balance sheet: it balances.' },
          { src: c('cash-flow'), alt: 'Cash flow statement from opening to closing cash', caption: 'Cash flow: opening to closing cash.' },
          { src: c('trial-balance'), alt: 'Trial balance with equal debit and credit totals', caption: 'Trial balance: debits equal credits.' },
          { src: c('ledger'), alt: 'General journal with balanced debit and credit entries', caption: 'The journal behind every report.' },
          { src: c('general-ledger'), alt: 'General ledger view', caption: 'General ledger.' },
        ],
      },
      {
        id: 'ways-in', toc: 'Meeting hesitant owners', label: 'Design',
        headline: 'Not everyone is ready to upload, so setup offers three ways in.',
        body: [
          '“I have documents”, “I don’t have records” and “I’m not ready to upload”. The third opens a sample workspace with clearly fictional data, so hesitant owners see the value before they share anything.',
        ],
        images: [
          { src: c('sample-path'), alt: 'Hesitant owner path from upload panel to a sample workspace analysis', caption: 'The hesitant path: a sample workspace before any real data.' },
        ],
      },
      {
        id: 'trust', toc: 'Earning the upload', label: 'Design',
        headline: 'Explain the document, then promise to protect it.',
        body: [
          'A document guide explains what a trial balance or balance sheet actually is, with a sample. Every question carries a short “why I’m asking”.',
          'Before uploading, owners can read an NDA presented as Crewnity’s commitment to them, not as fine print.',
        ],
        images: [
          { src: c('doc-guide'), alt: 'Document guide explaining a trial balance with a sample', caption: 'Document guide, step 1 of 3: the trial balance.' },
          { src: c('nda'), alt: 'NDA modal presented as a confidentiality commitment', caption: 'The NDA, framed as a promise.' },
        ],
      },
      {
        id: 'landing', toc: 'The landing page', label: 'Landing page',
        headline: 'Who it’s for, what it promises, how it delivers.',
        body: [
          'The marketing site has one job: make a business owner who isn’t an accountant feel understood, then believe this is for them. I start with the person, not the layout. What are they trying to get done (jobs to be done), what’s in the way, and what would make them stop scrolling? Then every page answers three questions, in this order.',
          'I write the copy myself, with AI as a drafting partner, and keep the interactions minimal: hover states, gentle scroll reveals and a chat box in the hero, so the page feels like the product before anyone signs up.',
        ],
        list: [
          'Who it’s for: owners of small and medium businesses in Saudi Arabia, who need clean books and VAT but don’t speak accounting.',
          'What it promises: a whole finance team, the crew, for a fraction of the cost of a hire. “They never sleep.”',
          'How it delivers: tell Lina about your business, upload your books, and the crew runs bookkeeping, VAT and ZATCA, and the month-end close.',
        ],
      },
      {
        id: 'iterations', toc: 'Five directions', label: 'Iterations',
        headline: 'Same promise, five ways of saying it.',
        body: [
          'The message stayed steady while the look kept changing, because each direction tested a different way to earn trust. It isn’t final yet.',
        ],
        iterations: [
          { src: c('landing-naqd'), tall: true, name: 'Where it started: NAQD', note: 'Crewnity’s old name. An “intelligent workspace” for bookkeeping: clean, but it sold software, not a team.', alt: 'The NAQD landing page, Crewnity’s earlier name: an intelligent bookkeeping workspace' },
          { src: c('landing-pixel-light'), name: 'Pixel crew', note: 'Minecraft-style pixel art and a pixel type made the “crew” feel friendly, with the chat to Lina right in the hero.', alt: 'Light pixel-art landing page: Your books don’t stop. Neither does your finance crew' },
          { src: c('landing-pixel-dark'), name: 'Pixel crew, after dark', note: 'Fun, and memorable. But for someone’s money, playful read as less professional, so we kept iterating.', alt: 'Dark pixel-art landing page with the chat box and the four crew members' },
          { src: c('landing-spreadsheet'), name: 'Spreadsheet green', note: 'Grid lines and a spreadsheet green, borrowed from the tool owners already live in, for familiarity.', alt: 'Green spreadsheet-style landing page: Hire a Finance Crew that never sleeps' },
          { src: c('landing-cream-blue'), name: 'Cream and blue (in progress)', note: 'Calm cream, a deep blue and a serif headline, with fewer elements on screen to lower the cognitive load.', alt: 'Cream and blue landing page: Two accountants. One third of the cost. They never sleep' },
        ],
      },
      {
        id: 'next', toc: 'Status and next time', label: 'Reflection',
        headline: 'Ongoing, and not measured yet.',
        body: [
          'The bet is that a conversation can replace accounting knowledge. The next step is testing that with real owners: whether they trust Lina with their books, and whether the sample workspace leads to an upload or just to a nice demo.',
        ],
      },
    ],
  },

  flownet: {
    skill: 'Clinical workflows',
    stats: [
      { value: 2, label: 'Role views: doctor in training and supervisor' },
      { value: 4, label: 'Steps from evidence to sign-off' },
      { value: 4, label: 'Months, from first interviews to MVP' },
    ],
    intro: [
      'Flownet is an MVP for specialist training in Swedish government hospitals. Doctors in specialist training collect evidence for their milestones, and supervisors review and sign off. I was Lead Product Designer and Advisor from September to December 2025.',
    ],
    sections: [
      {
        id: 'problem', toc: 'Paper and signatures', label: 'Problem',
        headline: 'Progress lived in binders, and sign-off happened away from the evidence.',
        body: [
          'Doctors tracked milestones on paper and chased supervisors for signatures. Supervisors were asked to approve work they couldn’t see in context.',
        ],
      },
      {
        id: 'research', toc: 'What doctors told us', label: 'Research',
        headline: 'Interviews with doctors in training shaped three rules.',
        body: ['We spoke with doctors in Swedish training programmes. What came out of it:'],
        list: [
          'Progress needs a next action, not just a percentage.',
          'Evidence needs context: a file alone doesn’t prove a milestone.',
          'Roles need different views: a doctor’s day and a supervisor’s day aren’t the same.',
        ],
      },
      {
        id: 'decision', toc: 'Sign-off with context', label: 'Decision',
        headline: 'Bring the evidence into the sign-off decision.',
        body: [
          'The pivotal part wasn’t the signature button. It was shared context. A doctor gathers evidence and requests sign-off; the supervisor reviews it in place and chooses Request revisions or Approve & sign off, with feedback attached to the evidence itself.',
          '“Approve & sign off” is an MVP action, not a legal e-signature.',
        ],
        images: [
          { src: f('evidence'), alt: 'Doctor uploads evidence against a milestone checklist', caption: 'The doctor attaches evidence to the milestone.' },
          { src: f('sign-off'), alt: 'Review and sign off evidence modal with Request Revisions and Approve & Sign Off', caption: 'The supervisor decides with the evidence in front of them.' },
        ],
      },
      {
        id: 'views', toc: 'Two different days', label: 'Design',
        headline: 'One product, two very different days.',
        body: [
          'Doctors start from their next milestone. Supervisors start from everyone waiting on them, by doctor, milestone and status. The choice is made once, at the door.',
        ],
        images: [
          { src: f('paths'), alt: 'Choose your path: doctor in training or supervisor', caption: 'Choose your path.' },
          { src: f('doctor'), alt: 'Doctor dashboard with progress and milestone cards', caption: 'Doctor view: what’s next.' },
          { src: f('supervisor'), alt: 'Supervisor dashboard with pending reviews per doctor', caption: 'Supervisor view: who’s waiting.' },
          { src: f('milestone'), alt: 'Milestone completed celebration', caption: 'A long road gets a small celebration.' },
        ],
      },
      {
        id: 'next', toc: 'Status and next time', label: 'Reflection',
        headline: 'An MVP. The hard part is the history on paper.',
        body: [
          'Importing existing records was planned but not built, and nothing here is an official integration. Next time I’d prototype that import first: moving years of paper history is where adoption will be won or lost.',
        ],
      },
    ],
  },

  cystercare: {
    skill: 'Service design',
    stats: [
      { value: 7, label: 'Interviews with people living with PCOS/PMOS' },
      { value: 3, label: 'Interviews with specialists' },
      { value: 15, suffix: '+', label: 'Papers reviewed, including the 2023 international guideline' },
    ],
    intro: [
      'CysterCare is a lifelong AI detection and care system for PCOS/PMOS. It spots the early signs with an AI assessment, routes people to verified specialists for a diagnosis, and stays with them for the long run: symptom and cycle tracking, an AI care assistant, care plans and ongoing monitoring. It started as research in 2025 and became a hackathon build with Team Peshawar at Imaginathon, where it took 5th prize.',
      'I led the service design: literature review, interviews, synthesis, flows, the service blueprint, Figma prototypes and, later, code.',
    ],
    sections: [
      {
        id: 'problem', toc: 'Nobody holds the picture', label: 'Problem',
        headline: 'PCOS/PMOS touches many specialties, and nobody holds the whole picture.',
        body: [
          'People move between gynaecology, endocrinology, dermatology and mental health, getting partial explanations and generic advice. Online information is everywhere and hard to trust.',
        ],
      },
      {
        id: 'research', toc: 'Papers, then people', label: 'Research',
        headline: 'Fifteen papers first, then ten conversations.',
        body: [
          'I reviewed 15+ papers, including the 2023 International PCOS Guideline, then interviewed 7 people living with PCOS/PMOS and 3 specialists. The themes: cognitive overload, fragmented journeys, low trust and emotional vulnerability.',
        ],
        list: [
          'Explanation is often missing: diagnosis comes late, advice comes generic.',
          'People learn from other women, more than from leaflets.',
          'Care is siloed: every specialist sees one part.',
        ],
        images: [
          { src: cc('research'), alt: 'Research slide: 15+ clinical papers, 2023 guidelines, interviews', caption: 'Literature first, so the interviews could go deeper.' },
          { src: cc('pain-points'), alt: 'Pain points board from interview synthesis', caption: 'Pain points from the interviews, before they became flows.' },
        ],
      },
      {
        id: 'decision', toc: 'Community vs research', label: 'Decision',
        headline: 'Keep lived experience and evidence side by side, never mixed.',
        body: [
          'Because people learn from each other, community had to be central. But a post isn’t a guideline. So Community and Research are separate spaces, the source type is always visible, and there’s a clear path to report, save or escalate to care.',
        ],
        layout: 'phones',
        images: [
          { src: cc('feed'), alt: 'Community feed with posts from people with PCOS/PMOS', caption: 'Community: lived experience.', phone: true },
          { src: cc('research-tab'), alt: 'Research area with evidence-based articles', caption: 'Research: evidence, labelled as such.', phone: true },
        ],
      },
      {
        id: 'care', toc: 'Beyond the app', label: 'Design',
        headline: 'The app points to care. It doesn’t replace it.',
        body: [
          'The service blueprint connects primary care, gynaecology, endocrinology, dermatology, psychology, dietetics and movement, so the app can route people to the right specialist.',
          'Symptom logging lets people correct the record, shows when a pattern is uncertain, and suggests when to see a clinician.',
        ],
        images: [
          { src: cc('specialists'), alt: 'Connect with specialists screen', caption: 'Finding the right specialist.' },
          { src: cc('symptoms'), alt: 'Log symptoms screen', caption: 'Logging symptoms, with room for uncertainty.' },
        ],
      },
      {
        id: 'next', toc: 'Status and next time', label: 'Reflection',
        headline: '5th prize. No evaluation yet.',
        body: [
          'The hackathon build took 5th prize, but a prize isn’t a usability result. The next step is a study with people managing PCOS/PMOS, starting with whether the community and research split actually feels clear.',
          'PCOS has since been renamed PMOS (2026), so this case study uses both names. The research and the screens predate the change.',
        ],
      },
    ],
  },

  'access-adda': {
    skill: 'Accessibility',
    stats: [
      { value: 4, label: 'Cards per round: place, person, situation, barrier' },
      { value: 4, label: 'Scores, one per WCAG principle' },
      { value: 3, label: 'Languages: English, Urdu, Pashto' },
    ],
    play: {
      headline: 'Three rounds, about three minutes.',
      note: 'Deal the cards, read the table, then play the intervention you think removes the barrier. Switch to Urdu or Pashto at any time.',
    },
    intro: [
      'Access Adda is an interactive card game that translates Peshawar’s physical barriers into universal design interventions, set in real places across the city. Every round puts a real person in a real place with a deadline, and asks you to design your way past the barrier. I designed and built it as a personal project; you can play it above.',
    ],
    sections: [
      {
        id: 'context', toc: 'Accessibility as a favour', label: 'Problem',
        headline: 'In Peshawar, access is usually a favour, not a feature.',
        body: [
          'A wheelchair user at a university asks a guard to help with the stairs. A fruit seller with sticky hands can’t tell whether a payment came through. A man who can’t read script, with red-green colour blindness, guesses which bus goes to Karkhano.',
          'Each fix people reach for first, like a phone number at the bottom of the stairs or asking the conductor, keeps them dependent on someone else. I wanted a way to feel that difference, not just read about it.',
        ],
      },
      {
        id: 'concept', toc: 'Four cards, one decision', label: 'Concept',
        headline: 'Every round deals a place, a person, a situation and a barrier.',
        body: [
          'The cards set the scene the way a story would: IM|Sciences, Board Bazar, the Hashtnagri bus stand; Areeba, Rahim, Gul Khan; an exam in eight minutes, a rush-hour payment, three identical buses at dusk. Then you play one intervention card from your hand.',
        ],
        images: [{ src: a('cover'), alt: 'Access Adda cards on a parchment table: place, person, situation and barrier', caption: 'The four card types, as the table should feel.' }],
      },
      {
        id: 'deck', toc: 'The full deck', label: 'Design',
        headline: 'Beyond the three rounds: the rest of the deck.',
        body: [
          'The full prototype has twelve places and fourteen people. These are card designs from scenarios outside the playable rounds: a man with low vision at Islamia College, a blind commuter at the BRT, a Deaf woman ordering kahwa in Qissa Khwani, a hearing-aid user at All Saints Church, an older passenger at a ticket machine, a power-wheelchair user at Sethi House.',
        ],
        deck: true,
      },
      {
        id: 'scoring', toc: 'Bad fixes cost something', label: 'Decision',
        headline: 'Make a bad fix visibly worse than a good one.',
        body: [
          'Each intervention is scored on Independence, Perceivability, Understandability and Operability, with the WCAG criteria behind it. Half-fixes score half. And only an inclusive solution earns the happy ending: a wrong card shows you the barrier still standing, and you have to ask to see what would have worked.',
        ],
      },
      {
        id: 'language', toc: 'Three languages', label: 'Design',
        headline: 'Built for Peshawar, so it speaks Urdu and Pashto.',
        body: [
          'Every card and result switches between English, Urdu and Pashto mid-game, right to left, set in Nastaliq and Naskh rather than a fallback font. An accessibility game that only works in English would fail its own first round.',
        ],
      },
      {
        id: 'practice', toc: 'Practising what it teaches', label: 'Design',
        headline: 'The game follows its own advice.',
        body: [
          'It’s fully playable by keyboard with visible focus, announces each deal and result to screen readers, never relies on colour alone (every verdict is written out), respects reduced motion, and keeps sound off until you turn it on.',
        ],
      },
      {
        id: 'audit', toc: 'From prototype to playable', label: 'Process',
        headline: 'I audited my own first version, and cut most of it.',
        body: [
          'The first prototype had a map, 12 locations, a journal, badges and settings, but the core was a 1-of-3 quiz, four locations led nowhere, and two of the four card types had no art. It also tripped over its own subject: no focus states, songs on hover, alt text like “areeba”.',
          'For the playable version I kept the strongest three scenarios (the ones complete in all three languages), turned the choice into a hand of cards, gave every card type one consistent frame, and replaced borrowed photos with drawn pictograms.',
        ],
      },
      {
        id: 'next', toc: 'Status and next time', label: 'Reflection',
        headline: 'Playable, not yet played with people.',
        body: [
          'I haven’t run sessions with players, so I can’t claim it changes anyone’s thinking. Next I’d playtest it with design students and with disabled people in Peshawar, check every scenario with them, and finish the Pashto for the remaining eleven.',
        ],
      },
    ],
  },

  // Source: banao-tamasha/CASE-STUDY-BRIEF.md. Timeline, tools and outcomes are [FILL IN] there, so they stay out.
  tamasha: {
    skill: 'Community design',
    stats: [
      { value: 100, suffix: '+', label: 'Builders in the Banao Discord (the Meme Contest marked 100 members)' },
      { value: 84, label: 'Builds at Imaginathon, Banao’s 48-hour city challenge' },
      { value: 6, label: 'Puppet characters, one per talent, on a single rig' },
    ],
    intro: [
      'Banao is a Discord community where Pakistani founders, developers, designers and vibecoders show what they’re making. Its tagline is “Where Pakistan builds.” As a Banao.pk ambassador I help the community grow and run its events. Tamasha (تماشا) was my proposal for the next one: a talent show for everything builders can do besides building. I led the design strategy, from brand audit and concept to the character system, posters and website flow.',
    ],
    sections: [
      {
        id: 'community', toc: 'The community', label: 'Context',
        headline: 'A room for builders, with events that have a sense of humour.',
        body: [
          '“Not a course. Not a guru funnel.” Banao is where people post their work, get real feedback and find collaborators. Every event has its own personality, and voting always happens on Discord with emoji reactions.',
        ],
        list: [
          'Build Weekend: an async jam to build something gloriously useless.',
          'Demo Day: show-and-tell with live feedback.',
          'Meme Contest: held to celebrate 100 members, “no building”.',
          'Worst Startup Idea: one-line pitches, voted with skull reactions.',
          'Imaginathon: builders each took a Pakistani city and imagined something better for it in 48 hours. 84 builds.',
        ],
      },
      {
        id: 'problem', toc: 'Building vs performing', label: 'Problem',
        headline: 'Every Banao event is about building. A talent show is about performing.',
        body: [
          'The brief was to give a talent show its own identity that still felt unmistakably Banao, take inspiration from Pakistani puppet shows and modernise them, use puppets as the performers, test the style through posters, and plan a talent show section on banao.pk.',
          'The risk ran both ways: a generic talent-show look that could belong to anyone, or a costume pulled over the brand that hides it.',
        ],
        images: [{ src: t('hero'), alt: 'Tamasha wordmark in script with تماشا in Urdu, beside three string puppets under a spotlight', caption: 'Style direction v1: Banao’s brick system, strung up like a kathputli.' }],
      },
      {
        id: 'audit', toc: 'Brand audit', label: 'Research',
        headline: 'Start from what Banao already owns.',
        body: [
          'I pulled the live site’s stylesheet and documented the system, so the event would extend it rather than replace it. That meant forest green and champagne gold on alabaster; Fraunces, Space Grotesk and Satisfy (already used for the Imaginathon wordmark); a 32px graph-paper grid; and corkboard-angled winner cards.',
          'The most useful find was small. The logo is a “B” made of rounded bricks, with one gold brick out of place. That loose brick appears on every button, tilting 12° on hover.',
        ],
        images: [{ src: t('brand-audit'), alt: 'Banao core palette swatches, three Tamasha costume accents, and the system rules inherited from banao.pk', caption: 'Extracted from banao.pk. Tamasha adds a costume cupboard on top; it never replaces the core.' }],
      },
      {
        id: 'roots', toc: 'Puppet theatre', label: 'Research',
        headline: 'Four references, each turned into a rule.',
        body: [
          'Puppet theatre fits a talent show naturally, and almost everyone here grew up with it. Instead of using it as decoration, I took one usable rule from each reference.',
        ],
        list: [
          'Kathputli marionettes from the Punjab and Sindh fairs: skirts, never legs, and kohl-flicked almond eyes.',
          'The takla, the puppeteer’s control bar: ours is three bricks with a gold one in the centre.',
          'PTV puppet shows like Kaliyan: characters talk back and are a little sarcastic, like Banao’s voice. No existing character is copied.',
          'Mela and truck art (parda curtains, gota lace, ajrak, painted borders): pattern lives on costumes and frames, and the UI stays clean.',
        ],
        images: [{ src: t('roots'), alt: 'Four research cards: kathputli, takla, PTV puppet shows, mela and truck art, each with the design rule it produced', caption: 'Research to rules.' }],
      },
      {
        id: 'idea', toc: 'The core idea', label: 'Concept',
        headline: 'Banao’s bricks become kathputli. The loose gold brick becomes the head.',
        body: [
          'One move connects the brand mark, the Pakistani reference and the talent theme. Every puppet is built from the logo’s rounded bricks: heads, torsos, arms and hands. Only the skirt is a free shape, because cloth moves. Banao’s 1px hairline becomes the puppet string.',
          'The name is Tamasha, “show” or “spectacle” in Urdu. It’s set in Satisfy like Imaginathon, so Banao’s event wordmarks read as a family, and always paired with تماشا in Noto Nastaliq. Urdu never appears without English.',
        ],
        images: [{ src: t('rig'), alt: 'Annotated puppet anatomy: takla, strings, the gold brick head, brick torso, two-part arms, ghera skirt, no legs', caption: 'One rig. Head = the loose brick.' }],
      },
      {
        id: 'cast', toc: 'Six talents', label: 'Design system',
        headline: 'One puppet, six talents, so anyone on the team can draw the next act.',
        body: [
          'All six share the same rig. Only costume colours, headwear and one prop change: Gulu sings, Rani dances, Ustad Taal plays tabla, Chacha Chutkula does stand-up, Bano Baji recites shayari, and Jugnu juggles bricks. They’re named like mohalla nicknames, and they’re funny while the copy stays dry.',
          'Three accents from puppet fabric, ajrak and truck art (sindoor red, genda marigold, ajrak indigo) live only on costumes, patterns and posters. They never touch the UI. Red in particular stays off buttons because it reads as an error.',
        ],
        images: [
          { src: t('cast'), alt: 'Six puppet characters: Gulu the singer, Rani the dancer, Ustad Taal the musician, Chacha Chutkula the comic, Bano Baji the poet, Jugnu the wildcard' },
          { src: t('kit'), alt: 'The Tamasha kit: wordmark, type scale, motif tiles (takla, gota fringe, ajrak tile, truck-art border, parda) and motion rules', caption: 'Type, motifs and motion. All motion stops under reduced-motion settings.' },
        ],
        layout: 'single',
      },
      {
        id: 'posters', toc: 'Posters', label: 'Exploration',
        headline: 'Four poster directions, three colourways, two separate decisions.',
        body: [
          'Each poster tests a different idea. A colourway switch (forest, ajrak indigo, sindoor red) runs across all four, so the team can choose the concept first and the palette second, instead of judging both at once. The date and prize pool on them are placeholders.',
        ],
        list: [
          'A · Parda Utha (the curtain rises), 4:5: one singer in the spotlight. The safest choice for the main announcement.',
          'B · The Lineup, A3 or banner: four acts hanging from one Banao beam on graph paper. The most on-brand.',
          'C · The B is a puppet, 4:5: the logo on strings, its gold brick looking around. A teaser for “auditions open”.',
          'D · Ghoomar (the twirl), 9:16: a dancer mid-spin in a truck-art frame, for stories and the countdown.',
        ],
        images: [
          { src: t('poster-a'), alt: 'Poster A: a singing puppet in a spotlight between green velvet curtains, titled Tamasha', caption: 'A · Parda Utha' },
          { src: t('poster-b'), alt: 'Poster B: four puppets hanging from a brick beam on graph paper, “Everyone’s got a talent”', caption: 'B · The Lineup' },
          { src: t('poster-c'), alt: 'Poster C: the Banao B logo made of bricks hanging on strings on an indigo ajrak background', caption: 'C · The B is a puppet' },
          { src: t('poster-d'), alt: 'Poster D: a dancing puppet twirling inside a red truck-art border', caption: 'D · Ghoomar' },
        ],
      },
      {
        id: 'ux', toc: 'Entry stays on Discord', label: 'Key decision',
        headline: 'The website promotes the show. Entering and voting stay on Discord.',
        body: [
          'Banao’s community already lives on Discord, and every past event voted with reactions there. Moving entry onto the website would add a sign-up step and split the room. So the site’s job is to make people want to enter, explain how, and show the acts, then send people back to #tamasha.',
        ],
        images: [{ src: t('flow'), alt: 'User flow: homepage band, /tamasha stage hero, pick your act, Discord #tamasha to post a clip and react to vote, then the acts wall', caption: 'The flow. The one step off the website is the one the community already knows.' }],
      },
      {
        id: 'web', toc: 'Website', label: 'Design',
        headline: 'A homepage band and a page that opens like a stage.',
        body: [
          'On the homepage, Tamasha takes the slot the current event uses: a dark forest band with a curtain valance, a hanging puppet and “Enter your act”. The /tamasha page opens on a stage where the curtains part and the troupe drops in on strings. A “Replay the parda” control means the page is complete at rest, not hidden behind an animation.',
          'Below the hero sit four real steps (pick your act, post it in #tamasha, the room votes, finale night on Discord Stage), six act cards whose puppets swing on hover, and an acts wall that reuses Banao’s corkboard winner cards. Buttons stay in Banao’s normal style.',
        ],
        images: [
          { src: t('homepage-band'), alt: 'banao.pk homepage mockup with a dark green Tamasha band, a hanging juggler puppet and an Enter your act button' },
          { src: t('stage-hero'), alt: 'The /tamasha page hero: a stage with green curtains, three puppets on strings, the Tamasha wordmark and two calls to action', caption: 'The /tamasha stage hero.' },
          { src: t('acts'), alt: 'Pick your act: six category cards, each with its puppet' },
          { src: t('entries'), alt: 'The acts wall: entry cards at slight corkboard angles with play length and votes', caption: 'Acts wall, with example entries.' },
        ],
        layout: 'single',
      },
      {
        id: 'next', toc: 'Status and next steps', label: 'Reflection',
        headline: 'Presented, not yet performed.',
        body: [
          'Style direction v1 was finished and presented in October 2026. The final style isn’t locked and the show hasn’t run yet, so there are no entries or results to report.',
          'What I’d point to is the method. A small brand detail, the loose brick, became a whole character system. Cultural references became specific rules instead of decoration. And the product flow stays where the community already is.',
          'Next: lock a poster direction and colourway, produce the full asset set (feed, story, Discord banner, print), then build the /tamasha page.',
        ],
      },
    ],
  },

  repshep: {
    skill: 'Mobile UX',
    stats: [
      { value: 4, label: 'Steps in every follow-up, ending in a confirm' },
      { value: 2, label: 'Channels: in-app and WhatsApp' },
      { value: 2, label: 'Languages: English and Urdu' },
    ],
    intro: [
      'RepShep is a complete management system for gyms, built for large gyms with many members: memberships, payments, attendance and staff in one place, plus AI workflows that send members nudges over WhatsApp to keep them coming back. It’s a personal project, in progress. All data is mock, and I haven’t run user research yet.',
    ],
    sections: [
      {
        id: 'problem', toc: 'A person behind each task', label: 'Problem',
        headline: 'Every overdue payment is a person.',
        body: [
          'Big gyms run hundreds of memberships across spreadsheets and WhatsApp. What slips is retention: the member who quietly stopped coming, the payment that’s late. At that scale nobody can follow up by hand.',
        ],
      },
      {
        id: 'decision', toc: 'AI drafts, people approve', label: 'Decision',
        headline: 'AI workflows prepare the nudge. The gym approves it.',
        body: [
          'The AI workflow spots who needs a nudge, drafts the message (channel, language, timing) and queues it for WhatsApp. Every nudge follows four steps: notice, review the member’s context, prepare, confirm, so staff stay in control of what members receive.',
        ],
        layout: 'phones',
        images: [
          { src: r('poke'), alt: 'Poke a member sheet: channel, language, message and timing', caption: 'Preparing a poke.', phone: true },
          { src: r('channels'), alt: 'Communication channels: app notifications and WhatsApp Business', caption: 'Channels, kept separate.', phone: true },
          { src: r('whatsapp'), alt: 'Connect WhatsApp with a message template preview', caption: 'WhatsApp, with a preview.', phone: true },
        ],
      },
      {
        id: 'recovery', toc: 'When a message fails', label: 'Design',
        headline: 'When a message fails, say so.',
        body: ['A failed reminder lands in its own tab with Review & retry, and history keeps a record of every nudge.'],
        layout: 'phones',
        images: [
          { src: r('failed'), alt: 'Failed tab: WhatsApp reminder failed, review and retry', caption: 'Failure is visible.', phone: true },
          { src: r('history'), alt: 'History of delivered nudges', caption: 'And so is history.', phone: true },
        ],
      },
      {
        id: 'next', toc: 'Status and next time', label: 'Reflection',
        headline: 'In progress: the AI workflows are next.',
        body: ['Next I’m designing the AI workflows in full: which signals trigger a nudge, how staff review and edit drafts, and how members can opt out. Before building them I’ll test the flows with gym managers.'],
      },
    ],
  },

  devmode: {
    skill: 'AI literacy',
    stats: [
      { value: 4, label: 'Weeks in the curriculum' },
      { value: 5, label: 'Concept bridges from Figma to code' },
      { value: 3, label: 'Lesson modes: orient, inspect, apply' },
    ],
    intro: [
      'DevMode is a learning-platform concept that helps designers understand what they build with AI. It’s a personal exploration, a prototype rather than a product, and no research is claimed.',
    ],
    sections: [
      {
        id: 'problem', toc: 'Building without understanding', label: 'Problem',
        headline: 'As AI makes building easier, how do we make understanding easier too?',
        body: ['Designers can now prompt an app into existence, then get stuck the moment it breaks, because nobody showed them what’s underneath.'],
      },
      {
        id: 'idea', toc: 'Start from what you know', label: 'Insight',
        headline: 'Start from what designers already know.',
        body: ['Every lesson begins with a bridge from Figma to code. Analogies need boundaries, so each one also says where it stops being true.'],
        list: [
          'Components → React components',
          'Variants → props and state',
          'Tokens → CSS variables',
          'Auto layout → Flexbox and Grid',
          'Prototype flows → app logic',
        ],
      },
      {
        id: 'decision', toc: 'Inspection is the lesson', label: 'Decision',
        headline: 'Inspection is the lesson.',
        body: ['The API lesson is a workspace with three modes: orient, inspect, apply. You select a layer, see its context, experiment, build a state and check what you learned, the way you’d inspect a Figma file.'],
        images: [{ src: d('api-lesson'), alt: 'API lesson with layer diagram and instructor panel', caption: 'The API lesson: inspect the layers, with an instructor alongside.' }],
      },
      {
        id: 'build', toc: 'Small builds, honest checks', label: 'Design',
        headline: 'Four weeks, each ending in a small build.',
        body: ['A build mentor asks you to explain the states before writing code. Calibration questions check AI answers that sound right but aren’t.'],
        images: [
          { src: d('dashboard'), alt: 'DevMode dashboard', caption: 'Dashboard.' },
          { src: d('curriculum'), alt: 'Curriculum with weekly modules', caption: 'Curriculum.' },
          { src: d('build'), alt: 'Build challenge', caption: 'A build challenge.' },
          { src: d('arch-lab'), alt: 'Architecture lab node canvas', caption: 'Architecture lab.' },
        ],
      },
      {
        id: 'next', toc: 'Status and next time', label: 'Reflection',
        headline: 'A concept. The analogies need testing.',
        body: ['Next I’d test the concept bridges with a handful of designers, to see which analogies help and which quietly mislead.'],
      },
    ],
  },
};
