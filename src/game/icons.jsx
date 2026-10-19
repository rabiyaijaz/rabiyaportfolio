// Card illustrations for cards without artwork.
// Situations are small duotone scenes (tinted fills + strokes); barriers and people are simpler pictograms.
// Everything inherits the card colour through currentColor.
const S = ({ children }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
// Duotone scene on a wider canvas
const D = ({ children }) => (
  <svg viewBox="0 0 120 90" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const tint = { fill: 'currentColor', fillOpacity: 0.16 };
const solid = { fill: 'currentColor', stroke: 'none' };

export const ICONS = {
  // ---------- situations (duotone scenes) ----------
  // Exam in 8 minutes: wall clock above an exam sheet
  exam: (
    <D>
      <circle cx="40" cy="38" r="22" {...tint} />
      <path d="M40 24v14l9 6" />
      <path d="M40 12v4M40 60v4M14 38h4M62 38h4" />
      <rect x="66" y="30" width="34" height="44" rx="3" {...tint} />
      <path d="M72 40h22M72 48h22M72 56h14" />
      <path d="M90 66l12-12 4 4-12 12h-4z" {...solid} />
      <circle cx="40" cy="38" r="2.5" {...solid} />
    </D>
  ),
  // Rush-hour payment: hand holding phone with QR, coins, motion lines
  rushPay: (
    <D>
      <rect x="44" y="10" width="32" height="56" rx="6" {...tint} />
      <rect x="51" y="20" width="18" height="18" rx="1" />
      <path d="M55 24h4v4h-4zM61 30h4v4h-4zM55 32h2M63 24h2" />
      <path d="M52 46h16M52 52h10" />
      <path d="M30 70c4-6 10-8 16-6l10 4c3 1 2 6-2 5l-6-1" />
      <path d="M30 70l-8 10M84 26h14M86 36h18M84 46h12" opacity=".7" />
      <circle cx="96" cy="66" r="8" {...tint} /><path d="M96 62v8" />
    </D>
  ),
  // Three identical buses at dusk
  buses: (
    <D>
      <path d="M96 18a8 8 0 11-8-10 6 6 0 108 10z" {...tint} />
      {[8, 44, 80].map((x) => (
        <g key={x}>
          <rect x={x} y="34" width="30" height="36" rx="5" {...tint} />
          <path d={`M${x} 50h30M${x + 5} 40h20M${x + 6} 70v6M${x + 24} 70v6`} />
          <circle cx={x + 8} cy="62" r="2.5" {...solid} /><circle cx={x + 22} cy="62" r="2.5" {...solid} />
        </g>
      ))}
      <path d="M4 82h112" />
    </D>
  ),
  // Finding a hall on a symmetrical colonial campus: domed facade, map pin, dashed path
  hall: (
    <D>
      <path d="M20 74V44h80v30" {...tint} />
      <path d="M14 44h92l-8-10H22z" />
      <path d="M48 34c0-10 24-10 24 0" {...tint} />
      <path d="M60 22v2" />
      {[28, 40, 52, 68, 80, 92].map((x) => <path key={x} d={`M${x} 50v24`} />)}
      <path d="M56 74V60h8v14" />
      <path d="M8 84c20-6 40 4 52-10" strokeDasharray="3 5" />
      <path d="M100 8c-6 0-10 4-10 10 0 7 10 16 10 16s10-9 10-16c0-6-4-10-10-10z" {...solid} />
      <circle cx="100" cy="18" r="3.5" fill="#fff" stroke="none" />
    </D>
  ),
  // Boarding at a BRT platform: bus doors open, platform edge, cane user
  boarding: (
    <D>
      <rect x="44" y="14" width="68" height="56" rx="6" {...tint} />
      <path d="M44 30h68M52 22h52" />
      <rect x="58" y="36" width="20" height="34" {...tint} />
      <path d="M68 36v34" />
      <path d="M4 74h112" />
      <path d="M4 80h112" strokeDasharray="4 4" />
      <circle cx="26" cy="30" r="5" {...solid} />
      <path d="M26 36v20M26 56l-6 18M26 56l6 18M26 42l10 8" />
      <path d="M36 50l10 24" strokeWidth="2" />
      <path d="M86 46h18M86 54h12" opacity=".6" />
    </D>
  ),
  // Ordering kahwa: cup with steam, speech bubble with a signing hand
  tea: (
    <D>
      <path d="M18 46h44v8c0 12-10 20-22 20s-22-8-22-20z" {...tint} />
      <path d="M62 52h6a6 6 0 010 12h-8" />
      <path d="M12 80h56" />
      <path d="M30 40c-4-6 4-8 0-14M42 40c-4-6 4-8 0-14" opacity=".7" />
      <path d="M72 8h40v30H90l-10 10V38h-8z" {...tint} />
      <path d="M86 32V20l-3-4a2 2 0 013-2l3 4v-6a2 2 0 014 0v8-2a2 2 0 014 0v10" />
    </D>
  ),
  // Buying a token at a ticket machine with cash
  ticketMachine: (
    <D>
      <rect x="54" y="6" width="44" height="76" rx="5" {...tint} />
      <rect x="62" y="14" width="28" height="18" rx="2" />
      <path d="M66 22h12" />
      <path d="M62 40h28M62 48h28" />
      <rect x="70" y="58" width="12" height="4" rx="2" {...solid} />
      <path d="M14 56h30l-2 14H16z" {...tint} />
      <path d="M22 56v-6h14v6" />
      <path d="M44 62h10" strokeDasharray="2 3" />
      <circle cx="104" cy="16" r="0" />
    </D>
  ),

  // ---------- barriers (pictograms) ----------
  stairs: <S><path d="M8 54h12V44h12V34h12V24h12" /><path d="M8 54V24M14 18l6-6M20 18h-6v6" /></S>,
  fadingCheck: <S><rect x="18" y="6" width="28" height="52" rx="5" /><path d="M28 32l4 4 7-8" /><path d="M26 50h12" /><path d="M50 22l6-4M50 32h7M50 42l6 4" opacity=".55" /></S>,
  colorBands: <S><rect x="8" y="14" width="48" height="12" rx="3" /><rect x="8" y="34" width="48" height="12" rx="3" /><path d="M14 20h12M38 40h12" strokeDasharray="2 4" /></S>,
  eye: <S><path d="M6 32s10-16 26-16 26 16 26 16-10 16-26 16S6 32 6 32z" /><circle cx="32" cy="32" r="7" /><path d="M10 54L54 10" opacity=".6" /></S>,
  ear: <S><path d="M22 46c0 6 4 10 9 10s8-3 8-8c0-6 9-9 9-20a16 16 0 00-32 0" /><path d="M28 28a6 6 0 0112 0c0 4-4 6-4 9" /><path d="M8 52L56 12" opacity=".6" /></S>,
  speech: <S><path d="M10 14h44v26H30l-12 10V40h-8z" /><path d="M20 24h24M20 32h14" /></S>,
  clock: <S><circle cx="32" cy="34" r="20" /><path d="M32 22v12l8 5M26 8h12M32 8v6" /></S>,

  // ---------- places & people without artwork (placeholders until portraits arrive) ----------
  bus: <S><rect x="10" y="10" width="44" height="38" rx="8" /><path d="M10 30h44M20 48v6M44 48v6M16 18h32" /><circle cx="20" cy="40" r="3" /><circle cx="44" cy="40" r="3" /></S>,
  elder: <S><circle cx="32" cy="20" r="9" /><path d="M22 14c3-5 17-5 20 0" /><path d="M16 56c0-12 7-19 16-19s16 7 16 19" /><rect x="42" y="40" width="9" height="14" rx="2" /></S>,
  sign: <S><path d="M24 56V30l-6-8a3 3 0 015-3l5 7V10a3 3 0 016 0v14-4a3 3 0 016 0v6-2a3 3 0 016 0v14c0 10-6 18-14 18h-2" /></S>,
  wheel: <S><circle cx="30" cy="12" r="5" /><path d="M30 18v14h14l6 14" /><path d="M30 26h10" /><circle cx="28" cy="44" r="12" /></S>,
};

// Wide scenes get a different frame ratio on the card
export const WIDE = new Set(['exam', 'rushPay', 'buses', 'hall', 'boarding', 'tea', 'ticketMachine']);
