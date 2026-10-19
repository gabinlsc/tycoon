import { useEffect, useRef, useState } from 'react';

/**
 * Valeur qui « roule » vers sa cible en une demi-seconde, comme un compteur de caisse.
 * Sans animation possible (mouvement réduit, pas de `requestAnimationFrame`), elle suit la cible.
 */
export function useCompteur(cible: number, duree = 500): number {
  const [affichee, setAffichee] = useState(cible);
  const depart = useRef(cible);
  const courante = useRef(cible);
  courante.current = affichee;

  useEffect(() => {
    const reduit =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (
      reduit ||
      typeof requestAnimationFrame !== 'function' ||
      Math.abs(cible - courante.current) < 100
    ) {
      depart.current = cible;
      setAffichee(cible);
      return;
    }
    const de = courante.current;
    const debut = performance.now();
    let image = 0;
    const pas = (maintenant: number) => {
      const t = Math.min(1, (maintenant - debut) / duree);
      const eased = 1 - (1 - t) ** 3;
      setAffichee(Math.round(de + (cible - de) * eased));
      if (t < 1) image = requestAnimationFrame(pas);
    };
    image = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(image);
  }, [cible, duree]);

  return affichee;
}
