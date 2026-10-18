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
  thresholds: { or: 20_000, platine: 40_000, diamant: 200_000 },
  albumFactor: 2,
  /** Facteur d'ère sur les seuils (1 = ère actuelle ; un disque d'or est plus facile en streaming de masse). */
  eraFactor: 1,
  /** Réputation gagnée à chaque niveau obtenu. */
  reputationGain: { or: 1, platine: 3, diamant: 8 },
} as const;
