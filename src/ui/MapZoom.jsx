import { useEffect, useState } from 'react';
import { sfx } from '../lib/audio.js';
import { MAP_ZOOM_MAX } from '../world/neighbourhood.js';

/**
 * Zoom controls for the neighbourhood. On the map they zoom and reset the map; on the street they
 * move the camera closer to or further from the Sim and reset the orbit. `street` only changes the hint.
 */
export default function MapZoom({ scene, hidden = false, street = false }) {
  const [zoom, setZoom] = useState(1);
  useEffect(() => scene?.on('zoom', setZoom), [scene]);
  const act = (fn) => () => { if (!scene) return; fn(scene); sfx('whoosh'); };
  const min = street ? 0.36 : 0.41, max = street ? 1.39 : MAP_ZOOM_MAX - 0.01;
  return (
    <div className={`map-zoom${hidden ? ' is-hidden' : ''}`} role="group" aria-label={street ? 'Camera' : 'Map zoom'} aria-hidden={hidden || undefined}>
      <button onClick={act((s) => s.zoomBy(0.75))} disabled={zoom <= min} aria-label="Zoom in" tabIndex={hidden ? -1 : 0}>+</button>
      <button onClick={act((s) => s.zoomBy(1 / 0.75))} disabled={zoom >= max} aria-label="Zoom out" tabIndex={hidden ? -1 : 0}>−</button>
      <button onClick={act((s) => s.resetView())} aria-label="Reset the view" tabIndex={hidden ? -1 : 0} className="map-zoom__reset">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.5-3.6M3 2.5V5h2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <span className="map-zoom__hint">{street ? 'Drag to look around · pinch or Ctrl + scroll to zoom' : 'Pinch or Ctrl + scroll · drag to move'}</span>
    </div>
  );
}
