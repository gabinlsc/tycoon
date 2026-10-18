import { useEffect } from 'react';
import { ecranDeTouche, type EcranId } from './ecrans';

/** Raccourcis clavier de base : les chiffres changent d'écran, hors champs de saisie. */
export function useRaccourcis(onEcran: (id: EcranId) => void, actif = true): void {
  useEffect(() => {
    if (!actif) return;
    const handler = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const cible = event.target as HTMLElement | null;
      if (
        cible &&
        (cible.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(cible.tagName))
      )
        return;
      const ecran = ecranDeTouche(event.key);
      if (ecran) {
        event.preventDefault();
        onEcran(ecran);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onEcran, actif]);
}
