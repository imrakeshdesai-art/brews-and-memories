import { useEffect } from 'react';

export default function useSEO({ title, description, isHome = false }) {
  useEffect(() => {
    if (isHome) {
      document.title = 'The Moras Cafe — Coffee, Food & More in Vijayapura';
    } else if (title) {
      document.title = `${title} | The Moras Cafe`;
    }

    if (description) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', description);
      }
    }
  }, [title, description, isHome]);
}
