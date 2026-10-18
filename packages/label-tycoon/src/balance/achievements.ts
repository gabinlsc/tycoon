import { type Cents, money } from '@tycoon/core';

/** Succès, objectifs dynamiques et records (GDD, 14.4). */
export type AchievementFamily =
  | 'signatures'
  | 'sorties'
  | 'concerts'
  | 'certifications'
  | 'prix'
  | 'nominations'
  | 'viral'
  | 'festivals'
  | 'debauchages'
  | 'evenements'
  | 'anciennete'
  | 'tresorerie'
  | 'valorisation'
  | 'palier'
  | 'credibilite'
  | 'classement'
  | 'equipe'
  | 'studio'
  | 'retours'
  | 'enchere';

/** Seuils par famille : un succès par seuil (60 au total). */
export const ACHIEVEMENT_THRESHOLDS: Readonly<Record<AchievementFamily, readonly number[]>> = {
  signatures: [1, 5, 10, 25, 50],
  sorties: [1, 10, 50, 200],
  concerts: [1, 10, 50, 200],
  certifications: [1, 5, 15, 30],
  prix: [1, 5, 10, 25],
  nominations: [1, 5, 20],
  viral: [1, 5, 20],
  festivals: [1, 5, 10],
  debauchages: [1, 5],
  evenements: [10, 50, 200],
  anciennete: [52, 260, 520],
  tresorerie: [money.euros(100_000), money.euros(1_000_000), money.euros(10_000_000)],
  valorisation: [money.euros(1_000_000), money.euros(10_000_000), money.euros(100_000_000)],
  palier: [1, 2, 3],
  credibilite: [50, 80],
  classement: [50, 10, 1],
  equipe: [5, 10],
  studio: [3, 5],
  retours: [1, 3],
  enchere: [1, 5],
};

export const OBJECTIVES = {
  /** Objectifs proposés en même temps. */
  active: 3,
  /** Récompense en trésorerie par type d'objectif. */
  rewards: {
    signer: money.euros(1500) as Cents,
    sortir: money.euros(1000) as Cents,
    concert: money.euros(800) as Cents,
    certification: money.euros(5000) as Cents,
    classement: money.euros(3000) as Cents,
    tresorerie: money.euros(2000) as Cents,
  },
  /** Réputation gagnée en plus de la récompense. */
  reputation: 1,
} as const;
