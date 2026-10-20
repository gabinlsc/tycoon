import { useSyncExternalStore } from 'react';
import { achatsDe } from './boutique';

/**
 * Pass Tycoon **fictif** : un abonnement pour les six jeux du portail. Aucune donnée bancaire,
 * aucun paiement, aucun serveur : le choix est gardé dans ce navigateur pour montrer ce que serait
 * l'offre ; il se branchera sur un vrai paiement le jour où l'entité juridique existera.
 */
export type OffreId = 'gratuit' | 'pro' | 'legende';
export type ThemeMonde = 'saison' | 'aube' | 'neon';
export type CadreCarte = 'classique' | 'chrome' | 'diamant';

export interface Offre {
  id: OffreId;
  nom: string;
  /** Prix mensuel affiché, en centimes (démonstration). */
  prixMensuel: number;
  accroche: string;
  avantages: readonly string[];
  themes: readonly ThemeMonde[];
  cadres: readonly CadreCarte[];
}

export const OFFRES: readonly Offre[] = [
  {
    id: 'gratuit',
    nom: 'Gratuit',
    prixMensuel: 0,
    accroche: 'Tout le jeu, tel quel.',
    avantages: [
      'Toutes les règles et tous les modes',
      'Récompense quotidienne',
      'Bonus mensuel de 100 pièces',
    ],
    themes: ['saison'],
    cadres: ['classique'],
  },
  {
    id: 'pro',
    nom: 'Pro',
    prixMensuel: 499,
    accroche: 'Un label qui a de la gueule.',
    avantages: [
      'Récompenses quotidiennes ×2',
      'Bonus mensuel de 300 pièces',
      'Thèmes du monde et cadre Chrome',
    ],
    themes: ['saison', 'aube', 'neon'],
    cadres: ['classique', 'chrome'],
  },
  {
    id: 'legende',
    nom: 'Légende',
    prixMensuel: 999,
    accroche: 'Pour ceux qui veulent le trophée.',
    avantages: [
      'Récompenses quotidiennes ×3',
      'Bonus mensuel de 600 pièces',
      'Cadre Diamant animé, badge doré',
      'Priorité sur les nouveautés',
    ],
    themes: ['saison', 'aube', 'neon'],
    cadres: ['classique', 'chrome', 'diamant'],
  },
];

export const offreDe = (id: OffreId): Offre => {
  const [gratuit] = OFFRES;
  return OFFRES.find((o) => o.id === id) ?? (gratuit as Offre);
};

export interface EtatAbonnement {
  offre: OffreId;
  theme: ThemeMonde;
  cadre: CadreCarte;
}

const CLE = 'tycoon:pass';
/** Ancienne clé (abonnement propre à Label Tycoon) : lue une fois pour ne rien perdre. */
const ANCIENNE_CLE = 'tycoon:label:abonnement';
const PAR_DEFAUT: EtatAbonnement = { offre: 'gratuit', theme: 'saison', cadre: 'classique' };

/** Jeu dont la boutique peut débloquer des thèmes et des cadres. */
export const JEU_BOUTIQUE = 'label-tycoon';

/** Ce que l'offre autorise, plus ce qui a été acheté en pièces. */
export function droitsDe(offre: OffreId, achats: readonly string[] = achatsDe(JEU_BOUTIQUE)) {
  const base = offreDe(offre);
  return {
    themes: [
      ...base.themes,
      ...achats.filter((a) => a.startsWith('theme:')).map((a) => a.slice(6)),
    ] as ThemeMonde[],
    cadres: [
      ...base.cadres,
      ...achats.filter((a) => a.startsWith('cadre:')).map((a) => a.slice(6)),
    ] as CadreCarte[],
  };
}

/** Remet un état lu du navigateur dans ce que l'offre et les achats autorisent. */
export function normaliser(brut: Partial<EtatAbonnement>): EtatAbonnement {
  const offre = OFFRES.some((o) => o.id === brut.offre) ? (brut.offre as OffreId) : 'gratuit';
  const droits = droitsDe(offre);
  return {
    offre,
    theme: droits.themes.includes(brut.theme as ThemeMonde) ? (brut.theme as ThemeMonde) : 'saison',
    cadre: droits.cadres.includes(brut.cadre as CadreCarte)
      ? (brut.cadre as CadreCarte)
      : 'classique',
  };
}

function lire(): EtatAbonnement {
  try {
    const brut = window.localStorage.getItem(CLE) ?? window.localStorage.getItem(ANCIENNE_CLE);
    return brut ? normaliser(JSON.parse(brut) as Partial<EtatAbonnement>) : PAR_DEFAUT;
  } catch {
    return PAR_DEFAUT;
  }
}

let etat = lire();
const abonnes = new Set<() => void>();

export function definirAbonnement(suivant: Partial<EtatAbonnement>): void {
  etat = normaliser({ ...etat, ...suivant });
  try {
    window.localStorage.setItem(CLE, JSON.stringify(etat));
  } catch {
    /* stockage indisponible : le choix vaut pour la session */
  }
  abonnes.forEach((cb) => cb());
}

/** Choisit une offre ; thème et cadre repartent sur ce qui est permis. */
export const choisirOffre = (offre: OffreId): void => definirAbonnement({ offre });

export function useAbonnement(): EtatAbonnement {
  return useSyncExternalStore(
    (cb) => {
      abonnes.add(cb);
      return () => abonnes.delete(cb);
    },
    () => etat,
  );
}

/** Prix mensuel lisible (« 4,99 € »), « 0 € » pour le gratuit. */
export const prixTexte = (centimes: number): string =>
  `${(centimes / 100).toLocaleString('fr-FR', { minimumFractionDigits: centimes % 100 ? 2 : 0 })} €`;
