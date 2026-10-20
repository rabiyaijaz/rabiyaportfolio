// A map pin's face: the project's logo (or a house glyph in its roof colour), the name,
// and the project type that slides out on hover. Featured projects get a small gold star.
// Shared by the landing map and the Work banner.
const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;
export const pinStyle = (lot, i = 0) => ({ '--c': hex(lot.roof ?? 0x1f8a4c), '--d': `${i * 50}ms` });
export const pinClass = (lot) => `${lot.featured ? ' pin--featured' : ''}${lot.logo ? ' pin--logo' : ''}`;

export function PinFace({ p, lot }) {
  return (
    <>
      <span className="pin__house" aria-hidden="true">
        {lot.logo
          ? <img src={`/img/logos/${lot.logo}.webp`} alt="" />
          : <svg viewBox="0 0 16 16"><path d="M2.5 7.4 8 2.6l5.5 4.8V13a.8.8 0 0 1-.8.8H9.6V10H6.4v3.8H3.3a.8.8 0 0 1-.8-.8Z" fill="currentColor" /></svg>}
        {lot.featured && (
          <span className="pin__star"><svg viewBox="0 0 16 16"><path d="m8 1.4 2 4.3 4.6.5-3.4 3.2.9 4.6L8 11.7 3.9 14l.9-4.6L1.4 6.2 6 5.7Z" fill="currentColor" /></svg></span>
        )}
      </span>
      <span className="pin__text">
        <strong>{lot.label || p.name}</strong>
        <span>{p.wip ? '🚧 Work in progress' : lot.featured ? `Featured · ${p.type}` : p.type}</span>
      </span>
    </>
  );
}
