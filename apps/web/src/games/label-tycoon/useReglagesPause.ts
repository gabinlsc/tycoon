import { useCallback, useEffect, useState } from 'react';
import {
  CLE_REGLAGES,
  REGLAGES_PAR_DEFAUT,
  type CategoriePause,
  type ReglagesPause,
  lireReglages,
} from './temps';

const EVENEMENT = 'tycoon:label:reglages';

function lireStockage(): string | null {
  try {
    return window.localStorage.getItem(CLE_REGLAGES);
  } catch {
    return null;
  }
}

function ecrire(reglages: ReglagesPause): void {
  try {
    window.localStorage.setItem(CLE_REGLAGES, JSON.stringify(reglages));
  } catch {
    /* stockage indisponible : le réglage vaut pour la session */
  }
}

/**
 * Réglages d'auto-pause mémorisés. Chaque composant qui les utilise reste synchronisé avec les
 * autres (barre de temps et écran Paramètres) grâce à un événement de fenêtre.
 */
export function useReglagesPause() {
  const [reglages, setReglages] = useState<ReglagesPause>(() => lireReglages(lireStockage()));

  useEffect(() => {
    const relire = () => setReglages(lireReglages(lireStockage()));
    window.addEventListener(EVENEMENT, relire);
    return () => window.removeEventListener(EVENEMENT, relire);
  }, []);

  const changer = useCallback((suivant: ReglagesPause) => {
    setReglages(suivant);
    ecrire(suivant);
    window.dispatchEvent(new Event(EVENEMENT));
  }, []);

  const basculer = useCallback(
    (categorie: CategoriePause, actif: boolean) =>
      changer({ ...lireReglages(lireStockage()), [categorie]: actif }),
    [changer],
  );

  const reinitialiser = useCallback(() => changer(REGLAGES_PAR_DEFAUT), [changer]);

  return { reglages, basculer, reinitialiser };
}
