import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Gère le défilement à chaque navigation : vers l'ancre si l'URL en contient une,
 * sinon en haut de page. Sans cela, une nouvelle page s'ouvrirait à la position de la précédente.
 */
export function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Laisse React monter la page avant de chercher l'ancre
      const id = decodeURIComponent(hash.slice(1));
      const frame = requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView();
      });
      return () => cancelAnimationFrame(frame);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
