// Copy and data for the landing's "day in her life" (DESIGN.md Direction v4).
// Process facts come from the CysterCare and Vettio case studies; nothing here is invented.

// How each project's house looks in the neighbourhood.
// `angle` (degrees, 0 = straight ahead of the Sim): the three flagship projects sit dead ahead,
// the rest line the sides of the crescent.
export const HOUSES = {
  // `featured`: a gold star over the house and a starred pin. `sign` is the brand colour (door, shutters, board).
  // `extras` are small case-study props: 'cross' (healthcare), 'flag' (community), 'ramp' (accessibility).
  vettio: { angle: -20, logo: 'vettio', featured: true, wall: 0xe9ecff, roof: 0x3e4cb6, flat: true, storeys: 2, sign: '#3e4cb6' },
  crewnity: { angle: 0, logo: 'crewnity', featured: true, wall: 0xe4efe6, roof: 0x2f5d45, flat: true, storeys: 2, sign: '#1f6b3f' },
  flownet: { angle: 20, logo: 'flownet', wall: 0xe3eef3, roof: 0x3d6f86, storeys: 2, sign: '#2f6f8f', extras: ['cross'] },
  cystercare: { angle: -42, logo: 'cystercare', wall: 0xf1e8fb, roof: 0x7b5cf0, storeys: 1, sign: '#6a4fd8' },
  // On the map Tamasha is shown as Banao.pk, the community it was made for
  tamasha: { angle: 42, label: 'Banao.pk', logo: 'banao', wall: 0xebe5cf, roof: 0x144a30, storeys: 1, sign: '#144a30', extras: ['flag'] },
  'access-adda': { angle: -63, logo: 'access-adda', wall: 0xf3e3cf, roof: 0x8b3a2b, storeys: 1, sign: '#8b3a2b', extras: ['ramp'] },
  repshep: { angle: 63, logo: 'repshep', wall: 0xe9ebf3, roof: 0x45566e, flat: true, storeys: 1, sign: '#45566e' },
  devmode: { angle: 84, logo: 'devmode', wall: 0xefeff2, roof: 0x2a2d36, flat: true, storeys: 1, sign: '#2a2d36' },
};

// My design process: what I do on every project (`body`), with one worked example (`example`)
// from CysterCare, where the whole process is documented end to end.
export const CHAPTERS = [
  {
    id: 'discover', name: 'Discover', method: 'User research', frame: 6,
    headline: 'Research first, pixels later.',
    body: 'Desk research, stakeholder chats and user interviews, so I know who I’m designing for and where it actually hurts.',
    example: '15+ papers, including the 2023 international PCOS guideline, then interviews with 7 people living with PCOS/PMOS and 3 specialists.',
    img: '/img/process/listen.webp', alt: 'Research board: the 2023 PCOS guideline, 15+ papers, and ten interview cards for seven people living with PCOS/PMOS and three specialists',
  },
  {
    id: 'define', name: 'Define', method: 'Synthesis', frame: 30,
    headline: 'Affinity maps, insights, then a sharp problem statement.',
    body: 'I cluster findings until the patterns show, write the insights, and frame the “how might we” the design has to answer.',
    example: 'Four themes came out. The insight: people learn from each other, but a post isn’t a guideline.',
    img: '/img/process/synthesis.webp', alt: 'Affinity board with sticky notes under four themes, leading to an insight and a decision',
  },
  {
    id: 'map', name: 'Map', method: 'Service design & IA', frame: 47,
    headline: 'Journeys, blueprints and user flows.',
    body: 'Service blueprints show the whole experience, front stage and back stage. User flows and the information architecture come out of them.',
    example: 'A care blueprint from the first symptom search to long-term monitoring, and the user flows that came out of it.',
    img: '/img/process/blueprint.webp', alt: 'PCOS/PMOS care service blueprint with user actions, physical evidence, frontstage, backstage and supporting actions, plus the symptoms user flow',
  },
  {
    id: 'design', name: 'Design', method: 'Wireframes to UI', frame: 68,
    headline: 'Lo-fi wireframes, then hi-fi UI.',
    body: 'Wireframes test structure and hierarchy while changes are still cheap. High-fidelity UI comes after, built on a design system so it scales.',
    example: 'The add-symptoms flow: pick a date, then the symptoms, with room to correct the record.',
    img: '/img/process/wireframes.webp', alt: 'Two steps of the CysterCare add-symptoms flow, each as a lo-fi wireframe beside the real hi-fi screen: picking a date and symptoms, then the saved summary with a way to edit it',
  },
  {
    id: 'deliver', name: 'Deliver', method: 'Test, ship, iterate', frame: 97,
    headline: 'Ship it, measure it, iterate.',
    body: 'Usability testing, launch, then metrics that show whether it worked. A launch or a prize isn’t the finish line; the next iteration is.',
    example: 'Vettio made recruiters 30% more efficient after launch. CysterCare took 5th prize, so its next step is a usability study.',
    img: '/img/process/ship.webp', live: 'deliver', alt: 'Shipped work: Vettio’s interview screen and three CysterCare screens, with their outcomes: +30% recruiter efficiency, launched on Product Hunt, and 5th prize at Imaginathon',
    link: { to: '/work/cystercare', label: 'See the full CysterCare case study' },
  },
];
