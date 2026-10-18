/** Qualité d'un titre (GDD, 5.5). Valeurs de départ à recaler par simulation. */
export const QUALITY = {
  weights: {
    talent: 0.35,
    producteur: 0.2,
    adequation: 0.15,
    studio: 0.1,
    mixage: 0.1,
    featuring: 0.1,
  },
  /** Le moral module la qualité entre `moralBase` et `moralBase + moralRange`. */
  moralBase: 0.85,
  moralRange: 0.3,
  /** Écart-type du bruit gaussien (flux `production`). */
  noiseSd: 6,
  /** Adéquation d'un producteur : genre principal / secondaire / étranger. */
  fit: { principal: 100, secondaire: 70, etranger: 35 },
  /** Demi-largeur de la fourchette d'estimation avant sortie, selon la qualité de l'ingénieur du son et de l'A&R. */
  estimate: { base: 16, min: 3, engineerShare: 0.1, scoutShare: 0.06 },
} as const;
