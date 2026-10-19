// Line icons for the About page: one per process step, plus the off-work props.
// Drawn on a 32px grid, 1.8 stroke, currentColor. Decorative: always aria-hidden.
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

const PATHS = {
  listen: <><path {...P} d="M5 16h2M9 11v10M13 7v18M17 12v8M21 9v14M25 14v4M27 16h0" /></>,
  sense: <><rect {...P} x="5" y="5" width="10" height="10" rx="1.5" /><rect {...P} x="17" y="7" width="10" height="10" rx="1.5" transform="rotate(6 22 12)" /><rect {...P} x="9" y="17" width="10" height="10" rx="1.5" transform="rotate(-5 14 22)" /></>,
  design: <><path {...P} d="M6 26 8 19 21 6l5 5-13 13Z" /><path {...P} d="m18 9 5 5M6 26l5-1" /></>,
  prototype: <><rect {...P} x="4" y="6" width="24" height="17" rx="2.5" /><path {...P} d="m15 13 2 10 2.4-3.6L23 22l1.4-1.4-3.6-2.6L24 16Z" /></>,
  ai: <><path {...P} d="M16 4c.8 5.2 3 7.4 8.2 8.2-5.2.8-7.4 3-8.2 8.2-.8-5.2-3-7.4-8.2-8.2C13 11.4 15.2 9.2 16 4Z" /><path {...P} d="M24.5 20c.4 2.4 1.4 3.4 3.8 3.8-2.4.4-3.4 1.4-3.8 3.8-.4-2.4-1.4-3.4-3.8-3.8 2.4-.4 3.4-1.4 3.8-3.8Z" /></>,
  code: <><path {...P} d="m11 10-6 6 6 6M21 10l6 6-6 6M18 7l-4 18" /></>,
  headphones: <><path {...P} d="M6 19v-3a10 10 0 0 1 20 0v3" /><rect {...P} x="4" y="18" width="6" height="9" rx="2" /><rect {...P} x="22" y="18" width="6" height="9" rx="2" /></>,
  camera: <><path {...P} d="M5 11h5l2-3h8l2 3h5v14H5Z" /><circle {...P} cx="16" cy="18" r="4.5" /></>,
  chai: <><path {...P} d="M7 13h15v6a7 7 0 0 1-7 7h-1a7 7 0 0 1-7-7Z" /><path {...P} d="M22 15h2a3 3 0 0 1 0 6h-2.4M11 9c0-2 2-2 2-4M16 9c0-2 2-2 2-4" /></>,
  people: <><circle {...P} cx="11" cy="11" r="4" /><circle {...P} cx="22" cy="12" r="3" /><path {...P} d="M4 25c1-5 4-7 7-7s6 2 7 7M19 19c3 0 6 1.5 7 5" /></>,
  // room tabs
  needs: <><path {...P} d="M4 17h5l3-7 4 13 3-9 2 3h7" /></>,
  traits: <><path {...P} d="M16 4 19 12.5 28 13l-7 5.6 2.5 8.6L16 22l-7.5 5.2L11 18.6 4 13l9-.5Z" /></>,
  skills: <><path {...P} d="M6 26V18M12 26V12M18 26V15M24 26V7" /><path {...P} d="M4 26h24" /></>,
  items: <><path {...P} d="M7 12h18l-1.6 14H8.6Z" /><path {...P} d="M12 12V9a4 4 0 0 1 8 0v3" /></>,
  wants: <><circle {...P} cx="16" cy="16" r="11" /><circle {...P} cx="16" cy="16" r="6" /><circle cx="16" cy="16" r="2" fill="currentColor" /></>,
  // needs
  hunger: <><path {...P} d="M10 4v8a3 3 0 0 0 6 0V4M13 4v24M22 28V4c-3 2-4 6-4 10h4" /></>,
  fun: <><rect {...P} x="4" y="10" width="24" height="13" rx="6.5" /><path {...P} d="M10 14v5M7.5 16.5h5" /><circle cx="21" cy="15" r="1.4" fill="currentColor" /><circle cx="23.5" cy="18" r="1.4" fill="currentColor" /></>,
  screen: <><path {...P} d="M3 16s5-8 13-8 13 8 13 8-5 8-13 8S3 16 3 16Z" /><circle {...P} cx="16" cy="16" r="3.5" /></>,
  social: <><path {...P} d="M5 7h22v14H14l-6 5v-5H5Z" /></>,
  flow: <><path {...P} d="M3 13c4-5 7 5 11 0s7 5 11 0M3 20c4-5 7 5 11 0s7 5 11 0" /></>,
  energy: <><path {...P} d="M18 3 7 18h8l-2 11 11-15h-8Z" /></>,
  environment: <><path {...P} d="M7 25C7 13 15 6 27 6c0 12-7 20-19 19ZM7 25 18 14" /></>,
  // traits
  empathetic: <><path {...P} d="M16 27S4 20 4 12a6 6 0 0 1 12-2 6 6 0 0 1 12 2c0 8-12 15-12 15Z" /></>,
  playful: <><rect {...P} x="6" y="6" width="20" height="20" rx="4" /><circle cx="11.5" cy="11.5" r="1.6" fill="currentColor" /><circle cx="16" cy="16" r="1.6" fill="currentColor" /><circle cx="20.5" cy="20.5" r="1.6" fill="currentColor" /></>,
  outgoing: <><path {...P} d="M5 7h22v14H14l-6 5v-5H5Z" /><path {...P} d="M10 13h12M10 17h7" /></>,
  active: <><path {...P} d="M18 3 7 18h8l-2 11 11-15h-8Z" /></>,
  sensitive: <><path {...P} d="M24 5C12 7 7 16 8 27c6-2 16-8 16-22ZM8 27l9-13" /></>,
};

export default function Icon({ name, size = 28, className = '' }) {
  return (
    <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  );
}
