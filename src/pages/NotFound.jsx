import { Link } from 'react-router-dom';
import useTitle from '../lib/useTitle.js';

export default function NotFound() {
  useTitle('Not found');
  return (
    <main id="main" className="page">
      <p className="eyebrow">404</p>
      <h1 className="display">The carpool <em>couldn’t find that address.</em></h1>
      <p><Link to="/">Back to the street</Link> or <Link to="/work">see the work</Link>.</p>
    </main>
  );
}
