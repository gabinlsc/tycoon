/** Paramètres du marché. Valeurs de départ à recaler par simulation (voir GDD, sections 5.6 et 5.7). */
export const MARKET = {
  /**
   * Tendance du genre (multiplicateur du potentiel de hit H) selon sa popularité (0-100) :
   * 0 donne `trendMin`, 50 donne 1, 100 donne `trendMax`, interpolation affine entre les deux.
   */
  trendMin: 0.5,
  trendMax: 1.5,
  /** Popularité à laquelle la tendance vaut exactement 1. */
  neutralPopularity: 50,
} as const;

/** Crédibilité de départ du label dans chaque genre (0-100). */
export const START_CREDIBILITY = 0;

/** Tendances de genre (GDD, 5.7). Valeurs de départ à recaler par simulation. */
export const TRENDS = {
  /** Composante lente : amplitude (points) et période (semaines). */
  slowAmplitude: 12,
  slowPeriod: 260,
  /** Composante saisonnière : amplitude (points), période d'un an. */
  seasonAmplitude: 5,
  seasonPeriod: 52,
  /** Bruit à retour à la moyenne : écart-type hebdomadaire et part résorbée chaque semaine. */
  noiseSd: 1.6,
  noiseReversion: 0.08,
  /** Le bruit reste dans cette plage. */
  noiseLimit: 15,
} as const;

/** Sous-genres émergents (GDD, 5.7). */
export const SUBGENRES = {
  /** Probabilité hebdomadaire de naissance d'un sous-genre. */
  birthChance: 0.01,
  /** Sous-genres vivants en même temps. */
  maxAlive: 3,
  /** Durée de vie en semaines (naissance → disparition). */
  lifespan: { min: 104, max: 260 },
  /** Popularité au pic. */
  peak: { min: 70, max: 95 },
  /** Audience du sous-genre, en part de celle du parent. */
  audienceShare: 0.5,
  /** Crédibilité gagnée par le premier label à y signer un artiste. */
  firstSignerCredibility: 30,
  prefixes: ['Néo', 'Hyper', 'Lo-fi', 'Cyber', 'Velours', 'Solaire', 'Nocturne', 'Brut'],
} as const;

/** Veille : études de marché et prévisions bruitées (GDD, 5.7). */
export const INTEL = {
  /** Coût d'une étude de marché. */
  studyCost: 2500 * 100,
  /** Horizons autorisés, en semaines. */
  horizons: [4, 13, 26] as readonly number[],
  /** Écart-type de l'erreur de prévision sans analyste (points), et réduction maximale grâce à un analyste de niveau 100. */
  baseError: 14,
  maxReduction: 0.8,
  /** Prévisions conservées. */
  keep: 12,
} as const;

/**
 * Crédibilité du label dans un genre (0-100) : elle se gagne par les certifications, les festivals,
 * les cérémonies et en étant le premier sur un sous-genre ; elle sert à la fois à la musique du label
 * (plus de chances de hit dans ce genre) et à son pouvoir d'attraction (les artistes du genre signent
 * plus volontiers).
 */
export const CREDIBILITY = {
  /** Bonus de potentiel de hit à crédibilité 100 (proportionnel en dessous). */
  hitBonus: 0.25,
  /** Points de réputation « équivalents » par point de crédibilité, dans l'attrait pour un artiste du genre. */
  prestigeWeight: 0.25,
  /** Crédibilité gagnée dans le genre à chaque niveau de certification obtenu. */
  certificationGain: { or: 3, platine: 5, diamant: 8 },
} as const;
