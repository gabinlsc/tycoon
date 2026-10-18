import { type Cents, money } from '@tycoon/core';

/** Rivaux et enchères (GDD, 5.4 et 11). Valeurs de départ à recaler par simulation. */
export type RivalStyle = 'predateur' | 'prudent' | 'flambeur';

export const RIVALS = {
  count: 3,
  startCash: money.euros(60_000) as Cents,
  /** Probabilité qu'un rival participe à une enchère, par style (× agressivité). */
  interest: { predateur: 0.7, prudent: 0.4, flambeur: 0.55 } as Readonly<
    Record<RivalStyle, number>
  >,
  /** Multiple de l'avance « juste » proposé, par style. */
  advanceMultiple: { predateur: 1.1, prudent: 0.9, flambeur: 1.8 } as Readonly<
    Record<RivalStyle, number>
  >,
  /** Royalties offertes à l'artiste (points de base), par style. */
  royaltiesBps: { predateur: 5000, prudent: 4000, flambeur: 4500 } as Readonly<
    Record<RivalStyle, number>
  >,
  /** Part de sa trésorerie qu'un rival accepte de risquer sur une avance. */
  maxCashShare: 0.3,
  styles: ['predateur', 'prudent', 'flambeur'] as readonly RivalStyle[],
} as const;

/** Sorties des rivaux et concurrence de calendrier (GDD, 5.5). */
export const RIVAL_RELEASES = {
  /** Probabilité hebdomadaire qu'un rival planifie une sortie (× agressivité). */
  weeklyChance: 0.08,
  /** Délai de planification en semaines. */
  leadWeeks: { min: 2, max: 6 },
  /** Poids d'une sortie rivale (comme les types de sortie). */
  weights: [1, 3, 8, 2] as readonly number[],
  /** Probabilité qu'une sortie soit annoncée à l'avance. */
  announceChance: 0.5,
  /** À partir de ce poids, une sortie rivale est « grosse ». */
  bigWeight: 3,
  /** Facteur appliqué à l'exposition de la semaine 1 en cas de collision avec une grosse sortie. */
  collisionFactor: 0.5,
  /** Semaines pendant lesquelles on garde les sorties passées. */
  keepWeeks: 8,
} as const;
