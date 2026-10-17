import { type Cents, money } from '@tycoon/core';
import type { TalentLevel } from './artists';

/** Repérage des talents (GDD, 5.3). Valeurs de départ à recaler par simulation. */

export type ScoutSource = 'open-mic' | 'plateforme' | 'battle' | 'candidature';

export interface SourceProfile {
  /** Coût d'une session de repérage. */
  cost: Cents;
  /** Talents découverts par session. */
  count: number;
  /** Demi-largeur initiale des fourchettes (points) : plus la source est floue, plus elle est large. */
  width: number;
  /** Poids des niveaux de talent que la source fait remonter. */
  levels: Readonly<Record<TalentLevel, number>>;
  /** Genres favorisés (ids), vide = tous. */
  genres: readonly string[];
}

export const SOURCES: Readonly<Record<ScoutSource, SourceProfile>> = {
  'open-mic': {
    cost: money.euros(150),
    count: 3,
    width: 32,
    levels: { amateur: 70, espoir: 25, confirme: 5, star: 0 },
    genres: [],
  },
  plateforme: {
    cost: money.euros(400),
    count: 4,
    width: 24,
    levels: { amateur: 45, espoir: 40, confirme: 14, star: 1 },
    genres: [],
  },
  battle: {
    cost: money.euros(300),
    count: 3,
    width: 26,
    levels: { amateur: 40, espoir: 45, confirme: 14, star: 1 },
    genres: ['rap', 'drill', 'trap', 'dancehall'],
  },
  candidature: {
    cost: money.euros(0),
    count: 2,
    width: 36,
    levels: { amateur: 80, espoir: 18, confirme: 2, star: 0 },
    genres: [],
  },
};

export const SCOUTS = {
  /** Frais de recrutement d'un dénicheur. */
  hireCost: money.euros(1500) as Cents,
  /** Salaire hebdomadaire d'un dénicheur. */
  weeklyWage: money.euros(120) as Cents,
  /** Nombre maximal de dénicheurs employés. */
  max: 4,
  /** Niveau (0-100) d'un dénicheur recruté : bornes du tirage. */
  levelMin: 15,
  levelMax: 75,
  /** Part des talents remontés qui appartiennent au genre fétiche du dénicheur. */
  biasShare: 0.6,
} as const;

/** Concurrence des rivaux sur les talents libres suivis (GDD, 5.3). */
export const RIVAL_SCOUTING = {
  /** Probabilité hebdomadaire de base qu'un rival signe un talent libre suivi (à agressivité 1). */
  weeklyBase: 0.004,
  /** Multiplicateur à notoriété maximale : les talents connus partent plus vite. */
  notorietyBoost: 6,
} as const;

export const SCOUTING = {
  /** Largeur minimale d'une fourchette, même après une longue observation. */
  minWidth: 3,
  /** Les attributs cachés (révélés par un essai en studio) sont plus flous. */
  hiddenWidthFactor: 1.5,
  /** Semaines d'observation pour diviser la largeur par deux (hors dénicheur). */
  halfLifeWeeks: 8,
  /** Gain de précision par niveau de dénicheur (par tranche de 25 points). */
  precisionPerScoutLevel25: 1,
  /** Le décalage fixe d'un talent ne dépasse jamais cette part de la largeur initiale : la vérité reste dans la fourchette. */
  maxOffsetShare: 0.8,
  /** Coût d'un essai en studio qui révèle les attributs cachés. */
  trialCost: money.euros(600) as Cents,
  /** Nombre maximal de talents suivis en même temps. */
  maxFollowed: 30,
} as const;
