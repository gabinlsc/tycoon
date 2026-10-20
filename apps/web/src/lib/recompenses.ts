import { useSyncExternalStore } from 'react';
import { type OffreId } from './pass';

/**
 * Récompenses du portail (fictives) : un cadeau par jour sur un cycle de sept jours, un bonus par
 * mois, le tout versé en pièces Tycoon. Tout reste dans ce navigateur, sans serveur ni paiement.
 */
export interface EtatRecompenses {
  pieces: number;
  /** Nombre de jours consécutifs réclamés. */
  serie: number;
  /** Dernier jour réclamé (AAAA-MM-JJ), ou `null`. */
  dernierJour: string | null;
  /** Mois dont le bonus a été réclamé (AAAA-MM). */
  moisReclames: string[];
}

/** Pièces du cycle de sept jours (le septième est le gros lot). */
export const GAINS_QUOTIDIENS: readonly number[] = [10, 15, 20, 25, 30, 40, 100];
const MULTIPLICATEUR: Record<OffreId, number> = { gratuit: 1, pro: 2, legende: 3 };
export const BONUS_MENSUEL: Record<OffreId, number> = { gratuit: 100, pro: 300, legende: 600 };

const CLE = 'tycoon:recompenses';
const VIDE: EtatRecompenses = { pieces: 0, serie: 0, dernierJour: null, moisReclames: [] };

const deux = (n: number) => String(n).padStart(2, '0');
export const cleJour = (d: Date = new Date()): string =>
  `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
export const cleMois = (d: Date = new Date()): string => cleJour(d).slice(0, 7);

/** Veille d'une clé de jour (calculée à midi : sans surprise d'heure d'été). */
export function veille(jour: string): string {
  const [a = 1970, m = 1, j = 1] = jour.split('-').map(Number);
  return cleJour(new Date(a, m - 1, j - 1, 12));
}

/** Position (0 à 6) de la prochaine récompense du cycle. */
export function positionDuCycle(etat: EtatRecompenses, jour: string): number {
  const serie = etat.dernierJour === veille(jour) || etat.dernierJour === jour ? etat.serie : 0;
  return (etat.dernierJour === jour ? serie - 1 : serie) % 7;
}

export const quotidienDisponible = (etat: EtatRecompenses, jour: string): boolean =>
  etat.dernierJour !== jour;

export const gainDuJour = (etat: EtatRecompenses, jour: string, offre: OffreId): number =>
  (GAINS_QUOTIDIENS[positionDuCycle(etat, jour)] ?? 0) * MULTIPLICATEUR[offre];

/** Réclame le cadeau du jour ; `null` s'il l'a déjà été. */
export function reclamerQuotidien(
  etat: EtatRecompenses,
  jour: string,
  offre: OffreId,
): EtatRecompenses | null {
  if (!quotidienDisponible(etat, jour)) return null;
  const gain = gainDuJour(etat, jour, offre);
  const serie = etat.dernierJour === veille(jour) ? etat.serie + 1 : 1;
  return { ...etat, pieces: etat.pieces + gain, serie, dernierJour: jour };
}

export const mensuelDisponible = (etat: EtatRecompenses, mois: string): boolean =>
  !etat.moisReclames.includes(mois);

/** Réclame le bonus du mois ; `null` s'il l'a déjà été. */
export function reclamerMensuel(
  etat: EtatRecompenses,
  mois: string,
  offre: OffreId,
): EtatRecompenses | null {
  if (!mensuelDisponible(etat, mois)) return null;
  return {
    ...etat,
    pieces: etat.pieces + BONUS_MENSUEL[offre],
    moisReclames: [...etat.moisReclames.slice(-11), mois],
  };
}

/** Dépense des pièces ; `null` si le solde ne suffit pas. */
export function depenser(etat: EtatRecompenses, prix: number): EtatRecompenses | null {
  return prix >= 0 && etat.pieces >= prix ? { ...etat, pieces: etat.pieces - prix } : null;
}

function lire(): EtatRecompenses {
  try {
    const brut = window.localStorage.getItem(CLE);
    if (!brut) return VIDE;
    const o = JSON.parse(brut) as Partial<EtatRecompenses>;
    return {
      pieces: Math.max(0, Math.floor(Number(o.pieces) || 0)),
      serie: Math.max(0, Math.floor(Number(o.serie) || 0)),
      dernierJour: typeof o.dernierJour === 'string' ? o.dernierJour : null,
      moisReclames: Array.isArray(o.moisReclames) ? o.moisReclames.map(String) : [],
    };
  } catch {
    return VIDE;
  }
}

let etat = lire();
const abonnes = new Set<() => void>();

function ecrire(suivant: EtatRecompenses): void {
  etat = suivant;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(etat));
  } catch {
    /* stockage indisponible : valable pour la session */
  }
  abonnes.forEach((cb) => cb());
}

/** Applique une transition ; renvoie vrai si elle a eu lieu. */
export function appliquer(transition: (e: EtatRecompenses) => EtatRecompenses | null): boolean {
  const suivant = transition(etat);
  if (!suivant) return false;
  ecrire(suivant);
  return true;
}

/** Remise à zéro (tests). */
export const reinitialiserRecompenses = (): void => ecrire(VIDE);

export function useRecompenses(): EtatRecompenses {
  return useSyncExternalStore(
    (cb) => {
      abonnes.add(cb);
      return () => abonnes.delete(cb);
    },
    () => etat,
  );
}
