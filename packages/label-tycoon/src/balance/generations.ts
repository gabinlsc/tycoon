/** Générations : retraite, légendes, relève et enfants d'artistes (GDD, 14.3). */
export const GENERATIONS = {
  /** Âge à partir duquel un artiste peut prendre sa retraite, probabilité annuelle de base et par année au-delà. */
  retirementAge: 55,
  retirementBase: 0.12,
  retirementPerYear: 0.08,
  retirementMax: 0.9,
  /** Les artistes en déclin partent plus tôt, ceux qui ont un statut culte plus tard. */
  declineFactor: 1.5,
  cultFactor: 0.5,
  /** Notoriété minimale pour devenir une légende utile au label. */
  legendNotoriety: 60,
  /** Un mentor légende transmet davantage qu'un mentor en activité. */
  legendMentorFactor: 2,
  /** Probabilité qu'un artiste célèbre qui prend sa retraite ait un enfant dans le métier. */
  childChance: 0.35,
  childMinNotoriety: 45,
  /** Part des compétences du parent transmise à l'enfant, et hype de départ liée au nom. */
  childSkillShare: 0.55,
  childHype: 15,
  /** Affinité avec le label du parent (s'il était chez le joueur) : la relève lui est acquise. */
  childAffinity: 40,
  childLoyalty: 70,
  /** Chaque légende d'un genre ajoute ce potentiel aux diplômés de l'académie (3 légendes au maximum comptent). */
  academyBonusPerLegend: 4,
  academyMaxLegends: 3,
  /** Réputation gagnée chaque année par légende (jury, partenaire d'académie). */
  reputationPerLegendYear: 0.3,
} as const;
