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

/** Relations entre artistes et mentorat (GDD, 5.4 bis). */
export const RELATIONS = {
  /** Dérive hebdomadaire de la relation : même genre (rivalité) ou genres différents (amitié). */
  sameGenreDrift: -0.3,
  otherGenreDrift: 0.1,
  /** Un ego élevé amplifie la rivalité (facteur = 1 + ego/100). */
  /** Seuils de bascule en rivalité ou en amitié. */
  rivalryBelow: -40,
  friendshipAbove: 40,
  /** Moral gagné ou perdu par semaine selon la relation. */
  friendMoral: 0.3,
  rivalMoral: -0.5,
  /** Mentorat : bonus hebdomadaire de compétences du protégé, loyauté du mentor, durée maximale. */
  mentorSkillBonus: 0.06,
  mentorLoyaltyBonus: 0.05,
  mentorWeeks: 104,
  maxMentorships: 3,
} as const;
