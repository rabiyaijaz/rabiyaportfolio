import { Link } from 'react-router-dom';

/** Minimal plumbob mark: a slim rhombus with a lit upper facet. */
export function Plumbob({ size = 14, className = '' }) {
  return (
    <svg className={`plumbob ${className}`} width={size * 0.62} height={size} viewBox="0 0 10 16" aria-hidden="true">
      <path d="M5 0 10 8 5 16 0 8Z" fill="var(--accent)" />
      <path d="M5 0 10 8H0Z" fill="#fff" opacity=".28" />
    </svg>
  );
}

export default function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Rabiya Ijaz, home">
      <Plumbob size={15} />
      <span>Rabiya Ijaz</span>
    </Link>
  );
}
