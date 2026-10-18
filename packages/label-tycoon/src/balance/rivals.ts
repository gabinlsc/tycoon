import { type Cents, money } from '@tycoon/core';

/** Rivaux et enchères (GDD, 5.4 et 11). Valeurs de départ à recaler par simulation. */
export type RivalStyle = 'predateur' | 'prudent' | 'flambeur';

export const RIVALS = {
  count: { min: 3, max: 5 },
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
  /** Semaines de trésorerie négative après lesquelles un rival disparaît. */
  collapseWeeks: 12,
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

/** Personnalités des rivaux (GDD, 5.12). Chaque rival décide par utilitaire pondéré par ces traits. */
export type RivalPersonality = 'major' | 'pointu' | 'copieur' | 'predateur' | 'declin';

export interface PersonalityProfile {
  nom: string;
  /** Style d'enchère associé. */
  style: RivalStyle;
  /** Multiple de la trésorerie de départ. */
  cash: number;
  /** Poids des critères d'utilité : valeur sûre, talent précoce, tendance du moment, débauchage. */
  poids: { surete: number; precoce: number; tendance: number; debauchage: number };
}

export const PERSONALITIES: Readonly<Record<RivalPersonality, PersonalityProfile>> = {
  major: {
    nom: 'La major conservatrice',
    style: 'prudent',
    cash: 4,
    poids: { surete: 1, precoce: 0.1, tendance: 0.3, debauchage: 0.3 },
  },
  pointu: {
    nom: "L'indé pointu",
    style: 'prudent',
    cash: 0.8,
    poids: { surete: 0.2, precoce: 1, tendance: 0.2, debauchage: 0.1 },
  },
  copieur: {
    nom: 'Le copieur',
    style: 'flambeur',
    cash: 1.2,
    poids: { surete: 0.4, precoce: 0.2, tendance: 1, debauchage: 0.3 },
  },
  predateur: {
    nom: 'Le prédateur',
    style: 'predateur',
    cash: 1.5,
    poids: { surete: 0.5, precoce: 0.2, tendance: 0.4, debauchage: 1 },
  },
  declin: {
    nom: 'Le label en déclin',
    style: 'prudent',
    cash: 0.6,
    poids: { surete: 0.8, precoce: 0, tendance: 0, debauchage: 0 },
  },
};

export const PERSONALITY_IDS = ['major', 'pointu', 'copieur', 'predateur', 'declin'] as const;
