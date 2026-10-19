/** Line arrow icon that inherits the text colour and size. `dir`: 'left' (back), 'right' (forward),
 *  'out' (opens somewhere else, ↗). Inside a link or button it nudges in its direction on hover. */
const PATHS = {
  left: 'M19 12H5M11 6l-6 6 6 6',
  right: 'M5 12h14M13 6l6 6-6 6',
  out: 'M7 17 17 7M9 7h8v8',
};

export default function Arrow({ dir = 'left', className = '' }) {
  return (
    <svg className={`arrow-ico arrow-ico--${dir} ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={PATHS[dir]} />
    </svg>
  );
}
