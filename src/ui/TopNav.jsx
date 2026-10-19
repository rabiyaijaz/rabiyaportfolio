import { NavLink } from 'react-router-dom';
import Logo from './Logo.jsx';

export const NAV = [
  { to: '/work', label: 'Work' },
  { to: '/about', label: 'About' },
  { to: '/resume', label: 'Resume' },
  { to: '/contact', label: 'Contact' },
];

/** `floating`: over the landing's full-bleed scenes, as a frosted bar. */
export default function TopNav({ floating = false }) {
  return (
    <header className={`topnav${floating ? ' topnav--float' : ''}`}>
      <Logo />
      <nav aria-label="Main">
        <ul>
          {NAV.map((n) => <li key={n.to}><NavLink to={n.to}>{n.label}</NavLink></li>)}
        </ul>
      </nav>
    </header>
  );
}
