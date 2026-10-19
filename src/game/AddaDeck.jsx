import DECK from '../content/addaDeck.json';
import { Card } from './AccessAdda.jsx';
import './adda.css';

// The wider deck: card designs from scenarios that aren't in the three playable rounds.
const GROUPS = [
  ['places', 'place', 'Places'],
  ['people', 'person', 'People'],
  ['situations', 'situation', 'Situations'],
  ['barriers', 'barrier', 'Barriers'],
];

export default function AddaDeck() {
  return (
    <div className="adda adda--deck">
      <span className="adda__trim" aria-hidden="true" />
      {GROUPS.map(([key, kind, label]) => (
        <section key={key} className="deck__group" aria-label={label}>
          <p className="adda__roundlabel">{label} · {DECK[key].length}</p>
          <ul className="adda__table deck__row">
            {DECK[key].map((c) => (
              <Card key={c.title} kind={kind} label={label.replace(/s$/, '').replace('People', 'Person')} title={c.title} sub={c.sub} body={c.body} img={c.art} icon={c.icon} still />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
