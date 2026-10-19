import { useEffect, useRef, useState } from 'react';

/** A live, playable piece of the real design (the Tamasha parda) in place of a hero screenshot.
 *  The frame reports its own height, so it never shows a scrollbar. */
export default function StageEmbed({ src, title, tint }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(640);
  useEffect(() => {
    const onMsg = (e) => {
      if (e.source !== ref.current?.contentWindow || typeof e.data?.tamashaStage !== 'number') return;
      setHeight(Math.ceil(e.data.tamashaStage));
    };
    addEventListener('message', onMsg);
    return () => removeEventListener('message', onMsg);
  }, []);
  return (
    <figure className="case__hero case__hero--embed" style={{ '--tint': tint }}>
      <iframe ref={ref} src={src} title={title} style={{ height }} loading="lazy" />
    </figure>
  );
}
