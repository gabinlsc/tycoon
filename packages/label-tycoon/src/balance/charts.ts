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
