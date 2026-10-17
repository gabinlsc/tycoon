/**
 * Évolution hebdomadaire des attributs dynamiques d'un artiste (GDD, 5.2 et 5.6).
 * Valeurs de départ à recaler par simulation.
 */
export const DYNAMICS = {
  /** La hype baisse d'environ 5 % par semaine. */
  hypeDecay: 0.05,
  /** Le moral dérive vers cette valeur par défaut, d'une fraction par semaine. */
  moralTarget: 60,
  moralDrift: 0.06,
  /** Fatigue récupérée par semaine sans travail intensif. */
  fatigueRecovery: 3,
  /** Au-dessus de ce seuil de fatigue, le moral baisse chaque semaine. */
  fatigueMoralThreshold: 70,
  fatigueMoralPenalty: 1.5,
  /** Plafond de fatigue au-delà duquel le risque de burnout devient maximal. */
  fatigueMax: 100,
} as const;
