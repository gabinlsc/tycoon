/**
 * Carrière des artistes : progression, déclin, retour en grâce, statut culte (GDD, 5.2).
 * Valeurs de départ à recaler par simulation.
 */
export const PROGRESSION = {
  /** Fraction de l'écart au potentiel comblée chaque semaine, dans des conditions neutres. */
  baseRate: 0.006,
  /** Multiplicateur selon la phase de carrière : on progresse vite au début, plus au sommet. */
  phaseMultiplier: { emergent: 1.3, montee: 1.2, pic: 0.4, plateau: 0, declin: 0, culte: 0 },
  /** Niveau de producteur considéré comme neutre (aucun bonus, aucun malus). */
  neutralProducer: 50,
  /**
   * Courbe de charge de travail → efficacité de la progression : trop peu de travail, stagnation ;
   * volume optimal, plein effet ; trop de travail, la fatigue annule le gain.
   */
  workloadCurve: [
    [0, 0.1],
    [0.3, 0.3],
    [0.7, 1],
    [1.2, 1],
    [1.6, 0.35],
    [2, 0],
  ] as ReadonlyArray<readonly [number, number]>,
} as const;

export const DECLINE = {
  /** Points de compétence perdus par an au début du déclin ; augmente avec les années passées depuis le pic. */
  pointsPerYear: 2.2,
  /** Plafond du multiplicateur d'ancienneté du déclin. */
  maxSeniorityFactor: 2,
  /** Années de déclin pour atteindre ce plafond. */
  yearsToMax: 6,
  /** Un statut culte ralentit presque entièrement le déclin. */
  cultMultiplier: 0.15,
} as const;

export const COMEBACK = {
  /** Probabilité annuelle de retour en grâce pour un artiste en déclin (avant éthique). */
  yearlyChance: 0.1,
  hypeBoost: 30,
  moralBoost: 15,
  /** Nombre maximal de retours dans une carrière. */
  maxPerCareer: 2,
  /** Le nouveau pic se situe à l'âge actuel plus ce décalage. */
  newPeakShift: 2,
} as const;

export const CULT = {
  /** Probabilité annuelle de basculer en statut culte pour un artiste en déclin (avant crédibilité de rue). */
  yearlyChance: 0.15,
  /** Fanbase minimale pour devenir culte : il faut un noyau de fidèles. */
  minFanbase: 20_000,
} as const;
