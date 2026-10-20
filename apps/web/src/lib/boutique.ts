import { useSyncExternalStore } from 'react';
import { appliquer, depenser } from './recompenses';

/**
 * Boutiques de pièces (fictives) : chaque jeu a la sienne, avec ses propres objets. Les achats sont
 * rangés par jeu dans ce navigateur ; les pièces viennent du portefeuille du portail.
 */
type Achats = Record<string, string[]>;

const CLE = 'tycoon:boutique';

function lire(): Achats {
  try {
    const brut = window.localStorage.getItem(CLE);
    const o = brut ? (JSON.parse(brut) as Record<string, unknown>) : {};
    return Object.fromEntries(
      Object.entries(o).map(([jeu, ids]) => [jeu, Array.isArray(ids) ? ids.map(String) : []]),
    );
  } catch {
    return {};
  }
}

let achats = lire();
const abonnes = new Set<() => void>();
const AUCUN: readonly string[] = [];

export const achatsDe = (jeu: string): readonly string[] => achats[jeu] ?? AUCUN;

/** Achète un objet : débite le portefeuille puis le range. Faux s'il est déjà possédé ou trop cher. */
export function acheter(jeu: string, objet: string, prix: number): boolean {
  if (achatsDe(jeu).includes(objet)) return false;
  if (!appliquer((e) => depenser(e, prix))) return false;
  achats = { ...achats, [jeu]: [...achatsDe(jeu), objet] };
  try {
    window.localStorage.setItem(CLE, JSON.stringify(achats));
  } catch {
    /* stockage indisponible : valable pour la session */
  }
  abonnes.forEach((cb) => cb());
  return true;
}

/** Remise à zéro (tests). */
export function reinitialiserAchats(): void {
  achats = {};
  abonnes.forEach((cb) => cb());
}

export function useAchats(jeu: string): readonly string[] {
  return useSyncExternalStore(
    (cb) => {
      abonnes.add(cb);
      return () => abonnes.delete(cb);
    },
    () => achatsDe(jeu),
  );
}
