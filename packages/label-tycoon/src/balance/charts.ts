/** Classements hebdomadaires (GDD, 5.6). Valeurs de départ à recaler par simulation. */
export const CHARTS = {
  size: 50,
  /** Streams du numéro 1 du bruit de marché, par classement. */
  noiseTop: { singles: 400_000, albums: 600_000 },
  /** Chaque rang du bruit vaut ce ratio du rang précédent. */
  noiseDecay: 0.93,
  /** Écart-type relatif du bruit hebdomadaire. */
  noiseSd: 0.1,
  /** Types de sortie qui comptent pour le classement des singles ; les autres vont aux albums. */
  singleTypes: ['single'] as readonly string[],
} as const;

/** Certifications (GDD, 5.6). */
export const CERTIFICATIONS = {
  /** Streams qui équivalent à une vente. */
  streamsPerSale: 150,
  /** Seuils en ventes équivalentes, pour un single ; les albums valent `albumFactor` fois plus. */
  thresholds: { or: 40_000, platine: 80_000, diamant: 400_000 },
  albumFactor: 2,
  /** Facteur d'ère sur les seuils (1 = ère actuelle ; un disque d'or est plus facile en streaming de masse). */
  eraFactor: 1,
  /** Réputation gagnée à chaque niveau obtenu. */
  reputationGain: { or: 1, platine: 3, diamant: 8 },
} as const;

/** Remise de prix annuelle (GDD, 5.13 : cérémonies). */
export const CEREMONY = {
  /** Semaine de l'année des nominations et de la remise. */
  nominationWeek: 36,
  awardWeek: 40,
  /** Nombre de nommés par catégorie, dont ceux issus du bruit de marché. */
  nominees: 5,
  noiseNominees: 4,
  /** Score des nommés fictifs (tirage uniforme). */
  noiseScore: { min: 35, max: 80 },
  /** Le tirage du gagnant pondère par score à cette puissance (plus haut = plus déterministe). */
  winnerPower: 3,
  /** Plafond du bonus de streams dans le score d'une sortie. */
  streamsBonusCap: 30,
  /** Récompenses pour un prix remporté. */
  winnerHype: 20,
  winnerReputation: 2,
  winnerCredibility: 4,
  /** Probabilité du label de l'année = réputation / ce diviseur. */
  labelOfYearDivisor: 250,
  labelOfYearReputation: 3,
  /** Un nommé dont l'ego dépasse ce seuil boude la cérémonie. */
  boycottEgo: 85,
} as const;
