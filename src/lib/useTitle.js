import { useEffect } from 'react';

export default function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Rabiya Ijaz` : 'Rabiya Ijaz · Product designer';
  }, [title]);
}
