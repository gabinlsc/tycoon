/** Streams d'une sortie (GDD, 5.6). Valeurs de départ à recaler par simulation. */
export const STREAMS = {
  /** Écoutes de la première semaine par fan. */
  listensPerFan: 3,
  /** Part de l'audience du genre qui découvre la sortie. */
  discoveryRate: 0.002,
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
  centsPerStream: 0.35,
  /** Bonus de marketing : 1 + k × log10(1 + budget/1000 €), plafonné. */
  marketingK: 0.5,
  marketingCap: 2,
} as const;
