/**
 * The site-wide section opener (Direction v4): a small label, a light serif headline
 * with one italic phrase, and an optional lede. `as` sets the heading level.
 */
export default function StoryHeader({ label, title, lede, id, as: H = 'h2', className = '', children }) {
  return (
    <header className={`story-head ${className}`}>
      <p className="story-kicker">{label}</p>
      <H id={id} className="story-title">{title}</H>
      {lede && <p className="story-lede">{lede}</p>}
      {children}
    </header>
  );
}
