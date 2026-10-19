import { useEffect, useState } from 'react';

const REQUETE = '(max-width: 1023px)';

/** Vrai sur téléphone et tablette en portrait : la navigation passe en barre d'onglets. */
export function useEcranEtroit(): boolean {
  const lire = (): boolean =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(REQUETE).matches
      : false;
  const [etroit, setEtroit] = useState(lire);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(REQUETE);
    const surChange = () => setEtroit(mq.matches);
    mq.addEventListener('change', surChange);
    return () => mq.removeEventListener('change', surChange);
  }, []);
  return etroit;
}
