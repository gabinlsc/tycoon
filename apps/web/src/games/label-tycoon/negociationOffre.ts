import type { Clauses, Reaction } from '@tycoon/label-tycoon';

/** Formulaire de négociation : valeurs en unités lisibles (euros, pourcentages, années). */
export interface Offre {
  avanceEuros: number;
  royaltiesPct: number;
  annees: number;
  exclusivite: boolean;
  part360Pct: number;
  rachatEuros: number;
}

export const OFFRE_DE_DEPART: Offre = {
  avanceEuros: 0,
  royaltiesPct: 35,
  annees: 2,
  exclusivite: false,
  part360Pct: 0,
  rachatEuros: 0,
};

/** Clauses du moteur (centimes et points de base) à partir du formulaire. */
export function clausesDepuis(o: Offre): Clauses {
  return {
    avance: Math.max(0, Math.round(o.avanceEuros * 100)) as Clauses['avance'],
    royaltiesArtisteBps: Math.round(o.royaltiesPct * 100),
    dureeAnnees: Math.round(o.annees),
    exclusivite: o.exclusivite,
    part360Bps: Math.round(o.part360Pct * 100),
    clauseRachat: Math.max(0, Math.round(o.rachatEuros * 100)) as Clauses['clauseRachat'],
  };
}

/** Formulaire correspondant à des clauses du moteur (pour reprendre une contre-proposition). */
export function offreDepuis(c: Clauses): Offre {
  return {
    avanceEuros: c.avance / 100,
    royaltiesPct: c.royaltiesArtisteBps / 100,
    annees: c.dureeAnnees,
    exclusivite: c.exclusivite,
    part360Pct: c.part360Bps / 100,
    rachatEuros: c.clauseRachat / 100,
  };
}

export const NIVEAUX: readonly Reaction[] = ['mecontent', 'hesitant', 'interesse', 'enthousiaste'];

export const LIBELLE_REACTION: Record<Reaction, string> = {
  mecontent: 'Mécontent',
  hesitant: 'Hésitant',
  interesse: 'Intéressé',
  enthousiaste: 'Enthousiaste',
};

export const LIBELLE_VERDICT = {
  accepte: 'Il accepte : tu peux signer.',
  contre: 'Il ne signera pas ainsi, mais une contre-proposition est possible.',
  insulte: 'Offre insultante : il perdrait confiance en toi.',
} as const;
