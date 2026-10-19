import { Link, useNavigate } from 'react-router-dom';

/** Minimal plumbob mark: a slim rhombus with a lit upper facet. */
export function Plumbob({ size = 14, className = '' }) {
  return (
    <svg className={`plumbob ${className}`} width={size * 0.62} height={size} viewBox="0 0 10 16" aria-hidden="true">
      <path d="M5 0 10 8 5 16 0 8Z" fill="var(--accent)" />
      <path d="M5 0 10 8H0Z" fill="#fff" opacity=".28" />
    </svg>
  );
}

/** Home, from the top: a fresh `replay` stamp remounts the landing (App keys it on this), so the intro plays again
 *  even when you're already on the home page. Modified clicks (new tab etc.) behave like a normal link. */
export default function Logo() {
  const navigate = useNavigate();
  const restart = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    e.preventDefault();
    scrollTo({ top: 0, behavior: 'instant' });
    navigate('/', { state: { replay: Date.now() } });
  };
  return (
    <Link to="/" className="logo" aria-label="Rabiya Ijaz, home" onClick={restart}>
      <Plumbob size={15} />
      <span>Rabiya Ijaz</span>
    </Link>
  );
}
