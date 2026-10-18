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
