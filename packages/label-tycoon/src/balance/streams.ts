/** Streams d'une sortie (GDD, 5.6). Valeurs de départ à recaler par simulation. */
export const STREAMS = {
  /** Écoutes de la première semaine par fan. */
  listensPerFan: 6,
  /**
   * Fans « actifs » : au-delà de ce seuil, l'engagement par fan s'érode (les très gros publics sont plus
   * occasionnels). Le nombre de fans pris en compte vaut seuil × (fans / seuil)^exposant.
   */
  fanKnee: 200_000,
  fanExponent: 0.75,
  /** Part de l'audience du genre qui découvre la sortie. */
  discoveryRate: 0.08,
  /** Exposant de la qualité dans le potentiel de hit : H = (Q/100)^exposant × … */
  qualityExponent: 1.5,
  /** λ = lambdaBase − lambdaQuality × Q/100. */
  lambdaBase: 0.35,
  lambdaQuality: 0.2,
  /** Traîne longue : part de S1 conservée chaque semaine après l'oubli. */
  tail: 0.02,
  /** Fenêtre active (semaines) : au-delà, seule la traîne est comptée, en forme fermée. */
  activeWindow: 26,
  /** Revenu brut par stream, en centimes d'euro (fractions arrondies sur le total de la semaine). */
  centsPerStream: 2,
  /** Bonus de marketing : 1 + k × log10(1 + budget/1000 €), plafonné. */
  marketingK: 0.5,
  marketingCap: 2,
} as const;

/** Viralité et conversion en fans (GDD, 5.6). */
export const VIRALITY = {
  /** Probabilité hebdomadaire de base, multipliée par H. */
  baseChance: 0.01,
  /** Multiplicateur de streams pendant un emballement. */
  multiplier: { min: 5, max: 20 },
  /** Durée d'un emballement en semaines. */
  weeks: { min: 3, max: 6 },
  /** Fans gagnés par stream, avant le facteur de charisme. */
  fanConversion: 0.002,
  /** Hype gagnée au déclenchement. */
  hypeBoost: 25,
} as const;
