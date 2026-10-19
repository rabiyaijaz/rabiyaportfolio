/** Line arrow icon that inherits the text colour. `dir` is 'left' or 'right'. */
export default function Arrow({ dir = 'left', className = '' }) {
  return (
    <svg className={`arrow-ico ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false"
      style={dir === 'right' ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}
