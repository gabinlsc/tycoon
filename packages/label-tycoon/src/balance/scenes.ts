import { type Cents, money } from '@tycoon/core';

/** Scènes locales : chaque ville a un profil de genres et une chaleur qui évolue (GDD, 5.7). */
export const SCENES = {
  /** Coût d'une session de repérage dans une ville, et nombre de talents trouvés. */
  scoutCost: money.euros(900) as Cents,
  scoutCount: 3,
  /** Chaleur de départ : tirée entre ces bornes. */
  startHeat: { min: 20, max: 60 },
  /** Évolution hebdomadaire : bruit, retour vers 50, et poids de la popularité du genre dominant. */
  noise: 1.2,
  meanReversion: 0.02,
  genreInfluence: 0.02,
  /** Une scène « s'éveille » de temps à autre : probabilité hebdomadaire et coup de chaud. */
  awakenChance: 0.003,
  awakenBoost: 25,
  /** Lissage de la tendance (part du dernier écart retenue). */
  momentumSmoothing: 0.2,
  /** Une scène est émergente quand elle est chaude et qu'elle monte. */
  emergentHeat: 60,
  emergentMomentum: 0.3,
  /** Part des talents d'une session qui jouent le genre dominant, puis le genre secondaire. */
  dominantShare: 0.6,
  secondaryShare: 0.25,
  /** Potentiel gagné par point de chaleur (une scène à 100 donne +10), et poids du niveau des talents. */
  potentialPerHeat: 0.1,
  levelBoostPerHeat: 1,
} as const;
