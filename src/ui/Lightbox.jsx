import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Arrow from './Arrow.jsx';

/** Full-size screen viewer: arrows / swipe to move, Esc or backdrop to close. */
export default function Lightbox({ images, index, onIndex, onClose }) {
  const ref = useRef(null);
  const img = images[index];
  const go = (d) => onIndex((index + d + images.length) % images.length);

  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; prev?.focus?.(); };
  }, []);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  let touchX = null;
  // Rendered on <body>: inside the page, an ancestor's transform would turn position: fixed into "fixed to the page"
  // and the viewer would open far off-screen while the scroll stays locked
  return createPortal(
    <div
      className="lightbox" role="dialog" aria-modal="true" aria-label={img.alt} tabIndex={-1} ref={ref}
      // A click anywhere closes it, except on the image itself or the bar's buttons (the × still works too)
      onClick={(e) => { if (!e.target.closest('img, button')) onClose(); }}
      onTouchStart={(e) => { touchX = e.touches[0].clientX; }}
      onTouchEnd={(e) => { if (touchX === null) return; const d = e.changedTouches[0].clientX - touchX; if (Math.abs(d) > 50) go(d < 0 ? 1 : -1); touchX = null; }}
    >
      <figure className="lightbox__figure">
        <img src={img.src} alt={img.alt} />
        {img.caption && <figcaption>{img.caption}</figcaption>}
      </figure>
      <div className="lightbox__bar">
        <span>{index + 1} / {images.length}</span>
        <div>
          <button onClick={() => go(-1)} aria-label="Previous screen"><Arrow /></button>
          <button onClick={() => go(1)} aria-label="Next screen"><Arrow dir="right" /></button>
          <button onClick={onClose} aria-label="Close">×</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
