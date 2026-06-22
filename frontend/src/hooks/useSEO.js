import { useEffect } from 'react';

export default function useSEO({ title, description, isHome = false }) {
  useEffect(() => {
    if (isHome) {
      document.title = 'Brews & Memories Café — Cafe, Coffee & More in Vijayapura';
    } else if (title) {
      document.title = `${title} | Brews & Memories Café`;
    }

    if (description) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', description);
      }
    }
  }, [title, description, isHome]);
}
