import type { GenreFamily } from '../content/genres';

/**
 * Génération des artistes. Valeurs de départ à recaler par simulation (GDD, section 5.2).
 * Toutes les compétences sont des entiers de 0 à 100.
 */

export type TalentLevel = 'amateur' | 'espoir' | 'confirme' | 'star';

export interface LevelProfile {
  /** Moyenne et écart-type des compétences visibles (plume, flow ou voix, charisme, scène). */
  skillMean: number;
  skillSd: number;
  ageMin: number;
  ageMax: number;
  /** Hype de départ. */
  hype: number;
  /** Fourchette de fans (tirage log-uniforme : beaucoup de petits, peu de gros). */
  fansMin: number;
  fansMax: number;
  /** Marge moyenne du potentiel au-dessus du niveau actuel. */
  potentialMargin: number;
}

export const LEVELS: Readonly<Record<TalentLevel, LevelProfile>> = {
  amateur: {
    skillMean: 34,
    skillSd: 10,
    ageMin: 16,
    ageMax: 26,
    hype: 2,
    fansMin: 80,
    fansMax: 3_000,
    potentialMargin: 22,
  },
  espoir: {
    skillMean: 48,
    skillSd: 9,
    ageMin: 18,
    ageMax: 28,
    hype: 8,
    fansMin: 2_000,
    fansMax: 40_000,
    potentialMargin: 16,
  },
  confirme: {
    skillMean: 62,
    skillSd: 8,
    ageMin: 21,
    ageMax: 36,
    hype: 25,
    fansMin: 40_000,
    fansMax: 500_000,
    potentialMargin: 9,
  },
  star: {
    skillMean: 77,
    skillSd: 6,
    ageMin: 24,
    ageMax: 42,
    hype: 55,
    fansMin: 800_000,
    fansMax: 9_000_000,
    potentialMargin: 5,
  },
};

/** Répartition des niveaux dans la population de talents repérables. */
export const LEVEL_WEIGHTS: Readonly<Record<TalentLevel, number>> = {
  amateur: 55,
  espoir: 30,
  confirme: 12,
  star: 3,
};

/** Âge moyen du pic de carrière selon la famille de genre, et sa dispersion. */
export const PEAK_AGE: Readonly<Record<GenreFamily, number>> = {
  urbain: 27,
  pop: 30,
  afro: 28,
  latino: 29,
  electro: 29,
};
export const PEAK_AGE_SD = 3.5;
export const PEAK_AGE_BOUNDS = { min: 21, max: 40 } as const;

/** Attributs cachés : moyenne et dispersion avant effet des traits. */
export const HIDDEN = {
  ethique: { mean: 52, sd: 18 },
  ego: { mean: 45, sd: 18 },
  loyaute: { mean: 50, sd: 18 },
  polyvalence: { mean: 45, sd: 20 },
} as const;

/** Part de l'ego qui grimpe avec la notoriété de départ (en points par tranche de 10 de notoriété). */
export const EGO_PER_NOTORIETY_10 = 2.5;

/** Valeurs de départ des attributs dynamiques. */
export const DYNAMIC_START = {
  moral: 60,
  fatigue: 8,
  affinite: 0,
} as const;

/** Crédibilité de rue : moyenne par famille (les musiques urbaines en ont plus). */
export const STREET_CRED_MEAN: Readonly<Record<GenreFamily, number>> = {
  urbain: 55,
  afro: 42,
  latino: 40,
  pop: 25,
  electro: 28,
};
export const STREET_CRED_SD = 16;

/** Notoriété : échelle logarithmique de la fanbase, 0 pour aucun fan, 100 pour `notorietyMaxFans`. */
export const NOTORIETY_MAX_FANS = 20_000_000;

/** Nombre de traits par artiste et probabilités. */
export const TRAIT_COUNT_WEIGHTS: Readonly<Record<1 | 2 | 3, number>> = { 1: 40, 2: 45, 3: 15 };

/** Probabilité d'avoir un genre secondaire (puis un deuxième), augmentée par la polyvalence. */
export const SECONDARY_GENRE = { base: 0.35, perPolyvalence: 0.004, second: 0.25 } as const;
